# TokenForge - Create and Deploy ERC-20 Tokens

TokenForge is a comprehensive platform for creating and deploying professional-grade ERC-20/BEP-20 tokens across multiple blockchains using Hardhat. With an intuitive interface, secure backend deployment, and advanced features, TokenForge makes token creation accessible to everyone while maintaining enterprise-grade security and reliability.

## 🚀 New Multi-Chain Support

TokenForge now supports **25+ EVM-compatible blockchains** including:

- **16 Mainnets**: Ethereum, BSC, Polygon, Arbitrum, Fantom, Avalanche, Cronos, Core, DogeChain, PulseChain, ZetaChain, Unichain, Bitrock, AlveyChain, OpenGPU, and Base
- **8 Testnets**: Goerli, BSC Testnet, Mumbai, Arbitrum Sepolia, Fantom Testnet, Avalanche Fuji, Cronos Testnet, and Bitrock Testnet

### Multi-Chain Features

- **Complete Chain Metadata**: Chain IDs, network names, symbols, and icons
- **MetaMask Integration**: Auto-add networks and switch chains seamlessly
- **Network Mode Toggle**: Switch between mainnet and testnet modes with real-time feedback
- **Chain Detection**: Automatically detect and adapt to the connected chain
- **Network Selector**: Intuitive dropdown for selecting deployment networks
- **Visual Indicators**: Clear feedback on current network and mode status

## 🚀 New Hardhat Integration

TokenForge now uses **Hardhat** for all contract deployments, providing:
- **Production-Grade Deployment**: Secure, tested deployment scripts
- **Automatic Verification**: Contracts verified on blockchain explorers
- **Multi-Network Support**: Seamless deployment across all supported networks
- **Gas Optimization**: Optimized contracts with reduced deployment costs
- **25+ Blockchain Support**: Deploy on any of 16 mainnets and 8 testnets
- **Deployment Tracking**: Complete deployment history and status monitoring
- **Backend Security**: Secure API-based deployment with authentication
- **Real Blockchain Integration**: Live data fetching from actual contracts
- **ESR Token Integration**: Real ESR token balance checking and deduction
- **Dynamic RPC Configuration**: Environment-based RPC endpoints for all networks

### Architecture Overview

```
Frontend (React + TypeScript)
    ↓ API Calls
Backend (Node.js + Express)
    ↓ Hardhat Scripts
Blockchain Networks
```

The platform now operates with a secure backend service that handles all contract compilation and deployment using Hardhat, while the frontend provides the user interface and wallet integration.

## 🔗 Real Blockchain Integration Features

### Multi-Chain Support
- **25+ Blockchain Networks**: Support for all major EVM-compatible chains
- **MetaMask Integration**: Seamless network switching and addition
- **Network Mode Toggle**: Easy switching between mainnet and testnet modes
- **Chain Detection**: Automatic detection of connected chain
- **Network Visualization**: Clear visual indicators for network status

### ESR Token Integration
- **Real Balance Checking**: Actual ESR token balance queries using ethers.js
- **Token Deduction**: Real token transfers to platform wallet with transaction confirmation
- **Transaction Tracking**: Complete transaction status monitoring and confirmation
- **Error Handling**: Comprehensive error handling for failed transactions

### Live Data Fetching
- **Token Statistics**: Real-time holder count, transfer count, and supply data
- **Sale Statistics**: Live presale data including raised amounts and participant counts
- **Auto-Refresh**: Periodic updates every 15-30 seconds for live data
- **Status Calculation**: Real-time status based on actual dates and contract state

### Dynamic Network Configuration
- **Environment-Based RPC**: All networks use environment variables with fallbacks
- **Multiple Providers**: Support for Infura, Alchemy, and custom RPC providers
- **Automatic Failover**: Fallback to public RPCs if custom endpoints fail
- **Network Detection**: Automatic network switching and validation

## Theme Colors and CSS

### Global Theme Colors
```css
/* Primary Gradients */
.primary-gradient {
  background-image: linear-gradient(to right, from-blue-500 to-purple-600);
}

.secondary-gradient {
  background-image: linear-gradient(to right, from-green-500 to-blue-600);
}

/* Background Colors */
.page-background {
  background-image: linear-gradient(to bottom right, from-slate-900 via-purple-900 to-slate-900);
}

.card-background {
  background-color: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

/* Status Colors */
.status-live {
  color: #4ade80; /* text-green-400 */
  background-color: rgba(74, 222, 128, 0.2); /* bg-green-500/20 */
}

.status-upcoming {
  color: #60a5fa; /* text-blue-400 */
  background-color: rgba(96, 165, 250, 0.2); /* bg-blue-500/20 */
}

.status-ended {
  color: #9ca3af; /* text-gray-400 */
  background-color: rgba(156, 163, 175, 0.2); /* bg-gray-500/20 */
}

.status-cancelled {
  color: #f87171; /* text-red-400 */
  background-color: rgba(248, 113, 113, 0.2); /* bg-red-500/20 */
}
```

### Page-Specific Themes

#### Landing Page
```css
.landing-page {
  background-image: linear-gradient(to bottom right, from-slate-900 via-purple-900 to-slate-900);
}

.hero-heading {
  font-size: 5rem;
  font-weight: 700;
  color: white;
}

.hero-gradient-text {
  background-image: linear-gradient(to right, from-blue-400 to-purple-400);
  background-clip: text;
  color: transparent;
}

.feature-card {
  background-color: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.75rem;
  padding: 2rem;
}

.feature-icon {
  width: 3rem;
  height: 3rem;
  background-image: linear-gradient(to right, from-blue-500 to-purple-600);
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.5rem;
}
```

