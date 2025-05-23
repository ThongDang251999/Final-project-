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
import { motion } from 'framer-motion';
import { Plus, Settings, TrendingUp } from 'lucide-react';
import Card from './Card';
import ProgressBar from './ProgressBar';
import Modal from './Modal';
import Input from './Input';
import Skeleton from './Skeleton';

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
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
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

  // Simulate loading
  setTimeout(() => {
    setIsLoading(false);
  }, 1500);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Budgets</h1>
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => setIsAddModalOpen(true)}
          >
            Add Budget
          </Button>
          <Button
            variant="secondary"
            icon={Settings}
          >
            Budget Settings
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          [...Array(6)].map((_, index) => (
            <Card key={index}>
              <Skeleton variant="text" count={3} />
            </Card>
          ))
        ) : (
          budgets.map((budget) => {
            // Defensive: handle missing/undefined/null values
            const spent = typeof budget.spent === 'number' && !isNaN(budget.spent) ? budget.spent : 0;
            const amount = typeof budget.amount === 'number' && !isNaN(budget.amount) ? budget.amount : Number(budget.amount) || 0;
            const percent = amount > 0 ? Math.min((spent / amount) * 100, 100) : 0;
            const remaining = amount - spent;
            let barColor = 'bg-green-500';
            if (percent >= 90) barColor = 'bg-red-500';
            else if (percent >= 70) barColor = 'bg-yellow-400';
            return (
              <Card key={budget._id}>
                <div className="relative bg-white rounded-xl shadow p-5 flex flex-col gap-2">
                  <button
                    className="absolute top-3 right-3 text-red-400 hover:text-red-600 transition"
                    onClick={() => handleDelete(budget._id)}
                    title="Delete budget"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {budget.category || 'No data'}
                    </h3>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {budget.period || 'No data'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600 dark:text-gray-400">
                      ${!isNaN(spent) ? spent : 0} of ${!isNaN(amount) ? amount : 0} spent
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">
                      {amount > 0 ? percent.toFixed(1) : 0}%
                    </span>
                  </div>
                  <div className="w-full h-2 rounded bg-gray-200 overflow-hidden mb-1">
                    <div className={`h-2 rounded transition-all duration-300 ${barColor}`} style={{ width: `${percent}%` }} />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      {amount > 0 ? percent.toFixed(1) : 0}% spent
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">
                      ${!isNaN(remaining) && remaining >= 0 ? remaining : 0} remaining
                    </span>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Budget Overview
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Track your spending across all categories
            </p>
          </div>
          <Button
            variant="secondary"
            icon={TrendingUp}
          >
            View Details
          </Button>
        </div>
      </Card>

      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Budget"
      >
        <form
          className="space-y-4"
          onSubmit={e => {
            e.preventDefault();
            handleSubmit();
          }}
        >
          <Input
            label="Category"
            name="category"
            placeholder="Select category"
            value={currentBudget.category}
            onChange={handleInputChange}
          />
          <Input
            label="Amount"
            name="amount"
            type="number"
            placeholder="0.00"
            value={currentBudget.amount}
            onChange={handleInputChange}
          />
          <div className="flex justify-end space-x-3 mt-6">
            <Button
              variant="secondary"
              onClick={() => setIsAddModalOpen(false)}
              type="button"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
            >
              Add Budget
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
} 