import { TokenConfig, Network, VestingConfig } from '../types';
import { PresaleConfig } from '../types/presale';
import { AppError, ErrorType, reportError } from './errorHandler';
import { web3Service } from './web3Service';
import { fallbackDeploymentService } from './fallbackDeploymentService';
import { MODE_STORAGE_KEY, DEFAULT_MODE } from '../config/constants';

export interface DeploymentResult {
  contractAddress: string;
  transactionHash: string;
  network: Network;
  explorerUrl: string;
  gasUsed: string;
  deploymentCost: string;
}

export class ContractService {
  private apiUrl: string;
  private authToken: string | null = null;
  private deploymentMethod: 'primary' | 'fallback' | 'emergency' = 'primary';
  private isTestnetMode: boolean = false;

  constructor() {
    this.apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    
    // Initialize with the current network mode
    this.isTestnetMode = localStorage.getItem(MODE_STORAGE_KEY) === 'testnet';
  }
  
  // Track current network mode
  private isTestnetMode: boolean = false;

  async authenticate(address: string, signature: string, message: string): Promise<string> {
    try {
      const response = await fetch(`${this.apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address, signature, message }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Authentication failed');
      }

      const data = await response.json();
      this.authToken = data.token;
      localStorage.setItem('authToken', data.token);
      return data.token;
    } catch (error) {
      console.error('Authentication error:', error);
      throw new AppError('Authentication failed', ErrorType.AUTHENTICATION, error);
    }
  }

  async getAuthMessage(address: string): Promise<string> {
    try {
      const response = await fetch(`${this.apiUrl}/api/auth/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get auth message');
      }

      const data = await response.json();
      return data.message;
    } catch (error) {
      console.error('Get auth message error:', error);
      throw new AppError('Failed to get authentication message', ErrorType.SERVER, error);
    }
  }

  private getAuthHeaders(): Record<string, string> {
    const token = this.authToken || localStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
  }

  private getContractType(config: TokenConfig): string {
    const features = config.features;
    
    if (features.burnable && features.mintable && features.transferFees.enabled && features.holderRedistribution.enabled) {
      return 'AdvancedToken';
    } else if (features.burnable && features.mintable && features.transferFees.enabled) {
      return 'BurnableMintableFeeToken';
    } else if (features.burnable && features.mintable && features.holderRedistribution.enabled) {
      return 'BurnableMintableRedistributionToken';
    } else if (features.burnable && features.mintable) {
      return 'BurnableMintableToken';
    } else if (features.burnable) {
      return 'BurnableToken';
    } else if (features.mintable) {
      return 'MintableToken';
    } else if (features.transferFees.enabled) {
      return 'FeeToken';
    } else if (features.holderRedistribution.enabled) {
      return 'RedistributionToken';
    } else {
      return 'BasicToken';
    }
  }

  private getConstructorParams(config: TokenConfig): any[] {
    const contractType = this.getContractType(config);
    const baseParams = [
      config.name,
      config.symbol,
      config.decimals,
      config.initialSupply,
      config.maxSupply || '0',
    ];

    switch (contractType) {
      case 'FeeToken':
        return [
          ...baseParams,
          Math.floor(config.features.transferFees.percentage * 100),
          config.features.transferFees.recipient,
          'DEPLOYER_ADDRESS' // Will be replaced by backend
        ];
      case 'RedistributionToken':
        return [
          ...baseParams,
          Math.floor(config.features.holderRedistribution.percentage * 100),
          'DEPLOYER_ADDRESS'
        ];
      case 'AdvancedToken':
        return [
          ...baseParams,
          Math.floor(config.features.transferFees.percentage * 100),
          config.features.transferFees.recipient,
          Math.floor(config.features.holderRedistribution.percentage * 100),
          'DEPLOYER_ADDRESS'
        ];
      default:
        return [...baseParams, 'DEPLOYER_ADDRESS'];
    }
  }

