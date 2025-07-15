const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const { ethers } = require('ethers');
const { authenticate } = require('../middleware/auth');
const { validateTokenConfig, validatePresaleConfig } = require('../middleware/validation');
const { query } = require('../db');
const { encrypt, decrypt } = require('../utils/encryption');

const router = express.Router();

// Network mapping for Hardhat
const NETWORK_MAPPING = {
  'ethereum': 'ethereum',
  'bsc': 'bsc',
  'polygon': 'polygon',
  'arbitrum': 'arbitrum',
  'fantom': 'fantom',
  'avalanche': 'avalanche',
  'goerli': 'goerli',
  'bsc-testnet': 'bscTestnet',
  'mumbai': 'mumbai',
  'arbitrum-sepolia': 'arbitrumSepolia',
  'estar-testnet': 'estarTestnet'
};

// Deploy token contract
router.post('/token', authenticate, validateTokenConfig, async (req, res) => {
  try {
    const { contractType, constructorArgs, network, verify = true, useFactory = false } = req.body;
    const userId = req.user.id;
    
    console.log(`Deploying ${contractType} for user ${userId} on ${network}`);
    
    // Map network name to Hardhat network
    const hardhatNetwork = NETWORK_MAPPING[network];
    if (!hardhatNetwork) {
      return res.status(400).json({ error: `Unsupported network: ${network}` });
    }
    
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
      } catch (balanceError) {
        console.error('Error checking ESR balance:', balanceError);
        // Continue with deployment even if balance check fails
      }
    }
    
    // Set environment variables for the deployment script
    const env = {
      ...process.env,
      CONTRACT_TYPE: contractType,
      CONSTRUCTOR_ARGS: JSON.stringify(constructorArgs),
      USE_FACTORY: useFactory ? "true" : "false",
      VERIFY: verify ? "true" : "false",
      DEPLOYER_ADDRESS: userId
    };
    
    // Run Hardhat deployment script
    const scriptPath = path.join(__dirname, '..', '..', 'scripts', 'deploy-token.js');
    const command = `npx hardhat run ${scriptPath} --network ${hardhatNetwork}`;
    
    console.log(`Executing: ${command}`);
    
    exec(command, { env, cwd: path.join(__dirname, '..', '..') }, async (error, stdout, stderr) => {
      if (error) {
        console.error(`Deployment error: ${error}`);
        console.error(`stderr: ${stderr}`);
        return res.status(500).json({ 
          error: 'Deployment failed', 
          details: error.message,
          stderr: stderr
        });
      }
      
      try {
        // Parse deployment result from stdout
        const lines = stdout.split('\n');
        const resultLine = lines.find(line => line.includes('Deployment result:'));
        
        if (!resultLine) {
          throw new Error('No deployment result found in output');
        }
        
        const result = JSON.parse(resultLine.replace('Deployment result:', '').trim());
        
        if (!result.success) {
          return res.status(500).json({ 
            error: 'Deployment failed', 
            details: result.error 
          });
        }
        
        // Save deployment to database
        try {
          await query(
            `INSERT INTO tokens 
            (contract_address, contract_type, name, symbol, decimals, initial_supply, max_supply, 
             owner_address, network_id, network_name, network_chain_id, transaction_hash, verified, features) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
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
              result.verified || false,
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
              })
            ]
          );
        } catch (dbError) {
          console.error('Error saving deployment to database:', dbError);
          // Continue even if database save fails
        }
        
        // Return deployment details
        res.json({
          success: true,
          contractAddress: result.contractAddress,
          transactionHash: result.transactionHash,
          gasUsed: result.gasUsed,
          deploymentCost: result.deploymentCost,
          network: hardhatNetwork,
          verified: result.verified,
          timestamp: new Date().toISOString()
        });
        
      } catch (parseError) {
        console.error('Error parsing deployment result:', parseError);
        console.error('stdout:', stdout);
        res.status(500).json({ 
          error: 'Failed to parse deployment result',
          details: parseError.message
        });
      }
    });
    
  } catch (error) {
    console.error('Token deployment error:', error);
    res.status(500).json({ error: error.message });
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

// Deploy presale contract
router.post('/presale', authenticate, validatePresaleConfig, async (req, res) => {
  try {
    const { presaleConfig, network, verify = true } = req.body;
    const userId = req.user.id;
    
    console.log(`Deploying presale for user ${userId} on ${network}`);
    
    // Map network name to Hardhat network
    const hardhatNetwork = NETWORK_MAPPING[network];
    if (!hardhatNetwork) {
      return res.status(400).json({ error: `Unsupported network: ${network}` });
    }
    
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
      } catch (balanceError) {
        console.error('Error checking ESR balance:', balanceError);
        // Continue with deployment even if balance check fails
      }
    }
    
    // Set environment variables for the deployment script
    const env = {
      ...process.env,
      PRESALE_CONFIG: JSON.stringify(presaleConfig),
      VERIFY: verify ? "true" : "false",
      DEPLOYER_ADDRESS: userId
    };
    
    // Run Hardhat deployment script
    const scriptPath = path.join(__dirname, '..', '..', 'scripts', 'deploy-presale.js');
    const command = `npx hardhat run ${scriptPath} --network ${hardhatNetwork}`;
    
    console.log(`Executing: ${command}`);
    
    exec(command, { env, cwd: path.join(__dirname, '..', '..') }, async (error, stdout, stderr) => {
      if (error) {
        console.error(`Presale deployment error: ${error}`);
        console.error(`stderr: ${stderr}`);
        return res.status(500).json({ 
          error: 'Presale deployment failed', 
          details: error.message,
          stderr: stderr
        });
      }
      
      try {
        // Parse deployment result from stdout
        const lines = stdout.split('\n');
        const resultLine = lines.find(line => line.includes('Deployment result:'));
        
        if (!resultLine) {
          throw new Error('No deployment result found in output');
        }
        
        const result = JSON.parse(resultLine.replace('Deployment result:', '').trim());
        
        if (!result.success) {
          return res.status(500).json({ 
            error: 'Presale deployment failed', 
            details: result.error 
          });
        }
        
        // Save deployment to database
        try {
          await query(
            `INSERT INTO presales 
            (contract_address, token_address, owner_address, sale_type, token_info, 
             sale_configuration, vesting_config, wallet_setup, network_id, network_name, 
             network_chain_id, transaction_hash, verified) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
            [
              result.contractAddress.toLowerCase(),
              presaleConfig.tokenInfo.tokenAddress.toLowerCase(),
              userId,
              presaleConfig.saleType,
              JSON.stringify(presaleConfig.tokenInfo),
              JSON.stringify(presaleConfig.saleConfiguration),
              JSON.stringify(presaleConfig.vestingConfig),
              JSON.stringify(presaleConfig.walletSetup),
              network,
              network, // This would be the network name in a real implementation
              getChainId(network),
              result.transactionHash,
              result.verified || false
            ]
          );
        } catch (dbError) {
          console.error('Error saving presale to database:', dbError);
          // Continue even if database save fails
        }
        
        // Return deployment details
        res.json({
          success: true,
          contractAddress: result.contractAddress,
          transactionHash: result.transactionHash,
          gasUsed: result.gasUsed,
          deploymentCost: result.deploymentCost,
          network: hardhatNetwork,
          verified: result.verified,
          salePageUrl: result.salePageUrl,
          timestamp: new Date().toISOString()
        });
        
      } catch (parseError) {
        console.error('Error parsing presale deployment result:', parseError);
        console.error('stdout:', stdout);
        res.status(500).json({ 
          error: 'Failed to parse presale deployment result',
          details: parseError.message
        });
      }
    });
    
  } catch (error) {
    console.error('Presale deployment error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get deployment status
router.get('/status/:txHash', authenticate, async (req, res) => {
  try {
    const { txHash } = req.params;
    const { network } = req.query;
    
    // Get network RPC URL
    const networkName = network || 'ethereum';
    const rpcUrl = process.env[`${networkName.toUpperCase()}_RPC_URL`];
    
    if (!rpcUrl) {
      return res.status(400).json({ error: `RPC URL not configured for network: ${networkName}` });
    }
    
    // Check transaction status on the blockchain
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    
    try {
      const tx = await provider.getTransaction(txHash);
      
      if (!tx) {
        return res.status(404).json({ error: 'Transaction not found' });
      }
      
      const receipt = await provider.getTransactionReceipt(txHash);
      
      if (!receipt) {
        return res.json({
          transactionHash: txHash,
          status: 'pending',
          confirmations: tx.confirmations || 0
        });
      }
      
      // Update transaction status in database
      try {
        await query(
          'UPDATE transactions SET status = $1, gas_used = $2, block_number = $3 WHERE transaction_hash = $4',
          [
            receipt.status === 1 ? 'confirmed' : 'failed',
            receipt.gasUsed.toString(),
            receipt.blockNumber,
            txHash
          ]
        );
      } catch (dbError) {
        console.error('Error updating transaction status in database:', dbError);
        // Continue even if database update fails
      }
      
      res.json({
        transactionHash: txHash,
        status: receipt.status === 1 ? 'confirmed' : 'failed',
        confirmations: receipt.confirmations || 0,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      });
    } catch (txError) {
      console.error('Error checking transaction status:', txError);
      res.status(500).json({ error: 'Failed to check transaction status', details: txError.message });
    }
    
  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Estimate gas for deployment
router.post('/estimate', authenticate, validateTokenConfig, async (req, res) => {
  try {
    const { contractType, constructorArgs, network, useFactory = false } = req.body;
    
    // Map network name to Hardhat network
    const hardhatNetwork = NETWORK_MAPPING[network];
    if (!hardhatNetwork) {
      return res.status(400).json({ error: `Unsupported network: ${network}` });
    }
    
    // Get network RPC URL
    const rpcUrl = process.env[`${network.toUpperCase()}_RPC_URL`];
    if (!rpcUrl) {
      return res.status(400).json({ error: `RPC URL not configured for network: ${network}` });
    }
    
    // Connect to network
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    
    // Get contract source
    const contractSourcePath = path.join(__dirname, '..', '..', 'contracts', 'tokens', `${contractType}.sol`);
    let contractSource;
    
    try {
      contractSource = fs.readFileSync(contractSourcePath, 'utf8');
    } catch (readError) {
      console.error(`Error reading contract source: ${readError}`);
      return res.status(500).json({ error: 'Failed to read contract source', details: readError.message });
    }
    
    // Compile contract
    const solc = require('solc');
    
    const input = {
      language: 'Solidity',
      sources: {
        'contract.sol': {
          content: contractSource
        }
      },
      settings: {
        outputSelection: {
          '*': {
            '*': ['abi', 'evm.bytecode', 'evm.gasEstimates']
          }
        },
        optimizer: {
          enabled: true,
          runs: 200
        }
      }
    };
    
    const output = JSON.parse(solc.compile(JSON.stringify(input)));
    
    if (output.errors) {
      const errors = output.errors.filter(error => error.severity === 'error');
      if (errors.length > 0) {
        return res.status(500).json({ 
          error: 'Compilation failed', 
          details: errors.map(e => e.message).join('\n') 
        });
      }
    }
    
    const contract = output.contracts['contract.sol'][contractType];
    const bytecode = contract.evm.bytecode.object;
    const abi = contract.abi;
    
    // Estimate gas
    try {
      // Get gas price
      const feeData = await provider.getFeeData();
      const gasPrice = feeData.gasPrice || ethers.parseUnits('50', 'gwei');
      
      // Estimate deployment gas
      let gasEstimate;
      
      if (useFactory) {
        // Factory deployment typically uses ~30% less gas
        const factoryGasReduction = 0.7; // 30% reduction
        
        // Create deployment transaction data
        const iface = new ethers.Interface(abi);
        const deployData = iface.encodeDeploy(constructorArgs);
        
        // Estimate gas for direct deployment
        const directGasEstimate = await provider.estimateGas({
          data: '0x' + bytecode + deployData.slice(2)
        });
        
        // Apply factory reduction
        gasEstimate = BigInt(Math.floor(Number(directGasEstimate) * factoryGasReduction));
      } else {
        // Create deployment transaction data
        const iface = new ethers.Interface(abi);
        const deployData = iface.encodeDeploy(constructorArgs);
        
        // Estimate gas
        gasEstimate = await provider.estimateGas({
          data: '0x' + bytecode + deployData.slice(2)
        });
      }
      
      // Calculate cost
      const gasCost = gasEstimate * gasPrice;
      const gasCostEther = ethers.formatEther(gasCost);
      
      // Get token price in USD (simplified)
      const tokenPrices = {
        'ethereum': 2500,
        'bsc': 300,
        'polygon': 0.80,
        'arbitrum': 2500,
        'fantom': 0.40,
        'avalanche': 30,
        'goerli': 0,
        'bsc-testnet': 0,
        'mumbai': 0,
        'arbitrum-sepolia': 0,
        'estar-testnet': 0
      };
      
      const tokenPrice = tokenPrices[network] || 0;
      const gasCostUsd = (parseFloat(gasCostEther) * tokenPrice).toFixed(2);
      
      // Estimate deployment time
      const deploymentTimes = {
        'ethereum': '2-5 minutes',
        'bsc': '30-60 seconds',
        'polygon': '30-60 seconds',
        'arbitrum': '30-60 seconds',
        'fantom': '15-30 seconds',
        'avalanche': '30-60 seconds',
        'goerli': '30-60 seconds',
        'bsc-testnet': '15-30 seconds',
        'mumbai': '15-30 seconds',
        'arbitrum-sepolia': '15-30 seconds',
        'estar-testnet': '5-15 seconds'
      };
      
      const timeEstimate = deploymentTimes[network] || '1-3 minutes';
      
      res.json({
        gasEstimate: gasEstimate.toString(),
        gasPrice: ethers.formatUnits(gasPrice, 'gwei'),
        gasCost: gasCostEther,
        gasCostUsd: `$${gasCostUsd}`,
        timeEstimate,
        useFactory
      });
    } catch (estimateError) {
      console.error('Gas estimation error:', estimateError);
      
      // Return fallback estimates
      res.json({
        gasEstimate: '3000000',
        gasPrice: '50',
        gasCost: '0.025',
        gasCostUsd: '$65',
        timeEstimate: '1-3 minutes',
        useFactory,
        error: 'Estimation failed, using fallback values'
      });
    }
    
  } catch (error) {
    console.error('Estimation error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;