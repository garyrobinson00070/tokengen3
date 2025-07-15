import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Plus, Trash2, Calendar, Clock, Percent } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { TokenConfig, VestingConfig } from '../types';
import { vestingCategories } from '../data/vestingCategories';

interface VestingConfigurationProps {
  config: TokenConfig;
  onBack: () => void;
  onNext: (config: TokenConfig) => void;
}

export const VestingConfiguration: React.FC<VestingConfigurationProps> = ({ config, onBack, onNext }) => {
  const [vesting, setVesting] = useState<VestingConfig[]>(
    config.vesting.length > 0 ? config.vesting : 
    vestingCategories.map(category => ({
      category: category.id,
      percentage: 0,
      startDate: '',
      duration: category.suggestedDuration,
      enabled: false
    }))
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateVesting = (index: number, updates: Partial<VestingConfig>) => {
    const newVesting = [...vesting];
    newVesting[index] = { ...newVesting[index], ...updates };
    setVesting(newVesting);
  };

  const getTotalPercentage = () => {
    return vesting.filter(v => v.enabled).reduce((sum, v) => sum + v.percentage, 0);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    const totalPercentage = getTotalPercentage();
    
    if (totalPercentage > 100) {
      newErrors.totalPercentage = `Total vesting percentage is ${totalPercentage}%, but cannot exceed 100%`;
    }

    vesting.forEach((vest, index) => {
      if (vest.enabled) {
        if (vest.percentage <= 0) {
          newErrors[`percentage_${index}`] = 'Percentage must be greater than 0';
        }
        if (vest.percentage > 100) {
          newErrors[`percentage_${index}`] = 'Percentage cannot exceed 100%';
        }
        if (!vest.startDate) {
          newErrors[`startDate_${index}`] = 'Please select a start date';
        }
        if (vest.duration <= 0) {
          newErrors[`duration_${index}`] = 'Duration must be at least 1 day';
        }
        // Check if start date is in the past
        if (vest.startDate && new Date(vest.startDate) <= new Date()) {
          newErrors[`startDate_${index}`] = 'Start date must be in the future';
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onNext({
        ...config,
        vesting: vesting.filter(v => v.enabled)
      });
    }
  };

  const formatDate = (days: number) => {
    const years = Math.floor(days / 365);
    const months = Math.floor((days % 365) / 30);
    const remainingDays = days % 30;
    
    let result = '';
    if (years > 0) result += `${years}y `;
    if (months > 0) result += `${months}m `;
    if (remainingDays > 0) result += `${remainingDays}d`;
    
    return result.trim() || '0d';
  };

  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Token Builder</span>
          </button>
          
          <h1 className="text-3xl font-bold text-white mb-2">Vesting Configuration</h1>
          <p className="text-gray-300">Configure token vesting schedules for different allocation categories</p>
        </div>

        {/* Summary */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{getTotalPercentage()}%</div>
                <div className="text-sm text-gray-300">Total Vested</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{100 - getTotalPercentage()}%</div>
                <div className="text-sm text-gray-300">Immediately Available</div>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-sm text-gray-300">Total Supply</div>
              <div className="text-lg font-semibold text-white">
                {parseInt(config.initialSupply).toLocaleString()} {config.symbol}
              </div>
            </div>
          </div>
          
          {errors.totalPercentage && (
            <div className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
              <p className="text-red-400 text-sm">{errors.totalPercentage}</p>
            </div>
          )}
        </div>

        {/* Vesting Categories */}
        <div className="grid gap-6">
          {vesting.map((vest, index) => {
            const category = vestingCategories.find(c => c.id === vest.category)!;
            const Icon = LucideIcons[category.icon as keyof typeof LucideIcons];
            
            return (
              <div key={vest.category} className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`vesting_${index}`}
                          checked={vest.enabled}
                          onChange={(e) => updateVesting(index, { enabled: e.target.checked })}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">{category.name}</h3>
                        <p className="text-sm text-gray-300">{category.description}</p>
                      </div>
                    </div>
                    
                    {vest.enabled && (
                      <div className="text-right">
                        <div className="text-lg font-semibold text-white">
                          {((vest.percentage / 100) * parseInt(config.initialSupply)).toLocaleString()} {config.symbol}
                        </div>
                        <div className="text-sm text-gray-300">{vest.percentage}% of supply</div>
                      </div>
                    )}
                  </div>
                  
                  {vest.enabled && (
                    <div className="grid md:grid-cols-3 gap-4 mt-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          <Percent className="w-4 h-4 inline mr-1" />
                          Percentage (%)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={vest.percentage}
                          onChange={(e) => updateVesting(index, { percentage: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder={category.suggestedPercentage.toString()}
                        />
                        {errors[`percentage_${index}`] && (
                          <p className="text-red-400 text-sm mt-1">{errors[`percentage_${index}`]}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          <Calendar className="w-4 h-4 inline mr-1" />
                          Start Date
                        </label>
                        <input
                          type="date"
                          value={vest.startDate}
                          min={getTomorrowDate()}
                          onChange={(e) => updateVesting(index, { startDate: e.target.value })}
                          className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {errors[`startDate_${index}`] && (
                          <p className="text-red-400 text-sm mt-1">{errors[`startDate_${index}`]}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          <Clock className="w-4 h-4 inline mr-1" />
                          Duration (days)
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={vest.duration}
                          onChange={(e) => updateVesting(index, { duration: parseInt(e.target.value) || 0 })}
                          className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {errors[`duration_${index}`] && (
                          <p className="text-red-400 text-sm mt-1">{errors[`duration_${index}`]}</p>
                        )}
                        <div className="text-xs text-gray-400 mt-1">
                          {formatDate(vest.duration)}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Info */}
        <div className="mt-8 bg-blue-500/20 border border-blue-500/50 rounded-xl p-6">
          <h3 className="font-medium text-blue-400 mb-2">About Token Vesting</h3>
          <p className="text-blue-300 text-sm">
            Vesting schedules lock tokens for a specified period, releasing them gradually over time. 
            This helps prevent token dumps and ensures long-term commitment from team members and investors.
            Tokens are released linearly over the specified duration starting from the start date.
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-between mt-8">
          <button
            onClick={onBack}
            className="px-6 py-3 text-gray-300 hover:text-white transition-colors"
          >
            Back
          </button>
          
          <button
            onClick={handleSubmit}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2"
          >
            <span>Continue to Review</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};