const mongoose = require('mongoose');

const TokenSchema = new mongoose.Schema({
  contractAddress: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  contractType: {
    type: String,
    required: true,
    enum: [
      'BasicToken',
      'BurnableToken',
      'MintableToken',
      'BurnableMintableToken',
      'FeeToken',
      'RedistributionToken',
      'AdvancedToken',
    ],
  },
  name: {
    type: String,
    required: true,
  },
  symbol: {
    type: String,
    required: true,
  },
  decimals: {
    type: Number,
    required: true,
    default: 18,
  },
  initialSupply: {
    type: String,
    required: true,
  },
  maxSupply: {
    type: String,
    default: '0',
  },
  owner: {
    type: String,
    required: true,
    index: true,
  },
  network: {
    id: String,
    name: String,
    chainId: Number,
  },
  transactionHash: {
    type: String,
    required: true,
  },
  verified: {
    type: Boolean,
    default: false,
  },
  features: {
    burnable: Boolean,
    mintable: Boolean,
    transferFees: {
      enabled: Boolean,
      percentage: Number,
      recipient: String,
    },
    holderRedistribution: {
      enabled: Boolean,
      percentage: Number,
    },
    vesting: {
      enabled: Boolean,
      schedules: [
        {
          category: String,
          percentage: Number,
          startDate: Date,
          duration: Number,
        },
      ],
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Token', TokenSchema);