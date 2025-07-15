import { Network } from '../types';
import { SELF_HOSTED_RPC } from '../config/constants';

export const mainnets: Network[] = [
  {
    id: 'ethereum',
    name: 'Ethereum',
    symbol: 'ETH',
    chainId: 1,
    rpcUrl: SELF_HOSTED_RPC[1],
    explorerUrl: 'https://etherscan.io',
    gasPrice: '0.015 ETH (~$35)'
  },
  {
    id: 'bsc',
    name: 'Binance Smart Chain',
    symbol: 'BNB',
    chainId: 56,
    rpcUrl: SELF_HOSTED_RPC[56],
    explorerUrl: 'https://bscscan.com',
    gasPrice: '0.003 BNB (~$2)'
  },
  {
    id: 'polygon',
    name: 'Polygon',
    symbol: 'MATIC',
    chainId: 137,
    rpcUrl: SELF_HOSTED_RPC[137],
    explorerUrl: 'https://polygonscan.com',
    gasPrice: '0.01 MATIC (~$0.01)'
  },
  {
    id: 'arbitrum',
    name: 'Arbitrum',
    symbol: 'ETH',
    chainId: 42161,
    rpcUrl: SELF_HOSTED_RPC[42161],
    explorerUrl: 'https://arbiscan.io',
    gasPrice: '0.0001 ETH (~$0.25)'
  },
  {
    id: 'fantom',
    name: 'Fantom',
    symbol: 'FTM',
    chainId: 250,
    rpcUrl: SELF_HOSTED_RPC[250],
    explorerUrl: 'https://ftmscan.com',
    gasPrice: '0.5 FTM (~$0.15)'
  },
  {
    id: 'avalanche',
    name: 'Avalanche',
    symbol: 'AVAX',
    chainId: 43114,
    rpcUrl: SELF_HOSTED_RPC[43114],
    explorerUrl: 'https://snowtrace.io',
    gasPrice: '0.025 AVAX (~$0.75)'
  },
  {
    id: 'cronos',
    name: 'Cronos',
    symbol: 'CRO',
    chainId: 25,
    rpcUrl: SELF_HOSTED_RPC[25],
    explorerUrl: 'https://cronoscan.com',
    gasPrice: '5000 CRO (~$0.50)'
  },
  {
    id: 'core',
    name: 'Core',
    symbol: 'CORE',
    chainId: 1116,
    rpcUrl: SELF_HOSTED_RPC[1116],
    explorerUrl: 'https://scan.coredao.org',
    gasPrice: '0.01 CORE (~$0.10)'
  },
  {
    id: 'dogechain',
    name: 'DogeChain',
    symbol: 'DOGE',
    chainId: 2000,
    rpcUrl: SELF_HOSTED_RPC[2000],
    explorerUrl: 'https://explorer.dogechain.dog',
    gasPrice: '0.1 DOGE (~$0.01)'
  },
  {
    id: 'pulsechain',
    name: 'PulseChain',
    symbol: 'PLS',
    chainId: 369,
    rpcUrl: SELF_HOSTED_RPC[369],
    explorerUrl: 'https://scan.pulsechain.com',
    gasPrice: '0.001 PLS (~$0.01)'
  },
  {
    id: 'zetachain',
    name: 'ZetaChain',
    symbol: 'ZETA',
    chainId: 7000,
    rpcUrl: SELF_HOSTED_RPC[7000],
    explorerUrl: 'https://explorer.zetachain.com',
    gasPrice: '0.01 ZETA (~$0.05)'
  },
  {
    id: 'unichain',
    name: 'Unichain',
    symbol: 'UNI',
    chainId: 130,
    rpcUrl: SELF_HOSTED_RPC[130],
    explorerUrl: 'https://uniscan.xyz',
    gasPrice: '0.01 UNI (~$0.05)'
  },
  {
    id: 'bitrock',
    name: 'Bitrock',
    symbol: 'BROCK',
    chainId: 7171,
    rpcUrl: SELF_HOSTED_RPC[7171],
    explorerUrl: 'https://scan.bit-rock.io',
    gasPrice: '0.01 BROCK (~$0.05)'
  },
  {
    id: 'alveychain',
    name: 'AlveyChain',
    symbol: 'ALV',
    chainId: 3797,
    rpcUrl: SELF_HOSTED_RPC[3797],
    explorerUrl: 'https://alveyscan.com',
    gasPrice: '0.01 ALV (~$0.05)'
  },
  {
    id: 'opengpu',
    name: 'OpenGPU',
    symbol: 'GPU',
    chainId: 1071,
    rpcUrl: SELF_HOSTED_RPC[1071],
    explorerUrl: 'https://explorer.opengpu.io',
    gasPrice: '0.01 GPU (~$0.05)'
  },
  {
    id: 'base',
    name: 'Base',
    symbol: 'ETH',
    chainId: 8453,
    rpcUrl: SELF_HOSTED_RPC[8453],
    explorerUrl: 'https://basescan.org',
    gasPrice: '0.0001 ETH (~$0.25)'
  }
];

