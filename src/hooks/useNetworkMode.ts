import { useState, useEffect, useCallback } from 'react';
import { MODE_STORAGE_KEY, DEFAULT_MODE } from '../config/constants';

type NetworkMode = 'mainnet' | 'testnet';

export const useNetworkMode = () => {
  // Initialize from localStorage or default
  const [mode, setMode] = useState<NetworkMode>(() => {
    const savedMode = localStorage.getItem(MODE_STORAGE_KEY);
    return (savedMode === 'mainnet' || savedMode === 'testnet') 
      ? savedMode 
      : DEFAULT_MODE;
  });

  const [showBanner, setShowBanner] = useState(false);
  const [bannerMessage, setBannerMessage] = useState('');


  // Toggle between mainnet and testnet
  const toggleMode = useCallback(async () => {
    const newMode: NetworkMode = mode === 'mainnet' ? 'testnet' : 'mainnet';
    setMode(newMode);
    
    // Show banner notification
    setBannerMessage(`${newMode === 'mainnet' ? 'Mainnet' : 'Testnet'} Mode Activated`);
    setShowBanner(true);
    
    // Hide banner after 3 seconds
    setTimeout(() => {
      setShowBanner(false);
    }, 3000);
  }, [mode]);

  // Save to localStorage whenever mode changes
  useEffect(() => {
    localStorage.setItem(MODE_STORAGE_KEY, mode);
  }, [mode]);

  // Check if we're in testnet mode
  const isTestnetMode = mode === 'testnet';

  return {
    mode,
    isTestnetMode,
    toggleMode,
    showBanner,
    bannerMessage,
    setShowBanner
  };
};