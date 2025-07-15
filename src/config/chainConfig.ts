import { Network } from '../types';

// Chain IDs in decimal format
export const CHAIN_IDS = {
  // Mainnets
  ETHEREUM: 1,
  BSC: 56,
  POLYGON: 137,
  ARBITRUM: 42161,
  FANTOM: 250,
  AVALANCHE: 43114,
  CRONOS: 25,
  CORE: 1116,
  DOGECHAIN: 2000,
  PULSECHAIN: 369,
  ZETACHAIN: 7000,
  UNICHAIN: 130,
  BITROCK: 7171,
  ALVEYCHAIN: 3797,
  OPENGPU: 1071,
  BASE: 8453,
  ESR: 25062019, // ESR Mainnet

  // Testnets
  GOERLI: 5,
  BSC_TESTNET: 97,
  MUMBAI: 80001,
  ARBITRUM_SEPOLIA: 421614,
  FANTOM_TESTNET: 4002,
  AVALANCHE_FUJI: 43113,
  CRONOS_TESTNET: 338,
  BITROCK_TESTNET: 7771,
  ESR_TESTNET: 25062019 // ESR Testnet
};

// Chain IDs in hexadecimal format for MetaMask
export const CHAIN_IDS_HEX = {
  // Mainnets
  ETHEREUM: '0x1',
  BSC: '0x38',
  POLYGON: '0x89',
  ARBITRUM: '0xA4B1',
  FANTOM: '0xFA',
  AVALANCHE: '0xA86A',
  CRONOS: '0x19',
  CORE: '0x45C',
  DOGECHAIN: '0x7D0',
  PULSECHAIN: '0x171',
  ZETACHAIN: '0x1B58',
  UNICHAIN: '0x82',
  BITROCK: '0x1C8B',
  ALVEYCHAIN: '0xED5',
  OPENGPU: '0x42F',
  BASE: '0x2105',
  ESR: '0x17E5F13', // ESR Mainnet

  // Testnets
  GOERLI: '0x5',
  BSC_TESTNET: '0x61',
  MUMBAI: '0x13881',
  ARBITRUM_SEPOLIA: '0x66EEE',
  FANTOM_TESTNET: '0xFA2',
  AVALANCHE_FUJI: '0xA869',
  CRONOS_TESTNET: '0x152',
  BITROCK_TESTNET: '0x1E41',
  ESR_TESTNET: '0x17E5F13' // ESR Testnet
};

