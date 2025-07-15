const { query } = require('../db');
const { ethers } = require('ethers');

/**
 * Verify if a user is the owner of a token
 * @param {string} tokenAddress - The token contract address
 * @param {string} walletAddress - The wallet address to check
 * @returns {Promise<boolean>} - True if the wallet is the token owner
 */
async function verifyTokenOwnership(tokenAddress, walletAddress) {
  try {
    // Check if token exists in our database
    const tokenResult = await query(
      'SELECT * FROM tokens WHERE contract_address = $1',
      [tokenAddress.toLowerCase()]
    );
    
    if (tokenResult.rows.length === 0) {
      return false;
    }
    
    const token = tokenResult.rows[0];
    
    // Check if wallet is the token owner
    if (token.owner_address.toLowerCase() !== walletAddress.toLowerCase()) {
      // If not in database, verify on-chain
      try {
        const provider = new ethers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL);
        const tokenContract = new ethers.Contract(
          tokenAddress,
          ['function owner() view returns (address)'],
          provider
        );
        
        const onChainOwner = await tokenContract.owner();
        return onChainOwner.toLowerCase() === walletAddress.toLowerCase();
      } catch (error) {
        console.error('Error verifying on-chain ownership:', error);
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error verifying token ownership:', error);
    return false;
  }
}

/**
 * Check if a user has tokens (is a token holder)
 * @param {string} tokenAddress - The token contract address
 * @param {string} walletAddress - The wallet address to check
 * @returns {Promise<boolean>} - True if the wallet holds tokens
 */
async function isTokenHolder(tokenAddress, walletAddress) {
  try {
    const provider = new ethers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL);
    const tokenContract = new ethers.Contract(
      tokenAddress,
      ['function balanceOf(address) view returns (uint256)'],
      provider
    );
    
    const balance = await tokenContract.balanceOf(walletAddress);
    return balance > 0;
  } catch (error) {
    console.error('Error checking token balance:', error);
    return false;
  }
}

module.exports = {
  verifyTokenOwnership,
  isTokenHolder
};