-- Add new fields to presales table
ALTER TABLE IF EXISTS presales 
ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS auto_listing_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS listing_price NUMERIC,
ADD COLUMN IF NOT EXISTS lp_token_percentage INTEGER,
ADD COLUMN IF NOT EXISTS lp_base_token_percentage INTEGER,
ADD COLUMN IF NOT EXISTS lock_duration INTEGER,
ADD COLUMN IF NOT EXISTS lp_token_address VARCHAR(42),
ADD COLUMN IF NOT EXISTS auto_listed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS referral_tracker_address VARCHAR(42);

-- Create liquidity_locks table
CREATE TABLE IF NOT EXISTS liquidity_locks (
  id SERIAL PRIMARY KEY,
  lock_id INTEGER NOT NULL,
  contract_address VARCHAR(42) NOT NULL,
  token_address VARCHAR(42) NOT NULL,
  owner_address VARCHAR(42) NOT NULL,
  amount NUMERIC NOT NULL,
  lock_time TIMESTAMP NOT NULL,
  unlock_time TIMESTAMP NOT NULL,
  withdrawn BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT liquidity_locks_owner_idx FOREIGN KEY (owner_address) REFERENCES users(address) ON DELETE CASCADE
);

-- Create referrals table
CREATE TABLE IF NOT EXISTS referrals (
  id SERIAL PRIMARY KEY,
  referrer_address VARCHAR(42) NOT NULL,
  referee_address VARCHAR(42) NOT NULL,
  presale_address VARCHAR(42),
  volume NUMERIC DEFAULT 0,
  reward NUMERIC DEFAULT 0,
  claimed BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT referrals_referrer_idx FOREIGN KEY (referrer_address) REFERENCES users(address) ON DELETE CASCADE,
  CONSTRAINT referrals_unique_referee UNIQUE(referee_address)
);

-- Create airdrops table
CREATE TABLE IF NOT EXISTS airdrops (
  id SERIAL PRIMARY KEY,
  airdrop_id INTEGER NOT NULL,
  token_address VARCHAR(42) NOT NULL,
  sender_address VARCHAR(42) NOT NULL,
  total_amount NUMERIC NOT NULL,
  recipient_count INTEGER NOT NULL,
  transaction_hash VARCHAR(66),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT airdrops_sender_idx FOREIGN KEY (sender_address) REFERENCES users(address) ON DELETE CASCADE
);

-- Create emergency_withdrawals table
CREATE TABLE IF NOT EXISTS emergency_withdrawals (
  id SERIAL PRIMARY KEY,
  presale_address VARCHAR(42) NOT NULL,
  user_address VARCHAR(42) NOT NULL,
  contribution NUMERIC NOT NULL,
  penalty NUMERIC NOT NULL,
  refund NUMERIC NOT NULL,
  transaction_hash VARCHAR(66) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT emergency_withdrawals_user_idx FOREIGN KEY (user_address) REFERENCES users(address) ON DELETE CASCADE
);

-- Create indexes for new tables
CREATE INDEX IF NOT EXISTS idx_liquidity_locks_owner ON liquidity_locks(owner_address);
CREATE INDEX IF NOT EXISTS idx_liquidity_locks_token ON liquidity_locks(token_address);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_address);
CREATE INDEX IF NOT EXISTS idx_referrals_referee ON referrals(referee_address);
CREATE INDEX IF NOT EXISTS idx_referrals_presale ON referrals(presale_address);
CREATE INDEX IF NOT EXISTS idx_airdrops_sender ON airdrops(sender_address);
CREATE INDEX IF NOT EXISTS idx_airdrops_token ON airdrops(token_address);
CREATE INDEX IF NOT EXISTS idx_emergency_withdrawals_presale ON emergency_withdrawals(presale_address);
CREATE INDEX IF NOT EXISTS idx_emergency_withdrawals_user ON emergency_withdrawals(user_address);

-- Add featured flag to presales
CREATE INDEX IF NOT EXISTS idx_presales_featured ON presales(featured);