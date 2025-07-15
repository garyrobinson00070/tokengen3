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
}