import { renderHook, act } from '@testing-library/react';
import { useWallet } from '../../src/hooks/useWallet';
import { ethers } from 'ethers';

// Mock ethers
jest.mock('ethers', () => {
  const original = jest.requireActual('ethers');
  return {
    ...original,
    BrowserProvider: jest.fn().mockImplementation(() => ({
      send: jest.fn().mockResolvedValue([]),
      getNetwork: jest.fn().mockResolvedValue({ chainId: 1, name: 'mainnet' }),
      getBalance: jest.fn().mockResolvedValue(ethers.parseEther('1.0')),
      getSigner: jest.fn().mockResolvedValue({
        getAddress: jest.fn().mockResolvedValue('0x742d35Cc6634C0532925a3b8D4C9db96590c6C8C'),
      }),
    })),
  };
});

describe('useWallet hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    window.ethereum.request.mockReset();
  });

  it('should initialize with disconnected state', () => {
    const { result } = renderHook(() => useWallet());
    
    expect(result.current.isConnected).toBe(false);
    expect(result.current.address).toBeNull();
    expect(result.current.balance).toBeNull();
    expect(result.current.chainId).toBeNull();
  });

  it('should connect wallet successfully', async () => {
    window.ethereum.request.mockResolvedValueOnce(['0x742d35Cc6634C0532925a3b8D4C9db96590c6C8C']);
    
    const { result, waitForNextUpdate } = renderHook(() => useWallet());
    
    act(() => {
      result.current.connectWallet();
    });
    
    expect(result.current.isConnecting).toBe(true);
    
    await waitForNextUpdate();
    
    expect(result.current.isConnected).toBe(true);
    expect(result.current.address).toBe('0x742d35Cc6634C0532925a3b8D4C9db96590c6C8C');
    expect(result.current.balance).toBe('1.0000');
    expect(result.current.chainId).toBe(1);
    expect(result.current.isConnecting).toBe(false);
  });

  it('should handle connection errors', async () => {
    window.ethereum.request.mockRejectedValueOnce(new Error('User rejected the request'));
    
    const { result, waitForNextUpdate } = renderHook(() => useWallet());
    
    act(() => {
      result.current.connectWallet();
    });
    
    await waitForNextUpdate();
    
    expect(result.current.isConnected).toBe(false);
    expect(result.current.error).toBe('User rejected the request');
  });

  it('should disconnect wallet', async () => {
    // First connect
    window.ethereum.request.mockResolvedValueOnce(['0x742d35Cc6634C0532925a3b8D4C9db96590c6C8C']);
    
    const { result, waitForNextUpdate } = renderHook(() => useWallet());
    
    act(() => {
      result.current.connectWallet();
    });
    
    await waitForNextUpdate();
    
    expect(result.current.isConnected).toBe(true);
    
    // Then disconnect
    act(() => {
      result.current.disconnectWallet();
    });
    
    expect(result.current.isConnected).toBe(false);
    expect(result.current.address).toBeNull();
    expect(localStorage.removeItem).toHaveBeenCalledWith('authToken');
    expect(localStorage.removeItem).toHaveBeenCalledWith('walletAddress');
  });
});