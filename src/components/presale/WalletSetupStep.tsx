import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Wallet, Shield, AlertTriangle, Copy } from 'lucide-react';
import { PresaleConfig } from '../../types/presale';
import { useWallet } from '../../hooks/useWallet';

interface WalletSetupStepProps {
  config: PresaleConfig;
  onNext: (config: Partial<PresaleConfig>) => void;
  onBack: () => void;
}

export const WalletSetupStep: React.FC<WalletSetupStepProps> = ({ config, onNext, onBack }) => {
  const { address } = useWallet();
  const [walletSetup, setWalletSetup] = useState(config.walletSetup);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState<string | null>(null);

  const updateConfig = (updates: Partial<typeof walletSetup>) => {
    setWalletSetup(prev => ({ ...prev, ...updates }));
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const isValidAddress = (address: string) => {
    return /^0x[a-fA-F0-9]{40}$/i.test(address);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!walletSetup.saleReceiver.trim()) {
      newErrors.saleReceiver = 'Sale receiver wallet is required';
    } else if (!isValidAddress(walletSetup.saleReceiver)) {
      newErrors.saleReceiver = 'Invalid wallet address format. Must start with 0x followed by 40 hex characters.';
    }

    if (!walletSetup.refundWallet.trim()) {
      newErrors.refundWallet = 'Refund wallet is required';
    } else if (!isValidAddress(walletSetup.refundWallet)) {
      newErrors.refundWallet = 'Invalid wallet address format. Must start with 0x followed by 40 hex characters.';
    }
    
    // Check if both addresses are the same
    if (walletSetup.saleReceiver && walletSetup.refundWallet && 
        walletSetup.saleReceiver.toLowerCase() === walletSetup.refundWallet.toLowerCase()) {
      newErrors.refundWallet = 'Sale receiver and refund wallet should be different for security';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateForm()) {
      onNext({ walletSetup });
    }
  };

  const useCurrentWallet = (field: 'saleReceiver' | 'refundWallet') => {
    if (address) {
      updateConfig({ [field]: address });
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-4">Wallet Setup</h2>
        <p className="text-gray-300">Configure wallets for receiving funds and handling refunds</p>
      </div>

      {/* Sale Receiver Wallet */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Sale Receiver Wallet</h3>
            <p className="text-gray-300 text-sm">Where raised funds will be sent</p>
          </div>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Wallet Address
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={walletSetup.saleReceiver}
                onChange={(e) => updateConfig({ saleReceiver: e.target.value })}
                className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0x..."
              />
              {address && (
                <button
                  onClick={() => useCurrentWallet('saleReceiver')}
                  className="px-4 py-3 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors text-sm"
                >
                  Use Current
                </button>
              )}
            </div>
            {errors.saleReceiver && <p className="text-red-400 text-sm mt-1">{errors.saleReceiver}</p>}
          </div>
          
          <div className="p-4 bg-green-500/20 rounded-lg">
            <div className="flex items-start space-x-3">
              <Shield className="w-5 h-5 text-green-400 mt-0.5" />
              <div>
                <h4 className="font-medium text-green-400 mb-1">Funds Flow</h4>
                <p className="text-green-300 text-sm">
                  When participants contribute to your sale, funds will be automatically sent to this wallet address. 
                  Make sure you have access to this wallet and keep it secure.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Refund Wallet */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Refund Wallet</h3>
            <p className="text-gray-300 text-sm">Source wallet for refunds if soft cap is not reached</p>
          </div>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Wallet Address
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={walletSetup.refundWallet}
                onChange={(e) => updateConfig({ refundWallet: e.target.value })}
                className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0x..."
              />
              {address && (
                <button
                  onClick={() => useCurrentWallet('refundWallet')}
                  className="px-4 py-3 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors text-sm"
                >
                  Use Current
                </button>
              )}
            </div>
            {errors.refundWallet && <p className="text-red-400 text-sm mt-1">{errors.refundWallet}</p>}
          </div>
          
          <div className="p-4 bg-orange-500/20 rounded-lg">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-orange-400 mt-0.5" />
              <div>
                <h4 className="font-medium text-orange-400 mb-1">Refund Mechanism</h4>
                <p className="text-orange-300 text-sm">
                  If your sale doesn't reach the soft cap, participants can claim refunds. 
                  This wallet must have sufficient funds to cover all potential refunds.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Wallet Summary */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">Wallet Configuration Summary</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
            <div>
              <div className="text-white font-medium">Sale Receiver</div>
              <div className="text-gray-300 text-sm font-mono">
                {walletSetup.saleReceiver || 'Not set'}
              </div>
            </div>
            {walletSetup.saleReceiver && (
              <button
                onClick={() => copyToClipboard(walletSetup.saleReceiver, 'receiver')}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                <Copy className="w-4 h-4" />
              </button>
            )}
          </div>
          
          <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
            <div>
              <div className="text-white font-medium">Refund Wallet</div>
              <div className="text-gray-300 text-sm font-mono">
                {walletSetup.refundWallet || 'Not set'}
              </div>
            </div>
            {walletSetup.refundWallet && (
              <button
                onClick={() => copyToClipboard(walletSetup.refundWallet, 'refund')}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                <Copy className="w-4 h-4" />
              </button>
            )}
          </div>
          
          {copied && (
            <div className="text-green-400 text-sm text-center">
              Address copied to clipboard!
            </div>
          )}
        </div>
      </div>

      {/* Security Notice */}
      <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-6">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5" />
          <div>
            <h3 className="font-medium text-red-400 mb-1">Security Notice</h3>
            <ul className="text-red-300 text-sm space-y-1">
              <li>• Ensure you have access to both wallet addresses</li>
              <li>• Keep your private keys secure and backed up</li>
              <li>• Test with small amounts before launching</li>
              <li>• Consider using multi-signature wallets for large sales</li>
              <li>• Never share your private keys with anyone</li>
            </ul>
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