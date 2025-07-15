import React from 'react';
import { ArrowRight, Shield, Globe, CheckCircle, Star, Layers, Zap } from 'lucide-react';
import { WalletConnection } from './WalletConnection';
import { useWallet } from '../hooks/useWallet';
import { NetworkModeToggle } from './NetworkModeToggle';
import { BadgeDisplay } from './badges/BadgeDisplay';

interface LandingPageProps {
  onGetStarted: () => void;
  onLaunchSale: () => void;
  onViewSales: () => void;
  onViewTokens: () => void;
  onExploreSales?: () => void;
  onLiquidityLock?: () => void;
  onAirdrop?: () => void;
  onAdminPanel?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ 
  onGetStarted, 
  onLaunchSale, 
  onViewSales, 
  onViewTokens,
  onExploreSales,
  onLiquidityLock,
  onAirdrop,
  onAdminPanel
}) => {
  const { isConnected } = useWallet();
  
  const features = [
    {
      icon: Zap,
      title: 'Deploy in Minutes',
      description: 'Create and deploy your ERC-20/BEP-20 token in under 5 minutes with our streamlined process.'
    },
    {
      icon: Shield,
      title: 'Audit-Ready Code',
      description: 'Built with OpenZeppelin standards and security best practices for production-ready tokens.'
    },
    {
      icon: Globe,
      title: 'Multi-Chain Support',
      description: 'Deploy on Ethereum, BSC, Polygon, Arbitrum, and more with automatic network detection.'
    }
  ];

  const networks = [
    { name: 'Ethereum', logo: '🔷' },
    { name: 'BSC', logo: '🟡' },
    { name: 'Polygon', logo: '🟣' },
    { name: 'Arbitrum', logo: '🔵' },
    { name: 'Fantom', logo: '🌟' },
    { name: 'Avalanche', logo: '🔺' }
  ];

  const tokenFeatures = [
    'Burnable Tokens',
    'Mintable Supply',
    'Transfer Fees & Taxes',
    'Holder Redistribution',
    'Token Vesting & Locking',
    'Automatic Verification',
    'Liquidity Locking',
    'Auto-DEX Listing'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="relative z-10 p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <img 
              src="/ESTAR_bezfona.png" 
              alt="ESTAR ECOSYSTEM Logo" 
              className="w-10 h-10 rounded-lg"
            />
            <div>
              <h1 className="text-2xl font-bold text-white">ESTAR ECOSYSTEM</h1>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <nav className="hidden md:flex items-center space-x-6">
              <button
                onClick={onViewTokens}
                className="text-gray-300 hover:text-white transition-colors"
              >
                My Tokens
              </button>
              <button
                onClick={onViewSales}
                className="text-gray-300 hover:text-white transition-colors"
              >
                My Sales
              </button>
              {onExploreSales && (
                <button
                  onClick={onExploreSales}
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Explore Sales
                </button>
              )}
              {onLiquidityLock && (
                <button
                  onClick={onLiquidityLock}
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Liquidity Lock
                </button>
              )}
              {onAirdrop && (
                <button
                  onClick={onAirdrop}
                  className="text-gray-300 hover:text-white transition-colors"
              >
                Airdrop Tool
              </button>
              )}
              {onAdminPanel && (
                <button
                  onClick={onAdminPanel}
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Admin Panel
                </button>
              )}
            </nav>
            <WalletConnection />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="inline-flex items-center space-x-2 bg-blue-500/20 backdrop-blur-sm text-blue-300 px-4 py-2 rounded-full text-sm font-medium mb-8">
              <Star className="w-4 h-4" />
              <span>Trusted by 10,000+ developers worldwide</span>
            </div>
            
            <h2 className="text-5xl md:text-7xl font-bold text-white mb-6">
              Create Your Own
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                {' '}ERC-20 Token
              </span>
              <br />
              in Minutes
            </h2>
            
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-12">
              Deploy professional-grade tokens across multiple blockchains with advanced features like vesting, 
              fees, and holder redistribution. No coding required.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
              <button
                onClick={onGetStarted}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200 flex items-center space-x-2 group w-full sm:w-auto justify-center"
              >
                <span>Start Building</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              
              <div className="flex flex-wrap items-center justify-center gap-4 mt-6 w-full sm:w-auto">
                <button
                  onClick={onLaunchSale}
                  className="text-green-400 hover:text-green-300 font-medium transition-colors"
                >
                  Launch Presale →
                </button>
                <button
                  onClick={onViewTokens}
                  className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
                >
                  View My Tokens →
                </button>
                {onExploreSales && (
                  <button
                    onClick={onExploreSales}
                    className="text-purple-400 hover:text-purple-300 font-medium transition-colors"
                  >
                    Explore Sales →
                  </button>
                )}
              </div>
              
              <button
                onClick={onLaunchSale}
                className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200 flex items-center space-x-2 group w-full sm:w-auto justify-center"
              >
                <span>Launch Sale</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              
              {!isConnected && (
                <div className="text-gray-400 text-sm text-center sm:text-left">
                  <span className="font-medium text-green-400">Connect wallet</span> to start
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold text-white mb-4">
              Everything You Need to Launch
            </h3>
            
            {/* Sample badges */}
            <div className="flex justify-center mb-6">
              <BadgeDisplay 
                badges={[
                  { id: '1', badge_type: 'kyc', status: 'approved' },
                  { id: '2', badge_type: 'audit', status: 'approved' },
                  { id: '3', badge_type: 'safu', status: 'approved' }
                ]}
                size="lg"
              />
            </div>
            
            <p className="text-gray-300 text-lg max-w-2xl mx-auto">
              Professional token creation tools with enterprise-grade security and multi-chain support
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mb-6">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h4 className="text-xl font-semibold text-white mb-3">{feature.title}</h4>
                <p className="text-gray-300">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Networks Section */}
      <section className="px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <Layers className="w-8 h-8 text-blue-400" />
              <h3 className="text-3xl font-bold text-white">
                Deploy Across 25+ Networks
              </h3>
            </div>
            <p className="text-gray-300 text-lg">
              Choose from multiple blockchain networks with competitive deployment costs
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div className="col-span-full">
              <div className="overflow-hidden relative">
                <div className="flex animate-scroll">
                  {[
                    // First row - 6 mainnets
                    { name: 'Ethereum', logo: '🔷' },
                    { name: 'BSC', logo: '🟡' },
                    { name: 'Polygon', logo: '🟣' },
                    { name: 'Arbitrum', logo: '🔵' },
                    { name: 'Fantom', logo: '🌟' },
                    { name: 'Avalanche', logo: '🔺' },
                  ].map((network, index) => (
                    <div 
                      key={`row1-${index}`} 
                      className="flex-shrink-0 w-1/6 p-2"
                    >
                      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 text-center">
                        <div className="text-2xl mb-2">{network.logo}</div>
                        <h4 className="text-white font-medium text-sm">{network.name}</h4>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="flex animate-scroll2 mt-4">
                  {[
                    // Second row - 6 more mainnets
                    { name: 'Cronos', logo: '⚡' },
                    { name: 'Core', logo: '🔘' },
                    { name: 'DogeChain', logo: '🐕' },
                    { name: 'PulseChain', logo: '💗' },
                    { name: 'ZetaChain', logo: '🔗' },
                    { name: 'Unichain', logo: '🦄' },
                  ].map((network, index) => (
                    <div 
                      key={`row2-${index}`} 
                      className="flex-shrink-0 w-1/6 p-2"
                    >
                      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 text-center">
                        <div className="text-2xl mb-2">{network.logo}</div>
                        <h4 className="text-white font-medium text-sm">{network.name}</h4>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="flex animate-scroll3 mt-4">
                  {[
                    // Third row - 6 more mainnets
                    { name: 'Bitrock', logo: '🪨' },
                    { name: 'AlveyChain', logo: '🧝' },
                    { name: 'OpenGPU', logo: '🖥️' },
                    { name: 'Base', logo: '🔵' },
                    { name: 'ESR', logo: '⚡' },
                    { name: 'Goerli', logo: '🔷', testnet: true },
                  ].map((network, index) => (
                    <div 
                      key={`row3-${index}`} 
                      className="flex-shrink-0 w-1/6 p-2"
                    >
                      <div className={`bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 text-center ${
                        network.testnet ? 'border-green-500/20' : ''
                      }`}>
                        <div className="text-2xl mb-2">{network.logo}</div>
                        <h4 className="text-white font-medium text-sm">{network.name}</h4>
                        {network.testnet && (
                          <span className="text-xs text-green-400">Testnet</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="flex animate-scroll4 mt-4">
                  {[
                    // Fourth row - 6 testnets
                    { name: 'BSC Testnet', logo: '🟡', testnet: true },
                    { name: 'Mumbai', logo: '🟣', testnet: true },
                    { name: 'Arbitrum Sepolia', logo: '🔵', testnet: true },
                    { name: 'Fantom Testnet', logo: '🌟', testnet: true },
                    { name: 'Avalanche Fuji', logo: '🔺', testnet: true },
                    { name: 'Cronos Testnet', logo: '⚡', testnet: true },
                  ].map((network, index) => (
                    <div 
                      key={`row4-${index}`} 
                      className="flex-shrink-0 w-1/6 p-2"
                    >
                      <div className={`bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 text-center ${
                        network.testnet ? 'border-green-500/20' : ''
                      }`}>
                        <div className="text-2xl mb-2">{network.logo}</div>
                        <h4 className="text-white font-medium text-sm">{network.name}</h4>
                        {network.testnet && (
                          <span className="text-xs text-green-400">Testnet</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Token Features */}
      <section className="px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-12 border border-white/10">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-3xl font-bold text-white mb-6">
                  Advanced Token Features
                </h3>
                <p className="text-gray-300 text-lg mb-8">
                  Create sophisticated tokens with built-in functionality for modern DeFi projects
                </p>
                
                <div className="grid grid-cols-2 gap-4">
                  {tokenFeatures.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span className="text-white">{feature}</span>
                    </div>
                  ))}
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-white">Anti-Bot Protection</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-white">Governance & Voting</span>
                  </div>
                  {onLiquidityLock && (
                    <button
                      onClick={onLiquidityLock}
                      className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                    >
                      Lock Liquidity →
                    </button>
                  )}
                  {onAirdrop && (
                    <button
                      onClick={onAirdrop}
                      className="text-pink-400 hover:text-pink-300 font-medium transition-colors"
                    >
                      Airdrop Tool →
                    </button>
                  )}
                </div>
              </div>
              
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl p-6 border border-blue-500/30">
                  <h4 className="text-white font-semibold mb-2">Vesting & Locking</h4>
                  <p className="text-gray-300 text-sm">
                    Configure token vesting schedules for team, investors, and ecosystem
                  </p>
                </div>
                
                <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-xl p-6 border border-green-500/30">
                  <h4 className="text-white font-semibold mb-2">Transfer Fees</h4>
                  <p className="text-gray-300 text-sm">
                    Implement automatic fees and redistribution mechanisms
                  </p>
                </div>
                <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl p-6 border border-purple-500/30">
                  <h4 className="text-white font-semibold mb-2">Auto Verification</h4>
                  <p className="text-gray-300 text-sm">
                    Contracts verified on blockchain explorers with trust badges
                    Contracts verified on blockchain explorers with trust badges
                  </p>
                </div>
                
                <div className="bg-gradient-to-r from-green-500/20 to-teal-500/20 rounded-xl p-6 border border-green-500/30">
                  <h4 className="text-white font-semibold mb-2">Anti-Bot Protection</h4>
                  <p className="text-gray-300 text-sm">
                    Prevent front-running bots and automated sniping during launches
                  </p>
                </div>
                
                <div className="bg-gradient-to-r from-orange-500/20 to-amber-500/20 rounded-xl p-6 border border-orange-500/30">
                  <h4 className="text-white font-semibold mb-2">Governance Tools</h4>
                  <p className="text-gray-300 text-sm">
                    Built-in voting system for token holders to participate in decisions
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-4xl font-bold text-white mb-6">
            Ready to Launch Your Token?
          </h3>
          <p className="text-gray-300 text-lg mb-8">
            Join thousands of developers who trust TokenForge for their token creation needs
          </p>
          
          <button
            onClick={onGetStarted}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200 flex items-center space-x-2 group mx-auto"
          >
            <span>Get Started Now</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>
    </div>
  );
};