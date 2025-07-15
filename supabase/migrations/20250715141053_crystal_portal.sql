/*
  # Badge and Governance System

  1. New Tables
    - `badges` - Stores badge information for tokens
      - `id` (uuid, primary key)
      - `token_address` (text, references tokens.contract_address)
      - `badge_type` (text) - 'kyc', 'audit', 'safu'
      - `status` (text) - 'approved', 'pending', 'revoked'
      - `document_url` (text) - URL to supporting document
      - `approved_by` (text, references users.address)
      - `approved_at` (timestamptz)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `governance_proposals` - Stores governance proposals for tokens
      - `id` (uuid, primary key)
      - `token_address` (text, references tokens.contract_address)
      - `title` (text)
      - `description` (text)
      - `creator` (text, references users.address)
      - `start_time` (timestamptz)
      - `end_time` (timestamptz)
      - `status` (text) - 'pending', 'active', 'passed', 'rejected'
      - `quorum` (numeric) - Percentage of total supply required
      - `execution_time` (timestamptz) - For time-locked execution
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `governance_votes` - Stores votes for governance proposals
      - `id` (uuid, primary key)
      - `proposal_id` (uuid, references governance_proposals.id)
      - `voter` (text, references users.address)
      - `vote` (text) - 'yes', 'no', 'abstain'
      - `vote_weight` (numeric) - Based on token balance
      - `created_at` (timestamptz)
  
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to read all badges
    - Add policies for admins to create/update badges
    - Add policies for token owners to create proposals
    - Add policies for token holders to vote on proposals
*/

-- Create badges table
CREATE TABLE IF NOT EXISTS badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_address text NOT NULL REFERENCES tokens(contract_address) ON DELETE CASCADE,
  badge_type text NOT NULL CHECK (badge_type IN ('kyc', 'audit', 'safu')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'revoked')),
  document_url text,
  notes text,
  approved_by text REFERENCES users(address) ON DELETE SET NULL,
  approved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Ensure only one badge of each type per token
  UNIQUE(token_address, badge_type)
);

-- Create governance_proposals table
CREATE TABLE IF NOT EXISTS governance_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_address text NOT NULL REFERENCES tokens(contract_address) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  creator text NOT NULL REFERENCES users(address) ON DELETE CASCADE,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'passed', 'rejected')),
  quorum numeric NOT NULL DEFAULT 10, -- Default 10% quorum
  execution_time timestamptz, -- For time-locked execution
  execution_data text, -- Optional encoded function call data
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create governance_votes table
CREATE TABLE IF NOT EXISTS governance_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid NOT NULL REFERENCES governance_proposals(id) ON DELETE CASCADE,
  voter text NOT NULL REFERENCES users(address) ON DELETE CASCADE,
  vote text NOT NULL CHECK (vote IN ('yes', 'no', 'abstain')),
  vote_weight numeric NOT NULL,
  created_at timestamptz DEFAULT now(),
  
  -- Ensure one vote per proposal per voter
  UNIQUE(proposal_id, voter)
);

-- Create admin_users table to track admin privileges
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  address text NOT NULL UNIQUE REFERENCES users(address) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_badges_token_address ON badges(token_address);
CREATE INDEX IF NOT EXISTS idx_badges_status ON badges(status);
CREATE INDEX IF NOT EXISTS idx_governance_proposals_token_address ON governance_proposals(token_address);
CREATE INDEX IF NOT EXISTS idx_governance_proposals_status ON governance_proposals(status);
CREATE INDEX IF NOT EXISTS idx_governance_votes_proposal_id ON governance_votes(proposal_id);
CREATE INDEX IF NOT EXISTS idx_governance_votes_voter ON governance_votes(voter);

-- Enable Row Level Security
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE governance_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE governance_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Create policies for badges
-- Anyone can read badges
CREATE POLICY "Anyone can read badges"
  ON badges
  FOR SELECT
  USING (true);

-- Only admins can create badges
CREATE POLICY "Only admins can create badges"
  ON badges
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.address = auth.uid()
    )
  );

-- Only admins can update badges
CREATE POLICY "Only admins can update badges"
  ON badges
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.address = auth.uid()
    )
  );

-- Create policies for governance_proposals
-- Anyone can read proposals
CREATE POLICY "Anyone can read governance proposals"
  ON governance_proposals
  FOR SELECT
  USING (true);

-- Only token owners can create proposals
CREATE POLICY "Token owners can create proposals"
  ON governance_proposals
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tokens 
      WHERE tokens.contract_address = token_address 
      AND tokens.owner_address = auth.uid()
    )
  );

-- Only proposal creators can update their proposals
CREATE POLICY "Creators can update their proposals"
  ON governance_proposals
  FOR UPDATE
  USING (creator = auth.uid());

-- Create policies for governance_votes
-- Anyone can read votes
CREATE POLICY "Anyone can read governance votes"
  ON governance_votes
  FOR SELECT
  USING (true);

-- Authenticated users can vote
CREATE POLICY "Authenticated users can vote"
  ON governance_votes
  FOR INSERT
  WITH CHECK (auth.uid() = voter);

-- Only vote owner can update their vote
CREATE POLICY "Users can update their own votes"
  ON governance_votes
  FOR UPDATE
  USING (voter = auth.uid());

-- Create policies for admin_users
-- Only super_admins can read admin list
CREATE POLICY "Only super_admins can read admin list"
  ON admin_users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.address = auth.uid()
      AND admin_users.role = 'super_admin'
    )
  );

-- Only super_admins can manage admins
CREATE POLICY "Only super_admins can manage admins"
  ON admin_users
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.address = auth.uid()
      AND admin_users.role = 'super_admin'
    )
  );

-- Create function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to update updated_at on all tables
CREATE TRIGGER update_badges_updated_at
BEFORE UPDATE ON badges
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_governance_proposals_updated_at
BEFORE UPDATE ON governance_proposals
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Insert initial super admin (platform owner)
INSERT INTO admin_users (address, role)
VALUES ('0x742d35Cc6634C0532925a3b8D4C9db96590c6C8C', 'super_admin')
ON CONFLICT (address) DO NOTHING;