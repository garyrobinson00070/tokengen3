/* ... (imports unchanged) ... */

// Get all proposals for a token
router.get('/token/:tokenAddress', async (req, res) => {
  try {
    const { tokenAddress } = req.params;
    const proposalsResult = await query(
      `SELECT p.*, 
              u.address as creator_address,
              t.name as token_name, 
              t.symbol as token_symbol,
              (SELECT COUNT(*) FROM governance_votes WHERE proposal_id = p.id) as vote_count
       FROM governance_proposals p
       JOIN tokens t ON p.token_address = t.contract_address
       JOIN users u ON p.creator = u.address
       WHERE p.token_address = ?
       ORDER BY p.created_at DESC`,
      [tokenAddress.toLowerCase()]
    );
    res.json(proposalsResult.rows);
  } catch (error) {
    // ... (error handling unchanged) ...
  }
});

// Get a specific proposal with votes
router.get('/proposal/:proposalId', async (req, res) => {
  try {
    const { proposalId } = req.params;
    const proposalResult = await query(
      `SELECT p.*, 
              u.address as creator_address,
              t.name as token_name, 
              t.symbol as token_symbol,
              t.contract_address as token_address
       FROM governance_proposals p
       JOIN tokens t ON p.token_address = t.contract_address
       JOIN users u ON p.creator = u.address
       WHERE p.id = ?`,
      [proposalId]
    );
    // ... (rest unchanged) ...
    const votesResult = await query(
      `SELECT v.*, u.address as voter_address
       FROM governance_votes v
       JOIN users u ON v.voter = u.address
       WHERE v.proposal_id = ?
       ORDER BY v.created_at DESC`,
      [proposalId]
    );
    // ... (rest unchanged) ...
  } catch (error) {
    // ... (error handling unchanged) ...
  }
});

// Create a new proposal
router.post('/', authenticate, async (req, res) => {
  try {
    // ... (ownership check unchanged) ...
    const result = await query(
      `INSERT INTO governance_proposals 
       (token_address, title, description, creator, start_time, end_time, status, quorum, execution_time, execution_data) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       RETURNING *`,
      [
        tokenAddress.toLowerCase(),
        title,
        description,
        req.user.id,
        proposalStartTime,
        proposalEndTime,
        now >= proposalStartTime ? 'active' : 'pending',
        proposalQuorum,
        proposalExecutionTime,
        executionData || null
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    // ... (error handling unchanged) ...
  }
});

// Cast a vote
router.post('/vote', authenticate, async (req, res) => {
  try {
    // ... (proposal check unchanged) ...
    const existingVoteResult = await query(
      'SELECT * FROM governance_votes WHERE proposal_id = ? AND voter = ?',
      [proposalId, req.user.id]
    );
    // ... (rest unchanged) ...
    const result = await query(
      `INSERT INTO governance_votes 
       (proposal_id, voter, vote, vote_weight) 
       VALUES (?, ?, ?, ?)
       RETURNING *`,
      [proposalId, req.user.id, vote, voteWeight]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    // ... (error handling unchanged) ...
  }
});

// Update proposal status (for background job)
router.put('/update-statuses', async (req, res) => {
  try {
    const now = new Date();
    await query(
      `UPDATE governance_proposals 
       SET status = 'active' 
       WHERE status = 'pending' AND start_time <= ?`,
      [now]
    );
    const endedProposalsResult = await query(
      `SELECT p.*, t.contract_address as token_address
       FROM governance_proposals p
       JOIN tokens t ON p.token_address = t.contract_address
       WHERE p.status = 'active' AND p.end_time <= ?`,
      [now]
    );
    // ... (rest unchanged, update all queries to use ? placeholders) ...
  } catch (error) {
    // ... (error handling unchanged) ...
  }
});

module.exports = router;
