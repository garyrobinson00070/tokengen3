import React from 'react';
import { AlertTriangle, ArrowRight, ExternalLink } from 'lucide-react';
import { Network } from '../types';

interface NetworkMismatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentChainId: number | null;
  targetNetwork: Network;
  onSwitchNetwork: () => Promise<void>;
  isAttemptingSwitch: boolean;
  switchError: string | null;
}

export const NetworkMismatchModal: React.FC<NetworkMismatchModalProps> = ({
  isOpen,
  onClose,
  currentChainId,
  targetNetwork,
  onSwitchNetwork,
  isAttemptingSwitch,
  switchError
}) => {
  if (!isOpen) return null;

  const getNetworkName = (id: number | null) => {
    if (id === null) return 'Unknown';
    
    const networks: Record<number, string> = {
      1: 'Ethereum',
      5: 'Goerli',
      56: 'BSC',
      97: 'BSC Testnet',
      137: 'Polygon',
      80001: 'Mumbai',
      42161: 'Arbitrum',
      421614: 'Arbitrum Sepolia',
      250: 'Fantom',
      4002: 'Fantom Testnet',
      43114: 'Avalanche',
      43113: 'Avalanche Fuji',
      25062019: 'ESR'
    };
    
    return networks[id] || `Chain ${id}`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-xl p-6 border border-white/10 max-w-md w-full">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-amber-500/20 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
          </div>
          <h3 className="text-xl font-semibold text-white">Network Mismatch</h3>
        </div>
        
        <p className="text-gray-300 mb-6">
          You're currently connected to <span className="text-white font-medium">{getNetworkName(currentChainId)}</span> but this action requires <span className="text-white font-medium">{targetNetwork.name}</span>.
        </p>
        
        <div className="bg-white/5 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-300">Current Network:</span>
            <span className="text-white">{getNetworkName(currentChainId)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-300">Required Network:</span>
            <span className="text-green-400">{targetNetwork.name}</span>
          </div>
        </div>
        
        {switchError && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6">
            <p className="text-red-300 text-sm">{switchError}</p>
            <p className="text-red-300 text-sm mt-2">
              You may need to add this network to your wallet manually.
            </p>
          </div>
        )}
        
        <div className="flex flex-col space-y-3">
          <button
            onClick={onSwitchNetwork}
            disabled={isAttemptingSwitch}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {isAttemptingSwitch ? (
              <span>Switching...</span>
            ) : (
              <>
                <span>Switch to {targetNetwork.name}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
          
          <a
            href={targetNetwork.explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 text-center text-sm flex items-center justify-center space-x-1"
          >
            <span>View Network Details</span>
            <ExternalLink className="w-3 h-3" />
          </a>
          
          <button
            onClick={onClose}
            className="text-gray-300 hover:text-white text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};