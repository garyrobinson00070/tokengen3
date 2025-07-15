const mongoose = require('mongoose');

const PresaleSchema = new mongoose.Schema({
  contractAddress: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  tokenAddress: {
    type: String,
    required: true,
    index: true,
  },
  owner: {
    type: String,
    required: true,
    index: true,
  },
  saleType: {
    type: String,
    enum: ['presale', 'private'],
    required: true,
  },
  tokenInfo: {
    tokenName: String,
    tokenSymbol: String,
    maxSupply: String,
    allocatedAmount: String,
  },
  saleConfiguration: {
    saleName: String,
    softCap: String,
    hardCap: String,
    tokenPrice: String,
    minPurchase: String,
    maxPurchase: String,
    startDate: Date,
    endDate: Date,
    whitelistEnabled: Boolean,
  },
  vestingConfig: {
    enabled: Boolean,
    duration: Number,
    initialRelease: Number,
  },
  walletSetup: {
    saleReceiver: String,
    refundWallet: String,
  },
  network: {
    id: String,
    name: String,
    chainId: Number,
  },
  status: {
    type: String,
    enum: ['upcoming', 'live', 'ended', 'cancelled', 'finalized'],
    default: 'upcoming',
  },
  transactionHash: String,
  totalRaised: {
    type: String,
    default: '0',
  },
  participantCount: {
    type: Number,
    default: 0,
  },
  verified: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Presale', PresaleSchema);