// Chain configuration for MetaMask
export const CHAIN_CONFIG = {
  // Mainnets
  [CHAIN_IDS.ETHEREUM]: {
    chainId: CHAIN_IDS_HEX.ETHEREUM,
    chainName: 'Ethereum Mainnet',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    },
    rpcUrls: ['https://rpc.ankr.com/eth'],
    blockExplorerUrls: ['https://etherscan.io']
  },
  [CHAIN_IDS.BSC]: {
    chainId: CHAIN_IDS_HEX.BSC,
    chainName: 'BNB Smart Chain',
    nativeCurrency: {
      name: 'BNB',
      symbol: 'BNB',
      decimals: 18
    },
    rpcUrls: ['https://bsc-dataseed1.binance.org'],
    blockExplorerUrls: ['https://bscscan.com']
  },
  [CHAIN_IDS.POLYGON]: {
    chainId: CHAIN_IDS_HEX.POLYGON,
    chainName: 'Polygon',
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18
    },
    rpcUrls: ['https://polygon-rpc.com'],
    blockExplorerUrls: ['https://polygonscan.com']
  },
  [CHAIN_IDS.ARBITRUM]: {
    chainId: CHAIN_IDS_HEX.ARBITRUM,
    chainName: 'Arbitrum One',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    },
    rpcUrls: ['https://arb1.arbitrum.io/rpc'],
    blockExplorerUrls: ['https://arbiscan.io']
  },
  [CHAIN_IDS.FANTOM]: {
    chainId: CHAIN_IDS_HEX.FANTOM,
    chainName: 'Fantom Opera',
    nativeCurrency: {
      name: 'Fantom',
      symbol: 'FTM',
      decimals: 18
    },
    rpcUrls: ['https://rpc.ftm.tools'],
    blockExplorerUrls: ['https://ftmscan.com']
  },
  [CHAIN_IDS.AVALANCHE]: {
    chainId: CHAIN_IDS_HEX.AVALANCHE,
    chainName: 'Avalanche C-Chain',
    nativeCurrency: {
      name: 'Avalanche',
      symbol: 'AVAX',
      decimals: 18
    },
    rpcUrls: ['https://api.avax.network/ext/bc/C/rpc'],
    blockExplorerUrls: ['https://snowtrace.io']
  },
  [CHAIN_IDS.CRONOS]: {
    chainId: CHAIN_IDS_HEX.CRONOS,
    chainName: 'Cronos Mainnet',
    nativeCurrency: {
      name: 'Cronos',
      symbol: 'CRO',
      decimals: 18
    },
    rpcUrls: ['https://evm-cronos.crypto.org'],
    blockExplorerUrls: ['https://cronoscan.com']
  },
  [CHAIN_IDS.CORE]: {
    chainId: CHAIN_IDS_HEX.CORE,
    chainName: 'Core Mainnet',
    nativeCurrency: {
      name: 'Core',
      symbol: 'CORE',
      decimals: 18
    },
    rpcUrls: ['https://rpc.coredao.org'],
    blockExplorerUrls: ['https://scan.coredao.org']
  },
  [CHAIN_IDS.DOGECHAIN]: {
    chainId: CHAIN_IDS_HEX.DOGECHAIN,
    chainName: 'DogeChain',
    nativeCurrency: {
      name: 'Doge',
      symbol: 'DOGE',
      decimals: 18
    },
    rpcUrls: ['https://rpc.dogechain.dog'],
    blockExplorerUrls: ['https://explorer.dogechain.dog']
  },
  [CHAIN_IDS.PULSECHAIN]: {
    chainId: CHAIN_IDS_HEX.PULSECHAIN,
    chainName: 'PulseChain',
    nativeCurrency: {
      name: 'Pulse',
      symbol: 'PLS',
      decimals: 18
    },
    rpcUrls: ['https://rpc.pulsechain.com'],
    blockExplorerUrls: ['https://scan.pulsechain.com']
  },
  [CHAIN_IDS.ZETACHAIN]: {
    chainId: CHAIN_IDS_HEX.ZETACHAIN,
    chainName: 'ZetaChain',
    nativeCurrency: {
      name: 'Zeta',
      symbol: 'ZETA',
      decimals: 18
    },
    rpcUrls: ['https://zetachain-evm.blockpi.network/v1/rpc/public'],
    blockExplorerUrls: ['https://explorer.zetachain.com']
  },
  [CHAIN_IDS.UNICHAIN]: {
    chainId: CHAIN_IDS_HEX.UNICHAIN,
    chainName: 'Unichain',
    nativeCurrency: {
      name: 'Unicoin',
      symbol: 'UNI',
      decimals: 18
    },
    rpcUrls: ['https://mainnet.unichain.org'],
    blockExplorerUrls: ['https://uniscan.xyz']
  },
  [CHAIN_IDS.BITROCK]: {
    chainId: CHAIN_IDS_HEX.BITROCK,
    chainName: 'Bitrock Mainnet',
    nativeCurrency: {
      name: 'Bitrock',
      symbol: 'BROCK',
      decimals: 18
    },
    rpcUrls: ['https://connect.bit-rock.io'],
    blockExplorerUrls: ['https://scan.bit-rock.io']
  },
  [CHAIN_IDS.ALVEYCHAIN]: {
    chainId: CHAIN_IDS_HEX.ALVEYCHAIN,
    chainName: 'AlveyChain',
    nativeCurrency: {
      name: 'Alvey',
      symbol: 'ALV',
      decimals: 18
    },
    rpcUrls: ['https://elves-core1.alvey.io'],
    blockExplorerUrls: ['https://alveyscan.com']
  },
  [CHAIN_IDS.OPENGPU]: {
    chainId: CHAIN_IDS_HEX.OPENGPU,
    chainName: 'OpenGPU Network',
    nativeCurrency: {
      name: 'OpenGPU',
      symbol: 'GPU',
      decimals: 18
    },
    rpcUrls: ['https://mainnet.opengpu.io/rpc'],
    blockExplorerUrls: ['https://explorer.opengpu.io']
  },
  [CHAIN_IDS.BASE]: {
    chainId: CHAIN_IDS_HEX.BASE,
    chainName: 'Base Mainnet',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    },
    rpcUrls: ['https://base-rpc.publicnode.com'],
    blockExplorerUrls: ['https://basescan.org']
  },
  [CHAIN_IDS.ESR]: {
    chainId: CHAIN_IDS_HEX.ESR,
    chainName: 'ESR Mainnet',
    nativeCurrency: {
      name: 'ESR',
      symbol: 'ESR',
      decimals: 18
    },
    rpcUrls: ['https://rpc.esrscan.com'],
    blockExplorerUrls: ['https://esrscan.com']
  },

  // Testnets
  [CHAIN_IDS.GOERLI]: {
    chainId: CHAIN_IDS_HEX.GOERLI,
    chainName: 'Goerli Testnet',
    nativeCurrency: {
      name: 'Goerli Ether',
      symbol: 'ETH',
      decimals: 18
    },
    rpcUrls: ['https://rpc.ankr.com/eth_goerli'],
    blockExplorerUrls: ['https://goerli.etherscan.io']
  },
  [CHAIN_IDS.BSC_TESTNET]: {
    chainId: CHAIN_IDS_HEX.BSC_TESTNET,
    chainName: 'BSC Testnet',
    nativeCurrency: {
      name: 'BNB',
      symbol: 'BNB',
      decimals: 18
    },
    rpcUrls: ['https://data-seed-prebsc-1-s1.binance.org:8545'],
    blockExplorerUrls: ['https://testnet.bscscan.com']
  },
  [CHAIN_IDS.MUMBAI]: {
    chainId: CHAIN_IDS_HEX.MUMBAI,
    chainName: 'Polygon Mumbai',
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18
    },
    rpcUrls: ['https://rpc-mumbai.maticvigil.com'],
    blockExplorerUrls: ['https://mumbai.polygonscan.com']
  },
  [CHAIN_IDS.ARBITRUM_SEPOLIA]: {
    chainId: CHAIN_IDS_HEX.ARBITRUM_SEPOLIA,
    chainName: 'Arbitrum Sepolia',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    },
    rpcUrls: ['https://sepolia-rollup.arbitrum.io/rpc'],
    blockExplorerUrls: ['https://sepolia.arbiscan.io']
  },
  [CHAIN_IDS.FANTOM_TESTNET]: {
    chainId: CHAIN_IDS_HEX.FANTOM_TESTNET,
    chainName: 'Fantom Testnet',
    nativeCurrency: {
      name: 'Fantom',
      symbol: 'FTM',
      decimals: 18
    },
    rpcUrls: ['https://rpc.testnet.fantom.network'],
    blockExplorerUrls: ['https://testnet.ftmscan.com']
  },
  [CHAIN_IDS.AVALANCHE_FUJI]: {
    chainId: CHAIN_IDS_HEX.AVALANCHE_FUJI,
    chainName: 'Avalanche Fuji',
    nativeCurrency: {
      name: 'Avalanche',
      symbol: 'AVAX',
      decimals: 18
    },
    rpcUrls: ['https://api.avax-test.network/ext/bc/C/rpc'],
    blockExplorerUrls: ['https://testnet.snowtrace.io']
  },
  [CHAIN_IDS.CRONOS_TESTNET]: {
    chainId: CHAIN_IDS_HEX.CRONOS_TESTNET,
    chainName: 'Cronos Testnet',
    nativeCurrency: {
      name: 'Cronos',
      symbol: 'CRO',
      decimals: 18
    },
    rpcUrls: ['https://evm-t3.cronos.org'],
    blockExplorerUrls: ['https://testnet.cronoscan.com']
  },
  [CHAIN_IDS.BITROCK_TESTNET]: {
    chainId: CHAIN_IDS_HEX.BITROCK_TESTNET,
    chainName: 'Bitrock Testnet',
    nativeCurrency: {
      name: 'Bitrock',
      symbol: 'BROCK',
      decimals: 18
    },
    rpcUrls: ['https://testnet.bit-rock.io'],
    blockExplorerUrls: ['https://testnet-scan.bit-rock.io']
  },
  [CHAIN_IDS.ESR_TESTNET]: {
    chainId: CHAIN_IDS_HEX.ESR_TESTNET,
    chainName: 'ESR Testnet',
    nativeCurrency: {
      name: 'ESR',
      symbol: 'ESR',
      decimals: 18
    },
    rpcUrls: ['https://testnet.rpc.esrscan.com'],
    blockExplorerUrls: ['https://testnet.esrscan.com']
  }
};

