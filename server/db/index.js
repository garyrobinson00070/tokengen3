const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Create a connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Connect to PostgreSQL
const connectDB = async () => {
  try {
    // Add connection timeout
    const connectionTimeoutMs = 30000; // 30 seconds
    const connectionPromise = pool.connect();
    
    // Create a timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Connection timed out after ${connectionTimeoutMs}ms`));
      }, connectionTimeoutMs);
    });
    
    // Test connection
    const client = await Promise.race([connectionPromise, timeoutPromise]);
    console.log(`PostgreSQL Connected: ${client.database} on ${client.host}`);
    client.release();
    
    // Initialize database if needed
    await initializeDatabase();
    
    // Set up connection health check
    if (process.env.NODE_ENV === 'production') {
      setInterval(async () => {
        try {
          const healthCheckClient = await pool.connect();
          await healthCheckClient.query('SELECT 1');
          healthCheckClient.release();
        } catch (error) {
          console.error('Database health check failed:', error.message);
          // In production, this would trigger an alert or restart mechanism
        }
      }, 60000); // Check every minute
    }
    
    return pool;
  } catch (error) {
    console.error(`Error connecting to PostgreSQL: ${error.message}`);
    // Retry logic with exponential backoff
    const retryDelay = Math.min(30000, Math.pow(2, retryCount) * 1000);
    console.log(`Retrying connection in ${retryDelay/1000} seconds...`);
    setTimeout(() => connectDB(retryCount + 1), retryDelay);
  }
};

// Track retry attempts
let retryCount = 0;

// Initialize database tables if they don't exist
const initializeDatabase = async () => {
  try {
    const client = await pool.connect();
    
    // Read schema file
    const schemaPath = path.join(__dirname, 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const schema = fs.readFileSync(schemaPath, 'utf8');
      await client.query(schema);
      console.log('Database schema initialized');
    }
    
    client.release();
  } catch (error) {
    console.error(`Error initializing database: ${error.message}`);
    throw error;
  }
};

// Query helper with error handling
const query = async (text, params) => {
  const start = Date.now();
  let client;
  try {
    // Get client from pool
    client = await pool.connect();
    
    // Execute query
    const res = await client.query(text, params);
    
    // Log query performance in development
    const duration = Date.now() - start;
    if (process.env.NODE_ENV === 'development') {
      console.log('Executed query', { text, duration, rows: res.rowCount });
    }
    
    return res;
  } catch (error) {
    console.error('Query error', { text, error });
    throw error;
  } finally {
    // Release client back to pool
    if (client) client.release();
  }
};

module.exports = {
  connectDB,
  query,
  pool
};