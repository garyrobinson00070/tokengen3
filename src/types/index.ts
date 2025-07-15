export interface TokenConfig {
  name: string;
  symbol: string;
  decimals: number;
  initialSupply: string;
  maxSupply: string;
  network: Network;
  features: TokenFeatures;
  vesting: VestingConfig[];
  useFactory?: boolean;
}

export interface Network {
  id: string;
  name: string;
  symbol: string;
  chainId: number;
  rpcUrl: string;
  explorerUrl: string;
  gasPrice: string;
}

export interface TokenFeatures {
  burnable: boolean;
  mintable: boolean;
  transferFees: {
    enabled: boolean;
    percentage: number;
    recipient: string;
  };
  holderRedistribution: {
    enabled: boolean;
    percentage: number;
  };
}

export interface VestingConfig {
  category: VestingCategory;
  percentage: number;
  startDate: string;
  duration: number; // in days
  enabled: boolean;
}

export type VestingCategory = 'team' | 'advertising' | 'publicSale' | 'privateSale' | 'ecosystem' | 'marketing' | 'development';

export interface DeploymentResult {
  contractAddress: string;
  transactionHash: string;
  deploymentMethod?: 'primary' | 'fallback' | 'emergency';
  network: Network;
  explorerUrl: string;
  gasUsed: string;
  deploymentCost: string;
}

export type Step = 'landing' | 'builder' | 'vesting' | 'review' | 'deploy' | 'success';