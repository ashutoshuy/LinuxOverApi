import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Button,
  Divider,
  Alert,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  CircularProgress,
  Snackbar,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import ApiKeyService from '../services/apiKeyService';
import UserService from '../services/userService';
import { useAuth } from '../context/AuthContext';
import ErrorAlert from '../components/common/ErrorAlert';
import ApiKeyDisplay from '../components/common/ApiKeyDisplay';

const ApiKeyPage = () => {
  const { user } = useAuth();
  const [apiKeys, setApiKeys] = useState([]);
  const [paidStatus, setPaidStatus] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generatingKey, setGeneratingKey] = useState(false);
  const [error, setError] = useState(null);
  const [showError, setShowError] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [keyType, setKeyType] = useState('free');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  useEffect(() => {
    const fetchApiKeys = async () => {
      try {
        setLoading(true);
        setError(null);

        if (user && user.username) {
          // Fetch user's API keys
          const fetchedApiKeys = await ApiKeyService.getUserApiKeys(user.username);
          setApiKeys(fetchedApiKeys || []);

          // Check paid status
          const status = await UserService.getPaidStatus(user.username);
          setPaidStatus(status);
        }
      } catch (err) {
        console.error('Error fetching API keys:', err);
        setError(err);
        setShowError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchApiKeys();
  }, [user]);

  // Handle error alert close
  const handleErrorClose = () => {
    setShowError(false);
  };

  // Handle dialog open
  const handleOpenDialog = () => {
    setDialogOpen(true);
  };

  // Handle dialog close
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setKeyType('free');
  };

  // Handle key type change
  const handleKeyTypeChange = (event) => {
    setKeyType(event.target.value);
  };

  // Handle API key generation
  const handleGenerateApiKey = async () => {
    try {
      setGeneratingKey(true);
      
      // Check if user is trying to generate a paid key without having paid status
      if (keyType === 'paid' && !paidStatus) {
        setSnackbarMessage('You need to upgrade to the paid tier to generate paid API keys.');
        setSnackbarOpen(true);
        handleCloseDialog();
        return;
      }
      
      // Generate API key
      const result = await ApiKeyService.generateApiKey(user.username, keyType);
      
      // Update API keys list
      const updatedKeys = await ApiKeyService.getUserApiKeys(user.username);
      setApiKeys(updatedKeys || []);
      
      // Show success message
      setSnackbarMessage('API key generated successfully!');
      setSnackbarOpen(true);
      
      // Close dialog
      handleCloseDialog();
    } catch (err) {
      console.error('Error generating API key:', err);
      setError(err);
      setShowError(true);
    } finally {
      setGeneratingKey(false);
    }
  };

  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  // Get count for each API key
  useEffect(() => {
    const fetchApiKeyCounts = async () => {
      if (apiKeys.length === 0) return;

      try {
        const keysWithCounts = await Promise.all(
          apiKeys.map(async (key) => {
            try {
              const countData = await ApiKeyService.getApiKeyCount(key.apikey);
              return {
                ...key,
                count: countData.count || 0
              };
            } catch (error) {
              console.error(`Error fetching count for API key ${key.apikey}:`, error);
              return {
                ...key,
                count: 0
              };
            }
          })
        );

        setApiKeys(keysWithCounts);
      } catch (err) {
        console.error('Error fetching API key counts:', err);
      }
    };

    fetchApiKeyCounts();
  }, [apiKeys.length]);

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          API Keys
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenDialog}
        >
          Generate New Key
        </Button>
      </Box>

      {/* Error Alert */}
      <ErrorAlert 
        error={error} 
        open={showError} 
        onClose={handleErrorClose} 
      />

      {/* API Keys Information */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          API Keys Information
        </Typography>
        <Typography variant="body1" paragraph>
          API keys are used to authenticate requests to the LinuxOverApi endpoints. Each API key has a usage limit depending on its type.
        </Typography>
        <Box mt={2}>
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>Free Tier:</strong> Limited to 15 scan executions per API key with access to basic tools only (dig, nmap, whatweb).
            </Typography>
          </Alert>
          {paidStatus ? (
            <Alert severity="success">
              <Typography variant="body2">
                <strong>Paid Tier:</strong> You have access to unlimited scan executions and all security tools.
              </Typography>
            </Alert>
          ) : (
            <Alert severity="warning">
              <Typography variant="body2">
                <strong>Upgrade to Paid Tier:</strong> Unlimited scan executions, access to all security tools, and advanced reporting.
              </Typography>
            </Alert>
          )}
        </Box>
      </Paper>

      {/* API Keys List */}
      <Typography variant="h6" gutterBottom>
        Your API Keys
      </Typography>
      
      {loading ? (
        <Grid container spacing={3}>
          {[1, 2].map((item) => (
            <Grid item xs={12} md={6} key={item}>
              <Skeleton variant="rectangular" height={150} />
            </Grid>
          ))}
        </Grid>
      ) : apiKeys.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            You don't have any API keys yet
          </Typography>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleOpenDialog}
            sx={{ mt: 1 }}
          >
            Generate Your First API Key
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {apiKeys.map((apiKey) => (
            <Grid item xs={12} md={6} key={apiKey.id}>
              <ApiKeyDisplay
                apiKey={apiKey.apikey}
                apiType={apiKey.api_type}
                count={apiKey.count || 0}
                createdAt={apiKey.created_at}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Generate API Key Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog}>
        <DialogTitle>Generate New API Key</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Select the type of API key you want to generate. Free tier keys have a limit of 15 scan executions and basic tools access. Paid tier keys have unlimited scan executions and access to all security tools.
          </DialogContentText>
          <FormControl component="fieldset" sx={{ mt: 2 }}>
            <FormLabel component="legend">API Key Type</FormLabel>
            <RadioGroup
              aria-label="api-key-type"
              name="api-key-type"
              value={keyType}
              onChange={handleKeyTypeChange}
            >
              <FormControlLabel value="free" control={<Radio />} label="Free Tier" />
              <FormControlLabel 
                value="paid" 
                control={<Radio />} 
                label="Paid Tier" 
                disabled={!paidStatus}
              />
            </RadioGroup>
          </FormControl>
          {!paidStatus && keyType === 'free' && (
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                Free tier keys are limited to 15 scan executions and basic tools only.
              </Typography>
            </Alert>
          )}
          {!paidStatus && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              <Typography variant="body2">
                Upgrade to the paid tier to access unlimited scans and all security tools.
              </Typography>
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleGenerateApiKey}
            variant="contained"
            color="primary"
            disabled={generatingKey}
          >
            {generatingKey ? <CircularProgress size={24} /> : 'Generate'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for messages */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        message={snackbarMessage}
      />
    </Box>
  );
};

export default ApiKeyPage;