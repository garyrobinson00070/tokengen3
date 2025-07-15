const express = require('express');
const { authenticate } = require('../middleware/auth');
const { query } = require('../db');
const { ethers } = require('ethers');
const { verifyTokenOwnership } = require('../utils/tokenVerification');

const router = express.Router();

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
       WHERE p.token_address = $1
       ORDER BY p.created_at DESC`,
      [tokenAddress.toLowerCase()]
    );
    
    res.json(proposalsResult.rows);
  } catch (error) {
    console.error('Error fetching proposals:', error);
    res.status(500).json({ error: 'Failed to fetch proposals' });
  }
});

// Get a specific proposal with votes
router.get('/proposal/:proposalId', async (req, res) => {
  try {
    const { proposalId } = req.params;
    
    // Get proposal details
    const proposalResult = await query(
      `SELECT p.*, 
              u.address as creator_address,
              t.name as token_name, 
              t.symbol as token_symbol,
              t.contract_address as token_address
       FROM governance_proposals p
       JOIN tokens t ON p.token_address = t.contract_address
       JOIN users u ON p.creator = u.address
       WHERE p.id = $1`,
      [proposalId]
    );
    
    if (proposalResult.rows.length === 0) {
      return res.status(404).json({ error: 'Proposal not found' });
    }
    
    const proposal = proposalResult.rows[0];
    
    // Get votes
    const votesResult = await query(
      `SELECT v.*, u.address as voter_address
       FROM governance_votes v
       JOIN users u ON v.voter = u.address
       WHERE v.proposal_id = $1
       ORDER BY v.created_at DESC`,
      [proposalId]
    );
    
    // Calculate vote statistics
    const totalVotes = votesResult.rows.reduce((sum, vote) => sum + parseFloat(vote.vote_weight), 0);
    const yesVotes = votesResult.rows.filter(v => v.vote === 'yes').reduce((sum, vote) => sum + parseFloat(vote.vote_weight), 0);
    const noVotes = votesResult.rows.filter(v => v.vote === 'no').reduce((sum, vote) => sum + parseFloat(vote.vote_weight), 0);
    const abstainVotes = votesResult.rows.filter(v => v.vote === 'abstain').reduce((sum, vote) => sum + parseFloat(vote.vote_weight), 0);
    
    // Get token total supply
    let totalSupply = '0';
    try {
      const provider = new ethers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL);
      const tokenContract = new ethers.Contract(
        proposal.token_address,
        ['function totalSupply() view returns (uint256)'],
        provider
      );
      totalSupply = await tokenContract.totalSupply();
      totalSupply = ethers.formatEther(totalSupply);
    } catch (error) {
      console.error('Error fetching token total supply:', error);
    }
    
    // Calculate quorum percentage
    const quorumPercentage = totalSupply > 0 ? (totalVotes / parseFloat(totalSupply)) * 100 : 0;
    
    res.json({
      proposal,
      votes: votesResult.rows,
      statistics: {
        totalVotes,
        yesVotes,
        noVotes,
        abstainVotes,
        totalSupply,
        quorumPercentage,
        quorumReached: quorumPercentage >= proposal.quorum
      }
    });
  } catch (error) {
    console.error('Error fetching proposal details:', error);
    res.status(500).json({ error: 'Failed to fetch proposal details' });
  }
});

// Create a new proposal
router.post('/', authenticate, async (req, res) => {
  try {
    const { tokenAddress, title, description, startTime, endTime, quorum, executionTime, executionData } = req.body;
    
    if (!tokenAddress || !title || !description) {
      return res.status(400).json({ error: 'Token address, title, and description are required' });
    }
    
    // Verify token ownership
    const isOwner = await verifyTokenOwnership(tokenAddress, req.user.id);
    if (!isOwner) {
      return res.status(403).json({ error: 'You are not the owner of this token' });
    }
    
    // Set default values
    const now = new Date();
    const proposalStartTime = startTime ? new Date(startTime) : now;
    const proposalEndTime = endTime ? new Date(endTime) : new Date(now.getTime() + (3 * 24 * 60 * 60 * 1000)); // 3 days default
    const proposalQuorum = quorum || 10; // 10% default
    const proposalExecutionTime = executionTime ? new Date(executionTime) : new Date(proposalEndTime.getTime() + (24 * 60 * 60 * 1000)); // 1 day after end
    
    // Create proposal
    const result = await query(
      `INSERT INTO governance_proposals 
       (token_address, title, description, creator, start_time, end_time, status, quorum, execution_time, execution_data) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
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
    console.error('Error creating proposal:', error);
    res.status(500).json({ error: 'Failed to create proposal' });
  }
});

