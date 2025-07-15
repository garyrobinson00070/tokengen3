import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Calendar, Clock, DollarSign, Users, AlertTriangle, Info, Zap, Shield } from 'lucide-react';
import { PresaleConfig } from '../../types/presale';

interface SaleConfigStepProps {
  config: PresaleConfig;
  onNext: (config: Partial<PresaleConfig>) => void;
  onBack: () => void;
}

export const SaleConfigStep: React.FC<SaleConfigStepProps> = ({ config, onNext, onBack }) => {
  const [saleConfig, setSaleConfig] = useState(config.saleConfiguration);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Anti-bot protection settings
  const [antiBotConfig, setAntiBotConfig] = useState({
    enabled: true,
    protectionDelay: 300, // 5 minutes in seconds
    maxGasPrice: 50, // 50 Gwei
    walletCooldown: 60, // 1 minute in seconds
    signatureRequired: false
  });

  const updateConfig = (updates: Partial<typeof saleConfig>) => {
    setSaleConfig(prev => ({ ...prev, ...updates }));
  };

  const updateAntiBotConfig = (updates: Partial<typeof antiBotConfig>) => {
    setAntiBotConfig(prev => ({ ...prev, ...updates }));
  };

  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    // Format as YYYY-MM-DDThh:mm
    return tomorrow.toISOString().slice(0, 16);
  };

  const getMinEndDate = () => {
    if (!saleConfig.startDate) return getTomorrowDate();
    const startDate = new Date(saleConfig.startDate);
    startDate.setHours(startDate.getHours() + 1);
    return startDate.toISOString().slice(0, 16);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!saleConfig.saleName.trim()) {
      newErrors.saleName = 'Please enter a name for your sale';
    }

    if (!saleConfig.softCap || parseFloat(saleConfig.softCap) <= 0) {
      newErrors.softCap = 'Soft cap must be greater than 0';
    }

    if (!saleConfig.hardCap || parseFloat(saleConfig.hardCap) <= 0) {
      newErrors.hardCap = 'Hard cap must be greater than 0';
    }

    if (saleConfig.softCap && saleConfig.hardCap && parseFloat(saleConfig.softCap) >= parseFloat(saleConfig.hardCap)) {
      newErrors.hardCap = 'Hard cap must be greater than soft cap';
    }

    if (!saleConfig.tokenPrice || parseFloat(saleConfig.tokenPrice) <= 0) {
      newErrors.tokenPrice = 'Token price must be greater than 0';
    }

    if (!saleConfig.minPurchase || parseFloat(saleConfig.minPurchase) <= 0) {
      newErrors.minPurchase = 'Minimum purchase must be greater than 0';
    }

    if (!saleConfig.maxPurchase || parseFloat(saleConfig.maxPurchase) <= 0) {
      newErrors.maxPurchase = 'Maximum purchase must be greater than 0';
    }

    if (saleConfig.minPurchase && saleConfig.maxPurchase && parseFloat(saleConfig.minPurchase) >= parseFloat(saleConfig.maxPurchase)) {
      newErrors.maxPurchase = 'Maximum purchase must be greater than minimum purchase';
    }

    if (!saleConfig.startDate) {
      newErrors.startDate = 'Please select a start date and time';
    }

    if (!saleConfig.endDate) {
      newErrors.endDate = 'Please select an end date and time';
    }

    if (saleConfig.startDate && saleConfig.endDate && new Date(saleConfig.startDate) >= new Date(saleConfig.endDate)) {
      newErrors.endDate = 'End date must be after start date';
    }
    
    // Check if start date is in the past
    if (saleConfig.startDate && new Date(saleConfig.startDate) <= new Date()) {
      newErrors.startDate = 'Start date must be in the future';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateForm()) {
      // Include anti-bot configuration in the next step
      onNext({ 
        saleConfiguration: saleConfig,
        antiBotConfig: antiBotConfig.enabled ? antiBotConfig : null
      });
    }
  };

  const calculateTokensFromCap = (cap: string) => {
    if (!cap || !saleConfig.tokenPrice) return '0';
    return (parseFloat(cap) * parseFloat(saleConfig.tokenPrice)).toLocaleString();
  };

  const getSaleDuration = () => {
    if (!saleConfig.startDate || !saleConfig.endDate) return '';
    const start = new Date(saleConfig.startDate);
    const end = new Date(saleConfig.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-4">Sale Configuration</h2>
        <p className="text-gray-300">Set up your sale parameters and timing</p>
      </div>

      {/* Basic Configuration */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">Basic Information</h3>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Sale Name
            </label>
            <input
              type="text"
              value={saleConfig.saleName}
              onChange={(e) => updateConfig({ saleName: e.target.value })}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., My Token Presale"
            />
            {errors.saleName && <p className="text-red-400 text-sm mt-1">{errors.saleName}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Soft Cap ({config.network.symbol})
            </label>
            <input
              type="number"
              step="0.001"
              value={saleConfig.softCap}
              onChange={(e) => updateConfig({ softCap: e.target.value })}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 10"
            />
            {errors.softCap && <p className="text-red-400 text-sm mt-1">{errors.softCap}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Hard Cap ({config.network.symbol})
            </label>
            <input
              type="number"
              step="0.001"
              value={saleConfig.hardCap}
              onChange={(e) => updateConfig({ hardCap: e.target.value })}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 100"
            />
            {errors.hardCap && <p className="text-red-400 text-sm mt-1">{errors.hardCap}</p>}
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">Pricing & Limits</h3>
        
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Token Price (tokens per 1 {config.network.symbol})
            </label>
            <input
              type="number"
              step="0.001"
              value={saleConfig.tokenPrice}
              onChange={(e) => updateConfig({ tokenPrice: e.target.value })}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 1000"
            />
            {errors.tokenPrice && <p className="text-red-400 text-sm mt-1">{errors.tokenPrice}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Min Purchase ({config.network.symbol})
            </label>
            <input
              type="number"
              step="0.001"
              value={saleConfig.minPurchase}
              onChange={(e) => updateConfig({ minPurchase: e.target.value })}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 0.1"
            />
            {errors.minPurchase && <p className="text-red-400 text-sm mt-1">{errors.minPurchase}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Max Purchase ({config.network.symbol})
            </label>
            <input
              type="number"
              step="0.001"
              value={saleConfig.maxPurchase}
              onChange={(e) => updateConfig({ maxPurchase: e.target.value })}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 10"
            />
            {errors.maxPurchase && <p className="text-red-400 text-sm mt-1">{errors.maxPurchase}</p>}
          </div>
        </div>

        {/* Price Calculator */}
        {saleConfig.tokenPrice && (
          <div className="mt-4 p-4 bg-blue-500/20 rounded-lg">
            <h4 className="font-medium text-blue-400 mb-2">Price Calculator</h4>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between">
                <span className="text-blue-300">1 {config.network.symbol} =</span>
                <span className="text-white font-medium">{saleConfig.tokenPrice} {config.tokenInfo.tokenSymbol}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-300">1 {config.tokenInfo.tokenSymbol} =</span>
                <span className="text-white font-medium">{(1 / parseFloat(saleConfig.tokenPrice)).toFixed(6)} {config.network.symbol}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Timing */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">Sale Timing</h3>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Start Date & Time (UTC)
            </label>
            <input
              type="datetime-local"
              value={saleConfig.startDate}
              min={getTomorrowDate()}
              onChange={(e) => updateConfig({ startDate: e.target.value })}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.startDate && <p className="text-red-400 text-sm mt-1">{errors.startDate}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <Clock className="w-4 h-4 inline mr-1" />
              End Date & Time (UTC)
            </label>
            <input
              type="datetime-local"
              value={saleConfig.endDate}
              min={getMinEndDate()}
              onChange={(e) => updateConfig({ endDate: e.target.value })}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.endDate && <p className="text-red-400 text-sm mt-1">{errors.endDate}</p>}
          </div>
        </div>

        {getSaleDuration() && (
          <div className="mt-4 p-3 bg-green-500/20 rounded-lg">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-green-400" />
              <span className="text-green-400 font-medium">Sale Duration: {getSaleDuration()}</span>
            </div>
          </div>
        )}
      </div>

      {/* Whitelist (Private Sale Only) */}
      {config.saleType === 'private' && (
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4">Whitelist Settings</h3>
          
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="whitelist"
              checked={saleConfig.whitelistEnabled}
              onChange={(e) => updateConfig({ whitelistEnabled: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <label htmlFor="whitelist" className="text-white font-medium">
              Enable Whitelist (Recommended for Private Sales)
            </label>
          </div>
          
          <p className="text-gray-300 text-sm mt-2">
            Only whitelisted addresses will be able to participate in the sale
          </p>
        </div>
      )}

      {/* Anti-Bot Protection */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="antiBotEnabled"
              checked={antiBotConfig.enabled}
              onChange={(e) => updateAntiBotConfig({ enabled: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <label htmlFor="antiBotEnabled" className="text-lg font-semibold text-white">
              Enable Anti-Bot Protection
            </label>
          </div>
          <Shield className="w-5 h-5 text-blue-400" />
        </div>
        
        <p className="text-gray-300 text-sm mb-4">
          Anti-bot protection helps prevent front-running bots and automated sniping during the sale.
        </p>
        
        {antiBotConfig.enabled && (
          <div className="grid md:grid-cols-3 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Protection Delay (seconds)
              </label>
              <input
                type="number"
                min="0"
                value={antiBotConfig.protectionDelay}
                onChange={(e) => updateAntiBotConfig({ protectionDelay: parseInt(e.target.value) || 0 })}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-gray-400 text-xs mt-1">
                Time after start when only whitelist can buy
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Max Gas Price (Gwei)
              </label>
              <input
                type="number"
                min="0"
                value={antiBotConfig.maxGasPrice}
                onChange={(e) => updateAntiBotConfig({ maxGasPrice: parseInt(e.target.value) || 0 })}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-gray-400 text-xs mt-1">
                0 = no limit, otherwise max gas price in Gwei
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Wallet Cooldown (seconds)
              </label>
              <input
                type="number"
                min="0"
                value={antiBotConfig.walletCooldown}
                onChange={(e) => updateAntiBotConfig({ walletCooldown: parseInt(e.target.value) || 0 })}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-gray-400 text-xs mt-1">
                Time between purchases from same wallet
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">Configuration Summary</h3>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-300">Soft Cap:</span>
              <span className="text-white font-medium">{saleConfig.softCap} {config.network.symbol}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Hard Cap:</span>
              <span className="text-white font-medium">{saleConfig.hardCap} {config.network.symbol}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Tokens at Soft Cap:</span>
              <span className="text-blue-400 font-medium">{calculateTokensFromCap(saleConfig.softCap)} {config.tokenInfo.tokenSymbol}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Tokens at Hard Cap:</span>
              <span className="text-blue-400 font-medium">{calculateTokensFromCap(saleConfig.hardCap)} {config.tokenInfo.tokenSymbol}</span>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-300">Min Purchase:</span>
              <span className="text-white font-medium">{saleConfig.minPurchase} {config.network.symbol}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Max Purchase:</span>
              <span className="text-white font-medium">{saleConfig.maxPurchase} {config.network.symbol}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Sale Duration:</span>
              <span className="text-purple-400 font-medium">{getSaleDuration()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Whitelist:</span>
              <span className={`font-medium ${saleConfig.whitelistEnabled ? 'text-green-400' : 'text-gray-400'}`}>
                {saleConfig.whitelistEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Anti-Bot Protection:</span>
              <span className={`font-medium ${antiBotConfig.enabled ? 'text-green-400' : 'text-gray-400'}`}>
                {antiBotConfig.enabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 px-6 py-3 text-gray-300 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
        
        <button
          onClick={handleNext}
          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2"
        >
          <span>Continue</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};