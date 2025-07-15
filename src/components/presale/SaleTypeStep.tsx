import React from 'react';
import { ArrowRight, Users, Lock, Globe, Shield, Zap } from 'lucide-react';
import { PresaleConfig } from '../../types/presale';
import { useNetworkMode } from '../../hooks/useNetworkMode';

interface SaleTypeStepProps {
  config: PresaleConfig;
  onNext: (config: Partial<PresaleConfig>) => void;
  onBack: () => void;
}

export const SaleTypeStep: React.FC<SaleTypeStepProps> = ({ config, onNext, onBack }) => {
  const { isTestnetMode } = useNetworkMode();
  
  const handleNext = () => {
    onNext({ saleType: config.saleType });
  };

  const saleTypes = [
    {
      id: 'presale' as const,
      title: 'Presale',
      subtitle: 'Public Access',
      description: 'Open to all participants with configurable limits and caps',
      icon: Globe,
      features: [
        'Public participation',
        'Soft & hard caps',
        'Min/max purchase limits',
        'Automatic refunds',
        'Time-based sale window'
      ],
      color: 'from-blue-500 to-purple-600'
    },
    {
      id: 'private' as const,
      title: 'Private Sale',
      subtitle: 'Wallet Restricted',
      description: 'Exclusive sale for whitelisted wallets only',
      icon: Lock,
      features: [
        'Whitelist-only access',
        'Manual participant approval',
        'Higher allocation limits',
        'Early investor pricing',
        'KYC integration ready'
      ],
      color: 'from-purple-500 to-pink-600'
    },
    {
      id: 'fairlaunch' as const,
      title: 'Fairlaunch',
      subtitle: 'Unlimited Participation',
      description: 'No hard cap, tokens distributed proportionally to contributions',
      icon: Zap,
      features: [
        'No hard cap limit',
        'Proportional distribution',
        'Equal opportunity',
        'Automatic token allocation',
        'Anti-whale protection'
      ],
      color: 'from-green-500 to-blue-600'
    }
  ];

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-4">Choose Sale Type</h2>
        <p className="text-gray-300">Select the type of token sale you want to launch</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {saleTypes.map((saleType) => {
          const Icon = saleType.icon;
          const isSelected = config.saleType === saleType.id;
          
          return (
            <div
              key={saleType.id}
              className={`relative p-8 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:scale-105 ${
                isSelected
                  ? 'border-blue-500 bg-blue-500/20 shadow-lg shadow-blue-500/25'
                  : 'border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10'
              }`}
              onClick={() => onNext({ saleType: saleType.id })}
            >
              {isSelected && (
                <div className="absolute top-4 right-4 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
              )}
              
              <div className={`w-16 h-16 rounded-xl bg-gradient-to-r ${saleType.color} flex items-center justify-center mb-6`}>
                <Icon className="w-8 h-8 text-white" />
              </div>
              
              <h3 className="text-xl font-bold text-white mb-2">{saleType.title}</h3>
              <p className="text-blue-400 text-sm font-medium mb-3">{saleType.subtitle}</p>
              <p className="text-gray-300 text-sm mb-6">{saleType.description}</p>
              
              <div className="space-y-2">
                {saleType.features.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                    <span className="text-gray-300 text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Comparison Table */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">Feature Comparison</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/20">
                <th className="text-left py-3 text-gray-300">Feature</th>
                <th className="text-center py-3 text-blue-400">Presale</th>
                <th className="text-center py-3 text-purple-400">Private Sale</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              <tr className="border-b border-white/10">
                <td className="py-3 text-gray-300">Public Access</td>
                <td className="text-center py-3 text-green-400">✓</td>
                <td className="text-center py-3 text-red-400">✗</td>
                <td className="text-center py-3 text-green-400">✓</td>
              </tr>
              <tr className="border-b border-white/10">
                <td className="py-3 text-gray-300">Whitelist Required</td>
                <td className="text-center py-3 text-red-400">✗</td>
                <td className="text-center py-3 text-green-400">✓</td>
                <td className="text-center py-3 text-red-400">✗</td>
              </tr>
              <tr className="border-b border-white/10">
                <td className="py-3 text-gray-300">Automatic Refunds</td>
                <td className="text-center py-3 text-green-400">✓</td>
                <td className="text-center py-3 text-green-400">✓</td>
                <td className="text-center py-3 text-green-400">✓</td>
              </tr>
              <tr className="border-b border-white/10">
                <td className="py-3 text-gray-300">Vesting Support</td>
                <td className="text-center py-3 text-green-400">✓</td>
                <td className="text-center py-3 text-green-400">✓</td>
                <td className="text-center py-3 text-green-400">✓</td>
              </tr>
              <tr className="border-b border-white/10">
                <td className="py-3 text-gray-300">Hard Cap</td>
                <td className="text-center py-3 text-green-400">✓</td>
                <td className="text-center py-3 text-green-400">✓</td>
                <td className="text-center py-3 text-red-400">✗</td>
              </tr>
              <tr className="border-b border-white/10">
                <td className="py-3 text-gray-300">Anti-Bot Protection</td>
                <td className="text-center py-3 text-green-400">✓</td>
                <td className="text-center py-3 text-green-400">✓</td>
                <td className="text-center py-3 text-green-400">✓</td>
              </tr>
              <tr>
                <td className="py-3 text-gray-300">ESR Cost</td>
                <td className="text-center py-3 text-white">{isTestnetMode ? 'Free (Testnet)' : '100 ESR + Gas'}</td>
                <td className="text-center py-3 text-white">{isTestnetMode ? 'Free (Testnet)' : '100 ESR + Gas'}</td>
                <td className="text-center py-3 text-white">{isTestnetMode ? 'Free (Testnet)' : '100 ESR + Gas'}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="px-6 py-3 text-gray-300 hover:text-white transition-colors"
        >
          Back
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