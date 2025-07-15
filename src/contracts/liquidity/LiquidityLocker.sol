// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title LiquidityLocker
 * @dev Contract for locking liquidity provider (LP) tokens for a specified duration
 */
contract LiquidityLocker is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct LockInfo {
        address token;        // LP token address
        address owner;        // Owner who can withdraw after unlock time
        uint256 amount;       // Amount of LP tokens locked
        uint256 lockTime;     // When the tokens were locked
        uint256 unlockTime;   // When the tokens can be withdrawn
        bool withdrawn;       // Whether the tokens have been withdrawn
    }

    // Mapping from lock ID to lock info
    mapping(uint256 => LockInfo) public locks;
    
    // Mapping from owner to their lock IDs
    mapping(address => uint256[]) public userLocks;
    
    // Total number of locks created
    uint256 public lockCount;
    
    // Minimum lock duration (1 day)
    uint256 public constant MIN_LOCK_DURATION = 1 days;
    
    // Maximum lock duration (10 years)
    uint256 public constant MAX_LOCK_DURATION = 3650 days;
    
    // Platform fee (0.1%)
    uint256 public platformFee = 1; // 1 = 0.1%
    
    // Fee recipient
    address public feeRecipient;

    event LiquidityLocked(
        uint256 indexed lockId,
        address indexed token,
        address indexed owner,
        uint256 amount,
        uint256 unlockTime
    );
    
    event LiquidityWithdrawn(
        uint256 indexed lockId,
        address indexed token,
        address indexed owner,
        uint256 amount
    );
    
    event LockExtended(
        uint256 indexed lockId,
        uint256 newUnlockTime
    );
    
    event FeeUpdated(uint256 newFee);
    event FeeRecipientUpdated(address newRecipient);

    constructor(address _feeRecipient) {
        feeRecipient = _feeRecipient;
    }

    /**
     * @dev Lock LP tokens for a specified duration
     * @param token LP token address
     * @param amount Amount of LP tokens to lock
     * @param duration Lock duration in seconds
     */
    function lockLiquidity(
        address token,
        uint256 amount,
        uint256 duration
    ) external nonReentrant returns (uint256) {
        require(token != address(0), "Invalid token address");
        require(amount > 0, "Amount must be greater than 0");
        require(duration >= MIN_LOCK_DURATION, "Duration too short");
        require(duration <= MAX_LOCK_DURATION, "Duration too long");
        
        // Calculate unlock time
        uint256 unlockTime = block.timestamp + duration;
        
        // Calculate fee
        uint256 fee = (amount * platformFee) / 1000;
        uint256 amountAfterFee = amount - fee;
        
        // Create lock
        uint256 lockId = lockCount++;
        locks[lockId] = LockInfo({
            token: token,
            owner: msg.sender,
            amount: amountAfterFee,
            lockTime: block.timestamp,
            unlockTime: unlockTime,
            withdrawn: false
        });
        
        // Add to user's locks
        userLocks[msg.sender].push(lockId);
        
        // Transfer tokens to this contract
        IERC20(token).safeTransferFrom(msg.sender, address(this), amountAfterFee);
        
        // Transfer fee to fee recipient if fee > 0
        if (fee > 0) {
            IERC20(token).safeTransferFrom(msg.sender, feeRecipient, fee);
        }
        
        emit LiquidityLocked(lockId, token, msg.sender, amountAfterFee, unlockTime);
        
        return lockId;
    }

    /**
     * @dev Withdraw locked LP tokens after unlock time
     * @param lockId ID of the lock
     */
    function withdraw(uint256 lockId) external nonReentrant {
        LockInfo storage lock = locks[lockId];
        
        require(lock.owner == msg.sender, "Not lock owner");
        require(!lock.withdrawn, "Already withdrawn");
        require(block.timestamp >= lock.unlockTime, "Still locked");
        
        lock.withdrawn = true;
        
        // Transfer tokens to owner
        IERC20(lock.token).safeTransfer(lock.owner, lock.amount);
        
        emit LiquidityWithdrawn(lockId, lock.token, lock.owner, lock.amount);
    }

    /**
     * @dev Extend lock duration
     * @param lockId ID of the lock
     * @param newDuration New lock duration in seconds (from now)
     */
    function extendLock(uint256 lockId, uint256 newDuration) external {
        LockInfo storage lock = locks[lockId];
        
        require(lock.owner == msg.sender, "Not lock owner");
        require(!lock.withdrawn, "Already withdrawn");
        require(newDuration >= MIN_LOCK_DURATION, "Duration too short");
        require(newDuration <= MAX_LOCK_DURATION, "Duration too long");
        
        uint256 newUnlockTime = block.timestamp + newDuration;
        require(newUnlockTime > lock.unlockTime, "New unlock time must be later");
        
        lock.unlockTime = newUnlockTime;
        
        emit LockExtended(lockId, newUnlockTime);
    }

    /**
     * @dev Get all locks for a user
     * @param user Address of the user
     */
    function getUserLocks(address user) external view returns (uint256[] memory) {
        return userLocks[user];
    }

    /**
     * @dev Get lock info
     * @param lockId ID of the lock
     */
    function getLockInfo(uint256 lockId) external view returns (
        address token,
        address owner,
        uint256 amount,
        uint256 lockTime,
        uint256 unlockTime,
        bool withdrawn
    ) {
        LockInfo storage lock = locks[lockId];
        return (
            lock.token,
            lock.owner,
            lock.amount,
            lock.lockTime,
            lock.unlockTime,
            lock.withdrawn
        );
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
     * @dev Emergency function to rescue tokens accidentally sent to this contract (owner only)
     * @param token Token address
     * @param amount Amount to rescue
     */
    function rescueTokens(address token, uint256 amount) external onlyOwner {
        IERC20(token).safeTransfer(owner(), amount);
    }
}