import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check, AlertCircle, Globe, Zap } from 'lucide-react';
import { Network } from '../types';
import { mainnets, testnets } from '../data/networks';
import { useNetworkMode } from '../hooks/useNetworkMode';
import { useWallet } from '../hooks/useWallet';

interface NetworkSelectorProps {
  selectedNetwork: Network | null;
  onNetworkSelect: (network: Network) => void;
  className?: string;
  compact?: boolean;
}

export const NetworkSelector: React.FC<NetworkSelectorProps> = ({
  selectedNetwork,
  onNetworkSelect,
  className = '',
  compact = false
}) => {
  const { isTestnetMode } = useNetworkMode();
  const { chainId, isNetworkMismatch } = useWallet();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Get networks based on mode
  const networks = isTestnetMode ? testnets : mainnets;

  // Find current network from chainId
  useEffect(() => {
    if (chainId && !selectedNetwork) {
      const networkFromChain = networks.find(n => n.chainId === chainId);
      if (networkFromChain) {
        onNetworkSelect(networkFromChain);
      }
    }
  }, [chainId, networks, selectedNetwork, onNetworkSelect]);

  const handleNetworkSelect = (network: Network) => {
    onNetworkSelect(network);
    setIsOpen(false);
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

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center space-x-2 ${
          compact 
            ? 'px-3 py-1.5 text-sm' 
            : 'px-4 py-2'
        } bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors ${
          isNetworkMismatch ? 'border border-amber-500/50' : 'border border-white/20'
        }`}
      >
        {selectedNetwork ? (
          <>
            <span className="text-lg">{getNetworkIcon(selectedNetwork.id)}</span>
            {!compact && <span>{selectedNetwork.name}</span>}
            {compact && <span className="text-xs">{selectedNetwork.symbol}</span>}
          </>
        ) : (
          <>
            <Globe className="w-4 h-4" />
            <span>Select Network</span>
          </>
        )}
        <ChevronDown className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-64 bg-slate-800 border border-white/10 rounded-xl shadow-xl overflow-hidden">
          <div className="p-3 border-b border-white/10">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-medium">Select Network</h3>
              <div className="flex items-center space-x-1 text-xs">
                {isTestnetMode ? (
                  <div className="flex items-center space-x-1 px-2 py-1 bg-green-500/20 text-green-400 rounded-full">
                    <Zap className="w-3 h-3" />
                    <span>Testnet</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-1 px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full">
                    <Globe className="w-3 h-3" />
                    <span>Mainnet</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="max-h-80 overflow-y-auto p-2">
            {networks.map((network) => (
              <button
                key={network.id}
                onClick={() => handleNetworkSelect(network)}
                className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors ${
                  selectedNetwork?.id === network.id
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{getNetworkIcon(network.id)}</span>
                  <div className="text-left">
                    <div className="font-medium">{network.name}</div>
                    <div className="text-xs text-gray-400">Chain ID: {network.chainId}</div>
                  </div>
                </div>
                {selectedNetwork?.id === network.id && (
                  <Check className="w-4 h-4" />
                )}
              </button>
            ))}
          </div>
          
          {isNetworkMismatch && (
            <div className="p-3 bg-amber-500/20 border-t border-amber-500/50">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5" />
                <div className="text-xs text-amber-400">
                  Your wallet is connected to a different network. Click a network to switch.
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};