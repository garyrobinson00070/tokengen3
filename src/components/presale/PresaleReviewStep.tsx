import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle, AlertTriangle, Clock, DollarSign, Users, Shield, Zap } from 'lucide-react';
import { PresaleConfig, PresaleDeploymentResult } from '../../types/presale';
import { ESRBalanceCheck } from '../ESRBalanceCheck';
import { NetworkMismatchModal } from '../NetworkMismatchModal';
import { NetworkSelector } from '../NetworkSelector';
import { contractService } from '../../services/contractService';
import { useNetworkMode } from '../../hooks/useNetworkMode';
import { useWallet } from '../../hooks/useWallet';
import { web3Service } from '../../services/web3Service';

interface PresaleReviewStepProps {
  config: PresaleConfig;
  onBack: () => void;
  onDeploy: (result: PresaleDeploymentResult) => void;
}

export const PresaleReviewStep: React.FC<PresaleReviewStepProps> = ({ config, onBack, onDeploy }) => {
  const { isTestnetMode } = useNetworkMode();
  const { chainId, switchToNetwork, isAttemptingSwitch, switchError } = useWallet();
  const [isDeploying, setIsDeploying] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [hasEnoughESR, setHasEnoughESR] = useState(false);
  const [isEstimating, setIsEstimating] = useState(true);
  const [deploymentError, setDeploymentError] = useState<string | null>(null);
  const [gasEstimate, setGasEstimate] = useState({
    amount: '0.045',
    usd: '$95',
    timeEstimate: '1-3 minutes'
  });
  const [showNetworkModal, setShowNetworkModal] = useState(false);
  const [showAutoListingPreview, setShowAutoListingPreview] = useState(false);

  // Fetch real gas estimate on component mount
  useEffect(() => {
    const fetchGasEstimate = async () => {
      try {
        setIsEstimating(true);
        
        // Connect to the network
        const provider = new ethers.JsonRpcProvider(config.network.rpcUrl);
        
        // Create a dummy transaction to estimate gas
        const gasPrice = await provider.getFeeData();
        const effectiveGasPrice = gasPrice.maxFeePerGas || gasPrice.gasPrice || ethers.parseUnits('50', 'gwei');
        
        // Presale contracts typically use around 4-5 million gas
        const estimatedGas = BigInt(4500000);
        const gasCost = estimatedGas * effectiveGasPrice;
        const gasCostEther = ethers.formatEther(gasCost);
        
        // Get token price in USD (simplified)
        const tokenPrices = {
          'ETH': 2500,
          'BNB': 300,
          'MATIC': 0.80,
          'FTM': 0.40,
          'AVAX': 30,
          'ESR': 0.25
        };
        
        const tokenPrice = tokenPrices[config.network.symbol] || 0;
        const gasCostUsd = (parseFloat(gasCostEther) * tokenPrice).toFixed(2);
        
        // Estimate deployment time
        const deploymentTimes = {
          'ethereum': '2-5 minutes',
          'bsc': '30-60 seconds',
          'polygon': '30-60 seconds',
          'arbitrum': '30-60 seconds',
          'fantom': '15-30 seconds',
          'avalanche': '30-60 seconds',
          'goerli': '30-60 seconds',
          'bsc-testnet': '15-30 seconds',
          'mumbai': '15-30 seconds',
          'arbitrum-sepolia': '15-30 seconds',
          'estar-testnet': '5-15 seconds'
        };
        
        const timeEstimate = deploymentTimes[config.network.id] || '1-3 minutes';
        
        setGasEstimate({
          amount: gasCostEther,
          usd: `$${gasCostUsd}`,
          timeEstimate
        });
      } catch (error) {
        console.error('Error estimating gas:', error);
        // Keep default values
      } finally {
        setIsEstimating(false);
      }
    };
    
    fetchGasEstimate();
  }, [config.network]);

  // Check if we need to switch networks before deployment
  useEffect(() => {
    if (chainId && config.network.chainId !== chainId) {
      setShowNetworkModal(true);
    }
  }, [chainId, config.network.chainId]);

  // Handle network switch
  const handleSwitchNetwork = async () => {
    try {
      await switchToNetwork(config.network.chainId);
      setShowNetworkModal(false);
    } catch (error) {
      console.error('Failed to switch network:', error);
    }
  };

  const handleDeploy = async () => {
    if (!agreed || !hasEnoughESR) return;
    
    setIsDeploying(true);
    setDeploymentError(null);
    
    try {
      // Deploy presale contract using contractService
      const deploymentResult = await contractService.deployPresale(config);
      
      // Add sale page URL to result
      const result: PresaleDeploymentResult = {
        ...deploymentResult,
        salePageUrl: `${window.location.origin}/sale/${deploymentResult.contractAddress}`
      };
      
      onDeploy(result);
    } catch (error) {
      console.error('Deployment failed:', error);
      setDeploymentError((error as Error).message);
    } finally {
      setIsDeploying(false);
    }
  };


  const getSaleTypeDisplay = () => {
    return config.saleType === 'presale' ? 'Public Presale' : 'Private Sale';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });
  };

  const getSaleDuration = () => {
    const start = new Date(config.saleConfiguration.startDate);
    const end = new Date(config.saleConfiguration.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-4">Review & Deploy</h2>
        <p className="text-gray-300">Review your sale configuration before deployment</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Sale Overview */}
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <h3 className="text-xl font-semibold text-white mb-4">Sale Overview</h3>
            
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Sale Name</label>
                <div className="text-white font-medium">{config.saleConfiguration.saleName}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Sale Type</label>
                <div className="text-white font-medium">{getSaleTypeDisplay()}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Anti-Bot Protection</label>
                <div className="text-white font-medium">
                  {config.antiBotConfig?.enabled ? 'Enabled' : 'Disabled'}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Token</label>
                <div className="text-white font-medium">{config.tokenInfo.tokenName} ({config.tokenInfo.tokenSymbol})</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Network</label>
                <div className="text-white font-medium">{config.network.name}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Allocated Tokens</label>
                <div className="text-white font-medium">
                  {parseInt(config.tokenInfo.allocatedAmount).toLocaleString()} {config.tokenInfo.tokenSymbol}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Duration</label>
                <div className="text-white font-medium">{getSaleDuration()}</div>
              </div>
            </div>
          </div>

          {/* Anti-Bot Configuration */}
          {config.antiBotConfig?.enabled && (
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <h3 className="text-xl font-semibold text-white mb-4">Anti-Bot Protection</h3>
              
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Protection Delay</label>
                  <div className="text-white font-medium">
                    {config.antiBotConfig.protectionDelay} seconds
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Max Gas Price</label>
                  <div className="text-white font-medium">
                    {config.antiBotConfig.maxGasPrice > 0 
                      ? `${config.antiBotConfig.maxGasPrice} Gwei` 
                      : 'No limit'}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Wallet Cooldown</label>
                  <div className="text-white font-medium">
                    {config.antiBotConfig.walletCooldown} seconds
                  </div>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-blue-500/20 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Shield className="w-4 h-4 text-blue-400" />
                  <span className="text-blue-400 font-medium">
                    Anti-bot protection helps prevent front-running and sniping
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Sale Configuration */}
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <h3 className="text-xl font-semibold text-white mb-4">Sale Configuration</h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Soft Cap</label>
                <div className="text-white font-medium">{config.saleConfiguration.softCap} {config.network.symbol}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Hard Cap</label>
                <div className="text-white font-medium">{config.saleConfiguration.hardCap} {config.network.symbol}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Token Price</label>
                <div className="text-white font-medium">
                  {config.saleConfiguration.tokenPrice} {config.tokenInfo.tokenSymbol} per {config.network.symbol}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Purchase Limits</label>
                <div className="text-white font-medium">
                  {config.saleConfiguration.minPurchase} - {config.saleConfiguration.maxPurchase} {config.network.symbol}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Start Date</label>
                <div className="text-white font-medium">{formatDate(config.saleConfiguration.startDate)}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">End Date</label>
                <div className="text-white font-medium">{formatDate(config.saleConfiguration.endDate)}</div>
              </div>
            </div>

            {config.saleType === 'fairlaunch' ? (
              <div className="mt-4 p-3 bg-green-500/20 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Zap className="w-4 h-4 text-green-400" />
                  <span className="text-green-400 font-medium">
                    Fairlaunch Mode: No hard cap, tokens distributed proportionally
                  </span>
                </div>
              </div>
            ) : config.saleType === 'private' && (
              <div className="mt-4 p-3 bg-purple-500/20 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Shield className="w-4 h-4 text-purple-400" />
                  <span className="text-purple-400 font-medium">
                    Whitelist: {config.saleConfiguration.whitelistEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Vesting Configuration */}
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <h3 className="text-xl font-semibold text-white mb-4">Vesting Configuration</h3>
            
            {config.vestingConfig.enabled ? (
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-white">Linear vesting enabled</span>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Initial Release</label>
                    <div className="text-white font-medium">{config.vestingConfig.initialRelease}% at TGE</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Vesting Duration</label>
                    <div className="text-white font-medium">{config.vestingConfig.duration} days</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-gray-400 rounded"></div>
                <span className="text-gray-400">No vesting - tokens released immediately</span>
              </div>
            )}
          </div>

          {/* Wallet Configuration */}
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <h3 className="text-xl font-semibold text-white mb-4">Wallet Configuration</h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Sale Receiver</label>
                <code className="text-white font-mono text-sm bg-white/10 px-2 py-1 rounded">
                  {config.walletSetup.saleReceiver}
                </code>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Refund Wallet</label>
                <code className="text-white font-mono text-sm bg-white/10 px-2 py-1 rounded">
                  {config.walletSetup.refundWallet}
                </code>
              </div>
            </div>
          </div>

          {/* ESR Balance Check */}
          <ESRBalanceCheck 
            requiredAmount={100}
            isTestnet={isTestnetMode || config.network.chainId > 1000000}
            onBalanceChange={setHasEnoughESR}
          />

          {/* Terms */}
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <h3 className="text-xl font-semibold text-white mb-4">Terms & Conditions</h3>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="agree"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="agree" className="text-white text-sm">
                  I understand that deployed sale contracts cannot be modified and I am responsible for the configuration
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Deployment Summary */}
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4">Deployment Summary</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Network
              </label>
              <NetworkSelector 
                selectedNetwork={config.network}
                onNetworkSelect={(network) => onNext({ ...config, network })}
              />
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Estimated Gas</span>
                <span className="text-white font-medium">{gasEstimate.amount} {config.network.symbol}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">USD Cost</span>
                <span className="text-white font-medium">{gasEstimate.usd}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">ESR Fee</span>
                <span className="text-white font-medium">100 ESR</span>
              </div>
              <div className="flex items-center">
                <span className="text-white font-medium">{config.network.name}</span>
                {isEstimating && (
                  <div className="ml-2 w-3 h-3 rounded-full bg-blue-500 animate-pulse"></div>
                )}
              </div>
              <div className="border-t border-white/20 pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Total Cost</span>
                  <span className="text-white font-medium">{gasEstimate.usd}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Estimated Time</span>
                  <span className="text-white font-medium">{gasEstimate.timeEstimate}</span>
                </div>
              </div>
            </div>
            
            {/* Auto-Listing Preview */}
            {config.autoListingConfig?.enabled && (
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4">Auto-Listing Configuration</h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Listing Price</span>
                    <span className="text-white font-medium">
                      {config.autoListingConfig.listingPrice} {config.tokenInfo.tokenSymbol} per {config.network.symbol}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">LP Token %</span>
                    <span className="text-white font-medium">{config.autoListingConfig.lpTokenPercentage}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">LP Base Token %</span>
                    <span className="text-white font-medium">{config.autoListingConfig.lpBaseTokenPercentage}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Lock Duration</span>
                    <span className="text-white font-medium">{config.autoListingConfig.lockDuration} days</span>
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-green-500/20 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-green-400 text-sm">
                      Auto-listing will be triggered after successful presale
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Features */}
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4">What's Included</h3>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Shield className="w-4 h-4 text-green-400" />
                <span className="text-white text-sm">Audited sale contract</span>
              </div>
              <div className="flex items-center space-x-3">
                <Clock className="w-4 h-4 text-blue-400" />
                <span className="text-white text-sm">Automatic timing controls</span>
              </div>
              <div className="flex items-center space-x-3">
                <DollarSign className="w-4 h-4 text-purple-400" />
                <span className="text-white text-sm">Refund mechanism</span>
              </div>
              <div className="flex items-center space-x-3">
                <Users className="w-4 h-4 text-orange-400" />
                <span className="text-white text-sm">Participant management</span>
              </div>
            </div>
          </div>

          {/* Warning */}
          <div className="bg-amber-500/20 border border-amber-500/50 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5" />
              <div>
                <h3 className="font-medium text-amber-400 mb-1">Final Warning</h3>
                <p className="text-amber-300 text-sm">
                  Once deployed, your sale contract cannot be modified. Please review all settings carefully.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Network Mismatch Modal */}
      <NetworkMismatchModal
        isOpen={showNetworkModal}
        onClose={() => setShowNetworkModal(false)}
        currentChainId={chainId}
        targetNetwork={config.network}
        onSwitchNetwork={handleSwitchNetwork}
        isAttemptingSwitch={isAttemptingSwitch}
        switchError={switchError}
      />

      {/* Actions */}
      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="px-6 py-3 text-gray-300 hover:text-white transition-colors"
        >
          Back
        </button>
        
        <button
          onClick={handleDeploy}
          disabled={!agreed || !hasEnoughESR || isDeploying}
          className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isDeploying ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Deploying Sale...</span>
            </>
          ) : (
            <>
              <span>Deploy Sale</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};