const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  try {
    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);
    console.log("Account balance:", (await deployer.getBalance()).toString());

    // Get deployment parameters from environment variables 
    const contractType = process.env.CONTRACT_TYPE;
    const constructorArgs = JSON.parse(process.env.CONSTRUCTOR_ARGS || "[]");
    const shouldVerify = process.env.VERIFY === "true";
    const useFactory = process.env.USE_FACTORY === "true";
    const networkName = hre.network.name;

    console.log(`Deploying ${contractType} to ${networkName}`);
    console.log("Constructor args:", constructorArgs);
    console.log("Using factory:", useFactory);
    
    let contract;
    let deploymentTx;
    
    if (useFactory) {
      // Deploy using factory
      console.log("Deploying using TokenFactory...");
      
      // Check if factory exists for this network
      let factoryAddress;
      const factoryDeploymentsDir = path.join(__dirname, "..", "deployments", "factories");
      if (fs.existsSync(factoryDeploymentsDir)) {
        const factoryFiles = fs.readdirSync(factoryDeploymentsDir);
        for (const file of factoryFiles) {
          if (file.startsWith(networkName) && file.endsWith('.json')) {
            try {
              const factoryData = JSON.parse(fs.readFileSync(path.join(factoryDeploymentsDir, file), 'utf8'));
              factoryAddress = factoryData.address;
              break;
            } catch (error) {
              console.error(`Error reading factory file ${file}:`, error);
            }
          }
        }
      }
      
      // If factory doesn't exist, deploy it
      if (!factoryAddress) {
        console.log("Factory not found for this network, deploying new factory...");
        const TokenFactory = await hre.ethers.getContractFactory("TokenFactory");
        const factory = await TokenFactory.deploy(deployer.address);
        await factory.waitForDeployment();
        factoryAddress = await factory.getAddress();
        
        // Save factory deployment info
        if (!fs.existsSync(factoryDeploymentsDir)) {
          fs.mkdirSync(factoryDeploymentsDir, { recursive: true });
        }
        
        const factoryDeploymentFile = path.join(factoryDeploymentsDir, `${networkName}-factory.json`);
        fs.writeFileSync(factoryDeploymentFile, JSON.stringify({
          address: factoryAddress,
          deployer: deployer.address,
          network: networkName,
          timestamp: new Date().toISOString()
        }, null, 2));
        
        console.log(`TokenFactory deployed to: ${factoryAddress}`);
      } else {
        console.log(`Using existing factory at: ${factoryAddress}`);
      }
      
      // Create token using factory
      const factory = await hre.ethers.getContractAt("TokenFactory", factoryAddress);
      
      // Determine which factory method to call based on contract type
      let tx;
      switch (contractType) {
        case 'BasicToken':
          tx = await factory.createBasicToken(...constructorArgs);
          break;
        case 'BurnableToken':
          tx = await factory.createBurnableToken(...constructorArgs);
          break;
        case 'MintableToken':
          tx = await factory.createMintableToken(...constructorArgs);
          break;
        case 'BurnableMintableToken':
          tx = await factory.createBurnableMintableToken(...constructorArgs);
          break;
        case 'FeeToken':
          tx = await factory.createFeeToken(...constructorArgs);
          break;
        case 'RedistributionToken':
          tx = await factory.createRedistributionToken(...constructorArgs);
          break;
        case 'AdvancedToken':
          tx = await factory.createAdvancedToken(...constructorArgs);
          break;
        default:
          throw new Error(`Unsupported contract type for factory: ${contractType}`);
      }
      
      // Wait for transaction
      const receipt = await tx.wait();
      
      // Find token address from event logs
      const tokenCreatedEvent = receipt.logs.find(log => {
        try {
          const parsedLog = factory.interface.parseLog(log);
          return parsedLog && parsedLog.name === 'TokenCreated';
        } catch (e) {
          return false;
        }
      });
      
      if (!tokenCreatedEvent) {
        throw new Error('Failed to find token address in event logs');
      }
      
      const parsedEvent = factory.interface.parseLog(tokenCreatedEvent);
      const contractAddress = parsedEvent.args[1];
      
      // Get contract instance
      contract = await hre.ethers.getContractAt(contractType, contractAddress);
      deploymentTx = tx;
      
      console.log(`${contractType} deployed to:`, contractAddress);
      console.log("Transaction hash:", tx.hash);
    } else {
      // Direct deployment
      console.log("Deploying directly...");

      // Get contract factory
      const ContractFactory = await hre.ethers.getContractFactory(contractType);
      
      // Deploy contract
      console.log("Deploying contract...");
      contract = await ContractFactory.deploy(...constructorArgs);
      
      // Wait for deployment
      await contract.waitForDeployment();
      const contractAddress = await contract.getAddress();
      
      console.log(`${contractType} deployed to:`, contractAddress);
      
      // Get deployment transaction
      deploymentTx = contract.deploymentTransaction();
      
      console.log("Transaction hash:", deploymentTx.hash);
    }
    
    // Get transaction receipt
    const receipt = await deploymentTx.wait();
    
    console.log("Gas used:", receipt.gasUsed.toString());
    
    // Save deployment info
    const deploymentInfo = {
      contractType,
      contractAddress,
      transactionHash: deploymentTx.hash,
      gasUsed: receipt.gasUsed.toString(),
      network: networkName,
      chainId: hre.network.config.chainId,
      deployer: deployer.address,
      timestamp: new Date().toISOString(),
      constructorArgs
    };
    
    // Create deployments directory if it doesn't exist
    const deploymentsDir = path.join(__dirname, "..", "deployments");
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }
    
    // Save deployment info to file
    const deploymentFile = path.join(deploymentsDir, `${networkName}-${contractAddress}.json`);
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));

    // Add a delay before verification to ensure the contract is fully deployed
    if (shouldVerify && networkName !== "hardhat" && networkName !== "localhost") {
      console.log("Waiting for block confirmations before verification...");
    
    // Verify contract if requested
    if (shouldVerify && networkName !== "hardhat" && networkName !== "localhost") {
      console.log("Waiting for block confirmations...");
      // Different networks need different confirmation counts
      const confirmations = {
        'ethereum': 5,
        'bsc': 15,
        'polygon': 10,
        'arbitrum': 5,
        'fantom': 5,
        'avalanche': 5,
        'goerli': 3,
        'bsc-testnet': 5,
        'mumbai': 5,
        'arbitrum-sepolia': 3,
        'estar-testnet': 3
      };
      
      const confirmationCount = confirmations[networkName] || 5;
      await contract.deploymentTransaction().wait(confirmationCount);
      
      console.log("Verifying contract...");
      try {
        await hre.run("verify:verify", {
          address: contractAddress,
          constructorArguments: constructorArgs,
        });
        console.log("Contract verified successfully");
        deploymentInfo.verified = true;
      } catch (error) {
        console.error("Verification failed:", error);
        deploymentInfo.verified = false;
        deploymentInfo.verificationError = error.message;
        
        // Try verification again with a delay
        console.log("Retrying verification after delay...");
        await new Promise(resolve => setTimeout(resolve, 10000));
        
        try {
          await hre.run("verify:verify", {
            address: contractAddress,
            constructorArguments: constructorArgs,
          });
          console.log("Contract verified successfully on second attempt");
          deploymentInfo.verified = true;
          delete deploymentInfo.verificationError;
        } catch (retryError) {
          console.error("Verification retry failed:", retryError.message);
          deploymentInfo.verificationError = `${error.message}. Retry failed: ${retryError.message}`;
        }
      }
      
      // Update deployment file with verification status
      fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
    }
    
    // Return deployment result
    const result = {
      success: true,
      contractAddress,
      transactionHash: deploymentTx.hash,
      gasUsed: receipt.gasUsed.toString(),
      deploymentCost: (receipt.gasUsed * receipt.gasPrice).toString(),
      verified: deploymentInfo.verified || false
    };
    
    console.log("Deployment result:", JSON.stringify(result));
    return result;
    
  } catch (error) {
    console.error("Deployment failed:", error);
    const result = {
      success: false,
      error: error.message
    };
    console.log("Deployment result:", JSON.stringify(result));
    throw error;
  }
}

// Handle both direct execution and module export
if (require.main === module) {
  main()
    .then((result) => {
      process.exit(0);
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
} else {
  module.exports = main;
}