const fs = require('fs');
const path = require('path');
const solc = require('solc');
const { execSync } = require('child_process');

// Contract types to export
const contractTypes = [
  'BasicToken',
  'BurnableToken',
  'MintableToken',
  'BurnableMintableToken',
  'FeeToken',
  'RedistributionToken',
  'AdvancedToken',
  'PresaleContract',
  'AntiBotPresaleContract',
  'TokenVesting',
  'LiquidityLocker',
  'MultiSender',
  'AutoLiquidity',
  'TokenGovernance'
];

// Ensure the exports directory exists
const exportsDir = path.join(__dirname, '..', 'src', 'contracts', 'exports');
if (!fs.existsSync(exportsDir)) {
  fs.mkdirSync(exportsDir, { recursive: true });
}

// Compile contracts using Hardhat
console.log('Compiling contracts with Hardhat...');
try {
  execSync('npx hardhat compile', { stdio: 'inherit' });
  console.log('Hardhat compilation successful');
} catch (error) {
  console.error('Hardhat compilation failed:', error);
  process.exit(1);
}

// Export artifacts from Hardhat compilation
console.log('Exporting contract artifacts...');
const artifactsDir = path.join(__dirname, '..', 'artifacts', 'contracts');

contractTypes.forEach(contractType => {
  try {
    // Find the contract artifact
    let artifactPath;
    if (contractType === 'PresaleContract' || contractType === 'AntiBotPresaleContract') {
      artifactPath = path.join(artifactsDir, 'presale', `${contractType}.sol`, `${contractType}.json`);
    } else if (contractType === 'TokenGovernance') {
      artifactPath = path.join(artifactsDir, 'governance', `${contractType}.sol`, `${contractType}.json`);
    } else if (contractType === 'LiquidityLocker' || contractType === 'AutoLiquidity') {
      artifactPath = path.join(artifactsDir, 'liquidity', `${contractType}.sol`, `${contractType}.json`);
    } else if (contractType === 'MultiSender') {
      artifactPath = path.join(artifactsDir, 'tools', `${contractType}.sol`, `${contractType}.json`);
    } else if (contractType === 'TokenVesting') {
      artifactPath = path.join(artifactsDir, 'vesting', `${contractType}.sol`, `${contractType}.json`);
    } else {
      artifactPath = path.join(artifactsDir, 'tokens', `${contractType}.sol`, `${contractType}.json`);
    }

    if (!fs.existsSync(artifactPath)) {
      console.warn(`Artifact not found for ${contractType} at ${artifactPath}`);
      return;
    }

    // Read the artifact
    const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));

    // Create export file with ABI and bytecode
    const exportData = {
      contractName: contractType,
      abi: artifact.abi,
      bytecode: artifact.bytecode
    };

    const exportPath = path.join(exportsDir, `${contractType}.json`);
    fs.writeFileSync(exportPath, JSON.stringify(exportData, null, 2));
    console.log(`Exported ${contractType} to ${exportPath}`);
  } catch (error) {
    console.error(`Error exporting ${contractType}:`, error);
  }
});

console.log('Contract export complete!');