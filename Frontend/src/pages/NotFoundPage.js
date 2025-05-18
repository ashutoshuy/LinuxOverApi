import React from 'react';
import { Box, Button, Typography, Container, Paper } from '@mui/material';
import { Link } from 'react-router-dom';
import SearchOffIcon from '@mui/icons-material/SearchOff';

const NotFoundPage = () => {
  return (
    <Container maxWidth="md">
      <Paper 
        elevation={3} 
        sx={{ 
          py: 6, 
          px: 4, 
          mt: 8, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center' 
        }}
      >
        <SearchOffIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
        
        <Typography variant="h3" component="h1" align="center" gutterBottom>
          404
        </Typography>
        
        <Typography variant="h5" component="h2" align="center" gutterBottom>
          Page Not Found
        </Typography>
        
        <Typography variant="body1" align="center" color="text.secondary" paragraph>
          The page you are looking for doesn't exist or has been moved.
        </Typography>
        
        <Box mt={3} display="flex" justifyContent="center">
          <Button 
            variant="contained" 
            color="primary" 
            component={Link} 
            to="/dashboard"
          >
            Go to Dashboard
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default NotFoundPage;