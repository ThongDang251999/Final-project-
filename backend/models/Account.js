const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['wallet', 'bank', 'credit'],
    required: true
  },
  balance: {
    type: Number,
    required: true,
    default: 0
  },
  creditLimit: {
    type: Number,
    default: 0,
    required: function() {
      return this.type === 'credit';
    }
  },
  paymentDueDate: {
    type: Date,
    required: function() {
      return this.type === 'credit';
    }
  },
  currency: {
    type: String,
    default: 'USD'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Account', accountSchema); 