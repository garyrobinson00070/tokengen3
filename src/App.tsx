import React, { useState, useEffect } from 'react';
import { LandingPage } from './components/LandingPage';
import { TokenBuilder } from './components/TokenBuilder';
import { VestingConfiguration } from './components/VestingConfiguration';
import { ReviewDeploy } from './components/ReviewDeploy';
import { DeploymentSuccess } from './components/DeploymentSuccess';
import { PresaleWizard } from './components/PresaleWizard';
import { MySales } from './components/MySales';
import { DeployedTokens } from './components/DeployedTokens';
import { SaleRouter } from './components/SaleRouter';
import { SaleExplorer } from './components/SaleExplorer';
import { TokenManagement } from './components/TokenManagement';
import { LiquidityLock } from './components/LiquidityLock';
import { Airdrop } from './components/Airdrop';
import { NotFound } from './components/NotFound';
import { BadgeManagementPanel } from './components/admin/BadgeManagementPanel';
import { GovernanceDashboard } from './components/governance/GovernanceDashboard';
import { ProposalDetail } from './components/governance/ProposalDetail';
import { TokenConfig, DeploymentResult, Step } from './types';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useNetworkMode } from './hooks/useNetworkMode';
import { useWallet } from './hooks/useWallet';
import { NetworkModeIndicator } from './components/NetworkModeIndicator';
import { 
  getMainnetChainIds, 
  getTestnetChainIds, 
  isMainnetChain, 
  isTestnetChain 
} from './config/chainConfig';

declare global {
  interface Window {
    ethereum?: any;
  }
}

