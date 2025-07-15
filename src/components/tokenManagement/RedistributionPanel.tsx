import React, { useState, useEffect } from 'react';
import { TrendingUp, AlertTriangle, CheckCircle, Loader2, Gift, Settings } from 'lucide-react';
import { TokenManagementData } from '../../types/tokenManagement';

interface RedistributionPanelProps {
  tokenData: TokenManagementData;
  isOwner: boolean;
  userAddress: string;
  onUpdatePercentage: (percentage: number) => Promise<string>;
  onClaimRewards: () => Promise<string>;
  getUnclaimedRewards: (address: string) => Promise<string>;
}

export const RedistributionPanel: React.FC<RedistributionPanelProps> = ({
  tokenData,
  isOwner,
  userAddress,
  onUpdatePercentage,
  onClaimRewards,
  getUnclaimedRewards
}) => {
  const [newPercentage, setNewPercentage] = useState(tokenData.features.holderRedistribution.percentage.toString());
  const [unclaimedRewards, setUnclaimedRewards] = useState('0');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUnclaimedRewards();
  }, [userAddress]);

  const loadUnclaimedRewards = async () => {
    if (!userAddress) return;
    
    try {
      const rewards = await getUnclaimedRewards(userAddress);
      setUnclaimedRewards(rewards);
    } catch (error) {
      console.error('Error loading unclaimed rewards:', error);
    }
  };

  const handleUpdatePercentage = async () => {
    if (!isOwner) return;
    
    setIsUpdating(true);
    setError(null);
    setTxHash(null);
    
    try {
      const percentage = parseFloat(newPercentage);
      const hash = await onUpdatePercentage(percentage);
      setTxHash(hash);
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleClaimRewards = async () => {
    setIsClaiming(true);
    setError(null);
    setTxHash(null);
    
    try {
      const hash = await onClaimRewards();
      setTxHash(hash);
      await loadUnclaimedRewards(); // Refresh rewards
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setIsClaiming(false);
    }
  };

  const canUpdatePercentage = () => {
    if (!isOwner) return false;
    
    const percentage = parseFloat(newPercentage);
    if (isNaN(percentage) || percentage < 0 || percentage > 5) return false;
    
    return percentage !== tokenData.features.holderRedistribution.percentage;
  };

  const canClaimRewards = () => {
    return parseFloat(unclaimedRewards) > 0;
  };

  const simulateRedistribution = () => {
    const percentage = parseFloat(newPercentage);
    const transferAmount = 1000;
    const redistributionAmount = (transferAmount * percentage) / 100;
    const actualTransfer = transferAmount - redistributionAmount;
    
    return { transferAmount, redistributionAmount, actualTransfer };
  };

  const simulation = simulateRedistribution();

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
      <div className="flex items-center space-x-3 mb-6">
        <TrendingUp className="w-6 h-6 text-purple-400" />
        <h3 className="text-xl font-semibold text-white">Holder Redistribution</h3>
      </div>

      {/* Current Settings */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white/5 rounded-lg p-4">
          <div className="text-sm text-gray-300">Redistribution Rate</div>
          <div className="text-2xl font-bold text-white">
            {tokenData.features.holderRedistribution.percentage}%
          </div>
        </div>
        <div className="bg-white/5 rounded-lg p-4">
          <div className="text-sm text-gray-300">Your Unclaimed Rewards</div>
          <div className="text-2xl font-bold text-purple-400">
            {parseFloat(unclaimedRewards).toFixed(6)} {tokenData.symbol}
          </div>
        </div>
      </div>

      {/* Claim Rewards Section */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-white mb-4">Claim Your Rewards</h4>
        
        {parseFloat(unclaimedRewards) > 0 ? (
          <button
            onClick={handleClaimRewards}
            disabled={isClaiming}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {isClaiming ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Claiming...</span>
              </>
            ) : (
              <>
                <Gift className="w-4 h-4" />
                <span>Claim {parseFloat(unclaimedRewards).toFixed(6)} {tokenData.symbol}</span>
              </>
            )}
          </button>
        ) : (
          <div className="bg-gray-500/20 border border-gray-500/50 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <Gift className="w-5 h-5 text-gray-400" />
              <div>
                <h5 className="font-medium text-gray-400">No Rewards Available</h5>
                <p className="text-gray-500 text-sm">
                  You don't have any unclaimed redistribution rewards at the moment.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Owner Controls */}
      {isOwner && (
        <div className="border-t border-white/20 pt-6">
          <h4 className="text-lg font-semibold text-white mb-4">Redistribution Settings</h4>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Redistribution Percentage (0-5%)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="5"
                value={newPercentage}
                onChange={(e) => setNewPercentage(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="0.00"
              />
              {parseFloat(newPercentage) > 5 && (
                <p className="text-red-400 text-sm mt-1">Redistribution percentage cannot exceed 5%</p>
              )}
            </div>

            {/* Redistribution Simulation */}
            {newPercentage && parseFloat(newPercentage) >= 0 && parseFloat(newPercentage) <= 5 && (
              <div className="bg-purple-500/20 border border-purple-500/50 rounded-lg p-4">
                <h5 className="font-medium text-purple-400 mb-2">Redistribution Simulation</h5>
                <div className="text-sm text-purple-300">
                  <p>Transfer of {simulation.transferAmount} {tokenData.symbol}:</p>
                  <p>• Redistributed to holders: {simulation.redistributionAmount.toFixed(2)} {tokenData.symbol} ({newPercentage}%)</p>
                  <p>• Actual transfer: {simulation.actualTransfer.toFixed(2)} {tokenData.symbol}</p>
                </div>
              </div>
            )}

            <button
              onClick={handleUpdatePercentage}
              disabled={!canUpdatePercentage() || isUpdating}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <Settings className="w-4 h-4" />
                  <span>Update Redistribution Rate</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Success Message */}
      {txHash && (
        <div className="mt-4 p-4 bg-green-500/20 border border-green-500/50 rounded-lg">
          <div className="flex items-start space-x-3">
            <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
            <div>
              <h4 className="font-medium text-green-400 mb-1">Transaction Successful</h4>
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
              <h4 className="font-medium text-red-400 mb-1">Transaction Failed</h4>
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Information */}
      <div className="mt-6 p-4 bg-blue-500/20 border border-blue-500/50 rounded-lg">
        <div className="flex items-start space-x-3">
          <TrendingUp className="w-5 h-5 text-blue-400 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-400 mb-1">How Redistribution Works</h4>
            <p className="text-blue-300 text-sm">
              A percentage of each transfer is redistributed proportionally to all token holders.
              The more tokens you hold, the more rewards you receive. Claim your rewards anytime.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};