  async estimateDeploymentCost(config: TokenConfig): Promise<{
    gasEstimate: string;
    gasCost: string;
    gasCostUsd: string;
    timeEstimate: string;
    useFactory: boolean;
  }> {
    try {
      const contractType = this.getContractType(config);
      const constructorParams = this.getConstructorParams(config);
      
      // Get gas estimate from backend API
      const response = await fetch(`${this.apiUrl}/api/deploy/estimate`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          contractType,
          constructorArgs: constructorParams,
          network: config.network.id
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get gas estimate from backend');
      }

      const estimate = await response.json();
      
      // Determine if factory should be used (cheaper for standard tokens)
      const useFactory = ['BasicToken', 'BurnableToken', 'MintableToken', 'BurnableMintableToken'].includes(contractType);
      
      return {
        gasEstimate: estimate.gasEstimate || '0',
        gasCost: estimate.gasCost || '0.0',
        gasCostUsd: estimate.gasCostUsd,
        timeEstimate: estimate.timeEstimate,
        useFactory: estimate.useFactory || useFactory
      };
    } catch (error) {
      console.error('Error estimating deployment cost:', error);
      reportError(new AppError('Failed to estimate deployment cost', ErrorType.CONTRACT, error));
      
      // Return fallback estimates
      return {
        gasEstimate: '0',
        gasCost: '0.0',
        gasCostUsd: '$0.00',
        timeEstimate: '1-3 minutes',
        useFactory: false
      };
    }
  }

