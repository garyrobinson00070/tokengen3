import { useState, useCallback } from 'react';
import { Network } from '../types';
import { ethers } from 'ethers';
import { web3Service } from '../services/web3Service';
import PresaleContractABI from '../abis/PresaleContract.json';

interface SaleData {
  saleName: string;
  tokenName: string;
  tokenSymbol: string;
  tokenAddress: string;
  saleType: 'presale' | 'private';
  tokenPrice: string;
  softCap: string;
  hardCap: string;
  minPurchase: string;
  maxPurchase: string;
  startTime: number;
  endTime: number;
  totalRaised: string;
  totalParticipants: number;
  networkSymbol: string;
  explorerUrl: string;
  vestingEnabled: boolean;
  initialRelease: number;
  vestingDuration: number;
  isFinalized: boolean;
}

interface UserInfo {
  contribution: string;
  tokenAmount: string;
  claimedTokens: string;
  claimableTokens: string;
  isWhitelisted: boolean;
}

interface SaleContractHook {
  saleData: SaleData | null;
  userInfo: UserInfo | null;
  isLoading: boolean;
  isWhitelisted: boolean;
  buyTokens: (amount: string) => Promise<void>;
  claimTokens: () => Promise<void>;
  loadSaleData: () => Promise<void>;
  loadUserInfo: (address: string) => Promise<void>;
}

export const useSaleContract = (contractAddress: string): SaleContractHook => {
  const [saleData, setSaleData] = useState<SaleData | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isWhitelisted, setIsWhitelisted] = useState(false);

  const loadSaleData = useCallback(async () => {
    if (!contractAddress) return;
    
    setIsLoading(true);
    try {
      // Get provider
      const provider = web3Service.getProvider();
      if (!provider) throw new Error('Provider not connected');
      
      // Create contract instance
      const contract = new ethers.Contract(contractAddress, PresaleContractABI, provider);
      
      // Get sale info
      const saleInfo = await contract.saleInfo();
      const vestingInfo = await contract.vestingInfo();
      const stats = await contract.getSaleStats();
      
      // Get token info
      const tokenContract = new ethers.Contract(
        saleInfo.token,
        ['function name() view returns (string)', 'function symbol() view returns (string)'],
        provider
      );
      
      const [tokenName, tokenSymbol] = await Promise.all([
        tokenContract.name(),
        tokenContract.symbol()
      ]);
      
      // Get network info
      const network = await web3Service.getCurrentNetwork();
      
      // Determine sale type based on whitelist
      const saleType = saleInfo.whitelistEnabled ? 'private' : 'presale';
      
      // Create sale data object
      const realSaleData: SaleData = {
        saleName: `${tokenSymbol} ${saleType === 'private' ? 'Private Sale' : 'Presale'}`,
        tokenName,
        tokenSymbol,
        tokenAddress: saleInfo.token,
        saleType,
        tokenPrice: ethers.formatEther(saleInfo.tokenPrice),
        softCap: ethers.formatEther(saleInfo.softCap),
        hardCap: ethers.formatEther(saleInfo.hardCap),
        minPurchase: ethers.formatEther(saleInfo.minPurchase),
        maxPurchase: ethers.formatEther(saleInfo.maxPurchase),
        startTime: Number(saleInfo.startTime),
        endTime: Number(saleInfo.endTime),
        totalRaised: ethers.formatEther(stats[0]),
        totalParticipants: Number(stats[1]),
        networkSymbol: network?.symbol || 'ETH',
        explorerUrl: network?.explorerUrl || 'https://etherscan.io',
        vestingEnabled: vestingInfo.enabled,
        initialRelease: Number(vestingInfo.initialRelease),
        vestingDuration: Number(vestingInfo.vestingDuration) / (24 * 60 * 60), // Convert seconds to days
        isFinalized: await contract.saleFinalized()
      };
      
      setSaleData(realSaleData);
    } catch (error) {
      console.error('Error loading sale data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [contractAddress]);

  const loadUserInfo = useCallback(async (address: string) => {
    if (!contractAddress || !address) return;
    
    try {
      // Get provider and signer
      const provider = web3Service.getProvider();
      if (!provider) throw new Error('Provider not connected');
      
      // Create contract instance
      const contract = new ethers.Contract(contractAddress, PresaleContractABI, provider);
      
      // Get participant info
      const info = await contract.getParticipantInfo(address);
      
      // Check whitelist status
      const whitelistStatus = info[4] || await contract.whitelist(address);
      
      // Create user info object
      const userInfoData: UserInfo = {
        contribution: ethers.formatEther(info[0]),
        tokenAmount: ethers.formatEther(info[1]),
        claimedTokens: ethers.formatEther(info[2]),
        claimableTokens: ethers.formatEther(info[3]),
        isWhitelisted: whitelistStatus
      };
      
      setUserInfo(userInfoData);
      setIsWhitelisted(whitelistStatus);
    } catch (error) {
      console.error('Error loading user info:', error);
    }
  }, [contractAddress]);

  const buyTokens = useCallback(async (amount: string) => {
    if (!contractAddress || typeof window.ethereum === 'undefined') {
      throw new Error('Wallet not connected');
    }

    try {
      // Get signer
      const signer = web3Service.getSigner();
      if (!signer) throw new Error('Signer not available');
      
      // Create contract instance
      const contract = new ethers.Contract(contractAddress, PresaleContractABI, signer);
      
      // Convert amount to wei
      const amountWei = ethers.parseEther(amount);
      
      // Call buyTokens function
      const tx = await contract.buyTokens({ value: amountWei });
      
      // Wait for transaction confirmation
      await tx.wait();
      
    } catch (error) {
      console.error('Error buying tokens:', error);
      throw error;
    }
  }, [contractAddress]);

  const claimTokens = useCallback(async () => {
    if (!contractAddress || typeof window.ethereum === 'undefined') {
      throw new Error('Wallet not connected');
    }

    try {
      // Get signer
      const signer = web3Service.getSigner();
      if (!signer) throw new Error('Signer not available');
      
      // Create contract instance
      const contract = new ethers.Contract(contractAddress, PresaleContractABI, signer);
      
      // Call claimTokens function
      const tx = await contract.claimTokens();
      
      // Wait for transaction confirmation
      await tx.wait();
      
    } catch (error) {
      console.error('Error claiming tokens:', error);
      throw error;
    }
  }, [contractAddress]);

  return {
    saleData,
    userInfo,
    isLoading,
    isWhitelisted,
    buyTokens,
    claimTokens,
    loadSaleData,
    loadUserInfo
  };
};