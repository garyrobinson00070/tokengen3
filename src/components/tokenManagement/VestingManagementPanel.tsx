import React, { useState } from 'react';
import { Clock, AlertTriangle, Calendar, Users, Plus } from 'lucide-react';
import { TokenManagementData } from '../../types/tokenManagement';

interface VestingManagementPanelProps {
  tokenData: TokenManagementData;
  isOwner: boolean;
}

export const VestingManagementPanel: React.FC<VestingManagementPanelProps> = ({
  tokenData,
  isOwner
}) => {
  const [showCreateForm, setShowCreateForm] = useState(false);

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Clock className="w-6 h-6 text-blue-400" />
          <h3 className="text-xl font-semibold text-white">Token Vesting</h3>
        </div>
        
        {isOwner && (
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create Vesting</span>
          </button>
        )}
      </div>

      {/* Vesting Schedules */}
      <div className="space-y-4">
        {tokenData.features.vesting.schedules.length === 0 ? (
          <div className="bg-gray-500/20 border border-gray-500/50 rounded-lg p-8 text-center">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-gray-400 mb-2">No Vesting Schedules</h4>
            <p className="text-gray-500 text-sm">
              {isOwner 
                ? 'Create vesting schedules to lock tokens for specific beneficiaries.'
                : 'No vesting schedules have been created for this token.'
              }
            </p>
          </div>
        ) : (
          tokenData.features.vesting.schedules.map((schedule, index) => (
            <div key={index} className="bg-white/5 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <Users className="w-4 h-4 text-blue-400" />
                    <span className="text-white font-medium">
                      {schedule.beneficiary.slice(0, 6)}...{schedule.beneficiary.slice(-4)}
                    </span>
                    {schedule.revoked && (
                      <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded-full text-xs">
                        Revoked
                      </span>
                    )}
                  </div>
                  
                  <div className="grid md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-gray-300">Total Amount</div>
                      <div className="text-white font-medium">
                        {parseFloat(schedule.totalAmount).toLocaleString()} {tokenData.symbol}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-300">Released</div>
                      <div className="text-white font-medium">
                        {parseFloat(schedule.releasedAmount).toLocaleString()} {tokenData.symbol}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-300">Duration</div>
                      <div className="text-white font-medium">
                        {Math.floor(schedule.duration / (24 * 60 * 60))} days
                      </div>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Progress</span>
                      <span>
                        {((parseFloat(schedule.releasedAmount) / parseFloat(schedule.totalAmount)) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${(parseFloat(schedule.releasedAmount) / parseFloat(schedule.totalAmount)) * 100}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
                
                {isOwner && !schedule.revoked && (
                  <div className="ml-4">
                    <button className="text-red-400 hover:text-red-300 text-sm">
                      Revoke
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Vesting Form */}
      {showCreateForm && isOwner && (
        <div className="mt-6 border-t border-white/20 pt-6">
          <h4 className="text-lg font-semibold text-white mb-4">Create New Vesting Schedule</h4>
          
          <div className="bg-amber-500/20 border border-amber-500/50 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5" />
              <div>
                <h5 className="font-medium text-amber-400 mb-1">Vesting Contract Required</h5>
                <p className="text-amber-300 text-sm">
                  Token vesting requires a separate vesting contract to be deployed. 
                  This feature is not yet implemented in the current interface.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Information */}
      <div className="mt-6 p-4 bg-blue-500/20 border border-blue-500/50 rounded-lg">
        <div className="flex items-start space-x-3">
          <Clock className="w-5 h-5 text-blue-400 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-400 mb-1">About Token Vesting</h4>
            <p className="text-blue-300 text-sm">
              Vesting schedules lock tokens for a specified period, releasing them gradually over time.
              This prevents token dumps and ensures long-term commitment from team members and investors.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};