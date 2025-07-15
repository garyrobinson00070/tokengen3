import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Shield, 
  Coins, 
  Flame, 
  Settings, 
  Users, 
  Clock, 
  ExternalLink,
  Copy,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Percent,
  Wallet,
  Calendar,
  BarChart3
} from 'lucide-react';
import { useWallet } from '../hooks/useWallet';
import { useTokenManagement } from '../hooks/useTokenManagement';
import { WalletConnection } from './WalletConnection';
import { MintTokensPanel } from './tokenManagement/MintTokensPanel';
import { BurnTokensPanel } from './tokenManagement/BurnTokensPanel';
import { FeeManagementPanel } from './tokenManagement/FeeManagementPanel';
import { RedistributionPanel } from './tokenManagement/RedistributionPanel';
import { VestingManagementPanel } from './tokenManagement/VestingManagementPanel';
import { VerificationPanel } from './tokenManagement/VerificationPanel';
import { TokenMetadataPanel } from './tokenManagement/TokenMetadataPanel';

export const TokenManagement: React.FC = () => {
  const { tokenAddress } = useParams<{ tokenAddress: string }>();
  const navigate = useNavigate();
  const { isConnected, address } = useWallet();
  const [copied, setCopied] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('overview');

  const {
    tokenData,
    isLoading,
    isOwner,
    loadTokenData,
    mintTokens,
    burnTokens,
    updateFeeSettings,
    updateRedistributionPercentage,
    claimRewards,
    getUnclaimedRewards
  } = useTokenManagement(address || '');

  useEffect(() => {
    if (tokenAddress && isConnected) {
      loadTokenData(tokenAddress);
    }
  }, [tokenAddress, isConnected, loadTokenData]);

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const getAvailableFeatures = () => {
    if (!tokenData) return [];
    
    const features = [
      {
        id: 'metadata',
        name: 'Token Metadata',
        icon: Image,
        description: 'Manage token logo, description, and links',
        ownerOnly: false
      }
    ];
    
    if (tokenData.features.mintable) {
      features.push({
        id: 'mint',
        name: 'Mint Tokens',
        icon: Coins,
        description: 'Create new tokens',
        ownerOnly: true
      });
    }
    
    if (tokenData.features.burnable) {
      features.push({
        id: 'burn',
        name: 'Burn Tokens',
        icon: Flame,
        description: 'Destroy tokens from your wallet',
        ownerOnly: false
      });
    }
    
    if (tokenData.features.transferFees.enabled) {
      features.push({
        id: 'fees',
        name: 'Transfer Fees',
        icon: Percent,
        description: 'Manage transfer fees and recipients',
        ownerOnly: true
      });
    }
    
    if (tokenData.features.holderRedistribution.enabled) {
      features.push({
        id: 'redistribution',
        name: 'Holder Redistribution',
        icon: TrendingUp,
        description: 'Manage holder reward distribution',
        ownerOnly: true
      });
    }
    
    if (tokenData.features.vesting.enabled) {
      features.push({
        id: 'vesting',
        name: 'Token Vesting',
        icon: Clock,
        description: 'Manage vesting schedules',
        ownerOnly: true
      });
    }
    
    features.push({
      id: 'verification',
      name: 'Contract Verification',
      icon: Shield,
      description: 'View verification status',
      ownerOnly: false
    });
    
    return features;
  };

  const renderFeaturePanel = () => {
    if (!tokenData) return null;
    
    switch (activeTab) {
      case 'mint':
        return (
          <MintTokensPanel
            tokenData={tokenData}
            isOwner={isOwner}
            onMint={mintTokens}
          />
        );
      case 'burn':
        return (
          <BurnTokensPanel
            tokenData={tokenData}
            userAddress={address || ''}
            onBurn={burnTokens}
          />
        );
      case 'fees':
        return (
          <FeeManagementPanel
            tokenData={tokenData}
            isOwner={isOwner}
            onUpdateFees={updateFeeSettings}
          />
        );
      case 'redistribution':
        return (
          <RedistributionPanel
            tokenData={tokenData}
            isOwner={isOwner}
            userAddress={address || ''}
            onUpdatePercentage={updateRedistributionPercentage}
            onClaimRewards={claimRewards}
            getUnclaimedRewards={getUnclaimedRewards}
          />
        );
      case 'vesting':
        return (
          <VestingManagementPanel
            tokenData={tokenData}
            isOwner={isOwner}
          />
        );
      case 'verification':
        return (
          <VerificationPanel
            tokenData={tokenData}
          />
        );
      case 'metadata':
        return (
          <TokenMetadataPanel
            tokenData={tokenData}
            isOwner={isOwner}
          />
        );
      default:
        return null;
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-6">
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10 text-center max-w-md">
          <Wallet className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Connect Your Wallet</h2>
          <p className="text-gray-300 mb-6">
            Please connect your wallet to manage your token contract
          </p>
          <WalletConnection />
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">Loading token data...</p>
        </div>
      </div>
    );
  }

  if (!tokenData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-6">
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10 text-center max-w-md">
          <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Token Not Found</h2>
          <p className="text-gray-300 mb-6">
            The token contract could not be loaded or does not exist.
          </p>
          <button
            onClick={() => navigate('/tokens')}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200"
          >
            Back to Tokens
          </button>
        </div>
      </div>
    );
  }

  const availableFeatures = getAvailableFeatures();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigate('/tokens')}
              className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Tokens</span>
            </button>
            <WalletConnection />
          </div>
          
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Coins className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">{tokenData.name}</h1>
                  <p className="text-gray-300 text-lg">({tokenData.symbol})</p>
                  <div className="flex items-center space-x-4 mt-2">
                    <span className="text-sm text-gray-400">
                      Contract: {formatAddress(tokenData.address)}
                    </span>
                    <button
                      onClick={() => copyToClipboard(tokenData.address, 'address')}
                      className="p-1 text-gray-400 hover:text-white transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <a
                      href={`https://etherscan.io/token/${tokenData.address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 text-gray-400 hover:text-white transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                  {copied === 'address' && (
                    <div className="text-green-400 text-sm mt-1">Address copied!</div>
                  )}
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-2xl font-bold text-white">
                  {parseFloat(tokenData.totalSupply).toLocaleString()}
                </div>
                <div className="text-gray-300">Total Supply</div>
                {tokenData.maxSupply !== '0' && (
                  <div className="text-sm text-gray-400 mt-1">
                    Max: {parseFloat(tokenData.maxSupply).toLocaleString()}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Access Control Warning */}
        {!isOwner && (
          <div className="bg-amber-500/20 border border-amber-500/50 rounded-xl p-6 mb-8">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5" />
              <div>
                <h3 className="font-medium text-amber-400 mb-1">Read-Only Access</h3>
                <p className="text-amber-300 text-sm">
                  You do not have management access to this token. Only the contract owner can perform administrative actions.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Feature Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4">Token Features</h3>
              
              <div className="space-y-2">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    activeTab === 'overview'
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'text-gray-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <BarChart3 className="w-4 h-4" />
                    <span>Overview</span>
                  </div>
                </button>
                
                {availableFeatures.map((feature) => {
                  const Icon = feature.icon;
                  const canAccess = !feature.ownerOnly || isOwner;
                  
                  return (
                    <button
                      key={feature.id}
                      onClick={() => canAccess && setActiveTab(feature.id)}
                      disabled={!canAccess}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        activeTab === feature.id
                          ? 'bg-blue-500/20 text-blue-400'
                          : canAccess
                          ? 'text-gray-300 hover:bg-white/5 hover:text-white'
                          : 'text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon className="w-4 h-4" />
                        <span>{feature.name}</span>
                        {feature.ownerOnly && !isOwner && (
                          <Shield className="w-3 h-3 text-gray-500" />
                        )}
                      </div>
                      <div className="text-xs text-gray-400 mt-1 ml-7">
                        {feature.description}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Feature Content */}
          <div className="lg:col-span-3">
            {activeTab === 'overview' ? (
              <div className="space-y-6">
                {/* Token Stats */}
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                  <h3 className="text-xl font-semibold text-white mb-4">Token Statistics</h3>
                  
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white">
                        {parseFloat(tokenData.totalSupply).toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-300">Total Supply</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white">
                        {tokenData.maxSupply !== '0' ? parseFloat(tokenData.maxSupply).toLocaleString() : '∞'}
                      </div>
                      <div className="text-sm text-gray-300">Max Supply</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white">{tokenData.decimals}</div>
                      <div className="text-sm text-gray-300">Decimals</div>
                    </div>
                  </div>
                </div>

                {/* Enabled Features */}
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                  <h3 className="text-xl font-semibold text-white mb-4">Enabled Features</h3>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    {availableFeatures.map((feature) => {
                      const Icon = feature.icon;
                      return (
                        <div key={feature.id} className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg">
                          <Icon className="w-5 h-5 text-blue-400" />
                          <div>
                            <div className="text-white font-medium">{feature.name}</div>
                            <div className="text-sm text-gray-300">{feature.description}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Contract Info */}
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                  <h3 className="text-xl font-semibold text-white mb-4">Contract Information</h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-300">Owner:</span>
                      <span className="text-white font-mono">{formatAddress(tokenData.owner)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Network:</span>
                      <span className="text-white">{tokenData.network}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Verified:</span>
                      <div className="flex items-center space-x-2">
                        {tokenData.verified ? (
                          <>
                            <CheckCircle className="w-4 h-4 text-green-400" />
                            <span className="text-green-400">Yes</span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-4 h-4 text-red-400" />
                            <span className="text-red-400">No</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              renderFeaturePanel()
            )}
          </div>
        </div>
      </div>
    </div>
  );
};