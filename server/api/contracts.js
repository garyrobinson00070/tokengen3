// All SQL queries now use ? placeholders for MySQL compatibility

const express = require('express');
const fs = require('fs');
const path = require('path');
const { ethers } = require('ethers');
const { authenticate } = require('../middleware/auth');
const { query } = require('../db');

const router = express.Router();

// Get user's deployed contracts
router.get('/deployed', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get tokens from database
    const tokensResult = await query(
      'SELECT * FROM tokens WHERE owner_address = ? ORDER BY created_at DESC',
      [userId]
    );

    // Get presales from database
    const presalesResult = await query(
      'SELECT * FROM presales WHERE owner_address = ? ORDER BY created_at DESC',
      [userId]
    );

    // Format tokens
    const tokens = tokensResult.rows.map(token => ({
      id: token.contract_address,
      contractAddress: token.contract_address,
      transactionHash: token.transaction_hash,
      contractType: token.contract_type,
      network: {
        id: token.network_id,
        name: token.network_name,
        chainId: token.network_chain_id
      },
      timestamp: token.created_at,
      verified: token.verified,
      name: token.name,
      symbol: token.symbol,
      decimals: token.decimals,
      totalSupply: token.initial_supply,
      maxSupply: token.max_supply || '0',
      features: token.features
    }));

    // Format presales
    const presales = presalesResult.rows.map(presale => {
      const now = new Date();
      const saleConfig = presale.sale_configuration;
      const startDate = saleConfig.startDate ? new Date(saleConfig.startDate) : new Date(Date.now() + 86400000);
      const endDate = saleConfig.endDate ? new Date(saleConfig.endDate) : new Date(Date.now() + 14 * 86400000);

      let status = presale.status || 'upcoming';
      if (status === 'upcoming' && now >= startDate && now <= endDate) {
        status = 'live';
      } else if (status === 'upcoming' && now > endDate) {
        status = 'ended';
      }

      return {
        id: presale.contract_address,
        contractAddress: presale.contract_address,
        transactionHash: presale.transaction_hash,
        network: {
          id: presale.network_id,
          name: presale.network_name,
          chainId: presale.network_chain_id
        },
        timestamp: presale.created_at,
        verified: presale.verified,
        presaleConfig: {
          tokenInfo: presale.token_info,
          saleConfiguration: presale.sale_configuration,
          vestingConfig: presale.vesting_config,
          walletSetup: presale.wallet_setup,
          saleType: presale.sale_type
        },
        tokenName: presale.token_info?.tokenName || 'Unknown',
        tokenSymbol: presale.token_info?.tokenSymbol || 'UNK',
        saleName: presale.sale_configuration?.saleName || 'Unknown Sale',
        saleType: presale.sale_type || 'presale',
        status: status,
        totalRaised: presale.total_raised || '0',
        participantCount: presale.participant_count || 0
      };
    });

    res.json({
      tokens,
      presales
    });

  } catch (error) {
    console.error('Error fetching deployed contracts:', error);
    res.status(500).json({ error: 'Failed to fetch contracts', details: error.message });
  }
});

// Get specific contract details
router.get('/:address', authenticate, async (req, res) => {
  try {
    const { address } = req.params;
    const userId = req.user.id;

    // Check if token exists
    const tokenResult = await query(
      'SELECT * FROM tokens WHERE contract_address = ?',
      [address.toLowerCase()]
    );

    if (tokenResult.rows.length > 0) {
      const token = tokenResult.rows[0];

      // Check if this token belongs to the user
      if (token.owner_address.toLowerCase() !== userId.toLowerCase()) {
        return res.status(403).json({ error: 'Access denied' });
      }

      return res.json({
        contractType: token.contract_type,
        contractAddress: token.contract_address,
        transactionHash: token.transaction_hash,
        network: {
          id: token.network_id,
          name: token.network_name,
          chainId: token.network_chain_id
        },
        timestamp: token.created_at,
        verified: token.verified,
        name: token.name,
        symbol: token.symbol,
        decimals: token.decimals,
        totalSupply: token.initial_supply,
        maxSupply: token.max_supply || '0',
        features: token.features,
        owner: token.owner_address
      });
    }

    // Check if presale exists
    const presaleResult = await query(
      'SELECT * FROM presales WHERE contract_address = ?',
      [address.toLowerCase()]
    );

    if (presaleResult.rows.length > 0) {
      const presale = presaleResult.rows[0];

      // Check if this presale belongs to the user
      if (presale.owner_address.toLowerCase() !== userId.toLowerCase()) {
        return res.status(403).json({ error: 'Access denied' });
      }

      return res.json({
        contractType: 'PresaleContract',
        contractAddress: presale.contract_address,
        tokenAddress: presale.token_address,
        transactionHash: presale.transaction_hash,
        network: {
          id: presale.network_id,
          name: presale.network_name,
          chainId: presale.network_chain_id
        },
        timestamp: presale.created_at,
        verified: presale.verified,
        presaleConfig: {
          tokenInfo: presale.token_info,
          saleConfiguration: presale.sale_configuration,
          vestingConfig: presale.vesting_config,
          walletSetup: presale.wallet_setup,
          saleType: presale.sale_type
        },
        owner: presale.owner_address,
        status: presale.status,
        totalRaised: presale.total_raised,
        participantCount: presale.participant_count
      });
    }

    res.status(404).json({ error: 'Contract not found' });

  } catch (error) {
    console.error('Error fetching contract details:', error);
    res.status(500).json({ error: 'Failed to fetch contract details', details: error.message });
  }
});

