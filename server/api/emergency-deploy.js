const express = require('express');
const { authenticate } = require('../middleware/auth');
const { validateTokenConfig } = require('../middleware/validation');
const { query } = require('../db');
const emergencyDeploymentService = require('../services/emergencyDeploymentService');

const router = express.Router();

// Check if Foundry is installed
router.get('/status', async (req, res) => {
  try {
    const isFoundryInstalled = await emergencyDeploymentService.isFoundryInstalled();
    res.json({ 
      available: isFoundryInstalled,
      message: isFoundryInstalled 
        ? 'Emergency deployment system is available' 
        : 'Emergency deployment system is not available (Foundry not installed)'
    });
  } catch (error) {
    console.error('Error checking emergency deployment status:', error);
    res.status(500).json({ error: 'Failed to check emergency deployment status' });
  }
});

// Emergency deploy endpoint
router.post('/token', authenticate, validateTokenConfig, async (req, res) => {
  try {
    const { contractType, constructorArgs, network } = req.body;
    const userId = req.user.id;
    
    console.log(`[EMERGENCY] Deploying ${contractType} for user ${userId} on ${network}`);
    
    // Check if user has enough ESR tokens for mainnet deployment
    if (!network.includes('testnet') && !network.includes('goerli') && !network.includes('sepolia')) {
      try {
        const userResult = await query(
          'SELECT esr_balance FROM users WHERE address = $1',
          [userId]
        );
        
        if (userResult.rows.length === 0) {
          return res.status(400).json({ error: 'User not found' });
        }
        
        const esrBalance = parseFloat(userResult.rows[0].esr_balance || '0');
        const requiredBalance = 100; // 100 ESR tokens required
        
        if (esrBalance < requiredBalance) {
          return res.status(400).json({ 
            error: `Insufficient ESR tokens. Required: ${requiredBalance}, Available: ${esrBalance.toFixed(2)}` 
          });
        }
        
        // Deduct ESR tokens
        await query(
          'UPDATE users SET esr_balance = esr_balance - $1 WHERE address = $2',
          [requiredBalance, userId]
        );
      } catch (balanceError) {
        console.error('[EMERGENCY] Error checking ESR balance:', balanceError);
        // Continue with deployment even if balance check fails
      }
    }
    
    // Deploy contract using emergency service
    const result = await emergencyDeploymentService.deployContract(
      contractType,
      constructorArgs,
      network,
      userId
    );
    
    // Save deployment to database
    try {
      await query(
        `INSERT INTO tokens 
        (contract_address, contract_type, name, symbol, decimals, initial_supply, max_supply, 
         owner_address, network_id, network_name, network_chain_id, transaction_hash, verified, features, deployment_method) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
        [
          result.contractAddress.toLowerCase(),
          contractType,
          constructorArgs[0], // name
          constructorArgs[1], // symbol
          constructorArgs[2], // decimals
          constructorArgs[3], // initialSupply
          constructorArgs[4], // maxSupply
          userId,
          network,
          network, // This would be the network name in a real implementation
          getChainId(network), // This would be the chain ID in a real implementation
          result.transactionHash,
          false, // Not verified yet
          JSON.stringify({
            burnable: contractType.includes('Burnable'),
            mintable: contractType.includes('Mintable'),
            transferFees: contractType.includes('Fee') ? {
              enabled: true,
              percentage: constructorArgs[5] / 100, // Convert from basis points
              recipient: constructorArgs[6]
            } : {
              enabled: false,
              percentage: 0,
              recipient: ''
            },
            holderRedistribution: contractType.includes('Redistribution') ? {
              enabled: true,
              percentage: contractType.includes('Advanced') ? constructorArgs[7] / 100 : constructorArgs[5] / 100
            } : {
              enabled: false,
              percentage: 0
            }
          }),
          'emergency' // Deployment method
        ]
      );
    } catch (dbError) {
      console.error('[EMERGENCY] Error saving deployment to database:', dbError);
      // Continue even if database save fails
    }
    
    // Return deployment details
    res.json({
      success: true,
      contractAddress: result.contractAddress,
      transactionHash: result.transactionHash,
      gasUsed: result.gasUsed,
      deploymentCost: result.deploymentCost,
      network,
      blockNumber: result.blockNumber,
      deploymentMethod: 'emergency'
    });
  } catch (error) {
    console.error('[EMERGENCY] Token deployment error:', error);
    res.status(500).json({ 
      error: 'Emergency deployment failed', 
      details: error.message 
    });
  }
});

// Get chain ID for network
function getChainId(network) {
  const chainIds = {
    'ethereum': 1,
    'bsc': 56,
    'polygon': 137,
    'arbitrum': 42161,
    'fantom': 250,
    'avalanche': 43114,
    'goerli': 5,
    'bsc-testnet': 97,
    'mumbai': 80001,
    'arbitrum-sepolia': 421614,
    'estar-testnet': 25062019
  };
  
  return chainIds[network] || 1;
}

module.exports = router;