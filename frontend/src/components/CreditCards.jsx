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
import { motion } from 'framer-motion';
import { Plus, CreditCard, TrendingUp, AlertCircle } from 'lucide-react';
import CardComponent from './Card';
import ButtonComponent from './Button';
import ProgressBar from './ProgressBar';
import Modal from './Modal';
import Input from './Input';
import Skeleton from './Skeleton';

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
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [newCard, setNewCard] = useState({
    name: '',
    number: '',
    expiry: '',
    cvv: '',
    creditLimit: '',
    currency: preference.currency || 'USD',
    paymentDueDate: '',
  });

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

  const handleNewCardInputChange = (e) => {
    setNewCard({
      ...newCard,
      [e.target.name]: e.target.value
    });
  };

  const handleAddCard = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/accounts', {
        name: newCard.name,
        type: 'credit',
        creditLimit: Number(newCard.creditLimit),
        currency: newCard.currency,
        paymentDueDate: newCard.paymentDueDate,
        // Optionally add number, expiry, cvv if your backend supports it
      });
      setIsAddModalOpen(false);
      setNewCard({ name: '', number: '', expiry: '', cvv: '', creditLimit: '', currency: preference.currency || 'USD', paymentDueDate: '' });
      fetchCreditCards();
    } catch (error) {
      console.error('Error adding credit card:', error);
    }
  };

  // Simulate loading
  setTimeout(() => {
    setIsLoading(false);
  }, 1500);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Credit Cards</h1>
        <ButtonComponent
          variant="primary"
          icon={Plus}
          onClick={() => setIsAddModalOpen(true)}
        >
          Add Credit Card
        </ButtonComponent>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {isLoading ? (
          [...Array(2)].map((_, index) => (
            <CardComponent key={index}>
              <Skeleton variant="text" count={4} />
            </CardComponent>
          ))
        ) : (
          creditCards.map((card) => (
            <CardComponent key={card._id}>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <CreditCard className="w-6 h-6 text-primary-600" />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {card.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {card.currency}
                      </p>
                    </div>
                  </div>
                  {card.balance / card.creditLimit > 0.8 && (
                    <AlertCircle className="w-5 h-5 text-yellow-500" />
                  )}
                </div>

                <ProgressBar
                  value={card.balance}
                  max={card.creditLimit}
                  label={`$${card.balance} of $${card.creditLimit}`}
                  color={card.balance / card.creditLimit > 0.8 ? 'red' : 'primary'}
                />

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Available Credit</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {formatCurrency(card.creditLimit - card.balance, card.currency)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Due Date</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {new Date(card.paymentDueDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex justify-end">
                  <ButtonComponent
                    variant="secondary"
                    size="sm"
                  >
                    View Details
                  </ButtonComponent>
                </div>
              </div>
            </CardComponent>
          ))
        )}
      </div>

      <CardComponent>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Credit Score
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Track your credit score and history
            </p>
          </div>
          <ButtonComponent
            variant="secondary"
            icon={TrendingUp}
          >
            View Details
          </ButtonComponent>
        </div>
      </CardComponent>

      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Credit Card"
      >
        <form className="space-y-4" onSubmit={handleAddCard}>
          <Input
            label="Card Name"
            name="name"
            placeholder="Enter card name"
            value={newCard.name}
            onChange={handleNewCardInputChange}
            required
          />
          <Input
            label="Card Number"
            name="number"
            placeholder="Enter card number"
            value={newCard.number}
            onChange={handleNewCardInputChange}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Expiry Date"
              name="expiry"
              type="month"
              value={newCard.expiry}
              onChange={handleNewCardInputChange}
              required
            />
            <Input
              label="CVV"
              name="cvv"
              placeholder="123"
              value={newCard.cvv}
              onChange={handleNewCardInputChange}
              required
            />
          </div>
          <Input
            label="Credit Limit"
            name="creditLimit"
            type="number"
            placeholder="0.00"
            value={newCard.creditLimit}
            onChange={handleNewCardInputChange}
            required
          />
          <Input
            label="Payment Due Date"
            name="paymentDueDate"
            type="date"
            value={newCard.paymentDueDate}
            onChange={handleNewCardInputChange}
            required
          />
          <div className="flex justify-end space-x-3 mt-6">
            <ButtonComponent
              variant="secondary"
              onClick={() => setIsAddModalOpen(false)}
              type="button"
            >
              Cancel
            </ButtonComponent>
            <ButtonComponent
              variant="primary"
              type="submit"
            >
              Add Card
            </ButtonComponent>
          </div>
        </form>
      </Modal>
    </Container>
  );
} 