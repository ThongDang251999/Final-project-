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
  'https://final-project-j6z0.onrender.com'
];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
// Add this line to handle preflight OPTIONS requests for all routes
app.options('*', cors());
app.use(express.json());
app.use(fileUpload({
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max file size
  createParentPath: true
}));

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || process.env.DB; // Support both MONGODB_URI and DB for backward compatibility
console.log('Environment variables loaded:', {
  nodeEnv: process.env.NODE_ENV,
  port: process.env.PORT,
  mongodbUri: MONGODB_URI ? '(set)' : '(not set)',
  jwtSecret: process.env.JWT_SECRET ? '(set)' : '(not set)'
});

if (!MONGODB_URI) {
  console.error('MongoDB URI is not defined in environment variables!');
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
// (Removed because frontend is deployed separately on Render)

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
}); 