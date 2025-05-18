import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Button,
  Card,
  CardContent,
  CardActions,
  Divider,
  Alert,
  Skeleton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
} from '@mui/material';
import { Link } from 'react-router-dom';
import ApiKeyService from '../services/apiKeyService';
import ScanService from '../services/scanService';
import UserService from '../services/userService';
import { useAuth } from '../context/AuthContext';
import ErrorAlert from '../components/common/ErrorAlert';
import { 
  Search as SearchIcon,
  History as HistoryIcon,
  VpnKey as VpnKeyIcon,
  Security as SecurityIcon,
  Check as CheckIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const DashboardPage = () => {
  const { user } = useAuth();
  const [apiKeys, setApiKeys] = useState([]);
  const [scanHistory, setScanHistory] = useState([]);
  const [paidStatus, setPaidStatus] = useState(false);
  const [billAmount, setBillAmount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch API keys
        if (user && user.username) {
          const fetchedApiKeys = await ApiKeyService.getUserApiKeys(user.username);
          setApiKeys(fetchedApiKeys || []);

          // Fetch scan history for the first API key (if available)
          if (fetchedApiKeys && fetchedApiKeys.length > 0) {
            const history = await ScanService.getScanHistory(fetchedApiKeys[0].apikey, 5);
            setScanHistory(history || []);
          }

          // Fetch paid status and bill amount
          const status = await UserService.getPaidStatus(user.username);
          setPaidStatus(status);

          const amount = await UserService.getBillAmount(user.username);
          setBillAmount(amount);
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError(err);
        setShowError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  // Handle error alert close
  const handleErrorClose = () => {
    setShowError(false);
  };

  // Prepare data for the chart
  const prepareChartData = () => {
    // Group scan history by day
    const scansByDay = scanHistory.reduce((acc, scan) => {
      const date = new Date(scan.scan_time).toLocaleDateString();
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    // Sort dates
    const sortedDates = Object.keys(scansByDay).sort((a, b) => new Date(a) - new Date(b));

    return {
      labels: sortedDates,
      datasets: [
        {
          label: 'Scans Per Day',
          data: sortedDates.map(date => scansByDay[date]),
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.4,
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Recent Scan Activity',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
        },
      },
    },
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>

      {/* Error Alert */}
      <ErrorAlert 
        error={error} 
        open={showError} 
        onClose={handleErrorClose} 
      />

      {/* Account Status */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Account Status
        </Typography>
        {loading ? (
          <Skeleton variant="rectangular" height={100} />
        ) : (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box>
                <Typography variant="body1">
                  <strong>Username:</strong> {user?.username}
                </Typography>
                <Typography variant="body1">
                  <strong>Name:</strong> {user?.first_name} {user?.last_name}
                </Typography>
                <Typography variant="body1">
                  <strong>Email:</strong> {user?.email}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box display="flex" flexDirection="column" alignItems="flex-start">
                <Box display="flex" alignItems="center" mb={1}>
                  <Typography variant="body1" mr={1}>
                    <strong>Account Type:</strong>
                  </Typography>
                  <Alert 
                    icon={paidStatus ? <CheckIcon fontSize="inherit" /> : <ErrorIcon fontSize="inherit" />}
                    severity={paidStatus ? "success" : "warning"}
                    sx={{ py: 0 }}
                  >
                    {paidStatus ? "Paid Tier" : "Free Tier"}
                  </Alert>
                </Box>
                {!paidStatus && (
                  <Button 
                    variant="contained" 
                    color="primary" 
                    component={Link} 
                    to="/profile"
                    sx={{ mt: 1 }}
                  >
                    Upgrade to Paid
                  </Button>
                )}
                {paidStatus && (
                  <Typography variant="body1">
                    <strong>Bill Amount:</strong> ${billAmount}
                  </Typography>
                )}
              </Box>
            </Grid>
          </Grid>
        )}
      </Paper>

      {/* Quick Stats */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* API Keys */}
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h6" gutterBottom>
                  API Keys
                </Typography>
                <VpnKeyIcon color="primary" />
              </Box>
              {loading ? (
                <Skeleton variant="rectangular" height={80} />
              ) : (
                <Box>
                  <Typography variant="h4" color="text.primary">
                    {apiKeys.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {apiKeys.length === 0 
                      ? "No API keys generated"
                      : `${apiKeys.filter(key => key.api_type === 'free').length} Free, 
                         ${apiKeys.filter(key => key.api_type === 'paid').length} Paid`}
                  </Typography>
                </Box>
              )}
            </CardContent>
            <Divider />
            <CardActions>
              <Button 
                size="small" 
                component={Link} 
                to="/api-keys"
              >
                Manage Keys
              </Button>
            </CardActions>
          </Card>
        </Grid>

        {/* Recent Scans */}
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h6" gutterBottom>
                  Recent Scans
                </Typography>
                <HistoryIcon color="primary" />
              </Box>
              {loading ? (
                <Skeleton variant="rectangular" height={80} />
              ) : (
                <Box>
                  <Typography variant="h4" color="text.primary">
                    {scanHistory.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {scanHistory.length === 0 
                      ? "No recent scans" 
                      : `Last scan: ${new Date(scanHistory[0]?.scan_time).toLocaleString()}`}
                  </Typography>
                </Box>
              )}
            </CardContent>
            <Divider />
            <CardActions>
              <Button 
                size="small" 
                component={Link} 
                to="/history"
              >
                View History
              </Button>
            </CardActions>
          </Card>
        </Grid>

        {/* New Scan */}
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h6" gutterBottom>
                  Security Scans
                </Typography>
                <SecurityIcon color="primary" />
              </Box>
              {loading ? (
                <Skeleton variant="rectangular" height={80} />
              ) : (
                <Box>
                  <Typography variant="body1" color="text.primary" gutterBottom>
                    Run security scans on your domains
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {paidStatus 
                      ? "Access to all security tools" 
                      : "Basic tools available in free tier"}
                  </Typography>
                </Box>
              )}
            </CardContent>
            <Divider />
            <CardActions>
              <Button 
                size="small" 
                component={Link} 
                to="/scan"
                startIcon={<SearchIcon />}
              >
                New Scan
              </Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>

      {/* Scan Activity and Tools */}
      <Grid container spacing={3}>
        {/* Scan Activity Chart */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, height: 300 }}>
            <Typography variant="h6" gutterBottom>
              Scan Activity
            </Typography>
            {loading ? (
              <Box display="flex" justifyContent="center" alignItems="center" height="80%">
                <CircularProgress />
              </Box>
            ) : scanHistory.length === 0 ? (
              <Box display="flex" justifyContent="center" alignItems="center" height="80%">
                <Typography variant="body1" color="text.secondary">
                  No scan data to display
                </Typography>
              </Box>
            ) : (
              <Box height="85%">
                <Line data={prepareChartData()} options={chartOptions} />
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Available Tools */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: 300, overflow: 'auto' }}>
            <Typography variant="h6" gutterBottom>
              Available Tools
            </Typography>
            {loading ? (
              <Skeleton variant="rectangular" height={200} />
            ) : (
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <CheckIcon color="success" />
                  </ListItemIcon>
                  <ListItemText primary="DNS Lookup (dig)" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckIcon color="success" />
                  </ListItemIcon>
                  <ListItemText primary="Network Scanner (nmap)" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckIcon color="success" />
                  </ListItemIcon>
                  <ListItemText primary="Web Tech Identifier (whatweb)" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    {paidStatus ? <CheckIcon color="success" /> : <ErrorIcon color="disabled" />}
                  </ListItemIcon>
                  <ListItemText 
                    primary="SSL/TLS Scanner (sslscan)" 
                    secondary={!paidStatus ? "Paid tier only" : ""}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    {paidStatus ? <CheckIcon color="success" /> : <ErrorIcon color="disabled" />}
                  </ListItemIcon>
                  <ListItemText 
                    primary="Subdomain Discovery (subfinder)" 
                    secondary={!paidStatus ? "Paid tier only" : ""}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    {paidStatus ? <CheckIcon color="success" /> : <ErrorIcon color="disabled" />}
                  </ListItemIcon>
                  <ListItemText 
                    primary="WordPress Scanner (wpscan)" 
                    secondary={!paidStatus ? "Paid tier only" : ""}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    {paidStatus ? <CheckIcon color="success" /> : <ErrorIcon color="disabled" />}
                  </ListItemIcon>
                  <ListItemText 
                    primary="Vulnerability Scanner (nuclei)" 
                    secondary={!paidStatus ? "Paid tier only" : ""}
                  />
                </ListItem>
              </List>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardPage;