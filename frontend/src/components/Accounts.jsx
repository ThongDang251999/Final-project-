import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Grid,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Box,
  Card,
  CardContent,
  CardActions,
  Divider,
  Alert,
  Chip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import PaymentsIcon from '@mui/icons-material/Payments';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { usePreference } from '../context/PreferenceContext';

const ACCOUNT_TYPES = [
  { value: 'wallet', label: 'Wallet', icon: <AccountBalanceWalletIcon /> },
  { value: 'bank', label: 'Bank Account', icon: <AccountBalanceIcon /> },
  { value: 'credit', label: 'Credit Card', icon: <CreditCardIcon /> }
];

const CURRENCIES = [
  { value: 'USD', label: 'US Dollar ($)' },
  { value: 'EUR', label: 'Euro (€)' },
  { value: 'GBP', label: 'British Pound (£)' },
  { value: 'JPY', label: 'Japanese Yen (¥)' }
];

export default function Accounts() {
  const { logout } = useAuth();
  const { preference } = usePreference();
  const [accounts, setAccounts] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentAccount, setCurrentAccount] = useState({
    name: '',
    type: 'bank',
    balance: '',
    creditLimit: '',
    paymentDueDate: '',
    currency: preference.currency || 'USD'
  });
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState({
    totalBalance: 0,
    totalCreditUsed: 0,
    totalCreditLimit: 0
  });

  // Fetch all accounts
  const fetchAccounts = async () => {
    try {
      const response = await axios.get('/api/accounts');
      setAccounts(response.data);
      
      // Calculate summary
      const totalBalance = response.data.reduce((sum, account) => {
        if (account.type !== 'credit') {
          return sum + account.balance;
        }
        return sum;
      }, 0);
      
      const creditAccounts = response.data.filter(a => a.type === 'credit');
      const totalCreditUsed = creditAccounts.reduce((sum, account) => sum + account.balance, 0);
      const totalCreditLimit = creditAccounts.reduce((sum, account) => sum + account.creditLimit, 0);
      
      setSummary({
        totalBalance,
        totalCreditUsed,
        totalCreditLimit
      });
    } catch (error) {
      console.error('Error fetching accounts:', error);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleOpenDialog = (account = null) => {
    setError(null);
    
    if (account) {
      const formatted = {
        ...account,
        paymentDueDate: account.paymentDueDate ? new Date(account.paymentDueDate).toISOString().split('T')[0] : ''
      };
      setCurrentAccount(formatted);
      setIsEditing(true);
    } else {
      setCurrentAccount({
        name: '',
        type: 'bank',
        balance: '',
        creditLimit: '',
        paymentDueDate: '',
        currency: preference.currency || 'USD'
      });
      setIsEditing(false);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleInputChange = (e) => {
    setCurrentAccount({
      ...currentAccount,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async () => {
    try {
      if (!currentAccount.name) {
        setError('Account name is required');
        return;
      }
      
      if (currentAccount.type === 'credit') {
        if (!currentAccount.creditLimit) {
          setError('Credit limit is required for credit cards');
          return;
        }
        if (!currentAccount.paymentDueDate) {
          setError('Payment due date is required for credit cards');
          return;
        }
      }
      
      if (isEditing) {
        await axios.put(`/api/accounts/${currentAccount._id}`, currentAccount);
      } else {
        await axios.post('/api/accounts', currentAccount);
      }
      
      fetchAccounts();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving account:', error);
      setError(error.response?.data?.message || 'Error saving account');
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/accounts/${id}`);
      fetchAccounts();
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Cannot delete this account. It might have associated transactions.');
    }
  };

  const getAccountTypeIcon = (type) => {
    const accountType = ACCOUNT_TYPES.find(t => t.value === type);
    return accountType ? accountType.icon : <AccountBalanceIcon />;
  };

  const formatCurrency = (amount, currency) => {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    });
    return formatter.format(amount);
  };

  const getCreditUsagePercentage = (balance, limit) => {
    return limit > 0 ? (balance / limit) * 100 : 0;
  };

  const getCreditUsageColor = (percentage) => {
    if (percentage < 50) return 'success';
    if (percentage < 75) return 'warning';
    return 'error';
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          Accounts
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
          Add Account
        </Button>
      </Box>
      
      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, backgroundColor: 'white', borderRadius: 2 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>Total Balance</Typography>
            <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#2E7D32' }}>
              {formatCurrency(summary.totalBalance, preference.currency)}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Across all bank accounts and wallet
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, backgroundColor: 'white', borderRadius: 2 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>Credit Usage</Typography>
            <Typography variant="h3" sx={{ fontWeight: 'bold', color: summary.totalCreditLimit > 0 && (summary.totalCreditUsed / summary.totalCreditLimit) > 0.75 ? '#d32f2f' : '#2E7D32' }}>
              {summary.totalCreditLimit > 0 
                ? `${((summary.totalCreditUsed / summary.totalCreditLimit) * 100).toFixed(1)}%`
                : '0%'
              }
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {formatCurrency(summary.totalCreditUsed, preference.currency)} of {formatCurrency(summary.totalCreditLimit, preference.currency)} used
            </Typography>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Account Cards */}
      <Grid container spacing={3}>
        {accounts.length > 0 ? (
          accounts.map((account) => (
            <Grid item xs={12} sm={6} md={4} key={account._id}>
              <Card sx={{ 
                borderRadius: 2,
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                      {React.cloneElement(getAccountTypeIcon(account.type), { sx: { mr: 1 } })}
                      {account.name}
                    </Typography>
                    <Chip 
                      label={account.type.charAt(0).toUpperCase() + account.type.slice(1)}
                      size="small"
                      color={account.type === 'credit' ? 'error' : account.type === 'bank' ? 'primary' : 'default'}
                    />
                  </Box>
                  
                  <Typography variant="h5" sx={{ fontWeight: 'bold', color: account.type === 'credit' ? '#d32f2f' : '#2E7D32' }}>
                    {formatCurrency(account.balance, account.currency)}
                  </Typography>
                  
                  {account.type === 'credit' && (
                    <>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Credit Limit:</span> 
                        <span>{formatCurrency(account.creditLimit, account.currency)}</span>
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Available Credit:</span>
                        <span>{formatCurrency(account.creditLimit - account.balance, account.currency)}</span>
                      </Typography>
                      <Typography variant="body2" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Payment Due:</span>
                        <span>{new Date(account.paymentDueDate).toLocaleDateString()}</span>
                      </Typography>
                      <Typography variant="body2" sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                        <span>Usage:</span>
                        <span 
                          style={{ 
                            color: getCreditUsageColor(getCreditUsagePercentage(account.balance, account.creditLimit)) === 'error' 
                              ? '#d32f2f' 
                              : getCreditUsageColor(getCreditUsagePercentage(account.balance, account.creditLimit)) === 'warning'
                                ? '#ff9800'
                                : '#2E7D32'
                          }}
                        >
                          {getCreditUsagePercentage(account.balance, account.creditLimit).toFixed(1)}%
                        </span>
                      </Typography>
                    </>
                  )}
                </CardContent>
                <CardActions>
                  <Button size="small" startIcon={<EditIcon />} onClick={() => handleOpenDialog(account)}>
                    Edit
                  </Button>
                  <Button size="small" startIcon={<DeleteIcon />} onClick={() => handleDelete(account._id)}>
                    Delete
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))
        ) : (
          <Grid item xs={12}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body1">
                No accounts set up yet. Add your first account to get started!
              </Typography>
            </Paper>
          </Grid>
        )}
      </Grid>
      
      {/* Add/Edit Account Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{isEditing ? 'Edit Account' : 'Add New Account'}</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2, mt: 1 }}>
              {error}
            </Alert>
          )}
          
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Account Name"
                name="name"
                value={currentAccount.name}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Account Type</InputLabel>
                <Select
                  name="type"
                  value={currentAccount.type}
                  onChange={handleInputChange}
                  label="Account Type"
                  disabled={isEditing} // Cannot change account type after creation
                >
                  {ACCOUNT_TYPES.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {React.cloneElement(type.icon, { fontSize: 'small', sx: { mr: 1 } })}
                        {type.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Currency</InputLabel>
                <Select
                  name="currency"
                  value={currentAccount.currency}
                  onChange={handleInputChange}
                  label="Currency"
                >
                  {CURRENCIES.map((currency) => (
                    <MenuItem key={currency.value} value={currency.value}>
                      {currency.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Balance"
                name="balance"
                type="number"
                value={currentAccount.balance}
                onChange={handleInputChange}
              />
            </Grid>
            {currentAccount.type === 'credit' && (
              <>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Credit Limit"
                    name="creditLimit"
                    type="number"
                    value={currentAccount.creditLimit}
                    onChange={handleInputChange}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Payment Due Date"
                    name="paymentDueDate"
                    type="date"
                    value={currentAccount.paymentDueDate}
                    onChange={handleInputChange}
                    InputLabelProps={{ shrink: true }}
                    required
                  />
                </Grid>
              </>
            )}
          </Grid>
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