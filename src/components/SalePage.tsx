                  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                    <h2 className="text-xl font-semibold text-white mb-4">Vesting Schedule</h2>
                    
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-blue-400" />
                        <span className="text-white">Linear vesting enabled</span>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-gray-300">Initial Release</div>
                          <div className="text-white font-medium">{saleData.initialRelease}% at TGE</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-300">Vesting Duration</div>
                          <div className="text-white font-medium">{saleData.vestingDuration} days</div>
                        </div>
                      </div>
                      
                      <div className="p-3 bg-blue-500/20 rounded-lg">
                        <p className="text-blue-300 text-sm">
                          Tokens will be released gradually over the vesting period after the sale ends.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Emergency Withdraw Button (only during active sale) */}
                {status === 'live' && userInfo && parseFloat(userInfo.contribution) > 0 && (
                  <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-6">
                    <div className="flex items-start space-x-3">
                      <AlertOctagon className="w-5 h-5 text-red-400 mt-0.5" />
                      <div>
                        <h3 className="font-medium text-red-400 mb-1">Emergency Withdraw</h3>
                        <p className="text-red-300 text-sm mb-3">
                          You can withdraw your contribution before the sale ends, but a 10% penalty will be applied.
                        </p>
                        <button
                          onClick={() => setShowEmergencyModal(true)}
                          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                          Emergency Withdraw
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'buyers' && (
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                <h2 className="text-xl font-semibold text-white mb-4">Recent Participants</h2>
                <div className="space-y-3">
                  {/* This would be populated with actual buyer data */}
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-300">Participant data will be displayed here</p>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'referral' && (
              <ReferralSystem 
                presaleAddress={contractAddress}
                referralTrackerAddress="0x742d35Cc6634C0532925a3b8D4C9db96590c6C8C" // Replace with actual address
                baseTokenSymbol={saleData.networkSymbol}
              />
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Purchase Card */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 sticky top-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                {status === 'ended' ? 'Claim Tokens' : 'Purchase Tokens'}
              </h3>
              
              {!isConnected ? (
                <div className="text-center">
                  <Wallet className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-300 text-sm mb-4">Connect your wallet to participate</p>
                  <WalletConnection />
                </div>
              ) : status === 'ended' && userInfo ? (
                <div className="space-y-4">
                  {/* User Purchase Summary */}
                  <div className="bg-white/5 rounded-lg p-4">
                    <h4 className="font-medium text-white mb-3">Your Purchase</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-300">Contributed</span>
                        <span className="text-white">{userInfo.contribution} {saleData.networkSymbol}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Token Amount</span>
                        <span className="text-white">{parseFloat(userInfo.tokenAmount).toLocaleString()} {saleData.tokenSymbol}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Claimed</span>
                        <span className="text-white">{parseFloat(userInfo.claimedTokens).toLocaleString()} {saleData.tokenSymbol}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Claimable</span>
                        <span className="text-green-400 font-medium">{parseFloat(userInfo.claimableTokens).toLocaleString()} {saleData.tokenSymbol}</span>
                      </div>
                    </div>
                  </div>

                  {/* Vesting Progress */}
                  {vestingInfo && (
                    <div className="bg-white/5 rounded-lg p-4">
                      <h4 className="font-medium text-white mb-3">Vesting Progress</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-300">Progress</span>
                          <span className="text-white">{vestingInfo.vestingProgress.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-green-500 to-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${vestingInfo.vestingProgress}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Claim Button */}
                  {parseFloat(userInfo.claimableTokens) > 0 && (
                    <button
                      onClick={handleClaim}
                      disabled={isClaiming}
                      className="w-full bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white py-3 rounded-lg font-medium transition-all duration-200 disabled:opacity-50"
                    >
                      {isClaiming ? 'Claiming...' : 'Claim Tokens'}
                    </button>
                  )}
                </div>
              ) : canPurchase() ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Amount ({saleData.networkSymbol})
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      min={saleData.minPurchase}
                      max={saleData.maxPurchase}
                      value={purchaseAmount}
                      onChange={(e) => setPurchaseAmount(e.target.value)}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={`Min: ${saleData.minPurchase}`}
                    />
                  </div>
                  
                  {purchaseAmount && (
                    <div className="bg-blue-500/20 rounded-lg p-3">
                      <div className="text-sm text-blue-300">You will receive</div>
                      <div className="text-lg font-bold text-white">
                        {calculateTokenAmount(purchaseAmount)} {saleData.tokenSymbol}
                      </div>
                    </div>
                  )}
                  
                  <button
                    onClick={handlePurchase}
                    disabled={!purchaseAmount || isPurchasing || parseFloat(purchaseAmount) < parseFloat(saleData.minPurchase)}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white py-3 rounded-lg font-medium transition-all duration-200 disabled:opacity-50"
                  >
                    {isPurchasing ? 'Processing...' : 'Buy Tokens'}
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-300 text-sm">
                    {status === 'upcoming' ? 'Sale has not started yet' : 
                     status === 'ended' ? 'Sale has ended' :
                     'You cannot participate in this sale'}
                  </p>
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4">Quick Stats</h3>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Target className="w-5 h-5 text-blue-400" />
                  <div>
                    <div className="text-white font-medium">
                      {((parseFloat(saleData.totalRaised) / parseFloat(saleData.softCap)) * 100).toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-300">of Soft Cap</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Users className="w-5 h-5 text-green-400" />
                  <div>
                    <div className="text-white font-medium">{saleData.totalParticipants}</div>
                    <div className="text-sm text-gray-300">Participants</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <DollarSign className="w-5 h-5 text-purple-400" />
                  <div>
                    <div className="text-white font-medium">
                      {parseFloat(saleData.totalRaised).toFixed(2)} {saleData.networkSymbol}
                    </div>
                    <div className="text-sm text-gray-300">Total Raised</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Emergency Withdraw Modal */}
      {showEmergencyModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-xl p-6 border border-white/10 max-w-md w-full">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                <AlertOctagon className="w-5 h-5 text-red-400" />
              </div>
              <h3 className="text-xl font-semibold text-white">Emergency Withdraw</h3>
            </div>
            
            <p className="text-gray-300 mb-6">
              Are you sure you want to emergency withdraw your contribution? A 10% penalty will be applied.
            </p>
            
            {userInfo && (
              <div className="bg-white/5 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <div className="text-sm text-gray-300">Your Contribution</div>
                    <div className="text-white font-medium">
                      {calculateEmergencyWithdraw().contribution} {saleData.networkSymbol}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-300">Penalty (10%)</div>
                    <div className="text-red-400 font-medium">
                      {calculateEmergencyWithdraw().penalty} {saleData.networkSymbol}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-300">You Receive</div>
                    <div className="text-green-400 font-medium">
                      {calculateEmergencyWithdraw().refund} {saleData.networkSymbol}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowEmergencyModal(false)}
                className="flex-1 px-4 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleEmergencyWithdraw}
                disabled={isEmergencyWithdrawing}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {isEmergencyWithdrawing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>Confirm Withdraw</span>
                )}
              </button>
            </div>
                {vestingInfo && (
          </div>
        </div>
      )}
    </div>
  );
};