const { query } = require('../index');

// Create a new user
async function createUser({ address, nonce }) {
  const sql = `
    INSERT INTO users (address, nonce, last_login, esr_balance, esr_last_checked, created_at)
    VALUES (?, ?, NOW(), 0, NULL, NOW())
  `;
  await query(sql, [address.toLowerCase(), nonce]);
}

// Find user by address
async function findUserByAddress(address) {
  const sql = `SELECT * FROM users WHERE address = ? LIMIT 1`;
  const result = await query(sql, [address.toLowerCase()]);
  return result.rows[0] || null;
}

// Update user's nonce
async function updateNonce(address, nonce) {
  const sql = `UPDATE users SET nonce = ? WHERE address = ?`;
  await query(sql, [nonce, address.toLowerCase()]);
}

// Update user's last login
async function updateLastLogin(address) {
  const sql = `UPDATE users SET last_login = NOW() WHERE address = ?`;
  await query(sql, [address.toLowerCase()]);
}

// Update ESR balance and last checked
async function updateEsrBalance(address, esrBalance) {
  const sql = `UPDATE users SET esr_balance = ?, esr_last_checked = NOW() WHERE address = ?`;
  await query(sql, [esrBalance, address.toLowerCase()]);
}

// Get user's deployments (tokens and presales)
async function getUserDeployments(address) {
  const tokensSql = `SELECT * FROM tokens WHERE owner_address = ? ORDER BY created_at DESC`;
  const presalesSql = `SELECT * FROM presales WHERE owner_address = ? ORDER BY created_at DESC`;
  const [tokens, presales] = await Promise.all([
    query(tokensSql, [address.toLowerCase()]),
    query(presalesSql, [address.toLowerCase()])
  ]);
  return {
    tokens: tokens.rows,
    presales: presales.rows
  };
}

module.exports = {
  createUser,
  findUserByAddress,
  updateNonce,
  updateLastLogin,
  updateEsrBalance,
  getUserDeployments
};
