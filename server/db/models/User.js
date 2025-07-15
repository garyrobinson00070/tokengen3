const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  address: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    index: true,
  },
  nonce: {
    type: String,
    required: true,
  },
  lastLogin: {
    type: Date,
    default: Date.now,
  },
  esrBalance: {
    type: Number,
    default: 0,
  },
  esrLastChecked: {
    type: Date,
  },
  deployments: {
    tokens: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Token',
      },
    ],
    presales: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Presale',
      },
    ],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('User', UserSchema);