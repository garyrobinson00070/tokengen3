import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft,
  Search, 
  Filter, 
  TrendingUp, 
  Clock, 
  Users, 
  DollarSign,
  ExternalLink,
  Globe,
  Lock,
  Calendar
} from 'lucide-react';
import { contractService } from '../services/contractService';

// Add token metadata service import
import { tokenMetadataService } from '../services/tokenMetadataService';
import { BadgeDisplay, BadgeInfo } from './badges/BadgeDisplay';

interface PublicSale {
  id: string;
  contractAddress: string;
  saleName: string;
  tokenName: string;
  tokenSymbol: string;
  saleType: 'presale' | 'private';
  status: 'upcoming' | 'live' | 'ended';
  totalRaised: string;
  hardCap: string;
  participants: number;
  tokenPrice: string;
  startDate: string;
  endDate: string;
  network: string;
  networkSymbol: string;
}

export const SaleExplorer: React.FC = () => {
  const [sales, setSales] = useState<PublicSale[]>([]);
  const [filteredSales, setFilteredSales] = useState<PublicSale[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'upcoming' | 'live' | 'ended'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'presale' | 'private'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'raised' | 'participants'>('date');

  // State for token metadata and badges
  const [tokenMetadata, setTokenMetadata] = useState<Record<string, any>>({});
  const [tokenBadges, setTokenBadges] = useState<Record<string, BadgeInfo[]>>({});

  useEffect(() => {
    // Load sales data from contractService
    const loadSales = async () => {
      try {
        // Get deployed presales from contractService
        const presales = await contractService.getPublicPresales();
        
        // Map to PublicSale interface
        const mappedSales: PublicSale[] = presales.map((sale: any, index: number) => {
          return {
            id: (index + 1).toString(),
            contractAddress: sale.contractAddress,
            saleName: sale.saleName || `${sale.tokenSymbol} Sale`,
            tokenName: sale.tokenName,
            tokenSymbol: sale.tokenSymbol,
            saleType: sale.saleType || 'presale',
            status: sale.status || 'upcoming',
            totalRaised: '0',
            hardCap: '100',
            participants: 0,
            tokenPrice: '1000',
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            network: sale.network.name,
            networkSymbol: sale.network.symbol
          };
        });
        
        setSales(mappedSales);
        
        // Fetch token metadata for each sale
        fetchTokenMetadata(mappedSales);
        
        // Fetch badges for each sale
        fetchTokenBadges(mappedSales);
        
        setFilteredSales(mappedSales);
      } catch (error) {
        console.error('Error loading sales:', error);
      }
    };
    
    loadSales();
  }, []);

  const fetchTokenMetadata = async (sales: PublicSale[]) => {
    try {
      // Create a unique list of token addresses
      const tokenAddresses = [...new Set(sales.map(sale => sale.contractAddress))];
      
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

  const fetchTokenBadges = async (sales: PublicSale[]) => {
    try {
      // Create a unique list of token addresses
      const tokenAddresses = [...new Set(sales.map(sale => sale.contractAddress))];
      
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

  useEffect(() => {
    let filtered = sales.filter(sale => {
      const matchesSearch = sale.saleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           sale.tokenName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           sale.tokenSymbol.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || sale.status === statusFilter;
      const matchesType = typeFilter === 'all' || sale.saleType === typeFilter;
      
      return matchesSearch && matchesStatus && matchesType;
    });

    // Sort filtered results
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
        case 'raised':
          return parseFloat(b.totalRaised) - parseFloat(a.totalRaised);
        case 'participants':
          return b.participants - a.participants;
        default:
          return 0;
      }
    });

    setFilteredSales(filtered);
  }, [sales, searchTerm, statusFilter, typeFilter, sortBy]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live': return 'text-green-400 bg-green-500/20';
      case 'upcoming': return 'text-blue-400 bg-blue-500/20';
      case 'ended': return 'text-gray-400 bg-gray-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getProgressPercentage = (sale: PublicSale) => {
    return Math.min((parseFloat(sale.totalRaised) / parseFloat(sale.hardCap)) * 100, 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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
          <h1 className="text-3xl font-bold text-white mb-2">Explore Token Sales</h1>
          <p className="text-gray-300">Discover and participate in token presales and private sales</p>
        </div>

        {/* Filters */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search sales..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-white/10 border border-white/20 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="upcoming">Upcoming</option>
                <option value="live">Live</option>
                <option value="ended">Ended</option>
              </select>
              
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Types</option>
                <option value="presale">Presale</option>
                <option value="private">Private Sale</option>
                <option value="fairlaunch">Fairlaunch</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-4">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="date">Sort by Date</option>
                <option value="raised">Sort by Raised</option>
                <option value="participants">Sort by Participants</option>
              </select>
            </div>
          </div>
        </div>

        {/* Sales Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSales.map((sale) => (
            <div key={sale.id} className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-200">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    {sale.saleType === 'private' ? (
                      <Lock className="w-5 h-5 text-white" />
                    ) : sale.saleType === 'fairlaunch' ? (
                      <Zap className="w-5 h-5 text-white" />
                    ) : (
                      <Globe className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{sale.tokenName}</h3>
                    
                    {/* Badges */}
                    {tokenBadges[sale.contractAddress]?.length > 0 && (
                      <div className="mt-1">
                        <BadgeDisplay badges={tokenBadges[sale.contractAddress]} size="sm" />
                      </div>
                    )}
                    
                    <p className="text-sm text-gray-300">({sale.tokenSymbol})</p>
                  </div>
                </div>
                
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(sale.status)}`}>
                  {sale.status}
                </span>
              </div>
              
              <h4 className="text-lg font-medium text-white mb-3">{sale.saleName}</h4>
              
              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-300">Progress</span>
                  <span className="text-white">{getProgressPercentage(sale).toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${getProgressPercentage(sale)}%` }}
                  ></div>
                </div>
              </div>
              
              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-white">
                    {parseFloat(sale.totalRaised).toFixed(1)}
                  </div>
                  <div className="text-xs text-gray-300">Raised ({sale.networkSymbol})</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-white">{sale.participants}</div>
                  <div className="text-xs text-gray-300">Participants</div>
                </div>
              </div>
              
              {/* Details */}
              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-300">Price:</span>
                  <span className="text-white">{sale.tokenPrice} {sale.tokenSymbol}/{sale.networkSymbol}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Network:</span>
                  <span className="text-white">{sale.network}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">End Date:</span>
                  <span className="text-white">{formatDate(sale.endDate)}</span>
                </div>
              </div>
              
              {/* Action Button */}
              <a
                href={`/sale/${sale.contractAddress}`}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2"
              >
                <span>View Sale</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          ))}
        </div>

        {filteredSales.length === 0 && (
          <div className="text-center py-12">
            <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Sales Found</h3>
            <p className="text-gray-300">No sales match your current filters.</p>
          </div>
        )}
      </div>
    </div>
  );
};