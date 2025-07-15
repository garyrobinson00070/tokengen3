import { useState, useEffect } from 'react';
import { formatEther } from 'ethers';
import { 
  CHAIN_CONFIG, 
  getMainnetChainIds, 
  getTestnetChainIds, 
  isMainnetChain, 
  isTestnetChain 
} from '../config/chainConfig';
import { web3Service } from '../services/web3Service';

interface WalletState {
  isConnected: boolean;
  address: string | null;
  balance: string | null;
  chainId: number | null;
  error?: string | null;
}

export const useWallet = () => {
  const [wallet, setWallet] = useState<WalletState>({
    isConnected: false,
    address: null,
    balance: null,
    chainId: null,
    error: null
  });

  const [isAttemptingSwitch, setIsAttemptingSwitch] = useState(false);
  const [switchError, setSwitchError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);


  const connectWallet = async () => {
    try {
      setIsConnecting(true);
      setWallet(prev => ({ ...prev, error: null }));
      
      // Use web3Service to connect
      const address = await web3Service.connect();
      if (!address) {
        throw new Error('Failed to connect wallet');
      }
      
      // Update wallet state
      const provider = web3Service.getProvider();
      if (provider) {
        const network = await provider.getNetwork();
        const balance = await provider.getBalance(address);
        const formattedBalance = parseFloat(formatEther(balance)).toFixed(4);
        
        setWallet({
          isConnected: true,
          address: address,
          balance: formattedBalance,
          chainId: Number(network.chainId),
          error: null
        });
      }
      
      // Store wallet info in localStorage for persistence
      localStorage.setItem('walletAddress', address);
      
      console.log(`Wallet connected: ${address}`);
      return address;
    } catch (error) {
      const errorMessage = (error as Error).message || 'Failed to connect wallet';
      console.error('Error connecting wallet:', errorMessage);
      setWallet({
        isConnected: false,
        address: null,
        balance: null,
        chainId: null,
        error: errorMessage.includes('rejected') ? 'User rejected the connection request' : errorMessage
      });
      return null;
    } finally {
      setIsConnecting(false);
    }
  };

  const switchToNetwork = async (chainId: number) => {
    setIsAttemptingSwitch(true);
    setSwitchError(null);

    try {
      const chainConfig = CHAIN_CONFIG[chainId];
      if (!chainConfig) {
        throw new Error(`Chain configuration not found for chain ID ${chainId}`);
      }
      
      const network = {
        chainId: chainId,
        name: chainConfig.chainName,
        rpcUrl: chainConfig.rpcUrls[0],
        blockExplorerUrl: chainConfig.blockExplorerUrls?.[0] || '',
        nativeCurrency: chainConfig.nativeCurrency
      };
      
      await web3Service.switchNetwork(network);
      return true;
    } catch (error: any) {
      console.error('Error switching chain:', error);
      setSwitchError(`Failed to switch network: ${error.message}`);
      return false;
    } finally {
      setIsAttemptingSwitch(false);
    }
  };


  const disconnectWallet = () => {
    // Clear auth token
    localStorage.removeItem('authToken');
    localStorage.removeItem('walletAddress');
    
    // Disconnect from web3Service
    web3Service.disconnect();
    
    setWallet(prev => ({
      isConnected: false,
      address: null,
      balance: null,
      chainId: null,
      error: null
    }));
  };

  // Sync wallet state with web3Service
  const syncWalletState = async () => {
    try {
      // Check if we have a stored wallet address
      const storedAddress = localStorage.getItem('walletAddress');
      if (!storedAddress && wallet.isConnected) {
        // If we don't have a stored address but wallet shows connected, disconnect
        disconnectWallet();
        return;
      }
      
      const provider = web3Service.getProvider();
      const signer = web3Service.getSigner();
      
      if (!provider || !signer) {
        if (wallet.isConnected) {
          setWallet(prev => ({
            ...prev,
            isConnected: false,
            address: null,
            balance: null,
            chainId: null
          }));
        }
        return;
      }
      
      const address = await signer.getAddress();
      const network = await provider.getNetwork();
      const balance = await provider.getBalance(address);
      const formattedBalance = parseFloat(formatEther(balance)).toFixed(4);
      const chainId = Number(network.chainId);
      
      setWallet(prev => ({
        ...prev,
        isConnected: true,
        address: address,
        balance: formattedBalance,
        chainId: chainId,
        error: null
      }));
    } catch (error) {
      console.error('Error syncing wallet state:', error);
    }
  };

  useEffect(() => {
    if (typeof window.ethereum !== 'undefined') {
      // Check if we have a stored wallet address and try to reconnect
      const storedAddress = localStorage.getItem('walletAddress');
      if (storedAddress && !wallet.isConnected && !isConnecting) {
        try {
          connectWallet();
        } catch (err) {
          console.error('Auto-reconnect failed:', err);
          // Clear stored address if reconnect fails
          localStorage.removeItem('walletAddress');
        }
      }
            
      // Initial sync
      syncWalletState();
      
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else {
          setWallet(prev => {
            return {
            ...prev,
            address: accounts[0]
            };
          });
        }
      };

      const handleChainChanged = (chainId: string) => {
        const numericChainId = parseInt(chainId, 16);
        console.log(`Chain changed to: ${numericChainId}`);
        
        // Sync state after chain change
        setTimeout(syncWalletState, 100);
      };
      
      const handleDisconnect = (error: { code: number; message: string }) => {
        console.log('Wallet disconnected:', error);
        disconnectWallet();
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
      window.ethereum.on('disconnect', handleDisconnect);

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
        window.ethereum.removeListener('disconnect', handleDisconnect);
      };
    }
  }, [wallet.isConnected, isConnecting]);
  
  // Periodic sync when connected
  useEffect(() => {
    if (!wallet.isConnected || !wallet.address) return;
    
    // Sync immediately and then every 30 seconds
    syncWalletState();
    const interval = setInterval(syncWalletState, 30000);
    
    return () => clearInterval(interval);
  }, [wallet.isConnected, wallet.address]);

  return {
    ...wallet,
    connectWallet,
    switchToNetwork,
    disconnectWallet,
    isConnecting,
    isAttemptingSwitch,
    switchError
  };
};