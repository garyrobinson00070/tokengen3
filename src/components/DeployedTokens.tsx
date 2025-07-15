import React, { useState, useEffect } from 'react';
import { 
  ExternalLink, 
  Copy, 
  Filter, 
  Search, 
  Calendar,
  Coins,
  TrendingUp,
  Eye,
  MoreVertical,
  Download,
  ArrowLeft,
  Link,
  Twitter,
  MessageCircle,
  Settings,
  VoteIcon
} from 'lucide-react';
import { Network } from '../types';
import { networks } from '../data/networks';
import { contractService } from '../services/contractService';
import { web3Service } from '../services/web3Service';
import { tokenMetadataService } from '../services/tokenMetadataService';
import { TokenMetadataCard } from './TokenMetadataCard';
import { BadgeDisplay, BadgeInfo } from './badges/BadgeDisplay';

interface DeployedToken {
  id: string;
  name: string;
  symbol: string;
  contractAddress: string;
  network: Network;
  deploymentDate: string;
  totalSupply: string;
  maxSupply: string;
  decimals: number;
  transactionHash: string;
  features: string[];
  status: 'active' | 'paused' | 'verified';
  holders: number;
  transfers: number;
}

export const DeployedTokens: React.FC = () => {
  const [selectedNetwork, setSelectedNetwork] = useState<Network | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'supply'>('date');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'verified' | 'badges'>('all');
  const [copied, setCopied] = useState<string | null>(null);

  // State for token metadata
  const [tokenMetadata, setTokenMetadata] = useState<Record<string, any>>({});
  
  // State for token badges
  const [tokenBadges, setTokenBadges] = useState<Record<string, BadgeInfo[]>>({});

  // State for deployed tokens
  const [deployedTokens, setDeployedTokens] = useState<DeployedToken[]>([]);
  
  // Load deployed tokens from contractService
  useEffect(() => {
    const loadDeployedTokens = async () => {
      try {
        // Get deployed tokens from API
        const tokens = await contractService.getDeployedTokens();
        
        // Map to DeployedToken interface
        const mappedTokens: DeployedToken[] = tokens.map((token: any, index: number) => {
          return {
            id: (index + 1).toString(),
            name: token.name,
            symbol: token.symbol,
            contractAddress: token.contractAddress,
            network: networks.find(n => n.id === token.network.id) || networks[0],
            deploymentDate: new Date(token.timestamp).toISOString(),
            totalSupply: token.totalSupply || '0',
            maxSupply: token.maxSupply || '0',
            decimals: token.decimals || 18,
            transactionHash: token.transactionHash || '',
            features: token.contractType.includes('Burnable') ? ['Burnable'] : [],
            status: 'verified',
            holders: 0, // Will be updated by fetchTokenStatistics
            transfers: 0 // Will be updated by fetchTokenStatistics
          };
        });
        
        setDeployedTokens(mappedTokens);
        
        // Fetch token metadata for each token
        fetchTokenMetadata(mappedTokens);
        
        // Fetch badges for each token
        fetchTokenBadges(mappedTokens);
        
        // Fetch real statistics for each token
        await fetchTokenStatistics(mappedTokens);
      } catch (error) {
        console.error('Error loading deployed tokens:', error);
      }
    };
    
    loadDeployedTokens();
  }, []);

  const fetchTokenMetadata = async (tokens: DeployedToken[]) => {
    try {
      // Create a unique list of token addresses
      const tokenAddresses = [...new Set(tokens.map(token => token.contractAddress))];
      
      // Fetch metadata for each token
      const metadataPromises = tokenAddresses.map(async (address) => {
        try {
          const metadata = await tokenMetadataService.getTokenMetadata(address);
          return { address, metadata };
        } catch (error) {
          console.error(`Error fetching metadata for ${address}:`, error);
          return { address, metadata: null };
        }
      });
      
      const metadataResults = await Promise.all(metadataPromises);
      
      // Create a map of token address to metadata
      const metadataMap = metadataResults.reduce((map, { address, metadata }) => {
        if (metadata) {
          map[address] = metadata;
        }
        return map;
      }, {} as Record<string, any>);
      
      setTokenMetadata(metadataMap);
    } catch (error) {
      console.error('Error fetching token metadata:', error);
    }
  };

  const fetchTokenBadges = async (tokens: DeployedToken[]) => {
    try {
      // Create a unique list of token addresses
      const tokenAddresses = [...new Set(tokens.map(token => token.contractAddress))];
      
      // Fetch badges for each token
      const badgesPromises = tokenAddresses.map(async (address) => {
        try {
          const response = await fetch(`/api/badges/token/${address}`);
          if (!response.ok) return { address, badges: [] };
          
          const badges = await response.json();
          return { address, badges };
        } catch (error) {
          console.error(`Error fetching badges for ${address}:`, error);
          return { address, badges: [] };
        }
      });
      
      const badgesResults = await Promise.all(badgesPromises);
      
      // Create a map of token address to badges
      const badgesMap = badgesResults.reduce((map, { address, badges }) => {
        map[address] = badges;
        return map;
      }, {} as Record<string, BadgeInfo[]>);
      
      setTokenBadges(badgesMap);
    } catch (error) {
      console.error('Error fetching token badges:', error);
    }
  };

  const fetchTokenStatistics = async (tokens: DeployedToken[]) => {
    try {
      // Fetch statistics for all tokens in parallel
      const updatedTokens = await Promise.all(
        tokens.map(async (token) => {
          try {
            const stats = await contractService.getTokenStatistics(token.contractAddress, token.network);
            return {
              ...token,
              holders: stats.holders,
              transfers: stats.transfers,
              totalSupply: stats.totalSupply || token.totalSupply
            };
          } catch (error) {
            console.error(`Error fetching stats for token ${token.contractAddress}:`, error);
            return token; // Return original token if stats fetch fails
          }
        })
      );
      
      // Update state with real statistics
      setDeployedTokens(updatedTokens);
    } catch (error) {
      console.error('Error fetching token statistics:', error);
    }
  };

  // Refresh statistics periodically
  useEffect(() => {
    if (deployedTokens.length > 0) {
      const interval = setInterval(() => {
        fetchTokenStatistics(deployedTokens);
      }, 30000); // Refresh every 30 seconds
      
      return () => clearInterval(interval);
    }
  }, [deployedTokens.length]);

  const refreshTokenData = async () => {
    if (deployedTokens.length > 0) {
      await fetchTokenStatistics(deployedTokens);
    }
  };

  const getTokenStatsSummary = () => {
    return {
      totalHolders: deployedTokens.reduce((sum, token) => sum + token.holders, 0),
      totalTransfers: deployedTokens.reduce((sum, token) => sum + token.transfers, 0),
      verifiedTokens: deployedTokens.filter(t => t.status === 'verified').length
    };
  };

  const statsSummary = getTokenStatsSummary();

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const filteredTokens = deployedTokens.filter(token => {
    const matchesNetwork = !selectedNetwork || token.network.id === selectedNetwork.id;
    const matchesSearch = token.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         token.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         token.contractAddress.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'badges' ? 
                           (tokenBadges[token.contractAddress]?.length > 0) : 
                           token.status === filterStatus);
    
    return matchesNetwork && matchesSearch && matchesStatus;
  });

  const sortedTokens = [...filteredTokens].sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return new Date(b.deploymentDate).getTime() - new Date(a.deploymentDate).getTime();
      case 'name':
        return a.name.localeCompare(b.name);
      case 'supply':
        return parseInt(b.totalSupply) - parseInt(a.totalSupply);
      default:
        return 0;
    }
  });

  const getNetworkStats = () => {
    const stats = networks.map(network => ({
      network,
      count: deployedTokens.filter(token => token.network.id === network.id).length,
      totalSupply: deployedTokens
        .filter(token => token.network.id === network.id)
        .reduce((sum, token) => sum + parseInt(token.totalSupply), 0)
    }));
    return stats.filter(stat => stat.count > 0);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'text-green-400 bg-green-500/20';
      case 'active': return 'text-blue-400 bg-blue-500/20';
      case 'paused': return 'text-yellow-400 bg-yellow-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getNetworkIcon = (networkId: string) => {
    const icons: Record<string, string> = {
      'ethereum': '🔷',
      'bsc': '🟡',
      'polygon': '🟣',
      'arbitrum': '🔵',
      'fantom': '🌟',
      'avalanche': '🔺',
      'estar-testnet': '⚡'
    };
    return icons[networkId] || '🌐';
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
          <h1 className="text-3xl font-bold text-white mb-2">Deployed Tokens</h1>
          <p className="text-gray-300">Manage and monitor your deployed token contracts</p>
        </div>

        {/* Network Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <div className="flex items-center space-x-3">
              <Coins className="w-8 h-8 text-blue-400" />
              <div>
                <div className="text-2xl font-bold text-white">{deployedTokens.length}</div>
                <div className="text-sm text-gray-300">Total Tokens</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <div className="flex items-center space-x-3">
              <TrendingUp className="w-8 h-8 text-green-400" />
              <div>
                <div className="text-2xl font-bold text-white">
                  {deployedTokens.reduce((sum, token) => sum + token.holders, 0).toLocaleString()}
                </div>
                <div className="text-sm text-gray-300">Total Holders</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <div className="flex items-center space-x-3">
              <ExternalLink className="w-8 h-8 text-purple-400" />
              <div>
                <div className="text-2xl font-bold text-white">
                  {deployedTokens.reduce((sum, token) => sum + token.transfers, 0).toLocaleString()}
                </div>
                <div className="text-sm text-gray-300">Total Transfers</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <div className="flex items-center space-x-3">
              <Eye className="w-8 h-8 text-orange-400" />
              <div>
                <div className="text-2xl font-bold text-white">
                  {deployedTokens.filter(t => t.status === 'verified').length}
                </div>
                <div className="text-sm text-gray-300">Verified</div>
              </div>
            </div>
          </div>
        </div>

        {/* Network Selection */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Filter by Network</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-4">
            <button
              onClick={() => setSelectedNetwork(null)}
              className={`p-3 rounded-lg border transition-all ${
                !selectedNetwork
                  ? 'border-blue-500 bg-blue-500/20 text-blue-400'
                  : 'border-white/20 bg-white/5 text-gray-300 hover:border-white/40'
              }`}
            >
              <div className="text-center">
                <div className="text-lg mb-1">🌐</div>
                <div className="text-xs font-medium">All Networks</div>
                <div className="text-xs opacity-75">{deployedTokens.length} tokens</div>
              </div>
            </button>
            
            {getNetworkStats().map(({ network, count }) => (
              <button
                key={network.id}
                onClick={() => setSelectedNetwork(network)}
                className={`p-3 rounded-lg border transition-all ${
                  selectedNetwork?.id === network.id
                    ? 'border-blue-500 bg-blue-500/20 text-blue-400'
                    : 'border-white/20 bg-white/5 text-gray-300 hover:border-white/40'
                }`}
              >
                <div className="text-center">
                  <div className="text-lg mb-1">{getNetworkIcon(network.id)}</div>
                  <div className="text-xs font-medium">{network.name}</div>
                  <div className="text-xs opacity-75">{count} tokens</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search tokens..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-white/10 border border-white/20 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="verified">Verified</option>
                <option value="badges">With Badges</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-4">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="date">Sort by Date</option>
                <option value="name">Sort by Name</option>
                <option value="supply">Sort by Supply</option>
              </select>
              
              <button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2">
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tokens List */}
        <div className="space-y-4">
          {sortedTokens.length === 0 ? (
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-12 border border-white/10 text-center">
              <Coins className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Tokens Found</h3>
              <p className="text-gray-300">
                {selectedNetwork 
                  ? `No tokens deployed on ${selectedNetwork.name}`
                  : 'No tokens match your search criteria'
                }
              </p>
            </div>
          ) : (
            sortedTokens.map((token) => (
              <div key={token.id} className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    {tokenMetadata[token.contractAddress] ? (
                      <div className="flex items-center space-x-3">
                        {tokenMetadata[token.contractAddress].logoUrl ? (
                          <img 
                            src={tokenMetadata[token.contractAddress].logoUrl} 
                            alt={`${token.name} logo`} 
                            className="w-12 h-12 rounded-full object-cover border border-white/20"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                            <span className="text-white text-lg font-bold">
                              {token.symbol.charAt(0)}
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-3xl">{getNetworkIcon(token.network.id)}</div>
                    )}
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-xl font-semibold text-white">{token.name}</h3>
                        <span className="text-gray-400">({token.symbol})</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(token.status)}`}>
                          {token.status}
                        </span>
                      </div>
                      
                      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        <div>
                          <div className="text-sm text-gray-300">Total Supply</div>
                          <div className="text-white font-medium">{parseInt(token.totalSupply).toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-300">Transfers</div>
                          <span className="text-white font-medium">{token.transfers.toLocaleString()}</span>
                        </div>
                        <div>
                          <div className="text-sm text-gray-300">Holders</div>
                          <span className="text-white font-medium">{token.holders.toLocaleString()}</span>
                        </div>
                        <div>
                          <div className="text-sm text-gray-300">Network</div>
                          <div className="text-white font-medium">
                            {token.network.name}
                          </div>
                        </div>
                      </div>
                      
                      {/* Token Tags */}
                      {tokenMetadata[token.contractAddress]?.tags && tokenMetadata[token.contractAddress].tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-4">
                          {tokenMetadata[token.contractAddress].tags.slice(0, 3).map((tag: string) => (
                            <span 
                              key={tag} 
                              className="px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded-full text-xs"
                            >
                              {tag}
                            </span>
                          ))}
                          {tokenMetadata[token.contractAddress].tags.length > 3 && (
                            <span className="px-2 py-0.5 bg-gray-500/20 text-gray-300 rounded-full text-xs">
                              +{tokenMetadata[token.contractAddress].tags.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                      
                      {/* Badges */}
                      {tokenBadges[token.contractAddress]?.length > 0 && (
                        <div className="mt-2">
                          <BadgeDisplay badges={tokenBadges[token.contractAddress]} size="sm" />
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-2 mb-4">
                        <span className="text-sm text-gray-300">Contract:</span>
                        <code className="text-sm text-white font-mono bg-white/10 px-2 py-1 rounded">
                          {token.contractAddress.slice(0, 10)}...{token.contractAddress.slice(-8)}
                        </code>
                        <button
                          onClick={() => copyToClipboard(token.contractAddress, `address-${token.id}`)}
                          className="p-1 text-gray-400 hover:text-white transition-colors"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        {copied === `address-${token.id}` && (
                          <span className="text-green-400 text-sm">Copied!</span>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        {token.features.map((feature, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                      
                      {/* Social Links */}
                      {tokenMetadata[token.contractAddress] && (
                        <div className="flex space-x-3 mt-3">
                          {tokenMetadata[token.contractAddress].websiteUrl && (
                            <a 
                              href={tokenMetadata[token.contractAddress].websiteUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="p-1.5 bg-white/10 rounded-full text-blue-400 hover:bg-white/20 transition-colors"
                            >
                              <Link className="w-3.5 h-3.5" />
                            </a>
                          )}
                          
                          {tokenMetadata[token.contractAddress].twitterUrl && (
                            <a 
                              href={tokenMetadata[token.contractAddress].twitterUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="p-1.5 bg-white/10 rounded-full text-blue-400 hover:bg-white/20 transition-colors"
                            >
                              <Twitter className="w-3.5 h-3.5" />
                            </a>
                          )}
                          
                          {tokenMetadata[token.contractAddress].telegramUrl && (
                            <a 
                              href={tokenMetadata[token.contractAddress].telegramUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="p-1.5 bg-white/10 rounded-full text-blue-400 hover:bg-white/20 transition-colors"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <a
                      href={`${token.network.explorerUrl}/token/${token.contractAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-gray-400 hover:text-white transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <a
                      href={`/manage/${token.contractAddress}`}
                      className="p-2 text-gray-400 hover:text-white transition-colors"
                      title="Manage Token"
                    >
                      <Settings className="w-4 h-4" />
                    </a>
                    <a
                      href={`/governance/${token.contractAddress}`}
                      className="p-2 text-gray-400 hover:text-white transition-colors"
                      title="Governance"
                    >
                      <VoteIcon className="w-4 h-4" />
                    </a>
                    <button className="p-2 text-gray-400 hover:text-white transition-colors">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};