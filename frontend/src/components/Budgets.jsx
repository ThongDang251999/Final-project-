import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Button,
  TextField,
  LinearProgress,
  Select,
  MenuItem,
  FormControl,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  IconButton
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = ['Food & Drinks', 'Transportation', 'Shopping', 'Entertainment'];

export default function Budgets() {
  const { logout } = useAuth();
  const [budgets, setBudgets] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentBudget, setCurrentBudget] = useState({
    category: '',
    amount: '',
    period: 'monthly'
  });
  const [isEditing, setIsEditing] = useState(false);
  const [expenses, setExpenses] = useState({});
  const [error, setError] = useState(null);
  
  // Fetch all budgets
  const fetchBudgets = async () => {
    try {
      const response = await axios.get('/api/budgets');
      setBudgets(response.data);
      
      // Fetch expenses for the current month to calculate usage
      fetchMonthlyExpenses();
    } catch (error) {
      console.error('Error fetching budgets:', error);
    }
  };
  
  // Fetch monthly expenses by category
  const fetchMonthlyExpenses = async () => {
    try {
      // Get first and last day of current month
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();
      
      const response = await axios.get(`/api/transactions`, {
        params: {
          startDate: firstDay,
          endDate: lastDay,
          type: 'expense'
        }
      });
      
      // Group expenses by category
      const expensesByCategory = {};
      response.data.forEach(transaction => {
        const category = transaction.category;
        expensesByCategory[category] = (expensesByCategory[category] || 0) + Number(transaction.amount);
      });
      
      setExpenses(expensesByCategory);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, []);

  const handleOpenDialog = (budget = null) => {
    if (budget) {
      setCurrentBudget(budget);
      setIsEditing(true);
    } else {
      setCurrentBudget({
        category: '',
        amount: '',
        period: 'monthly'
      });
      setIsEditing(false);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setError(null);
  };

  const handleInputChange = (e) => {
    setCurrentBudget({
      ...currentBudget,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async () => {
    try {
      if (!currentBudget.category || !currentBudget.amount) {
        setError('Please fill in all fields');
        return;
      }
      
      if (isEditing) {
        await axios.put(`/api/budgets/${currentBudget._id}`, currentBudget);
      } else {
        await axios.post('/api/budgets', currentBudget);
      }
      
      fetchBudgets();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving budget:', error);
      setError(error.response?.data?.message || 'Error saving budget');
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/budgets/${id}`);
      fetchBudgets();
    } catch (error) {
      console.error('Error deleting budget:', error);
    }
  };

  // Calculate budget usage percentage
  const calculateUsage = (budget) => {
    const spent = expenses[budget.category] || 0;
    const percentage = (spent / budget.amount) * 100;
    return Math.min(percentage, 100); // Cap at 100% for display purposes
  };

  // Determine color based on usage percentage
  const getColorByUsage = (percentage) => {
    if (percentage < 70) return 'success';
    if (percentage < 90) return 'warning';
    return 'error';
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          Budget Management
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
          Add Budget
        </Button>
      </Box>
      
      <Grid container spacing={3}>
        {budgets.length > 0 ? (
          budgets.map((budget) => {
            const usagePercentage = calculateUsage(budget);
            const color = getColorByUsage(usagePercentage);
            const spent = expenses[budget.category] || 0;
            
            return (
              <Grid item xs={12} md={6} key={budget._id}>
                <Paper sx={{ p: 3, backgroundColor: 'white', borderRadius: 2 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="h6" sx={{ fontWeight: 'medium' }}>
                      {budget.category}
                    </Typography>
                    <Box>
                      <IconButton size="small" onClick={() => handleOpenDialog(budget)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDelete(budget._id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" mb={1}>
                    Budget: ${budget.amount} ({budget.period})
                  </Typography>
                  
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2">
                      Spent: ${spent.toFixed(2)}
                    </Typography>
                    <Typography variant="body2" sx={{ color: usagePercentage > 100 ? 'error.main' : 'inherit' }}>
                      {usagePercentage.toFixed(0)}% used
                    </Typography>
                  </Box>
                  
                  <LinearProgress 
                    variant="determinate" 
                    value={usagePercentage} 
                    color={color}
                    sx={{ height: 10, borderRadius: 5 }}
                  />
                  
                  {usagePercentage > 100 && (
                    <Typography variant="body2" color="error.main" sx={{ mt: 1 }}>
                      Budget exceeded by ${(spent - budget.amount).toFixed(2)}
                    </Typography>
                  )}
                </Paper>
              </Grid>
            );
          })
        ) : (
          <Grid item xs={12}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body1">
                No budgets set up yet. Add your first budget to start tracking your spending!
              </Typography>
            </Paper>
          </Grid>
        )}
      </Grid>
      
      {/* Add/Edit Budget Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>{isEditing ? 'Edit Budget' : 'Add New Budget'}</DialogTitle>
        <DialogContent sx={{ minWidth: 400 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <FormControl fullWidth sx={{ mt: 2, mb: 2 }}>
            <Select
              value={currentBudget.category}
              name="category"
              onChange={handleInputChange}
              displayEmpty
              renderValue={selected => selected || "Select Category"}
            >
              {CATEGORIES.map(category => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <TextField
            fullWidth
            label="Budget Amount"
            type="number"
            name="amount"
            value={currentBudget.amount}
            onChange={handleInputChange}
            sx={{ mb: 2 }}
          />
          
          <FormControl fullWidth sx={{ mb: 2 }}>
            <Select
              value={currentBudget.period}
              name="period"
              onChange={handleInputChange}
            >
              <MenuItem value="weekly">Weekly</MenuItem>
              <MenuItem value="monthly">Monthly</MenuItem>
              <MenuItem value="yearly">Yearly</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {isEditing ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
} 