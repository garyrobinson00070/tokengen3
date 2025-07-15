// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title AutoLiquidity
 * @dev Contract for automatically adding liquidity to DEX after presale
 */
contract AutoLiquidity is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // Interface for DEX router (Uniswap V2 compatible)
    interface IUniswapV2Router {
        function addLiquidity(
            address tokenA,
            address tokenB,
            uint amountADesired,
            uint amountBDesired,
            uint amountAMin,
            uint amountBMin,
            address to,
            uint deadline
        ) external returns (uint amountA, uint amountB, uint liquidity);
        
        function factory() external view returns (address);
    }
    
    // Interface for DEX factory
    interface IUniswapV2Factory {
        function getPair(address tokenA, address tokenB) external view returns (address pair);
        function createPair(address tokenA, address tokenB) external returns (address pair);
    }

    struct ListingInfo {
        address token;
        address baseToken;
        address router;
        uint256 tokenAmount;
        uint256 baseTokenAmount;
        address lpTokenAddress;
        bool listed;
        uint256 timestamp;
    }

    // Mapping from presale address to listing info
    mapping(address => ListingInfo) public listings;
    
    // Default router address (can be updated)
    address public defaultRouter;
    
    // Default base token (USDT, USDC, etc.)
    address public defaultBaseToken;
    
    // Platform fee (0.5%)
    uint256 public platformFee = 5; // 5 = 0.5%
    
    // Fee recipient
    address public feeRecipient;

    event LiquidityAdded(
        address indexed presale,
        address indexed token,
        address indexed baseToken,
        uint256 tokenAmount,
        uint256 baseTokenAmount,
        address lpTokenAddress
    );
    
    event RouterUpdated(address newRouter);
    event BaseTokenUpdated(address newBaseToken);
    event FeeUpdated(uint256 newFee);
    event FeeRecipientUpdated(address newRecipient);

    constructor(address _defaultRouter, address _defaultBaseToken, address _feeRecipient) {
        defaultRouter = _defaultRouter;
        defaultBaseToken = _defaultBaseToken;
        feeRecipient = _feeRecipient;
    }

    /**
     * @dev Add liquidity to DEX
     * @param presale Address of the presale contract (for tracking)
     * @param token Token address
     * @param baseToken Base token address (USDT, USDC, etc.)
     * @param tokenAmount Amount of tokens to add
     * @param baseTokenAmount Amount of base tokens to add
     * @param router DEX router address
     */
    function addLiquidity(
        address presale,
        address token,
        address baseToken,
        uint256 tokenAmount,
        uint256 baseTokenAmount,
        address router
    ) external nonReentrant returns (address) {
        require(presale != address(0), "Invalid presale address");
        require(token != address(0), "Invalid token address");
        require(tokenAmount > 0, "Token amount must be > 0");
        require(baseTokenAmount > 0, "Base token amount must be > 0");
        
        // Use default values if not provided
        if (baseToken == address(0)) baseToken = defaultBaseToken;
        if (router == address(0)) router = defaultRouter;
        
        // Calculate fee
        uint256 tokenFee = (tokenAmount * platformFee) / 1000;
        uint256 baseTokenFee = (baseTokenAmount * platformFee) / 1000;
        
        uint256 tokenAmountAfterFee = tokenAmount - tokenFee;
        uint256 baseTokenAmountAfterFee = baseTokenAmount - baseTokenFee;
        
        // Transfer tokens to this contract
        IERC20(token).safeTransferFrom(msg.sender, address(this), tokenAmount);
        IERC20(baseToken).safeTransferFrom(msg.sender, address(this), baseTokenAmount);
        
        // Transfer fees to fee recipient if fees > 0
        if (tokenFee > 0) {
            IERC20(token).safeTransfer(feeRecipient, tokenFee);
        }
        if (baseTokenFee > 0) {
            IERC20(baseToken).safeTransfer(feeRecipient, baseTokenFee);
        }
        
        // Approve router to spend tokens
        IERC20(token).safeApprove(router, tokenAmountAfterFee);
        IERC20(baseToken).safeApprove(router, baseTokenAmountAfterFee);
        
        // Get factory address
        IUniswapV2Router dexRouter = IUniswapV2Router(router);
        address factory = dexRouter.factory();
        
        // Create pair if it doesn't exist
        IUniswapV2Factory dexFactory = IUniswapV2Factory(factory);
        address pair = dexFactory.getPair(token, baseToken);
        if (pair == address(0)) {
            pair = dexFactory.createPair(token, baseToken);
        }
        
        // Add liquidity
        (uint256 tokenUsed, uint256 baseTokenUsed, uint256 liquidity) = dexRouter.addLiquidity(
            token,
            baseToken,
            tokenAmountAfterFee,
            baseTokenAmountAfterFee,
            0, // Accept any amount
            0, // Accept any amount
            msg.sender, // LP tokens go to sender
            block.timestamp + 300 // 5 minute deadline
        );
        
        // Store listing info
        listings[presale] = ListingInfo({
            token: token,
            baseToken: baseToken,
            router: router,
            tokenAmount: tokenUsed,
            baseTokenAmount: baseTokenUsed,
            lpTokenAddress: pair,
            listed: true,
            timestamp: block.timestamp
        });
        
        // Refund any unused tokens
        uint256 unusedToken = tokenAmountAfterFee - tokenUsed;
        uint256 unusedBaseToken = baseTokenAmountAfterFee - baseTokenUsed;
        
        if (unusedToken > 0) {
            IERC20(token).safeTransfer(msg.sender, unusedToken);
        }
        if (unusedBaseToken > 0) {
            IERC20(baseToken).safeTransfer(msg.sender, unusedBaseToken);
        }
        
        emit LiquidityAdded(presale, token, baseToken, tokenUsed, baseTokenUsed, pair);
        
        return pair;
    }

    /**
     * @dev Get listing info
     * @param presale Address of the presale contract
     */
    function getListingInfo(address presale) external view returns (
        address token,
        address baseToken,
        address router,
        uint256 tokenAmount,
        uint256 baseTokenAmount,
        address lpTokenAddress,
        bool listed,
        uint256 timestamp
    ) {
        ListingInfo storage info = listings[presale];
        return (
            info.token,
            info.baseToken,
            info.router,
            info.tokenAmount,
            info.baseTokenAmount,
            info.lpTokenAddress,
            info.listed,
            info.timestamp
        );
    }

    /**
     * @dev Update default router (owner only)
     * @param newRouter New router address
     */
    function updateDefaultRouter(address newRouter) external onlyOwner {
        require(newRouter != address(0), "Invalid router address");
        defaultRouter = newRouter;
        emit RouterUpdated(newRouter);
    }

    /**
     * @dev Update default base token (owner only)
     * @param newBaseToken New base token address
     */
    function updateDefaultBaseToken(address newBaseToken) external onlyOwner {
        require(newBaseToken != address(0), "Invalid base token address");
        defaultBaseToken = newBaseToken;
        emit BaseTokenUpdated(newBaseToken);
    }

    /**
     * @dev Update platform fee (owner only)
     * @param newFee New fee (in 0.1% increments, e.g., 5 = 0.5%)
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