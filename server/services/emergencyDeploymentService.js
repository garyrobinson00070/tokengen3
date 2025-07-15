const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const { ethers } = require('ethers');
const { promisify } = require('util');
const execAsync = promisify(exec);

/**
 * Emergency deployment service using Foundry
 */
class EmergencyDeploymentService {
  /**
   * Deploy a contract using Foundry
   * @param {string} contractType - The type of contract to deploy
   * @param {Array} constructorArgs - Constructor arguments
   * @param {string} network - Network to deploy to
   * @param {string} deployerAddress - Address of the deployer
   * @returns {Promise<Object>} - Deployment result
   */
  async deployContract(contractType, constructorArgs, network, deployerAddress) {
    try {
      console.log(`[EMERGENCY] Deploying ${contractType} to ${network} for ${deployerAddress}`);
      
      // Get RPC URL for the network
      const rpcEnvVar = `${network.toUpperCase()}_RPC_URL`;
      const rpcUrl = process.env[rpcEnvVar];
      
      if (!rpcUrl) {
        throw new Error(`RPC URL not configured for network: ${network}`);
      }
      
      // Get private key from environment
      const privateKey = process.env.EMERGENCY_DEPLOY_PRIVATE_KEY;
      
      if (!privateKey) {
        throw new Error('Emergency deployment private key not configured');
      }
      
      // Prepare constructor arguments for Foundry
      const formattedArgs = constructorArgs.map(arg => {
        if (arg === 'DEPLOYER_ADDRESS') {
          return deployerAddress;
        }
        
        if (typeof arg === 'string' && arg.startsWith('0x')) {
          return arg; // Address or bytes
        }
        
        if (typeof arg === 'string') {
          return `"${arg}"`; // String
        }
        
        return arg.toString(); // Number or boolean
      }).join(' ');
      
      // Create temporary script for Foundry deployment
      const scriptDir = path.join(__dirname, '..', '..', 'tmp');
      if (!fs.existsSync(scriptDir)) {
        fs.mkdirSync(scriptDir, { recursive: true });
      }
      
      const scriptPath = path.join(scriptDir, `deploy-${contractType}-${Date.now()}.sh`);
      
      // Write deployment script
      fs.writeFileSync(scriptPath, `#!/bin/bash
export PRIVATE_KEY=${privateKey}
export RPC_URL=${rpcUrl}

# Deploy contract using Foundry
forge create ./contracts/tokens/${contractType}.sol:${contractType} \\
  --rpc-url $RPC_URL \\
  --private-key $PRIVATE_KEY \\
  --constructor-args ${formattedArgs} \\
  --json
`);
      
      // Make script executable
      fs.chmodSync(scriptPath, '755');
      
      // Execute deployment script
      const { stdout, stderr } = await execAsync(scriptPath);
      
      // Clean up script
      fs.unlinkSync(scriptPath);
      
      if (stderr) {
        console.error(`[EMERGENCY] Deployment stderr: ${stderr}`);
      }
      
      // Parse deployment result
      const deploymentResult = JSON.parse(stdout);
      
      if (!deploymentResult.deployedTo) {
        throw new Error(`Deployment failed: ${stdout}`);
      }
      
      // Get transaction receipt
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const receipt = await provider.getTransactionReceipt(deploymentResult.transactionHash);
      
      return {
        success: true,
        contractAddress: deploymentResult.deployedTo,
        transactionHash: deploymentResult.transactionHash,
        gasUsed: receipt ? receipt.gasUsed.toString() : '0',
        deploymentCost: receipt ? (receipt.gasUsed * receipt.gasPrice).toString() : '0',
        network,
        blockNumber: receipt ? receipt.blockNumber : 0
      };
    } catch (error) {
      console.error('[EMERGENCY] Deployment failed:', error);
      throw error;
    }
  }
  
  /**
   * Check if Foundry is installed
   * @returns {Promise<boolean>} - True if Foundry is installed
   */
  async isFoundryInstalled() {
    try {
      await execAsync('forge --version');
      return true;
    } catch (error) {
      return false;
    }
  }
}

module.exports = new EmergencyDeploymentService();