// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./BasicToken.sol";
import "./BurnableToken.sol";
import "./MintableToken.sol";
import "./BurnableMintableToken.sol";
import "./FeeToken.sol";
import "./RedistributionToken.sol";
import "./AdvancedToken.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title TokenFactory
 * @dev Factory contract for creating various token types with reduced gas costs
 */
contract TokenFactory is Ownable {
    struct TokenInfo {
        address tokenAddress;
        string tokenType;
        address creator;
        uint256 createdAt;
    }

    mapping(address => TokenInfo[]) public creatorTokens;
    TokenInfo[] public allTokens;
    
    uint256 public creationFee = 0.01 ether; // Optional fee in native token
    address public feeReceiver;
    
    event TokenCreated(
        address indexed creator,
        address indexed tokenAddress,
        string tokenType,
        uint256 timestamp
    );
    
    event CreationFeeUpdated(uint256 newFee);
    event FeeReceiverUpdated(address newReceiver);

    constructor(address _feeReceiver) {
        feeReceiver = _feeReceiver;
    }

    /**
     * @dev Create a basic token
     */
    function createBasicToken(
        string memory name,
        string memory symbol,
        uint8 decimals,
        uint256 initialSupply,
        uint256 maxSupply
    ) external payable returns (address) {
        require(msg.value >= creationFee, "Insufficient creation fee");
        
        BasicToken token = new BasicToken(
            name,
            symbol,
            decimals,
            initialSupply,
            maxSupply,
            msg.sender
        );
        
        _registerToken(address(token), "BasicToken");
        
        return address(token);
    }

    /**
     * @dev Create a burnable token
     */
    function createBurnableToken(
        string memory name,
        string memory symbol,
        uint8 decimals,
        uint256 initialSupply,
        uint256 maxSupply
    ) external payable returns (address) {
        require(msg.value >= creationFee, "Insufficient creation fee");
        
        BurnableToken token = new BurnableToken(
            name,
            symbol,
            decimals,
            initialSupply,
            maxSupply,
            msg.sender
        );
        
        _registerToken(address(token), "BurnableToken");
        
        return address(token);
    }

    /**
     * @dev Create a mintable token
     */
    function createMintableToken(
        string memory name,
        string memory symbol,
        uint8 decimals,
        uint256 initialSupply,
        uint256 maxSupply
    ) external payable returns (address) {
        require(msg.value >= creationFee, "Insufficient creation fee");
        
        MintableToken token = new MintableToken(
            name,
            symbol,
            decimals,
            initialSupply,
            maxSupply,
            msg.sender
        );
        
        _registerToken(address(token), "MintableToken");
        
        return address(token);
    }

    /**
     * @dev Create a burnable and mintable token
     */
    function createBurnableMintableToken(
        string memory name,
        string memory symbol,
        uint8 decimals,
        uint256 initialSupply,
        uint256 maxSupply
    ) external payable returns (address) {
        require(msg.value >= creationFee, "Insufficient creation fee");
        
        BurnableMintableToken token = new BurnableMintableToken(
            name,
            symbol,
            decimals,
            initialSupply,
            maxSupply,
            msg.sender
        );
        
        _registerToken(address(token), "BurnableMintableToken");
        
        return address(token);
    }

    /**
     * @dev Create a fee token
     */
    function createFeeToken(
        string memory name,
        string memory symbol,
        uint8 decimals,
        uint256 initialSupply,
        uint256 maxSupply,
        uint256 feePercentage,
        address feeRecipient
    ) external payable returns (address) {
        require(msg.value >= creationFee, "Insufficient creation fee");
        
        FeeToken token = new FeeToken(
            name,
            symbol,
            decimals,
            initialSupply,
            maxSupply,
            feePercentage,
            feeRecipient,
            msg.sender
        );
        
        _registerToken(address(token), "FeeToken");
        
        return address(token);
    }

    /**
     * @dev Create a redistribution token
     */
    function createRedistributionToken(
        string memory name,
        string memory symbol,
        uint8 decimals,
        uint256 initialSupply,
        uint256 maxSupply,
        uint256 redistributionPercentage
    ) external payable returns (address) {
        require(msg.value >= creationFee, "Insufficient creation fee");
        
        RedistributionToken token = new RedistributionToken(
            name,
            symbol,
            decimals,
            initialSupply,
            maxSupply,
            redistributionPercentage,
            msg.sender
        );
        
        _registerToken(address(token), "RedistributionToken");
        
        return address(token);
    }

    /**
     * @dev Create an advanced token with all features
     */
    function createAdvancedToken(
        string memory name,
        string memory symbol,
        uint8 decimals,
        uint256 initialSupply,
        uint256 maxSupply,
        uint256 feePercentage,
        address feeRecipient,
        uint256 redistributionPercentage
    ) external payable returns (address) {
        require(msg.value >= creationFee, "Insufficient creation fee");
        
        AdvancedToken token = new AdvancedToken(
            name,
            symbol,
            decimals,
            initialSupply,
            maxSupply,
            feePercentage,
            feeRecipient,
            redistributionPercentage,
            msg.sender
        );
        
        _registerToken(address(token), "AdvancedToken");
        
        return address(token);
    }

    /**
     * @dev Register a created token
     */
    function _registerToken(address tokenAddress, string memory tokenType) internal {
        TokenInfo memory info = TokenInfo({
            tokenAddress: tokenAddress,
            tokenType: tokenType,
            creator: msg.sender,
            createdAt: block.timestamp
        });
        
        creatorTokens[msg.sender].push(info);
        allTokens.push(info);
        
        // Transfer creation fee
        if (msg.value > 0) {
            payable(feeReceiver).transfer(msg.value);
        }
        
        emit TokenCreated(msg.sender, tokenAddress, tokenType, block.timestamp);
    }

    /**
     * @dev Get tokens created by a specific address
     */
    function getTokensByCreator(address creator) external view returns (TokenInfo[] memory) {
        return creatorTokens[creator];
    }

    /**
     * @dev Get total number of tokens created
     */
    function getTotalTokens() external view returns (uint256) {
        return allTokens.length;
    }

    /**
     * @dev Get tokens in range
     */
    function getTokensInRange(uint256 start, uint256 end) external view returns (TokenInfo[] memory) {
        require(start < end && end <= allTokens.length, "Invalid range");
        
        TokenInfo[] memory result = new TokenInfo[](end - start);
        for (uint256 i = start; i < end; i++) {
            result[i - start] = allTokens[i];
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
}