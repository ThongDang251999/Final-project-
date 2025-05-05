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
    <div className="w-full min-h-screen bg-gray-50 py-8 px-4 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Settings</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Profile Settings */}
        <div className="bg-white rounded-md shadow-md p-5 flex flex-col space-y-4">
          <h2 className="text-xl font-bold text-gray-900">Profile Settings</h2>
          <form className="flex flex-col space-y-4" onSubmit={handleSaveProfile}>
            <Input
              label="Name"
              name="name"
              value={profile.name}
              onChange={handleProfileChange}
              placeholder="Enter your name"
              className=""
            />
            <Input
              label="Email"
              name="email"
              value={profile.email}
              onChange={handleProfileChange}
              type="email"
              placeholder="Enter your email"
              className=""
            />
            <Input
              label="Phone"
              name="phone"
              value={profile.phone}
              onChange={handleProfileChange}
              placeholder="Enter your phone number"
              className=""
            />
            {profileStatus.success && <div className="text-green-600 text-sm">{profileStatus.success}</div>}
            {profileStatus.error && <div className="text-red-600 text-sm">{profileStatus.error}</div>}
            <Button
              variant="primary"
              icon={Save}
              fullWidth
              type="submit"
              className="mt-2"
            >
              Save Changes
            </Button>
          </form>
        </div>

        {/* Notification Settings */}
        <div className="bg-white rounded-md shadow-md p-5 flex flex-col space-y-4">
          <h2 className="text-xl font-bold text-gray-900">Notification Settings</h2>
          <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Email Notifications</span>
              <label className="inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={notifications.email} onChange={() => handleNotificationChange('email')} className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-green-400 rounded-full peer peer-checked:bg-green-500 transition"></div>
                <div className="dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition peer-checked:translate-x-5"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Push Notifications</span>
              <label className="inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={notifications.push} onChange={() => handleNotificationChange('push')} className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-green-400 rounded-full peer peer-checked:bg-green-500 transition"></div>
                <div className="dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition peer-checked:translate-x-5"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Weekly Reports</span>
              <label className="inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={notifications.weeklyReport} onChange={() => handleNotificationChange('weeklyReport')} className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-green-400 rounded-full peer peer-checked:bg-green-500 transition"></div>
                <div className="dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition peer-checked:translate-x-5"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="bg-white rounded-md shadow-md p-5 flex flex-col space-y-4">
          <h2 className="text-xl font-bold text-gray-900">Security Settings</h2>
          <form className="flex flex-col space-y-4" onSubmit={handleUpdatePassword}>
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
              className="mt-2"
            >
              Update Password
            </Button>
          </form>
        </div>

        {/* Preferences */}
        <div className="bg-white rounded-md shadow-md p-5 flex flex-col space-y-4">
          <h2 className="text-xl font-bold text-gray-900">Preferences</h2>
          <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Dark Mode</span>
              <label className="inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={isDarkMode} onChange={() => setIsDarkMode(!isDarkMode)} className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-green-400 rounded-full peer peer-checked:bg-green-500 transition"></div>
                <div className="dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition peer-checked:translate-x-5"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Currency</span>
              <select className="input w-32 border rounded px-2 py-1">
                {CURRENCIES.map((currency) => (
                  <option key={currency.value} value={currency.value}>
                    {currency.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Language</span>
              <select className="input w-32 border rounded px-2 py-1">
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
              </select>
            </div>
          </div>
        </div>

        {/* Danger Zone: Delete Account */}
        <div className="col-span-1 md:col-span-2">
          <div className="border border-red-200 rounded-md p-5 bg-red-50 mt-4 flex flex-col items-center">
            <h2 className="text-xl font-bold text-red-700 mb-2">Danger Zone</h2>
            <p className="text-red-600 mb-4 text-center">Deleting your account is irreversible. All your data will be permanently removed.</p>
            <button
              onClick={() => setOpenDeleteDialog(true)}
              className="w-full max-w-xs py-3 px-6 rounded-md bg-red-600 text-white font-semibold text-base shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 transition"
              type="button"
            >
              Delete Account
            </button>
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