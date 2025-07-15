import React from 'react';
import { Wallet, LogOut, Loader2, AlertCircle, RefreshCw, ArrowRight } from 'lucide-react';
import { useWallet } from '../hooks/useWallet';
import { useNetworkMode } from '../hooks/useNetworkMode';
import { getMainnetChainIds, getTestnetChainIds } from '../config/chainConfig';
import { NetworkModeToggle } from './NetworkModeToggle';

export const WalletConnection: React.FC = () => {
  const { 
    isConnected, 
    address, 
    balance, 
    chainId, 
    connectWallet, 
    disconnectWallet, 
    isConnecting, 
    error,
    isNetworkMismatch,
    switchToCompatibleNetwork
  } = useWallet();
  const { isTestnetMode } = useNetworkMode();

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };
  
  const getNetworkName = (chainId: number | null) => {
    if (!chainId) return 'Unknown';
      <NetworkModeToggle showLabel={true} />
    
    const networks = {
      1: 'Ethereum',
      5: 'Goerli',
      56: 'BSC',
      97: 'BSC Testnet',
      137: 'Polygon',
      80001: 'Mumbai',
      42161: 'Arbitrum',
      421614: 'Arbitrum Sepolia',
      250: 'Fantom',
      43114: 'Avalanche',
      25062019: 'Estar Testnet'
    };
    
    return networks[chainId] || `Chain ${chainId}`;
  };

  if (isConnected) {
    return (
      <div className="flex items-center space-x-4 flex-wrap">
        <div className="flex items-center space-x-2">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
            <div className="flex items-center space-x-2">
              <Wallet className="w-4 h-4 text-blue-300" />
              <span className="text-sm font-medium text-white">
                {formatAddress(address!)}
              </span>
              <div className="flex flex-col ml-2">
                <span className="text-xs text-blue-300">
                  {balance} {chainId === 25062019 ? 'ESR' : chainId === 56 ? 'BNB' : 'ETH'}
                </span>
                {chainId && (
                  <span className="text-xs text-gray-400">
                    {getNetworkName(chainId)}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={disconnectWallet}
            className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
        {isNetworkMismatch && (
          <button
            onClick={switchToCompatibleNetwork}
            className="bg-amber-500/20 text-amber-400 px-3 py-1 rounded-lg text-xs font-medium flex items-center space-x-1"
          >
            <span>Switch to {isTestnetMode ? 'Testnet' : 'Mainnet'}</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center space-x-2">
        <div className="text-red-400 text-xs mr-2 max-w-[200px] truncate">
          <AlertCircle className="w-4 h-4 inline mr-1" />
          <span>{error.length > 30 ? error.slice(0, 30) + '...' : error}</span>
        </div>
        <button
          onClick={connectWallet}
          className="bg-amber-500/20 text-amber-400 px-3 py-1 rounded-lg text-xs font-medium flex items-center space-x-1 whitespace-nowrap"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-4">
      <button
        onClick={connectWallet}
        disabled={isConnecting}
        className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 disabled:opacity-50"
      >
        {isConnecting ? (
          <div className="flex items-center space-x-2 px-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Connecting...</span>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <Wallet className="w-4 h-4" />
            <span>Connect Wallet</span>
          </div>
        )}
      </button>
    </div>
  );
};