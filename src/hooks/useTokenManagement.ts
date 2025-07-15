import { useState, useCallback, useEffect } from 'react';
import { ethers } from 'ethers';
import { web3Service } from '../services/web3Service';
import { TokenManagementData, VestingSchedule, MintTransaction, BurnTransaction } from '../types/tokenManagement';

// Token ABI with management functions
const TOKEN_MANAGEMENT_ABI = [
  // Standard ERC20
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address) view returns (uint256)',
  'function owner() view returns (address)',
  
  // Mintable
  'function mint(address to, uint256 amount)',
  'function maxSupply() view returns (uint256)',
  
  // Burnable
  'function burn(uint256 amount)',
  'function burnFrom(address account, uint256 amount)',
  
  // Fee Token
  'function transferFeePercentage() view returns (uint256)',
  'function feeRecipient() view returns (address)',
  'function setTransferFee(uint256 feePercentage)',
  'function setFeeRecipient(address recipient)',
  
  // Redistribution Token
  'function redistributionPercentage() view returns (uint256)',
  'function setRedistributionPercentage(uint256 percentage)',
  'function claimRewards()',
  'function getUnclaimedRewards(address account) view returns (uint256)',
  
  // Events
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event Mint(address indexed to, uint256 amount)',
  'event Burn(address indexed from, uint256 amount)'
];

const VESTING_ABI = [
  'function getVestingSchedule(address beneficiary) view returns (uint256 totalAmount, uint256 startTime, uint256 duration, uint256 releasedAmount, uint256 vestedAmount, uint256 releasableAmount, bool revoked)',
  'function createVestingSchedule(address beneficiary, uint256 totalAmount, uint256 startTime, uint256 duration)',
  'function release()',
  'function revokeVesting(address beneficiary)',
  'function vestingExists(address beneficiary) view returns (bool)'
];

interface TokenManagementHook {
  tokenData: TokenManagementData | null;
  isLoading: boolean;
  isOwner: boolean;
  loadTokenData: (address: string) => Promise<void>;
  mintTokens: (to: string, amount: string) => Promise<string>;
  burnTokens: (amount: string) => Promise<string>;
  updateFeeSettings: (percentage: number, recipient?: string) => Promise<string>;
  updateRedistributionPercentage: (percentage: number) => Promise<string>;
  createVesting: (beneficiary: string, amount: string, startTime: number, duration: number) => Promise<string>;
  claimRewards: () => Promise<string>;
  getUnclaimedRewards: (address: string) => Promise<string>;
  getMintHistory: () => Promise<MintTransaction[]>;
  getBurnHistory: () => Promise<BurnTransaction[]>;
}

