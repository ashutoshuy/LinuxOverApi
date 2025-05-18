import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
  Card,
  CardContent,
  Grid,
  Divider,
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Shield as ShieldIcon,
} from '@mui/icons-material';
import ApiKeyService from '../services/apiKeyService';
import UserService from '../services/userService';
import { useAuth } from '../context/AuthContext';
import ErrorAlert from '../components/common/ErrorAlert';
import { Pie, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

// Register ChartJS components
ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// Admin secret key (in a real app, this would be stored securely, not hardcoded)
const ADMIN_SECRET_KEY = "admin-secret-key";

const AdminPage = () => {
  const { user, isAdmin } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [users, setUsers] = useState([]);
  const [apiKeys, setApiKeys] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showError, setShowError] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [filteredApiKeys, setFilteredApiKeys] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmDialogAction, setConfirmDialogAction] = useState(null);
  const [confirmDialogData, setConfirmDialogData] = useState(null);
  
  // Stats
  const [userStats, setUserStats] = useState({
    total: 0,
    paid: 0,
    free: 0,
  });
  
  const [apiKeyStats, setApiKeyStats] = useState({
    total: 0,
    paid: 0,
    free: 0,
    totalUsage: 0,
  });

  // Tool colors for the chart
  const colorPalette = {
    blue: 'rgba(54, 162, 235, 0.8)',
    red: 'rgba(255, 99, 132, 0.8)',
    green: 'rgba(75, 192, 192, 0.8)',
    purple: 'rgba(153, 102, 255, 0.8)',
    orange: 'rgba(255, 159, 64, 0.8)',
    yellow: 'rgba(255, 206, 86, 0.8)',
    grey: 'rgba(199, 199, 199, 0.8)',
  };

  // Fetch data on component mount
  useEffect(() => {
    if (!isAdmin()) return;
    
    fetchData();
  }, [isAdmin]);

  // Apply search filter when search term changes
  useEffect(() => {
    if (tabValue === 0) {
      // Filter users
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const filtered = users.filter(user => 
          user.username.toLowerCase().includes(term) ||
          user.email.toLowerCase().includes(term) ||
          user.first_name.toLowerCase().includes(term) ||
          user.last_name.toLowerCase().includes(term)
        );
        setFilteredUsers(filtered);
      } else {
        setFilteredUsers(users);
      }
    } else {
      // Filter API keys
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const filtered = apiKeys.filter(key => 
          key.apikey.toLowerCase().includes(term) ||
          key.username.toLowerCase().includes(term) ||
          key.api_type.toLowerCase().includes(term)
        );
        setFilteredApiKeys(filtered);
      } else {
        setFilteredApiKeys(apiKeys);
      }
    }
    
    // Reset pagination
    setPage(0);
  }, [searchTerm, users, apiKeys, tabValue]);

  // Calculate stats when data changes
  useEffect(() => {
    // User stats
    setUserStats({
      total: users.length,
      paid: users.filter(user => user.is_paid).length,
      free: users.filter(user => !user.is_paid).length,
    });
    
    // API key stats
    setApiKeyStats({
      total: apiKeys.length,
      paid: apiKeys.filter(key => key.api_type === 'paid').length,
      free: apiKeys.filter(key => key.api_type === 'free').length,
      totalUsage: apiKeys.reduce((total, key) => total + (key.count || 0), 0),
    });
  }, [users, apiKeys]);

  // Fetch all users and API keys
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch all users
      const allUsers = await UserService.getAllUsers(ADMIN_SECRET_KEY);
      setUsers(allUsers || []);
      setFilteredUsers(allUsers || []);
      
      // Fetch all API keys
      const allApiKeys = await ApiKeyService.getAllApiKeys(ADMIN_SECRET_KEY);
      setApiKeys(allApiKeys || []);
      setFilteredApiKeys(allApiKeys || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err);
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setSearchTerm('');
  };

  // Handle search term change
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  // Clear search term
  const handleClearSearch = () => {
    setSearchTerm('');
  };

  // Handle pagination changes
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handle error alert close
  const handleErrorClose = () => {
    setShowError(false);
  };

  // Handle confirm dialog open
  const handleOpenConfirmDialog = (action, data) => {
    setConfirmDialogAction(action);
    setConfirmDialogData(data);
    setConfirmDialogOpen(true);
  };

  // Handle confirm dialog close
  const handleCloseConfirmDialog = () => {
    setConfirmDialogOpen(false);
    setConfirmDialogAction(null);
    setConfirmDialogData(null);
  };

  // Handle confirm dialog action
  const handleConfirmAction = async () => {
    if (!confirmDialogAction || !confirmDialogData) return;
    
    try {
      setLoading(true);
      
      switch (confirmDialogAction) {
        case 'incrementApiKey':
          await ApiKeyService.incrementApiKeyCount(confirmDialogData.apikey, ADMIN_SECRET_KEY);
          break;
        // Add more actions as needed
        default:
          break;
      }
      
      // Refresh data
      await fetchData();
      
      // Close dialog
      handleCloseConfirmDialog();
    } catch (err) {
      console.error('Action failed:', err);
      setError(err);
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

  // Prepare data for the user pie chart
  const userPieData = {
    labels: ['Paid Users', 'Free Users'],
    datasets: [
      {
        data: [userStats.paid, userStats.free],
        backgroundColor: [colorPalette.green, colorPalette.blue],
        borderWidth: 1,
      },
    ],
  };

  // Prepare data for the API key pie chart
  const apiKeyPieData = {
    labels: ['Paid Keys', 'Free Keys'],
    datasets: [
      {
        data: [apiKeyStats.paid, apiKeyStats.free],
        backgroundColor: [colorPalette.purple, colorPalette.orange],
        borderWidth: 1,
      },
    ],
  };

  // Prepare data for usage bar chart
  const prepareUsageBarData = () => {
    // Group API keys by username and calculate total usage per user
    const usageByUser = apiKeys.reduce((acc, key) => {
      if (!acc[key.username]) {
        acc[key.username] = 0;
      }
      acc[key.username] += (key.count || 0);
      return acc;
    }, {});
    
    // Convert to arrays and sort by usage (descending)
    const sortedUsers = Object.keys(usageByUser).sort((a, b) => usageByUser[b] - usageByUser[a]);
    
    // Take top 5 users
    const topUsers = sortedUsers.slice(0, 5);
    const topUsersData = topUsers.map(username => usageByUser[username]);
    
    return {
      labels: topUsers,
      datasets: [
        {
          label: 'API Usage Count',
          data: topUsersData,
          backgroundColor: colorPalette.blue,
        },
      ],
    };
  };

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
      },
    },
  };

  // Bar chart options
  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Top 5 Users by API Usage',
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
      <Box display="flex" alignItems="center" mb={3}>
        <ShieldIcon fontSize="large" sx={{ mr: 1, color: 'primary.main' }} />
        <Typography variant="h4">
          Admin Panel
        </Typography>
      </Box>

      {/* Error Alert */}
      <ErrorAlert 
        error={error} 
        open={showError} 
        onClose={handleErrorClose} 
      />

      {/* Dashboard */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          System Overview
        </Typography>
        <Divider sx={{ mb: 3 }} />
        
        <Grid container spacing={3}>
          {/* User Stats */}
          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  User Statistics
                </Typography>
                <Box height="180px">
                  <Pie data={userPieData} options={chartOptions} />
                </Box>
                <Box mt={2}>
                  <Typography variant="body2">
                    <strong>Total Users:</strong> {userStats.total}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Paid Users:</strong> {userStats.paid} ({userStats.total > 0 ? Math.round((userStats.paid / userStats.total) * 100) : 0}%)
                  </Typography>
                  <Typography variant="body2">
                    <strong>Free Users:</strong> {userStats.free} ({userStats.total > 0 ? Math.round((userStats.free / userStats.total) * 100) : 0}%)
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          {/* API Key Stats */}
          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  API Key Statistics
                </Typography>
                <Box height="180px">
                  <Pie data={apiKeyPieData} options={chartOptions} />
                </Box>
                <Box mt={2}>
                  <Typography variant="body2">
                    <strong>Total API Keys:</strong> {apiKeyStats.total}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Paid Keys:</strong> {apiKeyStats.paid} ({apiKeyStats.total > 0 ? Math.round((apiKeyStats.paid / apiKeyStats.total) * 100) : 0}%)
                  </Typography>
                  <Typography variant="body2">
                    <strong>Free Keys:</strong> {apiKeyStats.free} ({apiKeyStats.total > 0 ? Math.round((apiKeyStats.free / apiKeyStats.total) * 100) : 0}%)
                  </Typography>
                  <Typography variant="body2">
                    <strong>Total Usage:</strong> {apiKeyStats.totalUsage} requests
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Top Users by Usage */}
          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  Top Users by API Usage
                </Typography>
                <Box height="180px">
                  <Bar 
                    data={prepareUsageBarData()} 
                    options={barChartOptions} 
                  />
                </Box>
                <Box mt={2}>
                  <Typography variant="body2">
                    <strong>Average Usage Per Key:</strong> {apiKeyStats.total > 0 ? Math.round(apiKeyStats.totalUsage / apiKeyStats.total) : 0} requests
                  </Typography>
                  <Typography variant="body2">
                    <strong>Average Keys Per User:</strong> {userStats.total > 0 ? Math.round(apiKeyStats.total / userStats.total * 10) / 10 : 0} keys
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>

      {/* Tabs for Users and API Keys */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="admin tabs"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Users" id="tab-0" />
          <Tab label="API Keys" id="tab-1" />
        </Tabs>
        
        {/* Search and Refresh */}
        <Box p={2} display="flex" justifyContent="space-between" alignItems="center">
          <TextField
            placeholder={tabValue === 0 ? "Search users..." : "Search API keys..."}
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={handleSearchChange}
            sx={{ width: 300 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <IconButton onClick={handleClearSearch} edge="end" size="small">
                    <ClearIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <Button
            startIcon={<RefreshIcon />}
            onClick={fetchData}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>
        
        {/* Users Tab */}
        <div role="tabpanel" hidden={tabValue !== 0}>
          {tabValue === 0 && (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Username</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Mobile</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Bill Amount</TableCell>
                    <TableCell>Created At</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        <CircularProgress size={30} sx={{ my: 2 }} />
                      </TableCell>
                    </TableRow>
                  ) : filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>{user.username}</TableCell>
                          <TableCell>{user.first_name} {user.last_name}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>{user.mobile_no}</TableCell>
                          <TableCell>
                            <Chip 
                              label={user.is_paid ? "Paid" : "Free"} 
                              color={user.is_paid ? "success" : "primary"}
                              size="small" 
                            />
                          </TableCell>
                          <TableCell>${user.bill_amount || 0}</TableCell>
                          <TableCell>{new Date(user.created_at).toLocaleString()}</TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
              <TablePagination
                component="div"
                count={filteredUsers.length}
                page={page}
                onPageChange={handleChangePage}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                rowsPerPageOptions={[5, 10, 25, 50]}
              />
            </TableContainer>
          )}
        </div>
        
        {/* API Keys Tab */}
        <div role="tabpanel" hidden={tabValue !== 1}>
          {tabValue === 1 && (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>API Key</TableCell>
                    <TableCell>Username</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Usage Count</TableCell>
                    <TableCell>Created At</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <CircularProgress size={30} sx={{ my: 2 }} />
                      </TableCell>
                    </TableRow>
                  ) : filteredApiKeys.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        No API keys found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredApiKeys
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((key) => (
                        <TableRow key={key.id}>
                          <TableCell>{key.apikey.substring(0, 12)}...</TableCell>
                          <TableCell>{key.username}</TableCell>
                          <TableCell>
                            <Chip 
                              label={key.api_type} 
                              color={key.api_type === 'paid' ? "secondary" : "primary"}
                              size="small" 
                            />
                          </TableCell>
                          <TableCell>{key.count || 0}</TableCell>
                          <TableCell>{new Date(key.created_at).toLocaleString()}</TableCell>
                          <TableCell align="center">
                            <Button
                              size="small"
                              onClick={() => handleOpenConfirmDialog('incrementApiKey', key)}
                            >
                              Increment Count
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
              <TablePagination
                component="div"
                count={filteredApiKeys.length}
                page={page}
                onPageChange={handleChangePage}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                rowsPerPageOptions={[5, 10, 25, 50]}
              />
            </TableContainer>
          )}
        </div>
      </Paper>

      {/* Confirm Dialog */}
      <Dialog
        open={confirmDialogOpen}
        onClose={handleCloseConfirmDialog}
      >
        <DialogTitle>Confirm Action</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {confirmDialogAction === 'incrementApiKey' && (
              `Are you sure you want to increment the usage count for API key ${confirmDialogData?.apikey.substring(0, 12)}...?`
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirmDialog} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmAction} 
            color="primary" 
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminPage;