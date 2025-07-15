const express = require('express');
const { authenticate, isAdmin } = require('../middleware/auth');
const { query } = require('../db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Web3Storage, File } = require('web3.storage');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const tempDir = path.join(__dirname, '..', '..', 'tmp', 'badge-uploads');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    cb(null, tempDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    // Accept only PDF and image files
    if (!file.originalname.match(/\.(jpg|jpeg|png|pdf)$/)) {
      return cb(new Error('Only PDF and image files are allowed!'), false);
    }
    cb(null, true);
  }
});

// Initialize Web3Storage client
function getWeb3StorageClient() {
  const token = process.env.WEB3_STORAGE_TOKEN;
  if (!token) {
    console.warn('WEB3_STORAGE_TOKEN not set, IPFS uploads will not work');
    return null;
  }
  return new Web3Storage({ token });
}

// Upload file to IPFS
async function uploadToIPFS(filePath, fileName) {
  const client = getWeb3StorageClient();
  if (!client) {
    throw new Error('Web3Storage client not initialized');
  }

  const fileData = fs.readFileSync(filePath);
  const file = new File([fileData], fileName);
  const cid = await client.put([file]);
  
  // Return IPFS URL
  return `https://${cid}.ipfs.w3s.link/${fileName}`;
}

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
    console.error('Error fetching badges:', error);
    res.status(500).json({ error: 'Failed to fetch badges' });
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
       WHERE b.token_address = $1 AND b.status = 'approved'
       ORDER BY b.created_at DESC`,
      [tokenAddress.toLowerCase()]
    );
    
    res.json(badgesResult.rows);
  } catch (error) {
    console.error('Error fetching token badges:', error);
    res.status(500).json({ error: 'Failed to fetch token badges' });
  }
});

// Create a new badge request (admin only)
router.post('/', authenticate, isAdmin, upload.single('document'), async (req, res) => {
  try {
    const { tokenAddress, badgeType, notes } = req.body;
    
    if (!tokenAddress || !badgeType) {
      return res.status(400).json({ error: 'Token address and badge type are required' });
    }
    
    // Check if token exists
    const tokenResult = await query(
      'SELECT * FROM tokens WHERE contract_address = $1',
      [tokenAddress.toLowerCase()]
    );
    
    if (tokenResult.rows.length === 0) {
      return res.status(404).json({ error: 'Token not found' });
    }
    
    // Check if badge already exists
    const existingBadgeResult = await query(
      'SELECT * FROM badges WHERE token_address = $1 AND badge_type = $2',
      [tokenAddress.toLowerCase(), badgeType]
    );
    
    if (existingBadgeResult.rows.length > 0) {
      return res.status(400).json({ error: 'Badge already exists for this token' });
    }
    
    // Upload document to IPFS if provided
    let documentUrl = null;
    if (req.file) {
      try {
        documentUrl = await uploadToIPFS(req.file.path, req.file.filename);
        
        // Clean up temp file
        fs.unlinkSync(req.file.path);
      } catch (uploadError) {
        console.error('Error uploading document to IPFS:', uploadError);
        return res.status(500).json({ error: 'Failed to upload document' });
      }
    }
    
    // Create badge
    const result = await query(
      `INSERT INTO badges 
       (token_address, badge_type, status, document_url, notes, approved_by, approved_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        tokenAddress.toLowerCase(),
        badgeType,
        'approved', // Auto-approve when created by admin
        documentUrl,
        notes,
        req.user.id, // Admin address
        new Date() // Approval timestamp
      ]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating badge:', error);
    res.status(500).json({ error: 'Failed to create badge' });
  }
});

// Update badge status (admin only)
router.put('/:badgeId', authenticate, isAdmin, async (req, res) => {
  try {
    const { badgeId } = req.params;
    const { status, notes } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }
    
    // Update badge
    const result = await query(
      `UPDATE badges 
       SET status = $1, 
           notes = COALESCE($2, notes),
           approved_by = $3,
           approved_at = CASE WHEN $1 = 'approved' THEN CURRENT_TIMESTAMP ELSE approved_at END
       WHERE id = $4
       RETURNING *`,
      [status, notes, req.user.id, badgeId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Badge not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating badge:', error);
    res.status(500).json({ error: 'Failed to update badge' });
  }
});

// Delete badge (admin only)
router.delete('/:badgeId', authenticate, isAdmin, async (req, res) => {
  try {
    const { badgeId } = req.params;
    
    // Delete badge
    const result = await query(
      'DELETE FROM badges WHERE id = $1 RETURNING *',
      [badgeId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Badge not found' });
    }
    
    res.json({ success: true, message: 'Badge deleted successfully' });
  } catch (error) {
    console.error('Error deleting badge:', error);
    res.status(500).json({ error: 'Failed to delete badge' });
  }
});

module.exports = router;