import React from 'react';
import { Shield, CheckCircle, AlertTriangle, ExternalLink, Copy } from 'lucide-react';
import { TokenManagementData } from '../../types/tokenManagement';

interface VerificationPanelProps {
  tokenData: TokenManagementData;
}

export const VerificationPanel: React.FC<VerificationPanelProps> = ({ tokenData }) => {
  const [copied, setCopied] = React.useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getExplorerUrl = () => {
    // This would be dynamic based on the network
    return `https://etherscan.io/token/${tokenData.address}`;
  };

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
      <div className="flex items-center space-x-3 mb-6">
        <Shield className="w-6 h-6 text-blue-400" />
        <h3 className="text-xl font-semibold text-white">Contract Verification</h3>
      </div>

      {/* Verification Status */}
      <div className="bg-white/5 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {tokenData.verified ? (
              <>
                <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-white">Contract Verified</h4>
                  <p className="text-green-400 text-sm">
                    Your contract source code has been verified on the blockchain explorer
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-white">Contract Not Verified</h4>
                  <p className="text-red-400 text-sm">
                    Your contract source code has not been verified yet
                  </p>
                </div>
              </>
            )}
          </div>
          
          <a
            href={getExplorerUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2"
          >
            <ExternalLink className="w-4 h-4" />
            <span>View on Explorer</span>
          </a>
        </div>
      </div>

      {/* Contract Information */}
      <div className="space-y-4">
        <div className="bg-white/5 rounded-lg p-4">
          <h5 className="font-medium text-white mb-3">Contract Details</h5>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Contract Address:</span>
              <div className="flex items-center space-x-2">
                <code className="text-white font-mono text-sm">
                  {tokenData.address.slice(0, 10)}...{tokenData.address.slice(-8)}
                </code>
                <button
                  onClick={() => copyToClipboard(tokenData.address)}
                  className="p-1 text-gray-400 hover:text-white transition-colors"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-300">Network:</span>
              <span className="text-white">{tokenData.network}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-300">Deployment Date:</span>
              <span className="text-white">
                {new Date(tokenData.deploymentDate).toLocaleDateString()}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-300">Contract Owner:</span>
              <code className="text-white font-mono text-sm">
                {tokenData.owner.slice(0, 6)}...{tokenData.owner.slice(-4)}
              </code>
            </div>
          </div>
          
          {copied && (
            <div className="text-green-400 text-sm mt-2">Address copied to clipboard!</div>
          )}
        </div>

        {/* Verification Benefits */}
        <div className="bg-blue-500/20 border border-blue-500/50 rounded-lg p-4">
          <h5 className="font-medium text-blue-400 mb-3">Benefits of Verification</h5>
          <ul className="text-blue-300 text-sm space-y-1">
            <li>• Increases trust and transparency for your token</li>
            <li>• Allows users to read and audit your contract source code</li>
            <li>• Enables better integration with DeFi protocols and exchanges</li>
            <li>• Provides proof that the deployed contract matches the source code</li>
            <li>• Required for many token listing applications</li>
          </ul>
        </div>

        {/* Re-verification */}
        {!tokenData.verified && (
          <div className="bg-amber-500/20 border border-amber-500/50 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5" />
              <div>
                <h5 className="font-medium text-amber-400 mb-1">Manual Verification Required</h5>
                <p className="text-amber-300 text-sm mb-3">
                  If automatic verification failed during deployment, you can manually verify your contract
                  on the blockchain explorer using the contract source code and constructor parameters.
                </p>
                <a
                  href={`${getExplorerUrl()}#code`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 text-amber-400 hover:text-amber-300 text-sm"
                >
                  <span>Verify on Explorer</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};