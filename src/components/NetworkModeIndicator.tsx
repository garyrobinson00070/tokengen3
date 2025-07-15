import React from 'react';
import { Globe, Zap, AlertTriangle } from 'lucide-react';
import { useNetworkMode } from '../hooks/useNetworkMode';
import { useWallet } from '../hooks/useWallet';
import { isMainnetChain, isTestnetChain } from '../config/chainConfig';

export const NetworkModeIndicator: React.FC = () => {
  const { isTestnetMode, toggleMode } = useNetworkMode();
  const { isConnected, chainId } = useWallet();
  
  // Check if current chain matches mode
  const isNetworkMismatch = isConnected && chainId && (
    (isTestnetMode && !isTestnetChain(chainId)) || 
    (!isTestnetMode && !isMainnetChain(chainId))
  );
  
  const getNetworkName = (id: number | null) => {
    if (!id) return 'Unknown';
    
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
      25: 'Cronos',
      338: 'Cronos Testnet',
      1116: 'Core',
      2000: 'DogeChain',
      369: 'PulseChain',
      7000: 'ZetaChain',
      130: 'Unichain',
      7171: 'Bitrock',
      7771: 'Bitrock Testnet',
      3797: 'AlveyChain',
      1071: 'OpenGPU',
      8453: 'Base',
      25062019: isTestnetMode ? 'ESR Testnet' : 'ESR'
    };
    
    return networks[id] || `Chain ${id}`;
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className={`rounded-lg shadow-lg p-3 flex items-center space-x-2 ${
        isNetworkMismatch 
          ? 'bg-amber-500/90 text-white' 
          : isTestnetMode 
            ? 'bg-green-500/90 text-white' 
            : 'bg-blue-600/90 text-white'
      }`}>
        {isNetworkMismatch ? (
          <>
            <AlertTriangle className="w-4 h-4" />
            <div className="text-sm">
              <div className="font-medium">Network Mismatch</div>
              <div className="text-xs">
                {chainId && `Connected to ${getNetworkName(chainId)}`}
              </div>
            </div>
            <button 
              onClick={toggleMode}
              className="px-2 py-1 bg-white/20 rounded text-xs font-medium hover:bg-white/30 transition-colors"
            >
              Switch to {isTestnetMode ? 'Mainnet' : 'Testnet'} Mode
            </button>
          </>
        ) : (
          <>
            {isTestnetMode ? (
              <Zap className="w-4 h-4" />
            ) : (
              <Globe className="w-4 h-4" />
            )}
            <div className="text-sm">
              <div className="font-medium">{isTestnetMode ? 'Testnet' : 'Mainnet'} Mode</div>
              {isConnected && chainId && (
                <div className="text-xs">{getNetworkName(chainId)}</div>
              )}
            </div>
            <button 
              onClick={toggleMode}
              className="px-2 py-1 bg-white/20 rounded text-xs font-medium hover:bg-white/30 transition-colors"
            >
              Switch
            </button>
          </>
        )}
      </div>
    </div>
  );
};