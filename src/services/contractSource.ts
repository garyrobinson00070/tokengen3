// This file contains the source code for the contracts
// In a production environment, these would be loaded from actual .sol files

// Cache for compiled contracts to avoid recompilation
const contractCache: Record<string, { bytecode: string, abi: any }> = {};

export function getContractSource(contractType: string): string {
  // Validate contract type
  const validContractTypes = [
    'BasicToken',
    'BurnableToken',
    'MintableToken',
    'BurnableMintableToken',
    'FeeToken',
    'RedistributionToken',
    'AdvancedToken',
    'TokenVesting',
    'PresaleContract'
  ];
  
  if (!validContractTypes.includes(contractType)) {
    throw new Error(`Invalid contract type: ${contractType}. Valid types are: ${validContractTypes.join(', ')}`);
  }
  
  switch (contractType) {
    case 'BasicToken':
      return `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title BasicToken
 * @dev Basic ERC20 token with no additional features
 */
contract BasicToken is ERC20, Ownable {
    uint8 private _decimals;
    uint256 private _maxSupply;

    constructor(
        string memory name,
        string memory symbol,
        uint8 decimals_,
        uint256 initialSupply,
        uint256 maxSupply_,
        address owner
    ) ERC20(name, symbol) {
        _decimals = decimals_;
        _maxSupply = maxSupply_;
        
        if (initialSupply > 0) {
            _mint(owner, initialSupply);
        }
        
        _transferOwnership(owner);
    }

    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }

    function maxSupply() public view returns (uint256) {
        return _maxSupply;
    }
}
      `;
    
    case 'BurnableToken':
      return `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title BurnableToken
 * @dev ERC20 token with burn functionality
 */
contract BurnableToken is ERC20, ERC20Burnable, Ownable {
    uint8 private _decimals;
    uint256 private _maxSupply;

    constructor(
        string memory name,
        string memory symbol,
        uint8 decimals_,
        uint256 initialSupply,
        uint256 maxSupply_,
        address owner
    ) ERC20(name, symbol) {
        _decimals = decimals_;
        _maxSupply = maxSupply_;
        
        if (initialSupply > 0) {
            _mint(owner, initialSupply);
        }
        
        _transferOwnership(owner);
    }

    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }

    function maxSupply() public view returns (uint256) {
        return _maxSupply;
    }
}
      `;
    
    case 'MintableToken':
      return `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MintableToken
 * @dev ERC20 token with mint functionality
 */
contract MintableToken is ERC20, Ownable {
    uint8 private _decimals;
    uint256 private _maxSupply;

    constructor(
        string memory name,
        string memory symbol,
        uint8 decimals_,
        uint256 initialSupply,
        uint256 maxSupply_,
        address owner
    ) ERC20(name, symbol) {
        _decimals = decimals_;
        _maxSupply = maxSupply_;
        
        if (initialSupply > 0) {
            _mint(owner, initialSupply);
        }
        
        _transferOwnership(owner);
    }

    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }

    function maxSupply() public view returns (uint256) {
        return _maxSupply;
    }

    function mint(address to, uint256 amount) public onlyOwner {
        require(_maxSupply == 0 || totalSupply() + amount <= _maxSupply, "Max supply exceeded");
        _mint(to, amount);
    }
}
      `;
    
    case 'BurnableMintableToken':
      return `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title BurnableMintableToken
 * @dev ERC20 token with both burn and mint functionality
 */
contract BurnableMintableToken is ERC20, ERC20Burnable, Ownable {
    uint8 private _decimals;
    uint256 private _maxSupply;

    constructor(
        string memory name,
        string memory symbol,
        uint8 decimals_,
        uint256 initialSupply,
        uint256 maxSupply_,
        address owner
    ) ERC20(name, symbol) {
        _decimals = decimals_;
        _maxSupply = maxSupply_;
        
        if (initialSupply > 0) {
            _mint(owner, initialSupply);
        }
        
        _transferOwnership(owner);
    }

    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }

    function maxSupply() public view returns (uint256) {
        return _maxSupply;
    }

    function mint(address to, uint256 amount) public onlyOwner {
        require(_maxSupply == 0 || totalSupply() + amount <= _maxSupply, "Max supply exceeded");
        _mint(to, amount);
    }
}
      `;
    
    case 'FeeToken':
      return `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title FeeToken
 * @dev ERC20 token with transfer fees
 */
contract FeeToken is ERC20, Ownable {
    uint8 private _decimals;
    uint256 private _maxSupply;
    uint256 public transferFeePercentage; // Fee percentage (0-1000 = 0-10%)
    address public feeRecipient;

    constructor(
        string memory name,
        string memory symbol,
        uint8 decimals_,
        uint256 initialSupply,
        uint256 maxSupply_,
        uint256 feePercentage,
        address feeRecipient_,
        address owner
    ) ERC20(name, symbol) {
        _decimals = decimals_;
        _maxSupply = maxSupply_;
        transferFeePercentage = feePercentage;
        feeRecipient = feeRecipient_;
        
        if (initialSupply > 0) {
            _mint(owner, initialSupply);
        }
        
        _transferOwnership(owner);
    }

    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }

    function maxSupply() public view returns (uint256) {
        return _maxSupply;
    }

    function _transfer(address from, address to, uint256 amount) internal virtual override {
        require(from != address(0), "ERC20: transfer from the zero address");
        require(to != address(0), "ERC20: transfer to the zero address");

        if (transferFeePercentage > 0 && from != owner() && to != owner()) {
            uint256 feeAmount = (amount * transferFeePercentage) / 10000;
            uint256 transferAmount = amount - feeAmount;
            
            super._transfer(from, feeRecipient, feeAmount);
            super._transfer(from, to, transferAmount);
        } else {
            super._transfer(from, to, amount);
        }
    }

    function setTransferFee(uint256 feePercentage) external onlyOwner {
        require(feePercentage <= 1000, "Fee too high"); // Max 10%
        transferFeePercentage = feePercentage;
    }

    function setFeeRecipient(address recipient) external onlyOwner {
        require(recipient != address(0), "Invalid recipient");
        feeRecipient = recipient;
    }
}
      `;
    
    case 'RedistributionToken':
      return `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title RedistributionToken
 * @dev ERC20 token with holder redistribution mechanism
 */
contract RedistributionToken is ERC20, Ownable {
    uint8 private _decimals;
    uint256 private _maxSupply;
    uint256 public redistributionPercentage; // Redistribution percentage (0-500 = 0-5%)
    
    mapping(address => uint256) private _lastClaimTime;
    mapping(address => bool) private _excludedFromRewards;
    
    uint256 private _totalRewards;
    uint256 private _rewardsPerToken;
    uint256 private _lastUpdateTime;

    constructor(
        string memory name,
        string memory symbol,
        uint8 decimals_,
        uint256 initialSupply,
        uint256 maxSupply_,
        uint256 redistributionPercentage_,
        address owner
    ) ERC20(name, symbol) {
        _decimals = decimals_;
        _maxSupply = maxSupply_;
        redistributionPercentage = redistributionPercentage_;
        _lastUpdateTime = block.timestamp;
        
        if (initialSupply > 0) {
            _mint(owner, initialSupply);
        }
        
        _transferOwnership(owner);
    }

    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }

    function maxSupply() public view returns (uint256) {
        return _maxSupply;
    }

    function _transfer(address from, address to, uint256 amount) internal virtual override {
        require(from != address(0), "ERC20: transfer from the zero address");
        require(to != address(0), "ERC20: transfer to the zero address");

        _updateRewards();

        if (redistributionPercentage > 0 && from != owner() && to != owner()) {
            uint256 redistributionAmount = (amount * redistributionPercentage) / 10000;
            uint256 transferAmount = amount - redistributionAmount;
            
            _totalRewards += redistributionAmount;
            super._transfer(from, to, transferAmount);
        } else {
            super._transfer(from, to, amount);
        }
    }

    function _updateRewards() internal {
        if (totalSupply() > 0) {
            uint256 timeDelta = block.timestamp - _lastUpdateTime;
            if (timeDelta > 0 && _totalRewards > 0) {
                _rewardsPerToken += (_totalRewards * 1e18) / totalSupply();
                _totalRewards = 0;
            }
        }
        _lastUpdateTime = block.timestamp;
    }

    function claimRewards() external {
        _updateRewards();
        
        uint256 rewards = getUnclaimedRewards(msg.sender);
        if (rewards > 0) {
            _lastClaimTime[msg.sender] = block.timestamp;
            _mint(msg.sender, rewards);
        }
    }

    function getUnclaimedRewards(address account) public view returns (uint256) {
        if (_excludedFromRewards[account]) return 0;
        
        uint256 accountBalance = balanceOf(account);
        if (accountBalance == 0) return 0;
        
        return (accountBalance * _rewardsPerToken) / 1e18;
    }

    function setRedistributionPercentage(uint256 percentage) external onlyOwner {
        require(percentage <= 500, "Percentage too high"); // Max 5%
        redistributionPercentage = percentage;
    }

    function excludeFromRewards(address account, bool excluded) external onlyOwner {
        _excludedFromRewards[account] = excluded;
    }
}
      `;
    
    case 'AdvancedToken':
      return `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AdvancedToken
 * @dev ERC20 token with all features: burnable, mintable, fees, and redistribution
 */
contract AdvancedToken is ERC20, ERC20Burnable, Ownable {
    uint8 private _decimals;
    uint256 private _maxSupply;
    
    // Fee mechanism
    uint256 public transferFeePercentage;
    address public feeRecipient;
    
    // Redistribution mechanism
    uint256 public redistributionPercentage;
    mapping(address => uint256) private _lastClaimTime;
    mapping(address => bool) private _excludedFromRewards;
    uint256 private _totalRewards;
    uint256 private _rewardsPerToken;
    uint256 private _lastUpdateTime;

    constructor(
        string memory name,
        string memory symbol,
        uint8 decimals_,
        uint256 initialSupply,
        uint256 maxSupply_,
        uint256 feePercentage,
        address feeRecipient_,
        uint256 redistributionPercentage_,
        address owner
    ) ERC20(name, symbol) {
        _decimals = decimals_;
        _maxSupply = maxSupply_;
        transferFeePercentage = feePercentage;
        feeRecipient = feeRecipient_;
        redistributionPercentage = redistributionPercentage_;
        _lastUpdateTime = block.timestamp;
        
        if (initialSupply > 0) {
            _mint(owner, initialSupply);
        }
        
        _transferOwnership(owner);
    }

    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }

    function maxSupply() public view returns (uint256) {
        return _maxSupply;
    }

    function mint(address to, uint256 amount) public onlyOwner {
        require(_maxSupply == 0 || totalSupply() + amount <= _maxSupply, "Max supply exceeded");
        _mint(to, amount);
    }

    function _transfer(address from, address to, uint256 amount) internal virtual override {
        require(from != address(0), "ERC20: transfer from the zero address");
        require(to != address(0), "ERC20: transfer to the zero address");

        _updateRewards();

        if ((transferFeePercentage > 0 || redistributionPercentage > 0) && from != owner() && to != owner()) {
            uint256 feeAmount = (amount * transferFeePercentage) / 10000;
            uint256 redistributionAmount = (amount * redistributionPercentage) / 10000;
            uint256 transferAmount = amount - feeAmount - redistributionAmount;
            
            if (feeAmount > 0) {
                super._transfer(from, feeRecipient, feeAmount);
            }
            
            if (redistributionAmount > 0) {
                _totalRewards += redistributionAmount;
            }
            
            super._transfer(from, to, transferAmount);
        } else {
            super._transfer(from, to, amount);
        }
    }

    function _updateRewards() internal {
        if (totalSupply() > 0) {
            uint256 timeDelta = block.timestamp - _lastUpdateTime;
            if (timeDelta > 0 && _totalRewards > 0) {
                _rewardsPerToken += (_totalRewards * 1e18) / totalSupply();
                _totalRewards = 0;
            }
        }
        _lastUpdateTime = block.timestamp;
    }

    function claimRewards() external {
        _updateRewards();
        
        uint256 rewards = getUnclaimedRewards(msg.sender);
        if (rewards > 0) {
            _lastClaimTime[msg.sender] = block.timestamp;
            _mint(msg.sender, rewards);
        }
    }

    function getUnclaimedRewards(address account) public view returns (uint256) {
        if (_excludedFromRewards[account]) return 0;
        
        uint256 accountBalance = balanceOf(account);
        if (accountBalance == 0) return 0;
        
        return (accountBalance * _rewardsPerToken) / 1e18;
    }

    function setTransferFee(uint256 feePercentage) external onlyOwner {
        require(feePercentage <= 1000, "Fee too high"); // Max 10%
        transferFeePercentage = feePercentage;
    }

    function setFeeRecipient(address recipient) external onlyOwner {
        require(recipient != address(0), "Invalid recipient");
        feeRecipient = recipient;
    }

    function setRedistributionPercentage(uint256 percentage) external onlyOwner {
        require(percentage <= 500, "Percentage too high"); // Max 5%
        redistributionPercentage = percentage;
    }

    function excludeFromRewards(address account, bool excluded) external onlyOwner {
        _excludedFromRewards[account] = excluded;
    }
}
      `;
    
    case 'TokenVesting':
      return `
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
      `;
    
    case 'PresaleContract':
      return `
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
      `;
    
    default:
      throw new Error(`Contract type ${contractType} not found`);
  }
}

