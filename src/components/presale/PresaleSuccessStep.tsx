import React from 'react';
import { CheckCircle, ExternalLink, Copy, Share2, Settings, RefreshCw, Calendar, Users, ArrowLeft } from 'lucide-react';
import { PresaleDeploymentResult } from '../../types/presale';

interface PresaleSuccessStepProps {
  result: PresaleDeploymentResult;
  onStartNew: () => void;
}

export const PresaleSuccessStep: React.FC<PresaleSuccessStepProps> = ({ result, onStartNew }) => {
  const [copied, setCopied] = React.useState<string | null>(null);

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const shareContract = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Token Sale Deployed',
          text: `Check out my token sale: ${result.contractAddress}`,
          url: result.salePageUrl
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      copyToClipboard(result.salePageUrl, 'share');
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
          <h1 className="text-4xl font-bold text-white mb-2">Sale Deployed Successfully!</h1>
          <p className="text-gray-300 text-lg">
            Your token sale contract has been deployed and verified on {result.network.name}
          </p>
        </div>

        {/* Contract Details */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10 mb-8">
          <h2 className="text-2xl font-semibold text-white mb-6">Contract Details</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Sale Contract Address</label>
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
              <label className="block text-sm font-medium text-gray-300 mb-2">Deployment Cost</label>
              <div className="text-white font-medium">{result.deploymentCost} {result.network.symbol}</div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-green-400 font-medium">Deployed & Verified</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4">View Sale Page</h3>
            <p className="text-gray-300 text-sm mb-4">
              Visit your public sale page where participants can contribute
            </p>
            <a
              href={result.salePageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 w-full justify-center"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Open Sale Page</span>
            </a>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4">View on Explorer</h3>
            <p className="text-gray-300 text-sm mb-4">
              View your sale contract on the blockchain explorer
            </p>
            <a
              href={result.explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 w-full justify-center"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Open Explorer</span>
            </a>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4">Share Sale</h3>
            <p className="text-gray-300 text-sm mb-4">
              Share your token sale with potential participants
            </p>
            <button
              onClick={shareContract}
              className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 w-full justify-center"
            >
              <Share2 className="w-4 h-4" />
              <span>Share Sale</span>
            </button>
          </div>
        </div>

        {/* Management Actions */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10 mb-8">
          <h3 className="text-xl font-semibold text-white mb-4">Sale Management</h3>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Settings className="w-6 h-6 text-white" />
              </div>
              <h4 className="font-medium text-white mb-2">Manage Whitelist</h4>
              <p className="text-sm text-gray-300 mb-4">
                Add or remove addresses from the whitelist (Private Sales only)
              </p>
              <button className="text-blue-400 hover:text-blue-300 text-sm font-medium">
                Manage Whitelist →
              </button>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-600 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h4 className="font-medium text-white mb-2">View Participants</h4>
              <p className="text-sm text-gray-300 mb-4">
                Monitor sale progress and participant contributions
              </p>
              <button className="text-green-400 hover:text-green-300 text-sm font-medium">
                View Dashboard →
              </button>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10 mb-8">
          <h3 className="text-xl font-semibold text-white mb-4">Next Steps</h3>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Share2 className="w-6 h-6 text-white" />
              </div>
              <h4 className="font-medium text-white mb-2">Promote Your Sale</h4>
              <p className="text-sm text-gray-300">
                Share on social media, Discord, and Telegram to attract participants
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-600 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <h4 className="font-medium text-white mb-2">Monitor Progress</h4>
              <p className="text-sm text-gray-300">
                Track contributions and manage your sale through the dashboard
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center mx-auto mb-3">
                <ExternalLink className="w-6 h-6 text-white" />
              </div>
              <h4 className="font-medium text-white mb-2">Post-Sale Actions</h4>
              <p className="text-sm text-gray-300">
                Finalize sale, distribute tokens, and list on exchanges
              </p>
            </div>
          </div>
        </div>

        {/* Create Another Sale */}
        <div className="text-center">
          <button
            onClick={onStartNew}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200 flex items-center space-x-2 mx-auto"
          >
            <RefreshCw className="w-5 h-5" />
            <span>Create Another Sale</span>
          </button>
        </div>
      </div>
    </div>
  );
};