function App() {
  const { isTestnetMode } = useNetworkMode();
  const { isConnected, chainId, switchToNetwork } = useWallet();
  const [currentStep, setCurrentStep] = useState<'landing' | 'builder' | 'vesting' | 'review' | 'success' | 'presale' | 'sales' | 'tokens' | 'sale' | 'explore' | 'manage' | 'liquidity-lock' | 'airdrop' | 'admin' | 'governance' | 'proposal'>('landing');
  const [tokenConfig, setTokenConfig] = useState<TokenConfig | null>(null);
  const [deploymentResult, setDeploymentResult] = useState<DeploymentResult | null>(null);
  const [deploymentMethod, setDeploymentMethod] = useState<'primary' | 'fallback' | 'emergency'>('primary');

  // Handle network switching when mode changes or wallet connects
  useEffect(() => {
    if (isConnected && chainId) {
      const isCorrectNetworkType = isTestnetMode 
        ? isTestnetChain(chainId) 
        : isMainnetChain(chainId);
      
      // If network doesn't match mode, try to switch
      if (!isCorrectNetworkType) {
        const targetChainIds = isTestnetMode ? getTestnetChainIds() : getMainnetChainIds();
        if (targetChainIds.length > 0) {
          switchToNetwork(targetChainIds[0]).catch(error => {
            console.error('Failed to switch network:', error);
          });
        }
      }
    }
  }, [isConnected, chainId, isTestnetMode, switchToNetwork]);

  const handleGetStarted = () => {
    setCurrentStep('builder');
  };

  const handleLaunchSale = () => {
    setCurrentStep('presale');
  };

  const handleViewSales = () => {
    setCurrentStep('sales');
  };

  const handleViewTokens = () => {
    setCurrentStep('tokens');
  };

  const handleExploreSales = () => {
    setCurrentStep('explore');
  };
  
  const handleLiquidityLock = () => {
    setCurrentStep('liquidity-lock');
  };
  
  const handleAirdrop = () => {
    setCurrentStep('airdrop');
  };
  
  const handleAdminPanel = () => {
    setCurrentStep('admin');
  };

  const handleTokenConfigComplete = (config: TokenConfig) => {
    setTokenConfig(config);
    setCurrentStep('vesting');
  };

  const handleVestingComplete = (config: TokenConfig) => {
    setTokenConfig(config);
    setCurrentStep('review');
  };

  const handleDeploy = (result: DeploymentResult) => {
    setDeploymentResult(result);
    setDeploymentMethod(result.deploymentMethod || 'primary');
    setCurrentStep('success');
  };

  const handleStartNew = () => {
    setCurrentStep('landing');
    setTokenConfig(null);
    setDeploymentResult(null);
  };

  const goBack = () => {
    switch (currentStep) {
      case 'builder':
        setCurrentStep('landing');
        break;
      case 'vesting':
        setCurrentStep('builder');
        break;
      case 'review':
        setCurrentStep('vesting');
        break;
      default:
        setCurrentStep('landing');
    }
  };

  switch (currentStep) {
    case 'landing':
      return (
        <>
        <LandingPage 
          onGetStarted={handleGetStarted}
          onLaunchSale={handleLaunchSale}
          onViewSales={handleViewSales}
          onViewTokens={handleViewTokens}
          onExploreSales={handleExploreSales} 
          onLiquidityLock={handleLiquidityLock}
          onAirdrop={handleAirdrop}
          onAdminPanel={handleAdminPanel}
          onAdminPanel={handleAdminPanel}
        />
        <NetworkModeIndicator />
        </>
      );
    
    case 'builder':
      return (
        <>
        <TokenBuilder
          onBack={goBack}
          onNext={handleTokenConfigComplete}
          initialConfig={tokenConfig || undefined}
        />
        <NetworkModeIndicator />
        </>
      );
    
    case 'vesting':
      return (
        <>
        <VestingConfiguration
          config={tokenConfig!}
          onBack={goBack}
          onNext={handleVestingComplete}
        />
        <NetworkModeIndicator />
        </>
      );
    
    case 'review':
      return (
        <>
        <ReviewDeploy
          config={tokenConfig!}
          onBack={goBack}
          onDeploy={handleDeploy}
        />
        <NetworkModeIndicator />
        </>
      );
    
    case 'success':
      return (
        <>
          <DeploymentSuccess
            result={deploymentResult!}
            deploymentMethod={deploymentMethod}
            onStartNew={handleStartNew}
          />
          <NetworkModeIndicator />
        </>
      );
    
    case 'presale':
      return (
        <>
        <PresaleWizard
          onBack={() => setCurrentStep('landing')}
        />
        <NetworkModeIndicator />
        </>
      );
    
    case 'sales':
      return (
        <>
          <MySales />
          <NetworkModeIndicator />
        </>
      );
    
    case 'tokens':
      return (
        <>
          <DeployedTokens />
          <NetworkModeIndicator />
        </>
      );
    
    case 'sale':
      return (
        <>
          <SaleRouter />
          <NetworkModeIndicator />
        </>
      );
    
    case 'explore':
      return (
        <>
          <SaleExplorer />
          <NetworkModeIndicator />
        </>
      );
    
    case 'manage':
      return (
        <>
          <TokenManagement />
          <NetworkModeIndicator />
        </>
      );
    
    case 'liquidity-lock':
      return (
        <>
          <LiquidityLock />
          <NetworkModeIndicator />
        </>
      );
      
    case 'airdrop':
      return (
        <>
          <Airdrop />
          <NetworkModeIndicator />
        </>
      );
    
    case 'admin':
      return (
        <>
          <BadgeManagementPanel />
          <NetworkModeIndicator />
        </>
      );
    
    case 'governance':
      return (
        <>
          <GovernanceDashboard />
          <NetworkModeIndicator />
        </>
      );
    
    case 'proposal':
      return (
        <>
          <ProposalDetail />
          <NetworkModeIndicator />
        </>
      );
    
    case '404':
      return (
        <>
          <NotFound />
          <NetworkModeIndicator />
        </>
      );
    
    default:
      // Check if this is a valid route
      const validRoutes = ['landing', 'builder', 'vesting', 'review', 'success', 'presale', 'sales', 'tokens', 'sale', 'explore', 'manage', 'liquidity-lock', 'airdrop', 'admin', 'governance', 'proposal'];
      if (!validRoutes.includes(currentStep)) {
        return (
          <>
            <NotFound />
            <NetworkModeIndicator />
          </>
        );
      } else {
        return (
          <>
          <LandingPage 
            onGetStarted={handleGetStarted}
            onLaunchSale={handleLaunchSale}
            onViewSales={handleViewSales}
            onViewTokens={handleViewTokens}
            onExploreSales={handleExploreSales}
            onLiquidityLock={handleLiquidityLock}
            onAirdrop={handleAirdrop}
            onAdminPanel={handleAdminPanel}
          />
          <NetworkModeIndicator />
          </>
        );
      }
  }
}

export default App;