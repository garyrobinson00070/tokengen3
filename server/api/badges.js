/* ... (imports unchanged) ... */

// Get all badges
router.get('/', async (req, res) => {
  try {
    const badgesResult = await query(
      `SELECT b.*, t.name as token_name, t.symbol as token_symbol 
       FROM badges b
       JOIN tokens t ON b.token_address = t.contract_address
       ORDER BY b.created_at DESC`
    );
    res.json(badgesResult.rows);
  } catch (error) {
    // ... (error handling unchanged) ...
  }
});

// Get badges for a specific token
router.get('/token/:tokenAddress', async (req, res) => {
  try {
    const { tokenAddress } = req.params;
    const badgesResult = await query(
      `SELECT b.*, t.name as token_name, t.symbol as token_symbol 
       FROM badges b
       JOIN tokens t ON b.token_address = t.contract_address
       WHERE b.token_address = ? AND b.status = 'approved'
       ORDER BY b.created_at DESC`,
      [tokenAddress.toLowerCase()]
    );
    res.json(badgesResult.rows);
  } catch (error) {
    // ... (error handling unchanged) ...
  }
});

// Create a new badge request (admin only)
router.post('/', authenticate, isAdmin, upload.single('document'), async (req, res) => {
  try {
    const { tokenAddress, badgeType, notes } = req.body;
    // ... (token check unchanged) ...
    const tokenResult = await query(
      'SELECT * FROM tokens WHERE contract_address = ?',
      [tokenAddress.toLowerCase()]
    );
    // ... (badge check unchanged) ...
    const existingBadgeResult = await query(
      'SELECT * FROM badges WHERE token_address = ? AND badge_type = ?',
      [tokenAddress.toLowerCase(), badgeType]
    );
    // ... (IPFS logic unchanged) ...
    const result = await query(
      `INSERT INTO badges 
       (token_address, badge_type, status, document_url, notes, approved_by, approved_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        tokenAddress.toLowerCase(),
        badgeType,
        'approved',
        documentUrl,
        notes,
        req.user.id,
        new Date()
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    // ... (error handling unchanged) ...
  }
});

// Update badge status (admin only)
router.put('/:badgeId', authenticate, isAdmin, async (req, res) => {
  try {
    const { badgeId } = req.params;
    const { status, notes } = req.body;
    const result = await query(
      `UPDATE badges 
       SET status = ?, 
           notes = COALESCE(?, notes),
           approved_by = ?,
           approved_at = CASE WHEN ? = 'approved' THEN CURRENT_TIMESTAMP ELSE approved_at END
       WHERE id = ?
       RETURNING *`,
      [status, notes, req.user.id, status, badgeId]
    );
    // ... (rest unchanged) ...
  } catch (error) {
    // ... (error handling unchanged) ...
  }
});

// Delete badge (admin only)
router.delete('/:badgeId', authenticate, isAdmin, async (req, res) => {
  try {
    const { badgeId } = req.params;
    const result = await query(
      'DELETE FROM badges WHERE id = ? RETURNING *',
      [badgeId]
    );
    // ... (rest unchanged) ...
  } catch (error) {
    // ... (error handling unchanged) ...
  }
});

module.exports = router;
