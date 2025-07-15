// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./PresaleContract.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title PresaleFactory
 * @dev Factory contract for creating presale contracts
 */
contract PresaleFactory is Ownable {
    struct PresaleInfo {
        address presaleContract;
        address creator;
        address token;
        uint256 createdAt;
        bool isActive;
    }

    mapping(address => PresaleInfo[]) public userPresales;
    mapping(address => PresaleInfo) public presaleInfo;
    
    address[] public allPresales;
    
    uint256 public creationFee = 0.01 ether; // Fee in native token
    address public feeReceiver;
    
    event PresaleCreated(
        address indexed creator,
        address indexed presaleContract,
        address indexed token,
        uint256 timestamp
    );
    
    event CreationFeeUpdated(uint256 newFee);
    event FeeReceiverUpdated(address newReceiver);

    constructor(address _feeReceiver) {
        feeReceiver = _feeReceiver;
    }

    /**
     * @dev Create a new presale contract
     */
    function createPresale(
        PresaleContract.SaleInfo memory saleInfo,
        PresaleContract.VestingInfo memory vestingInfo,
        address saleReceiver,
        address refundWallet
    ) external payable returns (address) {
        require(msg.value >= creationFee, "Insufficient creation fee");
        
        // Deploy new presale contract
        PresaleContract presale = new PresaleContract(
            saleInfo,
            vestingInfo,
            saleReceiver,
            refundWallet
        );
        
        // Transfer ownership to creator
        presale.transferOwnership(msg.sender);
        
        // Store presale info
        PresaleInfo memory info = PresaleInfo({
            presaleContract: address(presale),
            creator: msg.sender,
            token: address(saleInfo.token),
            createdAt: block.timestamp,
            isActive: true
        });
        
        userPresales[msg.sender].push(info);
        presaleInfo[address(presale)] = info;
        allPresales.push(address(presale));
        
        // Transfer creation fee
        if (msg.value > 0) {
            payable(feeReceiver).transfer(msg.value);
        }
        
        emit PresaleCreated(msg.sender, address(presale), address(saleInfo.token), block.timestamp);
        
        return address(presale);
    }

    /**
     * @dev Get user's presales
     */
    function getUserPresales(address user) external view returns (PresaleInfo[] memory) {
        return userPresales[user];
    }

    /**
     * @dev Get total number of presales
     */
    function getTotalPresales() external view returns (uint256) {
        return allPresales.length;
    }

    /**
     * @dev Get presales in range
     */
    function getPresalesInRange(uint256 start, uint256 end) external view returns (address[] memory) {
        require(start < end && end <= allPresales.length, "Invalid range");
        
        address[] memory result = new address[](end - start);
        for (uint256 i = start; i < end; i++) {
            result[i - start] = allPresales[i];
        }
        
        return result;
    }

    /**
     * @dev Update creation fee (owner only)
     */
    function updateCreationFee(uint256 newFee) external onlyOwner {
        creationFee = newFee;
        emit CreationFeeUpdated(newFee);
    }

    /**
     * @dev Update fee receiver (owner only)
     */
    function updateFeeReceiver(address newReceiver) external onlyOwner {
        require(newReceiver != address(0), "Invalid receiver");
        feeReceiver = newReceiver;
        emit FeeReceiverUpdated(newReceiver);
    }

    /**
     * @dev Deactivate a presale (owner only)
     */
    function deactivatePresale(address presaleContract) external onlyOwner {
        presaleInfo[presaleContract].isActive = false;
    }
}