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
            _mint(owner, initialSupply * 10**decimals_);
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