const express = require('express');
const router = express.Router();
const Preference = require('../models/Preference');
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

// Get user preferences
router.get('/', auth, async (req, res) => {
  try {
    // Find existing preference or create default
    let preference = await Preference.findOne({ userId: req.userId });
    
    if (!preference) {
      // Create default preferences
      preference = new Preference({ userId: req.userId });
      await preference.save();
    }
    
    res.json(preference);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching preferences', error: error.message });
  }
});

// Update user preferences
router.put('/', auth, async (req, res) => {
  try {
    const { currency, theme, language, dateFormat, defaultView } = req.body;
    
    // Find existing preference or create default
    let preference = await Preference.findOne({ userId: req.userId });
    
    if (!preference) {
      preference = new Preference({ 
        userId: req.userId,
        currency,
        theme,
        language,
        dateFormat,
        defaultView
      });
    } else {
      // Update fields
      if (currency) preference.currency = currency;
      if (theme) preference.theme = theme;
      if (language) preference.language = language;
      if (dateFormat) preference.dateFormat = dateFormat;
      if (defaultView) preference.defaultView = defaultView;
    }
    
    await preference.save();
    res.json(preference);
  } catch (error) {
    res.status(500).json({ message: 'Error updating preferences', error: error.message });
  }
});

module.exports = router; 