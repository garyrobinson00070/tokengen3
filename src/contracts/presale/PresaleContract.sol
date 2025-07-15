// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title PresaleContract
 * @dev A comprehensive presale contract with vesting, whitelist, and refund capabilities
 */
contract PresaleContract is ReentrancyGuard, Ownable, Pausable {
    using SafeERC20 for IERC20;

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

    struct Participant {
        uint256 contribution;
        uint256 tokenAmount;
        uint256 claimedTokens;
        bool isWhitelisted;
        uint256 lastClaimTime;
    }

    SaleInfo public saleInfo;
    VestingInfo public vestingInfo;
    
    mapping(address => Participant) public participants;
    mapping(address => bool) public whitelist;
    
    address public saleReceiver;
    address public refundWallet;
    
    uint256 public totalRaised;
    uint256 public totalParticipants;
    uint256 public totalTokensSold;
    
    bool public saleFinalized;
    bool public refundsEnabled;
    
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

    constructor(
        SaleInfo memory _saleInfo,
        VestingInfo memory _vestingInfo,
        address _saleReceiver,
        address _refundWallet
    ) {
        saleInfo = _saleInfo;
        vestingInfo = _vestingInfo;
        saleReceiver = _saleReceiver;
        refundWallet = _refundWallet;
    }

    /**
     * @dev Purchase tokens during the sale
     */
    function buyTokens() external payable nonReentrant whenNotPaused saleActive onlyWhitelisted {
        require(msg.value >= saleInfo.minPurchase, "Below minimum purchase");
        require(msg.value <= saleInfo.maxPurchase, "Above maximum purchase");
        require(totalRaised + msg.value <= saleInfo.hardCap, "Hard cap exceeded");

        Participant storage participant = participants[msg.sender];
        require(participant.contribution + msg.value <= saleInfo.maxPurchase, "Max purchase per wallet exceeded");

        uint256 tokenAmount = msg.value * saleInfo.tokenPrice;
        
        if (participant.contribution == 0) {
            totalParticipants++;
        }
        
        participant.contribution += msg.value;
        participant.tokenAmount += tokenAmount;
        
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
     * @dev Get claimable token amount for a participant
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
        uint256 _timeRemaining
    ) {
        _totalRaised = totalRaised;
        _totalParticipants = totalParticipants;
        _totalTokensSold = totalTokensSold;
        _softCapReached = totalRaised >= saleInfo.softCap;
        _hardCapReached = totalRaised >= saleInfo.hardCap;
        
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
        bool isWhitelisted
    ) {
        Participant memory p = participants[participant];
        return (
            p.contribution,
            p.tokenAmount,
            p.claimedTokens,
            getClaimableAmount(participant),
            p.isWhitelisted || whitelist[participant]
        );
    }
}