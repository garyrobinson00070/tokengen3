const { query } = require('../index');

// Create a new token
async function createToken(token) {
  const sql = `
    INSERT INTO tokens (
      contract_address, contract_type, name, symbol, decimals, initial_supply, max_supply,
      owner_address, network_id, network_name, network_chain_id, transaction_hash, verified, features, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
  `;
  await query(sql, [
    token.contractAddress.toLowerCase(),
    token.contractType,
    token.name,
    token.symbol,
    token.decimals,
    token.initialSupply,
    token.maxSupply || '0',
    token.owner.toLowerCase(),
    token.network?.id || null,
    token.network?.name || null,
    token.network?.chainId || null,
    token.transactionHash,
    token.verified || false,
    JSON.stringify(token.features || {})
  ]);
}

// Find token by contract address
async function findTokenByAddress(address) {
  const sql = `SELECT * FROM tokens WHERE contract_address = ? LIMIT 1`;
  const result = await query(sql, [address.toLowerCase()]);
  return result.rows[0] || null;
}

// Find tokens by owner
async function findTokensByOwner(owner) {
  const sql = `SELECT * FROM tokens WHERE owner_address = ? ORDER BY created_at DESC`;
  const result = await query(sql, [owner.toLowerCase()]);
  return result.rows;
}

// Update token verification status
async function setTokenVerified(address, verified = true) {
  const sql = `UPDATE tokens SET verified = ? WHERE contract_address = ?`;
  await query(sql, [verified, address.toLowerCase()]);
}

// Update token features
async function updateTokenFeatures(address, features) {
  const sql = `UPDATE tokens SET features = ? WHERE contract_address = ?`;
  await query(sql, [JSON.stringify(features), address.toLowerCase()]);
}

// Update token statistics
async function updateTokenStats(address, { totalSupply, holdersCount, transferCount }) {
  const sql = `
    UPDATE tokens SET 
      total_supply = ?, 
      holders_count = ?, 
      transfer_count = ?, 
      last_updated = NOW()
    WHERE contract_address = ?
  `;
  await query(sql, [totalSupply, holdersCount, transferCount, address.toLowerCase()]);
}

module.exports = {
  createToken,
  findTokenByAddress,
  findTokensByOwner,
  setTokenVerified,
  updateTokenFeatures,
  updateTokenStats
};
