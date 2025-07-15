const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  try {
    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying presale contract with the account:", deployer.address);
    console.log("Account balance:", (await deployer.getBalance()).toString());

    // Get deployment parameters from environment variables
    const presaleConfig = JSON.parse(process.env.PRESALE_CONFIG || "{}");
    const shouldVerify = process.env.VERIFY === "true";
    const networkName = hre.network.name;

    console.log(`Deploying PresaleContract to ${networkName}`);
    console.log("Presale config:", presaleConfig);

    // Get contract factory
    const PresaleFactory = await hre.ethers.getContractFactory("PresaleContract");
    
    // Prepare constructor arguments
    const saleInfo = {
      token: presaleConfig.tokenInfo.tokenAddress,
      tokenPrice: hre.ethers.parseUnits(presaleConfig.saleConfiguration.tokenPrice, 18),
      softCap: hre.ethers.parseEther(presaleConfig.saleConfiguration.softCap),
      hardCap: hre.ethers.parseEther(presaleConfig.saleConfiguration.hardCap),
      minPurchase: hre.ethers.parseEther(presaleConfig.saleConfiguration.minPurchase),
      maxPurchase: hre.ethers.parseEther(presaleConfig.saleConfiguration.maxPurchase),
      startTime: Math.floor(new Date(presaleConfig.saleConfiguration.startDate).getTime() / 1000),
      endTime: Math.floor(new Date(presaleConfig.saleConfiguration.endDate).getTime() / 1000),
      whitelistEnabled: presaleConfig.saleConfiguration.whitelistEnabled
    };

    const vestingInfo = {
      enabled: presaleConfig.vestingConfig.enabled,
      initialRelease: presaleConfig.vestingConfig.initialRelease,
      vestingDuration: presaleConfig.vestingConfig.duration * 24 * 60 * 60 // Convert days to seconds
    };

    const constructorArgs = [
      saleInfo,
      vestingInfo,
      presaleConfig.walletSetup.saleReceiver,
      presaleConfig.walletSetup.refundWallet
    ];
    
    // Deploy contract
    console.log("Deploying presale contract...");
    const presale = await PresaleFactory.deploy(...constructorArgs);
    
    // Wait for deployment
    await presale.waitForDeployment();
    const contractAddress = await presale.getAddress();
    
    console.log("PresaleContract deployed to:", contractAddress);
    
    // Get deployment transaction
    const deploymentTx = presale.deploymentTransaction();
    const receipt = await deploymentTx.wait();
    
    console.log("Transaction hash:", deploymentTx.hash);
    console.log("Gas used:", receipt.gasUsed.toString());
    
    // Save deployment info
    const deploymentInfo = {
      contractType: "PresaleContract",
      contractAddress,
      transactionHash: deploymentTx.hash,
      gasUsed: receipt.gasUsed.toString(),
      network: networkName,
      chainId: hre.network.config.chainId,
      deployer: deployer.address,
      timestamp: new Date().toISOString(),
      presaleConfig,
      constructorArgs: [
        {
          token: saleInfo.token,
          tokenPrice: saleInfo.tokenPrice.toString(),
          softCap: saleInfo.softCap.toString(),
          hardCap: saleInfo.hardCap.toString(),
          minPurchase: saleInfo.minPurchase.toString(),
          maxPurchase: saleInfo.maxPurchase.toString(),
          startTime: saleInfo.startTime.toString(),
          endTime: saleInfo.endTime.toString(),
          whitelistEnabled: saleInfo.whitelistEnabled
        },
        vestingInfo,
        presaleConfig.walletSetup.saleReceiver,
        presaleConfig.walletSetup.refundWallet
      ]
    };
    
    // Create deployments directory if it doesn't exist
    const deploymentsDir = path.join(__dirname, "..", "deployments");
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }
    
    // Save deployment info to file
    const deploymentFile = path.join(deploymentsDir, `${networkName}-presale-${contractAddress}.json`);
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
    
    // Verify contract if requested
    if (shouldVerify && networkName !== "hardhat" && networkName !== "localhost") {
      console.log("Waiting for block confirmations...");
      await presale.deploymentTransaction().wait(5); // Wait for 5 confirmations
      
      console.log("Verifying contract...");
      try {
        await hre.run("verify:verify", {
          address: contractAddress,
          constructorArguments: constructorArgs,
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
      transactionHash: deploymentTx.hash,
      gasUsed: receipt.gasUsed.toString(),
      deploymentCost: (receipt.gasUsed * receipt.gasPrice).toString(),
      verified: deploymentInfo.verified || false,
      salePageUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/sale/${contractAddress}`
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