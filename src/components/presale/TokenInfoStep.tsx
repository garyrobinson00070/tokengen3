import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Search, ExternalLink, Coins, AlertCircle } from 'lucide-react';
import { PresaleConfig } from '../../types/presale';
import { contractService } from '../../services/contractService';

interface TokenInfoStepProps {
  config: PresaleConfig;
  onNext: (config: Partial<PresaleConfig>) => void;
  onBack: () => void;
}

interface DeployedToken {
  address: string;
  name: string;
  symbol: string;
  maxSupply: string;
  network: string;
  deploymentDate: string;
}

export const TokenInfoStep: React.FC<TokenInfoStepProps> = ({ config, onNext, onBack }) => {
  const [selectedToken, setSelectedToken] = useState<DeployedToken | null>(null);
  const [allocatedAmount, setAllocatedAmount] = useState(config.tokenInfo.allocatedAmount);
  const [searchTerm, setSearchTerm] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deployedTokens, setDeployedTokens] = useState<DeployedToken[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load deployed tokens from API
  useEffect(() => {
    const loadDeployedTokens = async () => {
      try {
        setIsLoading(true);
        
        // Fetch real deployed tokens from the API
        const tokens = await contractService.getDeployedTokens();
        
        // Map API response to DeployedToken interface
        const mappedTokens: DeployedToken[] = tokens.map((token: any) => ({
          address: token.contractAddress,
          name: token.name,
          symbol: token.symbol,
          maxSupply: token.maxSupply || token.totalSupply || '1000000',
          network: token.network?.name || 'Unknown',
          deploymentDate: token.timestamp
        }));
        
        setDeployedTokens(mappedTokens);
        
        console.log(`Loaded ${mappedTokens.length} deployed tokens`);
      } catch (error) {
        console.error('Error loading deployed tokens:', error);
        setDeployedTokens([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadDeployedTokens();
  }, []);

  // Auto-refresh token list periodically
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const tokens = await contractService.getDeployedTokens();
        const mappedTokens: DeployedToken[] = tokens.map((token: any) => ({
          address: token.contractAddress,
          name: token.name,
          symbol: token.symbol,
          maxSupply: token.maxSupply || token.totalSupply || '1000000',
          network: token.network?.name || 'Unknown',
          deploymentDate: token.timestamp
        }));
        
        // Only update if the list has changed
        if (mappedTokens.length !== deployedTokens.length) {
          setDeployedTokens(mappedTokens);
        }
      } catch (error) {
        console.error('Error refreshing token list:', error);
      }
    }, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, [deployedTokens.length]);

  useEffect(() => {
    if (config.tokenInfo.tokenAddress) {
      const token = deployedTokens.find(t => t.address === config.tokenInfo.tokenAddress);
      if (token) {
        setSelectedToken(token);
      }
    }
  }, [config.tokenInfo.tokenAddress, deployedTokens]);

  const filteredTokens = deployedTokens.filter(token =>
    token.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    token.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
    token.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!selectedToken) {
      newErrors.token = 'Please select a token from the list';
    }

    if (!allocatedAmount || parseFloat(allocatedAmount) <= 0) {
      newErrors.allocatedAmount = 'Please enter a valid allocation amount greater than 0';
    }

    if (selectedToken && allocatedAmount && parseFloat(allocatedAmount) > parseFloat(selectedToken.maxSupply)) {
      newErrors.allocatedAmount = `Allocated amount cannot exceed max supply (${parseInt(selectedToken.maxSupply).toLocaleString()})`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateForm() && selectedToken) {
      onNext({
        tokenInfo: {
          tokenAddress: selectedToken.address,
          tokenName: selectedToken.name,
          tokenSymbol: selectedToken.symbol,
          maxSupply: selectedToken.maxSupply,
          allocatedAmount
        }
      });
    }
  };

  const refreshTokenList = async () => {
    setIsLoading(true);
    try {
      const tokens = await contractService.getDeployedTokens();
      const mappedTokens: DeployedToken[] = tokens.map((token: any) => ({
        address: token.contractAddress,
        name: token.name,
        symbol: token.symbol,
        maxSupply: token.maxSupply || token.totalSupply || '1000000',
        network: token.network?.name || 'Unknown',
        deploymentDate: token.timestamp
      }));
      setDeployedTokens(mappedTokens);
    } catch (error) {
      console.error('Error refreshing tokens:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-4">Select Token</h2>
        <p className="text-gray-300">Choose a token from your deployed contracts</p>
      </div>

      {/* Search */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, symbol, or address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Token Selection */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Your Deployed Tokens</h3>
        
        {isLoading ? (
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-12 border border-white/10 text-center">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white">Loading your deployed tokens...</p>
          </div>
        ) : filteredTokens.length === 0 ? (
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-12 border border-white/10 text-center">
            <Coins className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Tokens Found</h3>
            <p className="text-gray-300">
              {deployedTokens.length === 0 
                ? "You haven't deployed any tokens yet. Create a token first before launching a sale."
                : 'No tokens match your search criteria'
              }
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredTokens.map((token) => (
              <div
                key={token.address}
                className={`p-6 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                  selectedToken?.address === token.address
                    ? 'border-blue-500 bg-blue-500/20 shadow-lg shadow-blue-500/25'
                    : 'border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10'
                }`}
                onClick={() => setSelectedToken(token)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <Coins className="w-6 h-6 text-white" />
                    </div>
                    
                    <div>
                      <h4 className="text-lg font-semibold text-white">{token.name}</h4>
                      <p className="text-gray-300">({token.symbol})</p>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-sm text-gray-400">
                          {formatAddress(token.address)}
                        </span>
                        <span className="text-sm text-blue-400">{token.network}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-lg font-semibold text-white">
                      {parseInt(token.maxSupply).toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-300">Max Supply</div>
                    <div className="text-xs text-gray-400 mt-1">
                      Deployed: {new Date(token.deploymentDate).toLocaleDateString()}
                    </div>
                  </div>
                  
                  <ExternalLink className="w-4 h-4 text-gray-400 hover:text-white transition-colors" />
                </div>
              </div>
            ))}
          </div>
        )}
        
        {errors.token && <p className="text-red-400 text-sm">{errors.token}</p>}
      </div>

      {/* Allocation Amount */}
      {selectedToken && (
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4">Sale Allocation</h3>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Tokens Allocated to Sale
              </label>
              <input
                type="number"
                value={allocatedAmount}
                onChange={(e) => setAllocatedAmount(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 100000"
              />
              {errors.allocatedAmount && (
                <p className="text-red-400 text-sm mt-1">{errors.allocatedAmount}</p>
              )}
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-300">Max Supply:</span>
                <span className="text-white font-medium">
                  {parseInt(selectedToken.maxSupply).toLocaleString()} {selectedToken.symbol}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Sale Allocation:</span>
                <span className="text-blue-400 font-medium">
                  {allocatedAmount ? parseInt(allocatedAmount).toLocaleString() : '0'} {selectedToken.symbol}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Percentage:</span>
                <span className="text-purple-400 font-medium">
                  {allocatedAmount && selectedToken.maxSupply 
                    ? ((parseFloat(allocatedAmount) / parseFloat(selectedToken.maxSupply)) * 100).toFixed(2)
                    : '0'
                  }%
                </span>
              </div>
            </div>
          </div>
          
          {allocatedAmount && parseFloat(allocatedAmount) > parseFloat(selectedToken.maxSupply) * 0.5 && (
            <div className="mt-4 p-3 bg-amber-500/20 border border-amber-500/50 rounded-lg">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-amber-400 mt-0.5" />
                <div>
                  <h4 className="font-medium text-amber-400 mb-1">High Allocation Warning</h4>
                  <p className="text-amber-300 text-sm">
                    You're allocating more than 50% of total supply to this sale. Consider if this aligns with your tokenomics.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 px-6 py-3 text-gray-300 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
        
        <button
          onClick={handleNext}
          disabled={!selectedToken || !allocatedAmount}
          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span>Continue</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};