#### Token Builder
```css
.token-builder {
  background-image: linear-gradient(to bottom right, from-slate-900 via-purple-900 to-slate-900);
}

.form-section {
  background-color: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.75rem;
  padding: 2rem;
  margin-bottom: 2rem;
}

.form-input {
  width: 100%;
  background-color: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.5rem;
  padding: 0.75rem 1rem;
  color: white;
}

.network-card {
  padding: 1rem;
  border-radius: 0.5rem;
  border: 2px solid rgba(255, 255, 255, 0.2);
  background-color: rgba(255, 255, 255, 0.05);
  cursor: pointer;
  transition: all 0.2s;
}

.network-card.selected {
  border-color: #3b82f6; /* border-blue-500 */
  background-color: rgba(59, 130, 246, 0.2); /* bg-blue-500/20 */
  box-shadow: 0 10px 15px -3px rgba(59, 130, 246, 0.25); /* shadow-lg shadow-blue-500/25 */
}

.warning-banner {
  background-color: rgba(245, 158, 11, 0.2); /* bg-amber-500/20 */
  border: 1px solid rgba(245, 158, 11, 0.5); /* border-amber-500/50 */
  border-radius: 0.75rem;
  padding: 1.5rem;
}
```

#### Vesting Configuration
```css
.vesting-page {
  background-image: linear-gradient(to bottom right, from-slate-900 via-purple-900 to-slate-900);
}

.vesting-card {
  background-color: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.75rem;
  overflow: hidden;
}

.vesting-card-header {
  padding: 1.5rem;
}

.vesting-icon {
  width: 2.5rem;
  height: 2.5rem;
  background-image: linear-gradient(to right, from-blue-500 to-purple-600);
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.vesting-timeline {
  position: relative;
}

.timeline-dot {
  width: 1rem;
  height: 1rem;
  border-radius: 9999px;
}

.timeline-line {
  flex: 1;
  height: 0.125rem;
  background-image: linear-gradient(to right, from-green-500 to-blue-500);
}
```

#### Review & Deploy
```css
.review-page {
  background-image: linear-gradient(to bottom right, from-slate-900 via-purple-900 to-slate-900);
}

.summary-card {
  background-color: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.75rem;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.deploy-button {
  background-image: linear-gradient(to right, from-green-500 to-blue-600);
  color: white;
  padding: 0.75rem 2rem;
  border-radius: 0.5rem;
  font-weight: 500;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.deploy-button:hover {
  background-image: linear-gradient(to right, from-green-600 to-blue-700);
}

.cost-summary {
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 0.75rem;
  padding: 1.5rem;
}
```

#### Deployment Success
```css
.success-page {
  background-image: linear-gradient(to bottom right, from-slate-900 via-purple-900 to-slate-900);
}

.success-icon {
  width: 5rem;
  height: 5rem;
  background-image: linear-gradient(to right, from-green-500 to-blue-600);
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem auto;
}

.contract-details {
  background-color: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.75rem;
  padding: 2rem;
  margin-bottom: 2rem;
}

.code-display {
  display: flex;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  padding: 0.75rem;
}

.action-card {
  background-color: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.75rem;
  padding: 1.5rem;
}
```

#### Token Management Dashboard
```css
.management-dashboard {
  background-image: linear-gradient(to bottom right, from-slate-900 via-purple-900 to-slate-900);
}

.feature-nav {
  background-color: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.75rem;
  padding: 1.5rem;
}

.feature-button {
  width: 100%;
  text-align: left;
  padding: 0.75rem;
  border-radius: 0.5rem;
  transition: all 0.2s;
}

.feature-button.active {
  background-color: rgba(59, 130, 246, 0.2);
  color: #60a5fa;
}

.feature-button:not(.active):not(:disabled):hover {
  background-color: rgba(255, 255, 255, 0.05);
}

.feature-panel {
  background-color: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.75rem;
  padding: 1.5rem;
}

.token-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.stat-card {
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 0.5rem;
  padding: 1rem;
  text-align: center;
}
```
#### My Tokens Dashboard
```css
.tokens-dashboard {
  background-image: linear-gradient(to bottom right, from-slate-900 via-purple-900 to-slate-900);
}

.stats-card {
  background-color: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.75rem;
  padding: 1.5rem;
}

.network-filter {
  padding: 0.75rem;
  border-radius: 0.5rem;
  border: 2px solid rgba(255, 255, 255, 0.2);
  background-color: rgba(255, 255, 255, 0.05);
  cursor: pointer;
  transition: all 0.2s;
}

.network-filter.active {
  border-color: #3b82f6; /* border-blue-500 */
  background-color: rgba(59, 130, 246, 0.2); /* bg-blue-500/20 */
}

.token-card {
  background-color: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.75rem;
  padding: 1.5rem;
  margin-bottom: 1rem;
}
```

#### My Sales Dashboard
```css
.sales-dashboard {
  background-image: linear-gradient(to bottom right, from-slate-900 via-purple-900 to-slate-900);
}

.sale-card {
  background-color: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.75rem;
  padding: 1.5rem;
  margin-bottom: 1rem;
}

.progress-bar-bg {
  width: 100%;
  background-color: #374151; /* bg-gray-700 */
  border-radius: 9999px;
  height: 0.5rem;
}

.progress-bar {
  background-image: linear-gradient(to right, from-blue-500 to-purple-600);
  height: 0.5rem;
  border-radius: 9999px;
  transition: width 0.3s;
}

.sale-icon {
  width: 3rem;
  height: 3rem;
  background-image: linear-gradient(to right, from-blue-500 to-purple-600);
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
}
```

