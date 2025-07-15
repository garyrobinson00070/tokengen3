// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title MultiSender
 * @dev Contract for sending tokens to multiple addresses in a single transaction
 */
contract MultiSender is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct AirdropInfo {
        address token;
        address sender;
        uint256 totalAmount;
        uint256 recipientCount;
        uint256 timestamp;
    }

    // Airdrop counter
    uint256 public airdropCount;
    
    // Mapping from airdrop ID to airdrop info
    mapping(uint256 => AirdropInfo) public airdrops;
    
    // Platform fee (0.1%)
    uint256 public platformFee = 1; // 1 = 0.1%
    
    // Fee recipient
    address public feeRecipient;
    
    // Maximum batch size to prevent out-of-gas errors
    uint256 public maxBatchSize = 200;

    event TokensAirdropped(
        uint256 indexed airdropId,
        address indexed token,
        address indexed sender,
        uint256 totalAmount,
        uint256 recipientCount
    );
    
    event FeeUpdated(uint256 newFee);
    event FeeRecipientUpdated(address newRecipient);
    event MaxBatchSizeUpdated(uint256 newSize);

    constructor(address _feeRecipient) {
        feeRecipient = _feeRecipient;
    }

    /**
     * @dev Send tokens to multiple recipients
     * @param token Token address
     * @param recipients Array of recipient addresses
     * @param amounts Array of amounts to send
     */
    function multiSend(
        address token,
        address[] calldata recipients,
        uint256[] calldata amounts
    ) external nonReentrant returns (uint256) {
        require(token != address(0), "Invalid token address");
        require(recipients.length > 0, "No recipients");
        require(recipients.length == amounts.length, "Arrays length mismatch");
        require(recipients.length <= maxBatchSize, "Batch too large");
        
        uint256 totalAmount = 0;
        
        // Calculate total amount
        for (uint256 i = 0; i < amounts.length; i++) {
            totalAmount += amounts[i];
        }
        
        require(totalAmount > 0, "Total amount must be > 0");
        
        // Calculate fee
        uint256 fee = (totalAmount * platformFee) / 1000;
        uint256 totalWithFee = totalAmount + fee;
        
        // Transfer tokens from sender to this contract
        IERC20(token).safeTransferFrom(msg.sender, address(this), totalWithFee);
        
        // Transfer fee to fee recipient if fee > 0
        if (fee > 0) {
            IERC20(token).safeTransfer(feeRecipient, fee);
        }
        
        // Send tokens to recipients
        for (uint256 i = 0; i < recipients.length; i++) {
            if (recipients[i] != address(0) && amounts[i] > 0) {
                IERC20(token).safeTransfer(recipients[i], amounts[i]);
            }
        }
        
        // Create airdrop record
        uint256 airdropId = airdropCount++;
        airdrops[airdropId] = AirdropInfo({
            token: token,
            sender: msg.sender,
            totalAmount: totalAmount,
            recipientCount: recipients.length,
            timestamp: block.timestamp
        });
        
        emit TokensAirdropped(airdropId, token, msg.sender, totalAmount, recipients.length);
        
        return airdropId;
    }

    /**
     * @dev Get airdrop info
     * @param airdropId ID of the airdrop
     */
    function getAirdropInfo(uint256 airdropId) external view returns (
        address token,
        address sender,
        uint256 totalAmount,
        uint256 recipientCount,
        uint256 timestamp
    ) {
        AirdropInfo storage info = airdrops[airdropId];
        return (
            info.token,
            info.sender,
            info.totalAmount,
            info.recipientCount,
            info.timestamp
        );
    }

    /**
     * @dev Estimate gas usage for multi-send
     * @param recipientCount Number of recipients
     */
    function estimateGas(uint256 recipientCount) external pure returns (uint256) {
        // Base gas cost + per-recipient cost
        return 100000 + (recipientCount * 30000);
    }

    /**
     * @dev Update platform fee (owner only)
     * @param newFee New fee (in 0.1% increments, e.g., 1 = 0.1%)
     */
    function updateFee(uint256 newFee) external onlyOwner {
        require(newFee <= 50, "Fee too high"); // Max 5%
        platformFee = newFee;
        emit FeeUpdated(newFee);
    }

    /**
     * @dev Update fee recipient (owner only)
     * @param newRecipient New fee recipient address
     */
    function updateFeeRecipient(address newRecipient) external onlyOwner {
        require(newRecipient != address(0), "Invalid recipient");
        feeRecipient = newRecipient;
        emit FeeRecipientUpdated(newRecipient);
    }

    /**
     * @dev Update maximum batch size (owner only)
     * @param newSize New maximum batch size
     */
    function updateMaxBatchSize(uint256 newSize) external onlyOwner {
        require(newSize > 0 && newSize <= 500, "Invalid batch size");
        maxBatchSize = newSize;
        emit MaxBatchSizeUpdated(newSize);
    }

    /**
     * @dev Emergency function to rescue tokens accidentally sent to this contract (owner only)
     * @param token Token address
     * @param amount Amount to rescue
     */
    function rescueTokens(address token, uint256 amount) external onlyOwner {
        IERC20(token).safeTransfer(owner(), amount);
    }
}