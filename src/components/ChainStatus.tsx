import React from 'react';
import { Globe, AlertTriangle } from 'lucide-react';
import { useWallet } from '../hooks/useWallet';
import { useNetworkMode } from '../hooks/useNetworkMode';
import { isMainnetChain, isTestnetChain } from '../config/chainConfig';

export const ChainStatus: React.FC = () => {
  const { isConnected, chainId } = useWallet();
  const { isTestnetMode } = useNetworkMode();

  if (!isConnected || !chainId) {
    return null;
  }

  const isCorrectNetworkType = isTestnetMode ? isTestnetChain(chainId) : isMainnetChain(chainId);

  const getNetworkName = (id: number) => {
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
      43113: 'Avalanche Fuji',
      25062019: isTestnetMode ? 'ESR Testnet' : 'ESR'
    };
    
    return networks[id] || `Chain ${id}`;
  };

  return (
    <div className={`px-3 py-1 rounded-lg text-xs font-medium flex items-center space-x-1 ${
      isCorrectNetworkType 
        ? 'bg-green-500/20 text-green-400' 
        : 'bg-amber-500/20 text-amber-400'
    }`}>
      {isCorrectNetworkType ? (
        <Globe className="w-3 h-3" />
      ) : (
        <AlertTriangle className="w-3 h-3" />
      )}
      <span>{getNetworkName(chainId)}</span>
    </div>
  );
};