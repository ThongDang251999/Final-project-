import React, { useState, useRef } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Grid,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Stepper,
  Step,
  StepLabel
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DownloadIcon from '@mui/icons-material/Download';
import InfoIcon from '@mui/icons-material/Info';
import HelpIcon from '@mui/icons-material/Help';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { usePreference } from '../context/PreferenceContext';

export default function ImportExport() {
  const { logout } = useAuth();
  const { preference } = usePreference();
  const fileInputRef = useRef(null);
  const [exportType, setExportType] = useState('transactions');
  const [importType, setImportType] = useState('transactions');
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [importFile, setImportFile] = useState(null);
  const [openImportDialog, setOpenImportDialog] = useState(false);
  const [openHelpDialog, setOpenHelpDialog] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  const handleExportTypeChange = (e) => {
    setExportType(e.target.value);
  };

  const handleImportTypeChange = (e) => {
    setImportType(e.target.value);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== 'text/csv') {
        setAlert({
          severity: 'error',
          message: 'Please select a CSV file'
        });
        return;
      }
      
      setImportFile(file);
      setOpenImportDialog(true);
    }
  };

  const handleExport = async () => {
    try {
      setLoading(true);
      
      let endpoint = '';
      switch(exportType) {
        case 'transactions':
          endpoint = '/api/transactions/export';
          break;
        case 'budgets':
          endpoint = '/api/budgets/export';
          break;
        case 'accounts':
          endpoint = '/api/accounts/export';
          break;
        case 'all':
          endpoint = '/api/export/all';
          break;
        default:
          endpoint = '/api/transactions/export';
      }
      
      const response = await axios.get(endpoint, { responseType: 'blob' });
      
      // Create a download link and trigger the download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${exportType}_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setAlert({
        severity: 'success',
        message: 'Data exported successfully'
      });
    } catch (error) {
      console.error('Error exporting data:', error);
      setAlert({
        severity: 'error',
        message: 'Error exporting data. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!importFile) return;
    
    try {
      setLoading(true);
      setActiveStep(1); // Processing
      
      const formData = new FormData();
      formData.append('file', importFile);
      formData.append('type', importType);
      
      let endpoint = '';
      switch(importType) {
        case 'transactions':
          endpoint = '/api/transactions/import';
          break;
        case 'budgets':
          endpoint = '/api/budgets/import';
          break;
        case 'accounts':
          endpoint = '/api/accounts/import';
          break;
        default:
          endpoint = '/api/transactions/import';
      }
      
      const response = await axios.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setActiveStep(2); // Completed
      
      setTimeout(() => {
        setOpenImportDialog(false);
        setImportFile(null);
        setActiveStep(0);
        
        setAlert({
          severity: 'success',
          message: `Successfully imported ${response.data.count} ${importType}`
        });
      }, 1500);
    } catch (error) {
      console.error('Error importing data:', error);
      setActiveStep(3); // Error
      
      setAlert({
        severity: 'error',
        message: error.response?.data?.message || 'Error importing data. Please check your file format.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseImportDialog = () => {
    setOpenImportDialog(false);
    setImportFile(null);
    setActiveStep(0);
  };

  const getFormatInfo = () => {
    switch(importType) {
      case 'transactions':
        return 'date,amount,type,category,description,accountId';
      case 'budgets':
        return 'category,amount,period';
      case 'accounts':
        return 'name,type,balance,currency,creditLimit,paymentDueDate';
      default:
        return '';
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" sx={{ mb: 4, fontWeight: 'bold' }}>
        Import & Export
      </Typography>
      
      {alert && (
        <Alert 
          severity={alert.severity} 
          sx={{ mb: 3 }}
          onClose={() => setAlert(null)}
        >
          {alert.message}
        </Alert>
      )}
      
      <Grid container spacing={3}>
        {/* Export Section */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, backgroundColor: 'white', borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <DownloadIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6">Export Data</Typography>
            </Box>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Export your data as CSV files for backup or analysis in spreadsheet software.
            </Typography>
            
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Export Type</InputLabel>
              <Select
                value={exportType}
                onChange={handleExportTypeChange}
                label="Export Type"
              >
                <MenuItem value="transactions">Transactions</MenuItem>
                <MenuItem value="budgets">Budgets</MenuItem>
                <MenuItem value="accounts">Accounts</MenuItem>
                <MenuItem value="all">All Data</MenuItem>
              </Select>
            </FormControl>
            
            <Button 
              variant="contained" 
              startIcon={<DownloadIcon />}
              onClick={handleExport}
              disabled={loading}
              fullWidth
            >
              {loading ? <CircularProgress size={24} /> : 'Export Data'}
            </Button>
          </Paper>
        </Grid>
        
        {/* Import Section */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, backgroundColor: 'white', borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <UploadFileIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6">Import Data</Typography>
              <Tooltip title="View Import Format Help">
                <IconButton
                  onClick={() => setOpenHelpDialog(true)}
                  size="small"
                  sx={{ ml: 1 }}
                >
                  <HelpIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Import data from CSV files. Please ensure your file matches the expected format.
            </Typography>
            
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Import Type</InputLabel>
              <Select
                value={importType}
                onChange={handleImportTypeChange}
                label="Import Type"
              >
                <MenuItem value="transactions">Transactions</MenuItem>
                <MenuItem value="budgets">Budgets</MenuItem>
                <MenuItem value="accounts">Accounts</MenuItem>
              </Select>
            </FormControl>
            
            <input
              type="file"
              accept=".csv"
              style={{ display: 'none' }}
              ref={fileInputRef}
              onChange={handleFileSelect}
            />
            
            <Button 
              variant="contained" 
              startIcon={<UploadFileIcon />}
              onClick={() => fileInputRef.current.click()}
              disabled={loading}
              fullWidth
            >
              Select CSV File
            </Button>
            
            <Divider sx={{ my: 3 }} />
            
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <InfoIcon sx={{ mr: 1, color: 'info.main' }} />
              <Typography variant="body2" color="text.secondary">
                CSV Format: {getFormatInfo()}
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Import Dialog */}
      <Dialog open={openImportDialog} onClose={handleCloseImportDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Import {importType.charAt(0).toUpperCase() + importType.slice(1)}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to import {importFile?.name}? This may add duplicate data if you're not careful.
          </DialogContentText>
          
          <Stepper activeStep={activeStep} sx={{ mt: 3 }}>
            <Step>
              <StepLabel>Confirmation</StepLabel>
            </Step>
            <Step>
              <StepLabel>Processing</StepLabel>
            </Step>
            <Step>
              <StepLabel>Completed</StepLabel>
            </Step>
            <Step>
              <StepLabel>Error</StepLabel>
            </Step>
          </Stepper>
          
          {activeStep === 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <CircularProgress />
            </Box>
          )}
          
          {activeStep === 2 && (
            <Alert severity="success" sx={{ mt: 3 }}>
              Import completed successfully!
            </Alert>
          )}
          
          {activeStep === 3 && (
            <Alert severity="error" sx={{ mt: 3 }}>
              Error importing data. Please check your file format.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseImportDialog} disabled={activeStep === 1}>
            Cancel
          </Button>
          <Button 
            onClick={handleImport} 
            variant="contained"
            disabled={activeStep !== 0}
          >
            Import
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Help Dialog */}
      <Dialog open={openHelpDialog} onClose={() => setOpenHelpDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>CSV Import Format Help</DialogTitle>
        <DialogContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Transactions Format</Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            CSV Headers: date,amount,type,category,description,accountId
          </Typography>
          <Typography variant="body2" sx={{ mb: 3 }}>
            Example: 2023-01-15,50.25,expense,Food & Drinks,Grocery shopping,account_id_here
          </Typography>
          
          <Typography variant="h6" sx={{ mb: 2 }}>Budgets Format</Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            CSV Headers: category,amount,period
          </Typography>
          <Typography variant="body2" sx={{ mb: 3 }}>
            Example: Food & Drinks,300,monthly
          </Typography>
          
          <Typography variant="h6" sx={{ mb: 2 }}>Accounts Format</Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            CSV Headers: name,type,balance,currency,creditLimit,paymentDueDate
          </Typography>
          <Typography variant="body2">
            Example: My Bank Account,bank,1500,USD,,
          </Typography>
          <Typography variant="body2" sx={{ mb: 3 }}>
            Example: My Credit Card,credit,500,USD,2000,2023-01-25
          </Typography>
          
          <Alert severity="info">
            <Typography variant="body2">
              Note: The accountId field for transactions should match an existing account ID in the system.
              If importing accounts first, you may leave the accountId field blank and it will assign to the default account.
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenHelpDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
} 