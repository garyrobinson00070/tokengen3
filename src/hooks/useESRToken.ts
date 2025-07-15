import { useState, useCallback } from 'react';
import { ESR_TOKEN_ADDRESS, PLATFORM_WALLET, isTestnet } from '../config/constants';
import { ethers } from 'ethers';
import { web3Service } from '../services/web3Service';
import { AppError, ErrorType } from '../services/errorHandler';

// ESR Token ABI (ERC-20 standard methods)
const ESR_TOKEN_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function decimals() view returns (uint8)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)'
];

interface ESRTokenHook {
  balance: number;
  isLoading: boolean;
  error: string | null;
  checkBalance: (address: string) => Promise<void>;
  deductTokens: (address: string, amount: number) => Promise<string>;
}

export const useESRToken = (): ESRTokenHook => {
  const [balance, setBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const checkBalance = useCallback(async (address: string) => {
    if (!address) {
      setBalance(0);
      setError('Please connect your wallet to check ESR balance');
      return;
    }
    
    if (ESR_TOKEN_ADDRESS === '0x0000000000000000000000000000000000000000') {
      console.warn('ESR Token address not configured');
      setBalance(0);
      setError('ESR Token address not properly configured. Please contact support.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const provider = web3Service.getProvider();
      if (!provider) {
        throw new AppError('Wallet provider not available', ErrorType.WALLET);
      }
      
      // Get current network
      const network = await provider.getNetwork();
      const chainId = Number(network.chainId);
      
      // If this is a testnet, simulate a balance for testing
      if (isTestnet(chainId)) {
        console.log('Testnet detected, simulating ESR balance');
        // Simulate a realistic balance of 500 ESR on testnets
        setBalance(500);
        setIsLoading(false);
        return;
      }
      
      // Create ESR token contract instance
      const esrContract = new ethers.Contract(ESR_TOKEN_ADDRESS, ESR_TOKEN_ABI, provider);
      
      // Get balance and decimals in parallel
      const [balanceWei, decimals] = await Promise.all([
        esrContract.balanceOf(address),
        esrContract.decimals()
      ]);
      
      // Format balance from wei to human readable
      const formattedBalance = parseFloat(ethers.formatUnits(balanceWei, decimals));
      setBalance(formattedBalance);

      // Log balance for debugging
      console.log(`ESR Balance for ${address.slice(0, 6)}...${address.slice(-4)}: ${formattedBalance} ESR`);
      
      // Store balance in local storage for persistence
      localStorage.setItem('esrBalance', formattedBalance.toString());
      localStorage.setItem('esrBalanceTimestamp', Date.now().toString());
      
      // If balance is very low, show a warning
      if (formattedBalance < 10) {
        setError('Your ESR balance is low. You may need more tokens for deployments.');
      }
      
    } catch (error) {
      const errorMessage = (error as Error).message || 'Unknown error';
      console.error('Error checking ESR balance:', errorMessage);
      setBalance(0);
      
      // Set a user-friendly error message
      setError(
        errorMessage.includes('network') 
          ? 'Network error. Please check your connection.' 
          : errorMessage.includes('wallet') 
          ? errorMessage 
          : 'Failed to check ESR balance'
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deductTokens = useCallback(async (address: string, amount: number) => {
    if (!address) {
      throw new AppError('Wallet not connected', ErrorType.WALLET);
    }
    setError(null);
    
    if (ESR_TOKEN_ADDRESS === '0x0000000000000000000000000000000000000000') {
      throw new AppError('ESR Token address not configured', ErrorType.VALIDATION);
    }

    try {
      // Check if we're on a testnet
      const network = await web3Service.getCurrentNetwork();
      if (network && isTestnet(network.chainId)) {
        // Even on testnet, we should simulate a realistic transaction
        console.log('Testnet detected, simulating ESR token deduction with realistic delay');
        
        // Show loading state for a realistic amount of time
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Update balance
        setBalance(prev => Math.max(0, prev - amount));
        
        // Generate a realistic looking hash
        const hash = '0x' + Array.from({length: 64}, () => 
          '0123456789abcdef'[Math.floor(Math.random() * 16)]).join('');
        
        return hash;
      }
      
      const signer = web3Service.getSigner();
      if (!signer) {
        throw new AppError('Wallet connection issue', ErrorType.WALLET);
      }
      
      // Create ESR token contract instance with signer
      const esrContract = new ethers.Contract(ESR_TOKEN_ADDRESS, ESR_TOKEN_ABI, signer);
      
      // Get token decimals
      const decimals = await esrContract.decimals();
      
      // Convert amount to wei
      const amountWei = ethers.parseUnits(amount.toString(), decimals);
      
      // Check current balance
      const currentBalance = await esrContract.balanceOf(address);
      const formattedBalance = ethers.formatUnits(currentBalance, decimals);
      const availableBalance = parseFloat(formattedBalance);
      if (availableBalance < amount) {
        throw new AppError(`Insufficient ESR balance. Required: ${amount} ESR, Available: ${availableBalance.toFixed(2)} ESR`, ErrorType.VALIDATION);
      }
      
      console.log(`Transferring ${amount} ESR tokens to platform wallet ${PLATFORM_WALLET.slice(0, 6)}...${PLATFORM_WALLET.slice(-4)}`);
      
      // Transfer ESR tokens to platform wallet
      const tx = await esrContract.transfer(PLATFORM_WALLET, amountWei);
      const txHash = tx.hash;
      
      console.log(`ESR transfer transaction sent: ${tx.hash}`);
      
      // Wait for transaction confirmation
      const receipt = await tx.wait();
      
      if (receipt.status === 1) {
        console.log(`ESR transfer confirmed in block ${receipt.blockNumber}. Gas used: ${receipt.gasUsed.toString()}`);
        
        // Notify backend about the transaction
        try {
          const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/auth/esr/deduct`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify({ amount, txHash })
          });
          
          if (!response.ok) {
            console.warn('Backend notification about ESR deduction failed, but transaction was successful');
          }
        } catch (apiError) {
          console.error('Failed to notify backend about ESR deduction:', apiError);
          // Continue even if backend notification fails
        }
        
        // Update balance after successful transaction
        setTimeout(() => {
          checkBalance(address);
        }, 2000);
        
        return txHash;
      } else {
        throw new AppError('ESR transfer transaction failed', ErrorType.CONTRACT);
      }
    } catch (error) {
      console.error('Error deducting ESR tokens:', error);
      if (error instanceof AppError) {
        setError(error.message);
      } else {
        setError((error as Error).message);
      }
      throw error;
    }
  }, [checkBalance]);

  return {
    balance,
    isLoading,
    error,
    checkBalance,
    deductTokens
  };
};