import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Clock, Percent, Calendar, Info } from 'lucide-react';
import { PresaleConfig } from '../../types/presale';

interface VestingStepProps {
  config: PresaleConfig;
  onNext: (config: Partial<PresaleConfig>) => void;
  onBack: () => void;
}

export const VestingStep: React.FC<VestingStepProps> = ({ config, onNext, onBack }) => {
  const [vestingConfig, setVestingConfig] = useState(config.vestingConfig);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateConfig = (updates: Partial<typeof vestingConfig>) => {
    setVestingConfig(prev => ({ ...prev, ...updates }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (vestingConfig.enabled) {
      if (vestingConfig.duration <= 0) {
        newErrors.duration = 'Vesting duration must be greater than 0';
      }

      if (vestingConfig.initialRelease < 0 || vestingConfig.initialRelease > 100) {
        newErrors.initialRelease = 'Initial release must be between 0 and 100%';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateForm()) {
      onNext({ vestingConfig });
    }
  };

  const formatDuration = (days: number) => {
    if (days < 30) return `${days} days`;
    if (days < 365) return `${Math.floor(days / 30)} months`;
    return `${Math.floor(days / 365)} years`;
  };

  const calculateVestingSchedule = () => {
    if (!vestingConfig.enabled) return null;

    const totalTokens = parseFloat(config.tokenInfo.allocatedAmount);
    const initialTokens = (totalTokens * vestingConfig.initialRelease) / 100;
    const vestedTokens = totalTokens - initialTokens;
    const dailyRelease = vestedTokens / vestingConfig.duration;

    return {
      totalTokens,
      initialTokens,
      vestedTokens,
      dailyRelease
    };
  };

  const schedule = calculateVestingSchedule();

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-4">Vesting Configuration</h2>
        <p className="text-gray-300">Configure token vesting schedule for sale participants</p>
      </div>

      {/* Vesting Toggle */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="vestingEnabled"
              checked={vestingConfig.enabled}
              onChange={(e) => updateConfig({ enabled: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <label htmlFor="vestingEnabled" className="text-lg font-semibold text-white">
              Enable Linear Vesting
            </label>
          </div>
          <Info className="w-5 h-5 text-gray-400" />
        </div>
        
        <p className="text-gray-300 text-sm">
          Vesting prevents token dumps by releasing purchased tokens gradually over time. 
          This builds confidence and long-term value for your project.
        </p>
      </div>

      {/* Vesting Configuration */}
      {vestingConfig.enabled && (
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4">Vesting Parameters</h3>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Percent className="w-4 h-4 inline mr-1" />
                Initial Release at TGE (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="1"
                value={vestingConfig.initialRelease}
                onChange={(e) => updateConfig({ initialRelease: parseInt(e.target.value) || 0 })}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 10"
              />
              {errors.initialRelease && <p className="text-red-400 text-sm mt-1">{errors.initialRelease}</p>}
              <p className="text-gray-400 text-xs mt-1">
                Percentage of tokens released immediately after purchase
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Clock className="w-4 h-4 inline mr-1" />
                Vesting Duration (days)
              </label>
              <input
                type="number"
                min="1"
                value={vestingConfig.duration}
                onChange={(e) => updateConfig({ duration: parseInt(e.target.value) || 30 })}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 30"
              />
              {errors.duration && <p className="text-red-400 text-sm mt-1">{errors.duration}</p>}
              <p className="text-gray-400 text-xs mt-1">
                Duration: {formatDuration(vestingConfig.duration)}
              </p>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-300 mb-3">Quick Presets</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { name: '1 Month', duration: 30, initial: 25 },
                { name: '3 Months', duration: 90, initial: 15 },
                { name: '6 Months', duration: 180, initial: 10 },
                { name: '1 Year', duration: 365, initial: 5 }
              ].map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => updateConfig({ duration: preset.duration, initialRelease: preset.initial })}
                  className="p-3 bg-white/5 hover:bg-white/10 border border-white/20 rounded-lg text-center transition-colors"
                >
                  <div className="text-white font-medium text-sm">{preset.name}</div>
                  <div className="text-gray-400 text-xs">{preset.initial}% + vesting</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Vesting Schedule Preview */}
      {vestingConfig.enabled && schedule && (
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4">Vesting Schedule Preview</h3>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="p-4 bg-green-500/20 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Calendar className="w-4 h-4 text-green-400" />
                  <span className="text-green-400 font-medium">At Token Generation Event (TGE)</span>
                </div>
                <div className="text-2xl font-bold text-white">
                  {schedule.initialTokens.toLocaleString()} {config.tokenInfo.tokenSymbol}
                </div>
                <div className="text-sm text-green-300">
                  {vestingConfig.initialRelease}% of purchased tokens
                </div>
              </div>
              
              <div className="p-4 bg-blue-500/20 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <span className="text-blue-400 font-medium">Daily Vesting Release</span>
                </div>
                <div className="text-2xl font-bold text-white">
                  {schedule.dailyRelease.toLocaleString()} {config.tokenInfo.tokenSymbol}
                </div>
                <div className="text-sm text-blue-300">
                  Released daily for {vestingConfig.duration} days
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-purple-500/20 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Percent className="w-4 h-4 text-purple-400" />
                  <span className="text-purple-400 font-medium">Total Vested Amount</span>
                </div>
                <div className="text-2xl font-bold text-white">
                  {schedule.vestedTokens.toLocaleString()} {config.tokenInfo.tokenSymbol}
                </div>
                <div className="text-sm text-purple-300">
                  {100 - vestingConfig.initialRelease}% of purchased tokens
                </div>
              </div>
              
              <div className="p-4 bg-orange-500/20 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Clock className="w-4 h-4 text-orange-400" />
                  <span className="text-orange-400 font-medium">Vesting Duration</span>
                </div>
                <div className="text-2xl font-bold text-white">
                  {formatDuration(vestingConfig.duration)}
                </div>
                <div className="text-sm text-orange-300">
                  Linear release schedule
                </div>
              </div>
            </div>
          </div>

          {/* Timeline Visualization */}
          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-300 mb-3">Release Timeline</h4>
            <div className="relative">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                <div className="flex-1 h-0.5 bg-gradient-to-r from-green-500 to-blue-500"></div>
                <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-400">
                <span>TGE: {vestingConfig.initialRelease}%</span>
                <span>Daily: {((100 - vestingConfig.initialRelease) / vestingConfig.duration).toFixed(3)}%</span>
                <span>Complete: 100%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* No Vesting Info */}
      {!vestingConfig.enabled && (
        <div className="bg-blue-500/20 border border-blue-500/50 rounded-xl p-6">
          <div className="flex items-start space-x-3">
            <Info className="w-5 h-5 text-blue-400 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-400 mb-1">No Vesting Enabled</h3>
              <p className="text-blue-300 text-sm">
                All purchased tokens will be available immediately after the sale ends. 
                Consider enabling vesting to prevent token dumps and build long-term value.
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