#### Presale Wizard
```css
.presale-wizard {
  background-image: linear-gradient(to bottom right, from-slate-900 via-purple-900 to-slate-900);
}

.wizard-progress {
  background-color: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.75rem;
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.step-indicator {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-width: 2px;
}

.step-active {
  border-color: #60a5fa; /* border-blue-400 */
  background-color: rgba(96, 165, 250, 0.2); /* bg-blue-400/20 */
  color: #60a5fa; /* text-blue-400 */
}

.step-completed {
  border-color: #4ade80; /* border-green-400 */
  background-color: rgba(74, 222, 128, 0.2); /* bg-green-400/20 */
  color: #4ade80; /* text-green-400 */
}

.step-inactive {
  border-color: #9ca3af; /* border-gray-400 */
  background-color: rgba(156, 163, 175, 0.2); /* bg-gray-400/20 */
  color: #9ca3af; /* text-gray-400 */
}

.step-connector {
  width: 4rem;
  height: 0.125rem;
  flex-shrink: 0;
}

.connector-completed {
  background-color: #4ade80; /* bg-green-400 */
}

.connector-inactive {
  background-color: #4b5563; /* bg-gray-600 */
}
```

#### Sale Page
```css
.sale-page {
  background-image: linear-gradient(to bottom right, from-slate-900 via-purple-900 to-slate-900);
}

.sale-header {
  background-color: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.sale-status-banner {
  border-radius: 0.75rem;
  padding: 1.5rem;
}

.sale-status-live {
  background-color: rgba(74, 222, 128, 0.2); /* bg-green-500/20 */
  border: 1px solid rgba(74, 222, 128, 0.5); /* border-green-500/50 */
}

.sale-status-upcoming {
  background-color: rgba(96, 165, 250, 0.2); /* bg-blue-500/20 */
  border: 1px solid rgba(96, 165, 250, 0.5); /* border-blue-500/50 */
}

.sale-status-ended {
  background-color: rgba(156, 163, 175, 0.2); /* bg-gray-500/20 */
  border: 1px solid rgba(156, 163, 175, 0.5); /* border-gray-500/50 */
}

.purchase-card {
  background-color: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.75rem;
  padding: 1.5rem;
  position: sticky;
  top: 1.5rem;
}

.buy-button {
  width: 100%;
  background-image: linear-gradient(to right, from-blue-500 to-purple-600);
  color: white;
  padding: 0.75rem;
  border-radius: 0.5rem;
  font-weight: 500;
  transition: all 0.2s;
}
```

#### Sale Explorer
```css
.explorer-page {
  background-image: linear-gradient(to bottom right, from-slate-900 via-purple-900 to-slate-900);
}

.filter-bar {
  background-color: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.75rem;
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.search-input {
  background-color: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.5rem;
  padding-left: 2.5rem;
  padding-right: 1rem;
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
  color: white;
}

.sale-grid-card {
  background-color: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.75rem;
  padding: 1.5rem;
  transition: all 0.2s;
}

.sale-grid-card:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.view-sale-button {
  width: 100%;
  background-image: linear-gradient(to right, from-blue-500 to-purple-600);
  color: white;
  padding: 0.5rem;
  border-radius: 0.5rem;
  font-weight: 500;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}
```

## Page Themes and Design

### Landing Page
The landing page features a dark gradient background (slate-900 to purple-900) with a modern, sleek design. It includes:
- Hero section with a large, bold headline and gradient text accents
- Feature cards with icon illustrations in a 3-column layout
- Network support section with blockchain logos
- Token features section with a two-column layout
- Call-to-action section with gradient buttons

### Token Builder
The token builder maintains the dark gradient theme with:
- Step-by-step form layout with clear section separation
- Input fields with dark backgrounds and light text
- Network selection grid with hover effects
- Feature toggles with expandable configuration options
- Warning notifications with amber/yellow accents

### Vesting Configuration
The vesting page features:
- Visual timeline representation of vesting schedules
- Category cards with gradient icons
- Percentage and date input fields
- Real-time calculation displays with colored accent cards
- Quick preset buttons for common vesting periods

### Review & Deploy
The review page includes:
- Two-column layout with main content and sidebar
- Summary cards for token details, features, and vesting
- Cost estimation panel with network details
- Final warning notification with amber/red accents
- Terms acceptance checkbox and deploy button with gradient

### Deployment Success
The success page features:
- Large success icon with green gradient
- Contract details in formatted panels
- Copy buttons for addresses and transaction hashes
- Quick action buttons for viewing on explorer and sharing
- Next steps cards with icon illustrations

### My Tokens
The tokens dashboard includes:
- Stats overview cards at the top
- Network filter buttons with token counts
- Search and filter controls
- Token cards with network icons and status indicators
- Progress indicators and token details

### My Sales
The sales dashboard features:
- Stats overview with raised amounts and participant counts
- Sale cards with progress bars and status indicators
- Detailed information panels for each sale
- Action buttons for management functions
- Filter and search controls with sorting options

### Presale Wizard
The presale creation wizard includes:
- Progress indicator at the top showing all steps
- Step-specific forms with validation
- Preview panels showing calculated values
- Network selection with the same design as token builder
- Review page with deployment confirmation

### Sale Page
The public sale page features:
- Sale status banner with countdown timer
- Progress bar showing raised amount vs cap
- Token purchase interface with real-time calculation
- Sale details and token information panels
- Vesting schedule visualization if enabled

### Sale Explorer
The sale explorer page includes:
- Grid layout of available sales
- Filter and search controls
- Sale cards with progress indicators
- Status badges with appropriate colors
- Network and token information displays

## Features

