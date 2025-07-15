-- Token Metadata System
/*
  # Token Metadata System

  1. New Tables
    - `token_metadata` - Stores metadata for tokens
      - `id` (uuid, primary key)
      - `token_address` (text, unique, references tokens.contract_address)
      - `name` (text)
      - `symbol` (text)
      - `description` (text)
      - `logo_url` (text)
      - `website_url` (text)
      - `twitter_url` (text)
      - `telegram_url` (text)
      - `discord_url` (text)
      - `github_url` (text)
      - `whitepaper_url` (text)
      - `tags` (text[])
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `created_by` (text, references users.address)
  
  2. Security
    - Enable RLS on `token_metadata` table
    - Add policies for authenticated users to read all metadata
    - Add policy for token owners to update their token's metadata
*/

-- Create token_metadata table
CREATE TABLE IF NOT EXISTS token_metadata (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_address text UNIQUE NOT NULL REFERENCES tokens(contract_address) ON DELETE CASCADE,
  name text,
  symbol text,
  description text,
  logo_url text,
  website_url text,
  twitter_url text,
  telegram_url text,
  discord_url text,
  github_url text,
  whitepaper_url text,
  tags text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by text REFERENCES users(address) ON DELETE SET NULL
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_token_metadata_token_address ON token_metadata(token_address);

-- Enable Row Level Security
ALTER TABLE token_metadata ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Everyone can read token metadata
CREATE POLICY "Anyone can read token metadata"
  ON token_metadata
  FOR SELECT
  USING (true);

-- Only token owners can insert their token's metadata
CREATE POLICY "Token owners can insert their token's metadata"
  ON token_metadata
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tokens 
      WHERE tokens.contract_address = token_address 
      AND tokens.owner_address = auth.uid()
    )
  );

-- Only token owners can update their token's metadata
CREATE POLICY "Token owners can update their token's metadata"
  ON token_metadata
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM tokens 
      WHERE tokens.contract_address = token_address 
      AND tokens.owner_address = auth.uid()
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

-- Create trigger to update updated_at on token_metadata
CREATE TRIGGER update_token_metadata_updated_at
BEFORE UPDATE ON token_metadata
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();