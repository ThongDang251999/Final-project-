import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box, Divider, IconButton, LinearProgress } from '@mui/material';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PaymentIcon from '@mui/icons-material/Payment';

function maskCardNumber(number) {
  if (!number) return '';
  return number.replace(/.(?=.{4})/g, '*');
}

const CreditCardDetailsModal = ({ open, onClose, card, recentTransactions = [], onEdit, onDelete, onMakePayment }) => {
  if (!card) return null;
  const usagePercent = card.creditLimit > 0 ? (card.balance / card.creditLimit) * 100 : 0;
  const available = card.creditLimit - card.balance;
  const progressColor = usagePercent >= 90 ? 'error' : usagePercent >= 70 ? 'warning' : 'success';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span className="flex items-center gap-2">
          <CreditCardIcon className="text-blue-600" />
          {card.name}
        </span>
        <IconButton onClick={onClose}><span className="text-xl">×</span></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Box className="space-y-2">
          <Typography variant="subtitle1" className="flex items-center gap-2">
            Card Number: <span className="font-mono tracking-widest">{maskCardNumber(card.number || '**** **** **** 1234')}</span>
          </Typography>
          <Typography variant="body2">Type: Credit Card</Typography>
          <Divider className="my-2" />
          <Box className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <Typography variant="h5" className="font-bold text-green-700">${card.balance?.toLocaleString() || 0}</Typography>
            <Typography variant="body2">Limit: ${card.creditLimit?.toLocaleString() || 0}</Typography>
            <Typography variant="body2">Available: ${available?.toLocaleString() || 0}</Typography>
            <Typography variant="body2">Due: {card.paymentDueDate ? new Date(card.paymentDueDate).toLocaleDateString() : 'N/A'}</Typography>
          </Box>
          <Box className="mt-2">
            <LinearProgress variant="determinate" value={usagePercent} color={progressColor} sx={{ height: 10, borderRadius: 5 }} />
            <Typography variant="caption" className="block mt-1 text-right">{usagePercent.toFixed(1)}% used</Typography>
          </Box>
          <Divider className="my-2" />
          <Typography variant="subtitle2" className="mb-1">Recent Transactions</Typography>
          {recentTransactions.length === 0 ? (
            <Typography variant="body2" color="text.secondary">No recent transactions.</Typography>
          ) : (
            <ul className="divide-y divide-gray-100">
              {recentTransactions.slice(0, 5).map(tx => (
                <li key={tx._id} className="py-1 flex justify-between text-sm">
                  <span>{new Date(tx.date).toLocaleDateString()} - {tx.description}</span>
                  <span className={tx.amount < 0 ? 'text-red-600' : 'text-green-600'}>
                    {tx.amount < 0 ? '-' : '+'}${Math.abs(tx.amount).toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Box>
      </DialogContent>
      <DialogActions className="flex flex-col md:flex-row md:justify-end gap-2 md:gap-4 p-4">
        <Button variant="contained" color="success" startIcon={<PaymentIcon />} onClick={onMakePayment} fullWidth={true}>
          Make Payment
        </Button>
        <Button variant="outlined" startIcon={<EditIcon />} onClick={onEdit} fullWidth={true}>
          Edit Card
        </Button>
        <Button variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={onDelete} fullWidth={true}>
          Delete Card
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreditCardDetailsModal; 