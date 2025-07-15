import React from 'react';
import { Link, Twitter, MessageCircle, Github, FileText } from 'lucide-react';

interface TokenMetadata {
  name: string;
  symbol: string;
  description: string;
  logoUrl: string | null;
  websiteUrl: string;
  twitterUrl: string;
  telegramUrl: string;
  discordUrl: string;
  githubUrl: string;
  whitePaperUrl: string;
  tags: string[];
}

interface TokenMetadataPreviewProps {
  metadata: TokenMetadata;
  previewType: 'launchpad' | 'explorer' | 'dex';
}

export const TokenMetadataPreview: React.FC<TokenMetadataPreviewProps> = ({
  metadata,
  previewType
}) => {
  const renderLaunchpadPreview = () => (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 max-w-md">
      <div className="flex items-center space-x-4 mb-4">
        {metadata.logoUrl ? (
          <img 
            src={metadata.logoUrl} 
            alt={`${metadata.name} logo`} 
            className="w-12 h-12 rounded-full object-cover border border-white/20"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
            <span className="text-white text-lg font-bold">
              {metadata.symbol ? metadata.symbol.charAt(0) : '?'}
            </span>
          </div>
        )}
        
        <div>
          <h3 className="text-lg font-medium text-white">{metadata.name}</h3>
          <p className="text-gray-300 text-sm">{metadata.symbol}</p>
        </div>
      </div>
      
      {metadata.description && (
        <p className="text-gray-300 text-sm mb-4 line-clamp-2">
          {metadata.description}
        </p>
      )}
      
      {metadata.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-4">
          {metadata.tags.slice(0, 3).map(tag => (
            <span 
              key={tag} 
              className="px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded-full text-xs"
            >
              {tag}
            </span>
          ))}
          {metadata.tags.length > 3 && (
            <span className="px-2 py-0.5 bg-gray-500/20 text-gray-300 rounded-full text-xs">
              +{metadata.tags.length - 3} more
            </span>
          )}
        </div>
      )}
      
      <div className="flex space-x-3">
        {metadata.websiteUrl && (
          <Link className="w-4 h-4 text-blue-400" />
        )}
        {metadata.twitterUrl && (
          <Twitter className="w-4 h-4 text-blue-400" />
        )}
        {metadata.telegramUrl && (
          <MessageCircle className="w-4 h-4 text-blue-400" />
        )}
        {metadata.githubUrl && (
          <Github className="w-4 h-4 text-blue-400" />
        )}
      </div>
      
      <div className="mt-4 pt-4 border-t border-white/10">
        <div className="flex justify-between">
          <span className="text-gray-300">Price:</span>
          <span className="text-white">$0.05</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-300">Raised:</span>
          <span className="text-white">$50,000 / $100,000</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
          <div 
            className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full"
            style={{ width: '50%' }}
          ></div>
        </div>
      </div>
    </div>
  );

  const renderExplorerPreview = () => (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 max-w-md">
      <div className="flex items-center space-x-4 mb-6">
        {metadata.logoUrl ? (
          <img 
            src={metadata.logoUrl} 
            alt={`${metadata.name} logo`} 
            className="w-16 h-16 rounded-full object-cover border border-white/20"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
            <span className="text-white text-2xl font-bold">
              {metadata.symbol ? metadata.symbol.charAt(0) : '?'}
            </span>
          </div>
        )}
        
        <div>
          <h3 className="text-xl font-semibold text-white">{metadata.name}</h3>
          <p className="text-gray-300">{metadata.symbol}</p>
          
          {metadata.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {metadata.tags.slice(0, 3).map(tag => (
                <span 
                  key={tag} 
                  className="px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded-full text-xs"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {metadata.description && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-300 mb-2">About</h4>
          <p className="text-white text-sm">{metadata.description}</p>
        </div>
      )}
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white/5 rounded-lg p-3">
          <div className="text-sm text-gray-300">Price</div>
          <div className="text-lg font-bold text-white">$0.05</div>
        </div>
        <div className="bg-white/5 rounded-lg p-3">
          <div className="text-sm text-gray-300">Market Cap</div>
          <div className="text-lg font-bold text-white">$500,000</div>
        </div>
        <div className="bg-white/5 rounded-lg p-3">
          <div className="text-sm text-gray-300">Holders</div>
          <div className="text-lg font-bold text-white">1,250</div>
        </div>
        <div className="bg-white/5 rounded-lg p-3">
          <div className="text-sm text-gray-300">Transfers</div>
          <div className="text-lg font-bold text-white">3,721</div>
        </div>
      </div>
      
      <div>
        <h4 className="text-sm font-medium text-gray-300 mb-3">Links</h4>
        <div className="grid grid-cols-2 gap-3">
          {metadata.websiteUrl && (
            <a 
              href="#"
              className="flex items-center space-x-2 text-blue-400"
            >
              <Link className="w-4 h-4" />
              <span>Website</span>
            </a>
          )}
          
          {metadata.twitterUrl && (
            <a 
              href="#"
              className="flex items-center space-x-2 text-blue-400"
            >
              <Twitter className="w-4 h-4" />
              <span>Twitter</span>
            </a>
          )}
          
          {metadata.telegramUrl && (
            <a 
              href="#"
              className="flex items-center space-x-2 text-blue-400"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Telegram</span>
            </a>
          )}
          
          {metadata.discordUrl && (
            <a 
              href="#"
              className="flex items-center space-x-2 text-blue-400"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Discord</span>
            </a>
          )}
          
          {metadata.githubUrl && (
            <a 
              href="#"
              className="flex items-center space-x-2 text-blue-400"
            >
              <Github className="w-4 h-4" />
              <span>GitHub</span>
            </a>
          )}
          
          {metadata.whitePaperUrl && (
            <a 
              href="#"
              className="flex items-center space-x-2 text-blue-400"
            >
              <FileText className="w-4 h-4" />
              <span>Whitepaper</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );

  const renderDexPreview = () => (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 max-w-md">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          {metadata.logoUrl ? (
            <img 
              src={metadata.logoUrl} 
              alt={`${metadata.name} logo`} 
              className="w-10 h-10 rounded-full object-cover border border-white/20"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-white text-base font-bold">
                {metadata.symbol ? metadata.symbol.charAt(0) : '?'}
              </span>
            </div>
          )}
          
          <div>
            <h3 className="text-white font-medium">{metadata.name}</h3>
            <p className="text-gray-300 text-sm">{metadata.symbol}</p>
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-white font-medium">$0.05</div>
          <div className="text-xs text-green-400">+5.2%</div>
        </div>
      </div>
      
      <div className="bg-white/5 rounded-lg p-4 mb-4">
        <div className="flex justify-between mb-1">
          <span className="text-gray-300 text-sm">You pay</span>
          <span className="text-gray-300 text-sm">Balance: 1.5 ETH</span>
        </div>
        <div className="flex justify-between items-center">
          <input
            type="text"
            value="0.1"
            readOnly
            className="bg-transparent text-white text-xl font-medium focus:outline-none w-24"
          />
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center">
              <span className="text-white text-xs">Ξ</span>
            </div>
            <span className="text-white">ETH</span>
          </div>
        </div>
      </div>
      
      <div className="bg-white/5 rounded-lg p-4 mb-6">
        <div className="flex justify-between mb-1">
          <span className="text-gray-300 text-sm">You receive</span>
          <span className="text-gray-300 text-sm">Balance: 0 {metadata.symbol}</span>
        </div>
        <div className="flex justify-between items-center">
          <input
            type="text"
            value="2,000"
            readOnly
            className="bg-transparent text-white text-xl font-medium focus:outline-none w-24"
          />
          <div className="flex items-center space-x-2">
            {metadata.logoUrl ? (
              <img 
                src={metadata.logoUrl} 
                alt={metadata.symbol} 
                className="w-6 h-6 rounded-full"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                <span className="text-white text-xs font-bold">
                  {metadata.symbol.charAt(0)}
                </span>
              </div>
            )}
            <span className="text-white">{metadata.symbol}</span>
          </div>
        </div>
      </div>
      
      <button className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-lg font-medium">
        Swap
      </button>
      
      {metadata.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-4 justify-center">
          {metadata.tags.slice(0, 3).map(tag => (
            <span 
              key={tag} 
              className="px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded-full text-xs"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );

  switch (previewType) {
    case 'launchpad':
      return renderLaunchpadPreview();
    case 'explorer':
      return renderExplorerPreview();
    case 'dex':
      return renderDexPreview();
    default:
      return renderExplorerPreview();
  }
};