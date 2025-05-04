const express = require('express');
const router = express.Router();
const Budget = require('../models/Budget');
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

// Get all budgets for the authenticated user
router.get('/', auth, async (req, res) => {
  try {
    const budgets = await Budget.find({ userId: req.userId });
    res.json(budgets);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching budgets', error: error.message });
  }
});

// Get a single budget by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const budget = await Budget.findOne({ 
      _id: req.params.id,
      userId: req.userId
    });
    
    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }
    
    res.json(budget);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching budget', error: error.message });
  }
});

// Create a new budget
router.post('/', auth, async (req, res) => {
  try {
    const { category, amount, period } = req.body;
    
    // Check for existing budget in this category
    const existingBudget = await Budget.findOne({ 
      userId: req.userId,
      category
    });
    
    if (existingBudget) {
      return res.status(400).json({ message: `A budget for ${category} already exists` });
    }
    
    const budget = new Budget({
      userId: req.userId,
      category,
      amount: Number(amount),
      period: period || 'monthly'
    });
    
    await budget.save();
    res.status(201).json(budget);
  } catch (error) {
    res.status(500).json({ message: 'Error creating budget', error: error.message });
  }
});

// Update a budget
router.put('/:id', auth, async (req, res) => {
  try {
    const { category, amount, period } = req.body;
    
    // Find the budget to update
    const budget = await Budget.findOne({ 
      _id: req.params.id,
      userId: req.userId
    });
    
    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }
    
    // If category is changing, check for existing budget with new category
    if (category && category !== budget.category) {
      const existingBudget = await Budget.findOne({ 
        userId: req.userId,
        category
      });
      
      if (existingBudget) {
        return res.status(400).json({ message: `A budget for ${category} already exists` });
      }
      
      budget.category = category;
    }
    
    // Update other fields
    if (amount) budget.amount = Number(amount);
    if (period) budget.period = period;
    
    await budget.save();
    res.json(budget);
  } catch (error) {
    res.status(500).json({ message: 'Error updating budget', error: error.message });
  }
});

// Delete a budget
router.delete('/:id', auth, async (req, res) => {
  try {
    const budget = await Budget.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });
    
    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }
    
    res.json({ message: 'Budget deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting budget', error: error.message });
  }
});

// Export budgets to CSV
router.get('/export', auth, async (req, res) => {
  try {
    const budgets = await Budget.find({ userId: req.userId });
    let csv = 'category,amount,period\n';
    budgets.forEach(budget => {
      csv += `${budget.category},${budget.amount},${budget.period}\n`;
    });
    res.header('Content-Type', 'text/csv');
    res.attachment('budgets.csv');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ message: 'Error exporting budgets', error: error.message });
  }
});

module.exports = router; 