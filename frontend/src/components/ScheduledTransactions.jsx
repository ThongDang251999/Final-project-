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
  Chip,
  FormControlLabel,
  Switch,
  Tabs,
  Tab
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import EventRepeatIcon from '@mui/icons-material/EventRepeat';
import EventIcon from '@mui/icons-material/Event';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { usePreference } from '../context/PreferenceContext';

const CATEGORIES = ['Food & Drinks', 'Transportation', 'Shopping', 'Entertainment'];
const RECURRENCE_TYPES = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' }
];

export default function ScheduledTransactions() {
  const { logout } = useAuth();
  const { preference } = usePreference();
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentTransaction, setCurrentTransaction] = useState({
    amount: '',
    type: 'expense',
    category: 'Food & Drinks',
    description: '',
    scheduledDate: new Date().toISOString().split('T')[0],
    isRecurring: false,
    recurrenceType: 'monthly',
    recurrenceEnd: '',
    accountId: ''
  });
  const [activeTab, setActiveTab] = useState('pending');
  const [isEditing, setIsEditing] = useState(false);

  // Fetch all scheduled transactions
  const fetchTransactions = async () => {
    try {
      const response = await axios.get('/api/scheduled-transactions', {
        params: { status: activeTab }
      });
      setTransactions(response.data);
    } catch (error) {
      console.error('Error fetching scheduled transactions:', error);
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
  }, [activeTab]);

  const handleOpenDialog = (transaction = null) => {
    if (transaction) {
      const formatted = {
        ...transaction,
        scheduledDate: new Date(transaction.scheduledDate).toISOString().split('T')[0],
        recurrenceEnd: transaction.recurrenceEnd ? new Date(transaction.recurrenceEnd).toISOString().split('T')[0] : '',
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
        scheduledDate: new Date().toISOString().split('T')[0],
        isRecurring: false,
        recurrenceType: 'monthly',
        recurrenceEnd: '',
        accountId: accounts.length > 0 ? accounts[0]._id : ''
      });
      setIsEditing(false);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleInputChange = (e) => {
    const { name, value, checked } = e.target;
    if (name === 'isRecurring') {
      setCurrentTransaction({
        ...currentTransaction,
        isRecurring: checked
      });
    } else {
      setCurrentTransaction({
        ...currentTransaction,
        [name]: value
      });
    }
  };

  const handleSubmit = async () => {
    try {
      if (isEditing) {
        await axios.put(`/api/scheduled-transactions/${currentTransaction._id}`, currentTransaction);
      } else {
        await axios.post('/api/scheduled-transactions', currentTransaction);
      }
      
      fetchTransactions();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving scheduled transaction:', error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/scheduled-transactions/${id}`);
      fetchTransactions();
    } catch (error) {
      console.error('Error deleting scheduled transaction:', error);
    }
  };

  const handleProcessTransaction = async (id) => {
    try {
      await axios.post(`/api/scheduled-transactions/${id}/process`);
      fetchTransactions();
    } catch (error) {
      console.error('Error processing transaction:', error);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const formatAmount = (amount, type) => {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: preference.currency || 'USD',
    });
    return `${type === 'income' ? '+' : '-'}${formatter.format(amount)}`;
  };

  const getAccountName = (accountId) => {
    const account = accounts.find(a => a._id === accountId);
    return account ? account.name : 'Unknown Account';
  };

  const getDaysUntil = (date) => {
    const now = new Date();
    const scheduledDate = new Date(date);
    const timeDiff = scheduledDate.getTime() - now.getTime();
    const dayDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    return dayDiff;
  };

  const getRecurrenceText = (transaction) => {
    if (!transaction.isRecurring) return 'One-time';
    
    let text = `${transaction.recurrenceType.charAt(0).toUpperCase() + transaction.recurrenceType.slice(1)}`;
    if (transaction.recurrenceEnd) {
      text += ` until ${new Date(transaction.recurrenceEnd).toLocaleDateString()}`;
    }
    return text;
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          Scheduled Transactions
        </Typography>
        <Button variant="contained" color="success" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
          Schedule Transaction
        </Button>
      </Box>
      
      <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab 
          value="pending" 
          label="Pending" 
          icon={<EventIcon />} 
          iconPosition="start"
        />
        <Tab 
          value="processed" 
          label="Processed" 
          icon={<PlayArrowIcon />} 
          iconPosition="start"
        />
        <Tab 
          value="cancelled" 
          label="Cancelled" 
          icon={<DeleteIcon />} 
          iconPosition="start"
        />
      </Tabs>
      
      <Paper sx={{ p: 3, backgroundColor: 'white', borderRadius: 2 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Account</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Recurrence</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {transactions.length > 0 ? (
                transactions.map((transaction) => (
                  <TableRow key={transaction._id}>
                    <TableCell>
                      {new Date(transaction.scheduledDate).toLocaleDateString()}
                      {activeTab === 'pending' && getDaysUntil(transaction.scheduledDate) <= 3 && (
                        <Typography variant="caption" sx={{ 
                          display: 'block',
                          color: getDaysUntil(transaction.scheduledDate) <= 0 ? 'error.main' : 'warning.main',
                          fontWeight: 'bold'
                        }}>
                          {getDaysUntil(transaction.scheduledDate) <= 0 
                            ? 'Today!' 
                            : `In ${getDaysUntil(transaction.scheduledDate)} days`}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {transaction.accountId?.name || getAccountName(transaction.accountId)}
                    </TableCell>
                    <TableCell>{transaction.description}</TableCell>
                    <TableCell>
                      <Chip label={transaction.category} size="small" />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        icon={transaction.isRecurring ? <EventRepeatIcon /> : <EventIcon />}
                        label={getRecurrenceText(transaction)}
                        size="small"
                        color={transaction.isRecurring ? 'primary' : 'default'}
                        variant={transaction.isRecurring ? 'filled' : 'outlined'}
                      />
                    </TableCell>
                    <TableCell align="right" sx={{ color: transaction.type === 'income' ? '#2E7D32' : '#d32f2f' }}>
                      {formatAmount(transaction.amount, transaction.type)}
                    </TableCell>
                    <TableCell>
                      {activeTab === 'pending' && (
                        <>
                          <IconButton size="small" onClick={() => handleProcessTransaction(transaction._id)}>
                            <PlayArrowIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" onClick={() => handleOpenDialog(transaction)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </>
                      )}
                      <IconButton size="small" onClick={() => handleDelete(transaction._id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    No {activeTab} scheduled transactions found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
      
      {/* Add/Edit Scheduled Transaction Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{isEditing ? 'Edit Scheduled Transaction' : 'Schedule New Transaction'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Amount"
                type="number"
                name="amount"
                value={currentTransaction.amount}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  name="type"
                  value={currentTransaction.type}
                  onChange={handleInputChange}
                  label="Type"
                >
                  <MenuItem value="income">Income</MenuItem>
                  <MenuItem value="expense">Expense</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Account</InputLabel>
                <Select
                  name="accountId"
                  value={currentTransaction.accountId}
                  onChange={handleInputChange}
                  label="Account"
                  required
                >
                  {accounts.map((account) => (
                    <MenuItem key={account._id} value={account._id}>{account.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  name="category"
                  value={currentTransaction.category}
                  onChange={handleInputChange}
                  label="Category"
                >
                  {CATEGORIES.map((category) => (
                    <MenuItem key={category} value={category}>{category}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                name="description"
                value={currentTransaction.description}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Scheduled Date"
                type="date"
                name="scheduledDate"
                value={currentTransaction.scheduledDate}
                onChange={handleInputChange}
                InputLabelProps={{ shrink: true }}
                required
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&.Mui-focused fieldset': {
                      borderColor: '#16a34a',
                    },
                  },
                  '& label.Mui-focused': {
                    color: '#16a34a',
                  },
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={currentTransaction.isRecurring}
                    onChange={handleInputChange}
                    name="isRecurring"
                  />
                }
                label="Recurring Transaction"
              />
            </Grid>
            
            {currentTransaction.isRecurring && (
              <>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Recurrence</InputLabel>
                    <Select
                      name="recurrenceType"
                      value={currentTransaction.recurrenceType}
                      onChange={handleInputChange}
                      label="Recurrence"
                    >
                      {RECURRENCE_TYPES.map((type) => (
                        <MenuItem key={type.value} value={type.value}>{type.label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="End Date (Optional)"
                    type="date"
                    name="recurrenceEnd"
                    value={currentTransaction.recurrenceEnd}
                    onChange={handleInputChange}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleSubmit}
            variant="contained"
            disabled={!currentTransaction.amount || !currentTransaction.description || !currentTransaction.scheduledDate || !currentTransaction.accountId}
          >
            {isEditing ? 'Update' : 'Schedule'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
} 