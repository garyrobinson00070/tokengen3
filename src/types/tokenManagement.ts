export interface TokenFeatureConfig {
  mintable: boolean;
  burnable: boolean;
  transferFees: {
    enabled: boolean;
    percentage: number;
    recipient: string;
    editable: boolean;
  };
  holderRedistribution: {
    enabled: boolean;
    percentage: number;
  };
  vesting: {
    enabled: boolean;
    schedules: VestingSchedule[];
  };
  verified: boolean;
}

export interface VestingSchedule {
  beneficiary: string;
  totalAmount: string;
  startTime: number;
  duration: number;
  releasedAmount: string;
  revoked: boolean;
}

export interface TokenManagementData {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: string;
  maxSupply: string;
  owner: string;
  network: string;
  features: TokenFeatureConfig;
  deploymentDate: string;
  verified: boolean;
}

export interface MintTransaction {
  to: string;
  amount: string;
  timestamp: string;
  txHash: string;
}

export interface BurnTransaction {
  from: string;
  amount: string;
  timestamp: string;
  txHash: string;
}

export interface FeeDistribution {
  date: string;
  amount: string;
  recipient: string;
  txHash: string;
}