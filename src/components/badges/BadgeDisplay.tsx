import React from 'react';
import { CheckCircle, FileText, Shield, Info } from 'lucide-react';

export interface BadgeInfo {
  id: string;
  badge_type: 'kyc' | 'audit' | 'safu';
  status: 'approved' | 'pending' | 'revoked';
  document_url?: string;
  notes?: string;
  approved_at?: string;
}

interface BadgeDisplayProps {
  badges: BadgeInfo[];
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
}

export const BadgeDisplay: React.FC<BadgeDisplayProps> = ({ 
  badges, 
  size = 'md',
  showTooltip = true
}) => {
  if (!badges || badges.length === 0) return null;
  
  const approvedBadges = badges.filter(badge => badge.status === 'approved');
  if (approvedBadges.length === 0) return null;

  const getBadgeIcon = (type: string) => {
    switch (type) {
      case 'kyc':
        return <CheckCircle className={`${size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'}`} />;
      case 'audit':
        return <FileText className={`${size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'}`} />;
      case 'safu':
        return <Shield className={`${size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'}`} />;
      default:
        return <Info className={`${size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'}`} />;
    }
  };

  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'kyc':
        return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'audit':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
      case 'safu':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/50';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    }
  };

  const getBadgeLabel = (type: string) => {
    switch (type) {
      case 'kyc':
        return 'KYC Verified';
      case 'audit':
        return 'Audit Verified';
      case 'safu':
        return 'SAFU';
      default:
        return type;
    }
  };

  const getBadgeTooltip = (badge: BadgeInfo) => {
    const approvedDate = badge.approved_at 
      ? new Date(badge.approved_at).toLocaleDateString() 
      : 'Unknown date';
    
    switch (badge.badge_type) {
      case 'kyc':
        return `KYC Verified on ${approvedDate}. Team identity has been verified.`;
      case 'audit':
        return `Smart contract audited on ${approvedDate}. ${badge.notes || ''}`;
      case 'safu':
        return `SAFU: Team tokens are locked. Rug protection enabled. Verified on ${approvedDate}.`;
      default:
        return badge.notes || '';
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {approvedBadges.map((badge) => (
        <div 
          key={badge.id}
          className={`relative group ${size === 'sm' ? 'px-2 py-0.5' : size === 'lg' ? 'px-3 py-1.5' : 'px-2.5 py-1'} 
                     rounded-full border ${getBadgeColor(badge.badge_type)} 
                     flex items-center space-x-1 ${size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-sm' : 'text-xs'}`}
        >
          {getBadgeIcon(badge.badge_type)}
          <span>{getBadgeLabel(badge.badge_type)}</span>
          
          {/* Tooltip */}
          {showTooltip && (
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 p-2 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity z-10">
              {getBadgeTooltip(badge)}
              {badge.document_url && (
                <a 
                  href={badge.document_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block mt-1 text-blue-400 hover:text-blue-300"
                >
                  View Certificate
                </a>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};