import { ethers } from 'ethers';
import { TokenConfig, DeploymentResult } from '../types';
import { AppError, ErrorType, reportError } from './errorHandler';
import { web3Service } from './web3Service';

interface ContractExport {
  contractName: string;
  abi: any[];
  bytecode: string;
}

export class FallbackDeploymentService {
  private static instance: FallbackDeploymentService;

  private contractCache: Record<string, ContractExport> = {};

  private constructor() {}

  public static getInstance(): FallbackDeploymentService {
    if (!FallbackDeploymentService.instance) {
      FallbackDeploymentService.instance = new FallbackDeploymentService();
    }
    return FallbackDeploymentService.instance;
  }

  /**
   * Load contract export data from the exports directory
   */
  private async loadContractExport(contractType: string): Promise<ContractExport> {
    if (this.contractCache[contractType]) {
      return this.contractCache[contractType];
    }

    try {
      const response = await fetch(`/contracts/exports/${contractType}.json`);
      if (!response.ok) {
        throw new Error(`Failed to load contract export for ${contractType}`);
      }
      
      const contractExport = await response.json();
      this.contractCache[contractType] = contractExport;
      return contractExport;
    } catch (error) {
      console.error(`Error loading contract export for ${contractType}:`, error);
      throw new AppError(
        `Failed to load contract data for ${contractType}`,
        ErrorType.CONTRACT,
        error
      );
    }
  }

  /**
   * Get the contract type based on token configuration
   */
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

  /**
   * Get constructor parameters for the contract
   */
  private getConstructorParams(config: TokenConfig): any[] {
    const contractType = this.getContractType(config);
    const baseParams = [
      config.name,
      config.symbol,
      config.decimals,
      ethers.parseUnits(config.initialSupply, config.decimals),
      config.maxSupply ? ethers.parseUnits(config.maxSupply, config.decimals) : 0,
    ];

    switch (contractType) {
      case 'FeeToken':
        return [
          ...baseParams,
          Math.floor(config.features.transferFees.percentage * 100),
          config.features.transferFees.recipient || ethers.ZeroAddress,
          'DEPLOYER_ADDRESS' // Will be replaced with actual address
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
          config.features.transferFees.recipient || ethers.ZeroAddress,
          Math.floor(config.features.holderRedistribution.percentage * 100),
          'DEPLOYER_ADDRESS'
        ];
      default:
        return [...baseParams, 'DEPLOYER_ADDRESS'];
    }
  }

  /**
   * Estimate gas for contract deployment
   */
  public async estimateGas(config: TokenConfig): Promise<{
    gasEstimate: bigint;
    gasCost: string;
    gasCostUsd: string;
  }> {
    try {
      const contractType = this.getContractType(config);
      const contractExport = await this.loadContractExport(contractType);
      
      const signer = web3Service.getSigner();
      if (!signer) {
        throw new AppError('Wallet not connected', ErrorType.WALLET);
      }
      
      const address = await signer.getAddress();
      
      // Replace DEPLOYER_ADDRESS with actual address
      const constructorParams = this.getConstructorParams(config).map(param => 
        param === 'DEPLOYER_ADDRESS' ? address : param
      );
      
      // Create contract factory
      const factory = new ethers.ContractFactory(
        contractExport.abi,
        contractExport.bytecode,
        signer
      );
      
      // Estimate gas
      const gasEstimate = await factory.getDeployTransaction(...constructorParams).then(tx => {
        return signer.provider?.estimateGas(tx) || BigInt(3000000);
      });
      
      // Get gas price
      const feeData = await signer.provider?.getFeeData();
      const gasPrice = feeData?.gasPrice || ethers.parseUnits('50', 'gwei');
      
      // Calculate cost
      const gasCost = gasEstimate * gasPrice;
      const gasCostEther = ethers.formatEther(gasCost);
      
      // Get token price in USD (simplified)
      const tokenPrices: Record<string, number> = {
        'ETH': 2500,
        'BNB': 300,
        'MATIC': 0.80,
        'FTM': 0.40,
        'AVAX': 30,
        'ESR': 0.25
      };
      
      const network = await web3Service.getCurrentNetwork();
      const tokenPrice = tokenPrices[network?.symbol || 'ETH'] || 0;
      const gasCostUsd = (parseFloat(gasCostEther) * tokenPrice).toFixed(2);
      
      return {
        gasEstimate,
        gasCost: gasCostEther,
        gasCostUsd: `$${gasCostUsd}`
      };
    } catch (error) {
      console.error('Error estimating gas:', error);
      throw new AppError('Failed to estimate deployment gas', ErrorType.CONTRACT, error);
    }
  }

  /**
   * Deploy contract using frontend fallback (ethers.js)
   */
  public async deployContract(config: TokenConfig): Promise<DeploymentResult> {
    try {
      const contractType = this.getContractType(config);
      const contractExport = await this.loadContractExport(contractType);
      
      const signer = web3Service.getSigner();
      if (!signer) {
        throw new AppError('Wallet not connected', ErrorType.WALLET);
      }
      
      const address = await signer.getAddress();
      
      // Replace DEPLOYER_ADDRESS with actual address
      const constructorParams = this.getConstructorParams(config).map(param => 
        param === 'DEPLOYER_ADDRESS' ? address : param
      );
      
      // Create contract factory
      const factory = new ethers.ContractFactory(
        contractExport.abi,
        contractExport.bytecode,
        signer
      );
      
      console.log(`Deploying ${contractType} with params:`, constructorParams);
      
      // Deploy contract
      const contract = await factory.deploy(...constructorParams);
      
      // Wait for deployment
      const receipt = await contract.deploymentTransaction()?.wait();
      if (!receipt) {
        throw new AppError('Deployment transaction failed', ErrorType.CONTRACT);
      }
      
      console.log(`${contractType} deployed to:`, await contract.getAddress());
      
      // Get deployment transaction
      const deploymentTx = contract.deploymentTransaction();
      if (!deploymentTx) {
        throw new AppError('Deployment transaction not found', ErrorType.CONTRACT);
      }
      
      // Save deployment to backend
      try {
        const authToken = localStorage.getItem('authToken');
        if (authToken) {
          const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/contracts/register`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
              contractType,
              contractAddress: await contract.getAddress(),
              transactionHash: deploymentTx.hash,
              network: config.network.id,
              name: config.name,
              symbol: config.symbol,
              decimals: config.decimals,
              initialSupply: config.initialSupply,
              maxSupply: config.maxSupply || '0',
              features: config.features
            })
          });
          
          if (!response.ok) {
            console.warn('Failed to register contract with backend, but deployment was successful');
          }
        }
      } catch (registerError) {
        console.error('Error registering contract with backend:', registerError);
        // Continue even if registration fails
      }
      
      return {
        contractAddress: await contract.getAddress(),
        transactionHash: deploymentTx.hash,
        network: config.network,
        explorerUrl: `${config.network.explorerUrl}/token/${await contract.getAddress()}`,
        gasUsed: receipt.gasUsed.toString(),
        deploymentCost: (receipt.gasUsed * (receipt.gasPrice || BigInt(0))).toString()
      };
    } catch (error) {
      console.error('Frontend fallback deployment failed:', error);
      throw new AppError(
        (error as Error).message || 'Frontend fallback deployment failed',
        ErrorType.CONTRACT,
        error
      );
    }
  }
}

export const fallbackDeploymentService = FallbackDeploymentService.getInstance();