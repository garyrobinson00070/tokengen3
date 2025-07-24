const { query } = require('../index');

// Create a new presale
async function createPresale(presale) {
  const sql = `
    INSERT INTO presales (
      contract_address, token_address, owner_address, sale_type, token_info, sale_configuration,
      vesting_config, wallet_setup, network_id, network_name, network_chain_id, status,
      transaction_hash, total_raised, participant_count, verified, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
  `;
  await query(sql, [
    presale.contractAddress.toLowerCase(),
    presale.tokenAddress.toLowerCase(),
    presale.owner.toLowerCase(),
    presale.saleType,
    JSON.stringify(presale.tokenInfo || {}),
    JSON.stringify(presale.saleConfiguration || {}),
    JSON.stringify(presale.vestingConfig || {}),
    JSON.stringify(presale.walletSetup || {}),
    presale.network?.id || null,
    presale.network?.name || null,
    presale.network?.chainId || null,
    presale.status || 'upcoming',
    presale.transactionHash,
    presale.totalRaised || '0',
    presale.participantCount || 0,
    presale.verified || false
  ]);
}

// Find presale by contract address
async function findPresaleByAddress(address) {
  const sql = `SELECT * FROM presales WHERE contract_address = ? LIMIT 1`;
  const result = await query(sql, [address.toLowerCase()]);
  return result.rows[0] || null;
}

// Find presales by owner
async function findPresalesByOwner(owner) {
  const sql = `SELECT * FROM presales WHERE owner_address = ? ORDER BY created_at DESC`;
  const result = await query(sql, [owner.toLowerCase()]);
  return result.rows;
}

// Update presale status
async function updatePresaleStatus(address, status) {
  const sql = `UPDATE presales SET status = ? WHERE contract_address = ?`;
  await query(sql, [status, address.toLowerCase()]);
}

// Update presale statistics
async function updatePresaleStats(address, { totalRaised, participantCount }) {
  const sql = `
    UPDATE presales SET 
      total_raised = ?, 
      participant_count = ?, 
      last_updated = NOW()
    WHERE contract_address = ?
  `;
  await query(sql, [totalRaised, participantCount, address.toLowerCase()]);
}

// Update presale verification
async function setPresaleVerified(address, verified = true) {
  const sql = `UPDATE presales SET verified = ? WHERE contract_address = ?`;
  await query(sql, [verified, address.toLowerCase()]);
}

module.exports = {
  createPresale,
  findPresaleByAddress,
  findPresalesByOwner,
  updatePresaleStatus,
  updatePresaleStats,
  setPresaleVerified
};
