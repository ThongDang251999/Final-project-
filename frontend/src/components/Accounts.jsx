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
  Chip,
  Tooltip
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, AccountBalance as BankIcon, CreditCard as CreditCardIcon, AccountBalanceWallet as WalletIcon } from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { usePreference } from '../context/PreferenceContext';

const ACCOUNT_TYPES = [
  { value: 'wallet', label: 'Wallet', icon: <WalletIcon /> },
  { value: 'bank', label: 'Bank Account', icon: <BankIcon /> },
  { value: 'credit', label: 'Credit Card', icon: <CreditCardIcon /> }
];

const CURRENCIES = [
  { value: 'USD', label: 'US Dollar ($)' },
  { value: 'EUR', label: 'Euro (€)' },
  { value: 'GBP', label: 'British Pound (£)' },
  { value: 'JPY', label: 'Japanese Yen (¥)' }
];

const accountTypeMeta = {
  bank: { icon: <BankIcon sx={{ color: '#2563eb', bgcolor: '#e0e7ff', borderRadius: '50%', p: 1 }} />, label: 'Bank', color: '#2563eb' },
  credit: { icon: <CreditCardIcon sx={{ color: '#d32f2f', bgcolor: '#fee2e2', borderRadius: '50%', p: 1 }} />, label: 'Credit', color: '#d32f2f' },
  wallet: { icon: <WalletIcon sx={{ color: '#059669', bgcolor: '#d1fae5', borderRadius: '50%', p: 1 }} />, label: 'Wallet', color: '#059669' },
};

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
    currency: preference.currency || 'USD',
    accountNumber: ''
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
        paymentDueDate: account.paymentDueDate ? new Date(account.paymentDueDate).toISOString().split('T')[0] : '',
        accountNumber: account.accountNumber || ''
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
        currency: preference.currency || 'USD',
        accountNumber: ''
      });
      setIsEditing(false);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'accountNumber') {
      // Only allow numeric input, max 12 digits
      const numericValue = value.replace(/\D/g, '').slice(0, 12);
      setCurrentAccount({
        ...currentAccount,
        [name]: numericValue
      });
    } else {
      setCurrentAccount({
        ...currentAccount,
        [name]: value
      });
    }
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
    return accountType ? accountType.icon : <BankIcon />;
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
      {/* Summary Section */}
      <Grid container spacing={3} alignItems="stretch">
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, borderRadius: 3, boxShadow: 2, height: '100%' }}>
            <Typography variant="subtitle2" color="text.secondary">Total Balance</Typography>
            <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#16a34a', mb: 1 }}>
              {formatCurrency(summary.totalBalance, preference.currency)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Across all bank accounts and wallet
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 3, boxShadow: 2, height: '100%' }}>
            <Typography variant="subtitle2" color="text.secondary">Credit Usage</Typography>
            <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#15803d', mb: 1 }}>
              {summary.totalCreditLimit > 0 ? `${((summary.totalCreditUsed / summary.totalCreditLimit) * 100).toFixed(1)}%` : '0%'}
            </Typography>
            <Box sx={{ width: '100%', mb: 1 }}>
              <Box sx={{ height: 8, bgcolor: '#e5e7eb', borderRadius: 4 }}>
                <Box sx={{
                  width: summary.totalCreditLimit > 0 ? `${(summary.totalCreditUsed / summary.totalCreditLimit) * 100}%` : '0%',
                  height: 8,
                  bgcolor: '#16a34a',
                  borderRadius: 4,
                  transition: 'width 0.3s',
                }} />
              </Box>
            </Box>
            <Typography variant="body2" color="text.secondary">
              {formatCurrency(summary.totalCreditUsed, preference.currency)} of {formatCurrency(summary.totalCreditLimit, preference.currency)} used
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12}>
          <Box display="flex" justifyContent="flex-end" mb={2}>
            <Button
              variant="contained"
              color="success"
              startIcon={<AddIcon />}
              sx={{ borderRadius: 2, fontWeight: 600, boxShadow: 1, textTransform: 'none', ':hover': { bgcolor: '#22c55e' } }}
              onClick={() => handleOpenDialog()}
            >
              Add Account
            </Button>
          </Box>
        </Grid>
      </Grid>

      {/* Accounts Grid */}
      <Grid container spacing={3}>
        {accounts.length > 0 ? (
          accounts.map((account) => {
            const meta = accountTypeMeta[account.type] || accountTypeMeta.bank;
            return (
              <Grid item xs={12} sm={6} md={4} key={account._id}>
                <Paper
                  sx={{
                    borderRadius: 3,
                    boxShadow: 2,
                    p: 3,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1.5,
                    transition: 'box-shadow 0.2s, transform 0.2s',
                    ':hover': { boxShadow: 6, transform: 'translateY(-2px) scale(1.01)' },
                    minHeight: 220,
                  }}
                >
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    {meta.icon}
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>{account.name}</Typography>
                    <Box ml="auto">
                      <span style={{ fontSize: 13, color: '#64748b' }}>{meta.label}</span>
                    </Box>
                  </Box>
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 'bold',
                      color: account.type === 'credit' ? '#d32f2f' : '#16a34a',
                      textAlign: 'right',
                    }}
                  >
                    {formatCurrency(account.balance, account.currency)}
                  </Typography>
                  {account.type === 'credit' && (
                    <>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mt={1} mb={0.5}>
                        <Typography variant="caption" color="text.secondary">Credit Limit:</Typography>
                        <Typography variant="caption" sx={{ fontWeight: 500 }}>{formatCurrency(account.creditLimit, account.currency)}</Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                        <Typography variant="caption" color="text.secondary">Available Credit:</Typography>
                        <Typography variant="caption" sx={{ fontWeight: 500 }}>{formatCurrency(account.creditLimit - account.balance, account.currency)}</Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                        <Typography variant="caption" color="text.secondary">Payment Due:</Typography>
                        <Typography variant="caption" sx={{ fontWeight: 500 }}>{new Date(account.paymentDueDate).toLocaleDateString()}</Typography>
                      </Box>
                      <Box sx={{ width: '100%', mb: 1 }}>
                        <Box sx={{ height: 6, bgcolor: '#e5e7eb', borderRadius: 4 }}>
                          <Box sx={{
                            width: account.creditLimit > 0 ? `${(account.balance / account.creditLimit) * 100}%` : '0%',
                            height: 6,
                            bgcolor: '#16a34a',
                            borderRadius: 4,
                            transition: 'width 0.3s',
                          }} />
                        </Box>
                      </Box>
                    </>
                  )}
                  <Box display="flex" justifyContent="flex-end" gap={1} mt="auto">
                    <Tooltip title="Edit" arrow>
                      <Button
                        size="small"
                        variant="outlined"
                        color="primary"
                        sx={{ minWidth: 36, borderRadius: 2, p: 0.5 }}
                        onClick={() => handleOpenDialog(account)}
                      >
                        <EditIcon fontSize="small" />
                      </Button>
                    </Tooltip>
                    <Tooltip title="Delete" arrow>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        sx={{ minWidth: 36, borderRadius: 2, p: 0.5 }}
                        onClick={() => handleDelete(account._id)}
                      >
                        <DeleteIcon fontSize="small" />
                      </Button>
                    </Tooltip>
                  </Box>
                </Paper>
              </Grid>
            );
          })
        ) : (
          <Grid item xs={12}>
            <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3, boxShadow: 1 }}>
              <Typography variant="h5" color="text.secondary" sx={{ mb: 2 }}>
                No accounts yet
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Add your first account to start tracking your finances!
              </Typography>
              <Button
                variant="contained"
                color="success"
                startIcon={<AddIcon />}
                sx={{ borderRadius: 2, fontWeight: 600, boxShadow: 1, textTransform: 'none', ':hover': { bgcolor: '#22c55e' } }}
                onClick={() => handleOpenDialog()}
              >
                Add Account
              </Button>
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
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Account Number (Optional) or Last 4 Digits (Optional)"
                name="accountNumber"
                value={currentAccount.accountNumber}
                onChange={handleInputChange}
                placeholder="e.g., 1234"
                inputProps={{
                  maxLength: 12,
                  inputMode: 'numeric',
                  pattern: '[0-9]*'
                }}
                margin="normal"
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