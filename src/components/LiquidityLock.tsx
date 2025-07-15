import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  ExternalLink, 
  Copy, 
  ArrowLeft,
  Loader2
} from 'lucide-react';
import { ethers } from 'ethers';
import { useWallet } from '../hooks/useWallet';
import { web3Service } from '../services/web3Service';
import LiquidityLockerABI from '../abis/LiquidityLocker.json';

interface LockInfo {
  id: string;
  token: string;
  tokenSymbol: string;
  amount: string;
  lockTime: number;
  unlockTime: number;
  withdrawn: boolean;
}

export const LiquidityLock: React.FC = () => {
  const { isConnected, address } = useWallet();
  const [locks, setLocks] = useState<LockInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState('');
  const [amount, setAmount] = useState('');
  const [duration, setDuration] = useState('30'); // Default 30 days
  const [isLocking, setIsLocking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  // Liquidity Locker contract address
  // Using lowercase to avoid checksum errors during initialization
  const LOCKER_ADDRESS = '0x742d35cc6634c0532925a3b8d4c9db96590c6c8c'.toLowerCase();

  useEffect(() => {
    if (isConnected && address) {
      loadUserLocks();
    }
  }, [isConnected, address]);

  const loadUserLocks = async () => {
    if (!address) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const provider = web3Service.getProvider();
      if (!provider) throw new Error('Provider not available');
      
      // Helper function to safely get checksummed address
      const getChecksummedAddress = (addr: string): string => {
        try {
          return ethers.getAddress(addr);
        } catch (error) {
          console.error('Invalid address format:', addr, error);
          return addr;
        }
      };
      
      try {
        const lockerContract = new ethers.Contract(
          getChecksummedAddress(LOCKER_ADDRESS), 
          LiquidityLockerABI, 
          provider
        );
      
        // Get user's lock IDs with error handling for empty contract response
        let lockIds;
        try {
          lockIds = await lockerContract.getUserLocks(address);
        } catch (error: any) {
          // Handle BAD_DATA error when contract returns empty data (0x)
          if (error.code === 'BAD_DATA' && error.value === '0x') {
            console.warn('Contract returned empty data - treating as no locks found');
            setLocks([]);
            return;
          }
          throw error;
        }
        
        // Get lock details for each ID
        const lockPromises = lockIds.map(async (id: any) => {
          const lockInfo = await lockerContract.getLockInfo(id);
          
          // Get token symbol
          let tokenSymbol = 'LP';
          try {
            const tokenContract = new ethers.Contract(
              getChecksummedAddress(lockInfo[0]),
              ['function symbol() external view returns (string)'],
              provider
            );
            tokenSymbol = await tokenContract.symbol();
          } catch (error) {
            console.error('Error getting token symbol:', error);
          }
          
          return {
            id: id.toString(),
            token: lockInfo[0],
            tokenSymbol,
            amount: ethers.formatEther(lockInfo[2]),
            lockTime: Number(lockInfo[3]),
            unlockTime: Number(lockInfo[4]),
            withdrawn: lockInfo[5]
          };
        });
        
        const lockDetails = await Promise.all(lockPromises);
        setLocks(lockDetails);
      } catch (error: any) {
        console.error('Error interacting with locker contract:', error);
        setError('Failed to load your locked liquidity. Please try again.');
        setLocks([]);
      }
    } catch (error) {
      console.error('Error loading locks:', error);
      setError('Failed to load your locked liquidity. Please try again.');
      setLocks([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLockLiquidity = async () => {
    if (!isConnected || !address || !token || !amount || !duration) return;
    
    setIsLocking(true);
    setError(null);
    setSuccess(null);
    
    try {
      const provider = web3Service.getProvider();
      const signer = web3Service.getSigner();
      if (!provider || !signer) throw new Error('Wallet connection issue');

      // Helper function to safely get checksummed address
      const getChecksummedAddress = (addr: string): string => {
        try {
          return ethers.getAddress(addr);
        } catch (error) {
          console.error('Invalid address format:', addr, error);
          return addr;
        }
      };
      
      // Check if token is valid
      if (!ethers.isAddress(token)) {
        throw new Error('Invalid token address');
      }
      
      // Check if amount is valid
      const amountWei = ethers.parseEther(amount);
      if (amountWei <= 0n) {
        throw new Error('Amount must be greater than 0');
      }
      
      // Check if duration is valid
      const durationSeconds = parseInt(duration) * 24 * 60 * 60; // Convert days to seconds
      if (durationSeconds < 24 * 60 * 60) { // Minimum 1 day
        throw new Error('Duration must be at least 1 day');
      }
      
      // Check token allowance
      const tokenContract = new ethers.Contract(
        getChecksummedAddress(token),
        [
          'function allowance(address,address) view returns (uint256)', 
          'function approve(address,uint256) returns (bool)'
        ],
        signer
      );
      
      const allowance = await tokenContract.allowance(address, ethers.getAddress(LOCKER_ADDRESS));
      
      // If allowance is insufficient, request approval
      if (allowance < amountWei) {
        const approveTx = await tokenContract.approve(ethers.getAddress(LOCKER_ADDRESS), amountWei);
        await approveTx.wait();
      }
      
      // Lock liquidity
      const lockerContract = new ethers.Contract(
        ethers.getAddress(LOCKER_ADDRESS), 
        LiquidityLockerABI, 
        signer
      );
      const lockTx = await lockerContract.lockLiquidity(token, amountWei, durationSeconds);
      
      const receipt = await lockTx.wait();
      
      // Get lock ID from event
      const event = receipt.logs
        .map((log: any) => {
          try {
            return lockerContract.interface.parseLog(log);
          } catch (e) {
            return null;
          }
        })
        .find((event: any) => event && event.name === 'LiquidityLocked');
      
      if (event) {
        const lockId = event.args[0].toString();
        setSuccess(`Successfully locked liquidity! Lock ID: ${lockId}`);
        
        // Refresh locks
        await loadUserLocks();
      } else {
        throw new Error('Lock transaction succeeded but lock ID not found');
      }
    } catch (error) {
      console.error('Error locking liquidity:', error);
      setError((error as Error).message || 'Failed to lock liquidity');
    } finally {
      setIsLocking(false);
    }
  };

  const handleWithdraw = async (lockId: string) => {
    if (!isConnected || !address) return;
    
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const signer = web3Service.getSigner();
      if (!signer) throw new Error('Wallet connection issue');
      
      const lockerContract = new ethers.Contract(
        ethers.getAddress(LOCKER_ADDRESS), 
        LiquidityLockerABI, 
        signer
      );
      
      const withdrawTx = await lockerContract.withdraw(lockId);
      await withdrawTx.wait();
      
      setSuccess('Successfully withdrawn locked liquidity!');
      
      // Refresh locks
      await loadUserLocks();
    } catch (error) {
      console.error('Error withdrawing liquidity:', error);
      setError((error as Error).message || 'Failed to withdraw liquidity');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExtendLock = async (lockId: string, additionalDays: number) => {
    if (!isConnected || !address) return;
    
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const signer = web3Service.getSigner();
      if (!signer) throw new Error('Wallet connection issue');
      
      const lockerContract = new ethers.Contract(
        ethers.getAddress(LOCKER_ADDRESS), 
        LiquidityLockerABI, 
        signer
      );
      
      const additionalSeconds = additionalDays * 24 * 60 * 60;
      const extendTx = await lockerContract.extendLock(lockId, additionalSeconds);
      await extendTx.wait();
      
      setSuccess(`Successfully extended lock by ${additionalDays} days!`);
      
      // Refresh locks
      await loadUserLocks();
    } catch (error) {
      console.error('Error extending lock:', error);
      setError((error as Error).message || 'Failed to extend lock');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const isUnlockable = (lock: LockInfo) => {
    return !lock.withdrawn && Date.now() / 1000 > lock.unlockTime;
  };

  const getTimeRemaining = (unlockTime: number) => {
    const now = Date.now() / 1000;
    if (now > unlockTime) return 'Unlocked';
    
    const seconds = unlockTime - now;
    const days = Math.floor(seconds / (24 * 60 * 60));
    const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
    
    return `${days}d ${hours}h`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => window.location.href = '/'}
            className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </button>
          <h1 className="text-3xl font-bold text-white mb-2">Liquidity Locker</h1>
          <p className="text-gray-300">Lock your LP tokens to build trust with your community</p>
        </div>

        {/* New Lock Form */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Lock New Liquidity</h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                LP Token Address
              </label>
              <input
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0x..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Amount
              </label>
              <input
                type="number"
                step="0.000001"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.0"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Lock Duration (days)
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="30">30 days</option>
                <option value="60">60 days</option>
                <option value="90">90 days</option>
                <option value="180">180 days</option>
                <option value="365">1 year</option>
                <option value="730">2 years</option>
              </select>
            </div>
          </div>
          
          <button
            onClick={handleLockLiquidity}
            disabled={!isConnected || !token || !amount || !duration || isLocking}
            className="mt-6 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2 w-full md:w-auto disabled:opacity-50"
          >
            {isLocking ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Locking...</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span>Lock Liquidity</span>
              </>
            )}
          </button>
          
          {error && (
            <div className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5" />
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            </div>
          )}
          
          {success && (
            <div className="mt-4 p-3 bg-green-500/20 border border-green-500/50 rounded-lg">
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                <p className="text-green-400 text-sm">{success}</p>
              </div>
            </div>
          )}
        </div>

        {/* Your Locks */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
          <h2 className="text-xl font-semibold text-white mb-4">Your Locked Liquidity</h2>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
          ) : locks.length === 0 ? (
            <div className="text-center py-12">
              <Lock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Locked Liquidity</h3>
              <p className="text-gray-300">
                You haven't locked any liquidity yet. Lock your LP tokens to build trust with your community.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {locks.map((lock) => (
                <div 
                  key={lock.id} 
                  className={`p-6 rounded-xl border ${
                    lock.withdrawn 
                      ? 'bg-gray-500/20 border-gray-500/50' 
                      : isUnlockable(lock)
                      ? 'bg-green-500/20 border-green-500/50'
                      : 'bg-blue-500/20 border-blue-500/50'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-semibold text-white">{lock.tokenSymbol} LP Tokens</h3>
                        {lock.withdrawn ? (
                          <span className="px-2 py-1 bg-gray-500/20 text-gray-300 rounded-full text-xs">
                            Withdrawn
                          </span>
                        ) : isUnlockable(lock) ? (
                          <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs">
                            Unlocked
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs">
                            Locked
                          </span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="text-gray-300">Amount</div>
                          <div className="text-white font-medium">{parseFloat(lock.amount).toFixed(6)}</div>
                        </div>
                        <div>
                          <div className="text-gray-300">Lock Date</div>
                          <div className="text-white font-medium">{formatDate(lock.lockTime)}</div>
                        </div>
                        <div>
                          <div className="text-gray-300">Unlock Date</div>
                          <div className="text-white font-medium">{formatDate(lock.unlockTime)}</div>
                        </div>
                        <div>
                          <div className="text-gray-300">Time Remaining</div>
                          <div className="text-white font-medium">{getTimeRemaining(lock.unlockTime)}</div>
                        </div>
                      </div>
                      
                      <div className="mt-3 flex items-center space-x-2">
                        <span className="text-sm text-gray-300">Token:</span>
                        <code className="text-xs text-white font-mono bg-white/10 px-2 py-1 rounded">
                          {formatAddress(lock.token)}
                        </code>
                        <button
                          onClick={() => copyToClipboard(lock.token, `token-${lock.id}`)}
                          className="p-1 text-gray-400 hover:text-white transition-colors"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                        {copied === `token-${lock.id}` && (
                          <span className="text-green-400 text-xs">Copied!</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col space-y-2">
                      {!lock.withdrawn && isUnlockable(lock) && (
                        <button
                          onClick={() => handleWithdraw(lock.id)}
                          className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2"
                        >
                          <span>Withdraw</span>
                        </button>
                      )}
                      
                      {!lock.withdrawn && !isUnlockable(lock) && (
                        <button
                          onClick={() => handleExtendLock(lock.id, 30)}
                          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2"
                        >
                          <span>Extend +30 Days</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};