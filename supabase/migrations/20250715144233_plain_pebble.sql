/*
  # Add Deployment Method Column

  1. Updates
    - Add `deployment_method` column to `tokens` table
      - Values: 'primary', 'fallback', 'emergency'
      - Default: 'primary'
*/

-- Add deployment_method column to tokens table
ALTER TABLE IF EXISTS tokens 
ADD COLUMN IF NOT EXISTS deployment_method text NOT NULL DEFAULT 'primary';

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_tokens_deployment_method ON tokens(deployment_method);

-- Add comment to explain the column
COMMENT ON COLUMN tokens.deployment_method IS 'Method used to deploy the contract: primary (Hardhat), fallback (Frontend), emergency (Backend)';