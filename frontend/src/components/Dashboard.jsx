import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Button,
  TextField,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  InputAdornment,
  Select,
  FormControl,
  InputLabel
} from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar } from 'recharts';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

// Enhanced colors to match screenshot
const COLORS = ['#20B2AA', '#4682B4', '#FFD700', '#77DD77'];
const CATEGORIES = ['Food & Drinks', 'Transportation', 'Shopping', 'Entertainment'];

export default function Dashboard() {
  const { logout } = useAuth();
  const [summary, setSummary] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    balance: 0,
    categoryBreakdown: {}
  });
  const [transactions, setTransactions] = useState([]);
  const [balanceHistory, setBalanceHistory] = useState([]);
  const [recentSpending, setRecentSpending] = useState([]);
  const [newTransaction, setNewTransaction] = useState({
    amount: '',
    type: 'expense',
    category: 'Food & Drinks',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    category: '',
    type: ''
  });

  const fetchSummary = async () => {
    try {
      const response = await axios.get('/api/transactions/summary');
      setSummary(response.data);
    } catch (error) {
      console.error('Error fetching summary:', error);
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await axios.get('/api/transactions');
      setTransactions(response.data);
      
      // Process data for balance history chart (last 30 days)
      processBalanceHistory(response.data);
      
      // Process data for recent spending chart (last 7 days)
      processRecentSpending(response.data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };
  
  const processBalanceHistory = (transactions) => {
    // Create a date 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Generate dates for the last 30 days
    const dates = Array.from({ length: 31 }, (_, i) => {
      const date = new Date(thirtyDaysAgo);
      date.setDate(date.getDate() + i);
      return date.toISOString().split('T')[0];
    });
    
    // Calculate running balance for each day
    let runningBalance = 0;
    const balanceData = dates.map(date => {
      // Find transactions for this date or before
      const relevantTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.date).toISOString().split('T')[0];
        return transactionDate <= date;
      });
      
      // Calculate balance based on all transactions up to this date
      runningBalance = relevantTransactions.reduce((balance, t) => {
        if (t.type === 'income') {
          return balance + Number(t.amount);
        } else {
          return balance - Number(t.amount);
        }
      }, 0);
      
      return {
        date: date,
        balance: runningBalance
      };
    });
    
    setBalanceHistory(balanceData);
  };
  
  const processRecentSpending = (transactions) => {
    // Create a date 7 days ago
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    
    // Generate dates for the last 7 days
    const dates = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(sevenDaysAgo);
      date.setDate(date.getDate() + i);
      return date.toISOString().split('T')[0];
    });
    
    // Calculate spending for each day
    const spendingData = dates.map(date => {
      // Find expense transactions for this date
      const dayTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.date).toISOString().split('T')[0];
        return transactionDate === date && t.type === 'expense';
      });
      
      // Sum expenses for this day
      const totalSpending = dayTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
      
      return {
        date: new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        amount: totalSpending
      };
    });
    
    setRecentSpending(spendingData);
  };

  useEffect(() => {
    fetchSummary();
    fetchTransactions();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/transactions', newTransaction);
      setNewTransaction({
        amount: '',
        type: 'expense',
        category: 'Food & Drinks',
        description: '',
        date: new Date().toISOString().split('T')[0]
      });
      fetchSummary();
      fetchTransactions();
    } catch (error) {
      console.error('Error adding transaction:', error);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
  };

  const applyFilters = async () => {
    try {
      const params = {};
      if (filters.category) params.category = filters.category;
      if (filters.type) params.type = filters.type;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      
      const response = await axios.get('/api/transactions', { params });
      setTransactions(response.data);
    } catch (error) {
      console.error('Error applying filters:', error);
    }
  };

  const pieData = Object.entries(summary.categoryBreakdown || {}).map(([name, value]) => ({
    name,
    value
  }));

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="flex-end" mb={2}>
        <Button onClick={logout} variant="contained" color="secondary">
          Logout
        </Button>
      </Box>
      
      <Grid container spacing={3}>
        {/* Summary Cards */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: 'white', borderRadius: 2 }}>
            <Typography variant="h6" sx={{ mb: 1, fontWeight: 'medium' }}>Total Income</Typography>
            <Typography variant="h3" sx={{ fontWeight: 'bold' }}>${summary.totalIncome?.toLocaleString() || '0'}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: 'white', borderRadius: 2 }}>
            <Typography variant="h6" sx={{ mb: 1, fontWeight: 'medium' }}>Total Expenses</Typography>
            <Typography variant="h3" sx={{ fontWeight: 'bold' }}>${summary.totalExpenses?.toLocaleString() || '0'}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: 'white', borderRadius: 2 }}>
            <Typography variant="h6" sx={{ mb: 1, fontWeight: 'medium' }}>Balance</Typography>
            <Typography variant="h3" sx={{ fontWeight: 'bold', color: (summary.balance || 0) >= 0 ? '#2E7D32' : '#d32f2f' }}>
              ${Math.abs(summary.balance || 0).toLocaleString()}
            </Typography>
          </Paper>
        </Grid>
        
        {/* Line Chart - Balance History */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, backgroundColor: 'white', borderRadius: 2 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>Balance History (Last 30 Days)</Typography>
            <Box sx={{ height: 300, position: 'relative' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={balanceHistory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(date) => {
                      const d = new Date(date);
                      return `${d.getMonth()+1}/${d.getDate()}`;
                    }}
                    interval={4}
                  />
                  <YAxis 
                    tickFormatter={(value) => `$${value}`}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    formatter={(value) => [`$${value.toFixed(2)}`, 'Balance']}
                    labelFormatter={(label) => new Date(label).toLocaleDateString()}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="balance" 
                    stroke="#20B2AA" 
                    strokeWidth={2}
                    dot={{ r: 2 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Pie Chart and Bar Chart in one row */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, backgroundColor: 'white', borderRadius: 2 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>Spending by Category</Typography>
            <Box sx={{ height: 320, position: 'relative' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    labelLine={false}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend 
                    layout="vertical"
                    verticalAlign="bottom"
                    wrapperStyle={{
                      paddingTop: '20px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      width: '100%'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
        
        {/* Bar Chart - Recent Daily Spending */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, backgroundColor: 'white', borderRadius: 2 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>Recent Daily Spending (Last 7 Days)</Typography>
            <Box sx={{ height: 320, position: 'relative' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={recentSpending}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis tickFormatter={(value) => `$${value}`} />
                  <Tooltip formatter={(value) => [`$${value.toFixed(2)}`, 'Spending']} />
                  <Bar dataKey="amount" fill="#4682B4" barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Transaction History */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, backgroundColor: 'white', borderRadius: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Transaction History
              </Typography>
              <Button 
                endIcon={<ExpandMoreIcon />} 
                onClick={() => setShowFilters(!showFilters)}
                sx={{ color: '#555' }}
              >
                Filtering Options
              </Button>
            </Box>
            
            {showFilters && (
              <Box sx={{ mb: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      label="Start Date"
                      type="date"
                      name="startDate"
                      value={filters.startDate}
                      onChange={handleFilterChange}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      label="End Date"
                      type="date"
                      name="endDate"
                      value={filters.endDate}
                      onChange={handleFilterChange}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <FormControl fullWidth>
                      <InputLabel>Category</InputLabel>
                      <Select
                        label="Category"
                        name="category"
                        value={filters.category}
                        onChange={handleFilterChange}
                      >
                        <MenuItem value="">All</MenuItem>
                        {CATEGORIES.map((category) => (
                          <MenuItem key={category} value={category}>
                            {category}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <FormControl fullWidth>
                      <InputLabel>Type</InputLabel>
                      <Select
                        label="Type"
                        name="type"
                        value={filters.type}
                        onChange={handleFilterChange}
                      >
                        <MenuItem value="">All</MenuItem>
                        <MenuItem value="income">Income</MenuItem>
                        <MenuItem value="expense">Expense</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <Button 
                      variant="contained" 
                      fullWidth 
                      sx={{ height: '100%' }}
                      onClick={applyFilters}
                    >
                      Apply Filters
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            )}
            
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell align="center">Rating</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {transactions.length > 0 ? (
                    transactions.map((transaction) => (
                      <TableRow key={transaction._id}>
                        <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
                        <TableCell>{transaction.description}</TableCell>
                        <TableCell>{transaction.category}</TableCell>
                        <TableCell align="right" sx={{ color: transaction.type === 'income' ? '#2E7D32' : '#d32f2f' }}>
                          ${Number(transaction.amount).toFixed(2)}
                        </TableCell>
                        <TableCell align="center">{transaction.rating}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} align="center">No transactions found</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
} 