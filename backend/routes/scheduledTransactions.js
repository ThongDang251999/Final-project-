const express = require('express');
const router = express.Router();
const ScheduledTransaction = require('../models/ScheduledTransaction');
const Transaction = require('../models/Transaction');
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

// Get all scheduled transactions for the authenticated user
router.get('/', auth, async (req, res) => {
  try {
    const { status } = req.query;
    
    let query = { userId: req.userId };
    if (status) {
      query.status = status;
    }
    
    const scheduledTransactions = await ScheduledTransaction.find(query)
      .populate('accountId', 'name type')
      .sort({ scheduledDate: 1 });
      
    res.json(scheduledTransactions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching scheduled transactions', error: error.message });
  }
});

// Get a single scheduled transaction by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const scheduledTransaction = await ScheduledTransaction.findOne({ 
      _id: req.params.id,
      userId: req.userId
    }).populate('accountId', 'name type');
    
    if (!scheduledTransaction) {
      return res.status(404).json({ message: 'Scheduled transaction not found' });
    }
    
    res.json(scheduledTransaction);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching scheduled transaction', error: error.message });
  }
});

// Create a new scheduled transaction
router.post('/', auth, async (req, res) => {
  try {
    const { 
      accountId, 
      amount, 
      type, 
      category, 
      description, 
      scheduledDate, 
      isRecurring, 
      recurrenceType, 
      recurrenceEnd 
    } = req.body;
    
    // Validate account exists and belongs to user
    const account = await Account.findOne({ _id: accountId, userId: req.userId });
    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }
    
    const scheduledTransaction = new ScheduledTransaction({
      userId: req.userId,
      accountId,
      amount: Number(amount),
      type,
      category,
      description,
      scheduledDate,
      isRecurring: isRecurring || false,
      recurrenceType: isRecurring ? recurrenceType : undefined,
      recurrenceEnd: isRecurring ? recurrenceEnd : undefined
    });
    
    await scheduledTransaction.save();
    res.status(201).json(scheduledTransaction);
  } catch (error) {
    res.status(500).json({ message: 'Error creating scheduled transaction', error: error.message });
  }
});

// Update a scheduled transaction
router.put('/:id', auth, async (req, res) => {
  try {
    const { 
      accountId, 
      amount, 
      type, 
      category, 
      description, 
      scheduledDate, 
      isRecurring, 
      recurrenceType, 
      recurrenceEnd,
      status
    } = req.body;
    
    // Find the scheduled transaction to update
    const scheduledTransaction = await ScheduledTransaction.findOne({ 
      _id: req.params.id,
      userId: req.userId
    });
    
    if (!scheduledTransaction) {
      return res.status(404).json({ message: 'Scheduled transaction not found' });
    }
    
    // If changing account, validate it exists and belongs to user
    if (accountId && accountId !== scheduledTransaction.accountId.toString()) {
      const account = await Account.findOne({ _id: accountId, userId: req.userId });
      if (!account) {
        return res.status(404).json({ message: 'Account not found' });
      }
      scheduledTransaction.accountId = accountId;
    }
    
    // Update other fields
    if (amount !== undefined) scheduledTransaction.amount = Number(amount);
    if (type) scheduledTransaction.type = type;
    if (category) scheduledTransaction.category = category;
    if (description) scheduledTransaction.description = description;
    if (scheduledDate) scheduledTransaction.scheduledDate = scheduledDate;
    if (isRecurring !== undefined) scheduledTransaction.isRecurring = isRecurring;
    if (recurrenceType) scheduledTransaction.recurrenceType = recurrenceType;
    if (recurrenceEnd) scheduledTransaction.recurrenceEnd = recurrenceEnd;
    if (status) scheduledTransaction.status = status;
    
    await scheduledTransaction.save();
    res.json(scheduledTransaction);
  } catch (error) {
    res.status(500).json({ message: 'Error updating scheduled transaction', error: error.message });
  }
});

// Process a scheduled transaction (convert to actual transaction)
router.post('/:id/process', auth, async (req, res) => {
  try {
    const scheduledTransaction = await ScheduledTransaction.findOne({ 
      _id: req.params.id,
      userId: req.userId,
      status: 'pending'
    });
    
    if (!scheduledTransaction) {
      return res.status(404).json({ message: 'Pending scheduled transaction not found' });
    }
    
    // Create actual transaction
    const transaction = new Transaction({
      userId: req.userId,
      accountId: scheduledTransaction.accountId,
      amount: scheduledTransaction.amount,
      type: scheduledTransaction.type,
      category: scheduledTransaction.category,
      description: scheduledTransaction.description,
      date: new Date()
    });
    
    await transaction.save();
    
    // Update account balance
    const account = await Account.findById(scheduledTransaction.accountId);
    
    if (scheduledTransaction.type === 'income') {
      account.balance += scheduledTransaction.amount;
    } else {
      account.balance -= scheduledTransaction.amount;
    }
    
    await account.save();
    
    // Update scheduled transaction status
    scheduledTransaction.status = 'processed';
    await scheduledTransaction.save();
    
    res.json({ message: 'Transaction processed successfully', transaction });
  } catch (error) {
    res.status(500).json({ message: 'Error processing scheduled transaction', error: error.message });
  }
});

// Delete a scheduled transaction
router.delete('/:id', auth, async (req, res) => {
  try {
    const scheduledTransaction = await ScheduledTransaction.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });
    
    if (!scheduledTransaction) {
      return res.status(404).json({ message: 'Scheduled transaction not found' });
    }
    
    res.json({ message: 'Scheduled transaction deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting scheduled transaction', error: error.message });
  }
});

module.exports = router; 