import { AppError, ErrorType } from './errorHandler';

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

class TokenMetadataService {
  private apiUrl: string;

  constructor() {
    this.apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  }

  async getTokenMetadata(tokenAddress: string): Promise<TokenMetadata | null> {
    try {
      const response = await fetch(`${this.apiUrl}/api/token-metadata/${tokenAddress}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          // Token metadata not found, return null
          return null;
        }
        
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch token metadata');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching token metadata:', error);
      throw new AppError('Failed to fetch token metadata', ErrorType.SERVER, error);
    }
  }

  async saveTokenMetadata(
    tokenAddress: string,
    metadata: Partial<TokenMetadata>,
    logoFile?: File
  ): Promise<TokenMetadata> {
    try {
      // Get auth token
      const authToken = localStorage.getItem('authToken');
      if (!authToken) {
        throw new AppError('Authentication required', ErrorType.AUTHENTICATION);
      }
      
      // Create form data
      const formData = new FormData();
      
      // Add metadata fields
      if (metadata.description) formData.append('description', metadata.description);
      if (metadata.websiteUrl) formData.append('websiteUrl', metadata.websiteUrl);
      if (metadata.twitterUrl) formData.append('twitterUrl', metadata.twitterUrl);
      if (metadata.telegramUrl) formData.append('telegramUrl', metadata.telegramUrl);
      if (metadata.discordUrl) formData.append('discordUrl', metadata.discordUrl);
      if (metadata.githubUrl) formData.append('githubUrl', metadata.githubUrl);
      if (metadata.whitePaperUrl) formData.append('whitePaperUrl', metadata.whitePaperUrl);
      if (metadata.tags) formData.append('tags', JSON.stringify(metadata.tags));
      
      // Add logo if provided
      if (logoFile) {
        formData.append('logo', logoFile);
      }
      
      // Send request
      const response = await fetch(`${this.apiUrl}/api/token-metadata/${tokenAddress}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save token metadata');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error saving token metadata:', error);
      if (error instanceof AppError) {
        throw error;
      } else {
        throw new AppError(
          (error as Error).message || 'Failed to save token metadata',
          ErrorType.SERVER,
          error
        );
      }
    }
  }

  async getOpenSeaMetadata(tokenAddress: string): Promise<any> {
    try {
      const response = await fetch(`${this.apiUrl}/api/token-metadata/${tokenAddress}/opensea`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch OpenSea metadata');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching OpenSea metadata:', error);
      throw new AppError('Failed to fetch OpenSea metadata', ErrorType.SERVER, error);
    }
  }
}

export const tokenMetadataService = new TokenMetadataService();