- **Multi-Chain Support**: Deploy on 25+ EVM-compatible blockchains including Ethereum, BSC, Polygon, Arbitrum, Fantom, Avalanche, and many more
- **Hardhat-Powered Deployment**: Professional-grade contract deployment using industry-standard tools
- **Secure Backend Architecture**: API-based deployment with JWT authentication
- **Automatic Contract Verification**: All contracts verified on blockchain explorers
- **Real Blockchain Integration**: Live data from actual smart contracts
- **ESR Token System**: Real ESR token balance checking and deduction for deployments
- **Dynamic RPC Configuration**: Environment-based network configuration
- **No-Code Token Creation**: Create tokens with advanced features without writing code
- **Real-time Deployment Tracking**: Monitor deployment status and transaction confirmations
- **Live Statistics**: Real-time token and sale statistics from blockchain
- **Auto-Refresh Data**: Periodic updates for live sales and token data
- **Advanced Token Features**:
  - Burnable tokens
  - Mintable supply
  - Transfer fees & taxes
  - Holder redistribution
  - Token vesting & locking
- **Presale & Private Sale**: Launch token sales with customizable parameters
- **Deployment History**: Track all your deployed contracts and sales
- **Token Management Dashboard**: Manage your tokens after deployment
- **Liquidity Locking**: Lock LP tokens for a specified duration to build trust
- **Auto-DEX Listing**: Automatically create trading pairs after successful presales
- **Referral System**: Earn rewards by referring others to token sales
- **Emergency Withdraw**: Withdraw funds from active sales with a small penalty
- **Airdrop Tool**: Send tokens to multiple addresses in a single transaction
  - Feature-based UI that only shows enabled features
  - Mint new tokens (owner only)
  - Burn tokens from your wallet
  - Adjust transfer fees and recipient addresses
  - Manage holder redistribution settings
  - Create and monitor vesting schedules
  - View contract verification status
  - Feature-based UI that only shows enabled features
  - Mint new tokens (owner only)
  - Burn tokens from your wallet
  - Adjust transfer fees and recipient addresses
  - Manage holder redistribution settings
  - Create and monitor vesting schedules
  - View contract verification status
- **Mobile Responsive**: Fully responsive design works on all devices
- **Enterprise Security**: Secure wallet-based authentication and API protection
- **Liquidity Lock**: Lock LP tokens for a specified duration to build trust
- **Auto-DEX Listing**: Automatically create trading pairs after successful presales
- **Referral System**: Earn rewards by referring others to token sales
- **Emergency Withdraw**: Withdraw funds from active sales with a small penalty
- **Airdrop Tool**: Send tokens to multiple addresses in a single transaction

## Installation

### Prerequisites

- Node.js 16+ and npm
- Git
- A wallet with funds for deployment (MetaMask recommended)

### Quick Start

```bash
# Clone the repository
git clone https://github.com/yourusername/tokenforge.git
cd tokenforge

# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env

# Configure your .env file with:
# - RPC URLs for networks you want to support
# - API keys for contract verification
# - JWT secret for authentication
# - Other configuration options

# Start both frontend and backend
npm run dev:all
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

### Manual Setup

If you prefer to run frontend and backend separately:

```bash
# Terminal 1 - Backend
npm run server

# Terminal 2 - Frontend
npm run dev
```

### Environment Configuration

Create a `.env` file in the root directory with the following variables:

```env
# Network RPC URLs (required)
ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/YOUR_INFURA_KEY
VITE_ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/YOUR_INFURA_KEY
BSC_RPC_URL=https://bsc-dataseed.binance.org/
POLYGON_RPC_URL=https://polygon-rpc.com/
# ... add other networks as needed

# API Keys for Contract Verification (required)
ETHERSCAN_API_KEY=your_etherscan_api_key
BSCSCAN_API_KEY=your_bscscan_api_key
POLYGONSCAN_API_KEY=your_polygonscan_api_key

# ESR Token Configuration (required for mainnet deployments)
VITE_ESR_TOKEN_ADDRESS=0xYOUR_ESR_TOKEN_CONTRACT_ADDRESS
ESR_TOKEN_ADDRESS=0xYOUR_ESR_TOKEN_CONTRACT_ADDRESS

