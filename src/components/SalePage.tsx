import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Users, 
  DollarSign,
  AlertOctagon,
  Target, 
  ExternalLink, 
  Wallet, 
  CheckCircle, 
  AlertCircle,
  TrendingUp,
  Shield,
  Copy,
  Calendar,
  Percent,
  Globe,
  Lock,
  Share2,
  ArrowLeft
} from 'lucide-react';
import { useWallet } from '../hooks/useWallet';
import { useSaleContract } from '../hooks/useSaleContract';
import { WalletConnection } from './WalletConnection';
import { ReferralSystem } from './presale/ReferralSystem';
import { tokenMetadataService } from '../services/tokenMetadataService';

interface SalePageProps {
  contractAddress: string;
}

export const SalePage: React.FC<SalePageProps> = ({ contractAddress }) => {
  const { isConnected, address } = useWallet();
  const { 
    saleData, 
    userInfo, 
    isLoading, 
    isWhitelisted,
    buyTokens, 
    claimTokens,
    loadSaleData,
    loadUserInfo
  } = useSaleContract(contractAddress);

  const [purchaseAmount, setPurchaseAmount] = useState('');
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [isEmergencyWithdrawing, setIsEmergencyWithdrawing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'buyers' | 'referral'>('overview');
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [tokenMetadata, setTokenMetadata] = useState<any>(null);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);

  useEffect(() => {
    loadSaleData();
    
    // Load token metadata when sale data is available
    if (saleData?.tokenAddress) {
      loadTokenMetadata(saleData.tokenAddress);
    }
  }, [contractAddress, loadSaleData]);

  const loadTokenMetadata = async (tokenAddress: string) => {
    setIsLoadingMetadata(true);
    try {
      const metadata = await tokenMetadataService.getTokenMetadata(tokenAddress);
      setTokenMetadata(metadata);
    } catch (error) {
      console.error('Error loading token metadata:', error);
    } finally {
      setIsLoadingMetadata(false);
    }
  };

  useEffect(() => {
    if (isConnected && address) {
      loadUserInfo(address);
    }
  }, [isConnected, address, loadUserInfo]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const formatTimeRemaining = (timestamp: number) => {
    const now = Date.now() / 1000;
    const diff = timestamp - now;
    
    if (diff <= 0) return 'Ended';
    
    const days = Math.floor(diff / 86400);
    const hours = Math.floor((diff % 86400) / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getSaleStatus = () => {
    if (!saleData) return 'loading';
    
    const now = Date.now() / 1000;
    if (now < saleData.startTime) return 'upcoming';
    if (now > saleData.endTime || saleData.isFinalized) return 'ended';
    return 'live';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live': return 'text-green-400 bg-green-500/20';
      case 'upcoming': return 'text-blue-400 bg-blue-500/20';
      case 'ended': return 'text-gray-400 bg-gray-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getProgressPercentage = () => {
    if (!saleData) return 0;
    return Math.min((parseFloat(saleData.totalRaised) / parseFloat(saleData.hardCap)) * 100, 100);
  };

  const calculateTokenAmount = (amount: string) => {
    if (!amount || !saleData) return '0';
    return (parseFloat(amount) * parseFloat(saleData.tokenPrice)).toLocaleString();
  };

  const handlePurchase = async () => {
    if (!purchaseAmount || !saleData) return;
    
    setIsPurchasing(true);
    try {
      await buyTokens(purchaseAmount);
      setPurchaseAmount('');
      await loadSaleData();
      await loadUserInfo(address!);
    } catch (error) {
      console.error('Purchase failed:', error);
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleClaim = async () => {
    setIsClaiming(true);
    try {
      await claimTokens();
      await loadUserInfo(address!);
    } catch (error) {
      console.error('Claim failed:', error);
    } finally {
      setIsClaiming(false);
    }
  };

  const handleEmergencyWithdraw = async () => {
    if (!isConnected) return;
    
    setIsEmergencyWithdrawing(true);
    
    try {
      await saleContract.emergencyWithdraw();
      await loadSaleData();
      await loadUserInfo(address!);
      setShowEmergencyModal(false);
    } catch (error) {
      console.error('Emergency withdraw failed:', error);
    } finally {
      setIsEmergencyWithdrawing(false);
    }
  };

  const canPurchase = () => {
    if (!isConnected || !saleData) return false;
    if (getSaleStatus() !== 'live') return false;
    if (saleData.saleType === 'private' && !isWhitelisted) return false;
    return true;
  };

  const getVestingInfo = () => {
    if (!saleData?.vestingEnabled || !userInfo) return null;
    
    const totalTokens = parseFloat(userInfo.tokenAmount);
    const claimedTokens = parseFloat(userInfo.claimedTokens);
    const claimableTokens = parseFloat(userInfo.claimableTokens);
    
    return {
      totalTokens,
      claimedTokens,
      claimableTokens,
      vestingProgress: totalTokens > 0 ? (claimedTokens / totalTokens) * 100 : 0
    };
  };

  // Calculate emergency withdraw penalty and refund
  const calculateEmergencyWithdraw = () => {
    if (!userInfo) return { contribution: '0', penalty: '0', refund: '0' };
    
    const contribution = parseFloat(userInfo.contribution);
    const penaltyRate = 0.1; // 10% penalty
    const penalty = contribution * penaltyRate;
    const refund = contribution - penalty;
    
    return {
      contribution: contribution.toFixed(6),
      penalty: penalty.toFixed(6),
      refund: refund.toFixed(6)
    };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">Loading sale details...</p>
        </div>
      </div>
    );
  }

  if (!saleData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Sale Not Found</h1>
          <p className="text-gray-300">The sale contract could not be loaded.</p>
        </div>
      </div>
    );
  }

  const status = getSaleStatus();
  const vestingInfo = getVestingInfo();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Home</span>
              </button>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                {tokenMetadata?.logoUrl ? (
                  <img 
                    src={tokenMetadata.logoUrl} 
                    alt={`${saleData.tokenName} logo`} 
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                ) : (
                  saleData.saleType === 'private' ? (
                    <Lock className="w-6 h-6 text-white" />
                  ) : (
                    <Globe className="w-6 h-6 text-white" />
                  )
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  {tokenMetadata?.name || saleData.saleName}
                </h1>
                <p className="text-gray-300">{saleData.tokenName} ({saleData.tokenSymbol})</p>
                
                {/* Token Tags */}
                {tokenMetadata?.tags && tokenMetadata.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {tokenMetadata.tags.slice(0, 3).map((tag: string) => (
                      <span 
                        key={tag} 
                        className="px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded-full text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <WalletConnection />
          </div>
                {saleData.saleType === 'private' ? (
                  <Lock className="w-6 h-6 text-white" />
                ) : (
                  <Globe className="w-6 h-6 text-white" />
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  {tokenMetadata?.name || saleData.saleName}
                </h1>
                <p className="text-gray-300">{saleData.tokenName} ({saleData.tokenSymbol})</p>
                
                {/* Token Tags */}
                {tokenMetadata?.tags && tokenMetadata.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {tokenMetadata.tags.slice(0, 3).map((tag: string) => (
                      <span 
                        key={tag} 
                        className="px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded-full text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <WalletConnection />
          </div>
          
          {/* Tab Navigation */}
          <div className="mt-6">
            <div className="flex space-x-1">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'overview' ? 'bg-blue-500 text-white' : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('buyers')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'buyers' ? 'bg-blue-500 text-white' : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                Participants
              </button>
              <button
                onClick={() => setActiveTab('referral')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'referral' ? 'bg-blue-500 text-white' : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <Share2 className="w-4 h-4 inline mr-1" />
                Invite & Earn
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Sale Status Banner */}
                <div className={`rounded-xl p-6 border ${
                  status === 'live' 
                    ? 'bg-green-500/20 border-green-500/50' 
                    : status === 'upcoming'
                    ? 'bg-blue-500/20 border-blue-500/50'
                    : 'bg-gray-500/20 border-gray-500/50'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(status)}`}>
                        {status === 'live' ? 'Live Now' : status === 'upcoming' ? 'Upcoming' : 'Ended'}
                      </div>
                      <span className="text-white font-medium">
                        {saleData.saleType === 'private' ? 'Private Sale' : 'Public Presale'}
                      </span>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-2xl font-bold text-white">
                        {status === 'upcoming' 
                          ? formatTimeRemaining(saleData.startTime)
                          : status === 'live'
                          ? formatTimeRemaining(saleData.endTime)
                          : 'Sale Ended'
                        }
                      </div>
                      <div className="text-sm text-gray-300">
                        {status === 'upcoming' ? 'Until Start' : status === 'live' ? 'Remaining' : ''}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Access Control Warning */}
                {saleData.saleType === 'private' && isConnected && !isWhitelisted && (
                  <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-6">
                    <div className="flex items-start space-x-3">
                      <Shield className="w-5 h-5 text-red-400 mt-0.5" />
                      <div>
                        <h3 className="font-medium text-red-400 mb-1">Access Restricted</h3>
                        <p className="text-red-300 text-sm">
                          You are not whitelisted for this private sale. Only approved wallets can participate.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Sale Progress */}
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                  <h2 className="text-xl font-semibold text-white mb-4">Sale Progress</h2>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-300">Progress</span>
                      <span className="text-white">{getProgressPercentage().toFixed(1)}%</span>
                    </div>
                    
                    <div className="w-full bg-gray-700 rounded-full h-3">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-300"
                        style={{ width: `${getProgressPercentage()}%` }}
                      ></div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white">
                          {parseFloat(saleData.totalRaised).toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-300">Raised ({saleData.networkSymbol})</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white">
                          {parseFloat(saleData.hardCap).toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-300">Hard Cap ({saleData.networkSymbol})</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sale Details */}
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                  <h2 className="text-xl font-semibold text-white mb-4">Sale Details</h2>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-gray-300">Token Price</span>
                        <span className="text-white font-medium">
                          {saleData.tokenPrice} {saleData.tokenSymbol} per {saleData.networkSymbol}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Soft Cap</span>
                        <span className="text-white font-medium">
                          {saleData.softCap} {saleData.networkSymbol}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Hard Cap</span>
                        <span className="text-white font-medium">
                          {saleData.hardCap} {saleData.networkSymbol}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Participants</span>
                        <span className="text-white font-medium">{saleData.totalParticipants}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-gray-300">Min Purchase</span>
                        <span className="text-white font-medium">
                          {saleData.minPurchase} {saleData.networkSymbol}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Max Purchase</span>
                        <span className="text-white font-medium">
                          {saleData.maxPurchase} {saleData.networkSymbol}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Start Date</span>
                        <span className="text-white font-medium">
                          {new Date(saleData.startTime * 1000).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">End Date</span>
                        <span className="text-white font-medium">
                          {new Date(saleData.endTime * 1000).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Token Contract Info */}
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                  <h2 className="text-xl font-semibold text-white mb-4">Token Information</h2>
                  
                  {/* Token Description */}
                  {tokenMetadata?.description && (
                    <div className="mb-4">
                      <p className="text-gray-300 text-sm">
                        {tokenMetadata.description}
                      </p>
                    </div>
                  )}
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Token Contract</span>
                      <div className="flex items-center space-x-2">
                        <code className="text-white font-mono text-sm">
                          {formatAddress(saleData.tokenAddress)}
                        </code>
                        <button
                          onClick={() => copyToClipboard(saleData.tokenAddress)}
                          className="p-1 text-gray-400 hover:text-white transition-colors"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <a
                          href={`${saleData.explorerUrl}/token/${saleData.tokenAddress}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 text-gray-400 hover:text-white transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Sale Contract</span>
                      <div className="flex items-center space-x-2">
                        <code className="text-white font-mono text-sm">
                          {formatAddress(contractAddress)}
                        </code>
                        <button
                          onClick={() => copyToClipboard(contractAddress)}
                          className="p-1 text-gray-400 hover:text-white transition-colors"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <a
                          href={`${saleData.explorerUrl}/address/${contractAddress}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 text-gray-400 hover:text-white transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                    
                    {/* Social Links */}
                    {tokenMetadata && (
                      <div className="flex flex-wrap gap-4 mt-4">
                        {tokenMetadata.websiteUrl && (
                          <a 
                            href={tokenMetadata.websiteUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center space-x-2 text-blue-400 hover:text-blue-300"
                          >
                            <Link className="w-4 h-4" />
                            <span>Website</span>
                          </a>
                        )}
                        
                        {tokenMetadata.twitterUrl && (
                          <a 
                            href={tokenMetadata.twitterUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center space-x-2 text-blue-400 hover:text-blue-300"
                          >
                            <Twitter className="w-4 h-4" />
                            <span>Twitter</span>
                          </a>
                        )}
                        
                        {tokenMetadata.telegramUrl && (
                          <a 
                            href={tokenMetadata.telegramUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center space-x-2 text-blue-400 hover:text-blue-300"
                          >
                            <MessageCircle className="w-4 h-4" />
                            <span>Telegram</span>
                          </a>
                        )}
                        
                        {tokenMetadata.discordUrl && (
                          <a 
                            href={tokenMetadata.discordUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center space-x-2 text-blue-400 hover:text-blue-300"
                          >
                            <MessageCircle className="w-4 h-4" />
                            <span>Discord</span>
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {copied && (
                    <div className="mt-2 text-green-400 text-sm">Address copied to clipboard!</div>
                  )}
                </div>

                {/* Vesting Information */}
                {saleData.vestingEnabled && (
                  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                    <h2 className="text-xl font-semibold text-white mb-4">Vesting Schedule</h2>
                    
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-blue-400" />
                        <span className="text-white">Linear vesting enabled</span>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-gray-300">Initial Release</div>
                          <div className="text-white font-medium">{saleData.initialRelease}% at TGE</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-300">Vesting Duration</div>
                          <div className="text-white font-medium">{saleData.vestingDuration} days</div>
                        </div>
                      </div>
                      
                      <div className="p-3 bg-blue-500/20 rounded-lg">
                        <p className="text-blue-300 text-sm">
                          Tokens will be released gradually over the vesting period after the sale ends.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Emergency Withdraw Button (only during active sale) */}
                {status === 'live' && userInfo && parseFloat(userInfo.contribution) > 0 && (
                  <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-6">
                    <div className="flex items-start space-x-3">
                      <AlertOctagon className="w-5 h-5 text-red-400 mt-0.5" />
                      <div>
                        <h3 className="font-medium text-red-400 mb-1">Emergency Withdraw</h3>
                        <p className="text-red-300 text-sm mb-3">
                          You can withdraw your contribution before the sale ends, but a 10% penalty will be applied.
                        </p>
                        <button
                          onClick={() => setShowEmergencyModal(true)}
                          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                          Emergency Withdraw
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'buyers' && (
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                <h2 className="text-xl font-semibold text-white mb-4">Recent Participants</h2>
                <div className="space-y-3">
                  {/* This would be populated with actual buyer data */}
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-300">Participant data will be displayed here</p>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'referral' && (
              <ReferralSystem 
                presaleAddress={contractAddress}
                referralTrackerAddress="0x742d35Cc6634C0532925a3b8D4C9db96590c6C8C" // Replace with actual address
                baseTokenSymbol={saleData.networkSymbol}
              />
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Purchase Card */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 sticky top-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                {status === 'ended' ? 'Claim Tokens' : 'Purchase Tokens'}
              </h3>
              
              {!isConnected ? (
                <div className="text-center">
                  <Wallet className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-300 text-sm mb-4">Connect your wallet to participate</p>
                  <WalletConnection />
                </div>
              ) : status === 'ended' && userInfo ? (
                <div className="space-y-4">
                  {/* User Purchase Summary */}
                  <div className="bg-white/5 rounded-lg p-4">
                    <h4 className="font-medium text-white mb-3">Your Purchase</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-300">Contributed</span>
                        <span className="text-white">{userInfo.contribution} {saleData.networkSymbol}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Token Amount</span>
                        <span className="text-white">{parseFloat(userInfo.tokenAmount).toLocaleString()} {saleData.tokenSymbol}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Claimed</span>
                        <span className="text-white">{parseFloat(userInfo.claimedTokens).toLocaleString()} {saleData.tokenSymbol}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Claimable</span>
                        <span className="text-green-400 font-medium">{parseFloat(userInfo.claimableTokens).toLocaleString()} {saleData.tokenSymbol}</span>
                      </div>
                    </div>
                  </div>

                  {/* Vesting Progress */}
                  {vestingInfo && (
                    <div className="bg-white/5 rounded-lg p-4">
                      <h4 className="font-medium text-white mb-3">Vesting Progress</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-300">Progress</span>
                          <span className="text-white">{vestingInfo.vestingProgress.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-green-500 to-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${vestingInfo.vestingProgress}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Claim Button */}
                  {parseFloat(userInfo.claimableTokens) > 0 && (
                    <button
                      onClick={handleClaim}
                      disabled={isClaiming}
                      className="w-full bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white py-3 rounded-lg font-medium transition-all duration-200 disabled:opacity-50"
                    >
                      {isClaiming ? 'Claiming...' : 'Claim Tokens'}
                    </button>
                  )}
                </div>
              ) : canPurchase() ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Amount ({saleData.networkSymbol})
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      min={saleData.minPurchase}
                      max={saleData.maxPurchase}
                      value={purchaseAmount}
                      onChange={(e) => setPurchaseAmount(e.target.value)}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={`Min: ${saleData.minPurchase}`}
                    />
                  </div>
                  
                  {purchaseAmount && (
                    <div className="bg-blue-500/20 rounded-lg p-3">
                      <div className="text-sm text-blue-300">You will receive</div>
                      <div className="text-lg font-bold text-white">
                        {calculateTokenAmount(purchaseAmount)} {saleData.tokenSymbol}
                      </div>
                    </div>
                  )}
                  
                  <button
                    onClick={handlePurchase}
                    disabled={!purchaseAmount || isPurchasing || parseFloat(purchaseAmount) < parseFloat(saleData.minPurchase)}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white py-3 rounded-lg font-medium transition-all duration-200 disabled:opacity-50"
                  >
                    {isPurchasing ? 'Processing...' : 'Buy Tokens'}
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-300 text-sm">
                    {status === 'upcoming' ? 'Sale has not started yet' : 
                     status === 'ended' ? 'Sale has ended' :
                     'You cannot participate in this sale'}
                  </p>
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4">Quick Stats</h3>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Target className="w-5 h-5 text-blue-400" />
                  <div>
                    <div className="text-white font-medium">
                      {((parseFloat(saleData.totalRaised) / parseFloat(saleData.softCap)) * 100).toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-300">of Soft Cap</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Users className="w-5 h-5 text-green-400" />
                  <div>
                    <div className="text-white font-medium">{saleData.totalParticipants}</div>
                    <div className="text-sm text-gray-300">Participants</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <DollarSign className="w-5 h-5 text-purple-400" />
                  <div>
                    <div className="text-white font-medium">
                      {parseFloat(saleData.totalRaised).toFixed(2)} {saleData.networkSymbol}
                    </div>
                    <div className="text-sm text-gray-300">Total Raised</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Emergency Withdraw Modal */}
      {showEmergencyModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-xl p-6 border border-white/10 max-w-md w-full">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                <AlertOctagon className="w-5 h-5 text-red-400" />
              </div>
              <h3 className="text-xl font-semibold text-white">Emergency Withdraw</h3>
            </div>
            
            <p className="text-gray-300 mb-6">
              Are you sure you want to emergency withdraw your contribution? A 10% penalty will be applied.
            </p>
            
            {userInfo && (
              <div className="bg-white/5 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <div className="text-sm text-gray-300">Your Contribution</div>
                    <div className="text-white font-medium">
                      {calculateEmergencyWithdraw().contribution} {saleData.networkSymbol}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-300">Penalty (10%)</div>
                    <div className="text-red-400 font-medium">
                      {calculateEmergencyWithdraw().penalty} {saleData.networkSymbol}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-300">You Receive</div>
                    <div className="text-green-400 font-medium">
                      {calculateEmergencyWithdraw().refund} {saleData.networkSymbol}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowEmergencyModal(false)}
                className="flex-1 px-4 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleEmergencyWithdraw}
                disabled={isEmergencyWithdrawing}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {isEmergencyWithdrawing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>Confirm Withdraw</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};