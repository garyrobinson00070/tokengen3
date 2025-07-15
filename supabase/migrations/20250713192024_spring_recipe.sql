-- Add new chain support to tokens table
ALTER TABLE IF EXISTS tokens 
ADD COLUMN IF NOT EXISTS chain_id_hex VARCHAR(10);

-- Add new chain support to presales table
ALTER TABLE IF EXISTS presales
ADD COLUMN IF NOT EXISTS chain_id_hex VARCHAR(10);

-- Create network_metadata table for storing chain information
CREATE TABLE IF NOT EXISTS network_metadata (
  id SERIAL PRIMARY KEY,
  chain_id INTEGER NOT NULL UNIQUE,
  chain_id_hex VARCHAR(10) NOT NULL UNIQUE,
  name VARCHAR(50) NOT NULL,
  symbol VARCHAR(10) NOT NULL,
  rpc_url VARCHAR(255) NOT NULL,
  explorer_url VARCHAR(255) NOT NULL,
  is_testnet BOOLEAN DEFAULT false,
  gas_price VARCHAR(50),
  icon VARCHAR(10),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert initial network data
INSERT INTO network_metadata (chain_id, chain_id_hex, name, symbol, rpc_url, explorer_url, is_testnet, gas_price, icon)
VALUES
  -- Mainnets
  (1, '0x1', 'Ethereum', 'ETH', 'https://rpc.ankr.com/eth', 'https://etherscan.io', false, '0.015 ETH', '🔷'),
  (56, '0x38', 'Binance Smart Chain', 'BNB', 'https://bsc-dataseed1.binance.org', 'https://bscscan.com', false, '0.003 BNB', '🟡'),
  (137, '0x89', 'Polygon', 'MATIC', 'https://polygon-rpc.com', 'https://polygonscan.com', false, '0.01 MATIC', '🟣'),
  (42161, '0xA4B1', 'Arbitrum', 'ETH', 'https://arb1.arbitrum.io/rpc', 'https://arbiscan.io', false, '0.0001 ETH', '🔵'),
  (250, '0xFA', 'Fantom', 'FTM', 'https://rpc.ftm.tools', 'https://ftmscan.com', false, '0.5 FTM', '🌟'),
  (43114, '0xA86A', 'Avalanche', 'AVAX', 'https://api.avax.network/ext/bc/C/rpc', 'https://snowtrace.io', false, '0.025 AVAX', '🔺'),
  (25, '0x19', 'Cronos', 'CRO', 'https://evm-cronos.crypto.org', 'https://cronoscan.com', false, '5000 CRO', '⚡'),
  (1116, '0x45C', 'Core', 'CORE', 'https://rpc.coredao.org', 'https://scan.coredao.org', false, '0.01 CORE', '🔘'),
  (2000, '0x7D0', 'DogeChain', 'DOGE', 'https://rpc.dogechain.dog', 'https://explorer.dogechain.dog', false, '0.1 DOGE', '🐕'),
  (369, '0x171', 'PulseChain', 'PLS', 'https://rpc.pulsechain.com', 'https://scan.pulsechain.com', false, '0.001 PLS', '💗'),
  (7000, '0x1B58', 'ZetaChain', 'ZETA', 'https://zetachain-evm.blockpi.network/v1/rpc/public', 'https://explorer.zetachain.com', false, '0.01 ZETA', '🔗'),
  (130, '0x82', 'Unichain', 'UNI', 'https://mainnet.unichain.org', 'https://uniscan.xyz', false, '0.01 UNI', '🦄'),
  (7171, '0x1C8B', 'Bitrock', 'BROCK', 'https://connect.bit-rock.io', 'https://scan.bit-rock.io', false, '0.01 BROCK', '🪨'),
  (3797, '0xED5', 'AlveyChain', 'ALV', 'https://elves-core1.alvey.io', 'https://alveyscan.com', false, '0.01 ALV', '🧝'),
  (1071, '0x42F', 'OpenGPU', 'GPU', 'https://mainnet.opengpu.io/rpc', 'https://explorer.opengpu.io', false, '0.01 GPU', '🖥️'),
  (8453, '0x2105', 'Base', 'ETH', 'https://base-rpc.publicnode.com', 'https://basescan.org', false, '0.0001 ETH', '🔵'),
  (25062019, '0x17E5F13', 'ESR', 'ESR', 'https://rpc.esrscan.com', 'https://esrscan.com', false, '0.001 ESR', '⚡'),
  
  -- Testnets
  (5, '0x5', 'Ethereum Goerli', 'ETH', 'https://rpc.ankr.com/eth_goerli', 'https://goerli.etherscan.io', true, '0.001 ETH', '🔷'),
  (97, '0x61', 'BSC Testnet', 'tBNB', 'https://data-seed-prebsc-1-s1.binance.org:8545', 'https://testnet.bscscan.com', true, '0.001 tBNB', '🟡'),
  (80001, '0x13881', 'Polygon Mumbai', 'MATIC', 'https://rpc-mumbai.maticvigil.com', 'https://mumbai.polygonscan.com', true, '0.001 MATIC', '🟣'),
  (421614, '0x66EEE', 'Arbitrum Sepolia', 'ETH', 'https://sepolia-rollup.arbitrum.io/rpc', 'https://sepolia.arbiscan.io', true, '0.0001 ETH', '🔵'),
  (4002, '0xFA2', 'Fantom Testnet', 'FTM', 'https://rpc.testnet.fantom.network', 'https://testnet.ftmscan.com', true, '0.001 FTM', '🌟'),
  (43113, '0xA869', 'Avalanche Fuji', 'AVAX', 'https://api.avax-test.network/ext/bc/C/rpc', 'https://testnet.snowtrace.io', true, '0.001 AVAX', '🔺'),
  (338, '0x152', 'Cronos Testnet', 'CRO', 'https://evm-t3.cronos.org', 'https://testnet.cronoscan.com', true, '0.001 CRO', '⚡'),
  (7771, '0x1E41', 'Bitrock Testnet', 'BROCK', 'https://testnet.bit-rock.io', 'https://testnet-scan.bit-rock.io', true, '0.001 BROCK', '🪨')
ON CONFLICT (chain_id) DO NOTHING;

-- Create user_network_preferences table
CREATE TABLE IF NOT EXISTS user_network_preferences (
  id SERIAL PRIMARY KEY,
  user_address VARCHAR(42) NOT NULL,
  preferred_network_id INTEGER,
  preferred_mode VARCHAR(10) DEFAULT 'mainnet',
  last_used_networks JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT user_network_preferences_user_idx FOREIGN KEY (user_address) REFERENCES users(address) ON DELETE CASCADE,
  CONSTRAINT user_network_preferences_network_idx FOREIGN KEY (preferred_network_id) REFERENCES network_metadata(chain_id) ON DELETE SET NULL
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_network_preferences_user ON user_network_preferences(user_address);