import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Rocket, Shield, Clock, Users } from 'lucide-react';
import { PresaleConfig, PresaleStep, PresaleDeploymentResult } from '../types/presale';
import { Network } from '../types';
import { SaleTypeStep } from './presale/SaleTypeStep';
import { TokenInfoStep } from './presale/TokenInfoStep';
import { SaleConfigStep } from './presale/SaleConfigStep';
import { VestingStep } from './presale/VestingStep';
import { WalletSetupStep } from './presale/WalletSetupStep';
import { PresaleReviewStep } from './presale/PresaleReviewStep';
import { PresaleSuccessStep } from './presale/PresaleSuccessStep';
import { networks } from '../data/networks';

interface PresaleWizardProps {
  onBack: () => void;
}

export const PresaleWizard: React.FC<PresaleWizardProps> = ({ onBack }) => {
  const [currentStep, setCurrentStep] = useState<PresaleStep>('type');
  const [config, setConfig] = useState<PresaleConfig>({
    saleType: 'presale',
    tokenInfo: {
      tokenAddress: '',
      tokenName: '',
      tokenSymbol: '',
      maxSupply: '',
      allocatedAmount: ''
    },
    saleConfiguration: {
      saleName: '',
      softCap: '',
      hardCap: '',
      tokenPrice: '',
      minPurchase: '',
      maxPurchase: '',
      startDate: '',
      endDate: '',
      whitelistEnabled: false
    },
    vestingConfig: {
      enabled: false,
      duration: 30,
      initialRelease: 10
    },
    walletSetup: {
      saleReceiver: '',
      refundWallet: ''
    },
    network: networks[0]
  });
  
  const [deploymentResult, setDeploymentResult] = useState<PresaleDeploymentResult | null>(null);

  const steps: Array<{ id: PresaleStep; title: string; icon: React.ComponentType<any> }> = [
    { id: 'type', title: 'Sale Type', icon: Rocket },
    { id: 'token', title: 'Token Info', icon: Shield },
    { id: 'config', title: 'Configuration', icon: Clock },
    { id: 'vesting', title: 'Vesting', icon: Users },
    { id: 'wallet', title: 'Wallet Setup', icon: Shield },
    { id: 'review', title: 'Review', icon: Clock }
  ];

  const getCurrentStepIndex = () => {
    return steps.findIndex(step => step.id === currentStep);
  };

  const handleNext = (updatedConfig: Partial<PresaleConfig>) => {
    const newConfig = { ...config, ...updatedConfig };
    setConfig(newConfig);

    const currentIndex = getCurrentStepIndex();
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1].id);
    }
  };

  const handleBack = () => {
    const currentIndex = getCurrentStepIndex();
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1].id);
    } else {
      onBack();
    }
  };

  const handleDeploy = (result: PresaleDeploymentResult) => {
    setDeploymentResult(result);
    setCurrentStep('success');
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'type':
        return <SaleTypeStep config={config} onNext={handleNext} onBack={handleBack} />;
      case 'token':
        return <TokenInfoStep config={config} onNext={handleNext} onBack={handleBack} />;
      case 'config':
        return <SaleConfigStep config={config} onNext={handleNext} onBack={handleBack} />;
      case 'vesting':
        return <VestingStep config={config} onNext={handleNext} onBack={handleBack} />;
      case 'wallet':
        return <WalletSetupStep config={config} onNext={handleNext} onBack={handleBack} />;
      case 'review':
        return <PresaleReviewStep config={config} onBack={handleBack} onDeploy={handleDeploy} />;
      case 'success':
        return <PresaleSuccessStep result={deploymentResult!} onStartNew={() => setCurrentStep('type')} />;
      default:
        return null;
    }
  };

  if (currentStep === 'success') {
    return renderStep();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>
          
          <h1 className="text-3xl font-bold text-white mb-2">Launch Sale</h1>
          <p className="text-gray-300">Create presale or private sale for your token</p>
        </div>

        {/* Progress Steps */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 mb-8">
          <div className="flex items-center justify-between overflow-x-auto pb-2">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = step.id === currentStep;
              const isCompleted = getCurrentStepIndex() > index;
              
              return (
                <div key={step.id} className="flex items-center flex-shrink-0">
                  <div className={`flex items-center space-x-3 ${
                    isActive ? 'text-blue-400' : isCompleted ? 'text-green-400' : 'text-gray-400'
                  }`}>
                    <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center border-2 ${
                      isActive 
                        ? 'border-blue-400 bg-blue-400/20' 
                        : isCompleted 
                        ? 'border-green-400 bg-green-400/20' 
                        : 'border-gray-400 bg-gray-400/20'
                    }`}>
                      <Icon className="w-4 h-4 md:w-5 md:h-5" />
                    </div>
                    <div className="hidden sm:block">
                      <div className="font-medium text-sm md:text-base">{step.title}</div>
                      <div className="text-xs opacity-75">Step {index + 1}</div>
                    </div>
                    <div className="sm:hidden">
                      <div className="text-xs font-medium">{index + 1}</div>
                    </div>
                  </div>
                  
                  {index < steps.length - 1 && (
                    <div className={`w-8 md:w-16 h-0.5 mx-2 md:mx-4 flex-shrink-0 ${
                      isCompleted ? 'bg-green-400' : 'bg-gray-600'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
          
          {/* Mobile Step Indicator */}
          <div className="sm:hidden mt-4 text-center">
            <div className="text-white font-medium">
              {steps.find(step => step.id === currentStep)?.title}
            </div>
            <div className="text-gray-300 text-sm">
              Step {getCurrentStepIndex() + 1} of {steps.length}
            </div>
          </div>
        </div>

        {/* Step Content */}
        {renderStep()}
      </div>
    </div>
  );
};