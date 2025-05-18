import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  LinearProgress,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

const ApiKeyDisplay = ({ apiKey, apiType, count, createdAt, keyUsageLimit = 15 }) => {
  const [showApiKey, setShowApiKey] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Format creation date
  const formattedDate = new Date(createdAt).toLocaleDateString();
  
  // Calculate usage percentage for progress bar (only for free tier)
  const usagePercentage = apiType === 'free' ? (count / keyUsageLimit) * 100 : null;
  
  // Mask API key
  const maskedApiKey = showApiKey ? apiKey : `${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`;
  
  // Handle copy to clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(apiKey);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };
  
  // Handle toggle show/hide API key
  const toggleShowApiKey = () => {
    setShowApiKey(!showApiKey);
  };
  
  // Handle dialog open/close
  const handleOpenDialog = () => {
    setDialogOpen(true);
  };
  
  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  return (
    <>
      <Card sx={{ mb: 2, position: 'relative' }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="h6" component="div">
              API Key
            </Typography>
            <Chip 
              label={apiType === 'free' ? 'Free Tier' : 'Paid Tier'} 
              color={apiType === 'free' ? 'primary' : 'secondary'} 
              size="small" 
            />
          </Box>
          
          <Box display="flex" alignItems="center" mb={2}>
            <TextField
              fullWidth
              variant="outlined"
              size="small"
              value={maskedApiKey}
              InputProps={{
                readOnly: true,
                endAdornment: (
                  <Box>
                    <Tooltip title={showApiKey ? "Hide API Key" : "Show API Key"}>
                      <IconButton onClick={toggleShowApiKey} size="small">
                        {showApiKey ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={copySuccess ? "Copied!" : "Copy API Key"}>
                      <IconButton onClick={handleCopy} size="small">
                        <ContentCopyIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                ),
              }}
            />
          </Box>
          
          <Box display="flex" justifyContent="space-between" mb={1}>
            <Typography variant="body2" color="text.secondary">
              Created: {formattedDate}
            </Typography>
            <Button 
              size="small" 
              color="primary" 
              onClick={handleOpenDialog}
            >
              Details
            </Button>
          </Box>
          
          {apiType === 'free' && (
            <Box sx={{ width: '100%', mt: 1 }}>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2">
                  Usage: {count}/{keyUsageLimit}
                </Typography>
                <Typography variant="body2">
                  {Math.round(usagePercentage)}%
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={usagePercentage} 
                color={usagePercentage > 80 ? "error" : "primary"}
                sx={{ height: 8, borderRadius: 4, mt: 0.5 }}
              />
            </Box>
          )}
        </CardContent>
      </Card>

      {/* API Key Details Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>API Key Details</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            <strong>API Key:</strong> {showApiKey ? apiKey : maskedApiKey}
          </Typography>
          <Typography variant="body1" gutterBottom>
            <strong>Type:</strong> {apiType === 'free' ? 'Free Tier' : 'Paid Tier'}
          </Typography>
          <Typography variant="body1" gutterBottom>
            <strong>Usage Count:</strong> {count}
          </Typography>
          {apiType === 'free' && (
            <Typography variant="body1" gutterBottom>
              <strong>Remaining:</strong> {keyUsageLimit - count}
            </Typography>
          )}
          <Typography variant="body1" gutterBottom>
            <strong>Created:</strong> {new Date(createdAt).toLocaleString()}
          </Typography>
          
          {apiType === 'free' && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Usage Limit
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={usagePercentage} 
                color={usagePercentage > 80 ? "error" : "primary"}
                sx={{ height: 10, borderRadius: 5 }}
              />
              <Box display="flex" justifyContent="space-between" mt={0.5}>
                <Typography variant="body2" color="text.secondary">
                  0
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {keyUsageLimit}
                </Typography>
              </Box>
            </Box>
          )}
          
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              How to use this API key
            </Typography>
            <Typography variant="body2" component="div">
              Include this API key in your requests to the LinuxOverApi endpoints:
              <Box 
                component="pre"
                sx={{ 
                  bgcolor: 'background.paper', 
                  p: 2, 
                  borderRadius: 1,
                  overflow: 'auto',
                  mt: 1
                }}
              >
                {`POST /api/v1/scans/scan/{tool_name}
{
  "domain": "example.com",
  "api_key": "${apiKey}"
}`}
              </Box>
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCopy} startIcon={<ContentCopyIcon />}>
            {copySuccess ? 'Copied!' : 'Copy Key'}
          </Button>
          <Button onClick={handleCloseDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ApiKeyDisplay;