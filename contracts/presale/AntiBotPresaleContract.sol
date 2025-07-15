// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * @title AntiBotPresaleContract
 * @dev Presale contract with anti-bot and anti-snipe protection
 */
contract AntiBotPresaleContract is ReentrancyGuard, Ownable, Pausable {
    using SafeERC20 for IERC20;
    using ECDSA for bytes32;

    struct SaleInfo {
        IERC20 token;
        uint256 tokenPrice; // tokens per 1 ETH/BNB/etc
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

    struct AntiBotInfo {
        uint256 protectionDelay; // seconds after startTime before public can buy
        uint256 maxGasPrice; // max gas price in wei
        uint256 walletCooldown; // seconds between purchases from same wallet
        bool signatureRequired; // whether signature verification is required
    }

    struct Participant {
        uint256 contribution;
        uint256 tokenAmount;
        uint256 claimedTokens;
        bool isWhitelisted;
        uint256 lastClaimTime;
        uint256 lastPurchaseTime; // for cooldown tracking
    }

    SaleInfo public saleInfo;
    VestingInfo public vestingInfo;
    AntiBotInfo public antiBotInfo;
    
    mapping(address => Participant) public participants;
    mapping(address => bool) public whitelist;
    mapping(bytes => bool) public usedSignatures;
    
    address public saleReceiver;
    address public refundWallet;
    address public signerAddress; // for signature verification
    
    uint256 public totalRaised;
    uint256 public totalParticipants;
    uint256 public totalTokensSold;
    
    bool public saleFinalized;
    bool public refundsEnabled;
    bool public isFairlaunch;
    
    event TokensPurchased(address indexed buyer, uint256 amount, uint256 tokenAmount);
    event TokensClaimed(address indexed buyer, uint256 amount);
    event SaleFinalized(uint256 totalRaised, uint256 totalTokensSold);
    event RefundClaimed(address indexed buyer, uint256 amount);
    event WhitelistUpdated(address indexed user, bool status);

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

    modifier antiBotProtection() {
        // Check if we're in the protected period
        if (block.timestamp < saleInfo.startTime + antiBotInfo.protectionDelay) {
            // During protection period, only whitelisted addresses can buy
            require(whitelist[msg.sender], "Protection active: only whitelist");
        }
        
        // Check gas price
        if (antiBotInfo.maxGasPrice > 0) {
            require(tx.gasprice <= antiBotInfo.maxGasPrice, "Gas price too high");
        }
        
        // Check wallet cooldown
        if (antiBotInfo.walletCooldown > 0) {
            require(
                participants[msg.sender].lastPurchaseTime == 0 || 
                block.timestamp >= participants[msg.sender].lastPurchaseTime + antiBotInfo.walletCooldown, 
                "Cooldown active"
            );
        }
        
        _;
    }

    constructor(
        SaleInfo memory _saleInfo,
        VestingInfo memory _vestingInfo,
        AntiBotInfo memory _antiBotInfo,
        address _saleReceiver,
        address _refundWallet,
        address _signerAddress,
        bool _isFairlaunch
    ) {
        saleInfo = _saleInfo;
        vestingInfo = _vestingInfo;
        antiBotInfo = _antiBotInfo;
        saleReceiver = _saleReceiver;
        refundWallet = _refundWallet;
        signerAddress = _signerAddress;
        isFairlaunch = _isFairlaunch;
    }

    /**
     * @dev Purchase tokens during the sale
     * @param signature Optional signature for verification (if enabled)
     */
    function buyTokens(bytes memory signature) external payable nonReentrant whenNotPaused saleActive onlyWhitelisted antiBotProtection {
        // Verify signature if required
        if (antiBotInfo.signatureRequired) {
            require(signature.length > 0, "Signature required");
            require(!usedSignatures[signature], "Signature already used");
            
            // Verify signature
            bytes32 messageHash = keccak256(abi.encodePacked(msg.sender, address(this)));
            bytes32 ethSignedMessageHash = messageHash.toEthSignedMessageHash();
            address signer = ethSignedMessageHash.recover(signature);
            
            require(signer == signerAddress, "Invalid signature");
            
            // Mark signature as used
            usedSignatures[signature] = true;
        }
        
        require(msg.value >= saleInfo.minPurchase, "Below minimum purchase");
        require(msg.value <= saleInfo.maxPurchase, "Above maximum purchase");
        
        // For standard presale, check hard cap
        if (!isFairlaunch) {
            require(totalRaised + msg.value <= saleInfo.hardCap, "Hard cap exceeded");
        }

        Participant storage participant = participants[msg.sender];
        require(participant.contribution + msg.value <= saleInfo.maxPurchase, "Max purchase per wallet exceeded");

        uint256 tokenAmount;
        
        if (isFairlaunch) {
            // In fairlaunch, we don't calculate tokens yet, just track contribution
            tokenAmount = 0; // Will be calculated at finalization
        } else {
            // Standard presale with fixed token price
            tokenAmount = msg.value * saleInfo.tokenPrice;
        }
        
        if (participant.contribution == 0) {
            totalParticipants++;
        }
        
        participant.contribution += msg.value;
        participant.tokenAmount += tokenAmount;
        participant.lastPurchaseTime = block.timestamp;
        
        totalRaised += msg.value;
        totalTokensSold += tokenAmount;

        // Transfer funds to sale receiver
        payable(saleReceiver).transfer(msg.value);

        emit TokensPurchased(msg.sender, msg.value, tokenAmount);
    }

    /**
     * @dev Claim purchased tokens (with vesting if enabled)
     */
    function claimTokens() external nonReentrant saleEnded {
        require(totalRaised >= saleInfo.softCap, "Soft cap not reached");
        require(saleFinalized, "Sale not finalized yet");
        
        Participant storage participant = participants[msg.sender];
        require(participant.contribution > 0, "No contribution");

        uint256 claimableAmount = getClaimableAmount(msg.sender);
        require(claimableAmount > 0, "No tokens available for claim");

        participant.claimedTokens += claimableAmount;
        participant.lastClaimTime = block.timestamp;

        saleInfo.token.safeTransfer(msg.sender, claimableAmount);

        emit TokensClaimed(msg.sender, claimableAmount);
    }

    /**
     * @dev Get claimable token amount for a participant
     */
    function getClaimableAmount(address participant) public view returns (uint256) {
        Participant memory p = participants[participant];
        
        if (p.contribution == 0) return 0;
        if (totalRaised < saleInfo.softCap) return 0;
        if (!saleFinalized) return 0;
        
        uint256 tokenAmount = p.tokenAmount;
        
        // For fairlaunch, calculate token amount based on contribution percentage
        if (isFairlaunch && totalRaised > 0) {
            uint256 totalTokensForSale = saleInfo.token.balanceOf(address(this)) + totalTokensSold;
            tokenAmount = (p.contribution * totalTokensForSale) / totalRaised;
        }
        
        if (!vestingInfo.enabled) return tokenAmount - p.claimedTokens;

        uint256 initialAmount = (tokenAmount * vestingInfo.initialRelease) / 100;
        uint256 vestedAmount = tokenAmount - initialAmount;
        
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

        payable(msg.sender).transfer(refundAmount);

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
        } else if (isFairlaunch) {
            // For fairlaunch, calculate token distribution now
            uint256 totalTokensForSale = saleInfo.token.balanceOf(address(this));
            totalTokensSold = totalTokensForSale;
        }

        emit SaleFinalized(totalRaised, totalTokensSold);
    }

    /**
     * @dev Update whitelist status for multiple addresses
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
     * @dev Update anti-bot protection parameters (owner only)
     */
    function updateAntiBotProtection(
        uint256 protectionDelay,
        uint256 maxGasPrice,
        uint256 walletCooldown,
        bool signatureRequired
    ) external onlyOwner {
        antiBotInfo.protectionDelay = protectionDelay;
        antiBotInfo.maxGasPrice = maxGasPrice;
        antiBotInfo.walletCooldown = walletCooldown;
        antiBotInfo.signatureRequired = signatureRequired;
    }

    /**
     * @dev Update signer address for signature verification (owner only)
     */
    function updateSignerAddress(address newSigner) external onlyOwner {
        require(newSigner != address(0), "Invalid signer address");
        signerAddress = newSigner;
    }

    /**
     * @dev Emergency withdraw tokens (owner only)
     */
    function emergencyWithdraw(IERC20 token, uint256 amount) external onlyOwner {
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
        bool _isProtectionActive,
        uint256 _protectionRemainingTime
    ) {
        _totalRaised = totalRaised;
        _totalParticipants = totalParticipants;
        _totalTokensSold = totalTokensSold;
        _softCapReached = totalRaised >= saleInfo.softCap;
        _hardCapReached = !isFairlaunch && totalRaised >= saleInfo.hardCap;
        
        if (block.timestamp >= saleInfo.endTime) {
            _timeRemaining = 0;
        } else {
            _timeRemaining = saleInfo.endTime - block.timestamp;
        }
        
        _isProtectionActive = block.timestamp < saleInfo.startTime + antiBotInfo.protectionDelay;
        
        if (_isProtectionActive) {
            _protectionRemainingTime = (saleInfo.startTime + antiBotInfo.protectionDelay) - block.timestamp;
        } else {
            _protectionRemainingTime = 0;
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
        uint256 cooldownEndTime
    ) {
        Participant memory p = participants[participant];
        
        uint256 calculatedTokenAmount = p.tokenAmount;
        if (isFairlaunch && saleFinalized && totalRaised > 0) {
            uint256 totalTokensForSale = saleInfo.token.balanceOf(address(this)) + totalTokensSold;
            calculatedTokenAmount = (p.contribution * totalTokensForSale) / totalRaised;
        }
        
        uint256 cooldownEnd = 0;
        if (p.lastPurchaseTime > 0 && antiBotInfo.walletCooldown > 0) {
            cooldownEnd = p.lastPurchaseTime + antiBotInfo.walletCooldown;
            if (cooldownEnd < block.timestamp) {
                cooldownEnd = 0;
            }
        }
        
        return (
            p.contribution,
            calculatedTokenAmount,
            p.claimedTokens,
            getClaimableAmount(participant),
            p.isWhitelisted || whitelist[participant],
            cooldownEnd
        );
    }

    /**
     * @dev Get remaining delay before public can participate
     */
    function getRemainingDelay() external view returns (uint256) {
        if (block.timestamp < saleInfo.startTime) {
            return saleInfo.startTime - block.timestamp + antiBotInfo.protectionDelay;
        } else if (block.timestamp < saleInfo.startTime + antiBotInfo.protectionDelay) {
            return (saleInfo.startTime + antiBotInfo.protectionDelay) - block.timestamp;
        } else {
            return 0;
        }
    }

    /**
     * @dev Check if a wallet is in cooldown period
     */
    function isInCooldown(address wallet) external view returns (bool, uint256) {
        if (antiBotInfo.walletCooldown == 0) return (false, 0);
        
        Participant memory p = participants[wallet];
        if (p.lastPurchaseTime == 0) return (false, 0);
        
        uint256 cooldownEnd = p.lastPurchaseTime + antiBotInfo.walletCooldown;
        if (block.timestamp >= cooldownEnd) return (false, 0);
        
        return (true, cooldownEnd - block.timestamp);
    }
}