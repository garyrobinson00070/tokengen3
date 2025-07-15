import React, { useState, useEffect } from 'react';
import { Flame, AlertTriangle, CheckCircle, Loader2, Wallet } from 'lucide-react';
import { TokenManagementData } from '../../types/tokenManagement';
import { web3Service } from '../../services/web3Service';

interface BurnTokensPanelProps {
  tokenData: TokenManagementData;
  userAddress: string;
  onBurn: (amount: string) => Promise<string>;
}

export const BurnTokensPanel: React.FC<BurnTokensPanelProps> = ({
  tokenData,
  userAddress,
  onBurn
}) => {
  const [amount, setAmount] = useState('');
  const [userBalance, setUserBalance] = useState('0');
  const [isBurning, setIsBurning] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUserBalance();
  }, [userAddress, tokenData.address]);

  const loadUserBalance = async () => {
    if (!userAddress || !tokenData.address) return;
    
    try {
      const balance = await web3Service.getTokenBalance(tokenData.address, userAddress);
      setUserBalance(balance);
    } catch (error) {
      console.error('Error loading user balance:', error);
    }
  };

  const handleBurn = async () => {
    if (!amount || parseFloat(amount) <= 0) return;
    
    setIsBurning(true);
    setError(null);
    setTxHash(null);
    
    try {
      const hash = await onBurn(amount);
      setTxHash(hash);
      setAmount('');
      await loadUserBalance(); // Refresh balance
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setIsBurning(false);
    }
  };

  const canBurn = () => {
    if (!amount) return false;
    if (parseFloat(amount) <= 0) return false;
    if (parseFloat(amount) > parseFloat(userBalance)) return false;
    return true;
  };

  const setMaxAmount = () => {
    setAmount(userBalance);
  };

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
      <div className="flex items-center space-x-3 mb-6">
        <Flame className="w-6 h-6 text-orange-400" />
        <h3 className="text-xl font-semibold text-white">Burn Tokens</h3>
      </div>

      {/* Balance Information */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white/5 rounded-lg p-4">
          <div className="text-sm text-gray-300">Your Balance</div>
          <div className="text-lg font-bold text-white">
            {parseFloat(userBalance).toLocaleString()} {tokenData.symbol}
          </div>
        </div>
        <div className="bg-white/5 rounded-lg p-4">
          <div className="text-sm text-gray-300">Current Total Supply</div>
          <div className="text-lg font-bold text-white">
            {parseFloat(tokenData.totalSupply).toLocaleString()}
          </div>
        </div>
      </div>

      {parseFloat(userBalance) === 0 ? (
        <div className="bg-amber-500/20 border border-amber-500/50 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Wallet className="w-5 h-5 text-amber-400 mt-0.5" />
            <div>
              <h4 className="font-medium text-amber-400 mb-1">No Tokens to Burn</h4>
              <p className="text-amber-300 text-sm">
                You don't have any {tokenData.symbol} tokens in your wallet to burn.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Amount to Burn
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.000001"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 pr-20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="0.0"
              />
              <button
                onClick={setMaxAmount}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 px-3 py-1 bg-orange-500/20 text-orange-400 rounded text-sm hover:bg-orange-500/30 transition-colors"
              >
                MAX
              </button>
            </div>
            {amount && parseFloat(amount) > parseFloat(userBalance) && (
              <p className="text-red-400 text-sm mt-1">Amount exceeds your balance</p>
            )}
            {amount && parseFloat(amount) > 0 && parseFloat(amount) <= parseFloat(userBalance) && (
              <p className="text-green-400 text-sm mt-1">
                New total supply: {(parseFloat(tokenData.totalSupply) - parseFloat(amount)).toLocaleString()}
              </p>
            )}
          </div>

          <button
            onClick={handleBurn}
            disabled={!canBurn() || isBurning}
            className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isBurning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Burning...</span>
              </>
            ) : (
              <>
                <Flame className="w-4 h-4" />
                <span>Burn Tokens</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Success Message */}
      {txHash && (
        <div className="mt-4 p-4 bg-green-500/20 border border-green-500/50 rounded-lg">
          <div className="flex items-start space-x-3">
            <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
            <div>
              <h4 className="font-medium text-green-400 mb-1">Tokens Burned Successfully</h4>
              <p className="text-green-300 text-sm">
                Transaction: {txHash.slice(0, 10)}...{txHash.slice(-8)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5" />
            <div>
              <h4 className="font-medium text-red-400 mb-1">Burning Failed</h4>
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Warning */}
      <div className="mt-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5" />
          <div>
            <h4 className="font-medium text-red-400 mb-1">Permanent Action</h4>
            <p className="text-red-300 text-sm">
              Burning tokens permanently removes them from circulation. This action cannot be undone.
              The total supply will be reduced by the burned amount.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};