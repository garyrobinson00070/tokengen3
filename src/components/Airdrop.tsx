import React, { useState, useCallback, useEffect } from 'react';
import { 
  Send, 
  Upload, 
  AlertTriangle, 
  CheckCircle, 
  Loader2, 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Download,
  Copy,
  FileText
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import { saveAs } from 'file-saver';
import { ethers } from 'ethers';
import { useWallet } from '../hooks/useWallet';
import { web3Service } from '../services/web3Service';
import MultiSenderABI from '../abis/MultiSender.json';

interface AirdropRecipient {
  address: string;
  amount: string;
  valid: boolean;
  error?: string;
}

export const Airdrop: React.FC = () => {
  const { isConnected, address } = useWallet();
  const [token, setToken] = useState('');
  const [tokenInfo, setTokenInfo] = useState<{
    name: string;
    symbol: string;
    decimals: number;
    balance: string;
  } | null>(null);
  const [recipients, setRecipients] = useState<AirdropRecipient[]>([
    { address: '', amount: '', valid: false }
  ]);
  const [isValidating, setIsValidating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [gasEstimate, setGasEstimate] = useState<string | null>(null);
  const [totalAmount, setTotalAmount] = useState('0');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [isTokenApproved, setIsTokenApproved] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  // MultiSender contract address - using lowercase to avoid checksum errors
  const MULTI_SENDER_ADDRESS = '0x742d35cc6634c0532925a3b8d4c9db96590c6c8c'.toLowerCase();

  useEffect(() => {
    if (token && ethers.isAddress(token)) {
      loadTokenInfo();
    } else {
      setTokenInfo(null);
      setIsTokenApproved(false);
    }
  }, [token, address]);

  useEffect(() => {
    calculateTotalAmount();
  }, [recipients]);

  const loadTokenInfo = async () => {
    if (!isConnected || !address || !token) return;
    
    setIsValidating(true);
    setError(null);
    
    try {
      const provider = web3Service.getProvider();
      if (!provider) throw new Error('Provider not available');
      
      // Get token info
      const tokenContract = new ethers.Contract(
        token,
        [
          'function name() external view returns (string)',
          'function symbol() external view returns (string)',
          'function decimals() external view returns (uint8)',
          'function balanceOf(address) external view returns (uint256)',
          'function allowance(address,address) external view returns (uint256)'
        ],
        provider
      );
      
      const [name, symbol, decimals, balance, allowance] = await Promise.all([
        tokenContract.name(),
        tokenContract.symbol(),
        tokenContract.decimals(),
        tokenContract.balanceOf(address),
        tokenContract.allowance(address, ethers.getAddress(MULTI_SENDER_ADDRESS))
      ]);
      
      setTokenInfo({
        name,
        symbol,
        decimals,
        balance: ethers.formatUnits(balance, decimals)
      });
      
      // Check if token is approved
      setIsTokenApproved(allowance > 0n);
    } catch (error: any) {
      console.error('Error loading token info:', error);
      setError(error.message || 'Failed to load token information. Please check the token address.');
      setTokenInfo(null);
    } finally {
      setIsValidating(false);
    }
  };

  // Helper function to safely get checksummed address
  const getChecksummedAddress = (address: string): string => {
    try {
      return ethers.getAddress(address);
    } catch (error) {
      console.error('Invalid address format:', address, error);
      return address;
    }
  };

  // Helper function to safely create contract instance
  const createTokenContract = (tokenAddress: string, abi: any[], provider: any) => {
    try {
      const checksummedAddress = getChecksummedAddress(tokenAddress);
      return new ethers.Contract(checksummedAddress, abi, provider);
    } catch (error) {
      console.error('Error loading token info:', error);
      throw new Error('Invalid token address format');
    }
  };

  const calculateTotalAmount = () => {
    const total = recipients.reduce((sum, recipient) => {
      const amount = parseFloat(recipient.amount) || 0;
      return sum + amount;
    }, 0);
    
    setTotalAmount(total.toString());
    
    // Update gas estimate
    if (recipients.length > 0) {
      estimateGas();
    }
  };

  const estimateGas = async () => {
    try {
      const provider = web3Service.getProvider();
      if (!provider || !token || !tokenInfo) return;
      
      try {
        const multiSenderContract = new ethers.Contract(
          getChecksummedAddress(MULTI_SENDER_ADDRESS), 
          MultiSenderABI, 
          provider
        );
      
        // Get gas estimate from contract
        const validRecipients = recipients.filter(r => r.valid);
        if (validRecipients.length === 0) return;
      
        const gasEstimateWei = await multiSenderContract.estimateGas(validRecipients.length);
      
        // Get gas price
        const feeData = await provider.getFeeData();
        const gasPrice = feeData.gasPrice || ethers.parseUnits('50', 'gwei');
      
        // Calculate total gas cost
        const gasCost = gasEstimateWei * gasPrice;
        const gasCostEther = ethers.formatEther(gasCost);
      
        setGasEstimate(gasCostEther);
      } catch (estimateError) {
        console.error('Error in gas estimation:', estimateError);
        // Provide a fallback estimate
        setGasEstimate('0.005');
      }
    } catch (error) {
      console.error('Error estimating gas:', error);
      setGasEstimate(null);
    }
  };

  const handleAddRecipient = () => {
    setRecipients([...recipients, { address: '', amount: '', valid: false }]);
  };

  const handleRemoveRecipient = (index: number) => {
    const newRecipients = [...recipients];
    newRecipients.splice(index, 1);
    setRecipients(newRecipients);
  };

  const handleRecipientChange = (index: number, field: 'address' | 'amount', value: string) => {
    const newRecipients = [...recipients];
    newRecipients[index][field] = value;
    let isValid = true;
    
    // Validate recipient
    if (field === 'address') {
      try {
        isValid = ethers.isAddress(value);
      } catch (e) {
        isValid = false;
      }
      
      newRecipients[index].valid = isValid;
      if (!isValid) {
        newRecipients[index].error = 'Invalid address';
      } else {
        delete newRecipients[index].error;
      }
    } else if (field === 'amount') {
      const amount = parseFloat(value);
      newRecipients[index].valid = !isNaN(amount) && amount > 0;
      if (!newRecipients[index].valid) {
        newRecipients[index].error = 'Invalid amount';
      } else {
        delete newRecipients[index].error;
      }
    }
    
    setRecipients(newRecipients);
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    const file = acceptedFiles[0];
    const reader = new FileReader();
    
    reader.onload = () => {
      try {
        const csvData = reader.result as string;
        const results = Papa.parse(csvData, {
          skipEmptyLines: true
        });
        
        const newRecipients: AirdropRecipient[] = results.data.map((record: any) => {
          const address = record[0]?.trim();
          const amount = record[1]?.toString().trim();
          
          let isValidAddress = false;
          try {
            isValidAddress = ethers.isAddress(address);
          } catch (e) {
            isValidAddress = false;
          }
          
          const isValidAmount = !isNaN(parseFloat(amount)) && parseFloat(amount) > 0;
          
          return {
            address,
            amount,
            valid: isValidAddress && isValidAmount,
            error: !isValidAddress 
              ? 'Invalid address' 
              : !isValidAmount 
              ? 'Invalid amount' 
              : undefined
          };
        });
        
        setRecipients(newRecipients);
      } catch (error) {
        console.error('Error parsing CSV:', error);
        setError('Failed to parse CSV file. Please check the format.');
      }
    };
    
    reader.readAsText(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv']
    },
    maxFiles: 1
  });

  const downloadTemplate = () => {
    const csvContent = "0x742d35Cc6634C0532925a3b8D4C9db96590c6C8C,100\n0x8ba1f109551bD432803012645Ac136ddd64DBA72,200\n0xaB7C8803962c0f2F5BBBe3FA8bf41cd82AA1923C,300";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    saveAs(blob, 'airdrop_template.csv');
  };

  const handleApproveToken = async () => {
    if (!isConnected || !address || !token || !tokenInfo) return;
    
    setIsApproving(true);
    setError(null);
    
    try {
      const signer = web3Service.getSigner();
      if (!signer) throw new Error('Wallet connection issue');
      
      try {
        // Calculate total amount to approve (with some buffer)
        const totalAmountWei = ethers.parseUnits(
          (parseFloat(totalAmount) * 1.1).toString(), // 10% buffer
          tokenInfo.decimals
        );
        
        // Approve token spending
        const tokenContract = createTokenContract(
          token,
          ['function approve(address spender, uint256 amount) returns (bool)'],
          signer
        );
        
        const approveTx = await tokenContract.approve(getChecksummedAddress(MULTI_SENDER_ADDRESS), totalAmountWei);
        await approveTx.wait();
        
        setIsTokenApproved(true);
        setSuccess('Token approved for airdrop!');
      } catch (error: any) {
        console.error('Error approving token:', error);
        setError(error.message || 'Failed to approve token');
        throw error;
      }
    } catch (error) {
      console.error('Error approving token:', error);
      setError((error as Error).message || 'Failed to approve token');
    } finally {
      setIsApproving(false);
    }
  };

  const handleSendAirdrop = async () => {
    if (!isConnected || !address || !token || !tokenInfo || !isTokenApproved) return;
    
    // Validate recipients
    const validRecipients = recipients.filter(r => r.valid);
    if (validRecipients.length === 0) {
      setError('No valid recipients found');
      return;
    }
    
    setIsSending(true);
    setError(null);
    setSuccess(null);
    setTxHash(null);
    
    try {
      const signer = web3Service.getSigner();
      if (!signer) throw new Error('Wallet connection issue');
      
      try {
        // Prepare recipient addresses and amounts
        const recipientAddresses = validRecipients.map(r => getChecksummedAddress(r.address));
        const recipientAmounts = validRecipients.map(r => 
          ethers.parseUnits(r.amount || '0', tokenInfo.decimals)
        );
        
        // Send airdrop
        const multiSenderContract = new ethers.Contract(
          getChecksummedAddress(MULTI_SENDER_ADDRESS), 
          MultiSenderABI, 
          signer
        );
        
        const tx = await multiSenderContract.multiSend(
          getChecksummedAddress(token),
          recipientAddresses,
          recipientAmounts
        );
        
        const receipt = await tx.wait();
        
        setTxHash(tx.hash);
        setSuccess(`Airdrop sent successfully to ${validRecipients.length} recipients!`);
      } catch (error: any) {
        console.error('Error sending airdrop:', error);
        setError(error.message || 'Failed to send airdrop');
        throw error;
      }
    } catch (error) {
      console.error('Error sending airdrop:', error);
      setError((error as Error).message || 'Failed to send airdrop');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => window.location.href = '/'}
            className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </button>
          <h1 className="text-3xl font-bold text-white mb-2">Token Airdrop</h1>
          <p className="text-gray-300">Send tokens to multiple addresses in a single transaction</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Token Selection */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <h2 className="text-xl font-semibold text-white mb-4">Select Token</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Token Address
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0x..."
                    />
                    <button
                      onClick={loadTokenInfo}
                      disabled={!token || isValidating}
                      className="px-4 py-3 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors text-sm disabled:opacity-50"
                    >
                      {isValidating ? 'Loading...' : 'Load'}
                    </button>
                  </div>
                </div>
                
                {tokenInfo && (
                  <div className="bg-blue-500/20 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-gray-300">Token Name</div>
                        <div className="text-white font-medium">{tokenInfo.name}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-300">Symbol</div>
                        <div className="text-white font-medium">{tokenInfo.symbol}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-300">Decimals</div>
                        <div className="text-white font-medium">{tokenInfo.decimals}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-300">Your Balance</div>
                        <div className="text-white font-medium">
                          {parseFloat(tokenInfo.balance).toLocaleString()} {tokenInfo.symbol}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Recipients */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">Recipients</h2>
                
                <div className="flex space-x-2">
                  <button
                    onClick={downloadTemplate}
                    className="px-3 py-1 bg-white/10 text-gray-300 rounded-lg hover:bg-white/20 transition-colors text-sm flex items-center space-x-1"
                  >
                    <Download className="w-3 h-3" />
                    <span>Template</span>
                  </button>
                  <button
                    onClick={handleAddRecipient}
                    className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors text-sm flex items-center space-x-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add</span>
                  </button>
                </div>
              </div>
              
              {/* CSV Upload */}
              <div 
                {...getRootProps()} 
                className={`border-2 border-dashed rounded-lg p-6 mb-6 text-center cursor-pointer transition-colors ${
                  isDragActive 
                    ? 'border-blue-500 bg-blue-500/10' 
                    : 'border-white/20 hover:border-white/40'
                }`}
              >
                <input {...getInputProps()} />
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-300">
                  {isDragActive
                    ? 'Drop the CSV file here...'
                    : 'Drag & drop a CSV file, or click to select'}
                </p>
                <p className="text-gray-400 text-sm mt-2">
                  Format: address,amount (one per line)
                </p>
              </div>
              
              {/* Manual Entry */}
              <div className="space-y-3">
                {recipients.map((recipient, index) => (
                  <div key={index} className="flex space-x-2">
                    <input
                      type="text"
                      value={recipient.address}
                      onChange={(e) => handleRecipientChange(index, 'address', e.target.value)}
                      className={`flex-1 bg-white/10 border rounded-lg px-3 py-2 text-white text-sm ${
                        recipient.address && !recipient.valid && recipient.error?.includes('address')
                          ? 'border-red-500/50'
                          : 'border-white/20'
                      }`}
                      placeholder="Recipient Address"
                    />
                    <input
                      type="text"
                      value={recipient.amount}
                      onChange={(e) => handleRecipientChange(index, 'amount', e.target.value)}
                      className={`w-32 bg-white/10 border rounded-lg px-3 py-2 text-white text-sm ${
                        recipient.amount && !recipient.valid && recipient.error?.includes('amount')
                          ? 'border-red-500/50'
                          : 'border-white/20'
                      }`}
                      placeholder="Amount"
                    />
                    <button
                      onClick={() => handleRemoveRecipient(index)}
                      disabled={recipients.length === 1}
                      className="p-2 text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              
              {recipients.some(r => r.address && !r.valid) && (
                <div className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5" />
                    <p className="text-red-400 text-sm">
                      Some recipients have invalid addresses or amounts. Please fix them before proceeding.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Airdrop Summary */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 sticky top-6">
              <h3 className="text-lg font-semibold text-white mb-4">Airdrop Summary</h3>
              
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-300">Token</span>
                  <span className="text-white font-medium">
                    {tokenInfo ? tokenInfo.symbol : '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Recipients</span>
                  <span className="text-white font-medium">
                    {recipients.filter(r => r.valid).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Total Amount</span>
                  <span className="text-white font-medium">
                    {parseFloat(totalAmount).toLocaleString()} {tokenInfo?.symbol || ''}
                  </span>
                </div>
                {gasEstimate && (
                  <div className="flex justify-between">
                    <span className="text-gray-300">Estimated Gas</span>
                    <span className="text-white font-medium">
                      ~{parseFloat(gasEstimate).toFixed(6)} ETH
                    </span>
                  </div>
                )}
                
                <div className="border-t border-white/20 pt-4">
                  {tokenInfo && !isTokenApproved ? (
                    <button
                      onClick={handleApproveToken}
                      disabled={isApproving || !tokenInfo || parseFloat(totalAmount) <= 0}
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50"
                    >
                      {isApproving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Approving...</span>
                        </>
                      ) : (
                        <>
                          <span>Approve Token</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={handleSendAirdrop}
                      disabled={
                        isSending || 
                        !tokenInfo || 
                        !isTokenApproved || 
                        recipients.filter(r => r.valid).length === 0 ||
                        parseFloat(totalAmount) <= 0
                      }
                      className="w-full bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50"
                    >
                      {isSending ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Sending...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Send Airdrop</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
              
              {error && (
                <div className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5" />
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                </div>
              )}
              
              {success && (
                <div className="mt-4 p-3 bg-green-500/20 border border-green-500/50 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                    <div>
                      <p className="text-green-400 text-sm">{success}</p>
                      {txHash && (
                        <div className="flex items-center mt-2 space-x-2">
                          <code className="text-xs text-green-300 font-mono bg-green-500/10 px-2 py-1 rounded">
                            {txHash.slice(0, 10)}...{txHash.slice(-8)}
                          </code>
                          <button
                            onClick={() => navigator.clipboard.writeText(txHash)}
                            className="p-1 text-green-400 hover:text-green-300 transition-colors"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Instructions */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4">Instructions</h3>
              
              <ol className="space-y-3 text-gray-300 text-sm list-decimal list-inside">
                <li>Enter the token contract address</li>
                <li>Add recipient addresses and amounts manually or upload a CSV file</li>
                <li>Approve the token for airdrop (one-time per token)</li>
                <li>Review the summary and send the airdrop</li>
              </ol>
              
              <div className="mt-4 p-3 bg-blue-500/20 border border-blue-500/50 rounded-lg">
                <p className="text-blue-300 text-sm">
                  <strong>Tip:</strong> Using the multi-sender saves gas compared to individual transfers. 
                  The larger the batch, the more gas-efficient it becomes.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};