import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Loader2, Wallet } from 'lucide-react';
import { useESRToken } from '../hooks/useESRToken';
import { useWallet } from '../hooks/useWallet';
import { useNetworkMode } from '../hooks/useNetworkMode';

interface ESRBalanceCheckProps {
  requiredAmount?: number;
  isTestnet?: boolean; // This prop is now optional as we'll use the global mode
  onBalanceChange?: (hasEnough: boolean) => void;
}

export const ESRBalanceCheck: React.FC<ESRBalanceCheckProps> = ({ 
  requiredAmount = 100, 
  isTestnet: propIsTestnet,
  onBalanceChange 
}) => {
  const { isConnected, address } = useWallet();
  const { balance, isLoading, error, checkBalance, deductTokens } = useESRToken();
  const { isTestnetMode } = useNetworkMode();
  
  // Use prop if provided, otherwise use global mode
  const isTestnet = propIsTestnet !== undefined ? propIsTestnet : isTestnetMode;
  
  const [isDeducting, setIsDeducting] = useState(false);
  const [deductError, setDeductError] = useState<string | null>(null);
  const [deductSuccess, setDeductSuccess] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const hasEnoughBalance = balance >= requiredAmount;

  useEffect(() => {
    if (isConnected && address) {
      checkBalance(address);
    }
  }, [isConnected, address, checkBalance, retryCount]);

  useEffect(() => {
    onBalanceChange?.(hasEnoughBalance);
  }, [hasEnoughBalance, onBalanceChange]);

  const handleDeductTokens = async () => {
    if (!address || !hasEnoughBalance) return;
    
    setDeductError(null);
    setDeductSuccess(false);
    setTxHash(null);
    setIsDeducting(true);
    
    try {
      const hash = await deductTokens(address, requiredAmount);
      setTxHash(hash);
      setDeductSuccess(true);
      await checkBalance(address);
    } catch (error) {
      const errorMessage = (error as Error).message || 'Failed to deduct tokens';
      console.error('Failed to deduct tokens:', errorMessage);
      setDeductError(errorMessage);
    } finally {
      setIsDeducting(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="bg-amber-500/20 border border-amber-500/50 rounded-xl p-6">
        <div className="flex items-center space-x-3">
          <Wallet className="w-5 h-5 text-amber-400" />
          <div>
            <h3 className="font-medium text-amber-400 mb-1">Wallet Required</h3>
            <p className="text-amber-300 text-sm">
              Please connect your wallet to check ESR token balance
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isTestnet) {
    return (
      <div className="bg-green-500/20 border border-green-500/50 rounded-xl p-6">
        <div className="flex items-center space-x-3">
          <CheckCircle className="w-5 h-5 text-green-400" />
          <div>
            <h3 className="font-medium text-green-400 mb-1">Testnet Deployment</h3>
            <p className="text-green-300 text-sm">
              No ESR tokens required for testnet deployments
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
        <div className="flex items-center space-x-3">
          <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
          <div>
            <h3 className="font-medium text-white mb-1">Checking Balance</h3>
            <p className="text-gray-300 text-sm">
              Verifying your ESR token balance...
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  if (error && !isTestnet) {
    return (
      <div className="bg-amber-500/20 border border-amber-500/50 rounded-xl p-6">
        <div className="flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-amber-400" />
          <div>
            <h3 className="font-medium text-amber-400 mb-1">Balance Check Error</h3>
            <p className="text-amber-300 text-sm">
              {error}
            </p>
            <button 
              onClick={() => {
                setRetryCount(prev => prev + 1);
                address && checkBalance(address);
              }}
              className="mt-2 text-amber-400 hover:text-amber-300 text-sm font-medium"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-xl p-6 border ${
      hasEnoughBalance 
        ? 'bg-green-500/20 border-green-500/50' 
        : 'bg-red-500/20 border-red-500/50'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          {hasEnoughBalance ? (
            <CheckCircle className="w-5 h-5 text-green-400" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-400" />
          )}
          <div>
            <h3 className={`font-medium mb-1 ${
              hasEnoughBalance ? 'text-green-400' : 'text-red-400'
            }`}>
              ESR Token Balance
            </h3>
            <p className={`text-sm ${
              hasEnoughBalance ? 'text-green-300' : 'text-red-300'
            }`}>
              {hasEnoughBalance 
                ? `You have ${balance} ESR tokens (${requiredAmount} required)`
                : `You need ${requiredAmount - balance} more ESR tokens to deploy`
              }
            </p>
          </div>
        </div>
        
        <div className="text-right">
          <div className={`text-lg font-bold ${
            hasEnoughBalance ? 'text-green-400' : 'text-red-400'
          }`}>
            {balance} ESR
          </div>
          <div className="text-xs text-gray-400">
            Required: {requiredAmount} ESR
          </div>
        </div>
      </div>

      {!hasEnoughBalance && (
        <div className="mt-4 p-3 bg-red-500/10 rounded-lg">
          <p className="text-red-300 text-sm">
            <strong>How to get ESR tokens:</strong>
            <br />
            • Purchase on decentralized exchanges
            • Participate in community events
            • Earn through platform rewards
          </p>
        </div>
      )}

      {hasEnoughBalance && !isTestnet && (
        <>
          <div className="mt-4 p-3 bg-blue-500/20 rounded-lg">
            <p className="text-blue-300 text-sm">
              ✅ Ready to deploy! {requiredAmount} ESR tokens will be deducted upon deployment.
            </p>
          </div>
          
          {deductSuccess && txHash && (
            <div className="mt-4 p-3 bg-green-500/20 rounded-lg">
              <p className="text-green-300 text-sm">
                ✅ ESR tokens successfully deducted! Transaction: {txHash.slice(0, 10)}...{txHash.slice(-6)}
              </p>
            </div>
          )}
          
          {deductError && (
            <div className="mt-4 p-3 bg-red-500/20 rounded-lg">
              <p className="text-red-300 text-sm">
                ❌ Error: {deductError}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};