export const testnets: Network[] = [
  {
    id: 'estar-testnet',
    name: 'Estar Testnet',
    symbol: 'ESR',
    chainId: 25062019,
    rpcUrl: SELF_HOSTED_RPC[25062019],
    explorerUrl: 'https://testnet.esrscan.com',
    gasPrice: '0.001 ESR (~$0.00)'
  },
  {
    id: 'goerli',
    name: 'Ethereum Goerli',
    symbol: 'ETH',
    chainId: 5,
    rpcUrl: SELF_HOSTED_RPC[5],
    explorerUrl: 'https://goerli.etherscan.io',
    gasPrice: '0.001 ETH (~$0.00)'
  },
  {
    id: 'bsc-testnet',
    name: 'BSC Testnet',
    symbol: 'tBNB',
    chainId: 97,
    rpcUrl: SELF_HOSTED_RPC[97],
    explorerUrl: 'https://testnet.bscscan.com',
    gasPrice: '0.001 tBNB (~$0.00)'
  },
  {
    id: 'mumbai',
    name: 'Polygon Mumbai',
    symbol: 'MATIC',
    chainId: 80001,
    rpcUrl: SELF_HOSTED_RPC[80001],
    explorerUrl: 'https://mumbai.polygonscan.com',
    gasPrice: '0.001 MATIC (~$0.00)'
  },
  {
    id: 'arbitrum-sepolia',
    name: 'Arbitrum Sepolia',
    symbol: 'ETH',
    chainId: 421614,
    rpcUrl: SELF_HOSTED_RPC[421614],
    explorerUrl: 'https://sepolia.arbiscan.io',
    gasPrice: '0.0001 ETH (~$0.00)'
  },
  {
    id: 'fantom-testnet',
    name: 'Fantom Testnet',
    symbol: 'FTM',
    chainId: 4002,
    rpcUrl: SELF_HOSTED_RPC[4002],
    explorerUrl: 'https://testnet.ftmscan.com',
    gasPrice: '0.001 FTM (~$0.00)'
  },
  {
    id: 'avalanche-fuji',
    name: 'Avalanche Fuji',
    symbol: 'AVAX',
    chainId: 43113,
    rpcUrl: SELF_HOSTED_RPC[43113],
    explorerUrl: 'https://testnet.snowtrace.io',
    gasPrice: '0.001 AVAX (~$0.00)'
  },
  {
    id: 'cronos-testnet',
    name: 'Cronos Testnet',
    symbol: 'CRO',
    chainId: 338,
    rpcUrl: SELF_HOSTED_RPC[338],
    explorerUrl: 'https://testnet.cronoscan.com',
    gasPrice: '0.001 CRO (~$0.00)'
  },
  {
    id: 'bitrock-testnet',
    name: 'Bitrock Testnet',
    symbol: 'BROCK',
    chainId: 7771,
    rpcUrl: SELF_HOSTED_RPC[7771],
    explorerUrl: 'https://testnet-scan.bit-rock.io',
    gasPrice: '0.001 BROCK (~$0.00)'
  }
];

export const networks = [...mainnets, ...testnets];