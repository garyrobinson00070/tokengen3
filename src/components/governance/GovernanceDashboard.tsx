import React, { useState, useEffect } from 'react';
import { 
  VoteIcon, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Plus, 
  Loader2,
  Calendar,
  Users,
  ArrowLeft
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWallet } from '../../hooks/useWallet';
import { ProposalCard } from './ProposalCard';
import { NewProposalForm } from './NewProposalForm';

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

export const GovernanceDashboard: React.FC = () => {
  const { tokenAddress } = useParams<{ tokenAddress: string }>();
  const navigate = useNavigate();
  const { isConnected, address } = useWallet();
  
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewProposalForm, setShowNewProposalForm] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [tokenInfo, setTokenInfo] = useState<{
    name: string;
    symbol: string;
    totalSupply: string;
    holders: number;
  } | null>(null);

  useEffect(() => {
    if (tokenAddress) {
      loadProposals();
      checkOwnership();
      loadTokenInfo();
    }
  }, [tokenAddress]);

  const loadProposals = async () => {
    if (!tokenAddress) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/governance/token/${tokenAddress}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch proposals');
      }
      
      const data = await response.json();
      setProposals(data);
    } catch (error) {
      console.error('Error loading proposals:', error);
      setError('Failed to load proposals. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const checkOwnership = async () => {
    if (!tokenAddress || !isConnected || !address) return;
    
    try {
      const response = await fetch(`/api/contracts/${tokenAddress}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch token details');
      }
      
      const data = await response.json();
      setIsOwner(data.owner.toLowerCase() === address.toLowerCase());
    } catch (error) {
      console.error('Error checking ownership:', error);
    }
  };

  const loadTokenInfo = async () => {
    if (!tokenAddress) return;
    
    try {
      const response = await fetch(`/api/contracts/${tokenAddress}/stats`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch token statistics');
      }
      
      const data = await response.json();
      setTokenInfo({
        name: data.name,
        symbol: data.symbol,
        totalSupply: data.totalSupply,
        holders: data.holders
      });
    } catch (error) {
      console.error('Error loading token info:', error);
    }
  };

  const handleProposalCreated = (newProposal: Proposal) => {
    setProposals(prev => [newProposal, ...prev]);
    setShowNewProposalForm(false);
  };

  const getStatusCounts = () => {
    return {
      active: proposals.filter(p => p.status === 'active').length,
      passed: proposals.filter(p => p.status === 'passed').length,
      rejected: proposals.filter(p => p.status === 'rejected').length,
      pending: proposals.filter(p => p.status === 'pending').length
    };
  };

  const statusCounts = getStatusCounts();

  if (!tokenAddress) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <AlertTriangle className="w-16 h-16 text-amber-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Invalid Token Address</h2>
            <p className="text-gray-300 mb-6">No token address provided for governance.</p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-colors"
            >
              Return to Home
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
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                {tokenInfo?.name || 'Token'} Governance
              </h1>
              <p className="text-gray-300">
                Proposal and voting system for {tokenInfo?.symbol || 'token'} holders
              </p>
            </div>
            
            {isOwner && (
              <button
                onClick={() => setShowNewProposalForm(!showNewProposalForm)}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-colors flex items-center space-x-2 whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>{showNewProposalForm ? 'Cancel' : 'Create Proposal'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Token Info */}
        {tokenInfo && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="flex items-center space-x-3">
                <VoteIcon className="w-8 h-8 text-blue-400" />
                <div>
                  <div className="text-2xl font-bold text-white">{proposals.length}</div>
                  <div className="text-sm text-gray-300">Total Proposals</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="flex items-center space-x-3">
                <Clock className="w-8 h-8 text-green-400" />
                <div>
                  <div className="text-2xl font-bold text-white">{statusCounts.active}</div>
                  <div className="text-sm text-gray-300">Active Votes</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="flex items-center space-x-3">
                <Users className="w-8 h-8 text-purple-400" />
                <div>
                  <div className="text-2xl font-bold text-white">{tokenInfo.holders}</div>
                  <div className="text-sm text-gray-300">Token Holders</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="flex items-center space-x-3">
                <Calendar className="w-8 h-8 text-orange-400" />
                <div>
                  <div className="text-2xl font-bold text-white">
                    {statusCounts.passed} / {statusCounts.rejected}
                  </div>
                  <div className="text-sm text-gray-300">Passed / Rejected</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* New Proposal Form */}
        {showNewProposalForm && (
          <div className="mb-8">
            <NewProposalForm 
              tokenAddress={tokenAddress} 
              onProposalCreated={handleProposalCreated}
              onCancel={() => setShowNewProposalForm(false)}
            />
          </div>
        )}

        {/* Proposals List */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-white">Proposals</h2>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
          ) : error ? (
            <div className="p-6 bg-red-500/20 border border-red-500/50 rounded-xl text-center">
              <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Error Loading Proposals</h3>
              <p className="text-red-300">{error}</p>
            </div>
          ) : proposals.length === 0 ? (
            <div className="p-12 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 text-center">
              <VoteIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Proposals Yet</h3>
              <p className="text-gray-300">
                {isOwner 
                  ? "Create the first proposal for token holders to vote on."
                  : "There are no governance proposals for this token yet."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {proposals.map((proposal) => (
                <ProposalCard 
                  key={proposal.id} 
                  proposal={proposal}
                  tokenAddress={tokenAddress}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};