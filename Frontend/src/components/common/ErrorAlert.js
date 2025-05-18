import React from 'react';
import { Alert, AlertTitle, Snackbar } from '@mui/material';

const ErrorAlert = ({ error, open, onClose }) => {
  if (!error) return null;

  // Extract error message
  const errorMessage = error.response?.data?.detail || 
                      error.response?.data?.message || 
                      error.message || 
                      'An unexpected error occurred';

  return (
    <Snackbar 
      open={open} 
      autoHideDuration={6000} 
      onClose={onClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
    >
      <Alert 
        onClose={onClose} 
        severity="error" 
        variant="filled"
        sx={{ width: '100%' }}
      >
        <AlertTitle>Error</AlertTitle>
        {errorMessage}
      </Alert>
    </Snackbar>
  );
};

export default ErrorAlert;