# Server Configuration
PORT=3001
JWT_SECRET=your_secure_jwt_secret_key
REPORT_GAS=false
```

## New Updates

We've made significant improvements to the TokenForge platform with comprehensive multi-chain support:
I've implemented all the requested features for the token launchpad:

    KYC / Audit / SAFU Badges System:
        Created a complete badge system with database tables, API endpoints, and UI components
        Implemented admin panel for badge management
        Added badge display on token pages, sale pages, and trending carousels
        Included document upload functionality with IPFS storage

    Anti-Bot / Anti-Snipe Protection:
        Created a new AntiBotPresaleContract with advanced protection features
        Implemented block timestamp and gas limit checks
        Added wallet cooldown between purchases
        Included signature-based verification for early participants
        Updated the UI to show protection status and countdown timers

    Sale Modes: Whitelist + Fairlaunch:
        Added support for three sale modes: Standard Presale, Whitelist-Only, and Fairlaunch
        Implemented whitelist functionality with CSV upload
        Created fairlaunch mode with proportional token distribution
        Updated the presale wizard to support all sale modes

    Governance Tools for Token Holders:
        Implemented a complete governance system with ERC20Votes
        Created proposal creation and voting functionality
        Added time-locked execution for passed proposals
        Built a governance dashboard and proposal detail pages
        Implemented vote tracking and quorum calculation
        
    Database tables for badges, governance proposals, and votes
    Smart contracts for anti-bot protection and governance
    API endpoints for all new features
    Frontend components for displaying and interacting with the new features
    Integration with existing components like token explorer and sale pages

I've implemented a robust three-layer fallback system for contract deployment as requested. Here's a summary of what I've added:

    Primary Method: Hardhat Deployment Scripts
        Continues to use Hardhat as the main deployment engine
        Logs all deployment results and errors
        Automatically triggers fallback systems if deployment fails

    Fallback A: Frontend-Side Deployment (Ethers.js)
        Added a new fallbackDeploymentService.ts that uses ethers.js to deploy contracts directly from the browser
        Created an export system that compiles contracts and exports bytecode and ABIs to /src/contracts/exports/
        Added gas estimation and user-friendly UI for the fallback deployment process
        Implemented proper error handling and logging

    Emergency Backup: Foundry Backend Deploy
        Added a new emergencyDeploymentService.js that uses Foundry's forge create command
        Created a new API endpoint /api/emergency-deploy/token for backend deployment
        Added configuration for Foundry in foundry.toml
        Implemented RPC failover and proper error handling

    Removed Manual Remix Deployment
        Replaced the RemixFallback component with the new DeploymentFallback component
        Removed all references to manual Remix deployment
        Added proper UI indicators for the current deployment method

    Additional Improvements
        Added a new database column deployment_method to track how contracts were deployed
        Created a new API endpoint to register contracts deployed via fallback methods
        Updated the UI to show the current deployment method
        Added proper error handling and user feedback throughout the system

The system now provides a seamless experience for users, automatically falling back to alternative deployment methods if the primary method fails, without requiring any manual intervention.

### Multi-Chain Support

- **25+ Blockchain Networks**: Full support for 16 mainnets and 8 testnets
- **MetaMask Integration**: Seamless network switching and addition
- **Network Mode Toggle**: Easy switching between mainnet and testnet modes
- **Chain Detection**: Automatic detection of connected chain
- **Network Visualization**: Clear visual indicators for network status

We've made significant improvements to the TokenForge platform with six powerful new features:

### Liquidity Lock System

- **Complete Liquidity Locker**: Secure contract for locking LP tokens with configurable durations
- **Lock Management Dashboard**: View, extend, and withdraw locked liquidity
- **Auto-Lock Integration**: Automatically lock LP tokens after presale with configurable parameters
- **Time-Based Unlocking**: LP tokens can only be withdrawn after the lock period ends

### Trending Projects Carousel

- **Dynamic Project Showcase**: Highlight featured and trending token sales
- **Real-Time Sorting**: Sort by volume, participation, or featured status
- **Admin Controls**: Ability to manually flag projects as featured
- **Responsive Design**: Works seamlessly on all devices with smooth animations

### Auto-DEX Listing

- **Automatic Pair Creation**: Create trading pairs on DEX after successful presales
- **Configurable Parameters**: Set listing price and liquidity percentages
- **LP Token Management**: Track LP token address and liquidity status
- **Immediate Trading**: Tokens become tradable immediately after presale ends

### Referral System

- **Unique Referral Links**: Generate wallet-specific referral links
- **Commission Tracking**: Earn 3% of all contributions from referred users
- **Real-Time Statistics**: Monitor referrals, volume, and earned rewards
- **One-Click Claiming**: Claim earned rewards directly to your wallet

### Emergency Withdrawal

- **Pre-End Withdrawal**: Withdraw contributions before a sale ends
- **Penalty Mechanism**: 10% penalty applied to discourage early withdrawals
- **Transparent Breakdown**: Clear display of penalty and refund amounts
- **Immediate Refunds**: Funds returned to user's wallet immediately

### Airdrop Multi-Sender

- **Batch Token Distribution**: Send tokens to multiple addresses in one transaction
- **CSV Upload Support**: Import recipient lists from CSV files
- **Gas Optimization**: Significantly reduced gas costs compared to individual transfers
- **Preview & Confirmation**: Review all recipients and amounts before sending

We've made significant improvements to the TokenForge platform to make it production-ready:

### Infrastructure Improvements

- **Multi-Chain Support**: Added support for 25+ EVM-compatible blockchains
- **Docker Deployment**: Added Docker configuration for containerized deployment with docker-compose 
- **Nginx Configuration**: Optimized web server with security headers and caching
- **CI/CD Pipeline**: Set up automated build and deployment workflow

### Database & Storage

- **PostgreSQL Integration**: Replaced MongoDB with PostgreSQL for robust relational data storage
- **Migration System**: Added SQL schema migrations for database versioning
- **Connection Pooling**: Implemented connection pooling with retry logic and error handling
- **Data Models**: Created structured models for tokens, presales, users, and transactions

### Security Enhancements

- **Encryption Utilities**: Implemented AES-256-GCM encryption for sensitive data
- **Secure Key Management**: Added PBKDF2 for password hashing and secure private key storage
- **JWT Authentication**: Improved authentication flow with secure token management
- **HTTP Security Headers**: Added helmet middleware for comprehensive security headers
- **Rate Limiting**: Implemented rate limiting to prevent abuse
- **Input Validation**: Enhanced validation for all user inputs

### Feature Completion

- **Multi-Chain Support**: Added support for 25+ EVM-compatible blockchains
- **Liquidity Lock System**: Implemented secure LP token locking with time-based unlocking
- **Trending Projects Carousel**: Added dynamic project showcase with real-time sorting
- **Auto-DEX Listing**: Completed automatic pair creation and liquidity addition
- **Referral System**: Implemented referral tracking with commission payouts
- **Emergency Withdrawal**: Added penalty-based early withdrawal functionality
- **Airdrop Tool**: Created gas-optimized multi-sender for token distribution
- **Dual-Stage Token Metadata System**: Implemented comprehensive token branding system
  - **Stage 1**: Optional metadata entry during token creation (logo, description, links, tags)
  - **Stage 2**: Full post-deployment metadata management for token owners
  - **Secure Storage**: IPFS integration for logo storage with Web3.Storage
  - **Permission System**: Only token owners can edit their token's metadata
  - **Rich Display**: Metadata shown in token explorer, sales, and DEX interfaces
  - **OpenSea Compatibility**: Metadata endpoint compatible with NFT marketplaces
- **ESR Token Integration**: Completed real ESR token balance checking and deduction
- **Blockchain Interaction**: Improved contract deployment with proper error handling
- **Contract Verification**: Implemented automatic verification on blockchain explorers
- **Real-time Statistics**: Added live data fetching from blockchain for tokens and presales
- **Vesting Integration**: Completed token vesting implementation with schedule management

### Error Handling & Reliability

- **Centralized Error System**: Created a comprehensive error handling system with error types
- **User-Friendly Messages**: Added user-friendly error messages for all error scenarios
- **Error Reporting**: Implemented error reporting service for monitoring
- **React Error Boundary**: Added error boundary component for graceful UI error handling
- **Retry Logic**: Implemented retry mechanisms for network operations

### Testing & Quality Assurance

- **Unit Tests**: Added Jest tests for critical components
- **Integration Tests**: Implemented tests for API endpoints and services
- **Mock Services**: Created mock services for testing without blockchain interaction
- **Test Coverage**: Set up test coverage reporting

### Performance Optimizations

- **Caching**: Implemented caching for blockchain data
- **Connection Pooling**: Optimized database connections
- **Asset Compression**: Added Gzip compression for static assets
- **Bundle Optimization**: Optimized JavaScript bundles for production

The platform is now ready for production use with proper security, error handling, and database persistence. Users can deploy tokens and presales with confidence, knowing that their data is secure and transactions are reliable.

## Usage

## Pre-Launch Recommendations

Before going live, I would recommend:

1. **Final Testing**: Conduct a final round of testing on all supported networks, especially focusing on the token deployment and vesting functionality.

2. **Environment Configuration**: Ensure all production environment variables are properly set, particularly RPC URLs and API keys.

3. **Monitoring Setup**: Implement monitoring for the backend services to quickly detect and respond to any issues.

4. **Backup Strategy**: Ensure database backups are configured for the production environment.

## Recent Updates

We've made significant improvements to the TokenForge platform with comprehensive multi-chain support:

### Multi-Chain Support

- **25+ Blockchain Networks**: Full support for 16 mainnets and 8 testnets
- **MetaMask Integration**: Seamless network switching and addition
- **Network Mode Toggle**: Easy switching between mainnet and testnet modes
- **Chain Detection**: Automatic detection of connected chain
- **Network Visualization**: Clear visual indicators for network status

We've made significant improvements to the TokenForge platform with six powerful new features:

### Liquidity Lock System

- **Complete Liquidity Locker**: Secure contract for locking LP tokens with configurable durations
- **Lock Management Dashboard**: View, extend, and withdraw locked liquidity
- **Auto-Lock Integration**: Automatically lock LP tokens after presale with configurable parameters
- **Time-Based Unlocking**: LP tokens can only be withdrawn after the lock period ends

### Trending Projects Carousel

- **Dynamic Project Showcase**: Highlight featured and trending token sales
- **Real-Time Sorting**: Sort by volume, participation, or featured status
- **Admin Controls**: Ability to manually flag projects as featured
- **Responsive Design**: Works seamlessly on all devices with smooth animations

### Auto-DEX Listing

- **Automatic Pair Creation**: Create trading pairs on DEX after successful presales
- **Configurable Parameters**: Set listing price and liquidity percentages
- **LP Token Management**: Track LP token address and liquidity status
- **Immediate Trading**: Tokens become tradable immediately after presale ends

### Referral System

- **Unique Referral Links**: Generate wallet-specific referral links
- **Commission Tracking**: Earn 3% of all contributions from referred users
- **Real-Time Statistics**: Monitor referrals, volume, and earned rewards
- **One-Click Claiming**: Claim earned rewards directly to your wallet

### Emergency Withdrawal

- **Pre-End Withdrawal**: Withdraw contributions before a sale ends
- **Penalty Mechanism**: 10% penalty applied to discourage early withdrawals
- **Transparent Breakdown**: Clear display of penalty and refund amounts
- **Immediate Refunds**: Funds returned to user's wallet immediately

### Airdrop Multi-Sender

- **Batch Token Distribution**: Send tokens to multiple addresses in one transaction
- **CSV Upload Support**: Import recipient lists from CSV files
- **Gas Optimization**: Significantly reduced gas costs compared to individual transfers
- **Preview & Confirmation**: Review all recipients and amounts before sending

### MetaMask Chain Integration

- **Full Chain Support**: Added comprehensive support for 16 mainnets and 8 testnets
- **Automatic Network Detection**: DApp now detects wallet's chain ID and prompts appropriate actions
- **Network Addition**: Automatically adds networks to MetaMask using `wallet_addEthereumChain` when needed
- **Chain Switching**: Seamlessly switches between networks using `wallet_switchEthereumChain`
- **Network Mismatch Modal**: User-friendly modal for handling network mismatches
- **Visual Chain Status**: Added status indicators showing current chain and compatibility with selected mode

### Vesting System Enhancements

- **Complete Vesting Implementation**: Fully functional token vesting system with linear release schedules
- **Multiple Allocation Categories**: Support for team, marketing, development, and other vesting allocations
- **Visual Timeline**: Interactive timeline representation of vesting schedules
- **Vesting Management**: Post-deployment management interface for vesting schedules
- **Presale Vesting**: Integrated vesting capabilities in presale contracts

### Production Readiness Improvements

- **Real-time Price Feeds**: Replaced static token price estimates with dynamic price feeds
- **Robust Error Handling**: Improved error handling with proper messages and retry mechanisms
- **Enhanced Security**: Strengthened security middleware with better CORS and CSP configuration
- **Improved Authentication**: More robust wallet-based authentication system
- **Contract Verification**: Enhanced contract verification with retry mechanisms
- **Database Reliability**: Added connection pooling and health checks for database connections
- **Better UI Components**: Added proper loading states and 404 page for improved user experience
- **MetaMask Token Integration**: One-click token addition to MetaMask after deployment
- **Token Branding System**: Complete token metadata management with IPFS logo storage
- **Production-Ready Encryption**: Improved encryption utilities with environment awareness
- **Comprehensive Validation**: Enhanced input validation with detailed error messages

### Prerequisites

Before using TokenForge, ensure you have:

1. **ESR Tokens**: For mainnet deployments, you need ESR tokens in your wallet
   - Testnet deployments are free
   - Mainnet deployments require 100 ESR tokens

2. **Network Tokens**: Sufficient native tokens for gas fees
   - ETH for Ethereum
   - BNB for BSC
   - MATIC for Polygon
   - etc.

3. **RPC Access**: Configure RPC endpoints in your environment
   - Use Infura, Alchemy, or other providers
   - Public RPCs are available as fallbacks

### ESR Token Setup

1. **Get ESR Tokens**: Acquire ESR tokens from supported exchanges
2. **Configure Address**: Set `VITE_ESR_TOKEN_ADDRESS` in your environment
3. **Check Balance**: The platform will automatically check your ESR balance
4. **Automatic Deduction**: ESR tokens are automatically deducted during deployment

### Network Configuration

The platform automatically uses your configured RPC endpoints with intelligent fallbacks to public RPCs if your custom endpoints are unavailable.

### 1. Connect Your Wallet

- Click the "Connect Wallet" button in the top right corner
- Select your wallet provider (MetaMask, WalletConnect, etc.)
- Approve the connection request

### 2. Create a Token

1. **Click "Start Building"** on the home page
2. The system will authenticate your wallet using message signing
3. Configure your token parameters:
   - Token name and symbol
   - Initial and max supply
   - Decimals
   - Select network
4. Choose token features:
   - Burnable
   - Mintable
   - Transfer fees
   - Holder redistribution
5. Configure vesting schedules (optional)
6. Review your configuration
7. **Deploy using Hardhat** (requires gas fees + ESR tokens for mainnet)
   - ESR tokens are automatically deducted
   - Real-time deployment tracking

### 3. Launch a Sale

1. **Click "Launch Sale"** on the home page
2. **Select sale type** (Presale or Private Sale)
3. Select your token
4. Configure sale parameters:
   - Soft cap and hard cap
   - Token price
   - Min/max purchase
   - Start and end dates
5. Set up vesting (optional)
6. Configure wallet addresses
7. Review and deploy

### 4. Monitor Your Deployments

- **Real-time Statistics**: View live holder counts, transfer data, and sale progress
- **Auto-Refresh**: Data updates automatically every 15-30 seconds
- **Status Tracking**: Real-time status based on actual blockchain state

### 5. Manage Your Tokens

1. **Access the Management Dashboard** via "My Tokens" or after deployment
2. **Connect your wallet** (must be the contract owner for full access)
3. Select the token to manage
4. Access feature-specific controls:
   - Mint new tokens to any address (owner only)
   - Burn tokens from your connected wallet
   - Adjust transfer fee rates and recipient addresses
   - Manage holder redistribution settings
   - Create and monitor vesting schedules
   - View contract verification status
5. All changes are executed as real blockchain transactions
6. Non-owners can view token information in read-only mode

## Deployment Architecture

### Hardhat-Based Deployment (Production)

TokenForge uses Hardhat for all contract deployments, providing enterprise-grade reliability:

1. **Connect your wallet** and authenticate
2. Authenticate using wallet message signing
3. Configure token parameters in the frontend
4. Submit deployment request to secure API
5. Backend compiles contract using Hardhat
6. Contract deployed to selected network
7. Automatic verification on blockchain explorer
8. Deployment details saved and tracked
9. **Real-time statistics** begin updating automatically

### Deployment Process Flow

```
User Input → Frontend Validation → API Authentication → Hardhat Compilation → Network Deployment → Verification → Success Response
```

### Security Features

- **Wallet Authentication**: Secure message signing for user verification
- **API Protection**: JWT-based authentication for all API endpoints
- **Input Validation**: Comprehensive validation of all user inputs
- **Secure Compilation**: Server-side contract compilation using Hardhat
- **Automatic Verification**: All contracts verified on blockchain explorers
- **ESR Token Integration**: Secure ESR token deduction for deployments
- **Real-time Monitoring**: Live blockchain data integration
- **Dynamic Configuration**: Environment-based network and RPC configuration
- **Deployment Tracking**: Complete audit trail of all deployments
- **Token Management**: Comprehensive post-deployment management interface
  - Access control based on contract ownership
  - Feature detection to show only enabled capabilities
  - Real-time interaction with deployed contracts
  - Secure function calls for administrative actions

### Supported Networks

All deployments are handled through Hardhat with the following 25+ networks configured:

#### Mainnets
- Ethereum (ETH) - Chain ID: 1
- Binance Smart Chain (BNB) - Chain ID: 56
- Polygon (MATIC) - Chain ID: 137
- Arbitrum (ETH) - Chain ID: 42161
- Fantom (FTM) - Chain ID: 250
- Avalanche (AVAX) - Chain ID: 43114
- Cronos (CRO) - Chain ID: 25
- Core (CORE) - Chain ID: 1116
- DogeChain (DOGE) - Chain ID: 2000
- PulseChain (PLS) - Chain ID: 369
- ZetaChain (ZETA) - Chain ID: 7000
- Unichain (UNI) - Chain ID: 130
- Bitrock (BROCK) - Chain ID: 7171
- AlveyChain (ALV) - Chain ID: 3797
- OpenGPU (GPU) - Chain ID: 1071
- Base (ETH) - Chain ID: 8453
- ESR (ESR) - Chain ID: 25062019

#### Testnets
- Estar Testnet (ESR) - Chain ID: 25062019
- Ethereum Goerli (ETH) - Chain ID: 5
- BSC Testnet (tBNB) - Chain ID: 97
- Polygon Mumbai (MATIC) - Chain ID: 80001
- Arbitrum Sepolia (ETH) - Chain ID: 421614
- Fantom Testnet (FTM) - Chain ID: 4002
- Avalanche Fuji (AVAX) - Chain ID: 43113
- Cronos Testnet (CRO) - Chain ID: 338
- Bitrock Testnet (BROCK) - Chain ID: 7771

## ESR Token System

### Requirements
- Mainnet deployments require 100 ESR tokens
- Testnet deployments are free
- ESR tokens are used for platform fees and are burned during deployment

### Integration
- **Real Balance Checking**: Live ESR token balance from your wallet
- **Automatic Deduction**: ESR tokens automatically transferred during deployment
- **Transaction Confirmation**: Full transaction tracking and confirmation

## API Documentation

### Authentication Endpoints

#### POST /api/auth/message
Get authentication message for wallet signing.

**Request:**
```json
{
  "address": "0x742d35Cc6634C0532925a3b8D4C9db96590c6C8C"
}
```

**Response:**
```json
{
  "message": "Welcome to TokenForge!\n\nSign this message to authenticate...",
  "timestamp": 1640995200000
}
```

#### POST /api/auth/login
Authenticate user with signed message.

**Request:**
```json
{
  "address": "0x742d35Cc6634C0532925a3b8D4C9db96590c6C8C",
  "signature": "0x...",
  "message": "Welcome to TokenForge!..."
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "address": "0x742d35cc6634c0532925a3b8d4c9db96590c6c8c",
  "expiresIn": "24h"
}
```

### Deployment Endpoints

#### POST /api/deploy/token
Deploy a token contract using Hardhat.

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request:**
```json
{
  "contractType": "BasicToken",
  "constructorArgs": ["My Token", "MTK", 18, "1000000", "0", "0x..."],
  "network": "ethereum",
  "verify": true
}
```

**Response:**
```json
{
  "success": true,
  "contractAddress": "0x...",
  "transactionHash": "0x...",
  "gasUsed": "2500000",
  "deploymentCost": "0.025",
  "network": "ethereum",
  "verified": true,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### POST /api/deploy/presale
Deploy a presale contract using Hardhat.

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request:**
```json
{
  "presaleConfig": {
    "tokenInfo": { ... },
    "saleConfiguration": { ... },
    "vestingConfig": { ... },
    "walletSetup": { ... }
  },
  "network": "ethereum",
  "verify": true
}
```

### Contract Management Endpoints

#### GET /api/contracts/deployed
Get user's deployed contracts.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "tokens": [...],
  "presales": [...]
}
```

## Development

### Project Structure

```
/
├── contracts/           # Solidity contract templates
├── scripts/             # Hardhat deployment scripts
├── server/              # Backend API service
│   ├── api/             # API route handlers
│   ├── middleware/      # Authentication & validation
│   └── index.js         # Server entry point
├── src/                 # Frontend React application
├── hardhat.config.js    # Hardhat configuration
└── package.json         # Dependencies and scripts
```

### Available Scripts

```bash
# Development
npm run dev              # Start frontend only
npm run server           # Start backend only
npm run dev:all          # Start both frontend and backend

