import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '../hooks/useWallet';
import { useSaleContract } from '../hooks/useSaleContract';
import { 
  Lock, 
  Globe, 
  ArrowLeft, 
  Clock, 
  Users, 
  Target, 
  TrendingUp, 
  Shield, 
  AlertTriangle, 
  Zap 
} from 'lucide-react';
import { BadgeDisplay } from './badges/BadgeDisplay';
import { BadgeInfo } from '../types/presale';

interface SalePageProps {
  contractAddress: string;
}

export const SalePage: React.FC<SalePageProps> = ({ contractAddress }) => {
  const { account, provider } = useWallet();
  const { saleData, userInfo, loading, error, contribute, withdraw, claimTokens } = useSaleContract(contractAddress);
  const [activeTab, setActiveTab] = useState('overview');
  const [contributionAmount, setContributionAmount] = useState('');
  const [badges, setBadges] = useState<BadgeInfo[]>([]);
  const [tokenMetadata, setTokenMetadata] = useState<any>(null);
  const [isProtectionActive, setIsProtectionActive] = useState(false);
  const [protectionTimeRemaining, setProtectionTimeRemaining] = useState(0);
  const [isInCooldown, setIsInCooldown] = useState(false);
  const [cooldownTimeRemaining, setCooldownTimeRemaining] = useState(0);

  useEffect(() => {
    if (contractAddress) {
      loadBadges();
    }
  }, [contractAddress]);

  const loadBadges = async () => {
    try {
      const response = await fetch(`/api/badges/token/${contractAddress}`);
      if (response.ok) {
        const data = await response.json();
        setBadges(data);
      }
    } catch (error) {
      console.error('Error loading badges:', error);
    }
  };

  // Calculate sale status
  const getStatus = () => {
    if (!saleData) return 'loading';
    const now = Date.now() / 1000;
    if (now < saleData.startTime) return 'upcoming';
    if (now > saleData.endTime) return 'ended';
    if (parseFloat(saleData.totalRaised) >= parseFloat(saleData.hardCap)) return 'success';
    return 'live';
  };

  const status = getStatus();

  // Calculate progress percentage
  const progressPercentage = saleData 
    ? Math.min((parseFloat(saleData.totalRaised) / parseFloat(saleData.hardCap)) * 100, 100)
    : 0;

  // Format time remaining
  const getTimeRemaining = () => {
    if (!saleData) return '';
    const now = Date.now() / 1000;
    const targetTime = status === 'upcoming' ? saleData.startTime : saleData.endTime;
    const diff = targetTime - now;
    
    if (diff <= 0) return '00:00:00';
    
    const days = Math.floor(diff / 86400);
    const hours = Math.floor((diff % 86400) / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    const seconds = Math.floor(diff % 60);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const [timeRemaining, setTimeRemaining] = useState(getTimeRemaining());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining(getTimeRemaining());
    }, 1000);
    return () => clearInterval(timer);
  }, [saleData, status]);

  const handleContribute = async () => {
    if (!contributionAmount || parseFloat(contributionAmount) <= 0) return;
    await contribute(contributionAmount);
    setContributionAmount('');
  };

  const handleWithdraw = async () => {
    await withdraw();
  };

  const handleClaim = async () => {
    await claimTokens();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading sale details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-400 mb-2">Error Loading Sale</h1>
          <p className="text-gray-300">{error}</p>
        </div>
      </div>
    );
  }

  if (!saleData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Sale Not Found</h1>
          <p className="text-gray-300">The requested sale could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => window.history.back()}
              className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Home</span>
            </button>
          </div>

          {/* Token Info Header */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="flex items-center space-x-4">
              {tokenMetadata?.logoUrl ? (
                <img
                  src={tokenMetadata.logoUrl}
                  alt={`${saleData.tokenName} logo`}
                  className="w-16 h-16 rounded-full"
                />
              ) : (
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  {saleData.saleType === 'private' ? (
                    <Lock className="w-8 h-8 text-white" />
                  ) : (
                    <Globe className="w-8 h-8 text-white" />
                  )}
                </div>
              )}
              <div>
                <h1 className="text-3xl font-bold text-white">{saleData.tokenName}</h1>
                <p className="text-gray-300">{saleData.tokenSymbol}</p>
                <div className="flex items-center space-x-4 mt-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    status === 'live' ? 'bg-green-500/20 text-green-400' :
                    status === 'upcoming' ? 'bg-yellow-500/20 text-yellow-400' :
                    status === 'ended' ? 'bg-red-500/20 text-red-400' :
                    'bg-blue-500/20 text-blue-400'
                  }`}>
                    {status === 'live' ? 'Live' :
                     status === 'upcoming' ? 'Upcoming' :
                     status === 'ended' ? 'Ended' :
                     'Success'}
                  </span>
                  <span className="text-gray-400 capitalize">{saleData.saleType} Sale</span>
                </div>
              </div>
            </div>
            
            {/* Badges */}
            {badges.length > 0 && (
              <div className="mt-4">
                <BadgeDisplay badges={badges} size="md" />
              </div>
            )}
            
            {/* Anti-Bot Protection */}
            {isProtectionActive && (
              <div className="mt-4 p-3 bg-amber-500/20 border border-amber-500/50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Shield className="w-4 h-4 text-amber-400" />
                  <div>
                    <span className="text-amber-400 font-medium">Anti-Bot Protection Active</span>
                    <span className="text-amber-300 text-sm ml-2">
                      {Math.floor(protectionTimeRemaining / 60)}m {protectionTimeRemaining % 60}s remaining
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Wallet Cooldown */}
            {isInCooldown && (
              <div className="mt-4 p-3 bg-blue-500/20 border border-blue-500/50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <div>
                    <span className="text-blue-400 font-medium">Wallet Cooldown</span>
                    <span className="text-blue-300 text-sm ml-2">
                      {Math.floor(cooldownTimeRemaining / 60)}m {cooldownTimeRemaining % 60}s until next purchase
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Fairlaunch Notice */}
            {saleData.saleType === 'fairlaunch' && (
              <div className="mt-4 p-3 bg-green-500/20 border border-green-500/50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Zap className="w-4 h-4 text-green-400" />
                  <div>
                    <span className="text-green-400 font-medium">Fairlaunch Sale</span>
                    <span className="text-green-300 text-sm ml-2">
                      No hard cap, tokens distributed proportionally
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Whitelist Only */}
            {saleData.saleType === 'private' && (
              <div className="mt-4 p-3 bg-purple-500/20 border border-purple-500/50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Lock className="w-4 h-4 text-purple-400" />
                  <div>
                    <span className="text-purple-400 font-medium">Whitelist Only</span>
                    <span className="text-purple-300 text-sm ml-2">
                      Only approved wallets can participate
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Sale Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Progress Bar */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-white">Sale Progress</h3>
                <span className="text-purple-400 font-medium">{progressPercentage.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3 mb-4">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-sm text-gray-300">
                <span>{ethers.formatEther(saleData.totalRaised)} ETH raised</span>
                <span>{ethers.formatEther(saleData.hardCap)} ETH goal</span>
              </div>
            </div>

            {/* Time Remaining */}
            {(status === 'live' || status === 'upcoming') && (
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <div className="flex items-center space-x-3">
                  <Clock className="w-6 h-6 text-purple-400" />
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {status === 'upcoming' ? 'Starts In' : 'Ends In'}
                    </h3>
                    <p className="text-2xl font-mono text-purple-400">{timeRemaining}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Sale Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="flex items-center space-x-3">
                  <Users className="w-5 h-5 text-blue-400" />
                  <div>
                    <p className="text-sm text-gray-400">Participants</p>
                    <p className="text-lg font-semibold text-white">{saleData.participantCount || '0'}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="flex items-center space-x-3">
                  <Target className="w-5 h-5 text-green-400" />
                  <div>
                    <p className="text-sm text-gray-400">Min Contribution</p>
                    <p className="text-lg font-semibold text-white">{ethers.formatEther(saleData.minContribution)} ETH</p>
                  </div>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="flex items-center space-x-3">
                  <TrendingUp className="w-5 h-5 text-purple-400" />
                  <div>
                    <p className="text-sm text-gray-400">Max Contribution</p>
                    <p className="text-lg font-semibold text-white">{ethers.formatEther(saleData.maxContribution)} ETH</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            {saleData.description && (
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <h3 className="text-xl font-semibold text-white mb-4">About This Sale</h3>
                <p className="text-gray-300 leading-relaxed">{saleData.description}</p>
              </div>
            )}
          </div>

          {/* Right Column - Contribution Panel */}
          <div className="space-y-6">
            {/* User Contribution Panel */}
            {account && (
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <h3 className="text-xl font-semibold text-white mb-4">Your Contribution</h3>
                
                {userInfo && (
                  <div className="mb-4 p-4 bg-white/5 rounded-lg">
                    <p className="text-sm text-gray-400 mb-1">Contributed</p>
                    <p className="text-lg font-semibold text-white">{ethers.formatEther(userInfo.contribution)} ETH</p>
                    <p className="text-sm text-gray-400 mt-1">Tokens to receive: {ethers.formatUnits(userInfo.tokenAmount, 18)}</p>
                  </div>
                )}

                {status === 'live' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Contribution Amount ({saleData.networkSymbol})
                      </label>
                      <input
                        type="number"
                        value={contributionAmount}
                        onChange={(e) => setContributionAmount(e.target.value)}
                        placeholder="0.0"
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <button
                      onClick={handleContribute}
                      disabled={!contributionAmount || parseFloat(contributionAmount) <= 0 || isProtectionActive || isInCooldown}
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      Contribute
                    </button>
                    
                    {isProtectionActive && (
                      <div className="p-3 bg-amber-500/20 border border-amber-500/50 rounded-lg mt-2">
                        <div className="flex items-start space-x-2">
                          <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5" />
                          <p className="text-amber-300 text-sm">
                            Anti-bot protection is active. Only whitelisted addresses can participate during this period.
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {isInCooldown && (
                      <div className="p-3 bg-blue-500/20 border border-blue-500/50 rounded-lg mt-2">
                        <div className="flex items-start space-x-2">
                          <Clock className="w-4 h-4 text-blue-400 mt-0.5" />
                          <p className="text-blue-300 text-sm">
                            Wallet cooldown active. Please wait {Math.floor(cooldownTimeRemaining / 60)}m {cooldownTimeRemaining % 60}s before your next purchase.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {status === 'ended' && userInfo && parseFloat(userInfo.contribution) > 0 && (
                  <div className="space-y-3">
                    <button
                      onClick={handleClaim}
                      className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition-all"
                    >
                      Claim Tokens
                    </button>
                    <button
                      onClick={handleWithdraw}
                      className="w-full bg-gradient-to-r from-red-600 to-rose-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-red-700 hover:to-rose-700 transition-all"
                    >
                      Emergency Withdraw
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Sale Information */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <h3 className="text-xl font-semibold text-white mb-4">Sale Information</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Token Price</span>
                  <span className="text-white">{ethers.formatEther(saleData.tokenPrice)} ETH</span>
                </div>
                {saleData.saleType === 'fairlaunch' ? (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Distribution</span>
                    <span className="text-white">Proportional to contribution</span>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Soft Cap</span>
                      <span className="text-white">{ethers.formatEther(saleData.softCap)} {saleData.networkSymbol}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Hard Cap</span>
                      <span className="text-white">{ethers.formatEther(saleData.hardCap)} {saleData.networkSymbol}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-400">Sale Type</span>
                  <span className="text-white capitalize">{saleData.saleType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Start Time</span>
                  <span className="text-white">{new Date(saleData.startTime * 1000).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">End Time</span>
                  <span className="text-white">{new Date(saleData.endTime * 1000).toLocaleDateString()}</span>
                </div>
                {saleData.antiBotEnabled && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Anti-Bot Protection</span>
                    <span className="text-green-400">Enabled</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};