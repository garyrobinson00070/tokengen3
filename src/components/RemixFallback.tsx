import React, { useState } from 'react';
import { 
  Download, 
  ExternalLink, 
  Copy, 
  FileText, 
  Code, 
  AlertTriangle,
  CheckCircle,
  Folder,
  File
} from 'lucide-react';
import { TokenConfig } from '../types';

interface RemixFallbackProps {
  config: TokenConfig;
  onBack: () => void;
}

interface ContractFile {
  name: string;
  path: string;
  content: string;
  abi?: any[];
}

export const RemixFallback: React.FC<RemixFallbackProps> = ({ config, onBack }) => {
  const [copied, setCopied] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const getContractType = () => {
    const features = config.features;
    
    if (features.burnable && features.mintable && 
        (features.transferFees.enabled || features.holderRedistribution.enabled)) {
      return 'AdvancedToken';
    } else if (features.burnable && features.mintable) {
      return 'BurnableMintableToken';
    } else if (features.burnable) {
      return 'BurnableToken';
    } else if (features.mintable) {
      return 'MintableToken';
    } else if (features.transferFees.enabled) {
      return 'FeeToken';
    } else if (features.holderRedistribution.enabled) {
      return 'RedistributionToken';
    } else {
      return 'BasicToken';
    }
  };

  const generateConstructorParams = () => {
    const contractType = getContractType();
    const baseParams = [
      `"${config.name}"`, // name
      `"${config.symbol}"`, // symbol
      config.decimals.toString(), // decimals
      config.initialSupply, // initialSupply
      config.maxSupply || '0', // maxSupply (0 for unlimited)
    ];

    switch (contractType) {
      case 'FeeToken':
        return [
          ...baseParams,
          (config.features.transferFees.percentage * 100).toString(), // feePercentage (in basis points)
          `"${config.features.transferFees.recipient}"`, // feeRecipient
          '"YOUR_WALLET_ADDRESS"' // owner
        ];
      case 'RedistributionToken':
        return [
          ...baseParams,
          (config.features.holderRedistribution.percentage * 100).toString(), // redistributionPercentage
          '"YOUR_WALLET_ADDRESS"' // owner
        ];
      case 'AdvancedToken':
        return [
          ...baseParams,
          (config.features.transferFees.percentage * 100).toString(), // feePercentage
          `"${config.features.transferFees.recipient}"`, // feeRecipient
          (config.features.holderRedistribution.percentage * 100).toString(), // redistributionPercentage
          '"YOUR_WALLET_ADDRESS"' // owner
        ];
      default:
        return [
          ...baseParams,
          '"YOUR_WALLET_ADDRESS"' // owner
        ];
    }
  };

  const getContractFiles = (): ContractFile[] => {
    const contractType = getContractType();
    const constructorParams = generateConstructorParams();
    
    const files: ContractFile[] = [
      {
        name: `${contractType}.sol`,
        path: `contracts/tokens/${contractType}.sol`,
        content: `// Deploy this contract on Remix IDE
// Constructor parameters:
// ${constructorParams.map((param, i) => `// ${i + 1}. ${param}`).join('\n// ')}

// Copy the contract code from: src/contracts/tokens/${contractType}.sol`
      }
    ];

    // Add vesting contract if needed
    if (config.vesting.length > 0) {
      files.push({
        name: 'TokenVesting.sol',
        path: 'contracts/vesting/TokenVesting.sol',
        content: `// Token Vesting Contract
// Deploy after your main token contract
// Constructor parameter: YOUR_TOKEN_CONTRACT_ADDRESS

// Copy the contract code from: src/contracts/vesting/TokenVesting.sol`
      });
    }

    return files;
  };

  const getABIFiles = () => {
    const contractType = getContractType();
    const files = [contractType];
    
    if (config.vesting.length > 0) {
      files.push('TokenVesting');
    }
    
    return files;
  };

  const downloadFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadAllFiles = async () => {
    const contractType = getContractType();
    
    // Create a zip-like structure with all files
    const files = [
      {
        name: `${contractType}.sol`,
        content: await fetch(`/src/contracts/tokens/${contractType}.sol`).then(r => r.text()).catch(() => 
          `// Contract file not found. Please copy from src/contracts/tokens/${contractType}.sol`
        )
      },
      {
        name: `${contractType}.json`,
        content: await fetch(`/src/abis/${contractType}.json`).then(r => r.text()).catch(() => 
          `// ABI file not found. Please copy from src/abis/${contractType}.json`
        )
      }
    ];

    if (config.vesting.length > 0) {
      files.push(
        {
          name: 'TokenVesting.sol',
          content: await fetch('/src/contracts/vesting/TokenVesting.sol').then(r => r.text()).catch(() => 
            '// Vesting contract file not found. Please copy from src/contracts/vesting/TokenVesting.sol'
          )
        },
        {
          name: 'TokenVesting.json',
          content: await fetch('/src/abis/TokenVesting.json').then(r => r.text()).catch(() => 
            '// Vesting ABI file not found. Please copy from src/abis/TokenVesting.json'
          )
        }
      );
    }

    // Download each file individually (since we can't create actual zip in browser)
    files.forEach(file => {
      downloadFile(file.name, file.content);
    });
  };

  const contractFiles = getContractFiles();
  const abiFiles = getABIFiles();
  const contractType = getContractType();
  const constructorParams = generateConstructorParams();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors mb-6"
          >
            <span>← Back to Review</span>
          </button>
          
          <h1 className="text-3xl font-bold text-white mb-2">Remix IDE Deployment</h1>
          <p className="text-gray-300">Deploy your token contract manually using Remix IDE</p>
        </div>

        {/* Warning Banner */}
        <div className="bg-amber-500/20 border border-amber-500/50 rounded-xl p-6 mb-8">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5" />
            <div>
              <h3 className="font-medium text-amber-400 mb-1">Manual Deployment Required</h3>
              <p className="text-amber-300 text-sm">
                Automatic deployment failed. Please use Remix IDE to deploy your contract manually. 
                Follow the step-by-step instructions below.
              </p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Instructions */}
          <div className="lg:col-span-2 space-y-6">
            {/* Step 1: Open Remix */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                  1
                </div>
                <h2 className="text-xl font-semibold text-white">Open Remix IDE</h2>
              </div>
              
              <p className="text-gray-300 mb-4">
                Open Remix IDE in your browser and create a new workspace for your token contract.
              </p>
              
              <a
                href="https://remix.ethereum.org"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 w-fit"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Open Remix IDE</span>
              </a>
            </div>

            {/* Step 2: Copy Contract */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                  2
                </div>
                <h2 className="text-xl font-semibold text-white">Copy Contract Code</h2>
              </div>
              
              <p className="text-gray-300 mb-4">
                Create a new file in Remix and copy the contract code for your token type: <strong>{contractType}</strong>
              </p>
              
              <div className="bg-black/30 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-300">Contract Type: {contractType}</span>
                  <button
                    onClick={() => copyToClipboard(`src/contracts/tokens/${contractType}.sol`, 'contract-path')}
                    className="text-blue-400 hover:text-blue-300 text-sm flex items-center space-x-1"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Copy Path</span>
                  </button>
                </div>
                <code className="text-green-400 text-sm">src/contracts/tokens/{contractType}.sol</code>
              </div>
              
              {copied === 'contract-path' && (
                <div className="text-green-400 text-sm mb-2">Path copied to clipboard!</div>
              )}
            </div>

            {/* Step 3: Configure Constructor */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                  3
                </div>
                <h2 className="text-xl font-semibold text-white">Constructor Parameters</h2>
              </div>
              
              <p className="text-gray-300 mb-4">
                When deploying, use these constructor parameters in the exact order shown:
              </p>
              
              <div className="bg-black/30 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-300">Constructor Parameters</span>
                  <button
                    onClick={() => copyToClipboard(constructorParams.join(', '), 'constructor')}
                    className="text-blue-400 hover:text-blue-300 text-sm flex items-center space-x-1"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Copy All</span>
                  </button>
                </div>
                <div className="space-y-1">
                  {constructorParams.map((param, index) => (
                    <div key={index} className="text-sm">
                      <span className="text-blue-400">{index + 1}.</span>
                      <span className="text-green-400 ml-2">{param}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              {copied === 'constructor' && (
                <div className="text-green-400 text-sm mt-2">Parameters copied to clipboard!</div>
              )}
              
              <div className="mt-4 p-3 bg-blue-500/20 rounded-lg">
                <p className="text-blue-300 text-sm">
                  <strong>Important:</strong> Replace "YOUR_WALLET_ADDRESS" with your actual wallet address before deploying.
                </p>
              </div>
            </div>

            {/* Step 4: Compile & Deploy */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                  4
                </div>
                <h2 className="text-xl font-semibold text-white">Compile & Deploy</h2>
              </div>
              
              <div className="space-y-3 text-gray-300">
                <div className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-400 mt-0.5" />
                  <span className="text-sm">Compile the contract using Solidity compiler 0.8.19+</span>
                </div>
                <div className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-400 mt-0.5" />
                  <span className="text-sm">Connect your wallet (MetaMask) to the correct network</span>
                </div>
                <div className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-400 mt-0.5" />
                  <span className="text-sm">Deploy with the constructor parameters above</span>
                </div>
                <div className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-400 mt-0.5" />
                  <span className="text-sm">Save the deployed contract address for verification</span>
                </div>
              </div>
            </div>

            {/* Vesting Instructions */}
            {config.vesting.length > 0 && (
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white font-bold">
                    5
                  </div>
                  <h2 className="text-xl font-semibold text-white">Deploy Vesting Contract</h2>
                </div>
                
                <p className="text-gray-300 mb-4">
                  Your token configuration includes vesting schedules. Deploy the TokenVesting contract separately:
                </p>
                
                <div className="space-y-3">
                  {config.vesting.map((vest, index) => (
                    <div key={index} className="bg-purple-500/20 rounded-lg p-3">
                      <div className="text-purple-300 font-medium">{vest.category}</div>
                      <div className="text-sm text-purple-200">
                        {vest.percentage}% • {vest.duration} days • Start: {new Date(vest.startDate).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Download */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4">Quick Download</h3>
              
              <button
                onClick={downloadAllFiles}
                className="w-full bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2 mb-4"
              >
                <Download className="w-4 h-4" />
                <span>Download All Files</span>
              </button>
              
              <p className="text-gray-300 text-sm">
                Downloads contract source code and ABI files for your token configuration.
              </p>
            </div>

            {/* File Structure */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4">File Structure</h3>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Folder className="w-4 h-4 text-blue-400" />
                  <span className="text-white text-sm">contracts/</span>
                </div>
                
                {contractFiles.map((file, index) => (
                  <div key={index} className="ml-6 flex items-center space-x-2">
                    <File className="w-4 h-4 text-green-400" />
                    <span className="text-gray-300 text-sm">{file.name}</span>
                  </div>
                ))}
                
                <div className="flex items-center space-x-2 mt-3">
                  <Folder className="w-4 h-4 text-purple-400" />
                  <span className="text-white text-sm">abis/</span>
                </div>
                
                {abiFiles.map((file, index) => (
                  <div key={index} className="ml-6 flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-orange-400" />
                    <span className="text-gray-300 text-sm">{file}.json</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Network Info */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4">Network Configuration</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-300">Network:</span>
                  <span className="text-white font-medium">{config.network.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Chain ID:</span>
                  <span className="text-white font-medium">{config.network.chainId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Symbol:</span>
                  <span className="text-white font-medium">{config.network.symbol}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Explorer:</span>
                  <a 
                    href={config.network.explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 text-sm"
                  >
                    View Explorer
                  </a>
                </div>
              </div>
            </div>

            {/* Help */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4">Need Help?</h3>
              
              <div className="space-y-3 text-sm">
                <a 
                  href="https://remix-ide.readthedocs.io/en/latest/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-blue-400 hover:text-blue-300"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Remix Documentation</span>
                </a>
                
                <a 
                  href="https://docs.openzeppelin.com/contracts/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-blue-400 hover:text-blue-300"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>OpenZeppelin Docs</span>
                </a>
                
                <a 
                  href="https://ethereum.org/en/developers/docs/smart-contracts/deploying/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-blue-400 hover:text-blue-300"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Deployment Guide</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};