-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  address VARCHAR(42) NOT NULL UNIQUE,
  nonce VARCHAR(64) NOT NULL,
  last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  esr_balance NUMERIC DEFAULT 0,
  esr_last_checked TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tokens table
CREATE TABLE IF NOT EXISTS tokens (
  id SERIAL PRIMARY KEY,
  contract_address VARCHAR(42) NOT NULL UNIQUE,
  contract_type VARCHAR(50) NOT NULL,
  name VARCHAR(100) NOT NULL,
  symbol VARCHAR(20) NOT NULL,
  decimals INTEGER NOT NULL DEFAULT 18,
  initial_supply NUMERIC NOT NULL,
  max_supply NUMERIC,
  owner_address VARCHAR(42) NOT NULL,
  network_id VARCHAR(20) NOT NULL,
  network_name VARCHAR(50) NOT NULL,
  network_chain_id INTEGER NOT NULL,
  transaction_hash VARCHAR(66) NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  features JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Index for faster queries
  CONSTRAINT tokens_owner_idx FOREIGN KEY (owner_address) REFERENCES users(address) ON DELETE CASCADE
);

-- Presales table
CREATE TABLE IF NOT EXISTS presales (
  id SERIAL PRIMARY KEY,
  contract_address VARCHAR(42) NOT NULL UNIQUE,
  token_address VARCHAR(42) NOT NULL,
  owner_address VARCHAR(42) NOT NULL,
  sale_type VARCHAR(20) NOT NULL,
  token_info JSONB NOT NULL,
  sale_configuration JSONB NOT NULL,
  vesting_config JSONB,
  wallet_setup JSONB NOT NULL,
  network_id VARCHAR(20) NOT NULL,
  network_name VARCHAR(50) NOT NULL,
  network_chain_id INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'upcoming',
  transaction_hash VARCHAR(66) NOT NULL,
  total_raised NUMERIC DEFAULT 0,
  participant_count INTEGER DEFAULT 0,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Indexes for faster queries
  CONSTRAINT presales_owner_idx FOREIGN KEY (owner_address) REFERENCES users(address) ON DELETE CASCADE,
  CONSTRAINT presales_token_idx FOREIGN KEY (token_address) REFERENCES tokens(contract_address) ON DELETE CASCADE
);

-- Vesting schedules table
CREATE TABLE IF NOT EXISTS vesting_schedules (
  id SERIAL PRIMARY KEY,
  token_address VARCHAR(42) NOT NULL,
  beneficiary_address VARCHAR(42) NOT NULL,
  total_amount NUMERIC NOT NULL,
  start_time TIMESTAMP NOT NULL,
  duration INTEGER NOT NULL, -- in seconds
  released_amount NUMERIC DEFAULT 0,
  revoked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Indexes for faster queries
  CONSTRAINT vesting_token_idx FOREIGN KEY (token_address) REFERENCES tokens(contract_address) ON DELETE CASCADE,
  UNIQUE(token_address, beneficiary_address)
);

-- Transactions table for audit trail
CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  transaction_hash VARCHAR(66) NOT NULL UNIQUE,
  transaction_type VARCHAR(20) NOT NULL,
  from_address VARCHAR(42) NOT NULL,
  to_address VARCHAR(42),
  amount NUMERIC,
  token_address VARCHAR(42),
  network_id VARCHAR(20) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  gas_used NUMERIC,
  block_number INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_tokens_owner ON tokens(owner_address);
CREATE INDEX IF NOT EXISTS idx_presales_owner ON presales(owner_address);
CREATE INDEX IF NOT EXISTS idx_presales_token ON presales(token_address);
CREATE INDEX IF NOT EXISTS idx_vesting_token ON vesting_schedules(token_address);
CREATE INDEX IF NOT EXISTS idx_vesting_beneficiary ON vesting_schedules(beneficiary_address);
CREATE INDEX IF NOT EXISTS idx_transactions_from ON transactions(from_address);
CREATE INDEX IF NOT EXISTS idx_transactions_to ON transactions(to_address);
CREATE INDEX IF NOT EXISTS idx_transactions_token ON transactions(token_address);