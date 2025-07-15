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