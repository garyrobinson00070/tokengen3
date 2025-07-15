import React from 'react';
import { CheckCircle, ExternalLink, Copy, Share2, Download, RefreshCw, ArrowLeft } from 'lucide-react';
import { DeploymentResult } from '../types';
import { TokenMetadataForm } from './TokenMetadataForm';

interface DeploymentSuccessProps {
  result: DeploymentResult;
  deploymentMethod?: 'primary' | 'fallback' | 'emergency';
  onStartNew: () => void;
}

export const DeploymentSuccess: React.FC<DeploymentSuccessProps> = ({ 
  result, 
  deploymentMethod = 'primary',
  onStartNew 
}) => {
  const [copied, setCopied] = React.useState<string | null>(null);
  const [showMetadataForm, setShowMetadataForm] = React.useState(false);
  const [pendingMetadata, setPendingMetadata] = React.useState<any>(null);

  // Check for pending metadata on component mount
  React.useEffect(() => {
    const storedMetadata = localStorage.getItem('pendingTokenMetadata');
    if (storedMetadata) {
      try {
        const metadata = JSON.parse(storedMetadata);
        // Update the token address with the actual deployed address
        metadata.tokenAddress = result.contractAddress;
        setPendingMetadata(metadata);
        setShowMetadataForm(true);
        // Clear the pending metadata from localStorage
        localStorage.removeItem('pendingTokenMetadata');
      } catch (error) {
        console.error('Error parsing pending metadata:', error);
      }
    }
  }, [result.contractAddress]);

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const shareContract = async () => {
    if (navigator.share) {
      try {
        // Use Web Share API if available
        await navigator.share({
          title: 'Token Contract Deployed',
          text: `Check out my new token contract: ${result.contractAddress}`,
          url: result.explorerUrl
        });
      } catch (err) {
        console.error('Error sharing:', err);
        // Fallback to clipboard if sharing fails
        copyToClipboard(result.explorerUrl, 'share');
      }
    } else {
      // Fallback for browsers without Web Share API
      copyToClipboard(result.explorerUrl, 'share');
    }
  };
  
  // Get deployment method label and color
  const getDeploymentMethodInfo = () => {
    switch (deploymentMethod) {
      case 'primary':
        return { label: 'Primary (Hardhat)', color: 'text-green-400 bg-green-500/20' };
      case 'fallback':
        return { label: 'Fallback (Frontend)', color: 'text-yellow-400 bg-yellow-500/20' };
      case 'emergency':
        return { label: 'Emergency (Backend)', color: 'text-red-400 bg-red-500/20' };
      default:
        return { label: 'Unknown', color: 'text-gray-400 bg-gray-500/20' };
    }
  };

  // Function to add token to MetaMask
  const addTokenToMetaMask = async () => {
    if (typeof window.ethereum === 'undefined') {
      alert('MetaMask is not installed');
      return;
    }
    
    try {
      // Request to add token to MetaMask
      await window.ethereum.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: {
            address: result.contractAddress,
            symbol: result.tokenSymbol || 'TOKEN', // Use token symbol if available
            decimals: result.tokenDecimals || 18,   // Use token decimals if available
            image: 'https://example.com/token-logo.png' // Optional token logo
          }
        }
      });
    } catch (error) {
      console.error('Error adding token to MetaMask:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Back to Home Button */}
        <div className="mb-6">
          <button
            onClick={() => window.location.href = '/'}
            className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </button>
        </div>
        
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Token Deployed Successfully!</h1>
          <p className="text-gray-300 text-lg">
            Your token contract has been deployed and verified on {result.network.name}
            {deploymentMethod !== 'primary' && (
              <span className={`ml-2 px-3 py-1 rounded-full text-sm ${getDeploymentMethodInfo().color}`}>
                {getDeploymentMethodInfo().label}
              </span>
            )}
          </p>
        </div>

        {/* Contract Details */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10 mb-8">
          <h2 className="text-2xl font-semibold text-white mb-6">Contract Details</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Contract Address</label>
              <div className="flex items-center space-x-2 bg-white/10 rounded-lg p-3">
                <code className="text-white font-mono text-sm flex-1">
                  {result.contractAddress}
                </code>
                <button
                  onClick={() => copyToClipboard(result.contractAddress, 'address')}
                  className="p-1 text-gray-400 hover:text-white transition-colors"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              {copied === 'address' && <p className="text-green-400 text-sm mt-1">Copied!</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Transaction Hash</label>
              <div className="flex items-center space-x-2 bg-white/10 rounded-lg p-3">
                <code className="text-white font-mono text-sm flex-1">
                  {result.transactionHash.slice(0, 20)}...
                </code>
                <button
                  onClick={() => copyToClipboard(result.transactionHash, 'tx')}
                  className="p-1 text-gray-400 hover:text-white transition-colors"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              {copied === 'tx' && <p className="text-green-400 text-sm mt-1">Copied!</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Network</label>
              <div className="text-white font-medium">{result.network.name}</div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Gas Used</label>
              <div className="text-white font-medium">{result.gasUsed}</div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Deployment Method</label>
              <div className={`px-3 py-1 rounded-lg inline-block ${getDeploymentMethodInfo().color}`}>
                {getDeploymentMethodInfo().label}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Deployment Cost</label>
              <div className="text-white font-medium">{result.deploymentCost} {result.network.symbol}</div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-green-400 font-medium">Verified</span>
              </div>
            </div>
          </div>
        </div>

        {/* Token Metadata Form */}
        {showMetadataForm && (
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10 mb-8">
            <h2 className="text-2xl font-semibold text-white mb-6">Complete Token Metadata</h2>
            <p className="text-gray-300 mb-6">
              Add metadata to your token to make it more discoverable and professional.
              This information will be displayed in token explorers and DEXs.
            </p>
            
            <TokenMetadataForm
              tokenAddress={result.contractAddress}
              tokenName={pendingMetadata?.name || ''}
              tokenSymbol={pendingMetadata?.symbol || ''}
              isOwner={true}
              onMetadataUpdate={() => setShowMetadataForm(false)}
            />
          </div>
        )}

        {/* Actions */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4">View on Explorer</h3>
            <p className="text-gray-300 text-sm mb-4">
              View your token contract on the blockchain explorer
            </p>
            <a
              href={result.explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 w-full justify-center"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Open {result.network.name === 'Ethereum' ? 'Etherscan' : 
                result.network.name === 'Binance Smart Chain' ? 'BscScan' : 
                `${result.network.name} Explorer`}</span>
            </a>
          </div>
          
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4">Add to Wallet</h3>
            <p className="text-gray-300 text-sm mb-4">
              Add your token to MetaMask or other wallets for easy access
            </p>
            <button
              onClick={addTokenToMetaMask}
              className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 w-full justify-center"
            >
              <img src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg" alt="MetaMask" className="w-4 h-4" />
              <span>Add to MetaMask</span>
            </button>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4">Manage Token</h3>
            <p className="text-gray-300 text-sm mb-4">
              Access token management features like minting, burning, and fee configuration
            </p>
            <a
              href={`/manage/${result.contractAddress}`}
              onClick={() => window.location.href = `/manage/${result.contractAddress}`}
              className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 w-full justify-center"
            >
              <Settings className="w-4 h-4" />
              <span>Manage Token</span>
            </a>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4">Share Contract</h3>
            <p className="text-gray-300 text-sm mb-4">
              Share your token contract with others
            </p>
            <button
              onClick={shareContract}
              className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 w-full justify-center"
            >
              <Share2 className="w-4 h-4" />
              <span>Share Contract</span>
            </button>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10 mb-8">
          <h3 className="text-xl font-semibold text-white mb-4">Next Steps</h3>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mx-auto mb-3">
                <ExternalLink className="w-6 h-6 text-white" />
              </div>
              <h4 className="font-medium text-white mb-2">Add to Wallet</h4>
              <p className="text-sm text-gray-300">
                Import your token to MetaMask or other wallets using the contract address
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-600 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Download className="w-6 h-6 text-white" />
              </div>
              <h4 className="font-medium text-white mb-2">Create Logo</h4>
              <p className="text-sm text-gray-300">
                Add a logo to your token for better recognition on exchanges
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Share2 className="w-6 h-6 text-white" />
              </div>
              <h4 className="font-medium text-white mb-2">List on DEX</h4>
              <p className="text-sm text-gray-300">
                Create liquidity pools on Uniswap, PancakeSwap, or other DEXs
              </p>
            </div>
          </div>
        </div>

        {/* Create Another Token */}
        <div className="text-center">
          <button
            onClick={onStartNew}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200 flex items-center space-x-2 mx-auto"
          >
            <RefreshCw className="w-5 h-5" />
            <span>Create Another Token</span>
          </button>
        </div>
      </div>
    </div>
  );
};