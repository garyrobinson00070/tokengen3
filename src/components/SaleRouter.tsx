import React from 'react';
import { SalePage } from './SalePage';

interface SaleRouterProps {
  contractAddress?: string;
}

export const SaleRouter: React.FC<SaleRouterProps> = ({ contractAddress }) => {
  // Extract contract address from URL path
  const getContractFromPath = () => {
    const path = window.location.pathname;
    const match = path.match(/\/sale\/(.+)/);
    return match ? match[1] : null;
  };

  const address = contractAddress || getContractFromPath();

  if (!address) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Invalid Sale URL</h1>
          <p className="text-gray-300">Please provide a valid contract address.</p>
        </div>
      </div>
    );
  }

  return <SalePage contractAddress={address} />;
};