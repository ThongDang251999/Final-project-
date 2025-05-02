const express = require('express');
const router = express.Router();
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

// Get all transactions for the authenticated user
router.get('/', auth, async (req, res) => {
  try {
    // Parse query parameters for filtering
    const { category, startDate, endDate, type, accountId } = req.query;
    
    // Build filter object
    const filter = { userId: req.userId };
    
    if (category) {
      filter.category = category;
    }
    
    if (type) {
      filter.type = type;
    }
    
    if (accountId) {
      filter.accountId = accountId;
    }
    
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) {
        filter.date.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.date.$lte = new Date(endDate);
      }
    }
    
    const transactions = await Transaction.find(filter)
      .populate('accountId', 'name type')
      .sort({ date: -1 });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching transactions', error: error.message });
  }
});

// Get financial summary
router.get('/summary', auth, async (req, res) => {
  try {
    // Get all user transactions
    const transactions = await Transaction.find({ userId: req.userId });
    
    // Get all user accounts
    const accounts = await Account.find({ userId: req.userId });
    
    // Calculate total balance across all accounts
    const totalBalance = accounts.reduce((sum, account) => {
      // Add balance for regular accounts
      if (account.type !== 'credit') {
        return sum + account.balance;
      }
      // Subtract balance for credit accounts (as credit balance is typically debt)
      return sum - account.balance;
    }, 0);
    
    // Calculate total credit usage and limit
    const creditAccounts = accounts.filter(a => a.type === 'credit');
    const totalCreditUsed = creditAccounts.reduce((sum, account) => sum + account.balance, 0);
    const totalCreditLimit = creditAccounts.reduce((sum, account) => sum + account.creditLimit, 0);
    
    // Calculate total income and expenses
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
      
    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
      
    // Calculate category breakdown for expenses
    const categoryBreakdown = {};
    transactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        categoryBreakdown[t.category] = (categoryBreakdown[t.category] || 0) + t.amount;
      });
    
    res.json({
      totalBalance,
      totalIncome,
      totalExpenses,
      creditUsage: totalCreditLimit > 0 ? (totalCreditUsed / totalCreditLimit) * 100 : 0,
      totalCreditUsed,
      totalCreditLimit,
      categoryBreakdown,
      accounts: accounts.map(a => ({
        id: a._id,
        name: a.name,
        type: a.type,
        balance: a.balance,
        creditLimit: a.creditLimit
      }))
    });
  } catch (error) {
    res.status(500).json({ message: 'Error getting summary', error: error.message });
  }
});

// Add a new transaction
router.post('/', auth, async (req, res) => {
  try {
    const { amount, type, category, description, date, rating, accountId } = req.body;
    
    // Validate account exists and belongs to user
    const account = await Account.findOne({ _id: accountId, userId: req.userId });
    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }
    
    const transaction = new Transaction({
      userId: req.userId,
      accountId,
      amount: Number(amount),
      type,
      category,
      description,
      date: date ? new Date(date) : new Date(),
      rating: rating || 0
    });
    
    // Update account balance
    if (type === 'income') {
      account.balance += Number(amount);
    } else if (type === 'expense') {
      account.balance -= Number(amount);
    }
    
    await Promise.all([
      transaction.save(),
      account.save()
    ]);
    
    res.status(201).json(transaction);
  } catch (error) {
    res.status(500).json({ message: 'Error adding transaction', error: error.message });
  }
});

// Update a transaction
router.put('/:id', auth, async (req, res) => {
  try {
    const { amount, type, category, description, date, rating, accountId } = req.body;
    
    const transaction = await Transaction.findOne({ 
      _id: req.params.id,
      userId: req.userId
    });
    
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    // Handle account change or amount change (update balances)
    if (accountId !== undefined && accountId !== transaction.accountId.toString()) {
      // Get old and new accounts
      const [oldAccount, newAccount] = await Promise.all([
        Account.findById(transaction.accountId),
        Account.findOne({ _id: accountId, userId: req.userId })
      ]);
      
      if (!newAccount) {
        return res.status(404).json({ message: 'New account not found' });
      }
      
      // Reverse the effect on old account
      if (transaction.type === 'income') {
        oldAccount.balance -= transaction.amount;
      } else {
        oldAccount.balance += transaction.amount;
      }
      
      // Apply effect to new account
      const newAmount = amount !== undefined ? Number(amount) : transaction.amount;
      const newType = type || transaction.type;
      if (newType === 'income') {
        newAccount.balance += newAmount;
      } else {
        newAccount.balance -= newAmount;
      }
      
      // Save accounts and update transaction accountId
      await Promise.all([
        oldAccount.save(),
        newAccount.save()
      ]);
      
      transaction.accountId = accountId;
    } 
    // If only amount or type changed, but account stayed the same
    else if (amount !== undefined || type !== undefined) {
      const account = await Account.findById(transaction.accountId);
      
      // Reverse the effect of the old transaction
      if (transaction.type === 'income') {
        account.balance -= transaction.amount;
      } else {
        account.balance += transaction.amount;
      }
      
      // Apply the effect of the new transaction values
      const newAmount = amount !== undefined ? Number(amount) : transaction.amount;
      const newType = type || transaction.type;
      if (newType === 'income') {
        account.balance += newAmount;
      } else {
        account.balance -= newAmount;
      }
      
      await account.save();
    }
    
    // Update transaction fields
    if (amount !== undefined) transaction.amount = Number(amount);
    if (type) transaction.type = type;
    if (category) transaction.category = category;
    if (description) transaction.description = description;
    if (date) transaction.date = new Date(date);
    if (rating !== undefined) transaction.rating = rating;
    
    await transaction.save();
    res.json(transaction);
  } catch (error) {
    res.status(500).json({ message: 'Error updating transaction', error: error.message });
  }
});

