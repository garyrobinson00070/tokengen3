import React from 'react';
import { Link, Twitter, MessageCircle, Github, FileText } from 'lucide-react';

interface TokenMetadata {
  tokenAddress: string;
  name: string;
  symbol: string;
  description: string;
  logoUrl: string;
  websiteUrl: string;
  twitterUrl: string;
  telegramUrl: string;
  discordUrl: string;
  githubUrl: string;
  whitePaperUrl: string;
  tags: string[];
}

interface TokenMetadataCardProps {
  metadata: TokenMetadata;
  compact?: boolean;
  onClick?: () => void;
}

export const TokenMetadataCard: React.FC<TokenMetadataCardProps> = ({
  metadata,
  compact = false,
  onClick
}) => {
  return (
    <div 
      className={`bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden transition-all duration-200 hover:border-white/20 ${
        onClick ? 'cursor-pointer' : ''
      } ${
        compact ? 'p-4' : 'p-6'
      }`}
      onClick={onClick}
    >
      <div className="flex items-center space-x-4 mb-4">
        {metadata.logoUrl ? (
          <img 
            src={metadata.logoUrl} 
            alt={`${metadata.name} logo`} 
            className={`rounded-full object-cover border border-white/20 ${
              compact ? 'w-10 h-10' : 'w-12 h-12'
            }`}
          />
        ) : (
          <div className={`rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center ${
            compact ? 'w-10 h-10' : 'w-12 h-12'
          }`}>
            <span className={`text-white font-bold ${
              compact ? 'text-base' : 'text-lg'
            }`}>
              {metadata.symbol ? metadata.symbol.charAt(0) : '?'}
            </span>
          </div>
        )}
        
        <div>
          <h3 className={`text-white font-medium ${
            compact ? 'text-base' : 'text-lg'
          }`}>
            {metadata.name}
          </h3>
          <p className="text-gray-300 text-sm">{metadata.symbol}</p>
        </div>
      </div>
      
      {metadata.description && !compact && (
        <p className="text-gray-300 text-sm mb-4 line-clamp-2">
          {metadata.description}
        </p>
      )}
      
      {metadata.tags && metadata.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-4">
          {metadata.tags.slice(0, compact ? 2 : 4).map(tag => (
            <span 
              key={tag} 
              className="px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded-full text-xs"
            >
              {tag}
            </span>
          ))}
          {metadata.tags.length > (compact ? 2 : 4) && (
            <span className="px-2 py-0.5 bg-gray-500/20 text-gray-300 rounded-full text-xs">
              +{metadata.tags.length - (compact ? 2 : 4)} more
            </span>
          )}
        </div>
      )}
      
      <div className="flex space-x-3">
        {metadata.websiteUrl && (
          <a 
            href={metadata.websiteUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="p-1.5 bg-white/10 rounded-full text-blue-400 hover:bg-white/20 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <Link className="w-3.5 h-3.5" />
          </a>
        )}
        
        {metadata.twitterUrl && (
          <a 
            href={metadata.twitterUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="p-1.5 bg-white/10 rounded-full text-blue-400 hover:bg-white/20 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <Twitter className="w-3.5 h-3.5" />
          </a>
        )}
        
        {metadata.telegramUrl && (
          <a 
            href={metadata.telegramUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="p-1.5 bg-white/10 rounded-full text-blue-400 hover:bg-white/20 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <MessageCircle className="w-3.5 h-3.5" />
          </a>
        )}
        
        {metadata.discordUrl && !compact && (
          <a 
            href={metadata.discordUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="p-1.5 bg-white/10 rounded-full text-blue-400 hover:bg-white/20 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <MessageCircle className="w-3.5 h-3.5" />
          </a>
        )}
        
        {metadata.githubUrl && !compact && (
          <a 
            href={metadata.githubUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="p-1.5 bg-white/10 rounded-full text-blue-400 hover:bg-white/20 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <Github className="w-3.5 h-3.5" />
          </a>
        )}
        
        {metadata.whitePaperUrl && !compact && (
          <a 
            href={metadata.whitePaperUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="p-1.5 bg-white/10 rounded-full text-blue-400 hover:bg-white/20 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <FileText className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
    </div>
  );
};