import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Grid,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Rating,
  Chip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import FilterListIcon from '@mui/icons-material/FilterList';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Plus, Search, Filter, Download } from 'lucide-react';
import Card from './Card';
import TableComponent from './Table';
import Input from './Input';
import Skeleton from './Skeleton';
import Modal from './Modal';

const CATEGORIES = [
  "Food & Drinks",
  "Groceries",
  "Rent / Mortgage",
  "Utilities",
  "Internet / Phone",
  "Transportation",
  "Shopping",
  "Entertainment",
  "Insurance",
  "Medical / Healthcare",
  "Income / Salary",
  "Credit Card Payment",
  "Subscriptions",
  "Travel",
  "Fitness",
  "Childcare",
  "Pets",
  "Donations / Gifts"
];

export default function Transactions() {
  const { logout } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentTransaction, setCurrentTransaction] = useState({
    amount: '',
    type: 'expense',
    category: 'Food & Drinks',
    description: '',
    date: new Date().toISOString().split('T')[0],
    accountId: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    category: '',
    type: '',
    accountId: ''
  });
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch all transactions
  const fetchTransactions = async () => {
    try {
      const response = await axios.get('/api/transactions');
      setTransactions(response.data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };
  
  // Fetch all accounts
  const fetchAccounts = async () => {
    try {
      const response = await axios.get('/api/accounts');
      setAccounts(response.data);
      
      // Set default account if none selected
      if (response.data.length > 0 && !currentTransaction.accountId) {
        setCurrentTransaction(prev => ({
          ...prev,
          accountId: response.data[0]._id
        }));
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
    }
  };

  useEffect(() => {
    fetchTransactions();
    fetchAccounts();
  }, []);

  const handleOpenDialog = (transaction = null) => {
    if (transaction) {
      const formatted = {
        ...transaction,
        date: new Date(transaction.date).toISOString().split('T')[0],
        accountId: transaction.accountId._id || transaction.accountId
      };
      setCurrentTransaction(formatted);
      setIsEditing(true);
    } else {
      setCurrentTransaction({
        amount: '',
        type: 'expense',
        category: 'Food & Drinks',
        description: '',
        date: new Date().toISOString().split('T')[0],
        accountId: accounts.length > 0 ? accounts[0]._id : ''
      });
      setIsEditing(false);
    }
    setIsAddModalOpen(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleInputChange = (e) => {
    setCurrentTransaction({
      ...currentTransaction,
      [e.target.name]: e.target.value
    });
  };

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
  };

  const handleRatingChange = (newRating) => {
    setCurrentTransaction({
      ...currentTransaction,
      rating: newRating
    });
  };

  const handleSubmit = async () => {
    try {
      if (isEditing) {
        await axios.put(`/api/transactions/${currentTransaction._id}`, currentTransaction);
      } else {
        await axios.post('/api/transactions', currentTransaction);
      }
      
      fetchTransactions();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving transaction:', error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/transactions/${id}`);
      fetchTransactions();
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  };

  const applyFilters = async () => {
    try {
      const params = {};
      if (filters.category) params.category = filters.category;
      if (filters.type) params.type = filters.type;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (filters.accountId) params.accountId = filters.accountId;
      
      const response = await axios.get('/api/transactions', { params });
      setTransactions(response.data);
    } catch (error) {
      console.error('Error applying filters:', error);
    }
  };

  const getAccountName = (accountId) => {
    const account = accounts.find(a => a._id === accountId);
    return account ? account.name : 'Unknown Account';
  };

  const clearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      category: '',
      type: '',
      accountId: ''
    });
    fetchTransactions();
  };

  // Simulate loading
  setTimeout(() => {
    setIsLoading(false);
  }, 1500);

  const tableHeaders = ['Date', 'Description', 'Category', 'Amount', 'Account', 'Actions'];
  const tableData = transactions.map(transaction => [
    new Date(transaction.date).toLocaleDateString(),
    transaction.description,
    transaction.category,
    <span className={transaction.amount >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
      {transaction.amount >= 0 ? '+' : ''}{transaction.amount.toFixed(2)}
    </span>,
    transaction.accountId?.name || getAccountName(transaction.accountId),
    <div className="flex space-x-2">
      <button
        className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        onClick={() => handleOpenDialog(transaction)}
      >
        Edit
      </button>
      <button
        className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
        onClick={() => handleDelete(transaction._id)}
      >
        Delete
      </button>
    </div>
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Transactions</h1>
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => {
              setCurrentTransaction({
                amount: '',
                type: 'expense',
                category: 'Food & Drinks',
                description: '',
                date: new Date().toISOString().split('T')[0],
                accountId: accounts.length > 0 ? accounts[0]._id : ''
              });
              setIsEditing(false);
              setIsAddModalOpen(true);
            }}
          >
            Add Transaction
          </Button>
        </div>
      </div>

      <Card>
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Input
              placeholder="Search transactions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={Search}
            />
          </div>
          <Button
            variant="secondary"
            icon={Filter}
          >
            Filters
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton variant="text" count={5} />
          </div>
        ) : (
          <TableComponent
            headers={tableHeaders}
            data={tableData}
            emptyMessage="No transactions found"
          />
        )}
      </Card>

      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Transaction"
      >
        <form className="space-y-4" onSubmit={e => { e.preventDefault(); handleSubmit(); }}>
          <Input
            label="Description"
            name="description"
            placeholder="Enter transaction description"
            value={currentTransaction.description}
            onChange={handleInputChange}
          />
          <Input
            label="Amount"
            name="amount"
            type="number"
            placeholder="0.00"
            value={currentTransaction.amount}
            onChange={handleInputChange}
          />
          <Input
            label="Date"
            name="date"
            type="date"
            value={currentTransaction.date}
            onChange={handleInputChange}
          />
          <FormControl fullWidth>
            <InputLabel sx={{
              '&.Mui-focused': {
                color: '#16a34a',
              },
            }}>Category</InputLabel>
            <Select
              name="category"
              value={currentTransaction.category}
              onChange={handleInputChange}
              label="Category"
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&.Mui-focused fieldset': {
                    borderColor: '#16a34a',
                  },
                },
              }}
            >
              {CATEGORIES.map((category) => (
                <MenuItem key={category} value={category}>{category}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel sx={{
              '&.Mui-focused': {
                color: '#16a34a',
              },
            }}>Account</InputLabel>
            <Select
              name="accountId"
              value={currentTransaction.accountId}
              onChange={handleInputChange}
              label="Account"
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&.Mui-focused fieldset': {
                    borderColor: '#16a34a',
                  },
                },
              }}
            >
              {accounts.map((account) => (
                <MenuItem key={account._id} value={account._id}>{account.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
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
              Add Transaction
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
} 