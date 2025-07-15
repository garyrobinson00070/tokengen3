// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title PresaleContractV2
 * @dev Enhanced presale contract with auto-listing, referrals, and emergency withdraw
 */
contract PresaleContractV2 is ReentrancyGuard, Ownable, Pausable {
    using SafeERC20 for IERC20;

    struct SaleInfo {
        IERC20 token;
        IERC20 baseToken;       // USDT, USDC, etc.
        uint256 tokenPrice;     // tokens per 1 base token
        uint256 softCap;
        uint256 hardCap;
        uint256 minPurchase;
        uint256 maxPurchase;
        uint256 startTime;
        uint256 endTime;
        bool whitelistEnabled;
    }

    struct VestingInfo {
        bool enabled;
        uint256 initialRelease; // percentage (0-100)
        uint256 vestingDuration; // in seconds
    }

    struct AutoListingInfo {
        bool enabled;
        uint256 listingPrice;   // tokens per 1 base token
        uint256 lpTokenPercentage; // percentage of tokens for LP (0-100)
        uint256 lpBaseTokenPercentage; // percentage of base tokens for LP (0-100)
        uint256 lockDuration;   // in seconds
    }

    struct Participant {
        uint256 contribution;
        uint256 tokenAmount;
        uint256 claimedTokens;
        bool isWhitelisted;
        uint256 lastClaimTime;
        address referrer;
    }

    SaleInfo public saleInfo;
    VestingInfo public vestingInfo;
    AutoListingInfo public autoListingInfo;
    
    mapping(address => Participant) public participants;
    mapping(address => bool) public whitelist;
    
    address public saleReceiver;
    address public refundWallet;
    address public referralTracker;
    
    uint256 public totalRaised;
    uint256 public totalParticipants;
    uint256 public totalTokensSold;
    
    bool public saleFinalized;
    bool public refundsEnabled;
    bool public autoListed;
    
    // LP token address after auto-listing
    address public lpTokenAddress;
    
    // Emergency withdraw penalty rate (10%)
    uint256 public penaltyRate = 100; // 100 = 10%
    
    // Total penalties collected
    uint256 public totalPenalties;
    
    // Featured flag (can be set by admin)
    bool public featured;

    event TokensPurchased(address indexed buyer, uint256 amount, uint256 tokenAmount, address referrer);
    event TokensClaimed(address indexed buyer, uint256 amount);
    event SaleFinalized(uint256 totalRaised, uint256 totalTokensSold);
    event RefundClaimed(address indexed buyer, uint256 amount);
    event WhitelistUpdated(address indexed user, bool status);
    event EmergencyWithdraw(address indexed user, uint256 contribution, uint256 penalty);
    event AutoListed(address indexed token, address indexed baseToken, address indexed lpToken, uint256 tokenAmount, uint256 baseTokenAmount);
    event FeaturedStatusUpdated(bool status);

    modifier onlyWhitelisted() {
        if (saleInfo.whitelistEnabled) {
            require(whitelist[msg.sender], "Not whitelisted");
        }
        _;
    }

    modifier saleActive() {
        require(block.timestamp >= saleInfo.startTime, "Sale not started");
        require(block.timestamp <= saleInfo.endTime, "Sale ended");
        require(!saleFinalized, "Sale finalized");
        _;
    }

    modifier saleEnded() {
        require(block.timestamp > saleInfo.endTime || saleFinalized, "Sale still active");
        _;
    }

    constructor(
        SaleInfo memory _saleInfo,
        VestingInfo memory _vestingInfo,
        AutoListingInfo memory _autoListingInfo,
        address _saleReceiver,
        address _refundWallet,
        address _referralTracker
    ) {
        saleInfo = _saleInfo;
        vestingInfo = _vestingInfo;
        autoListingInfo = _autoListingInfo;
        saleReceiver = _saleReceiver;
        refundWallet = _refundWallet;
        referralTracker = _referralTracker;
    }

    /**
     * @dev Purchase tokens during the sale
     * @param referrer Address of the referrer (optional)
     */
    function buyTokens(address referrer) external payable nonReentrant whenNotPaused saleActive onlyWhitelisted {
        require(msg.value == 0, "Use baseToken instead of native token");
        
        Participant storage participant = participants[msg.sender];
        
        // Get contribution amount from baseToken
        uint256 allowance = saleInfo.baseToken.allowance(msg.sender, address(this));
        require(allowance > 0, "No baseToken allowance");
        
        uint256 contribution = allowance;
        require(contribution >= saleInfo.minPurchase, "Below minimum purchase");
        require(contribution <= saleInfo.maxPurchase, "Above maximum purchase");
        require(totalRaised + contribution <= saleInfo.hardCap, "Hard cap exceeded");
        require(participant.contribution + contribution <= saleInfo.maxPurchase, "Max purchase per wallet exceeded");
        
        // Calculate token amount
        uint256 tokenAmount = contribution * saleInfo.tokenPrice;
        
        // Transfer base tokens from buyer to this contract
        saleInfo.baseToken.safeTransferFrom(msg.sender, address(this), contribution);
        
        // Update participant info
        if (participant.contribution == 0) {
            totalParticipants++;
            
            // Set referrer if provided and valid
            if (referrer != address(0) && referrer != msg.sender && participant.referrer == address(0)) {
                participant.referrer = referrer;
                
                // Register referral in tracker if available
                if (referralTracker != address(0)) {
                    (bool success, ) = referralTracker.call(
                        abi.encodeWithSignature("addReferral(address,address)", referrer, msg.sender)
                    );
                    // Ignore failure, referral is optional
                }
            }
        }
        
        participant.contribution += contribution;
        participant.tokenAmount += tokenAmount;
        
        // Update sale info
        totalRaised += contribution;
        totalTokensSold += tokenAmount;
        
        // Record purchase in referral tracker if available
        if (referralTracker != address(0) && participant.referrer != address(0)) {
            (bool success, ) = referralTracker.call(
                abi.encodeWithSignature("recordPurchase(address,uint256)", msg.sender, contribution)
            );
            // Ignore failure, referral tracking is optional
        }
        
        emit TokensPurchased(msg.sender, contribution, tokenAmount, participant.referrer);
    }

    /**
     * @dev Claim purchased tokens (with vesting if enabled)
     */
    function claimTokens() external nonReentrant saleEnded {
        require(totalRaised >= saleInfo.softCap, "Soft cap not reached");
        
        Participant storage participant = participants[msg.sender];
        require(participant.tokenAmount > 0, "No tokens to claim");

        uint256 claimableAmount = getClaimableAmount(msg.sender);
        require(claimableAmount > 0, "No tokens available for claim");

        participant.claimedTokens += claimableAmount;
        participant.lastClaimTime = block.timestamp;

        saleInfo.token.safeTransfer(msg.sender, claimableAmount);

        emit TokensClaimed(msg.sender, claimableAmount);
    }

    /**
     * @dev Emergency withdraw with penalty
     */
    function emergencyWithdraw() external nonReentrant saleActive {
        Participant storage participant = participants[msg.sender];
        require(participant.contribution > 0, "No contribution to withdraw");
        
        uint256 contribution = participant.contribution;
        uint256 penalty = (contribution * penaltyRate) / 1000;
        uint256 refundAmount = contribution - penalty;
        
        // Update participant info
        participant.contribution = 0;
        participant.tokenAmount = 0;
        
        // Update sale info
        totalRaised -= contribution;
        totalTokensSold -= participant.tokenAmount;
        totalPenalties += penalty;
        
        if (totalParticipants > 0) {
            totalParticipants--;
        }
        
        // Transfer refund amount to user
        saleInfo.baseToken.safeTransfer(msg.sender, refundAmount);
        
        emit EmergencyWithdraw(msg.sender, contribution, penalty);
    }

    /**
     * @dev Get claimable token amount for a participant
     * @param participant Address of the participant
     */
    function getClaimableAmount(address participant) public view returns (uint256) {
        Participant memory p = participants[participant];
        
        if (p.tokenAmount == 0) return 0;
        if (totalRaised < saleInfo.softCap) return 0;
        if (!vestingInfo.enabled) return p.tokenAmount - p.claimedTokens;

        uint256 initialAmount = (p.tokenAmount * vestingInfo.initialRelease) / 100;
        uint256 vestedAmount = p.tokenAmount - initialAmount;
        
        if (block.timestamp <= saleInfo.endTime) {
            return initialAmount - p.claimedTokens;
        }

        uint256 timeSinceEnd = block.timestamp - saleInfo.endTime;
        uint256 vestedTokens = (vestedAmount * timeSinceEnd) / vestingInfo.vestingDuration;
        
        if (vestedTokens > vestedAmount) {
            vestedTokens = vestedAmount;
        }

        return (initialAmount + vestedTokens) - p.claimedTokens;
    }

    /**
     * @dev Claim refund if soft cap not reached
     */
    function claimRefund() external nonReentrant saleEnded {
        require(totalRaised < saleInfo.softCap, "Soft cap reached, no refunds");
        require(refundsEnabled, "Refunds not enabled");
        
        Participant storage participant = participants[msg.sender];
        require(participant.contribution > 0, "No contribution to refund");

        uint256 refundAmount = participant.contribution;
        participant.contribution = 0;
        participant.tokenAmount = 0;

        saleInfo.baseToken.safeTransfer(msg.sender, refundAmount);

        emit RefundClaimed(msg.sender, refundAmount);
    }

    /**
     * @dev Finalize the sale (owner only)
     */
    function finalizeSale() external onlyOwner {
        require(!saleFinalized, "Already finalized");
        
        saleFinalized = true;
        
        if (totalRaised < saleInfo.softCap) {
            refundsEnabled = true;
        } else {
            // If soft cap reached, transfer raised funds to sale receiver
            uint256 transferAmount = totalRaised;
            
            // If auto-listing is enabled, reserve some funds for liquidity
            if (autoListingInfo.enabled && !autoListed) {
                uint256 listingAmount = (totalRaised * autoListingInfo.lpBaseTokenPercentage) / 100;
                transferAmount -= listingAmount;
            }
            
            // Transfer penalties to sale receiver
            transferAmount += totalPenalties;
            
            // Transfer funds to sale receiver
            saleInfo.baseToken.safeTransfer(saleReceiver, transferAmount);
        }

        emit SaleFinalized(totalRaised, totalTokensSold);
    }

    /**
     * @dev Auto-list token on DEX (owner only)
     * @param router DEX router address
     */
    function autoListToken(address router) external onlyOwner nonReentrant {
        require(saleFinalized, "Sale not finalized");
        require(totalRaised >= saleInfo.softCap, "Soft cap not reached");
        require(autoListingInfo.enabled, "Auto-listing not enabled");
        require(!autoListed, "Already auto-listed");
        
        // Calculate token and base token amounts for liquidity
        uint256 baseTokenAmount = (totalRaised * autoListingInfo.lpBaseTokenPercentage) / 100;
        uint256 tokenAmount = (baseTokenAmount * autoListingInfo.listingPrice);
        
        // Ensure we have enough tokens
        require(saleInfo.token.balanceOf(address(this)) >= tokenAmount, "Not enough tokens for listing");
        
        // Approve router to spend tokens
        saleInfo.token.safeApprove(router, tokenAmount);
        saleInfo.baseToken.safeApprove(router, baseTokenAmount);
        
        // Call router to add liquidity
        // This is a simplified version - in production, you'd use the actual router interface
        (bool success, bytes memory result) = router.call(
            abi.encodeWithSignature(
                "addLiquidity(address,address,uint256,uint256,uint256,uint256,address,uint256)",
                address(saleInfo.token),
                address(saleInfo.baseToken),
                tokenAmount,
                baseTokenAmount,
                0, // Accept any amount
                0, // Accept any amount
                owner(), // LP tokens go to owner
                block.timestamp + 300 // 5 minute deadline
            )
        );
        
        require(success, "Auto-listing failed");
        
        // Parse LP token address from result
        // This is a simplified version - in production, you'd parse the actual return value
        lpTokenAddress = address(bytes20(result));
        
        autoListed = true;
        
        emit AutoListed(
            address(saleInfo.token),
            address(saleInfo.baseToken),
            lpTokenAddress,
            tokenAmount,
            baseTokenAmount
        );
    }

    /**
     * @dev Update whitelist status for multiple addresses
     * @param addresses Array of addresses
     * @param status Whitelist status
     */
    function updateWhitelist(address[] calldata addresses, bool status) external onlyOwner {
        for (uint256 i = 0; i < addresses.length; i++) {
            whitelist[addresses[i]] = status;
            if (status && participants[addresses[i]].contribution > 0) {
                participants[addresses[i]].isWhitelisted = true;
            }
            emit WhitelistUpdated(addresses[i], status);
        }
    }

    /**
     * @dev Update featured status (owner only)
     * @param status New featured status
     */
    function updateFeaturedStatus(bool status) external onlyOwner {
        featured = status;
        emit FeaturedStatusUpdated(status);
    }

    /**
     * @dev Update penalty rate (owner only)
     * @param newRate New penalty rate (in 0.1% increments, e.g., 100 = 10%)
     */
    function updatePenaltyRate(uint256 newRate) external onlyOwner {
        require(newRate <= 300, "Rate too high"); // Max 30%
        penaltyRate = newRate;
    }

    /**
     * @dev Withdraw penalties (owner only)
     */
    function withdrawPenalties() external onlyOwner {
        require(totalPenalties > 0, "No penalties to withdraw");
        
        uint256 amount = totalPenalties;
        totalPenalties = 0;
        
        saleInfo.baseToken.safeTransfer(saleReceiver, amount);
    }

    /**
     * @dev Emergency withdraw tokens (owner only)
     */
    function emergencyWithdrawTokens(IERC20 token, uint256 amount) external onlyOwner {
        token.safeTransfer(owner(), amount);
    }

    /**
     * @dev Pause/unpause the contract
     */
    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Get sale statistics
     */
    function getSaleStats() external view returns (
        uint256 _totalRaised,
        uint256 _totalParticipants,
        uint256 _totalTokensSold,
        bool _softCapReached,
        bool _hardCapReached,
        uint256 _timeRemaining,
        bool _featured
    ) {
        _totalRaised = totalRaised;
        _totalParticipants = totalParticipants;
        _totalTokensSold = totalTokensSold;
        _softCapReached = totalRaised >= saleInfo.softCap;
        _hardCapReached = totalRaised >= saleInfo.hardCap;
        _featured = featured;
        
        if (block.timestamp >= saleInfo.endTime) {
            _timeRemaining = 0;
        } else {
            _timeRemaining = saleInfo.endTime - block.timestamp;
        }
    }

    /**
     * @dev Get participant information
     */
    function getParticipantInfo(address participant) external view returns (
        uint256 contribution,
        uint256 tokenAmount,
        uint256 claimedTokens,
        uint256 claimableTokens,
        bool isWhitelisted,
        address referrer
    ) {
        Participant memory p = participants[participant];
        return (
            p.contribution,
            p.tokenAmount,
            p.claimedTokens,
            getClaimableAmount(participant),
            p.isWhitelisted || whitelist[participant],
            p.referrer
        );
    }

    /**
     * @dev Get auto-listing info
     */
    function getAutoListingInfo() external view returns (
        bool enabled,
        uint256 listingPrice,
        uint256 lpTokenPercentage,
        uint256 lpBaseTokenPercentage,
        uint256 lockDuration,
        bool listed,
        address lpToken
    ) {
        return (
            autoListingInfo.enabled,
            autoListingInfo.listingPrice,
            autoListingInfo.lpTokenPercentage,
            autoListingInfo.lpBaseTokenPercentage,
            autoListingInfo.lockDuration,
            autoListed,
            lpTokenAddress
        );
    }
}