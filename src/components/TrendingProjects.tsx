import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Star, 
  Clock, 
  Users, 
  DollarSign, 
  ArrowRight,
  Loader2
} from 'lucide-react';
import Slider from 'react-slick';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { contractService } from '../services/contractService';

interface TrendingProject {
  id: string;
  contractAddress: string;
  name: string;
  tokenName: string;
  tokenSymbol: string;
  softCap: string;
  hardCap: string;
  totalRaised: string;
  participants: number;
  startDate: string;
  endDate: string;
  status: 'upcoming' | 'live' | 'ended';
  network: string;
  featured: boolean;
}

export const TrendingProjects: React.FC = () => {
  const [projects, setProjects] = useState<TrendingProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'featured' | 'trending' | 'upcoming'>('all');

  useEffect(() => {
    loadProjects();
    
    // Refresh data every 30 seconds
    const interval = setInterval(() => {
      loadProjects(false);
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const loadProjects = async (showLoading = true) => {
    if (showLoading) {
      setIsLoading(true);
    }
    
    try {
      // Get public presales from API
      const presales = await contractService.getPublicPresales();
      
      // Map to TrendingProject interface
      const mappedProjects: TrendingProject[] = await Promise.all(
        presales.map(async (sale: any) => {
          // Get real-time statistics for each sale
          let stats = { totalRaised: '0', participantCount: 0, status: sale.status || 'upcoming' };
          try {
            if (sale.contractAddress) {
              stats = await contractService.getSaleStatistics(sale.contractAddress);
            }
          } catch (error) {
            console.error(`Error fetching stats for sale ${sale.contractAddress}:`, error);
          }
          
          return {
            id: sale.id,
            contractAddress: sale.contractAddress,
            name: sale.saleName || `${sale.tokenSymbol} Sale`,
            tokenName: sale.tokenName,
            tokenSymbol: sale.tokenSymbol,
            softCap: sale.softCap || '10',
            hardCap: sale.hardCap || '100',
            totalRaised: stats.totalRaised || '0',
            participants: stats.participantCount || 0,
            startDate: sale.startDate || new Date().toISOString(),
            endDate: sale.endDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            status: stats.status || 'upcoming',
            network: sale.network?.name || 'Ethereum',
            featured: sale.featured || false
          };
        })
      );
      
      setProjects(mappedProjects);
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getFilteredProjects = () => {
    switch (activeFilter) {
      case 'featured':
        return projects.filter(p => p.featured);
      case 'trending':
        return [...projects]
          .filter(p => p.status === 'live')
          .sort((a, b) => parseFloat(b.totalRaised) - parseFloat(a.totalRaised));
      case 'upcoming':
        return projects.filter(p => p.status === 'upcoming');
      default:
        return projects;
    }
  };

  const getProgressPercentage = (project: TrendingProject) => {
    const raised = parseFloat(project.totalRaised);
    const hardCap = parseFloat(project.hardCap);
    return Math.min((raised / hardCap) * 100, 100);
  };

  const getTimeRemaining = (endDate: string) => {
    const end = new Date(endDate).getTime();
    const now = Date.now();
    
    if (now >= end) return 'Ended';
    
    const diff = end - now;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    return `${days}d ${hours}h`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live': return 'text-green-400 bg-green-500/20';
      case 'upcoming': return 'text-blue-400 bg-blue-500/20';
      case 'ended': return 'text-gray-400 bg-gray-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 3,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 5000,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1
        }
      },
      {
        breakpoint: 640,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1
        }
      }
    ]
  };

  const filteredProjects = getFilteredProjects();

  return (
    <div className="py-12 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">Trending Projects</h2>
            <p className="text-gray-300">Discover the hottest token sales on TokenForge</p>
          </div>
          
          <div className="flex space-x-2 mt-4 md:mt-0">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeFilter === 'all'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setActiveFilter('featured')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeFilter === 'featured'
                  ? 'bg-purple-500 text-white'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              <Star className="w-4 h-4 inline mr-1" />
              Featured
            </button>
            <button
              onClick={() => setActiveFilter('trending')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeFilter === 'trending'
                  ? 'bg-green-500 text-white'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              <TrendingUp className="w-4 h-4 inline mr-1" />
              Trending
            </button>
            <button
              onClick={() => setActiveFilter('upcoming')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeFilter === 'upcoming'
                  ? 'bg-orange-500 text-white'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              <Clock className="w-4 h-4 inline mr-1" />
              Upcoming
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-12 border border-white/10 text-center">
            <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Projects Found</h3>
            <p className="text-gray-300">
              {activeFilter === 'all' 
                ? 'There are no active projects at the moment.' 
                : `No ${activeFilter} projects found.`}
            </p>
          </div>
        ) : (
          <div className="carousel-container">
            <Slider {...sliderSettings}>
              {filteredProjects.map((project) => (
                <div key={project.id} className="px-2">
                  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 h-full">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="text-xl font-semibold text-white">{project.name}</h3>
                          {project.featured && (
                            <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs flex items-center">
                              <Star className="w-3 h-3 mr-1" />
                              Featured
                            </span>
                          )}
                        </div>
                        <p className="text-gray-300">{project.tokenName} ({project.tokenSymbol})</p>
                      </div>
                      
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                        {project.status}
                      </span>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-300">Progress</span>
                        <span className="text-white">{getProgressPercentage(project).toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${getProgressPercentage(project)}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <div className="flex items-center space-x-1 text-sm text-gray-300 mb-1">
                          <DollarSign className="w-3 h-3" />
                          <span>Raised</span>
                        </div>
                        <div className="text-white font-medium">
                          {parseFloat(project.totalRaised).toFixed(2)} / {project.hardCap}
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center space-x-1 text-sm text-gray-300 mb-1">
                          <Users className="w-3 h-3" />
                          <span>Participants</span>
                        </div>
                        <div className="text-white font-medium">{project.participants}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="text-sm text-gray-300 mb-1">Network</div>
                        <div className="text-white">{project.network}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-300 mb-1">Time Remaining</div>
                        <div className="text-white">{getTimeRemaining(project.endDate)}</div>
                      </div>
                    </div>
                    
                    <a
                      href={`/sale/${project.contractAddress}`}
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2"
                    >
                      <span>Join Sale</span>
                      <ArrowRight className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              ))}
            </Slider>
          </div>
        )}
      </div>
    </div>
  );
};