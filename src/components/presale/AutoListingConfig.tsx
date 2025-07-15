import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Zap, Info, AlertTriangle } from 'lucide-react';
import { PresaleConfig } from '../../types/presale';

interface AutoListingConfigProps {
  config: PresaleConfig;
  onNext: (config: Partial<PresaleConfig>) => void;
  onBack: () => void;
}

export const AutoListingConfig: React.FC<AutoListingConfigProps> = ({ config, onNext, onBack }) => {
  const [autoListingConfig, setAutoListingConfig] = useState(config.autoListingConfig || {
    enabled: false,
    listingPrice: config.saleConfiguration.tokenPrice || '1000',
    lpTokenPercentage: 70,
    lpBaseTokenPercentage: 70,
    lockDuration: 180 // 180 days
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateConfig = (updates: Partial<typeof autoListingConfig>) => {
    setAutoListingConfig(prev => ({ ...prev, ...updates }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (autoListingConfig.enabled) {
      if (!autoListingConfig.listingPrice || parseFloat(autoListingConfig.listingPrice) <= 0) {
        newErrors.listingPrice = 'Listing price must be greater than 0';
      }

      if (autoListingConfig.lpTokenPercentage < 10 || autoListingConfig.lpTokenPercentage > 100) {
        newErrors.lpTokenPercentage = 'Token percentage must be between 10% and 100%';
      }

      if (autoListingConfig.lpBaseTokenPercentage < 10 || autoListingConfig.lpBaseTokenPercentage > 100) {
        newErrors.lpBaseTokenPercentage = 'Base token percentage must be between 10% and 100%';
      }

      if (autoListingConfig.lockDuration < 1) {
        newErrors.lockDuration = 'Lock duration must be at least 1 day';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateForm()) {
      onNext({ autoListingConfig });
    }
  };

  const formatDuration = (days: number) => {
    if (days < 30) return `${days} days`;
    if (days < 365) return `${Math.floor(days / 30)} months`;
    return `${Math.floor(days / 365)} years`;
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-4">Auto-Listing Configuration</h2>
        <p className="text-gray-300">Configure automatic DEX listing after presale ends</p>
      </div>

      {/* Auto-Listing Toggle */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="autoListingEnabled"
              checked={autoListingConfig.enabled}
              onChange={(e) => updateConfig({ enabled: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <label htmlFor="autoListingEnabled" className="text-lg font-semibold text-white">
              Enable Auto-Listing
            </label>
          </div>
          <Zap className="w-5 h-5 text-blue-400" />
        </div>
        
        <p className="text-gray-300 text-sm">
          Automatically create a trading pair and add liquidity on DEX after the presale ends successfully.
          This ensures immediate trading capability for participants.
        </p>
      </div>

      {/* Auto-Listing Configuration */}
      {autoListingConfig.enabled && (
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4">Listing Parameters</h3>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Listing Price (tokens per {config.network.symbol})
              </label>
              <input
                type="number"
                min="0"
                step="0.000001"
                value={autoListingConfig.listingPrice}
                onChange={(e) => updateConfig({ listingPrice: e.target.value })}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 1000"
              />
              {errors.listingPrice && <p className="text-red-400 text-sm mt-1">{errors.listingPrice}</p>}
              <p className="text-gray-400 text-xs mt-1">
                Recommended: Same as presale price or slightly higher
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Lock Duration (days)
              </label>
              <select
                value={autoListingConfig.lockDuration}
                onChange={(e) => updateConfig({ lockDuration: parseInt(e.target.value) })}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={30}>30 days</option>
                <option value={60}>60 days</option>
                <option value={90}>90 days</option>
                <option value={180}>180 days</option>
                <option value={365}>1 year</option>
                <option value={730}>2 years</option>
              </select>
              {errors.lockDuration && <p className="text-red-400 text-sm mt-1">{errors.lockDuration}</p>}
              <p className="text-gray-400 text-xs mt-1">
                Duration: {formatDuration(autoListingConfig.lockDuration)}
              </p>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6 mt-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                LP Token Percentage (%)
              </label>
              <input
                type="number"
                min="10"
                max="100"
                value={autoListingConfig.lpTokenPercentage}
                onChange={(e) => updateConfig({ lpTokenPercentage: parseInt(e.target.value) })}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 70"
              />
              {errors.lpTokenPercentage && <p className="text-red-400 text-sm mt-1">{errors.lpTokenPercentage}</p>}
              <p className="text-gray-400 text-xs mt-1">
                Percentage of unsold tokens to add to liquidity
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                LP Base Token Percentage (%)
              </label>
              <input
                type="number"
                min="10"
                max="100"
                value={autoListingConfig.lpBaseTokenPercentage}
                onChange={(e) => updateConfig({ lpBaseTokenPercentage: parseInt(e.target.value) })}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 70"
              />
              {errors.lpBaseTokenPercentage && <p className="text-red-400 text-sm mt-1">{errors.lpBaseTokenPercentage}</p>}
              <p className="text-gray-400 text-xs mt-1">
                Percentage of raised funds to add to liquidity
              </p>
            </div>
          </div>

          {/* Liquidity Preview */}
          <div className="mt-6 p-4 bg-blue-500/20 rounded-lg">
            <h4 className="font-medium text-blue-400 mb-2">Liquidity Preview</h4>
            <p className="text-blue-300 text-sm">
              After the presale ends, {autoListingConfig.lpBaseTokenPercentage}% of raised {config.network.symbol} and {autoListingConfig.lpTokenPercentage}% of unsold tokens will be used to create a liquidity pool. The LP tokens will be locked for {formatDuration(autoListingConfig.lockDuration)}.
            </p>
          </div>
        </div>
      )}

      {/* Warning */}
      {autoListingConfig.enabled && (
        <div className="bg-amber-500/20 border border-amber-500/50 rounded-xl p-6">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5" />
            <div>
              <h3 className="font-medium text-amber-400 mb-1">Important Notice</h3>
              <p className="text-amber-300 text-sm">
                Auto-listing will create a trading pair on DEX immediately after the presale ends. 
                Make sure your listing price is appropriate to avoid price manipulation. 
                The LP tokens will be locked and cannot be withdrawn until the lock period ends.
              </p>
            </div>
          </div>
        </div>
      )}

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