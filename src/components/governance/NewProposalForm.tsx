import React, { useState } from 'react';
import { Calendar, Clock, Percent, AlertTriangle, Loader2, CheckCircle } from 'lucide-react';

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

interface NewProposalFormProps {
  tokenAddress: string;
  onProposalCreated: (proposal: Proposal) => void;
  onCancel: () => void;
}

export const NewProposalForm: React.FC<NewProposalFormProps> = ({ 
  tokenAddress, 
  onProposalCreated,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    votingPeriod: 3, // days
    quorum: 10, // percentage
    executionDelay: 1 // days
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'quorum' || name === 'votingPeriod' || name === 'executionDelay' 
        ? parseInt(value) 
        : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.description.trim()) {
      setError('Title and description are required');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const authToken = localStorage.getItem('authToken');
      if (!authToken) {
        throw new Error('Not authenticated');
      }
      
      // Calculate dates
      const now = new Date();
      const endTime = new Date(now);
      endTime.setDate(endTime.getDate() + formData.votingPeriod);
      
      const executionTime = new Date(endTime);
      executionTime.setDate(executionTime.getDate() + formData.executionDelay);
      
      const response = await fetch('/api/governance', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tokenAddress,
          title: formData.title,
          description: formData.description,
          startTime: now.toISOString(),
          endTime: endTime.toISOString(),
          quorum: formData.quorum,
          executionTime: executionTime.toISOString()
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create proposal');
      }
      
      const proposal = await response.json();
      onProposalCreated(proposal);
    } catch (error) {
      console.error('Error creating proposal:', error);
      setError((error as Error).message || 'Failed to create proposal');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
      <h2 className="text-xl font-semibold text-white mb-6">Create New Proposal</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5" />
              <p className="text-red-400">{error}</p>
            </div>
          </div>
        )}
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Proposal Title
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter a clear, descriptive title"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={6}
            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Provide a detailed description of your proposal..."
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <Clock className="w-4 h-4 inline mr-1" />
              Voting Period (days)
            </label>
            <select
              name="votingPeriod"
              value={formData.votingPeriod}
              onChange={handleChange}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={1}>1 day</option>
              <option value={3}>3 days</option>
              <option value={7}>7 days</option>
              <option value={14}>14 days</option>
              <option value={30}>30 days</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <Percent className="w-4 h-4 inline mr-1" />
              Quorum Percentage
            </label>
            <select
              name="quorum"
              value={formData.quorum}
              onChange={handleChange}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={1}>1%</option>
              <option value={5}>5%</option>
              <option value={10}>10%</option>
              <option value={20}>20%</option>
              <option value={33}>33%</option>
              <option value={51}>51%</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Execution Delay (days)
            </label>
            <select
              name="executionDelay"
              value={formData.executionDelay}
              onChange={handleChange}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={0}>No delay</option>
              <option value={1}>1 day</option>
              <option value={2}>2 days</option>
              <option value={7}>7 days</option>
            </select>
          </div>
        </div>
        
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
          >
            Cancel
          </button>
          
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Creating...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Create Proposal</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};