// Cast a vote
router.post('/vote', authenticate, async (req, res) => {
  try {
    const { proposalId, vote } = req.body;
    
    if (!proposalId || !vote) {
      return res.status(400).json({ error: 'Proposal ID and vote are required' });
    }
    
    // Check if vote is valid
    if (!['yes', 'no', 'abstain'].includes(vote)) {
      return res.status(400).json({ error: 'Invalid vote. Must be "yes", "no", or "abstain"' });
    }
    
    // Check if proposal exists and is active
    const proposalResult = await query(
      `SELECT p.*, t.contract_address as token_address
       FROM governance_proposals p
       JOIN tokens t ON p.token_address = t.contract_address
       WHERE p.id = $1`,
      [proposalId]
    );
    
    if (proposalResult.rows.length === 0) {
      return res.status(404).json({ error: 'Proposal not found' });
    }
    
    const proposal = proposalResult.rows[0];
    
    // Check if proposal is active
    const now = new Date();
    if (now < new Date(proposal.start_time)) {
      return res.status(400).json({ error: 'Voting has not started yet' });
    }
    
    if (now > new Date(proposal.end_time)) {
      return res.status(400).json({ error: 'Voting has ended' });
    }
    
    if (proposal.status !== 'active') {
      return res.status(400).json({ error: 'Proposal is not active' });
    }
    
    // Check if user has already voted
    const existingVoteResult = await query(
      'SELECT * FROM governance_votes WHERE proposal_id = $1 AND voter = $2',
      [proposalId, req.user.id]
    );
    
    if (existingVoteResult.rows.length > 0) {
      return res.status(400).json({ error: 'You have already voted on this proposal' });
    }
    
    // Get token balance
    let voteWeight = 0;
    try {
      const provider = new ethers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL);
      const tokenContract = new ethers.Contract(
        proposal.token_address,
        ['function balanceOf(address) view returns (uint256)'],
        provider
      );
      const balance = await tokenContract.balanceOf(req.user.id);
      voteWeight = parseFloat(ethers.formatEther(balance));
    } catch (error) {
      console.error('Error fetching token balance:', error);
      return res.status(500).json({ error: 'Failed to fetch token balance' });
    }
    
    if (voteWeight <= 0) {
      return res.status(400).json({ error: 'You do not have any voting power (token balance)' });
    }
    
    // Cast vote
    const result = await query(
      `INSERT INTO governance_votes 
       (proposal_id, voter, vote, vote_weight) 
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [proposalId, req.user.id, vote, voteWeight]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error casting vote:', error);
    res.status(500).json({ error: 'Failed to cast vote' });
  }
});

// Update proposal status (for background job)
router.put('/update-statuses', async (req, res) => {
  try {
    const now = new Date();
    
    // Update pending proposals to active
    await query(
      `UPDATE governance_proposals 
       SET status = 'active' 
       WHERE status = 'pending' AND start_time <= $1`,
      [now]
    );
    
    // Get ended proposals that need status update
    const endedProposalsResult = await query(
      `SELECT p.*, t.contract_address as token_address
       FROM governance_proposals p
       JOIN tokens t ON p.token_address = t.contract_address
       WHERE p.status = 'active' AND p.end_time <= $1`,
      [now]
    );
    
    // Process each ended proposal
    for (const proposal of endedProposalsResult.rows) {
      // Get votes
      const votesResult = await query(
        `SELECT vote, SUM(vote_weight) as total_weight
         FROM governance_votes
         WHERE proposal_id = $1
         GROUP BY vote`,
        [proposal.id]
      );
      
      // Calculate vote totals
      const votesByType = votesResult.rows.reduce((acc, v) => {
        acc[v.vote] = parseFloat(v.total_weight);
        return acc;
      }, { yes: 0, no: 0, abstain: 0 });
      
      const totalVotes = votesByType.yes + votesByType.no + votesByType.abstain;
      
      // Get token total supply
      let totalSupply = 0;
      try {
        const provider = new ethers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL);
        const tokenContract = new ethers.Contract(
          proposal.token_address,
          ['function totalSupply() view returns (uint256)'],
          provider
        );
        const supply = await tokenContract.totalSupply();
        totalSupply = parseFloat(ethers.formatEther(supply));
      } catch (error) {
        console.error('Error fetching token total supply:', error);
      }
      
      // Calculate quorum percentage
      const quorumPercentage = totalSupply > 0 ? (totalVotes / totalSupply) * 100 : 0;
      const quorumReached = quorumPercentage >= proposal.quorum;
      
      // Determine if proposal passed
      let newStatus = 'rejected';
      if (quorumReached && votesByType.yes > votesByType.no) {
        newStatus = 'passed';
      }
      
      // Update proposal status
      await query(
        `UPDATE governance_proposals 
         SET status = $1 
         WHERE id = $2`,
        [newStatus, proposal.id]
      );
    }
    
    res.json({ success: true, message: 'Proposal statuses updated successfully' });
  } catch (error) {
    console.error('Error updating proposal statuses:', error);
    res.status(500).json({ error: 'Failed to update proposal statuses' });
  }
});

module.exports = router;