import React, { useState, useEffect } from 'react';
import { 
  CheckCircle,
  ArrowLeft,
  FileText, 
  Shield, 
  Trash2, 
  Upload, 
  Check, 
  X, 
  AlertTriangle, 
  Loader2,
  Search,
  Filter
} from 'lucide-react';
import { useWallet } from '../../hooks/useWallet';

interface Badge {
  id: string;
  token_address: string;
  token_name: string;
  token_symbol: string;
  badge_type: 'kyc' | 'audit' | 'safu';
  status: 'approved' | 'pending' | 'revoked';
  document_url?: string;
  notes?: string;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
}

export const BadgeManagementPanel: React.FC = () => {
  const { isConnected, address } = useWallet();
  const [badges, setBadges] = useState<Badge[]>([]);
  const [filteredBadges, setFilteredBadges] = useState<Badge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'pending' | 'revoked'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'kyc' | 'audit' | 'safu'>('all');
  
  // New badge form
  const [showNewBadgeForm, setShowNewBadgeForm] = useState(false);
  const [newBadge, setNewBadge] = useState({
    tokenAddress: '',
    badgeType: 'kyc' as 'kyc' | 'audit' | 'safu',
    notes: '',
    document: null as File | null
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (isConnected && localStorage.getItem('authToken')) {
      loadBadges();
    } else if (isConnected && !localStorage.getItem('authToken')) {
      setError('Authentication required. Please log in to access the badge management panel.');
      setIsLoading(false);
    }
  }, [isConnected]);

  useEffect(() => {
    filterBadges();
  }, [badges, searchTerm, statusFilter, typeFilter]);

  const loadBadges = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const authToken = localStorage.getItem('authToken');
      if (!authToken) {
        setError('Authentication required. Please log in to access the badge management panel.');
        setIsLoading(false);
        return;
      }
      
      const response = await fetch('/api/badges', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          setError('Authentication failed. Please log in again.');
        } else {
          setError('Failed to fetch badges');
        }
        setIsLoading(false);
        return;
      }
      
      const data = await response.json();
      setBadges(data);
    } catch (error) {
      console.error('Error loading badges:', error);
      setError('Failed to load badges. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const filterBadges = () => {
    let filtered = [...badges];
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(badge => 
        badge.token_name?.toLowerCase().includes(term) ||
        badge.token_symbol?.toLowerCase().includes(term) ||
        badge.token_address.toLowerCase().includes(term)
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(badge => badge.status === statusFilter);
    }
    
    // Apply type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(badge => badge.badge_type === typeFilter);
    }
    
    setFilteredBadges(filtered);
  };

  const handleCreateBadge = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newBadge.tokenAddress || !newBadge.badgeType) {
      setError('Token address and badge type are required');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    
    try {
      const authToken = localStorage.getItem('authToken');
      if (!authToken) {
        throw new Error('Not authenticated');
      }
      
      const formData = new FormData();
      formData.append('tokenAddress', newBadge.tokenAddress);
      formData.append('badgeType', newBadge.badgeType);
      
      if (newBadge.notes) {
        formData.append('notes', newBadge.notes);
      }
      
      if (newBadge.document) {
        formData.append('document', newBadge.document);
      }
      
      const response = await fetch('/api/badges', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create badge');
      }
      
      const data = await response.json();
      setBadges(prev => [data, ...prev]);
      setSuccess('Badge created successfully');
      
      // Reset form
      setNewBadge({
        tokenAddress: '',
        badgeType: 'kyc',
        notes: '',
        document: null
      });
      setShowNewBadgeForm(false);
    } catch (error) {
      console.error('Error creating badge:', error);
      setError((error as Error).message || 'Failed to create badge');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateBadgeStatus = async (badgeId: string, newStatus: 'approved' | 'pending' | 'revoked') => {
    try {
      const authToken = localStorage.getItem('authToken');
      if (!authToken) {
        throw new Error('Not authenticated');
      }
      
      const response = await fetch(`/api/badges/${badgeId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update badge');
      }
      
      const updatedBadge = await response.json();
      
      // Update badges list
      setBadges(prev => prev.map(badge => 
        badge.id === badgeId ? updatedBadge : badge
      ));
      
      setSuccess(`Badge status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating badge:', error);
      setError((error as Error).message || 'Failed to update badge');
    }
  };

  const handleDeleteBadge = async (badgeId: string) => {
    if (!confirm('Are you sure you want to delete this badge?')) {
      return;
    }
    
    try {
      const authToken = localStorage.getItem('authToken');
      if (!authToken) {
        throw new Error('Not authenticated');
      }
      
      const response = await fetch(`/api/badges/${badgeId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete badge');
      }
      
      // Remove badge from list
      setBadges(prev => prev.filter(badge => badge.id !== badgeId));
      setSuccess('Badge deleted successfully');
    } catch (error) {
      console.error('Error deleting badge:', error);
      setError((error as Error).message || 'Failed to delete badge');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setNewBadge(prev => ({
        ...prev,
        document: e.target.files![0]
      }));
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 text-center">
            <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Authentication Required</h3>
            <p className="text-gray-300">
              Please connect your wallet to access the badge management panel.
            </p>
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
          <h1 className="text-3xl font-bold text-white mb-2">Badge Management</h1>
          <p className="text-gray-300">Manage trust badges for token projects</p>
        </div>
        
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">Trust Badges</h2>
            <button
              onClick={() => setShowNewBadgeForm(!showNewBadgeForm)}
              className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
            >
              {showNewBadgeForm ? 'Cancel' : 'Add New Badge'}
            </button>
          </div>
        </div>

        {/* New Badge Form */}
        {showNewBadgeForm && (
          <div className="mb-8 p-6 bg-white/5 rounded-xl border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4">Create New Badge</h3>
            
            <form onSubmit={handleCreateBadge} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Token Address
                </label>
                <input
                  type="text"
                  value={newBadge.tokenAddress}
                  onChange={(e) => setNewBadge(prev => ({ ...prev, tokenAddress: e.target.value }))}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0x..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Badge Type
                </label>
                <select
                  value={newBadge.badgeType}
                  onChange={(e) => setNewBadge(prev => ({ ...prev, badgeType: e.target.value as any }))}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="kyc">KYC Verified</option>
                  <option value="audit">Audit Verified</option>
                  <option value="safu">SAFU (Team Locked)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Notes
                </label>
                <textarea
                  value={newBadge.notes}
                  onChange={(e) => setNewBadge(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Additional information about this badge..."
                  rows={3}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Supporting Document (PDF or Image)
                </label>
                <div className="flex items-center space-x-2">
                  <label className="flex-1 flex items-center justify-center px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 cursor-pointer">
                    <Upload className="w-4 h-4 mr-2" />
                    <span>{newBadge.document ? newBadge.document.name : 'Choose File'}</span>
                    <input
                      type="file"
                      onChange={handleFileChange}
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png"
                    />
                  </label>
                </div>
              </div>
              
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>Create Badge</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filters */}
        <div className="mb-6 p-4 bg-white/5 rounded-lg border border-white/10">
          <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Search by token name, symbol, or address..."
              />
            </div>
            
            <div className="flex space-x-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="revoked">Revoked</option>
              </select>
              
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Types</option>
                <option value="kyc">KYC</option>
                <option value="audit">Audit</option>
                <option value="safu">SAFU</option>
              </select>
            </div>
          </div>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5" />
              <p className="text-red-400">{error}</p>
            </div>
          </div>
        )}
        
        {success && (
          <div className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-lg">
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
              <p className="text-green-400">{success}</p>
            </div>
          </div>
        )}

        {/* Badges List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : filteredBadges.length === 0 ? (
          <div className="text-center py-12">
            <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Badges Found</h3>
            <p className="text-gray-300">Try adjusting your filters or add a new badge.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBadges.map((badge) => (
              <div key={badge.id} className="p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      {badge.badge_type === 'kyc' && <CheckCircle className="w-5 h-5 text-green-400" />}
                      {badge.badge_type === 'audit' && <FileText className="w-5 h-5 text-blue-400" />}
                      {badge.badge_type === 'safu' && <Shield className="w-5 h-5 text-purple-400" />}
                      
                      <span className="text-lg font-semibold text-white">
                        {badge.badge_type === 'kyc' && 'KYC Verified'}
                        {badge.badge_type === 'audit' && 'Audit Verified'}
                        {badge.badge_type === 'safu' && 'SAFU (Team Locked)'}
                      </span>
                      
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        badge.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                        badge.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {badge.status}
                      </span>
                    </div>
                    
                    <div className="text-gray-300 text-sm mb-2">
                      <span className="font-medium">{badge.token_name}</span> ({badge.token_symbol})
                    </div>
                    
                    <div className="text-gray-400 text-xs font-mono">
                      {badge.token_address}
                    </div>
                    
                    {badge.notes && (
                      <div className="mt-2 text-gray-300 text-sm">
                        {badge.notes}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {badge.status === 'pending' && (
                      <button
                        onClick={() => handleUpdateBadgeStatus(badge.id, 'approved')}
                        className="px-3 py-1.5 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors flex items-center space-x-1"
                      >
                        <Check className="w-4 h-4" />
                        <span>Approve</span>
                      </button>
                    )}

                    {badge.status === 'approved' && (
                      <button
                        onClick={() => handleUpdateBadgeStatus(badge.id, 'revoked')}
                        className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors flex items-center space-x-1"
                      >
                        <X className="w-4 h-4" />
                        <span>Revoke</span>
                      </button>
                    )}

                    {badge.status === 'revoked' && (
                      <button
                        onClick={() => handleUpdateBadgeStatus(badge.id, 'approved')}
                        className="px-3 py-1.5 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors flex items-center space-x-1"
                      >
                        <Check className="w-4 h-4" />
                        <span>Restore</span>
                      </button>
                    )}

                    {badge.document_url && (
                      <a
                        href={badge.document_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors flex items-center space-x-1"
                      >
                        <FileText className="w-4 h-4" />
                        <span>View Document</span>
                      </a>
                    )}

                    <button
                      onClick={() => handleDeleteBadge(badge.id)}
                      className="px-3 py-1.5 bg-gray-500/20 text-gray-400 rounded-lg hover:bg-gray-500/30 transition-colors flex items-center space-x-1"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};