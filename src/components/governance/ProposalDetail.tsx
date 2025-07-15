import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Calendar, 
  User, 
  Percent,
  ThumbsUp,
  ThumbsDown,
  Loader2,
  ArrowLeft
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWallet } from '../../hooks/useWallet';

interface ProposalDetail {
  proposal: {
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
    created_at: string;
  };
  votes: Array<{
    id: string;
    proposal_id: string;
    voter: string;
    voter_address: string;
    vote: 'yes' | 'no' | 'abstain';
    vote_weight: string;
    created_at: string;
  }>;
  statistics: {
    totalVotes: number;
    yesVotes: number;
    noVotes: number;
    abstainVotes: number;
    totalSupply: string;
    quorumPercentage: number;
    quorumReached: boolean;
  };
}

export const ProposalDetail: React.FC = () => {
  const { proposalId, tokenAddress } = useParams<{ proposalId: string; tokenAddress: string }>();
  const navigate = useNavigate();
  const { isConnected, address } = useWallet();
  
  const [proposalDetail, setProposalDetail] = useState<ProposalDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userVote, setUserVote] = useState<'yes' | 'no' | 'abstain' | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  const [voteSuccess, setVoteSuccess] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);

  useEffect(() => {
    if (proposalId) {
      loadProposalDetail();
    }
  }, [proposalId]);

  useEffect(() => {
    if (proposalDetail && address) {
      // Check if user has already voted
      const userVoteRecord = proposalDetail.votes.find(
        v => v.voter_address.toLowerCase() === address.toLowerCase()
      );
      
      if (userVoteRecord) {
        setUserVote(userVoteRecord.vote);
        setHasVoted(true);
      } else {
        setHasVoted(false);
      }
    }
  }, [proposalDetail, address]);

  const loadProposalDetail = async () => {
    if (!proposalId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/governance/proposal/${proposalId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch proposal details');
      }
      
      const data = await response.json();
      setProposalDetail(data);
    } catch (error) {
      console.error('Error loading proposal details:', error);
      setError('Failed to load proposal details. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVote = async (voteType: 'yes' | 'no' | 'abstain') => {
    if (!isConnected || !proposalId || hasVoted) return;
    
    setIsVoting(true);
    setError(null);
    setVoteSuccess(null);
    
    try {
      const authToken = localStorage.getItem('authToken');
      if (!authToken) {
        throw new Error('Not authenticated');
      }
      
      const response = await fetch('/api/governance/vote', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          proposalId,
          vote: voteType
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to cast vote');
      }
      
      const data = await response.json();
      setVoteSuccess(`Your vote has been recorded successfully!`);
      setUserVote(voteType);
      setHasVoted(true);
      
      // Reload proposal details to update vote counts
      await loadProposalDetail();
    } catch (error) {
      console.error('Error casting vote:', error);
      setError((error as Error).message || 'Failed to cast vote');
    } finally {
      setIsVoting(false);
    }
  };

  const getStatusIcon = () => {
    if (!proposalDetail) return null;
    
    switch (proposalDetail.proposal.status) {
      case 'pending':
        return <Clock className="w-6 h-6 text-yellow-400" />;
      case 'active':
        return <AlertCircle className="w-6 h-6 text-blue-400" />;
      case 'passed':
        return <CheckCircle className="w-6 h-6 text-green-400" />;
      case 'rejected':
        return <XCircle className="w-6 h-6 text-red-400" />;
      default:
        return <Clock className="w-6 h-6 text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    if (!proposalDetail) return '';
    
    switch (proposalDetail.proposal.status) {
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
    if (!proposalDetail) return '';
    
    const now = new Date();
    const endTime = new Date(proposalDetail.proposal.end_time);
    
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !proposalDetail) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="p-6 bg-red-500/20 border border-red-500/50 rounded-xl text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Error Loading Proposal</h3>
            <p className="text-red-300">{error || 'Proposal not found'}</p>
            <button
              onClick={() => navigate(`/governance/${tokenAddress}`)}
              className="mt-4 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
            >
              Back to Governance
            </button>
          </div>
        </div>
      </div>
    );
  }

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
          
          <div className="flex items-center space-x-3 mb-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1 ${getStatusColor()}`}>
              {getStatusIcon()}
              <span className="capitalize">{proposalDetail.proposal.status}</span>
            </span>
            
            {proposalDetail.proposal.status === 'active' && (
              <span className="text-gray-300 text-sm">
                {getTimeRemaining()}
              </span>
            )}
          </div>
          
          <h1 className="text-3xl font-bold text-white mb-4">
            {proposalDetail.proposal.title}
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Proposal Description */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <h2 className="text-xl font-semibold text-white mb-4">Description</h2>
              <div className="text-gray-300 whitespace-pre-line">
                {proposalDetail.proposal.description}
              </div>
            </div>

            {/* Voting Results */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <h2 className="text-xl font-semibold text-white mb-4">Voting Results</h2>
              
              <div className="space-y-4">
                {/* Yes Votes */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-300">Yes</span>
                    <span className="text-white">
                      {proposalDetail.statistics.yesVotes.toLocaleString()} votes 
                      ({proposalDetail.statistics.totalVotes > 0 
                        ? ((proposalDetail.statistics.yesVotes / proposalDetail.statistics.totalVotes) * 100).toFixed(2) 
                        : '0'}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2.5">
                    <div 
                      className="bg-green-500 h-2.5 rounded-full"
                      style={{ 
                        width: `${proposalDetail.statistics.totalVotes > 0 
                          ? (proposalDetail.statistics.yesVotes / proposalDetail.statistics.totalVotes) * 100 
                          : 0}%` 
                      }}
                    ></div>
                  </div>
                </div>
                
                {/* No Votes */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-300">No</span>
                    <span className="text-white">
                      {proposalDetail.statistics.noVotes.toLocaleString()} votes 
                      ({proposalDetail.statistics.totalVotes > 0 
                        ? ((proposalDetail.statistics.noVotes / proposalDetail.statistics.totalVotes) * 100).toFixed(2) 
                        : '0'}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2.5">
                    <div 
                      className="bg-red-500 h-2.5 rounded-full"
                      style={{ 
                        width: `${proposalDetail.statistics.totalVotes > 0 
                          ? (proposalDetail.statistics.noVotes / proposalDetail.statistics.totalVotes) * 100 
                          : 0}%` 
                      }}
                    ></div>
                  </div>
                </div>
                
                {/* Abstain Votes */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-300">Abstain</span>
                    <span className="text-white">
                      {proposalDetail.statistics.abstainVotes.toLocaleString()} votes 
                      ({proposalDetail.statistics.totalVotes > 0 
                        ? ((proposalDetail.statistics.abstainVotes / proposalDetail.statistics.totalVotes) * 100).toFixed(2) 
                        : '0'}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2.5">
                    <div 
                      className="bg-gray-500 h-2.5 rounded-full"
                      style={{ 
                        width: `${proposalDetail.statistics.totalVotes > 0 
                          ? (proposalDetail.statistics.abstainVotes / proposalDetail.statistics.totalVotes) * 100 
                          : 0}%` 
                      }}
                    ></div>
                  </div>
                </div>
                
                {/* Quorum Progress */}
                <div className="mt-6">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-300">Quorum Progress</span>
                    <span className="text-white">
                      {proposalDetail.statistics.quorumPercentage.toFixed(2)}% / {proposalDetail.proposal.quorum}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2.5">
                    <div 
                      className={`h-2.5 rounded-full ${
                        proposalDetail.statistics.quorumReached ? 'bg-blue-500' : 'bg-yellow-500'
                      }`}
                      style={{ 
                        width: `${Math.min(
                          (proposalDetail.statistics.quorumPercentage / proposalDetail.proposal.quorum) * 100, 
                          100
                        )}%` 
                      }}
                    ></div>
                  </div>
                  
                  <div className="mt-2 text-sm">
                    {proposalDetail.statistics.quorumReached ? (
                      <span className="text-blue-400">Quorum reached</span>
                    ) : (
                      <span className="text-yellow-400">
                        {proposalDetail.proposal.status === 'active' 
                          ? 'Quorum not yet reached' 
                          : 'Quorum not reached, proposal failed'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Votes */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <h2 className="text-xl font-semibold text-white mb-4">Recent Votes</h2>
              
              {proposalDetail.votes.length === 0 ? (
                <p className="text-gray-400 text-center py-4">No votes have been cast yet.</p>
              ) : (
                <div className="space-y-3">
                  {proposalDetail.votes.slice(0, 10).map((vote) => (
                    <div key={vote.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`p-1.5 rounded-full ${
                          vote.vote === 'yes' ? 'bg-green-500/20' : 
                          vote.vote === 'no' ? 'bg-red-500/20' : 
                          'bg-gray-500/20'
                        }`}>
                          {vote.vote === 'yes' && <ThumbsUp className="w-4 h-4 text-green-400" />}
                          {vote.vote === 'no' && <ThumbsDown className="w-4 h-4 text-red-400" />}
                          {vote.vote === 'abstain' && <AlertCircle className="w-4 h-4 text-gray-400" />}
                        </div>
                        
                        <div>
                          <div className="text-white font-medium">
                            {vote.voter_address.slice(0, 6)}...{vote.voter_address.slice(-4)}
                          </div>
                          <div className="text-gray-400 text-xs">
                            {new Date(vote.created_at).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-white font-medium">
                          {parseFloat(vote.vote_weight).toLocaleString()} votes
                        </div>
                        <div className="text-gray-400 text-xs capitalize">
                          Voted {vote.vote}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {proposalDetail.votes.length > 10 && (
                    <div className="text-center mt-4">
                      <span className="text-blue-400 text-sm">
                        + {proposalDetail.votes.length - 10} more votes
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Proposal Info */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4">Proposal Info</h3>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <User className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <div className="text-sm text-gray-300">Created by</div>
                    <div className="text-white font-medium">
                      {proposalDetail.proposal.creator_address.slice(0, 6)}...{proposalDetail.proposal.creator_address.slice(-4)}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <div className="text-sm text-gray-300">Created on</div>
                    <div className="text-white">
                      {formatDate(proposalDetail.proposal.created_at)}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <div className="text-sm text-gray-300">Voting Period</div>
                    <div className="text-white">
                      {formatDate(proposalDetail.proposal.start_time)} - {formatDate(proposalDetail.proposal.end_time)}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <Percent className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <div className="text-sm text-gray-300">Quorum Required</div>
                    <div className="text-white">
                      {proposalDetail.proposal.quorum}% of total supply
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Cast Vote */}
            {proposalDetail.proposal.status === 'active' && isConnected && (
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4">Cast Your Vote</h3>
                
                {hasVoted ? (
                  <div className="p-4 bg-blue-500/20 border border-blue-500/50 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="w-5 h-5 text-blue-400 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-blue-400 mb-1">You've Voted</h4>
                        <p className="text-blue-300 text-sm">
                          You've already cast your vote: <span className="capitalize font-medium">{userVote}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {error && (
                      <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
                        <div className="flex items-start space-x-3">
                          <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5" />
                          <p className="text-red-400 text-sm">{error}</p>
                        </div>
                      </div>
                    )}
                    
                    {voteSuccess && (
                      <div className="p-4 bg-green-500/20 border border-green-500/50 rounded-lg">
                        <div className="flex items-start space-x-3">
                          <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                          <p className="text-green-400 text-sm">{voteSuccess}</p>
                        </div>
                      </div>
                    )}
                    
                    <button
                      onClick={() => handleVote('yes')}
                      disabled={isVoting}
                      className="w-full py-3 px-4 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
                    >
                      <ThumbsUp className="w-4 h-4" />
                      <span>Vote Yes</span>
                    </button>
                    
                    <button
                      onClick={() => handleVote('no')}
                      disabled={isVoting}
                      className="w-full py-3 px-4 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
                    >
                      <ThumbsDown className="w-4 h-4" />
                      <span>Vote No</span>
                    </button>
                    
                    <button
                      onClick={() => handleVote('abstain')}
                      disabled={isVoting}
                      className="w-full py-3 px-4 bg-gray-500/20 text-gray-400 rounded-lg hover:bg-gray-500/30 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
                    >
                      <AlertCircle className="w-4 h-4" />
                      <span>Abstain</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};