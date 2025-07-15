const express = require('express');
const multer = require('multer');
const { Web3Storage, File } = require('web3.storage');
const { authenticate } = require('../middleware/auth');
const { query } = require('../db');
const { ethers } = require('ethers');
const path = require('path');
const fs = require('fs');
const os = require('os');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const tempDir = path.join(os.tmpdir(), 'tokenforge-uploads');
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
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    // Accept only image files
    if (!file.originalname.match(/\.(jpg|jpeg|png|webp)$/)) {
      return cb(new Error('Only image files are allowed!'), false);
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

// Verify token ownership
async function verifyTokenOwnership(tokenAddress, walletAddress) {
  try {
    // Check if token exists in our database
    const tokenResult = await query(
      'SELECT * FROM tokens WHERE contract_address = $1',
      [tokenAddress.toLowerCase()]
    );
    
    if (tokenResult.rows.length === 0) {
      return false;
    }
    
    const token = tokenResult.rows[0];
    
    // Check if wallet is the token owner
    if (token.owner_address.toLowerCase() !== walletAddress.toLowerCase()) {
      // If not in database, verify on-chain
      try {
        const provider = new ethers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL);
        const tokenContract = new ethers.Contract(
          tokenAddress,
          ['function owner() view returns (address)'],
          provider
        );
        
        const onChainOwner = await tokenContract.owner();
        return onChainOwner.toLowerCase() === walletAddress.toLowerCase();
      } catch (error) {
        console.error('Error verifying on-chain ownership:', error);
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error verifying token ownership:', error);
    return false;
  }
}

// Get token metadata
router.get('/:tokenAddress', async (req, res) => {
  try {
    const { tokenAddress } = req.params;
    
    if (!tokenAddress || !ethers.isAddress(tokenAddress)) {
      return res.status(400).json({ error: 'Invalid token address' });
    }
    
    // Get metadata from database
    const metadataResult = await query(
      `SELECT m.*, t.name as token_name, t.symbol as token_symbol 
       FROM token_metadata m
       RIGHT JOIN tokens t ON m.token_address = t.contract_address
       WHERE t.contract_address = $1`,
      [tokenAddress.toLowerCase()]
    );
    
    if (metadataResult.rows.length === 0) {
      return res.status(404).json({ error: 'Token not found' });
    }
    
    const tokenData = metadataResult.rows[0];
    
    // Format response
    const response = {
      tokenAddress: tokenAddress.toLowerCase(),
      name: tokenData.name || tokenData.token_name,
      symbol: tokenData.symbol || tokenData.token_symbol,
      description: tokenData.description || '',
      logoUrl: tokenData.logo_url || '',
      websiteUrl: tokenData.website_url || '',
      twitterUrl: tokenData.twitter_url || '',
      telegramUrl: tokenData.telegram_url || '',
      discordUrl: tokenData.discord_url || '',
      githubUrl: tokenData.github_url || '',
      whitePaperUrl: tokenData.whitepaper_url || '',
      tags: tokenData.tags || [],
      updatedAt: tokenData.updated_at || tokenData.created_at
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error fetching token metadata:', error);
    res.status(500).json({ error: 'Failed to fetch token metadata' });
  }
});

// Create or update token metadata
router.post('/:tokenAddress', authenticate, upload.single('logo'), async (req, res) => {
  try {
    const { tokenAddress } = req.params;
    const userId = req.user.id;
    
    if (!tokenAddress || !ethers.isAddress(tokenAddress)) {
      return res.status(400).json({ error: 'Invalid token address' });
    }
    
    // Verify token ownership
    const isOwner = await verifyTokenOwnership(tokenAddress, userId);
    if (!isOwner) {
      return res.status(403).json({ error: 'You are not the owner of this token' });
    }
    
    // Parse metadata from request body
    const {
      description,
      websiteUrl,
      twitterUrl,
      telegramUrl,
      discordUrl,
      githubUrl,
      whitePaperUrl,
      tags
    } = req.body;
    
    // Parse tags
    let parsedTags = [];
    if (tags) {
      try {
        parsedTags = JSON.parse(tags);
      } catch (e) {
        parsedTags = tags.split(',').map(tag => tag.trim());
      }
    }
    
    // Get token info
    const tokenResult = await query(
      'SELECT name, symbol FROM tokens WHERE contract_address = $1',
      [tokenAddress.toLowerCase()]
    );
    
    if (tokenResult.rows.length === 0) {
      return res.status(404).json({ error: 'Token not found' });
    }
    
    const token = tokenResult.rows[0];
    
    // Upload logo to IPFS if provided
    let logoUrl = null;
    if (req.file) {
      try {
        logoUrl = await uploadToIPFS(req.file.path, req.file.filename);
        
        // Clean up temp file
        fs.unlinkSync(req.file.path);
      } catch (error) {
        console.error('Error uploading logo to IPFS:', error);
        return res.status(500).json({ error: 'Failed to upload logo' });
      }
    }
    
    // Check if metadata already exists
    const existingMetadataResult = await query(
      'SELECT * FROM token_metadata WHERE token_address = $1',
      [tokenAddress.toLowerCase()]
    );
    
    let result;
    if (existingMetadataResult.rows.length > 0) {
      // Update existing metadata
      result = await query(
        `UPDATE token_metadata 
         SET description = COALESCE($1, description),
             logo_url = COALESCE($2, logo_url),
             website_url = COALESCE($3, website_url),
             twitter_url = COALESCE($4, twitter_url),
             telegram_url = COALESCE($5, telegram_url),
             discord_url = COALESCE($6, discord_url),
             github_url = COALESCE($7, github_url),
             whitepaper_url = COALESCE($8, whitepaper_url),
             tags = COALESCE($9, tags),
             updated_at = CURRENT_TIMESTAMP
         WHERE token_address = $10
         RETURNING *`,
        [
          description,
          logoUrl,
          websiteUrl,
          twitterUrl,
          telegramUrl,
          discordUrl,
          githubUrl,
          whitePaperUrl,
          parsedTags.length > 0 ? parsedTags : null,
          tokenAddress.toLowerCase()
        ]
      );
    } else {
      // Create new metadata
      result = await query(
        `INSERT INTO token_metadata 
         (token_address, name, symbol, description, logo_url, website_url, twitter_url, 
          telegram_url, discord_url, github_url, whitepaper_url, tags, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         RETURNING *`,
        [
          tokenAddress.toLowerCase(),
          token.name,
          token.symbol,
          description,
          logoUrl,
          websiteUrl,
          twitterUrl,
          telegramUrl,
          discordUrl,
          githubUrl,
          whitePaperUrl,
          parsedTags.length > 0 ? parsedTags : null,
          userId
        ]
      );
    }
    
    // Format response
    const metadata = result.rows[0];
    const response = {
      tokenAddress: metadata.token_address,
      name: metadata.name,
      symbol: metadata.symbol,
      description: metadata.description,
      logoUrl: metadata.logo_url,
      websiteUrl: metadata.website_url,
      twitterUrl: metadata.twitter_url,
      telegramUrl: metadata.telegram_url,
      discordUrl: metadata.discord_url,
      githubUrl: metadata.github_url,
      whitePaperUrl: metadata.whitepaper_url,
      tags: metadata.tags || [],
      updatedAt: metadata.updated_at
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error updating token metadata:', error);
    res.status(500).json({ error: 'Failed to update token metadata' });
  }
});

// OpenSea-compatible metadata endpoint
router.get('/:tokenAddress/opensea', async (req, res) => {
  try {
    const { tokenAddress } = req.params;
    
    if (!tokenAddress || !ethers.isAddress(tokenAddress)) {
      return res.status(400).json({ error: 'Invalid token address' });
    }
    
    // Get metadata from database
    const metadataResult = await query(
      `SELECT m.*, t.name as token_name, t.symbol as token_symbol 
       FROM token_metadata m
       RIGHT JOIN tokens t ON m.token_address = t.contract_address
       WHERE t.contract_address = $1`,
      [tokenAddress.toLowerCase()]
    );
    
    if (metadataResult.rows.length === 0) {
      return res.status(404).json({ error: 'Token not found' });
    }
    
    const tokenData = metadataResult.rows[0];
    
    // Format OpenSea compatible response
    const response = {
      name: tokenData.name || tokenData.token_name,
      symbol: tokenData.symbol || tokenData.token_symbol,
      description: tokenData.description || `${tokenData.token_name} token`,
      image: tokenData.logo_url || '',
      external_link: tokenData.website_url || '',
      properties: {
        tags: tokenData.tags || [],
        socials: {
          twitter: tokenData.twitter_url || '',
          telegram: tokenData.telegram_url || '',
          discord: tokenData.discord_url || '',
          github: tokenData.github_url || ''
        }
      }
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error fetching OpenSea metadata:', error);
    res.status(500).json({ error: 'Failed to fetch token metadata' });
  }
});

module.exports = router;