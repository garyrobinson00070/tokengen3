import React from 'react';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Calendar, 
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface Proposal {
  id: string;
  title: string;
  description: string;
  creator: string;
  creator_address: string;
  start_time: string;
  end_time: string;
  status: 'pending' | 'active' | 'passed' | 'rejected';
  quorum: number;
  execution_time: string;
  token_address: string;
  token_name: string;
  token_symbol: string;
  vote_count: number;
  created_at: string;
}

interface ProposalCardProps {
  proposal: Proposal;
  tokenAddress: string;
}

export const ProposalCard: React.FC<ProposalCardProps> = ({ proposal, tokenAddress }) => {
  const getStatusIcon = () => {
    switch (proposal.status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-400" />;
      case 'active':
        return <AlertCircle className="w-5 h-5 text-blue-400" />;
      case 'passed':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-400" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    switch (proposal.status) {
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'active':
        return 'bg-blue-500/20 text-blue-400';
      case 'passed':
        return 'bg-green-500/20 text-green-400';
      case 'rejected':
        return 'bg-red-500/20 text-red-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeRemaining = () => {
    const now = new Date();
    const endTime = new Date(proposal.end_time);
    
    if (now > endTime) return 'Voting ended';
    
    const diffMs = endTime.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (diffDays > 0) {
      return `${diffDays}d ${diffHours}h remaining`;
    } else {
      const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      return `${diffHours}h ${diffMinutes}m remaining`;
    }
  };

  const truncateDescription = (text: string, maxLength = 150) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <Link 
      to={`/governance/${tokenAddress}/proposal/${proposal.id}`}
      className="block bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:bg-white/10 transition-colors"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusColor()}`}>
              {getStatusIcon()}
              <span className="capitalize">{proposal.status}</span>
            </span>
            
            <span className="text-gray-400 text-sm">
              {proposal.status === 'active' ? getTimeRemaining() : formatDate(proposal.end_time)}
            </span>
          </div>
          
          <h3 className="text-xl font-semibold text-white mb-2">{proposal.title}</h3>
          
          <p className="text-gray-300 mb-4">
            {truncateDescription(proposal.description)}
          </p>
          
          <div className="flex flex-wrap items-center text-sm text-gray-400 gap-x-4 gap-y-2">
            <div className="flex items-center space-x-1">
              <Calendar className="w-4 h-4" />
              <span>Created: {formatDate(proposal.created_at)}</span>
            </div>
            
            <div>
              <span className="text-gray-300">Quorum: {proposal.quorum}%</span>
            </div>
            
            <div>
              <span className="text-gray-300">Votes: {proposal.vote_count}</span>
            </div>
          </div>
        </div>
        
        <ChevronRight className="w-5 h-5 text-gray-400" />
      </div>
    </Link>
  );
};