  async deployToken(config: TokenConfig): Promise<DeploymentResult> {
    this.deploymentMethod = 'primary';
    try {
      const contractType = this.getContractType(config);
      const constructorParams = this.getConstructorParams(config);
      const useFactory = config.useFactory !== undefined ? 
        config.useFactory : 
        ['BasicToken', 'BurnableToken', 'MintableToken', 'BurnableMintableToken'].includes(contractType);
      
      // Check if we're on the correct network
      const currentNetwork = await web3Service.getCurrentNetwork();
      if (currentNetwork?.chainId !== config.network.chainId) {
        try {
          await web3Service.switchNetwork(config.network);
        } catch (error) {
          throw new AppError(
            `Please switch to ${config.network.name} network before deploying`,
            ErrorType.NETWORK,
            error
          );
        }
      }

      // Check if user has enough ESR tokens for mainnet deployment
      if (!config.network.id.includes('testnet') && !config.network.id.includes('goerli') && !config.network.id.includes('sepolia')) {
        try {
          const esrBalance = await this.checkESRBalance(await web3Service.getSigner()?.getAddress() || '');
          const requiredBalance = 100; // 100 ESR tokens required
          
          if (esrBalance < requiredBalance) {
            throw new AppError(
              `Insufficient ESR tokens. Required: ${requiredBalance}, Available: ${esrBalance.toFixed(2)}`,
              ErrorType.VALIDATION
            );
          }
          
          // Deduct ESR tokens
          await this.deductESRTokens(requiredBalance);
        } catch (balanceError) {
          if (balanceError instanceof AppError) {
            throw balanceError;
          } else {
            throw new AppError('Failed to check or deduct ESR tokens', ErrorType.VALIDATION, balanceError);
          }
        }
      }

      const response = await fetch(`${this.apiUrl}/api/deploy/token`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          contractType,
          constructorArgs: constructorParams,
          network: config.network.id,
          verify: true,
          useFactory
        }),
      });

      if (!response.ok) {
        let errorMessage = 'Deployment failed';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.details || 'Deployment failed';
        } catch (e) {
          // If we can't parse the JSON, use the status text
          errorMessage = `Deployment failed: ${response.status} ${response.statusText}`;
        }
        throw new AppError(errorMessage, ErrorType.SERVER);
      }

      const result = await response.json();

      return {
        deploymentMethod: this.deploymentMethod,
        contractAddress: result.contractAddress,
        transactionHash: result.transactionHash,
        network: config.network,
        explorerUrl: `${config.network.explorerUrl}/token/${result.contractAddress}`,
        gasUsed: result.gasUsed,
        deploymentCost: result.deploymentCost
      };
    } catch (error) {
      console.error('Primary deployment failed, trying fallback:', error);
      
      // Try frontend fallback
      try {
        this.deploymentMethod = 'fallback';
        console.log('Attempting frontend fallback deployment...');
        
        const result = await fallbackDeploymentService.deployContract(config);
        
        return {
          deploymentMethod: this.deploymentMethod,
          contractAddress: result.contractAddress,
          transactionHash: result.transactionHash,
          network: config.network,
          explorerUrl: result.explorerUrl,
          gasUsed: result.gasUsed,
          deploymentCost: result.deploymentCost
        };
      } catch (fallbackError) {
        console.error('Frontend fallback deployment failed, trying emergency backend:', fallbackError);
        
        // Try emergency backend deployment
        try {
          this.deploymentMethod = 'emergency';
          console.log('Attempting emergency backend deployment...');
          
          const authToken = this.authToken || localStorage.getItem('authToken');
          if (!authToken) {
            throw new Error('Authentication required for emergency deployment');
          }
          
          const response = await fetch(`${this.apiUrl}/api/emergency-deploy/token`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
              contractType: this.getContractType(config),
              constructorArgs: this.getConstructorParams(config),
              network: config.network.id
            })
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || errorData.details || 'Emergency deployment failed');
          }
          
          const result = await response.json();
          
          return {
            deploymentMethod: this.deploymentMethod,
            contractAddress: result.contractAddress,
            transactionHash: result.transactionHash,
            network: config.network,
            explorerUrl: `${config.network.explorerUrl}/token/${result.contractAddress}`,
            gasUsed: result.gasUsed,
            deploymentCost: result.deploymentCost
          };
        } catch (emergencyError) {
          console.error('All deployment methods failed:', emergencyError);
          
          // All methods failed, throw comprehensive error
          throw new AppError(
            'All deployment methods failed. Please try again later.',
            ErrorType.CONTRACT,
            {
              primaryError: error,
              fallbackError,
              emergencyError
            }
          );
        }
      }
    }
  }
  
  /**
   * Get the current deployment method
   */
  public getDeploymentMethod(): 'primary' | 'fallback' | 'emergency' {
    return this.deploymentMethod;
  }

  async deployPresale(config: PresaleConfig): Promise<DeploymentResult> {
    try {
      // Check if we're on the correct network
      const currentNetwork = await web3Service.getCurrentNetwork();
      if (currentNetwork?.chainId !== config.network.chainId) {
        try {
          await web3Service.switchNetwork(config.network);
        } catch (error) {
          throw new AppError(
            `Please switch to ${config.network.name} network before deploying`,
            ErrorType.NETWORK,
            error
          );
        }
      }
      
      // Check if user has enough ESR tokens for mainnet deployment
      if (!config.network.id.includes('testnet') && !config.network.id.includes('goerli') && !config.network.id.includes('sepolia')) {
        try {
          const esrBalance = await this.checkESRBalance(await web3Service.getSigner()?.getAddress() || '');
          const requiredBalance = 100; // 100 ESR tokens required
          
          if (esrBalance < requiredBalance) {
            throw new AppError(
              `Insufficient ESR tokens. Required: ${requiredBalance}, Available: ${esrBalance.toFixed(2)}`,
              ErrorType.VALIDATION
            );
          }
          
          // Deduct ESR tokens
          await this.deductESRTokens(requiredBalance);
        } catch (balanceError) {
          if (balanceError instanceof AppError) {
            throw balanceError;
          } else {
            throw new AppError('Failed to check or deduct ESR tokens', ErrorType.VALIDATION, balanceError);
          }
        }
      }
      
      const response = await fetch(`${this.apiUrl}/api/deploy/presale`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          presaleConfig: config,
          network: config.network.id,
          verify: true
        }),
      });

      if (!response.ok) {
        let errorMessage = 'Presale deployment failed';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.details || 'Presale deployment failed';
        } catch (e) {
          // If we can't parse the JSON, use the status text
          errorMessage = `Presale deployment failed: ${response.status} ${response.statusText}`;
        }
        throw new AppError(errorMessage, ErrorType.SERVER);
      }

      const result = await response.json();

      return {
        contractAddress: result.contractAddress,
        transactionHash: result.transactionHash,
        network: config.network,
        explorerUrl: `${config.network.explorerUrl}/address/${result.contractAddress}`,
        gasUsed: result.gasUsed,
        deploymentCost: result.deploymentCost,
        salePageUrl: result.salePageUrl
      };
    } catch (error) {
      console.error('Error deploying presale contract:', error);
      if (error instanceof AppError) {
        throw error;
      } else {
        throw new AppError(
          (error as Error).message || 'Presale deployment failed',
          ErrorType.UNKNOWN,
          error
        );
      }
    }
  }

  async getDeployedTokens(): Promise<any[]> {
    try {
      // Use the correct API URL with proper error handling
      const apiUrl = this.apiUrl;
      
      // Check if API URL is accessible
      try {
        const healthResponse = await fetch(`${apiUrl}/health`, { 
          method: 'HEAD',
          // Add cache control to prevent caching
          headers: { 'Cache-Control': 'no-cache' }
        });
        
        if (!healthResponse.ok) {
          throw new Error(`API health check failed with status: ${healthResponse.status}`);
        }
      } catch (error) {
        console.warn('API health check failed, using mock data:', error);
        // Return mock data if API is not accessible
        return this.getMockTokens();
      }
      
      const response = await fetch(`${apiUrl}/api/contracts/deployed`, {
        headers: this.getAuthHeaders(),
        // Prevent caching
        cache: 'no-store'
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Failed to fetch deployed contracts: ${response.status} ${response.statusText}`, errorText);
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Filter tokens based on current mode
      const tokens = data.tokens || [];
      return this.isTestnetMode ? tokens.filter((t: any) => t.network?.id?.includes('testnet')) : tokens.filter((t: any) => !t.network?.id?.includes('testnet'));
    } catch (error) {
      console.error('Error fetching deployed tokens:', error);
      // Return mock data if API request fails
      return this.getMockTokens();
    }
  }

  // Mock data for development/testing when API is unavailable
  private getMockTokens(): any[] {
    console.log('Using mock token data');
    const mockTokens = [
      {
        id: '1',
        name: 'Example Token',
        symbol: 'EXT',
        contractAddress: '0x1234567890123456789012345678901234567890',
        network: {
          id: this.isTestnetMode ? 'goerli' : 'ethereum',
          name: this.isTestnetMode ? 'Goerli' : 'Ethereum',
          chainId: this.isTestnetMode ? 5 : 1,
        },
        deploymentDate: new Date().toISOString(),
        totalSupply: '1000000',
        maxSupply: '10000000',
        decimals: 18,
        transactionHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        features: ['Burnable'],
        status: 'verified',
        holders: 1,
        transfers: 1
      }
    ];
    
    // Add more mock tokens for testing
    mockTokens.push({
      id: '2',
      name: 'ESTAR Token',
      symbol: 'ESR',
      contractAddress: '0x742d35cc6634c0532925a3b8d4c9db96590c6c8c',
      network: {
        id: this.isTestnetMode ? 'estar-testnet' : 'estar',
        name: this.isTestnetMode ? 'ESTAR Testnet' : 'ESTAR',
        chainId: 25062019,
      },
      deploymentDate: new Date().toISOString(),
      totalSupply: '100000000',
      maxSupply: '1000000000',
      decimals: 18,
      transactionHash: '0xdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      features: ['Burnable', 'Mintable'],
      status: 'verified',
      holders: 100,
      transfers: 250
    });
    
    return mockTokens;
  }

  async getDeployedPresales(): Promise<any[]> {
    try {
      // Use the correct API URL with proper error handling
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      // Check if API URL is accessible
      try {
        await fetch(`${apiUrl}/health`, { method: 'HEAD' });
      } catch (error) {
        console.warn('API health check failed, using mock data:', error);
        // Return mock data if API is not accessible
        return this.getMockPresales();
      }
      
      const response = await fetch(`${apiUrl}/api/contracts/deployed`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Failed to fetch deployed presales: ${response.status} ${response.statusText}`, errorText);
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Filter presales based on current mode
      const presales = data.presales || [];
      return this.isTestnetMode ? presales.filter((p: any) => p.network?.id?.includes('testnet')) : presales.filter((p: any) => !p.network?.id?.includes('testnet'));
    } catch (error) {
      console.error('Error fetching deployed presales:', error);
      // Return mock data if API request fails
      return this.getMockPresales();
    }
  }

  // Mock data for development/testing when API is unavailable
  private getMockPresales(): any[] {
    console.log('Using mock presale data');
    return [
      {
        id: '1',
        contractAddress: '0x1234567890123456789012345678901234567890',
        tokenAddress: '0x0987654321098765432109876543210987654321',
        tokenName: 'Example Token',
        tokenSymbol: 'EXT',
        saleName: 'Example Token Presale',
        saleType: 'presale',
        network: {
          id: this.isTestnetMode ? 'goerli' : 'ethereum',
          name: this.isTestnetMode ? 'Goerli' : 'Ethereum',
          chainId: this.isTestnetMode ? 5 : 1,
        },
        presaleConfig: {
          saleConfiguration: {
            startDate: new Date(Date.now() + 86400000).toISOString(),
            endDate: new Date(Date.now() + 14 * 86400000).toISOString(),
            softCap: '10',
            hardCap: '100',
            tokenPrice: '1000',
            minPurchase: '0.1',
            maxPurchase: '10',
            whitelistEnabled: false
          },
          vestingConfig: {
            enabled: true,
            duration: 30,
            initialRelease: 10
          }
        },
        status: 'upcoming',
        timestamp: new Date().toISOString()
      }
    ];
  }

  async getPublicPresales(): Promise<any[]> {
    try {
      // Use the correct API URL with proper error handling
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      // Check if API URL is accessible
      try {
        await fetch(`${apiUrl}/health`, { method: 'HEAD' });
      } catch (error) {
        console.warn('API health check failed, using mock data:', error);
        // Return mock data if API is not accessible
        return this.getMockPresales();
      }
      
      const response = await fetch(`${apiUrl}/api/contracts/presales/public`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Failed to fetch public presales: ${response.status} ${response.statusText}`, errorText);
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Filter presales based on current mode
      const presales = data || [];
      return this.isTestnetMode ? presales.filter((p: any) => p.network?.id?.includes('testnet')) : presales.filter((p: any) => !p.network?.id?.includes('testnet'));
    } catch (error) {
      console.error('Error fetching public presales:', error);
      // Return mock data if API request fails
      return this.getMockPresales();
    }
  }

  async checkESRBalance(address: string): Promise<number> {
    try {
      const response = await fetch(`${this.apiUrl}/api/auth/esr/balance/${address}`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new AppError(
          errorData.error || 'Failed to fetch ESR balance',
          ErrorType.SERVER,
          errorData
        );
      }

      const data = await response.json();
      return data.balance || 0;
    } catch (error) {
      console.error('Error fetching ESR balance:', error);
      if (error instanceof AppError) {
        throw error;
      } else {
        throw new AppError('Failed to check ESR balance', ErrorType.SERVER, error);
      }
    }
  }

  async deductESRTokens(amount: number = 100): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiUrl}/api/auth/esr/deduct`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ amount }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new AppError(
          errorData.error || 'Failed to deduct ESR tokens',
          ErrorType.SERVER,
          errorData
        );
      }

      const data = await response.json();
      return data.success || false;
    } catch (error) {
      console.error('Error deducting ESR tokens:', error);
      if (error instanceof AppError) {
        throw error;
      } else {
        throw new AppError('Failed to deduct ESR tokens', ErrorType.SERVER, error);
      }
    }
  }

  // Real data fetching methods
  async getTokenStatistics(contractAddress: string, network: Network): Promise<{
    holders: number;
    transfers: number;
    totalSupply: string;
    lastUpdated: string;
  }> {
    try {
      const response = await fetch(`${this.apiUrl}/api/contracts/${contractAddress}/stats?network=${network.id}`, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new AppError(
          errorData.error || 'Failed to fetch token statistics',
          ErrorType.SERVER,
          errorData
        );
      }

      const data = await response.json();
      
      // If there's an error in the response, log it and return defaults
      if (data.error) {
        console.error(`Error in token statistics response: ${data.error}`);
        reportError(new AppError(data.error, ErrorType.SERVER, data.details));
      }
      
      return {
        holders: data.holders || 0,
        transfers: data.transfers || 0,
        totalSupply: data.totalSupply || '0',
        lastUpdated: data.lastUpdated || new Date().toISOString()
      };
    } catch (error) {
      console.error('Error fetching token statistics:', error);
      const appError = new AppError('Failed to fetch token statistics', ErrorType.SERVER, error);
      reportError(appError);
      
      // Retry once after a short delay
      try {
        await new Promise(resolve => setTimeout(resolve, 2000));
        const response = await fetch(`${this.apiUrl}/api/contracts/${contractAddress}/stats?network=${network.id}`, {
          headers: this.getAuthHeaders(),
          cache: 'no-store'
        });
        
        if (response.ok) {
          const data = await response.json();
          return {
            holders: data.holders || 0,
            transfers: data.transfers || 0,
            totalSupply: data.totalSupply || '0',
            lastUpdated: data.lastUpdated || new Date().toISOString()
          };
        }
      } catch (retryError) {
        console.error('Retry failed:', retryError);
      }
      
      return { 
        holders: 0, 
        transfers: 0, 
        totalSupply: '0',
        lastUpdated: new Date().toISOString()
      };
    }
  }

  async getSaleStatistics(contractAddress: string): Promise<{
    totalRaised: string;
    participantCount: number;
    status: 'upcoming' | 'live' | 'ended';
  }> {
    try {
      // Get current network from web3Service
      const network = await web3Service.getCurrentNetwork();
      const networkId = network?.id || 'ethereum';
      
      const response = await fetch(`${this.apiUrl}/api/contracts/presale/${contractAddress}/stats?network=${networkId}`, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new AppError(
          errorData.error || 'Failed to fetch sale statistics',
          ErrorType.SERVER,
          errorData
        );
      }

      const data = await response.json();
      
      // If there's an error in the response, log it
      if (data.error) {
        console.error(`Error in sale statistics response: ${data.error}`);
        reportError(new AppError(data.error, ErrorType.SERVER, data.details));
      }
      
      return {
        totalRaised: data.totalRaised || '0',
        participantCount: data.participantCount || 0,
        status: data.status || 'upcoming'
      };
    } catch (error) {
      console.error('Error fetching sale statistics:', error);
      reportError(new AppError('Failed to fetch sale statistics', ErrorType.SERVER, error));
      return { totalRaised: '0', participantCount: 0, status: 'upcoming' };
    }
  }
}

export const contractService = new ContractService();