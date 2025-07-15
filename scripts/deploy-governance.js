const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  try {
    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);
    console.log("Account balance:", (await deployer.getBalance()).toString());

    // Get deployment parameters from environment variables
    const tokenAddress = process.env.TOKEN_ADDRESS;
    const shouldVerify = process.env.VERIFY === "true";
    const networkName = hre.network.name;

    if (!tokenAddress) {
      throw new Error("TOKEN_ADDRESS environment variable is required");
    }

    console.log(`Deploying TokenGovernance to ${networkName} for token ${tokenAddress}`);

    // Get contract factory
    const TokenGovernanceFactory = await hre.ethers.getContractFactory("TokenGovernance");
    
    // Deploy contract
    console.log("Deploying governance contract...");
    const governance = await TokenGovernanceFactory.deploy(tokenAddress);
    
    // Wait for deployment
    await governance.waitForDeployment();
    const contractAddress = await governance.getAddress();
    
    console.log("TokenGovernance deployed to:", contractAddress);
    
    // Get deployment transaction
    const deploymentTx = governance.deploymentTransaction();
    const receipt = await deploymentTx.wait();
    
    console.log("Transaction hash:", deploymentTx.hash);
    console.log("Gas used:", receipt.gasUsed.toString());
    
    // Save deployment info
    const deploymentInfo = {
      contractType: "TokenGovernance",
      contractAddress,
      tokenAddress,
      transactionHash: deploymentTx.hash,
      gasUsed: receipt.gasUsed.toString(),
      network: networkName,
      chainId: hre.network.config.chainId,
      deployer: deployer.address,
      timestamp: new Date().toISOString()
    };
    
    // Create deployments directory if it doesn't exist
    const deploymentsDir = path.join(__dirname, "..", "deployments");
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }
    
    // Save deployment info to file
    const deploymentFile = path.join(deploymentsDir, `${networkName}-governance-${contractAddress}.json`);
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
    
    // Verify contract if requested
    if (shouldVerify && networkName !== "hardhat" && networkName !== "localhost") {
      console.log("Waiting for block confirmations...");
      await governance.deploymentTransaction().wait(5); // Wait for 5 confirmations
      
      console.log("Verifying contract...");
      try {
        await hre.run("verify:verify", {
          address: contractAddress,
          constructorArguments: [tokenAddress],
        });
        console.log("Contract verified successfully");
        deploymentInfo.verified = true;
      } catch (error) {
        console.error("Verification failed:", error.message);
        deploymentInfo.verified = false;
        deploymentInfo.verificationError = error.message;
      }
      
      // Update deployment file with verification status
      fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
    }
    
    // Return deployment result
    const result = {
      success: true,
      contractAddress,
      tokenAddress,
      transactionHash: deploymentTx.hash,
      gasUsed: receipt.gasUsed.toString(),
      deploymentCost: (receipt.gasUsed * receipt.gasPrice).toString(),
      verified: deploymentInfo.verified || false,
      governanceUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/governance/${tokenAddress}`
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