// Get token statistics from blockchain
router.get('/:address/stats', authenticate, async (req, res) => {
  try {
    const { address } = req.params;
    const networkParam = req.query.network;
    const userId = req.user.id;

    // Verify the contract exists
    const tokenResult = await query(
      'SELECT * FROM tokens WHERE contract_address = ?',
      [address.toLowerCase()]
    );

    if (tokenResult.rows.length === 0) {
      return res.status(404).json({ error: 'Token not found' });
    }

    const token = tokenResult.rows[0];

    // Get network information
    const networkName = networkParam || token.network_id || 'ethereum';

    // Connect to the appropriate blockchain network
    const rpcUrl = process.env[`${networkName.toUpperCase()}_RPC_URL`];
    if (!rpcUrl) {
      return res.status(400).json({ error: `RPC URL not configured for network: ${networkName}` });
    }

    const provider = new ethers.JsonRpcProvider(rpcUrl);

    // Basic ERC20 ABI for statistics
    const tokenABI = [
      'function totalSupply() view returns (uint256)',
      'function balanceOf(address) view returns (uint256)',
      'function decimals() view returns (uint8)',
      'function name() view returns (string)',
      'function symbol() view returns (string)'
    ];

    const tokenContract = new ethers.Contract(address, tokenABI, provider);

    // Get token data
    try {
      const [totalSupply, decimals, name, symbol] = await Promise.all([
        tokenContract.totalSupply(),
        tokenContract.decimals(),
        tokenContract.name().catch(() => 'Unknown'),
        tokenContract.symbol().catch(() => 'UNK')
      ]);

      // Get transfer events to estimate holder count
      const transferFilter = {
        address: address,
        topics: [ethers.id('Transfer(address,address,uint256)')]
      };

      const events = await provider.getLogs({
        ...transferFilter,
        fromBlock: -10000,
        toBlock: 'latest'
      });

      // Estimate unique addresses from transfer events
      const uniqueAddresses = new Set();
      events.forEach(event => {
        if (event.topics.length >= 3) {
          const from = '0x' + event.topics[1].slice(26);
          const to = '0x' + event.topics[2].slice(26);
          if (from !== ethers.ZeroAddress) uniqueAddresses.add(from.toLowerCase());
          if (to !== ethers.ZeroAddress) uniqueAddresses.add(to.toLowerCase());
        }
      });

      // Update token statistics in database
      try {
        await query(
          `UPDATE tokens SET 
           total_supply = ?, 
           holders_count = ?, 
           transfer_count = ?, 
           last_updated = CURRENT_TIMESTAMP 
           WHERE contract_address = ?`,
          [
            ethers.formatUnits(totalSupply, decimals),
            uniqueAddresses.size,
            events.length,
            address.toLowerCase()
          ]
        );
      } catch (dbError) {
        console.error('Error updating token statistics in database:', dbError);
      }

      // Return token statistics
      const stats = {
        holders: uniqueAddresses.size,
        transfers: events.length,
        totalSupply: ethers.formatUnits(totalSupply, decimals),
        name,
        symbol,
        decimals,
        lastUpdated: new Date().toISOString()
      };

      res.json(stats);
    } catch (contractError) {
      console.error('Error querying token contract:', contractError);

      const stats = {
        holders: 0,
        transfers: 0,
        totalSupply: '0',
        lastUpdated: new Date().toISOString(),
        error: 'Failed to query contract data',
        details: contractError.message
      };

      res.json(stats);
    }

  } catch (error) {
    console.error('Error fetching token statistics:', error);
    res.status(500).json({ error: 'Failed to fetch token statistics', details: error.message });
  }
});

