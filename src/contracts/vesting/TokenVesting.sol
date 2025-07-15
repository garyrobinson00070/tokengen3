// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title TokenVesting
 * @dev Token vesting contract with linear release schedule
 */
contract TokenVesting is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct VestingSchedule {
        uint256 totalAmount;
        uint256 startTime;
        uint256 duration;
        uint256 releasedAmount;
        bool revoked;
    }

    IERC20 public immutable token;
    mapping(address => VestingSchedule) public vestingSchedules;
    mapping(address => bool) public vestingExists;
    
    uint256 public totalVestedAmount;
    uint256 public totalReleasedAmount;

    event VestingScheduleCreated(
        address indexed beneficiary,
        uint256 totalAmount,
        uint256 startTime,
        uint256 duration
    );
    
    event TokensReleased(address indexed beneficiary, uint256 amount);
    event VestingRevoked(address indexed beneficiary, uint256 unreleased);

    constructor(IERC20 token_) {
        token = token_;
    }

    function createVestingSchedule(
        address beneficiary,
        uint256 totalAmount,
        uint256 startTime,
        uint256 duration
    ) external onlyOwner {
        require(beneficiary != address(0), "Invalid beneficiary");
        require(totalAmount > 0, "Amount must be > 0");
        require(duration > 0, "Duration must be > 0");
        require(!vestingExists[beneficiary], "Vesting already exists");

        vestingSchedules[beneficiary] = VestingSchedule({
            totalAmount: totalAmount,
            startTime: startTime,
            duration: duration,
            releasedAmount: 0,
            revoked: false
        });

        vestingExists[beneficiary] = true;
        totalVestedAmount += totalAmount;

        token.safeTransferFrom(msg.sender, address(this), totalAmount);

        emit VestingScheduleCreated(beneficiary, totalAmount, startTime, duration);
    }

    function release() external nonReentrant {
        address beneficiary = msg.sender;
        require(vestingExists[beneficiary], "No vesting schedule");
        
        VestingSchedule storage schedule = vestingSchedules[beneficiary];
        require(!schedule.revoked, "Vesting revoked");

        uint256 releasableAmount = getReleasableAmount(beneficiary);
        require(releasableAmount > 0, "No tokens to release");

        schedule.releasedAmount += releasableAmount;
        totalReleasedAmount += releasableAmount;

        token.safeTransfer(beneficiary, releasableAmount);

        emit TokensReleased(beneficiary, releasableAmount);
    }

    function getReleasableAmount(address beneficiary) public view returns (uint256) {
        if (!vestingExists[beneficiary]) return 0;
        
        VestingSchedule memory schedule = vestingSchedules[beneficiary];
        if (schedule.revoked) return 0;

        return getVestedAmount(beneficiary) - schedule.releasedAmount;
    }

    function getVestedAmount(address beneficiary) public view returns (uint256) {
        if (!vestingExists[beneficiary]) return 0;
        
        VestingSchedule memory schedule = vestingSchedules[beneficiary];
        if (schedule.revoked) return schedule.releasedAmount;

        if (block.timestamp < schedule.startTime) {
            return 0;
        } else if (block.timestamp >= schedule.startTime + schedule.duration) {
            return schedule.totalAmount;
        } else {
            uint256 timeElapsed = block.timestamp - schedule.startTime;
            return (schedule.totalAmount * timeElapsed) / schedule.duration;
        }
    }

    function revokeVesting(address beneficiary) external onlyOwner {
        require(vestingExists[beneficiary], "No vesting schedule");
        
        VestingSchedule storage schedule = vestingSchedules[beneficiary];
        require(!schedule.revoked, "Already revoked");

        uint256 releasableAmount = getReleasableAmount(beneficiary);
        if (releasableAmount > 0) {
            schedule.releasedAmount += releasableAmount;
            totalReleasedAmount += releasableAmount;
            token.safeTransfer(beneficiary, releasableAmount);
        }

        uint256 unreleased = schedule.totalAmount - schedule.releasedAmount;
        schedule.revoked = true;

        if (unreleased > 0) {
            token.safeTransfer(owner(), unreleased);
        }

        emit VestingRevoked(beneficiary, unreleased);
    }

    function getVestingSchedule(address beneficiary) external view returns (
        uint256 totalAmount,
        uint256 startTime,
        uint256 duration,
        uint256 releasedAmount,
        uint256 vestedAmount,
        uint256 releasableAmount,
        bool revoked
    ) {
        require(vestingExists[beneficiary], "No vesting schedule");
        
        VestingSchedule memory schedule = vestingSchedules[beneficiary];
        return (
            schedule.totalAmount,
            schedule.startTime,
            schedule.duration,
            schedule.releasedAmount,
            getVestedAmount(beneficiary),
            getReleasableAmount(beneficiary),
            schedule.revoked
        );
    }
}