# Hardhat
npm run compile          # Compile contracts
npm run test             # Run contract tests
npm run deploy:local     # Deploy to local network

# Production
npm run build            # Build frontend for production
npm run start            # Start production server
```

### Adding New Networks

1. Add network configuration to `hardhat.config.js`
2. Add RPC URL to `.env` file
3. Add network to `src/data/networks.ts`
4. Add API key for verification (if needed)

### Adding New Contract Types

1. Create contract in `contracts/` directory
2. Add contract type to validation middleware
3. Update frontend contract type selection
4. Test deployment on testnet

## Troubleshooting

### Common Issues

1. **Transaction Failing**: 
   - Ensure you have enough native tokens for gas
   - Verify your wallet is connected to the correct network
   - Check that you have sufficient ESR tokens for mainnet deployment
   - Try increasing gas limit

2. **Authentication Issues**:
   - Ensure your wallet is unlocked
   - Try refreshing the page and reconnecting
   - Check that you're signing the correct message

3. **Deployment Failures**:
   - Check network status and gas prices
   - Verify RPC endpoint is working
   - Ensure backend service is running
   - Check server logs for detailed error messages

4. **API Connection Issues**:
   - Verify backend is running on port 3001
   - Check CORS configuration
   - Ensure JWT token is valid

5. **Contract Verification Failed**:
   - Check API keys are configured correctly
   - Verify network supports verification
   - Ensure contract source matches deployed bytecode

6. **General Issues**:
   - Refresh the page
   - Clear browser cache
   - Try a different browser
   - Check browser console for error messages

## License

MIT License