// server/db/index.js
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const pool = mysql.createPool({
  uri: process.env.DATABASE_URL,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // If using individual params:
  // host: process.env.DB_HOST,
  // user: process.env.DB_USER,
  // password: process.env.DB_PASSWORD,
  // database: process.env.DB_NAME,
  // port: process.env.DB_PORT,
  // ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined
});

const connectDB = async () => {
  try {
    const connection = await pool.getConnection();
    console.log(`MySQL Connected: ${connection.config.database} on ${connection.config.host}`);
    connection.release();

    await initializeDatabase();

    if (process.env.NODE_ENV === 'production') {
      setInterval(async () => {
        try {
          const healthCheckConn = await pool.getConnection();
          await healthCheckConn.query('SELECT 1');
          healthCheckConn.release();
        } catch (error) {
          console.error('Database health check failed:', error.message);
        }
      }, 60000);
    }

    return pool;
  } catch (error) {
    console.error(`Error connecting to MySQL: ${error.message}`);
    // Retry logic with exponential backoff
    const retryDelay = Math.min(30000, Math.pow(2, retryCount) * 1000);
    console.log(`Retrying connection in ${retryDelay/1000} seconds...`);
    setTimeout(() => connectDB(retryCount + 1), retryDelay);
  }
};

let retryCount = 0;

const initializeDatabase = async () => {
  try {
    const connection = await pool.getConnection();
    const schemaPath = path.join(__dirname, 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const schema = fs.readFileSync(schemaPath, 'utf8');
      // Split on semicolons to avoid multi-statement issues
      const statements = schema.split(';').map(s => s.trim()).filter(Boolean);
      for (const stmt of statements) {
        await connection.query(stmt);
      }
      console.log('Database schema initialized');
    }
    connection.release();
  } catch (error) {
    console.error(`Error initializing database: ${error.message}`);
    throw error;
  }
};

const query = async (sql, params) => {
  const start = Date.now();
  let connection;
  try {
    connection = await pool.getConnection();
    const [rows] = await connection.query(sql, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV === 'development') {
      console.log('Executed query', { sql, duration, rows: Array.isArray(rows) ? rows.length : 0 });
    }
    return { rows };
  } catch (error) {
    console.error('Query error', { sql, error });
    throw error;
  } finally {
    if (connection) connection.release();
  }
};

module.exports = {
  connectDB,
  query,
  pool
};