// Get all public presales (for explorer)
router.get('/presales/public', async (req, res) => {
  try {
    // Get public presales from database
    const presalesResult = await query(
      `SELECT * FROM presales 
       WHERE sale_type = ? 
       ORDER BY created_at DESC`,
      ['presale']
    );

    // Format presales
    const presales = presalesResult.rows.map(presale => {
      const now = new Date();
      const saleConfig = presale.sale_configuration;
      const startDate = saleConfig.startDate ? new Date(saleConfig.startDate) : new Date(Date.now() + 86400000);
      const endDate = saleConfig.endDate ? new Date(saleConfig.endDate) : new Date(Date.now() + 14 * 86400000);

      let status = presale.status || 'upcoming';
      if (status === 'upcoming' && now >= startDate && now <= endDate) {
        status = 'live';
      } else if (status === 'upcoming' && now > endDate) {
        status = 'ended';
      }

      return {
        id: presale.contract_address,
        contractAddress: presale.contract_address,
        network: {
          id: presale.network_id,
          name: presale.network_name,
          chainId: presale.network_chain_id
        },
        timestamp: presale.created_at,
        tokenName: presale.token_info?.tokenName || 'Unknown',
        tokenSymbol: presale.token_info?.tokenSymbol || 'UNK',
        saleName: presale.sale_configuration?.saleName || 'Unknown Sale',
        saleType: presale.sale_type || 'presale',
        softCap: presale.sale_configuration?.softCap || '0',
        hardCap: presale.sale_configuration?.hardCap || '0',
        tokenPrice: presale.sale_configuration?.tokenPrice || '0',
        startDate: presale.sale_configuration?.startDate,
        endDate: presale.sale_configuration?.endDate,
        status: status,
        totalRaised: presale.total_raised || '0',
        participantCount: presale.participant_count || 0
      };
    });

    res.json(presales);

  } catch (error) {
    console.error('Error fetching public presales:', error);
    res.status(500).json({ error: 'Failed to fetch presales', details: error.message });
  }
});

