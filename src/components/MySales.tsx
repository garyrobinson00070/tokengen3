import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  DollarSign, 
  Users, 
  TrendingUp, 
  Eye, 
  Settings, 
  ExternalLink,
  Filter,
  Search,
  MoreVertical,
  Play,
  Pause,
  CheckCircle,
  AlertCircle,
  ArrowLeft
} from 'lucide-react';
import { PresaleConfig } from '../types/presale';
import { networks } from '../data/networks';
import { contractService } from '../services/contractService';

export const MySales: React.FC = () => {
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'upcoming' | 'live' | 'ended'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'raised'>('date');

  // State for sales data
  const [sales, setSales] = useState<PresaleConfig[]>([]);
  
  // Load sales data from contractService
  useEffect(() => {
    const loadSales = async () => {
      try {
        // Get deployed presales from API
        const presales = await contractService.getDeployedPresales();
        
        // Map to PresaleConfig interface
        const mappedSales: PresaleConfig[] = presales.map((sale: any, index: number) => {
          // Calculate real status based on current time vs sale dates
          const now = new Date();
          const startDate = new Date(sale.presaleConfig?.saleConfiguration?.startDate || Date.now() + 86400000);
          const endDate = new Date(sale.presaleConfig?.saleConfiguration?.endDate || Date.now() + 14 * 86400000);
          
          let status: 'upcoming' | 'live' | 'ended' = 'upcoming';
          if (now >= startDate && now <= endDate) {
            status = 'live';
          } else if (now > endDate) {
            status = 'ended';
          }

          // Check if sale is finalized (this would come from contract state)
          if (sale.isFinalized) {
            status = 'ended';
          }
          
          return {
            id: (index + 1).toString(),
            saleType: sale.saleType || 'presale',
            tokenInfo: {
              tokenAddress: sale.tokenAddress,
              tokenName: sale.tokenName,
              tokenSymbol: sale.tokenSymbol,
              maxSupply: '0',
              allocatedAmount: '0'
            },
            saleConfiguration: {
              saleName: sale.saleName,
              softCap: sale.presaleConfig?.saleConfiguration?.softCap || '10',
              hardCap: sale.presaleConfig?.saleConfiguration?.hardCap || '100',
              tokenPrice: sale.presaleConfig?.saleConfiguration?.tokenPrice || '1000',
              minPurchase: sale.presaleConfig?.saleConfiguration?.minPurchase || '0.1',
              maxPurchase: sale.presaleConfig?.saleConfiguration?.maxPurchase || '10',
              startDate: sale.presaleConfig?.saleConfiguration?.startDate || new Date().toISOString(),
              endDate: sale.presaleConfig?.saleConfiguration?.endDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
              whitelistEnabled: sale.presaleConfig?.saleConfiguration?.whitelistEnabled || false
            },
            vestingConfig: {
              enabled: sale.presaleConfig?.vestingConfig?.enabled || false,
              duration: sale.presaleConfig?.vestingConfig?.duration || 0,
              initialRelease: sale.presaleConfig?.vestingConfig?.initialRelease || 0
            },
            walletSetup: {
              saleReceiver: '',
              refundWallet: ''
            },
            network: networks.find(n => n.id === sale.network.id) || networks[0],
            status: status,
            contractAddress: sale.contractAddress,
            totalRaised: '0', // Will be updated by fetchSaleStatistics
            participantCount: 0, // Will be updated by fetchSaleStatistics
            createdAt: new Date(sale.timestamp).toISOString()
          };
        });
        
        setSales(mappedSales);
        
        // Fetch real-time sale data from contracts
        await fetchSaleStatistics(mappedSales);
      } catch (error) {
        console.error('Error loading sales:', error);
      }
    };
    
    loadSales();
  }, []);

  const fetchSaleStatistics = async (sales: PresaleConfig[]) => {
    try {
      // Fetch real-time statistics from presale contracts in parallel
      const updatedSales = await Promise.all(
        sales.map(async (sale) => {
          try {
            if (sale.contractAddress) {
              const stats = await contractService.getSaleStatistics(sale.contractAddress);
              return {
                ...sale,
                totalRaised: stats.totalRaised,
                participantCount: stats.participantCount,
                status: stats.status
              };
            }
            return sale;
          } catch (error) {
            console.error(`Error fetching stats for sale ${sale.id}:`, error);
            return sale;
          }
        })
      );
      
      setSales(updatedSales);
    } catch (error) {
      console.error('Error fetching sale statistics:', error);
    }
  };

  // Refresh statistics periodically for live sales
  useEffect(() => {
    if (sales.length > 0) {
      const interval = setInterval(() => {
        const liveSales = sales.filter(sale => sale.status === 'live');
        if (liveSales.length > 0) {
          fetchSaleStatistics(sales);
        }
      }, 15000); // Refresh every 15 seconds for live sales
      
      return () => clearInterval(interval);
    }
  }, [sales]);

  const refreshSaleData = async () => {
    if (sales.length > 0) {
      await fetchSaleStatistics(sales);
    }
  };

  const filteredSales = sales.filter(sale => {
    const matchesStatus = selectedStatus === 'all' || sale.status === selectedStatus;
    const matchesSearch = sale.saleConfiguration.saleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sale.tokenInfo.tokenName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sale.tokenInfo.tokenSymbol.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  const sortedSales = [...filteredSales].sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime();
      case 'name':
        return a.saleConfiguration.saleName.localeCompare(b.saleConfiguration.saleName);
      case 'raised':
        return parseFloat(b.totalRaised || '0') - parseFloat(a.totalRaised || '0');
      default:
        return 0;
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live': return 'text-green-400 bg-green-500/20';
      case 'upcoming': return 'text-blue-400 bg-blue-500/20';
      case 'ended': return 'text-gray-400 bg-gray-500/20';
      case 'cancelled': return 'text-red-400 bg-red-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'live': return <Play className="w-3 h-3" />;
      case 'upcoming': return <Clock className="w-3 h-3" />;
      case 'ended': return <CheckCircle className="w-3 h-3" />;
      case 'cancelled': return <AlertCircle className="w-3 h-3" />;
      default: return <Clock className="w-3 h-3" />;
    }
  };

  const getProgressPercentage = (sale: PresaleConfig) => {
    const raised = parseFloat(sale.totalRaised || '0');
    const hardCap = parseFloat(sale.saleConfiguration.hardCap);
    return Math.min((raised / hardCap) * 100, 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getSaleStats = () => {
    return {
      totalSales: sales.length,
      liveSales: sales.filter(sale => sale.status === 'live').length,
      totalRaised: sales.reduce((sum, sale) => sum + parseFloat(sale.totalRaised || '0'), 0),
      totalParticipants: sales.reduce((sum, sale) => sum + (sale.participantCount || 0), 0)
    };
  };

  const stats = getSaleStats();

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
          <h1 className="text-3xl font-bold text-white mb-2">My Sales</h1>
          <p className="text-gray-300">Manage and monitor your token sales</p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <div className="flex items-center space-x-3">
              <Calendar className="w-8 h-8 text-blue-400" />
              <div>
                <div className="text-2xl font-bold text-white">{stats.totalSales}</div>
                <div className="text-sm text-gray-300">Total Sales</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <div className="flex items-center space-x-3">
              <Play className="w-8 h-8 text-green-400" />
              <div>
                <div className="text-2xl font-bold text-white">{stats.liveSales}</div>
                <div className="text-sm text-gray-300">Live Sales</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <div className="flex items-center space-x-3">
              <DollarSign className="w-8 h-8 text-purple-400" />
              <div>
                <div className="text-2xl font-bold text-white">{stats.totalRaised.toFixed(1)} ETH</div>
                <div className="text-sm text-gray-300">Total Raised</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <div className="flex items-center space-x-3">
              <Users className="w-8 h-8 text-orange-400" />
              <div>
                <div className="text-2xl font-bold text-white">{stats.totalParticipants}</div>
                <div className="text-sm text-gray-300">Participants</div>
              </div>
            </div>
          </div>
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
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as any)}
                className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="upcoming">Upcoming</option>
                <option value="live">Live</option>
                <option value="ended">Ended</option>
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
                <option value="raised">Sort by Raised</option>
              </select>
            </div>
          </div>
        </div>

        {/* Sales List */}
        <div className="space-y-4">
          {sortedSales.length === 0 ? (
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-12 border border-white/10 text-center">
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Sales Found</h3>
              <p className="text-gray-300">
                {searchTerm ? 'No sales match your search criteria' : 'You haven\'t created any sales yet'}
              </p>
            </div>
          ) : (
            sortedSales.map((sale) => (
              <div key={sale.id} className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-white" />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-xl font-semibold text-white">{sale.saleConfiguration.saleName}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusColor(sale.status!)}`}>
                          {getStatusIcon(sale.status!)}
                          <span>{sale.status}</span>
                        </span>
                        <span className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs">
                          {sale.saleType === 'presale' ? 'Public' : 'Private'}
                        </span>
                      </div>
                      
                      <div className="grid md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <div className="text-sm text-gray-300">Token</div>
                          <div className="text-white font-medium">{sale.tokenInfo.tokenName} ({sale.tokenInfo.tokenSymbol})</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-300">Network</div>
                          <div className="text-white font-medium">{sale.network.name}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-300">Raised / Hard Cap</div>
                          <div className="text-white font-medium">
                            {sale.totalRaised} / {sale.saleConfiguration.hardCap} {sale.network.symbol}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-300">Participants</div>
                          <div className="text-white font-medium">{sale.participantCount}</div>
                        </div>
                      </div>
                      
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
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-300">
                        <span>Start: {formatDate(sale.saleConfiguration.startDate)}</span>
                        <span>End: {formatDate(sale.saleConfiguration.endDate)}</span>
                        <span>Created: {formatDate(sale.createdAt!)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button className="p-2 text-gray-400 hover:text-white transition-colors">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-white transition-colors">
                      <Settings className="w-4 h-4" />
                    </button>
                    <a
                      href={`${sale.network.explorerUrl}/address/${sale.contractAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-gray-400 hover:text-white transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
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