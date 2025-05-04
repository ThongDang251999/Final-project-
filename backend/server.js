const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fileUpload = require('express-fileupload');

// Load environment variables from .env file in the current directory
dotenv.config();

const app = express();

// Middleware
const allowedOrigins = [
  'http://localhost:3000',
  'https://final-project-1-22hm.onrender.com'
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true // only needed if you use cookies/sessions
}));
app.use(express.json());
app.use(fileUpload({
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max file size
  createParentPath: true
}));

// MongoDB Connection
const MONGODB_URI = process.env.DB; // Using DB as in your .env file
console.log('Environment variables loaded:', {
  db: process.env.DB,
  port: process.env.PORT,
  jwtSecret: process.env.JWT_SECRET ? '(set)' : '(not set)'
});

if (!MONGODB_URI) {
  console.error('MongoDB URI (DB) is not defined in environment variables!');
  process.exit(1);
}

mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/budgets', require('./routes/budgets'));
app.use('/api/accounts', require('./routes/accounts'));
app.use('/api/scheduled-transactions', require('./routes/scheduledTransactions'));
app.use('/api/preferences', require('./routes/preferences'));

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  // Set static folder
  app.use(express.static(path.join(__dirname, '../frontend/dist')));

  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../frontend/dist', 'index.html'));
  });
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 