// Get compiled contract (bytecode and ABI)
export async function getCompiledContract(contractType: string) {
  // Check cache first
  if (contractCache[contractType]) {
    return contractCache[contractType];
  }
  
  try {
    // Get contract source
    const source = getContractSource(contractType);
    
    // Use solc.js to compile the contract
    const solc = await import('solc');
    
    const input = {
      language: 'Solidity',
      sources: {
        'contract.sol': {
          content: source
        }
      },
      settings: {
        outputSelection: {
          '*': {
            '*': ['abi', 'evm.bytecode']
          }
        },
        optimizer: {
          enabled: true,
          runs: 200
        }
      }
    };
    
    const output = JSON.parse(solc.compile(JSON.stringify(input)));
    
    // Check for errors
    if (output.errors) {
      const errors = output.errors.filter((error: any) => error.severity === 'error');
      if (errors.length > 0) {
        throw new Error(`Compilation errors: ${errors.map((e: any) => e.message).join(', ')}`);
      }
    }
    
    const contract = output.contracts['contract.sol'][contractType];
    const result = {
      bytecode: contract.evm.bytecode.object,
      abi: contract.abi
    };
    
    // Cache the result
    contractCache[contractType] = result;
    
    return result;
  } catch (error) {
    console.error(`Error compiling contract ${contractType}:`, error);
    throw error;
  }
}