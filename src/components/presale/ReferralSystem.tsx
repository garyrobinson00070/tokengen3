import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Copy, 
  Share2, 
  TrendingUp, 
  DollarSign, 
  CheckCircle, 
  AlertTriangle, 
  Loader2 
} from 'lucide-react';
import { ethers } from 'ethers';
import { useWallet } from '../../hooks/useWallet';
import { web3Service } from '../../services/web3Service';
import ReferralTrackerABI from '../../abis/ReferralTracker.json';

interface ReferralStats {
  totalReferrals: number;
  totalVolume: string;
  totalRewards: string;
  claimedRewards: string;
  unclaimedRewards: string;
}

interface ReferralSystemProps {
  presaleAddress: string;
  referralTrackerAddress: string;
  baseTokenSymbol: string;
}

export const ReferralSystem: React.FC<ReferralSystemProps> = ({ 
  presaleAddress, 
  referralTrackerAddress,
  baseTokenSymbol = 'USDT'
}) => {
  const { isConnected, address } = useWallet();
  const [referralLink, setReferralLink] = useState('');
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isClaiming, setIsClaiming] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (isConnected && address) {
      // Generate referral link
      const baseUrl = window.location.origin;
      setReferralLink(`${baseUrl}/sale/${presaleAddress}?ref=${address}`);
      
      // Load referral stats
      loadReferralStats();
    }
  }, [isConnected, address, presaleAddress, referralTrackerAddress]);

  const loadReferralStats = async () => {
    if (!isConnected || !address || !referralTrackerAddress) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const provider = web3Service.getProvider();
      if (!provider) throw new Error('Provider not available');
      
      const referralContract = new ethers.Contract(referralTrackerAddress, ReferralTrackerABI, provider);
      
      // Get referral stats
      const stats = await referralContract.getReferralStats(address);
      
      setStats({
        totalReferrals: Number(stats[0]),
        totalVolume: ethers.formatEther(stats[1]),
        totalRewards: ethers.formatEther(stats[2]),
        claimedRewards: ethers.formatEther(stats[3]),
        unclaimedRewards: ethers.formatEther(stats[4])
      });
    } catch (error) {
      console.error('Error loading referral stats:', error);
      setError('Failed to load referral statistics');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClaimRewards = async () => {
    if (!isConnected || !address || !referralTrackerAddress || !stats || parseFloat(stats.unclaimedRewards) <= 0) return;
    
    setIsClaiming(true);
    setError(null);
    setSuccess(null);
    
    try {
      const signer = web3Service.getSigner();
      if (!signer) throw new Error('Wallet connection issue');
      
      const referralContract = new ethers.Contract(referralTrackerAddress, ReferralTrackerABI, signer);
      
      // Claim rewards
      const tx = await referralContract.claimRewards();
      await tx.wait();
      
      setSuccess(`Successfully claimed ${stats.unclaimedRewards} ${baseTokenSymbol}!`);
      
      // Refresh stats
      await loadReferralStats();
    } catch (error) {
      console.error('Error claiming rewards:', error);
      setError((error as Error).message || 'Failed to claim rewards');
    } finally {
      setIsClaiming(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareReferralLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join this token sale with my referral link',
          text: 'Check out this token sale on TokenForge!',
          url: referralLink
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      copyToClipboard();
    }
  };

  if (!isConnected) {
    return (
      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 text-center">
        <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-white mb-2">Connect Wallet</h3>
        <p className="text-gray-300 text-sm">
          Connect your wallet to view and share your referral link
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
      <h3 className="text-xl font-semibold text-white mb-4">Invite & Earn</h3>
      
      <div className="space-y-6">
        {/* Referral Link */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Your Referral Link
          </label>
          <div className="flex space-x-2">
            <div className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white overflow-hidden overflow-ellipsis whitespace-nowrap">
              {referralLink}
            </div>
            <button
              onClick={copyToClipboard}
              className="px-4 py-3 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              onClick={shareReferralLink}
              className="px-4 py-3 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
          {copied && (
            <p className="text-green-400 text-sm mt-1">Referral link copied to clipboard!</p>
          )}
        </div>
        
        {/* Referral Stats */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : stats ? (
          <div>
            <h4 className="font-medium text-white mb-3">Your Referral Stats</h4>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-white/5 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-1">
                  <Users className="w-4 h-4 text-blue-400" />
                  <span className="text-sm text-gray-300">Total Referrals</span>
                </div>
                <div className="text-xl font-bold text-white">{stats.totalReferrals}</div>
              </div>
              
              <div className="bg-white/5 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-gray-300">Total Volume</span>
                </div>
                <div className="text-xl font-bold text-white">
                  {parseFloat(stats.totalVolume).toFixed(2)} {baseTokenSymbol}
                </div>
              </div>
            </div>
            
            <div className="bg-white/5 rounded-lg p-4 mb-4">
              <div className="flex items-center space-x-2 mb-1">
                <DollarSign className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-gray-300">Rewards</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div>
                  <div className="text-gray-300">Total</div>
                  <div className="text-white font-medium">
                    {parseFloat(stats.totalRewards).toFixed(2)} {baseTokenSymbol}
                  </div>
                </div>
                <div>
                  <div className="text-gray-300">Claimed</div>
                  <div className="text-white font-medium">
                    {parseFloat(stats.claimedRewards).toFixed(2)} {baseTokenSymbol}
                  </div>
                </div>
                <div>
                  <div className="text-gray-300">Unclaimed</div>
                  <div className="text-green-400 font-medium">
                    {parseFloat(stats.unclaimedRewards).toFixed(2)} {baseTokenSymbol}
                  </div>
                </div>
              </div>
            </div>
            
            {parseFloat(stats.unclaimedRewards) > 0 && (
              <button
                onClick={handleClaimRewards}
                disabled={isClaiming}
                className="w-full bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {isClaiming ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Claiming...</span>
                  </>
                ) : (
                  <>
                    <DollarSign className="w-4 h-4" />
                    <span>Claim {parseFloat(stats.unclaimedRewards).toFixed(2)} {baseTokenSymbol}</span>
                  </>
                )}
              </button>
            )}
          </div>
        ) : (
          <div className="text-center py-6">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h4 className="font-medium text-white mb-2">No Referrals Yet</h4>
            <p className="text-gray-300 text-sm">
              Share your referral link to start earning rewards
            </p>
          </div>
        )}
        
        {/* How It Works */}
        <div className="bg-blue-500/20 rounded-lg p-4">
          <h4 className="font-medium text-blue-400 mb-2">How It Works</h4>
          <ul className="text-blue-300 text-sm space-y-1">
            <li>• Share your unique referral link with friends</li>
            <li>• Earn 3% of their contribution when they participate</li>
            <li>• Rewards are paid in {baseTokenSymbol}</li>
            <li>• Claim your rewards anytime</li>
          </ul>
        </div>
        
        {error && (
          <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          </div>
        )}
        
        {success && (
          <div className="p-3 bg-green-500/20 border border-green-500/50 rounded-lg">
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
              <p className="text-green-400 text-sm">{success}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};