// Get presale contract statistics
router.get('/presale/:address/stats', authenticate, async (req, res) => {
  try {
    const { address } = req.params;
    const networkParam = req.query.network;

    // Verify the presale contract exists
    const presaleResult = await query(
      'SELECT * FROM presales WHERE contract_address = ?',
      [address.toLowerCase()]
    );

    if (presaleResult.rows.length === 0) {
      return res.status(404).json({ error: 'Presale contract not found' });
    }

    const presale = presaleResult.rows[0];

    // Get network information
    const networkName = networkParam || presale.network_id || 'ethereum';

    // Connect to the appropriate blockchain network
    const rpcUrl = process.env[`${networkName.toUpperCase()}_RPC_URL`];
    if (!rpcUrl) {
      return res.status(400).json({ error: `RPC URL not configured for network: ${networkName}` });
    }

    const provider = new ethers.JsonRpcProvider(rpcUrl);

    // Presale contract ABI for statistics
    const presaleABI = [
      'function getSaleStats() view returns (uint256 _totalRaised, uint256 _totalParticipants, uint256 _totalTokensSold, bool _softCapReached, bool _hardCapReached, uint256 _timeRemaining)',
      'function saleInfo() view returns (address token, uint256 tokenPrice, uint256 softCap, uint256 hardCap, uint256 minPurchase, uint256 maxPurchase, uint256 startTime, uint256 endTime, bool whitelistEnabled)',
      'function saleFinalized() view returns (bool)',
      'function vestingInfo() view returns (bool enabled, uint256 initialRelease, uint256 vestingDuration)'
    ];

    const presaleContract = new ethers.Contract(address, presaleABI, provider);

    try {
      // Get presale data
      const [saleStats, saleInfo, isFinalized, vestingInfo] = await Promise.all([
        presaleContract.getSaleStats(),
        presaleContract.saleInfo(),
        presaleContract.saleFinalized(),
        presaleContract.vestingInfo().catch(() => ({ enabled: false, initialRelease: 0, vestingDuration: 0 }))
      ]);

      // Calculate status based on contract data
      const now = Math.floor(Date.now() / 1000);
      let status = 'upcoming';

      if (isFinalized) {
        status = 'ended';
      } else if (now >= Number(saleInfo.startTime) && now <= Number(saleInfo.endTime)) {
        status = 'live';
      } else if (now > Number(saleInfo.endTime)) {
        status = 'ended';
      }

      // Update presale statistics in database
      try {
        await query(
          `UPDATE presales SET 
           status = ?, 
           total_raised = ?, 
           participant_count = ?, 
           last_updated = CURRENT_TIMESTAMP 
           WHERE contract_address = ?`,
          [
            status,
            ethers.formatEther(saleStats[0]),
            Number(saleStats[1]),
            address.toLowerCase()
          ]
        );
      } catch (dbError) {
        console.error('Error updating presale statistics in database:', dbError);
      }

      // Return presale statistics
      const stats = {
        totalRaised: ethers.formatEther(saleStats[0]),
        participantCount: Number(saleStats[1]),
        totalTokensSold: ethers.formatEther(saleStats[2]),
        softCapReached: saleStats[3],
        hardCapReached: saleStats[4],
        status: status,
        vestingEnabled: vestingInfo.enabled,
        initialRelease: Number(vestingInfo.initialRelease),
        vestingDuration: Number(vestingInfo.vestingDuration),
        isFinalized,
        lastUpdated: new Date().toISOString()
      };

      res.json(stats);
    } catch (contractError) {
      console.error('Error querying presale contract:', contractError);

      let status = 'upcoming';
      if (presale.sale_configuration) {
        const now = new Date();
        const startDate = presale.sale_configuration.startDate ? new Date(presale.sale_configuration.startDate) : new Date(Date.now() + 86400000);
        const endDate = presale.sale_configuration.endDate ? new Date(presale.sale_configuration.endDate) : new Date(Date.now() + 14 * 86400000);

        if (now >= startDate && now <= endDate) {
          status = 'live';
        } else if (now > endDate) {
          status = 'ended';
        }
      }

      const stats = {
        totalRaised: presale.total_raised || '0',
        participantCount: presale.participant_count || 0,
        totalTokensSold: '0',
        softCapReached: false,
        hardCapReached: false,
        status: status,
        lastUpdated: new Date().toISOString(),
        error: 'Failed to query contract data',
        details: contractError.message
      };

      res.json(stats);
    }

  } catch (error) {
    console.error('Error fetching presale stats:', error);
    res.status(500).json({ error: 'Failed to fetch presale statistics', details: error.message });
  }
});

// Register a contract deployed via fallback method
router.post('/register', authenticate, async (req, res) => {
  try {
    const { 
      contractType, 
      contractAddress, 
      transactionHash, 
      network, 
      name, 
      symbol, 
      decimals, 
      initialSupply, 
      maxSupply, 
      features,
      deploymentMethod = 'fallback'
    } = req.body;

    const userId = req.user.id;

    // Validate required fields
    if (!contractAddress || !contractType || !transactionHash || !network) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if contract already exists
    const existingContract = await query(
      'SELECT * FROM tokens WHERE contract_address = ?',
      [contractAddress.toLowerCase()]
    );

    if (existingContract.rows.length > 0) {
      return res.status(400).json({ error: 'Contract already registered' });
    }

    // Save contract to database
    const result = await query(
      `INSERT INTO tokens 
      (contract_address, contract_type, name, symbol, decimals, initial_supply, max_supply, 
       owner_address, network_id, network_name, network_chain_id, transaction_hash, verified, features, deployment_method) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        contractAddress.toLowerCase(),
        contractType,
        name,
        symbol,
        decimals,
        initialSupply,
        maxSupply || '0',
        userId,
        network,
        network,
        getChainId(network),
        transactionHash,
        false,
        JSON.stringify(features),
        deploymentMethod
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error registering contract:', error);
    res.status(500).json({ error: 'Failed to register contract', details: error.message });
  }
});

// Helper function to get chain ID for network
function getChainId(network) {
  const chainIds = {
    'ethereum': 1,
    'bsc': 56,
    'polygon': 137,
    'arbitrum': 42161,
    'fantom': 250,
    'avalanche': 43114,
    'goerli': 5,
    'bsc-testnet': 97,
    'mumbai': 80001,
    'arbitrum-sepolia': 421614,
    'estar-testnet': 25062019
  };

  return chainIds[network] || 1;
}

module.exports = router;
