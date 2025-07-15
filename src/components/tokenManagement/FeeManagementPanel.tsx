import React, { useState } from 'react';
import { Percent, AlertTriangle, CheckCircle, Loader2, Settings } from 'lucide-react';
import { TokenManagementData } from '../../types/tokenManagement';

interface FeeManagementPanelProps {
  tokenData: TokenManagementData;
  isOwner: boolean;
  onUpdateFees: (percentage: number, recipient?: string) => Promise<string>;
}

export const FeeManagementPanel: React.FC<FeeManagementPanelProps> = ({
  tokenData,
  isOwner,
  onUpdateFees
}) => {
  const [newPercentage, setNewPercentage] = useState(tokenData.features.transferFees.percentage.toString());
  const [newRecipient, setNewRecipient] = useState(tokenData.features.transferFees.recipient);
  const [isUpdating, setIsUpdating] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUpdateFees = async () => {
    if (!isOwner) return;
    
    setIsUpdating(true);
    setError(null);
    setTxHash(null);
    
    try {
      const percentage = parseFloat(newPercentage);
      const recipientChanged = newRecipient !== tokenData.features.transferFees.recipient;
      
      const hash = await onUpdateFees(
        percentage,
        recipientChanged ? newRecipient : undefined
      );
      
      setTxHash(hash);
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setIsUpdating(false);
    }
  };

  const isValidAddress = (address: string) => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  };

  const canUpdate = () => {
    if (!isOwner) return false;
    
    const percentage = parseFloat(newPercentage);
    if (isNaN(percentage) || percentage < 0 || percentage > 10) return false;
    
    if (newRecipient && !isValidAddress(newRecipient)) return false;
    
    // Check if anything changed
    const percentageChanged = percentage !== tokenData.features.transferFees.percentage;
    const recipientChanged = newRecipient !== tokenData.features.transferFees.recipient;
    
    return percentageChanged || recipientChanged;
  };

  const simulateTransaction = () => {
    const percentage = parseFloat(newPercentage);
    const amount = 1000;
    const feeAmount = (amount * percentage) / 100;
    const receivedAmount = amount - feeAmount;
    
    return { amount, feeAmount, receivedAmount };
  };

  if (!isOwner) {
    return (
      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
        <div className="flex items-center space-x-3 mb-4">
          <Percent className="w-6 h-6 text-blue-400" />
          <h3 className="text-xl font-semibold text-white">Transfer Fees</h3>
        </div>
        
        <div className="space-y-4">
          <div className="bg-white/5 rounded-lg p-4">
            <div className="text-sm text-gray-300">Current Fee Rate</div>
            <div className="text-2xl font-bold text-white">
              {tokenData.features.transferFees.percentage}%
            </div>
          </div>
          
          <div className="bg-white/5 rounded-lg p-4">
            <div className="text-sm text-gray-300">Fee Recipient</div>
            <div className="text-white font-mono text-sm">
              {tokenData.features.transferFees.recipient}
            </div>
          </div>
        </div>
        
        <div className="mt-6 bg-amber-500/20 border border-amber-500/50 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5" />
            <div>
              <h4 className="font-medium text-amber-400 mb-1">Owner Only</h4>
              <p className="text-amber-300 text-sm">
                Only the contract owner can modify transfer fee settings.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const simulation = simulateTransaction();

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
      <div className="flex items-center space-x-3 mb-6">
        <Percent className="w-6 h-6 text-blue-400" />
        <h3 className="text-xl font-semibold text-white">Transfer Fee Management</h3>
      </div>

      {/* Current Settings */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white/5 rounded-lg p-4">
          <div className="text-sm text-gray-300">Current Fee Rate</div>
          <div className="text-2xl font-bold text-white">
            {tokenData.features.transferFees.percentage}%
          </div>
        </div>
        <div className="bg-white/5 rounded-lg p-4">
          <div className="text-sm text-gray-300">Fee Recipient</div>
          <div className="text-white font-mono text-sm break-all">
            {tokenData.features.transferFees.recipient}
          </div>
        </div>
      </div>

      {/* Update Form */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            New Fee Percentage (0-10%)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            max="10"
            value={newPercentage}
            onChange={(e) => setNewPercentage(e.target.value)}
            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0.00"
          />
          {parseFloat(newPercentage) > 10 && (
            <p className="text-red-400 text-sm mt-1">Fee percentage cannot exceed 10%</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Fee Recipient Address (optional)
          </label>
          <input
            type="text"
            value={newRecipient}
            onChange={(e) => setNewRecipient(e.target.value)}
            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0x... (leave empty to keep current)"
          />
          {newRecipient && !isValidAddress(newRecipient) && (
            <p className="text-red-400 text-sm mt-1">Invalid address format</p>
          )}
        </div>

        {/* Transaction Simulation */}
        {newPercentage && parseFloat(newPercentage) >= 0 && parseFloat(newPercentage) <= 10 && (
          <div className="bg-blue-500/20 border border-blue-500/50 rounded-lg p-4">
            <h4 className="font-medium text-blue-400 mb-2">Transaction Simulation</h4>
            <div className="text-sm text-blue-300">
              <p>Transfer of {simulation.amount} {tokenData.symbol}:</p>
              <p>• Fee: {simulation.feeAmount.toFixed(2)} {tokenData.symbol} ({newPercentage}%)</p>
              <p>• Recipient receives: {simulation.receivedAmount.toFixed(2)} {tokenData.symbol}</p>
            </div>
          </div>
        )}

        <button
          onClick={handleUpdateFees}
          disabled={!canUpdate() || isUpdating}
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
              <span>Update Fee Settings</span>
            </>
          )}
        </button>
      </div>

      {/* Success Message */}
      {txHash && (
        <div className="mt-4 p-4 bg-green-500/20 border border-green-500/50 rounded-lg">
          <div className="flex items-start space-x-3">
            <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
            <div>
              <h4 className="font-medium text-green-400 mb-1">Fee Settings Updated</h4>
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
              <h4 className="font-medium text-red-400 mb-1">Update Failed</h4>
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Warning */}
      <div className="mt-6 p-4 bg-amber-500/20 border border-amber-500/50 rounded-lg">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5" />
          <div>
            <h4 className="font-medium text-amber-400 mb-1">Important</h4>
            <p className="text-amber-300 text-sm">
              Transfer fees are applied to all token transfers except those involving the contract owner.
              High fees may discourage trading and affect token liquidity.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};