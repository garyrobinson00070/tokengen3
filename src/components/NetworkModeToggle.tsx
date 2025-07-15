import React from 'react';
import { Moon, Sun, Globe, Zap } from 'lucide-react';
import { useNetworkMode } from '../hooks/useNetworkMode';

interface NetworkModeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export const NetworkModeToggle: React.FC<NetworkModeToggleProps> = ({ className = '', showLabel = false }) => {
  const { isTestnetMode, toggleMode } = useNetworkMode();

  return (
    <div className="flex items-center space-x-2">
      {showLabel && (
        <span className={`text-sm ${isTestnetMode ? 'text-green-400' : 'text-blue-400'}`}>
          {isTestnetMode ? 'Testnet' : 'Mainnet'} Mode
        </span>
      )}
      <button
        onClick={toggleMode}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
          isTestnetMode ? 'bg-green-500' : 'bg-blue-600'
        } ${className}`}
        title={isTestnetMode ? 'Switch to Mainnet Mode' : 'Switch to Testnet Mode'}
      >
        <span className="sr-only">{isTestnetMode ? 'Switch to Mainnet Mode' : 'Switch to Testnet Mode'}</span>
        <span
          className={`${
            isTestnetMode ? 'translate-x-6' : 'translate-x-1'
          } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
        />
        <span className="absolute left-0 right-0 text-xs text-white flex justify-between px-1">
          <Globe className={`w-3 h-3 ${!isTestnetMode ? 'opacity-100' : 'opacity-0'}`} />
          <Zap className={`w-3 h-3 ${isTestnetMode ? 'opacity-100' : 'opacity-0'}`} />
        </span>
      </button>
    </div>
  );
};