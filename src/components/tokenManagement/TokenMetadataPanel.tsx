import React from 'react';
import { Image, AlertTriangle } from 'lucide-react';
import { TokenManagementData } from '../../types/tokenManagement';
import { TokenMetadataForm } from '../TokenMetadataForm';

interface TokenMetadataPanelProps {
  tokenData: TokenManagementData;
  isOwner: boolean;
}

export const TokenMetadataPanel: React.FC<TokenMetadataPanelProps> = ({
  tokenData,
  isOwner
}) => {
  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
      <div className="flex items-center space-x-3 mb-6">
        <Image className="w-6 h-6 text-blue-400" />
        <h3 className="text-xl font-semibold text-white">Token Metadata</h3>
      </div>

      {!isOwner && (
        <div className="bg-amber-500/20 border border-amber-500/50 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5" />
            <div>
              <h4 className="font-medium text-amber-400 mb-1">View-Only Mode</h4>
              <p className="text-amber-300 text-sm">
                Only the token owner can edit metadata. You are viewing this token in read-only mode.
              </p>
            </div>
          </div>
        </div>
      )}

      <TokenMetadataForm
        tokenAddress={tokenData.address}
        tokenName={tokenData.name}
        tokenSymbol={tokenData.symbol}
        isOwner={isOwner}
      />
    </div>
  );
};