// Get mainnet chain IDs
export const getMainnetChainIds = (): number[] => [
  CHAIN_IDS.ETHEREUM,
  CHAIN_IDS.BSC,
  CHAIN_IDS.POLYGON,
  CHAIN_IDS.ARBITRUM,
  CHAIN_IDS.FANTOM,
  CHAIN_IDS.AVALANCHE,
  CHAIN_IDS.CRONOS,
  CHAIN_IDS.CORE,
  CHAIN_IDS.DOGECHAIN,
  CHAIN_IDS.PULSECHAIN,
  CHAIN_IDS.ZETACHAIN,
  CHAIN_IDS.UNICHAIN,
  CHAIN_IDS.BITROCK,
  CHAIN_IDS.ALVEYCHAIN,
  CHAIN_IDS.OPENGPU,
  CHAIN_IDS.BASE,
  CHAIN_IDS.ESR
];

// Get testnet chain IDs
export const getTestnetChainIds = (): number[] => [
  CHAIN_IDS.GOERLI,
  CHAIN_IDS.BSC_TESTNET,
  CHAIN_IDS.MUMBAI,
  CHAIN_IDS.ARBITRUM_SEPOLIA,
  CHAIN_IDS.FANTOM_TESTNET,
  CHAIN_IDS.AVALANCHE_FUJI,
  CHAIN_IDS.CRONOS_TESTNET,
  CHAIN_IDS.BITROCK_TESTNET,
  CHAIN_IDS.ESR_TESTNET
];

// Check if a chain ID is a testnet
export const isTestnetChain = (chainId: number): boolean => {
  return getTestnetChainIds().includes(chainId);
};

// Check if a chain ID is a mainnet
export const isMainnetChain = (chainId: number): boolean => {
  return getMainnetChainIds().includes(chainId);
};

// Get chain config for a specific chain ID
export const getChainConfig = (chainId: number) => {
  return CHAIN_CONFIG[chainId];
};

// Map Network object to chain ID
export const getChainIdFromNetwork = (network: Network): number => {
  return network.chainId;
};

// Map chain ID to Network object
export const getNetworkFromChainId = (chainId: number, networks: Network[]): Network | undefined => {
  return networks.find(network => network.chainId === chainId);
};