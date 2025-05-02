const express = require('express');
const router = express.Router();
const Account = require('../models/Account');
const jwt = require('jsonwebtoken');

// Middleware to verify JWT token
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization').replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Please authenticate' });
  }
};

// Get all accounts for the authenticated user
router.get('/', auth, async (req, res) => {
  try {
    const accounts = await Account.find({ userId: req.userId });
    res.json(accounts);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching accounts', error: error.message });
  }
});

// Get a single account by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const account = await Account.findOne({ 
      _id: req.params.id,
      userId: req.userId
    });
    
    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }
    
    res.json(account);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching account', error: error.message });
  }
});

// Create a new account
router.post('/', auth, async (req, res) => {
  try {
    const { name, type, balance, creditLimit, paymentDueDate, currency } = req.body;
    
    const account = new Account({
      userId: req.userId,
      name,
      type,
      balance: Number(balance) || 0,
      creditLimit: type === 'credit' ? Number(creditLimit) || 0 : undefined,
      paymentDueDate: type === 'credit' ? paymentDueDate : undefined,
      currency
    });
    
    await account.save();
    res.status(201).json(account);
  } catch (error) {
    res.status(500).json({ message: 'Error creating account', error: error.message });
  }
});

// Update an account
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, balance, creditLimit, paymentDueDate, currency } = req.body;
    
    // Find the account to update
    const account = await Account.findOne({ 
      _id: req.params.id,
      userId: req.userId
    });
    
    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }
    
    // Update fields
    if (name) account.name = name;
    if (balance !== undefined) account.balance = Number(balance);
    if (account.type === 'credit' && creditLimit) account.creditLimit = Number(creditLimit);
    if (account.type === 'credit' && paymentDueDate) account.paymentDueDate = paymentDueDate;
    if (currency) account.currency = currency;
    
    await account.save();
    res.json(account);
  } catch (error) {
    res.status(500).json({ message: 'Error updating account', error: error.message });
  }
});

// Delete an account
router.delete('/:id', auth, async (req, res) => {
  try {
    const account = await Account.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });
    
    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }
    
    res.json({ message: 'Account deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting account', error: error.message });
  }
});

module.exports = router; 