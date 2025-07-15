import React, { useState, useEffect } from 'react';
import { 
  Image, 
  Link, 
  Twitter, 
  MessageCircle, 
  Github, 
  FileText, 
  Tag, 
  AlertTriangle, 
  CheckCircle, 
  Loader2, 
  X, 
  Plus,
  Upload
} from 'lucide-react';
import { useWallet } from '../hooks/useWallet';

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
  updatedAt?: string;
}

interface TokenMetadataFormProps {
  tokenAddress: string;
  tokenName: string;
  tokenSymbol: string;
  isOwner: boolean;
  onMetadataUpdate?: (metadata: TokenMetadata) => void;
}

export const TokenMetadataForm: React.FC<TokenMetadataFormProps> = ({
  tokenAddress,
  tokenName,
  tokenSymbol,
  isOwner,
  onMetadataUpdate
}) => {
  const { address } = useWallet();
  const [metadata, setMetadata] = useState<TokenMetadata>({
    tokenAddress,
    name: tokenName,
    symbol: tokenSymbol,
    description: '',
    logoUrl: '',
    websiteUrl: '',
    twitterUrl: '',
    telegramUrl: '',
    discordUrl: '',
    githubUrl: '',
    whitePaperUrl: '',
    tags: []
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [newTag, setNewTag] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // Available tag options
  const availableTags = [
    'DeFi', 'Gaming', 'Meme', 'Utility', 'NFT', 'Metaverse', 'Social', 
    'DAO', 'Governance', 'Privacy', 'Infrastructure', 'Exchange', 'Stablecoin'
  ];

  // Load metadata on component mount
  useEffect(() => {
    loadMetadata();
  }, [tokenAddress]);

  const loadMetadata = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/token-metadata/${tokenAddress}`);
      
      if (response.ok) {
        const data = await response.json();
        setMetadata(data);
        
        if (data.logoUrl) {
          setLogoPreview(data.logoUrl);
        }
      } else if (response.status !== 404) {
        // Only show error if it's not a 404 (token without metadata)
        const errorData = await response.json();
        setError(errorData.error || 'Failed to load token metadata');
      }
    } catch (error) {
      console.error('Error loading token metadata:', error);
      setError('Failed to load token metadata. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setMetadata(prev => ({ ...prev, [name]: value }));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validate file type
      if (!file.type.match(/image\/(jpeg|jpg|png|webp)/)) {
        setError('Invalid file type. Please upload a JPG, PNG, or WebP image.');
        return;
      }
      
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setError('File too large. Maximum size is 5MB.');
        return;
      }
      
      setLogoFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (event) => {
        setLogoPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddTag = () => {
    if (newTag && !metadata.tags.includes(newTag)) {
      setMetadata(prev => ({
        ...prev,
        tags: [...prev.tags, newTag]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setMetadata(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const handleSelectTag = (tag: string) => {
    if (!metadata.tags.includes(tag)) {
      setMetadata(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
    }
  };

  const handleSaveMetadata = async () => {
    if (!isOwner) return;
    
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Create form data
      const formData = new FormData();
      
      // Add metadata fields
      formData.append('description', metadata.description);
      formData.append('websiteUrl', metadata.websiteUrl);
      formData.append('twitterUrl', metadata.twitterUrl);
      formData.append('telegramUrl', metadata.telegramUrl);
      formData.append('discordUrl', metadata.discordUrl);
      formData.append('githubUrl', metadata.githubUrl);
      formData.append('whitePaperUrl', metadata.whitePaperUrl);
      formData.append('tags', JSON.stringify(metadata.tags));
      
      // Add logo if changed
      if (logoFile) {
        formData.append('logo', logoFile);
      }
      
      // Get auth token
      const authToken = localStorage.getItem('authToken');
      if (!authToken) {
        throw new Error('Authentication required');
      }
      
      // Send request
      const response = await fetch(`/api/token-metadata/${tokenAddress}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save metadata');
      }
      
      const updatedMetadata = await response.json();
      setMetadata(updatedMetadata);
      
      // Call onMetadataUpdate callback if provided
      if (onMetadataUpdate) {
        onMetadataUpdate(updatedMetadata);
      }
      
      setSuccess('Token metadata saved successfully!');
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving token metadata:', error);
      setError((error as Error).message || 'Failed to save metadata');
    } finally {
      setIsSaving(false);
    }
  };

  const validateUrl = (url: string) => {
    if (!url) return true;
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  };

  const isValidMetadata = () => {
    // Description length check
    if (metadata.description && metadata.description.length > 300) {
      return false;
    }
    
    // URL validations
    if (!validateUrl(metadata.websiteUrl)) return false;
    if (!validateUrl(metadata.twitterUrl)) return false;
    if (!validateUrl(metadata.telegramUrl)) return false;
    if (!validateUrl(metadata.discordUrl)) return false;
    if (!validateUrl(metadata.githubUrl)) return false;
    if (!validateUrl(metadata.whitePaperUrl)) return false;
    
    return true;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  // Read-only view for non-owners
  if (!isOwner && !isEditing) {
    return (
      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
        <h3 className="text-xl font-semibold text-white mb-6">Token Metadata</h3>
        
        {!metadata.description && !metadata.logoUrl && !metadata.websiteUrl ? (
          <div className="text-center py-8">
            <Image className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-white mb-2">Unbranded Token</h4>
            <p className="text-gray-300">
              This token has no metadata yet. Only the token owner can add metadata.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Logo and Basic Info */}
            <div className="flex items-center space-x-4">
              {metadata.logoUrl ? (
                <img 
                  src={metadata.logoUrl} 
                  alt={`${metadata.name} logo`} 
                  className="w-16 h-16 rounded-full object-cover border border-white/20"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                  <span className="text-white text-xl font-bold">
                    {metadata.symbol ? metadata.symbol.charAt(0) : '?'}
                  </span>
                </div>
              )}
              
              <div>
                <h4 className="text-lg font-semibold text-white">{metadata.name}</h4>
                <p className="text-gray-300">{metadata.symbol}</p>
              </div>
            </div>
            
            {/* Description */}
            {metadata.description && (
              <div>
                <h5 className="text-sm font-medium text-gray-300 mb-2">Description</h5>
                <p className="text-white">{metadata.description}</p>
              </div>
            )}
            
            {/* Tags */}
            {metadata.tags && metadata.tags.length > 0 && (
              <div>
                <h5 className="text-sm font-medium text-gray-300 mb-2">Tags</h5>
                <div className="flex flex-wrap gap-2">
                  {metadata.tags.map(tag => (
                    <span 
                      key={tag} 
                      className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {/* Links */}
            <div>
              <h5 className="text-sm font-medium text-gray-300 mb-2">Links</h5>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {metadata.websiteUrl && (
                  <a 
                    href={metadata.websiteUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 text-blue-400 hover:text-blue-300"
                  >
                    <Link className="w-4 h-4" />
                    <span>Website</span>
                  </a>
                )}
                
                {metadata.twitterUrl && (
                  <a 
                    href={metadata.twitterUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 text-blue-400 hover:text-blue-300"
                  >
                    <Twitter className="w-4 h-4" />
                    <span>Twitter</span>
                  </a>
                )}
                
                {metadata.telegramUrl && (
                  <a 
                    href={metadata.telegramUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 text-blue-400 hover:text-blue-300"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Telegram</span>
                  </a>
                )}
                
                {metadata.discordUrl && (
                  <a 
                    href={metadata.discordUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 text-blue-400 hover:text-blue-300"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Discord</span>
                  </a>
                )}
                
                {metadata.githubUrl && (
                  <a 
                    href={metadata.githubUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 text-blue-400 hover:text-blue-300"
                  >
                    <Github className="w-4 h-4" />
                    <span>GitHub</span>
                  </a>
                )}
                
                {metadata.whitePaperUrl && (
                  <a 
                    href={metadata.whitePaperUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 text-blue-400 hover:text-blue-300"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Whitepaper</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-white">
          {isEditing ? 'Edit Token Metadata' : 'Token Metadata'}
        </h3>
        
        {isOwner && !isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
          >
            Edit Metadata
          </button>
        )}
      </div>
      
      {!isEditing ? (
        // Read-only view
        <div className="space-y-6">
          {/* Logo and Basic Info */}
          <div className="flex items-center space-x-4">
            {metadata.logoUrl ? (
              <img 
                src={metadata.logoUrl} 
                alt={`${metadata.name} logo`} 
                className="w-16 h-16 rounded-full object-cover border border-white/20"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                <span className="text-white text-xl font-bold">
                  {metadata.symbol ? metadata.symbol.charAt(0) : '?'}
                </span>
              </div>
            )}
            
            <div>
              <h4 className="text-lg font-semibold text-white">{metadata.name}</h4>
              <p className="text-gray-300">{metadata.symbol}</p>
            </div>
          </div>
          
          {/* Description */}
          {metadata.description ? (
            <div>
              <h5 className="text-sm font-medium text-gray-300 mb-2">Description</h5>
              <p className="text-white">{metadata.description}</p>
            </div>
          ) : (
            <div className="p-4 bg-gray-500/20 rounded-lg">
              <p className="text-gray-400 text-center">No description provided</p>
            </div>
          )}
          
          {/* Tags */}
          <div>
            <h5 className="text-sm font-medium text-gray-300 mb-2">Tags</h5>
            {metadata.tags && metadata.tags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {metadata.tags.map(tag => (
                  <span 
                    key={tag} 
                    className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-gray-500/20 rounded-lg">
                <p className="text-gray-400 text-center">No tags added</p>
              </div>
            )}
          </div>
          
          {/* Links */}
          <div>
            <h5 className="text-sm font-medium text-gray-300 mb-2">Links</h5>
            {(metadata.websiteUrl || metadata.twitterUrl || metadata.telegramUrl || 
              metadata.discordUrl || metadata.githubUrl || metadata.whitePaperUrl) ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {metadata.websiteUrl && (
                  <a 
                    href={metadata.websiteUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 text-blue-400 hover:text-blue-300"
                  >
                    <Link className="w-4 h-4" />
                    <span>Website</span>
                  </a>
                )}
                
                {metadata.twitterUrl && (
                  <a 
                    href={metadata.twitterUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 text-blue-400 hover:text-blue-300"
                  >
                    <Twitter className="w-4 h-4" />
                    <span>Twitter</span>
                  </a>
                )}
                
                {metadata.telegramUrl && (
                  <a 
                    href={metadata.telegramUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 text-blue-400 hover:text-blue-300"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Telegram</span>
                  </a>
                )}
                
                {metadata.discordUrl && (
                  <a 
                    href={metadata.discordUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 text-blue-400 hover:text-blue-300"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Discord</span>
                  </a>
                )}
                
                {metadata.githubUrl && (
                  <a 
                    href={metadata.githubUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 text-blue-400 hover:text-blue-300"
                  >
                    <Github className="w-4 h-4" />
                    <span>GitHub</span>
                  </a>
                )}
                
                {metadata.whitePaperUrl && (
                  <a 
                    href={metadata.whitePaperUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 text-blue-400 hover:text-blue-300"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Whitepaper</span>
                  </a>
                )}
              </div>
            ) : (
              <div className="p-4 bg-gray-500/20 rounded-lg">
                <p className="text-gray-400 text-center">No links provided</p>
              </div>
            )}
          </div>
          
          {metadata.updatedAt && (
            <div className="text-right text-xs text-gray-400">
              Last updated: {new Date(metadata.updatedAt).toLocaleString()}
            </div>
          )}
        </div>
      ) : (
        // Edit form
        <div className="space-y-6">
          {/* Logo Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Token Logo
            </label>
            <div className="flex items-center space-x-4">
              {logoPreview ? (
                <div className="relative">
                  <img 
                    src={logoPreview} 
                    alt="Token logo preview" 
                    className="w-16 h-16 rounded-full object-cover border border-white/20"
                  />
                  <button
                    onClick={() => {
                      setLogoPreview(null);
                      setLogoFile(null);
                    }}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="w-16 h-16 rounded-full bg-white/10 border border-dashed border-white/30 flex items-center justify-center">
                  <Image className="w-6 h-6 text-gray-400" />
                </div>
              )}
              
              <div className="flex-1">
                <label className="block w-full px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors cursor-pointer text-center">
                  <Upload className="w-4 h-4 inline mr-2" />
                  <span>{logoPreview ? 'Change Logo' : 'Upload Logo'}</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                </label>
                <p className="text-xs text-gray-400 mt-1">
                  JPG, PNG or WebP, max 5MB
                </p>
              </div>
            </div>
          </div>
          
          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description (max 300 chars)
            </label>
            <textarea
              name="description"
              value={metadata.description}
              onChange={handleInputChange}
              maxLength={300}
              rows={3}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe your token and its purpose..."
            />
            <div className="text-right text-xs text-gray-400">
              {metadata.description.length}/300
            </div>
          </div>
          
          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Tags
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {metadata.tags.map(tag => (
                <div 
                  key={tag} 
                  className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs flex items-center space-x-1"
                >
                  <span>{tag}</span>
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-blue-400/20"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
            
            <div className="flex space-x-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Add a tag..."
              />
              <button
                onClick={handleAddTag}
                disabled={!newTag}
                className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            
            <div className="mt-3">
              <p className="text-sm text-gray-300 mb-2">Suggested tags:</p>
              <div className="flex flex-wrap gap-2">
                {availableTags.filter(tag => !metadata.tags.includes(tag)).map(tag => (
                  <button
                    key={tag}
                    onClick={() => handleSelectTag(tag)}
                    className="px-3 py-1 bg-white/10 text-gray-300 rounded-full text-xs hover:bg-white/20 transition-colors"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          {/* Links */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">Project Links</h4>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Link className="w-4 h-4 inline mr-2" />
                Website URL
              </label>
              <input
                type="url"
                name="websiteUrl"
                value={metadata.websiteUrl}
                onChange={handleInputChange}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://yourproject.com"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Twitter className="w-4 h-4 inline mr-2" />
                Twitter URL
              </label>
              <input
                type="url"
                name="twitterUrl"
                value={metadata.twitterUrl}
                onChange={handleInputChange}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://twitter.com/yourproject"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <MessageCircle className="w-4 h-4 inline mr-2" />
                Telegram URL
              </label>
              <input
                type="url"
                name="telegramUrl"
                value={metadata.telegramUrl}
                onChange={handleInputChange}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://t.me/yourproject"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <MessageCircle className="w-4 h-4 inline mr-2" />
                Discord URL
              </label>
              <input
                type="url"
                name="discordUrl"
                value={metadata.discordUrl}
                onChange={handleInputChange}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://discord.gg/yourproject"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Github className="w-4 h-4 inline mr-2" />
                GitHub URL
              </label>
              <input
                type="url"
                name="githubUrl"
                value={metadata.githubUrl}
                onChange={handleInputChange}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://github.com/yourproject"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <FileText className="w-4 h-4 inline mr-2" />
                Whitepaper URL
              </label>
              <input
                type="url"
                name="whitePaperUrl"
                value={metadata.whitePaperUrl}
                onChange={handleInputChange}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://yourproject.com/whitepaper.pdf"
              />
            </div>
          </div>
          
          {/* Preview */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <h4 className="text-lg font-semibold text-white mb-4">Preview</h4>
            
            <div className="flex items-center space-x-4 mb-4">
              {logoPreview ? (
                <img 
                  src={logoPreview} 
                  alt="Token logo preview" 
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
                <h5 className="text-white font-medium">{metadata.name}</h5>
                <p className="text-gray-300 text-sm">{metadata.symbol}</p>
              </div>
            </div>
            
            {metadata.description && (
              <p className="text-gray-300 text-sm mb-3 line-clamp-2">
                {metadata.description}
              </p>
            )}
            
            {metadata.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
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
          </div>
          
          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={() => setIsEditing(false)}
              className="px-6 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
            >
              Cancel
            </button>
            
            <button
              onClick={handleSaveMetadata}
              disabled={!isValidMetadata() || isSaving}
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Metadata</span>
              )}
            </button>
          </div>
          
          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5" />
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            </div>
          )}
          
          {/* Success Message */}
          {success && (
            <div className="p-4 bg-green-500/20 border border-green-500/50 rounded-lg">
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                <p className="text-green-400 text-sm">{success}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};