// Delete a transaction
router.delete('/:id', auth, async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.userId
    });
    
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    // Update account balance
    const account = await Account.findById(transaction.accountId);
    if (account) {
      if (transaction.type === 'income') {
        account.balance -= transaction.amount;
      } else {
        account.balance += transaction.amount;
      }
      await account.save();
    }
    
    await Transaction.deleteOne({ _id: transaction._id });
    
    res.json({ message: 'Transaction deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting transaction', error: error.message });
  }
});

// Update transaction rating
router.patch('/:id/rating', auth, async (req, res) => {
  try {
    const { rating } = req.body;
    
    if (rating === undefined || rating < 0 || rating > 10) {
      return res.status(400).json({ message: 'Rating must be between 0 and 10' });
    }
    
    const transaction = await Transaction.findOne({ 
      _id: req.params.id,
      userId: req.userId
    });
    
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    transaction.rating = rating;
    await transaction.save();
    
    res.json(transaction);
  } catch (error) {
    res.status(500).json({ message: 'Error updating rating', error: error.message });
  }
});

// Export transactions to CSV
router.get('/export', auth, async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.userId })
      .populate('accountId', 'name type')
      .sort({ date: -1 });
    
    // Convert to CSV format
    let csv = 'date,amount,type,category,description,accountId\n';
    
    transactions.forEach(transaction => {
      const date = new Date(transaction.date).toISOString().split('T')[0];
      const accountId = transaction.accountId?._id || transaction.accountId;
      csv += `${date},${transaction.amount},${transaction.type},${transaction.category},"${transaction.description}",${accountId}\n`;
    });
    
    res.header('Content-Type', 'text/csv');
    res.attachment('transactions.csv');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ message: 'Error exporting transactions', error: error.message });
  }
});

// Import transactions from CSV
router.post('/import', auth, async (req, res) => {
  try {
    if (!req.files || !req.files.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    const file = req.files.file;
    
    if (file.mimetype !== 'text/csv') {
      return res.status(400).json({ message: 'File must be a CSV' });
    }
    
    const content = file.data.toString();
    const rows = content.split('\n');
    
    // Skip header row
    const header = rows[0].split(',');
    const dateIndex = header.indexOf('date');
    const amountIndex = header.indexOf('amount');
    const typeIndex = header.indexOf('type');
    const categoryIndex = header.indexOf('category');
    const descriptionIndex = header.indexOf('description');
    const accountIdIndex = header.indexOf('accountId');
    
    if (dateIndex === -1 || amountIndex === -1 || typeIndex === -1 || 
        categoryIndex === -1 || descriptionIndex === -1) {
      return res.status(400).json({ message: 'CSV file is missing required columns' });
    }
    
    let importCount = 0;
    const transactions = [];
    
    // Get default account if needed
    let defaultAccount = null;
    if (accountIdIndex === -1) {
      defaultAccount = await Account.findOne({ userId: req.userId });
      if (!defaultAccount) {
        return res.status(400).json({ message: 'No default account found' });
      }
    }
    
    // Process each row
    for(let i = 1; i < rows.length; i++) {
      const row = rows[i].split(',');
      if (row.length <= 1) continue; // Skip empty rows
      
      const accountId = accountIdIndex !== -1 && row[accountIdIndex] 
        ? row[accountIdIndex]
        : defaultAccount._id;
        
      // Validate account exists and belongs to user
      const account = await Account.findOne({ _id: accountId, userId: req.userId });
      if (!account) {
        continue; // Skip this transaction if account not found
      }
      
      // Clean the description (remove quotes)
      let description = row[descriptionIndex];
      if (description.startsWith('"') && description.endsWith('"')) {
        description = description.substring(1, description.length - 1);
      }
      
      const transaction = new Transaction({
        userId: req.userId,
        accountId: account._id,
        date: new Date(row[dateIndex]),
        amount: Number(row[amountIndex]),
        type: row[typeIndex],
        category: row[categoryIndex],
        description: description
      });
      
      transactions.push(transaction);
      
      // Update account balance
      if (transaction.type === 'income') {
        account.balance += transaction.amount;
      } else {
        account.balance -= transaction.amount;
      }
      
      await account.save();
      importCount++;
    }
    
    if (transactions.length > 0) {
      await Transaction.insertMany(transactions);
    }
    
    res.json({ message: 'Import successful', count: importCount });
  } catch (error) {
    res.status(500).json({ message: 'Error importing transactions', error: error.message });
  }
});

module.exports = router; 