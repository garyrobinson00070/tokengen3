const crypto = require('crypto');

// Encryption key management
const getEncryptionKey = () => {
  const key = process.env.ENCRYPTION_KEY;
  
  // Check if key exists
  if (!key || key.trim() === '') {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('ENCRYPTION_KEY environment variable is not set in production environment');
    } else {
      // In development, use a default key (but warn)
      console.warn('WARNING: Using default encryption key for development. DO NOT use in production!');
      return Buffer.from('0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef', 'hex');
    }
  }
  
  // Ensure key is 32 bytes (256 bits)
  if (Buffer.from(key, 'hex').length !== 32) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('ENCRYPTION_KEY must be a 32-byte (64 character) hex string');
    } else {
      // In development, pad or truncate the key (but warn)
      console.warn('WARNING: Encryption key is not 32 bytes. Adjusting for development only.');
      const rawKey = Buffer.from(key, 'hex');
      const adjustedKey = Buffer.alloc(32);
      rawKey.copy(adjustedKey, 0, 0, Math.min(rawKey.length, 32));
      return adjustedKey;
    }
  }
  
  return Buffer.from(key, 'hex');
};

// Encrypt sensitive data
const encrypt = (text) => {
  try {
    if (!text) {
      throw new Error('Cannot encrypt empty or null data');
    }
    
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Get auth tag for GCM mode (adds authentication)
    const authTag = cipher.getAuthTag().toString('hex');
    
    // Return IV, encrypted data, and auth tag
    return `${iv.toString('hex')}:${encrypted}:${authTag}`;
  } catch (error) {
    console.error('Encryption error:', error);
    
    if (process.env.NODE_ENV === 'production') {
      // In production, don't expose internal errors
      throw new Error('Data encryption failed');
    } else {
      // In development, provide more details
      throw new Error(`Failed to encrypt data: ${error.message}`);
    }
  }
};

// Decrypt sensitive data
const decrypt = (text) => {
  try {
    if (!text) {
      throw new Error('Cannot decrypt empty or null data');
    }
    
    // Validate format
    if (!text.includes(':') || text.split(':').length !== 3) {
      throw new Error('Invalid encrypted data format');
    }
    
    const key = getEncryptionKey();
    const [ivHex, encryptedText, authTagHex] = text.split(':');
    
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    
    if (process.env.NODE_ENV === 'production') {
      // In production, don't expose internal errors
      throw new Error('Data decryption failed');
    } else {
      // In development, provide more details
      throw new Error(`Failed to decrypt data: ${error.message}`);
    }
  }
};

// Generate secure random string
const generateRandomString = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

// Hash data (one-way)
const hashData = (data, salt = null) => {
  // Generate salt if not provided
  const useSalt = salt || crypto.randomBytes(16).toString('hex');
  
  // Use PBKDF2 for secure hashing
  const hash = crypto.pbkdf2Sync(data, useSalt, 10000, 64, 'sha512').toString('hex');
  
  // Return hash and salt
  return { hash, salt: useSalt };
};

// Verify hash
const verifyHash = (data, hash, salt) => {
  const { hash: newHash } = hashData(data, salt);
  return newHash === hash;
};

// Secure key management for private keys
const encryptPrivateKey = (privateKey, password) => {
  // Generate a unique salt for this key
  const salt = crypto.randomBytes(16).toString('hex');
  
  // Derive a key from the password
  const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha512');
  
  // Encrypt the private key
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  
  let encrypted = cipher.update(privateKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  // Get auth tag
  const authTag = cipher.getAuthTag().toString('hex');
  
  // Return everything needed to decrypt
  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag,
    salt
  };
};

// Decrypt a private key
const decryptPrivateKey = (encryptedData, password) => {
  try {
    // Derive the key using the same parameters
    const key = crypto.pbkdf2Sync(
      password, 
      Buffer.from(encryptedData.salt, 'hex'), 
      100000, 
      32, 
      'sha512'
    );
    
    // Setup decipher
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm', 
      key, 
      Buffer.from(encryptedData.iv, 'hex')
    );
    
    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
    
    // Decrypt
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Private key decryption error:', error);
    throw new Error('Failed to decrypt private key. Incorrect password or corrupted data.');
  }
};

module.exports = {
  encrypt,
  decrypt,
  generateRandomString,
  hashData,
  verifyHash,
  encryptPrivateKey,
  decryptPrivateKey
};