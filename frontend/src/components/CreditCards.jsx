import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Box,
  Paper,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Divider
} from '@mui/material';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import PaymentIcon from '@mui/icons-material/Payment';
import EditIcon from '@mui/icons-material/Edit';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { usePreference } from '../context/PreferenceContext';

export default function CreditCards() {
  const { logout } = useAuth();
  const { preference } = usePreference();
  const [creditCards, setCreditCards] = useState([]);
  const [openPaymentDialog, setOpenPaymentDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [currentCard, setCurrentCard] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [totalCreditUsed, setTotalCreditUsed] = useState(0);
  const [totalCreditLimit, setTotalCreditLimit] = useState(0);

  const fetchCreditCards = async () => {
    try {
      const response = await axios.get('/api/accounts');
      const cards = response.data.filter(account => account.type === 'credit');
      setCreditCards(cards);
      
      // Calculate total usage
      const used = cards.reduce((sum, card) => sum + card.balance, 0);
      const limit = cards.reduce((sum, card) => sum + card.creditLimit, 0);
      setTotalCreditUsed(used);
      setTotalCreditLimit(limit);
    } catch (error) {
      console.error('Error fetching credit cards:', error);
    }
  };

  useEffect(() => {
    fetchCreditCards();
  }, []);

  const formatCurrency = (amount, currency) => {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    });
    return formatter.format(amount);
  };

  const handleOpenPaymentDialog = (card) => {
    setCurrentCard(card);
    setPaymentAmount(card.balance.toString());
    setOpenPaymentDialog(true);
  };

  const handleOpenEditDialog = (card) => {
    setCurrentCard({
      ...card,
      paymentDueDate: new Date(card.paymentDueDate).toISOString().split('T')[0]
    });
    setOpenEditDialog(true);
  };

  const handleCloseDialogs = () => {
    setOpenPaymentDialog(false);
    setOpenEditDialog(false);
    setCurrentCard(null);
    setPaymentAmount('');
  };

  const handleMakePayment = async () => {
    try {
      if (!currentCard || !paymentAmount) return;
      
      // Create a payment transaction
      await axios.post('/api/transactions', {
        accountId: currentCard._id,
        amount: paymentAmount,
        type: 'expense',
        category: 'Credit Card Payment',
        description: `Payment to ${currentCard.name}`,
        date: new Date().toISOString()
      });
      
      // Update card balance
      await axios.put(`/api/accounts/${currentCard._id}`, {
        balance: currentCard.balance - Number(paymentAmount)
      });
      
      fetchCreditCards();
      handleCloseDialogs();
    } catch (error) {
      console.error('Error making payment:', error);
    }
  };

  const handleUpdateCard = async () => {
    try {
      if (!currentCard) return;
      
      await axios.put(`/api/accounts/${currentCard._id}`, {
        name: currentCard.name,
        creditLimit: currentCard.creditLimit,
        paymentDueDate: currentCard.paymentDueDate
      });
      
      fetchCreditCards();
      handleCloseDialogs();
    } catch (error) {
      console.error('Error updating card:', error);
    }
  };

  const handleInputChange = (e) => {
    setCurrentCard({
      ...currentCard,
      [e.target.name]: e.target.value
    });
  };

  const getDaysUntilDue = (dueDate) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diffTime = due - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getUsagePercentage = (balance, limit) => {
    return (balance / limit) * 100;
  };

  const getProgressColor = (percentage) => {
    if (percentage < 50) return 'success';
    if (percentage < 75) return 'warning';
    return 'error';
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" sx={{ mb: 4, fontWeight: 'bold' }}>
        Credit Cards
      </Typography>
      
      {/* Credit Usage Summary */}
      <Paper sx={{ p: 3, mb: 4, backgroundColor: 'white', borderRadius: 2 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" sx={{ mb: 1 }}>Total Credit Usage</Typography>
            <Typography variant="h3" sx={{ 
              fontWeight: 'bold', 
              color: getProgressColor(getUsagePercentage(totalCreditUsed, totalCreditLimit)) === 'error' 
                ? '#d32f2f' 
                : getProgressColor(getUsagePercentage(totalCreditUsed, totalCreditLimit)) === 'warning'
                  ? '#ff9800'
                  : '#2E7D32'
            }}>
              {totalCreditLimit > 0 
                ? `${(getUsagePercentage(totalCreditUsed, totalCreditLimit)).toFixed(1)}%`
                : '0%'
              }
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={totalCreditLimit > 0 ? Math.min(getUsagePercentage(totalCreditUsed, totalCreditLimit), 100) : 0} 
              color={getProgressColor(getUsagePercentage(totalCreditUsed, totalCreditLimit))}
              sx={{ height: 10, borderRadius: 5, mt: 2 }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', height: '100%', flexDirection: 'column', justifyContent: 'center' }}>
              <Typography variant="body1" sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <span>Total Credit Limit:</span>
                <span>{formatCurrency(totalCreditLimit, preference.currency)}</span>
              </Typography>
              <Typography variant="body1" sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <span>Total Balance:</span>
                <span>{formatCurrency(totalCreditUsed, preference.currency)}</span>
              </Typography>
              <Typography variant="body1" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Available Credit:</span>
                <span>{formatCurrency(totalCreditLimit - totalCreditUsed, preference.currency)}</span>
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Credit Cards List */}
      <Grid container spacing={3}>
        {creditCards.length > 0 ? (
          creditCards.map((card) => {
            const usagePercentage = getUsagePercentage(card.balance, card.creditLimit);
            const daysUntilDue = getDaysUntilDue(card.paymentDueDate);
            
            return (
              <Grid item xs={12} md={6} key={card._id}>
                <Card sx={{ 
                  borderRadius: 2,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
                  color: 'white'
                }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                        <CreditCardIcon sx={{ mr: 1 }} />
                        {card.name}
                      </Typography>
                      <Typography variant="body2">
                        {card.currency}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="body2" sx={{ mb: 0.5 }}>Current Balance</Typography>
                      <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                        {formatCurrency(card.balance, card.currency)}
                      </Typography>
                    </Box>
                    
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2">Credit Limit</Typography>
                        <Typography variant="h6">
                          {formatCurrency(card.creditLimit, card.currency)}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2">Available</Typography>
                        <Typography variant="h6">
                          {formatCurrency(card.creditLimit - card.balance, card.currency)}
                        </Typography>
                      </Grid>
                    </Grid>
                    
                    <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.3)' }} />
                    
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2">Usage</Typography>
                        <Typography variant="body2">{usagePercentage.toFixed(1)}%</Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={Math.min(usagePercentage, 100)} 
                        color={getProgressColor(usagePercentage)}
                        sx={{ height: 8, borderRadius: 4, bgcolor: 'rgba(255,255,255,0.2)' }}
                      />
                    </Box>
                    
                    <Typography variant="body2" sx={{ 
                      color: daysUntilDue <= 3 ? '#ff9800' : daysUntilDue <= 0 ? '#f44336' : 'inherit',
                      fontWeight: daysUntilDue <= 3 ? 'bold' : 'normal'
                    }}>
                      {daysUntilDue <= 0 
                        ? `Payment past due by ${Math.abs(daysUntilDue)} days!` 
                        : `Payment due in ${daysUntilDue} days (${new Date(card.paymentDueDate).toLocaleDateString()})`
                      }
                    </Typography>
                  </CardContent>
                  <CardActions sx={{ bgcolor: 'rgba(0,0,0,0.2)', justifyContent: 'space-between', p: 2 }}>
                    <Button 
                      size="small" 
                      startIcon={<PaymentIcon />} 
                      variant="contained"
                      onClick={() => handleOpenPaymentDialog(card)}
                      sx={{ bgcolor: 'white', color: '#1e3c72', '&:hover': { bgcolor: '#f5f5f5' } }}
                    >
                      Make Payment
                    </Button>
                    <Button 
                      size="small" 
                      startIcon={<EditIcon />}
                      variant="outlined"
                      onClick={() => handleOpenEditDialog(card)}
                      sx={{ borderColor: 'white', color: 'white', '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}
                    >
                      Edit
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            );
          })
        ) : (
          <Grid item xs={12}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body1">
                No credit cards set up yet. Add one from the Accounts section!
              </Typography>
            </Paper>
          </Grid>
        )}
      </Grid>
      
      {/* Payment Dialog */}
      <Dialog open={openPaymentDialog} onClose={handleCloseDialogs} maxWidth="xs" fullWidth>
        <DialogTitle>Make a Payment to {currentCard?.name}</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" gutterBottom>
              Current Balance: {currentCard && formatCurrency(currentCard.balance, currentCard.currency)}
            </Typography>
            <TextField
              fullWidth
              label="Payment Amount"
              type="number"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              InputProps={{ inputProps: { min: 0, max: currentCard?.balance } }}
              sx={{ mt: 2 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialogs}>Cancel</Button>
          <Button 
            onClick={handleMakePayment} 
            variant="contained"
            disabled={!paymentAmount || Number(paymentAmount) <= 0 || Number(paymentAmount) > (currentCard?.balance || 0)}
          >
            Make Payment
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Edit Dialog */}
      <Dialog open={openEditDialog} onClose={handleCloseDialogs} maxWidth="xs" fullWidth>
        <DialogTitle>Edit {currentCard?.name}</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Card Name"
              name="name"
              value={currentCard?.name || ''}
              onChange={handleInputChange}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Credit Limit"
              name="creditLimit"
              type="number"
              value={currentCard?.creditLimit || ''}
              onChange={handleInputChange}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Payment Due Date"
              name="paymentDueDate"
              type="date"
              value={currentCard?.paymentDueDate || ''}
              onChange={handleInputChange}
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialogs}>Cancel</Button>
          <Button 
            onClick={handleUpdateCard} 
            variant="contained"
          >
            Update
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
} 