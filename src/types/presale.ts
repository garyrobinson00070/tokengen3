export interface PresaleConfig {
  id?: string;
  saleType: 'presale' | 'private' | 'fairlaunch';
  tokenInfo: {
    tokenAddress: string;
    tokenName: string;
    tokenSymbol: string;
    maxSupply: string;
    allocatedAmount: string;
  };
  saleConfiguration: {
    saleName: string;
    softCap: string;
    hardCap: string;
    tokenPrice: string; // How many tokens per 1 native token
    minPurchase: string;
    maxPurchase: string;
    startDate: string;
    endDate: string;
    whitelistEnabled: boolean;
  };
  antiBotConfig?: {
    enabled: boolean;
    protectionDelay: number; // seconds
    maxGasPrice: number; // Gwei
    walletCooldown: number; // seconds
    signatureRequired: boolean;
  };
  vestingConfig: {
    enabled: boolean;
    duration: number; // in days
    initialRelease: number; // percentage released at TGE
  };
  autoListingConfig?: {
    enabled: boolean;
    listingPrice: string; // tokens per 1 base token
    lpTokenPercentage: number; // percentage of tokens for LP (0-100)
    lpBaseTokenPercentage: number; // percentage of base tokens for LP (0-100)
    lockDuration: number; // in days
  };
  walletSetup: {
    saleReceiver: string;
    refundWallet: string;
  };
  network: Network;
  status?: 'upcoming' | 'live' | 'ended' | 'cancelled' | 'finalized';
  contractAddress?: string;
  transactionHash?: string;
  totalRaised?: string;
  participantCount?: number;
  createdAt?: string;
}

export interface PresaleDeploymentResult {
  contractAddress: string;
  transactionHash: string;
  network: Network;
  explorerUrl: string;
  gasUsed: string;
  deploymentCost: string;
  salePageUrl: string;
  lpTokenAddress?: string;
}

export interface SaleParticipant {
  address: string;
  amount: string;
  tokenAmount: string;
  timestamp: string;
  isWhitelisted: boolean;
}

export type PresaleStep = 'type' | 'token' | 'config' | 'vesting' | 'autoListing' | 'wallet' | 'review' | 'success';

export interface BadgeInfo {
  id: string;
  badge_type: 'kyc' | 'audit' | 'safu';
  status: 'approved' | 'pending' | 'revoked';
  document_url?: string;
  notes?: string;
  approved_by?: string;
  approved_at?: string;
}