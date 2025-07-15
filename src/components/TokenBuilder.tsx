import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Info, AlertCircle, Zap } from 'lucide-react';
import { TokenConfig, Network } from '../types';
import { networks, mainnets, testnets } from '../data/networks';
import { NetworkMismatchModal } from './NetworkMismatchModal';
import { NetworkSelector } from './NetworkSelector';
import { contractService } from '../services/contractService';
import { useNetworkMode } from '../hooks/useNetworkMode';
import { useWallet } from '../hooks/useWallet';

interface TokenBuilderProps {
  onBack: () => void;
  onNext: (config: TokenConfig) => void;
  initialConfig?: Partial<TokenConfig>;
}

export const TokenBuilder: React.FC<TokenBuilderProps> = ({ onBack, onNext, initialConfig }) => {
  const { isTestnetMode } = useNetworkMode();
  const { chainId, isNetworkMismatch, switchToNetwork, isAttemptingSwitch, switchError, isConnected } = useWallet(); 
  const { toggleMode } = useNetworkMode();
  
  const [config, setConfig] = useState<TokenConfig>({
    name: '',
    symbol: '',
    decimals: 18,
    initialSupply: '',
    maxSupply: '',
    network: isTestnetMode ? networks.find(n => n.id.includes('testnet')) || networks[0] : networks[0],
    useFactory: true,
    features: {
      burnable: false,
      mintable: false,
      transferFees: {
        enabled: false,
        percentage: 0,
        recipient: ''
      },
      holderRedistribution: {
        enabled: false,
        percentage: 0
      }
    },
    vesting: [],
    ...initialConfig
  });
  const [gasEstimate, setGasEstimate] = useState<string | null>(null);

  const [showNetworkModal, setShowNetworkModal] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Helper functions for network display
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
  
  // Update network when testnet mode changes
  useEffect(() => {
    if (isTestnetMode && !config.network.id.includes('testnet')) {
      // Switch to a testnet network (first one in the list)
      const testnet = testnets[0];
      if (testnet) {
        updateConfig({ network: testnet });
      }
    } else if (!isTestnetMode && config.network.id.includes('testnet')) {
      // Switch to a mainnet network (first one in the list)
      const mainnet = mainnets[0];
      if (mainnet) {
        updateConfig({ network: mainnet });
      }
    }
  }, [isTestnetMode]);

  // Show network mismatch modal when network is selected
  const handleNetworkSelect = (network: Network) => {
    updateConfig({ network });
    
    // Check if we need to switch networks in the wallet
    if (chainId && chainId !== network.chainId) {
      setShowNetworkModal(true);
    }
  };

  // Handle network switch
  const handleSwitchNetwork = async () => {
    try {
      await switchToNetwork(config.network.chainId);
      setShowNetworkModal(false);
    } catch (error) {
      console.error('Failed to switch network:', error);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!config.name.trim()) {
      newErrors.name = 'Please enter a token name';
    }

    if (!config.symbol.trim()) {
      newErrors.symbol = 'Please enter a token symbol';
    } else if (config.symbol.length > 10) {
      newErrors.symbol = 'Symbol must be 10 characters or less';
    }

    if (!config.initialSupply || parseFloat(config.initialSupply) <= 0) {
      newErrors.initialSupply = 'Initial supply must be greater than 0';
    }
    
    // Check if max supply is less than initial supply
    if (config.maxSupply && parseFloat(config.maxSupply) > 0 && parseFloat(config.maxSupply) < parseFloat(config.initialSupply)) {
      newErrors.maxSupply = 'Max supply cannot be less than initial supply';
    }

    if (config.features.transferFees.enabled && !config.features.transferFees.recipient.trim()) {
      newErrors.feeRecipient = 'Please enter a fee recipient address';
    }

    if (config.features.transferFees.enabled && (config.features.transferFees.percentage < 0 || config.features.transferFees.percentage > 10)) {
      newErrors.feePercentage = 'Fee percentage must be between 0 and 10%';
    }

    if (config.features.holderRedistribution.enabled && (config.features.holderRedistribution.percentage < 0 || config.features.holderRedistribution.percentage > 5)) {
      newErrors.redistributionPercentage = 'Redistribution percentage must be between 0 and 5%';
    }
    
    // Validate fee recipient address format if provided
    if (config.features.transferFees.enabled && config.features.transferFees.recipient) {
      if (!/^0x[a-fA-F0-9]{40}$/.test(config.features.transferFees.recipient)) {
        newErrors.feeRecipient = 'Invalid wallet address format';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onNext(config);
    }
  };

  const updateConfig = (updates: Partial<TokenConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };

  // Update gas estimate when features change
  useEffect(() => {
    const updateGasEstimate = async () => {
      if (!config.name || !config.symbol || !config.initialSupply || !isConnected) {
        return; // Don't estimate until we have basic info
      }
      
      try {
        const estimate = await contractService.estimateDeploymentCost(config);
        setGasEstimate(`~${estimate.gasCost} ${config.network.symbol} (${estimate.gasCostUsd})`);
      } catch (error) {
        console.error('Error estimating gas:', error);
        setGasEstimate(null);
      }
    };
    
    updateGasEstimate();
  }, [config.features, config.network, config.initialSupply, config.name, config.symbol, isConnected]);

  const updateFeatures = (updates: Partial<TokenConfig['features']>) => {
    setConfig(prev => ({
      ...prev,
      features: { ...prev.features, ...updates }
    }));
  };

  // Filter networks based on current mode
  const filteredNetworks = isTestnetMode ? testnets : mainnets;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </button>
          
          <h1 className="text-3xl font-bold text-white mb-2">Token Builder</h1>
          <p className="text-gray-300">Configure your token parameters and features</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Token Info */}
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10">
            <h2 className="text-xl font-semibold text-white mb-6">Basic Information</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Token Name
                </label>
                <input
                  type="text"
                  value={config.name}
                  onChange={(e) => updateConfig({ name: e.target.value })}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., My Awesome Token"
                />
                {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Token Symbol
                </label>
                <input
                  type="text"
                  value={config.symbol}
                  onChange={(e) => updateConfig({ symbol: e.target.value.toUpperCase() })}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., MAT"
                />
                {errors.symbol && <p className="text-red-400 text-sm mt-1">{errors.symbol}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Decimals
                </label>
                <select
                  value={config.decimals}
                  onChange={(e) => updateConfig({ decimals: parseInt(e.target.value) })}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={18}>18 (Standard)</option>
                  <option value={8}>8</option>
                  <option value={6}>6</option>
                  <option value={0}>0</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Initial Supply
                </label>
                <input
                  type="number"
                  value={config.initialSupply}
                  onChange={(e) => updateConfig({ initialSupply: e.target.value })}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 1000000"
                />
                {errors.initialSupply && <p className="text-red-400 text-sm mt-1">{errors.initialSupply}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Max Supply (optional)
                </label>
                <input
                  type="number"
                  value={config.maxSupply}
                  onChange={(e) => updateConfig({ maxSupply: e.target.value })}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Leave empty for unlimited supply"
                />
              </div>
            </div>
          </div>

          {/* Network Selection */}
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10">
            <h2 className="text-xl font-semibold text-white mb-6">Network Selection</h2>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
              {filteredNetworks.map((network) => (
                <div
                  key={network.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    config.network.id === network.id
                      ? 'border-blue-500 bg-blue-500/20 text-blue-400'
                      : 'border-white/20 bg-white/5 text-gray-300 hover:border-white/40'
                  }`}
                  onClick={() => handleNetworkSelect(network)}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-1">{getNetworkIcon(network.id)}</div>
                    <div className="text-xs font-medium">{network.name}</div>
                    <div className="text-xs opacity-75">{getDeploymentCost(network)}</div>
                  </div>
                </div>
              ))}
            </div>
            
            {gasEstimate && (
              <>
              <div className="p-3 bg-blue-500/20 rounded-lg mb-4">
                <div className="flex items-center space-x-2">
                  <Zap className="w-4 h-4 text-blue-400" />
                  <span className="text-blue-400 font-medium">Estimated Deployment Cost: {gasEstimate}</span>
                </div>
              </div>
              
              {/* Network Mode Indicator */}
              <div className={`p-3 rounded-lg ${
                isTestnetMode 
                  ? 'bg-green-500/20 border border-green-500/50' 
                  : 'bg-blue-500/20 border border-blue-500/50'
              }`}>
                <div className="flex items-center space-x-2 justify-center">
                  <span className={isTestnetMode ? 'text-green-400' : 'text-blue-400'}>
                    {isTestnetMode ? '⚡ Testnet Mode Active - Free Deployment' : '🔵 Mainnet Mode Active - Requires ESR Tokens'}
                  </span>
                </div>
              </div>
              </>
            )}
          </div>

          {/* Token Features */}
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10">
            <h2 className="text-xl font-semibold text-white mb-6">Token Features</h2>
            
            <div className="space-y-6">
              {/* Burnable */}
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="burnable"
                      checked={config.features.burnable}
                      onChange={(e) => updateFeatures({ burnable: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="burnable" className="text-white font-medium">
                      Burnable
                    </label>
                  </div>
                  <Info className="w-4 h-4 text-gray-400" />
                </div>
                <span className="text-sm text-gray-400">
                  Allow token holders to burn their tokens
                </span>
              </div>

              {/* Mintable */}
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="mintable"
                      checked={config.features.mintable}
                      onChange={(e) => updateFeatures({ mintable: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="mintable" className="text-white font-medium">
                      Mintable
                    </label>
                  </div>
                  <Info className="w-4 h-4 text-gray-400" />
                </div>
                <span className="text-sm text-gray-400">
                  Allow creating new tokens after deployment
                </span>
              </div>

              {/* Transfer Fees */}
              <div className="p-4 bg-white/5 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="transferFees"
                        checked={config.features.transferFees.enabled}
                        onChange={(e) => updateFeatures({
                          transferFees: { ...config.features.transferFees, enabled: e.target.checked }
                        })}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="transferFees" className="text-white font-medium">
                        Transfer Fees
                      </label>
                    </div>
                    <Info className="w-4 h-4 text-gray-400" />
                  </div>
                  <span className="text-sm text-gray-400">
                    Charge fees on token transfers
                  </span>
                </div>
                
                {config.features.transferFees.enabled && (
                  <div className="grid md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Fee Percentage (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="10"
                        step="0.1"
                        value={config.features.transferFees.percentage}
                        onChange={(e) => updateFeatures({
                          transferFees: { ...config.features.transferFees, percentage: parseFloat(e.target.value) }
                        })}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {errors.feePercentage && <p className="text-red-400 text-sm mt-1">{errors.feePercentage}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Fee Recipient Address
                      </label>
                      <input
                        type="text"
                        value={config.features.transferFees.recipient}
                        onChange={(e) => updateFeatures({
                          transferFees: { ...config.features.transferFees, recipient: e.target.value }
                        })}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0x..."
                      />
                      {errors.feeRecipient && <p className="text-red-400 text-sm mt-1">{errors.feeRecipient}</p>}
                    </div>
                  </div>
                )}
              </div>

              {/* Holder Redistribution */}
              <div className="p-4 bg-white/5 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="holderRedistribution"
                        checked={config.features.holderRedistribution.enabled}
                        onChange={(e) => updateFeatures({
                          holderRedistribution: { ...config.features.holderRedistribution, enabled: e.target.checked }
                        })}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="holderRedistribution" className="text-white font-medium">
                        Holder Redistribution
                      </label>
                    </div>
                    <Info className="w-4 h-4 text-gray-400" />
                  </div>
                  <span className="text-sm text-gray-400">
                    Redistribute fees to token holders
                  </span>
                </div>
                
                {config.features.holderRedistribution.enabled && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Redistribution Percentage (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="5"
                      step="0.1"
                      value={config.features.holderRedistribution.percentage}
                      onChange={(e) => updateFeatures({
                        holderRedistribution: { ...config.features.holderRedistribution, percentage: parseFloat(e.target.value) }
                      })}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.redistributionPercentage && <p className="text-red-400 text-sm mt-1">{errors.redistributionPercentage}</p>}
                  </div>
                )}
              </div>
            </div>
            
            {/* Factory Option */}
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="useFactory"
                    checked={config.useFactory}
                    onChange={(e) => updateConfig({ useFactory: e.target.checked })}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Warning */}
          <div className="bg-amber-500/20 border border-amber-500/50 rounded-xl p-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-amber-400 mt-0.5" />
              <div>
                <h3 className="font-medium text-amber-400 mb-1">Important Notice</h3>
                <p className="text-amber-300 text-sm">
                  Once deployed, token parameters cannot be changed. Please review all settings carefully 
                  before proceeding to the next step.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between">
            <button
              type="button"
              onClick={onBack}
              className="px-6 py-3 text-gray-300 hover:text-white transition-colors"
            >
              Back
            </button>
            
            <button
              type="submit"
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2"
            >
              <span>Continue to Vesting</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
      
      {/* Network Mismatch Modal */}
      <NetworkMismatchModal
        isOpen={showNetworkModal}
        onClose={() => setShowNetworkModal(false)}
        currentChainId={chainId}
        targetNetwork={config.network}
        onSwitchNetwork={handleSwitchNetwork}
        isAttemptingSwitch={isAttemptingSwitch}
        switchError={switchError}
      />
    </div>
  );
};