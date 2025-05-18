import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Divider,
  Avatar,
  CircularProgress,
  Alert,
  AlertTitle,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Snackbar,
} from '@mui/material';
import { Person as PersonIcon, CheckCircle as CheckCircleIcon } from '@mui/icons-material';
import UserService from '../services/userService';
import { useAuth } from '../context/AuthContext';
import ErrorAlert from '../components/common/ErrorAlert';
import { useFormik } from 'formik';
import * as Yup from 'yup';

const ProfilePage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [paidStatus, setPaidStatus] = useState(false);
  const [billAmount, setBillAmount] = useState(0);
  const [error, setError] = useState(null);
  const [showError, setShowError] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Fetch user paid status and bill amount
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user || !user.username) return;
      
      try {
        setLoading(true);
        
        // Fetch paid status
        const status = await UserService.getPaidStatus(user.username);
        setPaidStatus(status);
        
        // Fetch bill amount
        const amount = await UserService.getBillAmount(user.username);
        setBillAmount(amount);
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError(err);
        setShowError(true);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [user]);

  // Profile form validation schema
  const profileSchema = Yup.object({
    first_name: Yup.string().required('First name is required'),
    last_name: Yup.string().required('Last name is required'),
    email: Yup.string().email('Invalid email address').required('Email is required'),
    mobile_no: Yup.string().required('Mobile number is required'),
  });

  // Profile form
  const profileForm = useFormik({
    initialValues: {
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      email: user?.email || '',
      mobile_no: user?.mobile_no || '',
    },
    validationSchema: profileSchema,
    enableReinitialize: true,
    onSubmit: (values) => {
      // In a real application, you would call an API to update the user profile
      setSnackbarMessage('Profile updated successfully!');
      setSnackbarOpen(true);
    },
  });

  // Payment form validation schema
  const paymentSchema = Yup.object({
    amount: Yup.number()
      .required('Amount is required')
      .min(49.99, 'Minimum payment amount is $49.99')
  });

  // Payment form
  const paymentForm = useFormik({
    initialValues: {
      amount: 49.99,
    },
    validationSchema: paymentSchema,
    onSubmit: async (values) => {
      if (!user || !user.username) return;
      
      try {
        setProcessingPayment(true);
        setError(null);
        
        // Process payment
        const result = await UserService.makePayment(user.username, values.amount);
        
        // Update paid status
        const newStatus = await UserService.getPaidStatus(user.username);
        setPaidStatus(newStatus);
        
        // Update bill amount
        const newAmount = await UserService.getBillAmount(user.username);
        setBillAmount(newAmount);
        
        // Show success message
        setSnackbarMessage('Payment processed successfully!');
        setSnackbarOpen(true);
        
        // Close payment dialog
        setPaymentDialogOpen(false);
      } catch (err) {
        console.error('Payment failed:', err);
        setError(err);
        setShowError(true);
      } finally {
        setProcessingPayment(false);
      }
    },
  });

  // Handle error alert close
  const handleErrorClose = () => {
    setShowError(false);
  };

  // Handle payment dialog open
  const handleOpenPaymentDialog = () => {
    setPaymentDialogOpen(true);
  };

  // Handle payment dialog close
  const handleClosePaymentDialog = () => {
    setPaymentDialogOpen(false);
    paymentForm.resetForm();
  };

  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Profile
      </Typography>

      {/* Error Alert */}
      <ErrorAlert 
        error={error} 
        open={showError} 
        onClose={handleErrorClose} 
      />

      <Grid container spacing={3}>
        {/* User Profile */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Box display="flex" alignItems="center" mb={3}>
              <Avatar 
                sx={{ 
                  width: 64, 
                  height: 64, 
                  bgcolor: 'primary.main',
                  mr: 2,
                }}
              >
                <PersonIcon sx={{ fontSize: 40 }} />
              </Avatar>
              <Box>
                <Typography variant="h5">
                  {user ? `${user.first_name} ${user.last_name}` : 'Loading...'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Username: {user?.username}
                </Typography>
              </Box>
            </Box>
            
            <Divider sx={{ mb: 3 }} />
            
            <Box component="form" onSubmit={profileForm.handleSubmit}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    id="first_name"
                    name="first_name"
                    label="First Name"
                    value={profileForm.values.first_name}
                    onChange={profileForm.handleChange}
                    onBlur={profileForm.handleBlur}
                    error={profileForm.touched.first_name && Boolean(profileForm.errors.first_name)}
                    helperText={profileForm.touched.first_name && profileForm.errors.first_name}
                    disabled={loading}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    id="last_name"
                    name="last_name"
                    label="Last Name"
                    value={profileForm.values.last_name}
                    onChange={profileForm.handleChange}
                    onBlur={profileForm.handleBlur}
                    error={profileForm.touched.last_name && Boolean(profileForm.errors.last_name)}
                    helperText={profileForm.touched.last_name && profileForm.errors.last_name}
                    disabled={loading}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    id="email"
                    name="email"
                    label="Email Address"
                    value={profileForm.values.email}
                    onChange={profileForm.handleChange}
                    onBlur={profileForm.handleBlur}
                    error={profileForm.touched.email && Boolean(profileForm.errors.email)}
                    helperText={profileForm.touched.email && profileForm.errors.email}
                    disabled={loading}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    id="mobile_no"
                    name="mobile_no"
                    label="Mobile Number"
                    value={profileForm.values.mobile_no}
                    onChange={profileForm.handleChange}
                    onBlur={profileForm.handleBlur}
                    error={profileForm.touched.mobile_no && Boolean(profileForm.errors.mobile_no)}
                    helperText={profileForm.touched.mobile_no && profileForm.errors.mobile_no}
                    disabled={loading}
                  />
                </Grid>
              </Grid>
              
              <Box mt={3} display="flex" justifyContent="flex-end">
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={loading || !profileForm.dirty}
                >
                  {loading ? <CircularProgress size={24} /> : 'Update Profile'}
                </Button>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Subscription Status */}
        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Subscription Status
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              {loading ? (
                <Box display="flex" justifyContent="center" my={2}>
                  <CircularProgress />
                </Box>
              ) : (
                <>
                  <Box display="flex" alignItems="center" mb={2}>
                    <Typography variant="body1" fontWeight="medium">
                      Current Plan:
                    </Typography>
                    <Box 
                      ml={1} 
                      px={1} 
                      py={0.5} 
                      borderRadius={1}
                      bgcolor={paidStatus ? 'success.main' : 'info.main'}
                      color="white"
                    >
                      {paidStatus ? 'Paid Tier' : 'Free Tier'}
                    </Box>
                  </Box>
                  
                  {paidStatus && (
                    <Typography variant="body2" mb={2}>
                      <strong>Current Bill:</strong> ${billAmount}
                    </Typography>
                  )}
                  
                  {paidStatus ? (
                    <Alert 
                      icon={<CheckCircleIcon fontSize="inherit" />}
                      severity="success"
                      sx={{ mb: 2 }}
                    >
                      <AlertTitle>Paid Tier Benefits</AlertTitle>
                      <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
                        <li>Unlimited scan executions</li>
                        <li>Access to all security tools</li>
                        <li>Advanced reporting</li>
                      </ul>
                    </Alert>
                  ) : (
                    <Alert severity="info" sx={{ mb: 2 }}>
                      <AlertTitle>Upgrade to Paid Tier</AlertTitle>
                      <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
                        <li>Remove 15 scan limit per API key</li>
                        <li>Access all security tools</li>
                        <li>Get advanced reporting</li>
                      </ul>
                      <Button
                        color="primary"
                        variant="outlined"
                        size="small"
                        sx={{ mt: 1 }}
                        onClick={handleOpenPaymentDialog}
                      >
                        Upgrade Now
                      </Button>
                    </Alert>
                  )}
                  
                  <Typography variant="subtitle2" gutterBottom>
                    Free Tier Limitations:
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Limited to 15 scan executions per API key with access to basic tools only (dig, nmap, whatweb).
                  </Typography>
                </>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Security Settings
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Button
                variant="outlined"
                color="primary"
                fullWidth
                sx={{ mb: 2 }}
                // This would typically open a password change dialog
              >
                Change Password
              </Button>
              
              <Button
                variant="outlined"
                color="secondary"
                fullWidth
                // This would typically open a 2FA setup dialog
              >
                Enable Two-Factor Authentication
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onClose={handleClosePaymentDialog}>
        <DialogTitle>Upgrade to Paid Tier</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Upgrade to the paid tier for unlimited scan executions and access to all security tools. The minimum payment amount is $49.99.
          </DialogContentText>
          <Box component="form" onSubmit={paymentForm.handleSubmit} mt={2}>
            <TextField
              fullWidth
              id="amount"
              name="amount"
              label="Payment Amount ($)"
              type="number"
              value={paymentForm.values.amount}
              onChange={paymentForm.handleChange}
              onBlur={paymentForm.handleBlur}
              error={paymentForm.touched.amount && Boolean(paymentForm.errors.amount)}
              helperText={paymentForm.touched.amount && paymentForm.errors.amount}
              disabled={processingPayment}
              InputProps={{
                startAdornment: <Typography variant="body1">$</Typography>,
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePaymentDialog} disabled={processingPayment}>
            Cancel
          </Button>
          <Button
            onClick={paymentForm.handleSubmit}
            variant="contained"
            color="primary"
            disabled={processingPayment}
          >
            {processingPayment ? <CircularProgress size={24} /> : 'Make Payment'}
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

export default ProfilePage;