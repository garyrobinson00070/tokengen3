/*
  # Governance Contracts Table

  1. New Tables
    - `governance_contracts` - Stores deployed governance contracts
      - `id` (uuid, primary key)
      - `contract_address` (text, unique)
      - `token_address` (text, references tokens.contract_address)
      - `owner_address` (text, references users.address)
      - `network_id` (text)
      - `network_name` (text)
      - `network_chain_id` (integer)
      - `transaction_hash` (text)
      - `verified` (boolean)
      - `created_at` (timestamptz)
  
  2. Security
    - Enable RLS on governance_contracts table
    - Add policies for authenticated users to read all governance contracts
    - Add policies for token owners to create governance contracts
*/

-- Create governance_contracts table
CREATE TABLE IF NOT EXISTS governance_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_address text UNIQUE NOT NULL,
  token_address text NOT NULL REFERENCES tokens(contract_address) ON DELETE CASCADE,
  owner_address text NOT NULL REFERENCES users(address) ON DELETE CASCADE,
  network_id text NOT NULL,
  network_name text NOT NULL,
  network_chain_id integer NOT NULL,
  transaction_hash text NOT NULL,
  verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_governance_contracts_token_address ON governance_contracts(token_address);
CREATE INDEX IF NOT EXISTS idx_governance_contracts_owner_address ON governance_contracts(owner_address);

-- Enable Row Level Security
ALTER TABLE governance_contracts ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Anyone can read governance contracts
CREATE POLICY "Anyone can read governance contracts"
  ON governance_contracts
  FOR SELECT
  USING (true);

-- Only token owners can create governance contracts
CREATE POLICY "Token owners can create governance contracts"
  ON governance_contracts
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tokens 
      WHERE tokens.contract_address = token_address 
      AND tokens.owner_address = auth.uid()
    )
  );

-- Only contract owners can update their governance contracts
CREATE POLICY "Owners can update their governance contracts"
  ON governance_contracts
  FOR UPDATE
  USING (owner_address = auth.uid());