export const useTokenManagement = (userAddress: string): TokenManagementHook => {
  const [tokenData, setTokenData] = useState<TokenManagementData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  const loadTokenData = useCallback(async (contractAddress: string) => {
    if (!contractAddress) return;
    
    setIsLoading(true);
    try {
      const provider = web3Service.getProvider();
      if (!provider) throw new Error('Provider not available');
      
      const contract = new ethers.Contract(contractAddress, TOKEN_MANAGEMENT_ABI, provider);
      
      // Get basic token info
      const [name, symbol, decimals, totalSupply, owner] = await Promise.all([
        contract.name(),
        contract.symbol(),
        contract.decimals(),
        contract.totalSupply(),
        contract.owner().catch(() => null)
      ]);
      
      // Check if user is owner
      const ownerAddress = owner?.toLowerCase();
      const userIsOwner = ownerAddress === userAddress?.toLowerCase();
      setIsOwner(userIsOwner);
      
      // Detect features by trying to call functions
      const features = await detectTokenFeatures(contract);
      
      // Get max supply if mintable
      let maxSupply = '0';
      if (features.mintable) {
        try {
          maxSupply = await contract.maxSupply();
        } catch (error) {
          console.log('Max supply not available');
        }
      }
      
      // Get network info
      const network = await web3Service.getCurrentNetwork();
      
      const tokenManagementData: TokenManagementData = {
        address: contractAddress,
        name,
        symbol,
        decimals,
        totalSupply: ethers.formatUnits(totalSupply, decimals),
        maxSupply: maxSupply ? ethers.formatUnits(maxSupply, decimals) : '0',
        owner: ownerAddress || '',
        network: network?.name || 'Unknown',
        features,
        deploymentDate: new Date().toISOString(), // Would come from API in real implementation
        verified: true // Would come from explorer API
      };
      
      setTokenData(tokenManagementData);
    } catch (error) {
      console.error('Error loading token data:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [userAddress]);

  const detectTokenFeatures = async (contract: ethers.Contract) => {
    const features = {
      mintable: false,
      burnable: false,
      transferFees: {
        enabled: false,
        percentage: 0,
        recipient: '',
        editable: true
      },
      holderRedistribution: {
        enabled: false,
        percentage: 0
      },
      vesting: {
        enabled: false,
        schedules: []
      },
      verified: true
    };
    
    // Check if mintable by looking for the mint function
    try {
      // First check if the function exists in the interface
      if (contract.interface.getFunction('mint(address,uint256)')) {
        features.mintable = true;
      }
    } catch (error) {
      // Not mintable or not owner
    }
    
    // Check if burnable by looking for the burn function
    try {
      if (contract.interface.getFunction('burn(uint256)')) {
        features.burnable = true;
      }
    } catch (error) {
      // Not burnable
    }
    
    // Check for transfer fees by looking for fee-related functions
    try {
      if (contract.interface.getFunction('transferFeePercentage()') && 
          contract.interface.getFunction('feeRecipient()')) {
        const feePercentage = await contract.transferFeePercentage();
        const feeRecipient = await contract.feeRecipient();
        
        features.transferFees = {
          enabled: feePercentage > 0,
          percentage: Number(feePercentage) / 100, // Convert from basis points
          recipient: feeRecipient,
          editable: true
        };
      }
    } catch (error) {
      // No transfer fees
    }
    
    // Check for redistribution by looking for redistribution-related functions
    try {
      if (contract.interface.getFunction('redistributionPercentage()')) {
        const redistributionPercentage = await contract.redistributionPercentage();
        
        features.holderRedistribution = {
          enabled: redistributionPercentage > 0,
          percentage: Number(redistributionPercentage) / 100
        };
      }
    } catch (error) {
      // No redistribution
    }
    
    // Check for vesting by looking for a separate vesting contract
    // This would require additional logic to find associated vesting contracts
    try {
      // Check if this token has any vesting schedules in our database
      // This is a placeholder - in a real implementation, we would query the backend
      const vestingContractAddress = localStorage.getItem(`vesting_${tokenData.address.toLowerCase()}`);
      if (vestingContractAddress) {
        features.vesting.enabled = true;
      }
    } catch (error) {
      // No vesting
    }
    
    return features;
  };

  const mintTokens = useCallback(async (to: string, amount: string): Promise<string> => {
    if (!tokenData || !isOwner) throw new Error('Not authorized');
    
    const signer = web3Service.getSigner();
    if (!signer) throw new Error('Signer not available');
    
    const contract = new ethers.Contract(tokenData.address, TOKEN_MANAGEMENT_ABI, signer);
    const amountWei = ethers.parseUnits(amount, tokenData.decimals);
    
    const tx = await contract.mint(to, amountWei);
    await tx.wait();
    
    // Reload token data to update supply
    await loadTokenData(tokenData.address);
    
    return tx.hash;
  }, [tokenData, isOwner, loadTokenData]);

  const burnTokens = useCallback(async (amount: string): Promise<string> => {
    if (!tokenData) throw new Error('Token data not available');
    
    const signer = web3Service.getSigner();
    if (!signer) throw new Error('Signer not available');
    
    const contract = new ethers.Contract(tokenData.address, TOKEN_MANAGEMENT_ABI, signer);
    const amountWei = ethers.parseUnits(amount, tokenData.decimals);
    
    const tx = await contract.burn(amountWei);
    await tx.wait();
    
    // Reload token data to update supply
    await loadTokenData(tokenData.address);
    
    return tx.hash;
  }, [tokenData, loadTokenData]);

  const updateFeeSettings = useCallback(async (percentage: number, recipient?: string): Promise<string> => {
    if (!tokenData || !isOwner) throw new Error('Not authorized');
    
    const signer = web3Service.getSigner();
    if (!signer) throw new Error('Signer not available');
    
    const contract = new ethers.Contract(tokenData.address, TOKEN_MANAGEMENT_ABI, signer);
    
    let tx;
    if (recipient) {
      tx = await contract.setFeeRecipient(recipient);
      await tx.wait();
    }
    
    const feeInBasisPoints = Math.floor(percentage * 100); // Convert to basis points
    tx = await contract.setTransferFee(feeInBasisPoints);
    await tx.wait();
    
    // Reload token data
    await loadTokenData(tokenData.address);
    
    return tx.hash;
  }, [tokenData, isOwner, loadTokenData]);

  const updateRedistributionPercentage = useCallback(async (percentage: number): Promise<string> => {
    if (!tokenData || !isOwner) throw new Error('Not authorized');
    
    const signer = web3Service.getSigner();
    if (!signer) throw new Error('Signer not available');
    
    const contract = new ethers.Contract(tokenData.address, TOKEN_MANAGEMENT_ABI, signer);
    const percentageInBasisPoints = Math.floor(percentage * 100);
    
    const tx = await contract.setRedistributionPercentage(percentageInBasisPoints);
    await tx.wait();
    
    // Reload token data
    await loadTokenData(tokenData.address);
    
    return tx.hash;
  }, [tokenData, isOwner, loadTokenData]);

  const createVesting = useCallback(async (beneficiary: string, amount: string, startTime: number, duration: number): Promise<string> => {
    if (!tokenData || !isOwner) throw new Error('Not authorized');
    
    const signer = web3Service.getSigner();
    if (!signer) throw new Error('Signer not available');
    
    // This would interact with a separate vesting contract
    // For now, we'll simulate the transaction
    throw new Error('Vesting contract integration not implemented');
  }, [tokenData, isOwner]);

  const claimRewards = useCallback(async (): Promise<string> => {
    if (!tokenData) throw new Error('Token data not available');
    
    const signer = web3Service.getSigner();
    if (!signer) throw new Error('Signer not available');
    
    const contract = new ethers.Contract(tokenData.address, TOKEN_MANAGEMENT_ABI, signer);
    const tx = await contract.claimRewards();
    await tx.wait();
    
    return tx.hash;
  }, [tokenData]);

  const getUnclaimedRewards = useCallback(async (address: string): Promise<string> => {
    if (!tokenData) throw new Error('Token data not available');
    
    const provider = web3Service.getProvider();
    if (!provider) throw new Error('Provider not available');
    
    const contract = new ethers.Contract(tokenData.address, TOKEN_MANAGEMENT_ABI, provider);
    const rewards = await contract.getUnclaimedRewards(address);
    
    return ethers.formatUnits(rewards, tokenData.decimals);
  }, [tokenData]);

  const getMintHistory = useCallback(async (): Promise<MintTransaction[]> => {
    if (!tokenData) return [];
    
    // This would query blockchain events
    // For now, return empty array
    return [];
  }, [tokenData]);

  const getBurnHistory = useCallback(async (): Promise<BurnTransaction[]> => {
    if (!tokenData) return [];
    
    // This would query blockchain events
    // For now, return empty array
    return [];
  }, [tokenData]);

  return {
    tokenData,
    isLoading,
    isOwner,
    loadTokenData,
    mintTokens,
    burnTokens,
    updateFeeSettings,
    updateRedistributionPercentage,
    createVesting,
    claimRewards,
    getUnclaimedRewards,
    getMintHistory,
    getBurnHistory
  };
};