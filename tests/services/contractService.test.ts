import { contractService } from '../../src/services/contractService';
import { web3Service } from '../../src/services/web3Service';
import { TokenConfig } from '../../src/types';
import { networks } from '../../src/data/networks';

// Mock fetch
global.fetch = jest.fn();

// Mock web3Service
jest.mock('../../src/services/web3Service', () => ({
  web3Service: {
    getCurrentNetwork: jest.fn().mockResolvedValue({
      id: 'ethereum',
      name: 'Ethereum',
      chainId: 1,
      symbol: 'ETH',
      rpcUrl: 'https://mainnet.infura.io/v3/your-key',
      explorerUrl: 'https://etherscan.io',
      gasPrice: '0.001 ETH',
    }),
    switchNetwork: jest.fn().mockResolvedValue(undefined),
  },
}));

describe('contractService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    (global.fetch as jest.Mock).mockReset();
  });

  describe('authentication', () => {
    it('should get authentication message', async () => {
      const mockResponse = {
        message: 'Sign this message to authenticate: 0x123...',
        timestamp: Date.now(),
      };
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockResponse),
      });
      
      const message = await contractService.getAuthMessage('0x123');
      
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/message'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('0x123'),
        })
      );
      
      expect(message).toBe(mockResponse.message);
    });

    it('should authenticate with signature', async () => {
      const mockResponse = {
        success: true,
        token: 'jwt-token',
        address: '0x123',
        expiresIn: '24h',
      };
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockResponse),
      });
      
      const token = await contractService.authenticate(
        '0x123',
        '0xsignature',
        'message'
      );
      
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/login'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('0x123'),
        })
      );
      
      expect(token).toBe(mockResponse.token);
      expect(localStorage.setItem).toHaveBeenCalledWith('authToken', mockResponse.token);
    });
  });

  describe('token deployment', () => {
    it('should deploy a token', async () => {
      const mockConfig: TokenConfig = {
        name: 'Test Token',
        symbol: 'TEST',
        decimals: 18,
        initialSupply: '1000000',
        maxSupply: '10000000',
        network: networks[0],
        features: {
          burnable: true,
          mintable: true,
          transferFees: {
            enabled: false,
            percentage: 0,
            recipient: '',
          },
          holderRedistribution: {
            enabled: false,
            percentage: 0,
          },
        },
        vesting: [],
      };
      
      const mockResponse = {
        contractAddress: '0xcontractAddress',
        transactionHash: '0xtxHash',
        gasUsed: '1000000',
        deploymentCost: '0.05',
        network: 'ethereum',
        verified: true,
      };
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockResponse),
      });
      
      const result = await contractService.deployToken(mockConfig);
      
      expect(web3Service.getCurrentNetwork).toHaveBeenCalled();
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/deploy/token'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('BurnableMintableToken'),
        })
      );
      
      expect(result).toEqual({
        contractAddress: mockResponse.contractAddress,
        transactionHash: mockResponse.transactionHash,
        network: mockConfig.network,
        explorerUrl: `${mockConfig.network.explorerUrl}/token/${mockResponse.contractAddress}`,
        gasUsed: mockResponse.gasUsed,
        deploymentCost: mockResponse.deploymentCost,
      });
    });

    it('should handle deployment errors', async () => {
      const mockConfig: TokenConfig = {
        name: 'Test Token',
        symbol: 'TEST',
        decimals: 18,
        initialSupply: '1000000',
        maxSupply: '10000000',
        network: networks[0],
        features: {
          burnable: false,
          mintable: false,
          transferFees: {
            enabled: false,
            percentage: 0,
            recipient: '',
          },
          holderRedistribution: {
            enabled: false,
            percentage: 0,
          },
        },
        vesting: [],
      };
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: jest.fn().mockResolvedValueOnce({
          error: 'Deployment failed',
          details: 'Insufficient gas',
        }),
      });
      
      await expect(contractService.deployToken(mockConfig)).rejects.toThrow('Deployment failed');
    });
  });

  describe('contract data fetching', () => {
    it('should fetch deployed tokens', async () => {
      const mockTokens = [
        {
          contractAddress: '0xtoken1',
          name: 'Token 1',
          symbol: 'TK1',
        },
        {
          contractAddress: '0xtoken2',
          name: 'Token 2',
          symbol: 'TK2',
        },
      ];
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({ tokens: mockTokens }),
      });
      
      const tokens = await contractService.getDeployedTokens();
      
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/contracts/deployed'),
        expect.any(Object)
      );
      
      expect(tokens).toEqual(mockTokens);
    });

    it('should handle fetch errors gracefully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });
      
      const tokens = await contractService.getDeployedTokens();
      
      expect(tokens).toEqual([]);
    });
  });
});