import React, { useState } from 'react';
import { Coins, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { TokenManagementData } from '../../types/tokenManagement';

interface MintTokensPanelProps {
  tokenData: TokenManagementData;
  isOwner: boolean;
  onMint: (to: string, amount: string) => Promise<string>;
}

export const MintTokensPanel: React.FC<MintTokensPanelProps> = ({
  tokenData,
  isOwner,
  onMint
}) => {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [isMinting, setIsMinting] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleMint = async () => {
    if (!recipient || !amount || !isOwner) return;
    
    setIsMinting(true);
    setError(null);
    setTxHash(null);
    
    try {
      const hash = await onMint(recipient, amount);
      setTxHash(hash);
      setRecipient('');
      setAmount('');
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setIsMinting(false);
    }
  };

  const isValidAddress = (address: string) => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  };

  const canMint = () => {
    if (!isOwner) return false;
    if (!recipient || !amount) return false;
    if (!isValidAddress(recipient)) return false;
    if (parseFloat(amount) <= 0) return false;
    
    // Check max supply if set
    if (tokenData.maxSupply !== '0') {
      const newTotal = parseFloat(tokenData.totalSupply) + parseFloat(amount);
      if (newTotal > parseFloat(tokenData.maxSupply)) return false;
    }
    
    return true;
  };

  const getRemainingSupply = () => {
    if (tokenData.maxSupply === '0') return 'Unlimited';
    return (parseFloat(tokenData.maxSupply) - parseFloat(tokenData.totalSupply)).toLocaleString();
  };

  if (!isOwner) {
    return (
      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
        <div className="flex items-center space-x-3 mb-4">
          <Coins className="w-6 h-6 text-blue-400" />
          <h3 className="text-xl font-semibold text-white">Mint Tokens</h3>
        </div>
        
        <div className="bg-amber-500/20 border border-amber-500/50 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5" />
            <div>
              <h4 className="font-medium text-amber-400 mb-1">Owner Only</h4>
              <p className="text-amber-300 text-sm">
                Only the contract owner can mint new tokens.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
      <div className="flex items-center space-x-3 mb-6">
        <Coins className="w-6 h-6 text-blue-400" />
        <h3 className="text-xl font-semibold text-white">Mint Tokens</h3>
      </div>

      {/* Supply Information */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white/5 rounded-lg p-4">
          <div className="text-sm text-gray-300">Current Supply</div>
          <div className="text-lg font-bold text-white">
            {parseFloat(tokenData.totalSupply).toLocaleString()}
          </div>
        </div>
        <div className="bg-white/5 rounded-lg p-4">
          <div className="text-sm text-gray-300">Max Supply</div>
          <div className="text-lg font-bold text-white">
            {tokenData.maxSupply !== '0' ? parseFloat(tokenData.maxSupply).toLocaleString() : 'Unlimited'}
          </div>
        </div>
        <div className="bg-white/5 rounded-lg p-4">
          <div className="text-sm text-gray-300">Remaining</div>
          <div className="text-lg font-bold text-white">
            {getRemainingSupply()}
          </div>
        </div>
      </div>

      {/* Mint Form */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Recipient Address
          </label>
          <input
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0x..."
          />
          {recipient && !isValidAddress(recipient) && (
            <p className="text-red-400 text-sm mt-1">Invalid address format</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Amount to Mint
          </label>
          <input
            type="number"
            step="0.000001"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0.0"
          />
          {amount && tokenData.maxSupply !== '0' && (
            <div className="mt-2">
              {parseFloat(tokenData.totalSupply) + parseFloat(amount) > parseFloat(tokenData.maxSupply) ? (
                <p className="text-red-400 text-sm">Amount exceeds max supply</p>
              ) : (
                <p className="text-green-400 text-sm">
                  New total supply: {(parseFloat(tokenData.totalSupply) + parseFloat(amount)).toLocaleString()}
                </p>
              )}
            </div>
          )}
        </div>

        <button
          onClick={handleMint}
          disabled={!canMint() || isMinting}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isMinting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Minting...</span>
            </>
          ) : (
            <>
              <Coins className="w-4 h-4" />
              <span>Mint Tokens</span>
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
              <h4 className="font-medium text-green-400 mb-1">Tokens Minted Successfully</h4>
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
              <h4 className="font-medium text-red-400 mb-1">Minting Failed</h4>
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
              Minting new tokens increases the total supply and may affect token value. 
              Ensure you have the necessary permissions and consider the economic impact.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};