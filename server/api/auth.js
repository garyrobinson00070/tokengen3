const express = require('express');
const jwt = require('jsonwebtoken');
const { ethers } = require('ethers');
const { query } = require('../db');
const { generateRandomString, hashData, verifyHash } = require('../utils/encryption');
const { verifySignature } = require('../middleware/auth');

const router = express.Router();

// Generate authentication token for wallet address
router.post('/login', verifySignature, async (req, res) => {
  try {
    const { address } = req.body;
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        id: address.toLowerCase(),
        address: address.toLowerCase(),
        timestamp: Date.now()
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    // Log successful login
    console.log(`User ${address.slice(0, 6)}...${address.slice(-4)} logged in successfully`);
    
    res.json({
      success: true,
      token,
      address: address.toLowerCase(),
      expiresIn: '24h'
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Authentication failed', details: error.message });
  }
});

// Get authentication message for signing
router.post('/message', async (req, res) => {
  try {
    const { address } = req.body;
    
    if (!address) {
      return res.status(400).json({ error: 'Address is required' });
    }
    
    // Check if user exists
    const userResult = await query(
      'SELECT * FROM users WHERE address = $1',
      [address.toLowerCase()]
    );
    
    let nonce;
    
    if (userResult.rows.length === 0) {
      // Create new user
      nonce = generateRandomString(16);
      await query(
        'INSERT INTO users (address, nonce) VALUES ($1, $2)',
        [address.toLowerCase(), nonce]
      );
    } else {
      // Update nonce for existing user
      nonce = generateRandomString(16);
      await query(
        'UPDATE users SET nonce = $1 WHERE address = $2',
        [nonce, address.toLowerCase()]
      );
    }
    
    const timestamp = Date.now();
    const message = `Welcome to TokenForge!\n\nSign this message to authenticate your wallet.\n\nAddress: ${address}\nNonce: ${nonce}\nTimestamp: ${timestamp}`;
    
    res.json({
      message,
      timestamp
    });
    
  } catch (error) {
    console.error('Message generation error:', error);
    res.status(500).json({ error: 'Failed to generate message', details: error.message });
  }
});

// Verify token
router.get('/verify', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const token = authHeader.split(' ')[1];
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Check if user exists
      const userResult = await query(
        'SELECT * FROM users WHERE address = $1',
        [decoded.address.toLowerCase()]
      );
      
      if (userResult.rows.length === 0) {
        return res.status(401).json({ error: 'User not found' });
      }
      
      res.json({
        valid: true,
        address: decoded.address,
        expiresAt: decoded.exp
      });
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        res.status(401).json({ error: 'Invalid token' });
      } else if (error.name === 'TokenExpiredError') {
        res.status(401).json({ error: 'Token expired' });
      } else {
        console.error('Token verification error:', error);
        res.status(500).json({ error: 'Verification failed' });
      }
    }
    
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({ error: 'Verification failed', details: error.message });
  }
});

// ESR Token balance endpoint
router.get('/esr/balance/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    if (!address) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }
    
    // Implement actual ESR token balance checking
    const provider = new ethers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL);
    const ESR_TOKEN_ADDRESS = process.env.ESR_TOKEN_ADDRESS;
    
    if (!ESR_TOKEN_ADDRESS || ESR_TOKEN_ADDRESS === '0x0000000000000000000000000000000000000000') {
      console.warn('ESR Token address not properly configured in server environment');
      return res.status(500).json({ 
        error: 'ESR Token address not configured on server',
        balance: 0 
      });
    }
    
    const ESR_ABI = [
      'function balanceOf(address owner) view returns (uint256)',
      'function decimals() view returns (uint8)'
    ];
    
    const esrContract = new ethers.Contract(ESR_TOKEN_ADDRESS, ESR_ABI, provider);
    
    try {
      const [balance, decimals] = await Promise.all([
        esrContract.balanceOf(address),
        esrContract.decimals()
      ]);
      
      const formattedBalance = parseFloat(ethers.formatUnits(balance, decimals));
      console.log(`ESR balance for ${address}: ${formattedBalance}`);
      
      // Store balance in database for future reference
      await query(
        'UPDATE users SET esr_balance = $1, esr_last_checked = CURRENT_TIMESTAMP WHERE address = $2',
        [formattedBalance, address.toLowerCase()]
      );
      
      res.json({ 
        balance: formattedBalance,
        address: address,
        token: ESR_TOKEN_ADDRESS,
        timestamp: new Date().toISOString()
      });
    } catch (contractError) {
      console.error('ESR contract error:', contractError);
      res.status(500).json({ 
        error: 'Failed to query ESR token contract',
        details: contractError.message,
        balance: 0 
      });
    }
    
  } catch (error) {
    console.error('ESR balance check error:', error);
    res.status(500).json({ 
      error: 'Failed to check ESR balance',
      details: error.message,
      balance: 0
    });
  }
});

// ESR Token deduction endpoint
router.post('/esr/deduct', async (req, res) => {
  try {
    const { amount, txHash } = req.body;
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization required' });
    }
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }
    
    // Verify the transaction if a hash is provided
    if (txHash) {
      try {
        const provider = new ethers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL);
        const receipt = await provider.getTransactionReceipt(txHash);
        
        if (!receipt || receipt.status !== 1) {
          return res.status(400).json({ error: 'Transaction failed or not found' });
        }
        
        // Verify this is a transfer to our platform wallet
        const ESR_TOKEN_ADDRESS = process.env.ESR_TOKEN_ADDRESS;
        const PLATFORM_WALLET = process.env.PLATFORM_WALLET;
        
        // Simple check - in production you would decode the logs to verify the transfer details
        if (receipt.to.toLowerCase() !== ESR_TOKEN_ADDRESS.toLowerCase()) {
          return res.status(400).json({ error: 'Transaction is not for ESR token' });
        }
        
        // Record the transaction in the database
        await query(
          'INSERT INTO transactions (transaction_hash, transaction_type, from_address, to_address, amount, token_address, network_id, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
          [txHash, 'ESR_DEDUCTION', receipt.from.toLowerCase(), PLATFORM_WALLET.toLowerCase(), amount, ESR_TOKEN_ADDRESS, 'ethereum', 'confirmed']
        );
        
        console.log(`Verified ESR token transfer transaction: ${txHash}`);
        return res.json({ success: true, verified: true });
      } catch (verifyError) {
        console.error('Transaction verification error:', verifyError);
        return res.status(400).json({ error: 'Failed to verify transaction', details: verifyError.message });
      }
    }
    
    // For frontend-handled deductions, just return success
    // The actual deduction happens in the frontend via the user's wallet
    const success = true;
    
    res.json({ success });
    
  } catch (error) {
    console.error('ESR deduction error:', error);
    res.status(500).json({ error: 'Failed to deduct ESR tokens', details: error.message });
  }
});

module.exports = router;