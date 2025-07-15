import React, { useState, useEffect } from 'react';
import { Network as NetworkIcon, Zap, Globe, Shield, Clock } from 'lucide-react';
import { Network } from '../types';
import { mainnets, testnets } from '../data/networks';
import { NetworkSelector } from './NetworkSelector';
import { web3Service } from '../services/web3Service';
import { useNetworkMode } from '../hooks/useNetworkMode';

interface NetworkTabProps {
  selectedNetwork: Network;
  onNetworkSelect: (network: Network) => void;
}

export const NetworkTab: React.FC<NetworkTabProps> = ({
  selectedNetwork,
  onNetworkSelect,
}) => {
  // Use the global network mode
  const { isTestnetMode } = useNetworkMode();
  
  // Initialize activeTab based on global network mode
  const [activeTab, setActiveTab] = useState<'mainnet' | 'testnet'>(isTestnetMode ? 'testnet' : 'mainnet');
  
  // Update activeTab when global network mode changes
  useEffect(() => {
    setActiveTab(isTestnetMode ? 'testnet' : 'mainnet');
    
    // Auto-select first network of the new tab
    const networks = isTestnetMode ? testnets : mainnets;
    if (networks.length > 0) {
      onNetworkSelect(networks[0]);
    }
  }, [isTestnetMode, onNetworkSelect]);

  const handleTabChange = (tab: 'mainnet' | 'testnet') => {
    setActiveTab(tab);
    
    // Auto-select first network of the new tab
    const networks = tab === 'testnet' ? testnets : mainnets;
    if (networks.length > 0) {
      onNetworkSelect(networks[0]);
    }
  };
  
  // Handle network selection and switch network in wallet
  const handleNetworkSelect = async (network: Network) => {
    try {
      // Switch network in wallet
      await web3Service.switchNetwork(network);
      
      // Update selected network
      onNetworkSelect(network);
    } catch (error) {
      console.error('Error switching network:', error);
      // Still update UI even if wallet switch fails
      onNetworkSelect(network);
    }
  };

  const getNetworkIcon = (networkId: string) => {
    const icons: Record<string, string> = {
      'ethereum': '🔷',
      'bsc': '🟡',
      'polygon': '🟣',
      'arbitrum': '🔵',
      'fantom': '🌟',
      'avalanche': '🔺',
      'cronos': '⚡',
      'core': '🔘',
      'dogechain': '🐕',
      'pulsechain': '💗',
      'zetachain': '🔗',
      'unichain': '🦄',
      'bitrock': '🪨',
      'alveychain': '🧝',
      'opengpu': '🖥️',
      'base': '🔵',
      'estar-testnet': '⚡',
      'goerli': '🔷',
      'bsc-testnet': '🟡',
      'mumbai': '🟣',
      'arbitrum-sepolia': '🔵',
      'fantom-testnet': '🌟',
      'avalanche-fuji': '🔺',
      'cronos-testnet': '⚡',
      'bitrock-testnet': '🪨'
    };
    return icons[networkId] || '🌐';
  };

  const getDeploymentCost = (network: Network) => {
    if (isTestnetMode) return 'Free';
    return network.gasPrice.includes('$') ? network.gasPrice.split('(')[1]?.replace(')', '') || '$25' : '$25';
  };

  const currentNetworks = activeTab === 'testnet' ? testnets : mainnets;

  return (
    <div className="space-y-6">
      <NetworkSelector 
        selectedNetwork={selectedNetwork}
        onNetworkSelect={onNetworkSelect}
      />

      {/* Selected Network Summary */}
      {selectedNetwork && (
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4">Selected Network</h3>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center space-x-3 mb-3">
                <div className="text-2xl">{getNetworkIcon(selectedNetwork.id)}</div>
                <div>
                  <h4 className="font-medium text-white">{selectedNetwork.name}</h4>
                  <p className="text-sm text-gray-300">Chain ID: {selectedNetwork.chainId}</p>
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-300">RPC URL:</span>
                  <span className="text-white font-mono text-xs">
                    {selectedNetwork.rpcUrl.slice(0, 30)}...
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Explorer:</span>
                  <a 
                    href={selectedNetwork.explorerUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 text-xs"
                  >
                    View Explorer
                  </a>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="bg-white/5 rounded-lg p-3">
                <div className="text-xs text-gray-300 mb-1">Estimated Gas</div>
                <div className="text-white font-medium">{selectedNetwork.gasPrice}</div>
              </div>
              
              <div className="bg-white/5 rounded-lg p-3">
                <div className="text-xs text-gray-300 mb-1">Total Cost</div>
                <div className={`font-medium ${
                  activeTab === 'testnet' ? 'text-green-400' : 'text-blue-400'
                }`}>
                  {activeTab === 'testnet' ? 'Free (Testnet)' : '100 ESR + Gas'}
                </div>
              </div>
              <a 
                href={`${token.network.explorerUrl}/token/${token.address}`}
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};