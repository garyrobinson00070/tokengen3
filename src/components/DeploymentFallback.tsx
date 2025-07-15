import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  AlertTriangle, 
  Zap, 
  Shield, 
  Server, 
  Loader2, 
  CheckCircle, 
  XCircle 
} from 'lucide-react';
import { TokenConfig, DeploymentResult } from '../types';
import { fallbackDeploymentService } from '../services/fallbackDeploymentService';
import { web3Service } from '../services/web3Service';

interface DeploymentFallbackProps {
  config: TokenConfig;
  onBack: () => void;
  onDeploy: (result: DeploymentResult) => void;
  primaryError?: string;
}

export const DeploymentFallback: React.FC<DeploymentFallbackProps> = ({ 
  config, 
  onBack, 
  onDeploy,
  primaryError
}) => {
  const [activeMethod, setActiveMethod] = useState<'frontend' | 'backend'>('frontend');
  const [isDeploying, setIsDeploying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gasEstimate, setGasEstimate] = useState<{
    gasEstimate: bigint;
    gasCost: string;
    gasCostUsd: string;
  } | null>(null);
  const [isEstimating, setIsEstimating] = useState(false);
  const [backendAvailable, setBackendAvailable] = useState(false);

  // Check if backend emergency deployment is available
  useEffect(() => {
    const checkBackendStatus = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/emergency-deploy/status`);
        if (response.ok) {
          const data = await response.json();
          setBackendAvailable(data.available);
        }
      } catch (error) {
        console.error('Error checking backend status:', error);
        setBackendAvailable(false);
      }
    };
    
    checkBackendStatus();
  }, []);

  // Estimate gas for frontend deployment
  useEffect(() => {
    const estimateGas = async () => {
      if (activeMethod !== 'frontend') return;
      
      setIsEstimating(true);
      try {
        const estimate = await fallbackDeploymentService.estimateGas(config);
        setGasEstimate(estimate);
      } catch (error) {
        console.error('Error estimating gas:', error);
        setError('Failed to estimate gas. Please try again.');
      } finally {
        setIsEstimating(false);
      }
    };
    
    estimateGas();
  }, [config, activeMethod]);

  const handleDeploy = async () => {
    setIsDeploying(true);
    setError(null);
    
    try {
      if (activeMethod === 'frontend') {
        // Check if we're on the correct network
        const currentNetwork = await web3Service.getCurrentNetwork();
        if (currentNetwork?.chainId !== config.network.chainId) {
          try {
            await web3Service.switchNetwork(config.network);
          } catch (error) {
            throw new Error(`Please switch to ${config.network.name} network before deploying`);
          }
        }
        
        // Deploy using frontend fallback
        const result = await fallbackDeploymentService.deployContract(config);
        result.deploymentMethod = 'fallback';
        onDeploy(result);
      } else {
        // Deploy using backend emergency
        const authToken = localStorage.getItem('authToken');
        if (!authToken) {
          throw new Error('Authentication required for emergency deployment');
        }
        
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/emergency-deploy/token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({
            contractType: getContractType(config),
            constructorArgs: getConstructorParams(config),
            network: config.network.id
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || errorData.details || 'Emergency deployment failed');
        }
        
        const result = await response.json();
        
        onDeploy({
          deploymentMethod: 'emergency',
          contractAddress: result.contractAddress,
          transactionHash: result.transactionHash,
          network: config.network,
          explorerUrl: `${config.network.explorerUrl}/token/${result.contractAddress}`,
          gasUsed: result.gasUsed,
          deploymentCost: result.deploymentCost
        });
      }
    } catch (error) {
      console.error('Deployment failed:', error);
      setError((error as Error).message);
    } finally {
      setIsDeploying(false);
    }
  };

  // Helper functions
  const getContractType = (config: TokenConfig): string => {
    const features = config.features;
    
    if (features.burnable && features.mintable && features.transferFees.enabled && features.holderRedistribution.enabled) {
      return 'AdvancedToken';
    } else if (features.burnable && features.mintable && features.transferFees.enabled) {
      return 'BurnableMintableFeeToken';
    } else if (features.burnable && features.mintable && features.holderRedistribution.enabled) {
      return 'BurnableMintableRedistributionToken';
    } else if (features.burnable && features.mintable) {
      return 'BurnableMintableToken';
    } else if (features.burnable) {
      return 'BurnableToken';
    } else if (features.mintable) {
      return 'MintableToken';
    } else if (features.transferFees.enabled) {
      return 'FeeToken';
    } else if (features.holderRedistribution.enabled) {
      return 'RedistributionToken';
    } else {
      return 'BasicToken';
    }
  };

  const getConstructorParams = (config: TokenConfig): any[] => {
    const contractType = getContractType(config);
    const baseParams = [
      config.name,
      config.symbol,
      config.decimals,
      config.initialSupply,
      config.maxSupply || '0',
    ];

    switch (contractType) {
      case 'FeeToken':
        return [
          ...baseParams,
          Math.floor(config.features.transferFees.percentage * 100),
          config.features.transferFees.recipient,
          'DEPLOYER_ADDRESS' // Will be replaced by backend
        ];
      case 'RedistributionToken':
        return [
          ...baseParams,
          Math.floor(config.features.holderRedistribution.percentage * 100),
          'DEPLOYER_ADDRESS'
        ];
      case 'AdvancedToken':
        return [
          ...baseParams,
          Math.floor(config.features.transferFees.percentage * 100),
          config.features.transferFees.recipient,
          Math.floor(config.features.holderRedistribution.percentage * 100),
          'DEPLOYER_ADDRESS'
        ];
      default:
        return [...baseParams, 'DEPLOYER_ADDRESS'];
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Review</span>
          </button>
          
          <h1 className="text-3xl font-bold text-white mb-2">Deployment Recovery</h1>
          <p className="text-gray-300">Primary deployment failed. Choose an alternative deployment method.</p>
        </div>

        {/* Error Banner */}
        {primaryError && (
          <div className="mb-8 p-6 bg-red-500/20 border border-red-500/50 rounded-xl">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5" />
              <div>
                <h3 className="font-medium text-red-400 mb-1">Primary Deployment Failed</h3>
                <p className="text-red-300 text-sm">
                  {primaryError}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Deployment Methods */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <h2 className="text-xl font-semibold text-white mb-4">Alternative Deployment Methods</h2>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div 
                  className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${
                    activeMethod === 'frontend'
                      ? 'border-blue-500 bg-blue-500/20'
                      : 'border-white/20 bg-white/5 hover:border-white/40'
                  }`}
                  onClick={() => setActiveMethod('frontend')}
                >
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <Zap className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">Frontend Deployment</h3>
                      <p className="text-sm text-gray-300">Deploy directly from your browser</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-300">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span>Uses your connected wallet</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span>No backend dependency</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span>Full control over deployment</span>
                    </div>
                  </div>
                </div>
                
                <div 
                  className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${
                    !backendAvailable ? 'opacity-50 cursor-not-allowed' : 
                    activeMethod === 'backend'
                      ? 'border-purple-500 bg-purple-500/20'
                      : 'border-white/20 bg-white/5 hover:border-white/40'
                  }`}
                  onClick={() => backendAvailable && setActiveMethod('backend')}
                >
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                      <Server className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">Backend Deployment</h3>
                      <p className="text-sm text-gray-300">Deploy using server-side Foundry</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-300">
                    <div className="flex items-center space-x-2">
                      {backendAvailable ? (
                        <>
                          <CheckCircle className="w-4 h-4 text-green-400" />
                          <span>Available and ready</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 text-red-400" />
                          <span>Not available</span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span>Uses server-side deployment key</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span>Reliable RPC connections</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Deployment Details */}
            {activeMethod === 'frontend' && (
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                <h2 className="text-xl font-semibold text-white mb-4">Frontend Deployment Details</h2>
                
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Contract Type:</span>
                    <span className="text-white font-medium">{getContractType(config)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Network:</span>
                    <span className="text-white font-medium">{config.network.name}</span>
                  </div>
                  
                  {isEstimating ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
                    </div>
                  ) : gasEstimate ? (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Estimated Gas:</span>
                        <span className="text-white font-medium">{gasEstimate.gasCost} {config.network.symbol}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Estimated Cost:</span>
                        <span className="text-white font-medium">{gasEstimate.gasCostUsd}</span>
                      </div>
                    </>
                  ) : (
                    <div className="p-3 bg-amber-500/20 rounded-lg">
                      <p className="text-amber-300 text-sm">
                        Gas estimate not available. Proceed with caution.
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="mt-6 p-4 bg-blue-500/20 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <Shield className="w-5 h-5 text-blue-400 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-400 mb-1">Frontend Deployment</h4>
                      <p className="text-blue-300 text-sm">
                        This will deploy the contract directly from your browser using your connected wallet.
                        You will need to confirm the transaction in your wallet.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {activeMethod === 'backend' && (
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                <h2 className="text-xl font-semibold text-white mb-4">Backend Deployment Details</h2>
                
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Contract Type:</span>
                    <span className="text-white font-medium">{getContractType(config)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Network:</span>
                    <span className="text-white font-medium">{config.network.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Deployment Method:</span>
                    <span className="text-white font-medium">Foundry (forge create)</span>
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-purple-500/20 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <Server className="w-5 h-5 text-purple-400 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-purple-400 mb-1">Backend Deployment</h4>
                      <p className="text-purple-300 text-sm">
                        This will deploy the contract using our secure backend server.
                        The contract will be deployed using a server-side wallet and you will receive the contract address once deployed.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-6">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-red-400 mb-1">Deployment Error</h3>
                    <p className="text-red-300 text-sm">{error}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Token Summary */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4">Token Summary</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-300">Name:</span>
                  <span className="text-white font-medium">{config.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Symbol:</span>
                  <span className="text-white font-medium">{config.symbol}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Initial Supply:</span>
                  <span className="text-white font-medium">{parseInt(config.initialSupply).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Decimals:</span>
                  <span className="text-white font-medium">{config.decimals}</span>
                </div>
              </div>
            </div>

            {/* Features Summary */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4">Features</h3>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${config.features.burnable ? 'bg-green-400' : 'bg-gray-500'}`}></div>
                  <span className={config.features.burnable ? 'text-white' : 'text-gray-400'}>Burnable</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${config.features.mintable ? 'bg-green-400' : 'bg-gray-500'}`}></div>
                  <span className={config.features.mintable ? 'text-white' : 'text-gray-400'}>Mintable</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${config.features.transferFees.enabled ? 'bg-green-400' : 'bg-gray-500'}`}></div>
                  <span className={config.features.transferFees.enabled ? 'text-white' : 'text-gray-400'}>Transfer Fees</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${config.features.holderRedistribution.enabled ? 'bg-green-400' : 'bg-gray-500'}`}></div>
                  <span className={config.features.holderRedistribution.enabled ? 'text-white' : 'text-gray-400'}>Holder Redistribution</span>
                </div>
              </div>
            </div>

            {/* Warning */}
            <div className="bg-amber-500/20 border border-amber-500/50 rounded-xl p-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5" />
                <div>
                  <h3 className="font-medium text-amber-400 mb-1">Fallback Deployment</h3>
                  <p className="text-amber-300 text-sm">
                    Primary deployment failed. Using alternative deployment method.
                    This process may take longer than usual.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between mt-8">
          <button
            onClick={onBack}
            className="px-6 py-3 text-gray-300 hover:text-white transition-colors"
          >
            Back
          </button>
          
          <button
            onClick={handleDeploy}
            disabled={isDeploying}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 disabled:opacity-50"
          >
            {isDeploying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Deploying...</span>
              </>
            ) : (
              <>
                <span>Deploy with {activeMethod === 'frontend' ? 'Frontend' : 'Backend'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};