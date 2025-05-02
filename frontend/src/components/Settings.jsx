import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Grid,
  Switch,
  FormControlLabel,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Alert,
  Snackbar
} from '@mui/material';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { usePreference } from '../context/PreferenceContext';

const CURRENCIES = [
  { value: 'USD', label: 'US Dollar ($)' },
  { value: 'EUR', label: 'Euro (€)' },
  { value: 'GBP', label: 'British Pound (£)' },
  { value: 'JPY', label: 'Japanese Yen (¥)' }
];

const DATE_FORMATS = [
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (US)' },
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (EU)' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (ISO)' }
];

const DEFAULT_VIEWS = [
  { value: 'overview', label: 'Overview Dashboard' },
  { value: 'transactions', label: 'Transactions' },
  { value: 'budgets', label: 'Budgets' }
];

export default function Settings() {
  const { logout, user } = useAuth();
  const { preference, updatePreference } = usePreference();
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openPasswordDialog, setOpenPasswordDialog] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [error, setError] = useState(null);

  const handlePreferenceChange = async (e) => {
    const { name, value } = e.target;
    try {
      const success = await updatePreference({ [name]: value });
      if (success) {
        setSnackbar({
          open: true,
          message: 'Settings updated successfully',
          severity: 'success'
        });
      }
    } catch (error) {
      console.error('Error updating preference:', error);
      setSnackbar({
        open: true,
        message: 'Error updating settings',
        severity: 'error'
      });
    }
  };

  const handleThemeChange = async (e) => {
    const newTheme = e.target.checked ? 'dark' : 'light';
    try {
      const success = await updatePreference({ theme: newTheme });
      if (success) {
        setSnackbar({
          open: true,
          message: 'Theme updated successfully',
          severity: 'success'
        });
      }
    } catch (error) {
      console.error('Error updating theme:', error);
      setSnackbar({
        open: true,
        message: 'Error updating theme',
        severity: 'error'
      });
    }
  };

  const handleChangePassword = async () => {
    setError(null);
    
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('All fields are required');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    
    try {
      await axios.post('/api/auth/change-password', {
        currentPassword,
        newPassword
      });
      
      setOpenPasswordDialog(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      setSnackbar({
        open: true,
        message: 'Password changed successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error changing password:', error);
      setError(error.response?.data?.message || 'Error changing password');
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" sx={{ mb: 4, fontWeight: 'bold' }}>
        Settings
      </Typography>
      
      <Grid container spacing={3}>
        {/* Appearance Settings */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, backgroundColor: 'white', borderRadius: 2 }}>
            <Typography variant="h6" sx={{ mb: 3 }}>Appearance</Typography>
            
            <Box sx={{ mb: 3 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={preference.theme === 'dark'}
                    onChange={handleThemeChange}
                  />
                }
                label="Dark Mode"
              />
            </Box>
            
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Default Currency</InputLabel>
              <Select
                name="currency"
                value={preference.currency}
                onChange={handlePreferenceChange}
                label="Default Currency"
              >
                {CURRENCIES.map((currency) => (
                  <MenuItem key={currency.value} value={currency.value}>
                    {currency.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Date Format</InputLabel>
              <Select
                name="dateFormat"
                value={preference.dateFormat}
                onChange={handlePreferenceChange}
                label="Date Format"
              >
                {DATE_FORMATS.map((format) => (
                  <MenuItem key={format.value} value={format.value}>
                    {format.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl fullWidth>
              <InputLabel>Default View</InputLabel>
              <Select
                name="defaultView"
                value={preference.defaultView}
                onChange={handlePreferenceChange}
                label="Default View"
              >
                {DEFAULT_VIEWS.map((view) => (
                  <MenuItem key={view.value} value={view.value}>
                    {view.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Paper>
        </Grid>
        
        {/* Account Settings */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, backgroundColor: 'white', borderRadius: 2 }}>
            <Typography variant="h6" sx={{ mb: 3 }}>Account</Typography>
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="body1" sx={{ fontWeight: 'medium' }}>Email</Typography>
              <Typography variant="body2" color="text.secondary">{user?.email || 'Loading...'}</Typography>
            </Box>
            
            <Divider sx={{ my: 3 }} />
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="body1" sx={{ fontWeight: 'medium', mb: 1 }}>Security</Typography>
              <Button 
                variant="outlined" 
                onClick={() => setOpenPasswordDialog(true)}
                sx={{ mb: 2 }}
              >
                Change Password
              </Button>
            </Box>
            
            <Divider sx={{ my: 3 }} />
            
            <Box>
              <Typography variant="body1" sx={{ fontWeight: 'medium', mb: 1, color: 'error.main' }}>Danger Zone</Typography>
              <Button 
                variant="outlined" 
                color="error"
                onClick={() => setOpenDeleteDialog(true)}
              >
                Delete Account
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Delete Account Dialog */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>Confirm Account Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete your account? This action cannot be undone, and all your data will be permanently deleted.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
          <Button 
            color="error" 
            onClick={() => {
              setOpenDeleteDialog(false);
              logout();
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Change Password Dialog */}
      <Dialog open={openPasswordDialog} onClose={() => setOpenPasswordDialog(false)}>
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <DialogContentText sx={{ mb: 2 }}>
            Please enter your current password and new password.
          </DialogContentText>
          <TextField
            fullWidth
            label="Current Password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Confirm New Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPasswordDialog(false)}>Cancel</Button>
          <Button onClick={handleChangePassword} variant="contained">
            Change Password
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Notification Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
} 