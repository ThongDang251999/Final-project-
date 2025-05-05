import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Bell, 
  Lock, 
  CreditCard, 
  Globe, 
  Moon, 
  Sun,
  Save
} from 'lucide-react';
import Card from './Card';
import Button from './Button';
import Input from './Input';
import ProgressBar from './ProgressBar';
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

const Settings = () => {
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
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    weeklyReport: true
  });
  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || ''
  });
  const [profileStatus, setProfileStatus] = useState({ success: '', error: '' });
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  const [passwordStatus, setPasswordStatus] = useState({ success: '', error: '' });

  useEffect(() => {
    setProfile({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || ''
    });
  }, [user]);

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

  const handleNotificationChange = (type) => {
    setNotifications(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const handleProfileChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileStatus({ success: '', error: '' });
    try {
      await axios.put('/api/user/profile', profile);
      setProfileStatus({ success: 'Profile updated successfully!', error: '' });
    } catch (error) {
      setProfileStatus({ success: '', error: error.response?.data?.message || 'Failed to update profile.' });
    }
  };

  const handlePasswordChange = (e) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setPasswordStatus({ success: '', error: '' });
    if (passwords.new !== passwords.confirm) {
      setPasswordStatus({ success: '', error: 'New passwords do not match.' });
      return;
    }
    try {
      await axios.post('/api/auth/change-password', {
        currentPassword: passwords.current,
        newPassword: passwords.new
      });
      setPasswordStatus({ success: 'Password updated successfully!', error: '' });
      setPasswords({ current: '', new: '', confirm: '' });
    } catch (error) {
      setPasswordStatus({ success: '', error: error.response?.data?.message || 'Failed to update password.' });
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Settings */}
        <Card>
          <div className="flex items-center space-x-3 mb-6">
            <User className="w-6 h-6 text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Profile Settings
            </h2>
          </div>
          <form className="space-y-4" onSubmit={handleSaveProfile}>
            <Input
              label="Name"
              name="name"
              value={profile.name}
              onChange={handleProfileChange}
              placeholder="Enter your name"
            />
            <Input
              label="Email"
              name="email"
              value={profile.email}
              onChange={handleProfileChange}
              type="email"
              placeholder="Enter your email"
            />
            <Input
              label="Phone"
              name="phone"
              value={profile.phone}
              onChange={handleProfileChange}
              placeholder="Enter your phone number"
            />
            {profileStatus.success && <div className="text-green-600 text-sm">{profileStatus.success}</div>}
            {profileStatus.error && <div className="text-red-600 text-sm">{profileStatus.error}</div>}
            <Button
              variant="primary"
              icon={Save}
              fullWidth
              type="submit"
            >
              Save Changes
            </Button>
          </form>
        </Card>

        {/* Notification Settings */}
        <Card>
          <div className="flex items-center space-x-3 mb-6">
            <Bell className="w-6 h-6 text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Notification Settings
            </h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-700 dark:text-gray-300">Email Notifications</span>
              <button
                onClick={() => handleNotificationChange('email')}
                type="button"
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  notifications.email ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    notifications.email ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700 dark:text-gray-300">Push Notifications</span>
              <button
                onClick={() => handleNotificationChange('push')}
                type="button"
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  notifications.push ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    notifications.push ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700 dark:text-gray-300">Weekly Reports</span>
              <button
                onClick={() => handleNotificationChange('weeklyReport')}
                type="button"
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  notifications.weeklyReport ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    notifications.weeklyReport ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </Card>

        {/* Security Settings */}
        <Card>
          <div className="flex items-center space-x-3 mb-6">
            <Lock className="w-6 h-6 text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Security Settings
            </h2>
          </div>
          <form className="space-y-4" onSubmit={handleUpdatePassword}>
            <Input
              label="Current Password"
              name="current"
              type="password"
              value={passwords.current}
              onChange={handlePasswordChange}
              placeholder="Enter current password"
            />
            <Input
              label="New Password"
              name="new"
              type="password"
              value={passwords.new}
              onChange={handlePasswordChange}
              placeholder="Enter new password"
            />
            <Input
              label="Confirm New Password"
              name="confirm"
              type="password"
              value={passwords.confirm}
              onChange={handlePasswordChange}
              placeholder="Confirm new password"
            />
            {passwordStatus.success && <div className="text-green-600 text-sm">{passwordStatus.success}</div>}
            {passwordStatus.error && <div className="text-red-600 text-sm">{passwordStatus.error}</div>}
            <Button
              variant="primary"
              icon={Save}
              fullWidth
              type="submit"
            >
              Update Password
            </Button>
          </form>
        </Card>

        {/* Preferences */}
        <Card>
          <div className="flex items-center space-x-3 mb-6">
            <Globe className="w-6 h-6 text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Preferences
            </h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-700 dark:text-gray-300">Dark Mode</span>
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                type="button"
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  isDarkMode ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isDarkMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700 dark:text-gray-300">Currency</span>
              <select className="input w-32">
                {CURRENCIES.map((currency) => (
                  <option key={currency.value} value={currency.value}>
                    {currency.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700 dark:text-gray-300">Language</span>
              <select className="input w-32">
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
              </select>
            </div>
          </div>
        </Card>
      </div>

      {/* Danger Zone: Delete Account */}
      <div className="mt-8 flex justify-end">
        <div className="w-full md:w-1/2">
          <div className="border border-red-200 rounded-lg p-6 bg-red-50">
            <h2 className="text-lg font-semibold text-red-700 mb-2">Danger Zone</h2>
            <p className="text-red-600 mb-4">Deleting your account is irreversible. All your data will be permanently removed.</p>
            <Button
              variant="outlined"
              color="error"
              fullWidth
              onClick={() => setOpenDeleteDialog(true)}
            >
              Delete Account
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Account Confirmation Dialog */}
      {openDeleteDialog && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-30">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4 text-red-700">Delete Account?</h3>
            <p className="mb-6">Are you sure you want to delete your account? This action cannot be undone.</p>
            <div className="flex justify-end space-x-3">
              <Button variant="secondary" onClick={() => setOpenDeleteDialog(false)}>
                Cancel
              </Button>
              <Button variant="primary" color="error" onClick={async () => {
                try {
                  await axios.delete('/api/user');
                  logout();
                } catch (error) {
                  setSnackbar({
                    open: true,
                    message: error.response?.data?.message || 'Failed to delete account.',
                    severity: 'error'
                  });
                  setOpenDeleteDialog(false);
                }
              }}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings; 