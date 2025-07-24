/* ... (imports unchanged) ... */

// Deploy token contract
router.post('/token', authenticate, validateTokenConfig, async (req, res) => {
  try {
    // ... (logic unchanged) ...
    if (!network.includes('testnet') && !network.includes('goerli') && !network.includes('sepolia')) {
      try {
        const userResult = await query(
          'SELECT esr_balance FROM users WHERE address = ?',
          [userId]
        );
        // ... (rest unchanged) ...
      } catch (balanceError) {
        // ... (error handling unchanged) ...
      }
    }
    // ... (deployment logic unchanged) ...
    try {
      await query(
        `INSERT INTO tokens 
        (contract_address, contract_type, name, symbol, decimals, initial_supply, max_supply, 
         owner_address, network_id, network_name, network_chain_id, transaction_hash, verified, features) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          result.contractAddress.toLowerCase(),
          contractType,
          constructorArgs[0],
          constructorArgs[1],
          constructorArgs[2],
          constructorArgs[3],
          constructorArgs[4],
          userId,
          network,
          network,
          getChainId(network),
          result.transactionHash,
          result.verified || false,
          JSON.stringify({
            burnable: contractType.includes('Burnable'),
            mintable: contractType.includes('Mintable'),
            transferFees: contractType.includes('Fee') ? {
              enabled: true,
              percentage: constructorArgs[5] / 100,
              recipient: constructorArgs[6]
            } : {
              enabled: false,
              percentage: 0,
              recipient: ''
            },
            holderRedistribution: contractType.includes('Redistribution') ? {
              enabled: true,
              percentage: contractType.includes('Advanced') ? constructorArgs[7] / 100 : constructorArgs[5] / 100
            } : {
              enabled: false,
              percentage: 0
            }
          })
        ]
      );
    } catch (dbError) {
      // ... (error handling unchanged) ...
    }
    // ... (rest unchanged) ...
  } catch (error) {
    // ... (error handling unchanged) ...
  }
});

// ... (repeat for all other queries in this file, ensuring all use ? placeholders) ...

module.exports = router;
