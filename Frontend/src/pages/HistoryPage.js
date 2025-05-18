import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Divider,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import ApiKeyService from '../services/apiKeyService';
import ScanService from '../services/scanService';
import { useAuth } from '../context/AuthContext';
import ErrorAlert from '../components/common/ErrorAlert';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend);

const HistoryPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [apiKeys, setApiKeys] = useState([]);
  const [selectedApiKey, setSelectedApiKey] = useState('');
  const [scanHistory, setScanHistory] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showError, setShowError] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [toolFilter, setToolFilter] = useState('all');
  
  // Tool colors for the chart
  const toolColors = {
    dig: 'rgba(54, 162, 235, 0.8)',
    nmap: 'rgba(255, 99, 132, 0.8)',
    whatweb: 'rgba(75, 192, 192, 0.8)',
    sslscan: 'rgba(153, 102, 255, 0.8)',
    subfinder: 'rgba(255, 159, 64, 0.8)',
    wpscan: 'rgba(255, 206, 86, 0.8)',
    nuclei: 'rgba(199, 199, 199, 0.8)',
  };

  // Fetch API keys on component mount
  useEffect(() => {
    const fetchApiKeys = async () => {
      try {
        setLoading(true);
        
        if (user && user.username) {
          const fetchedApiKeys = await ApiKeyService.getUserApiKeys(user.username);
          setApiKeys(fetchedApiKeys || []);
          
          // Auto-select the first API key if available
          if (fetchedApiKeys && fetchedApiKeys.length > 0) {
            setSelectedApiKey(fetchedApiKeys[0].apikey);
          }
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
  
  // Fetch scan history when an API key is selected
  useEffect(() => {
    const fetchScanHistory = async () => {
      if (!selectedApiKey) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const history = await ScanService.getScanHistory(selectedApiKey, 100); // Get up to 100 scan records
        setScanHistory(history || []);
        setFilteredHistory(history || []);
        setPage(0); // Reset to first page when data changes
      } catch (err) {
        console.error('Error fetching scan history:', err);
        setError(err);
        setShowError(true);
      } finally {
        setLoading(false);
      }
    };
    
    fetchScanHistory();
  }, [selectedApiKey]);
  
  // Apply filters when search term or tool filter changes
  useEffect(() => {
    let filtered = [...scanHistory];
    
    // Apply tool filter if not 'all'
    if (toolFilter !== 'all') {
      filtered = filtered.filter(scan => scan.tool === toolFilter);
    }
    
    // Apply search term filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(scan => 
        scan.domain.toLowerCase().includes(term) ||
        scan.tool.toLowerCase().includes(term)
      );
    }
    
    setFilteredHistory(filtered);
    setPage(0); // Reset to first page when filters change
  }, [scanHistory, searchTerm, toolFilter]);
  
  // Handle API key selection change
  const handleApiKeyChange = (event) => {
    setSelectedApiKey(event.target.value);
  };
  
  // Handle search term change
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };
  
  // Clear search term
  const handleClearSearch = () => {
    setSearchTerm('');
  };
  
  // Handle tool filter change
  const handleToolFilterChange = (event) => {
    setToolFilter(event.target.value);
  };
  
  // Handle pagination changes
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // Handle view scan result
  const handleViewResult = (scanId) => {
    navigate(`/results/${scanId}?api_key=${selectedApiKey}`);
  };
  
  // Handle error alert close
  const handleErrorClose = () => {
    setShowError(false);
  };
  
  // Prepare data for the pie chart
  const prepareChartData = () => {
    // Count scans by tool
    const toolCounts = scanHistory.reduce((acc, scan) => {
      acc[scan.tool] = (acc[scan.tool] || 0) + 1;
      return acc;
    }, {});
    
    // Generate labels and data arrays
    const labels = Object.keys(toolCounts);
    const data = labels.map(tool => toolCounts[tool]);
    const backgroundColor = labels.map(tool => toolColors[tool] || 'rgba(128, 128, 128, 0.8)');
    
    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor,
          borderWidth: 1,
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
  
  // Download scan history
  const handleDownloadHistory = () => {
    const csvContent = [
      // CSV Header
      ['Scan ID', 'Domain', 'Tool', 'Date', 'Time'].join(','),
      // CSV Data
      ...filteredHistory.map(scan => {
        const date = new Date(scan.scan_time);
        return [
          scan.id,
          scan.domain,
          scan.tool,
          date.toLocaleDateString(),
          date.toLocaleTimeString()
        ].join(',');
      })
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scan-history-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Scan History
      </Typography>
      
      {/* Error Alert */}
      <ErrorAlert 
        error={error} 
        open={showError} 
        onClose={handleErrorClose} 
      />
      
      {/* API Key Selection */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <FormControl fullWidth>
              <InputLabel id="api-key-select-label">Select API Key</InputLabel>
              <Select
                labelId="api-key-select-label"
                id="api-key-select"
                value={selectedApiKey}
                onChange={handleApiKeyChange}
                label="Select API Key"
                disabled={loading || apiKeys.length === 0}
              >
                {apiKeys.map((key) => (
                  <MenuItem key={key.id} value={key.apikey}>
                    {`${key.apikey.substring(0, 8)}... (${key.api_type})`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box display="flex" justifyContent="flex-end" height="100%" alignItems="center">
              <Button
                variant="contained"
                color="primary"
                startIcon={<DownloadIcon />}
                onClick={handleDownloadHistory}
                disabled={filteredHistory.length === 0 || loading}
              >
                Export CSV
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      {loading ? (
        <Box display="flex" justifyContent="center" my={5}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Stats and Filters */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            {/* Stats */}
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Scan Statistics
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  {scanHistory.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" align="center">
                      No scan data available
                    </Typography>
                  ) : (
                    <>
                      <Box height="200px">
                        <Pie data={prepareChartData()} options={chartOptions} />
                      </Box>
                      <Box mt={2}>
                        <Typography variant="body2">
                          <strong>Total Scans:</strong> {scanHistory.length}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Unique Domains:</strong> {new Set(scanHistory.map(scan => scan.domain)).size}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Latest Scan:</strong> {scanHistory.length > 0 ? new Date(scanHistory[0].scan_time).toLocaleString() : 'N/A'}
                        </Typography>
                      </Box>
                    </>
                  )}
                </CardContent>
              </Card>
            </Grid>
            
            {/* Filters */}
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Filter Scans
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={8}>
                      <TextField
                        fullWidth
                        placeholder="Search by domain or tool..."
                        value={searchTerm}
                        onChange={handleSearchChange}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <SearchIcon />
                            </InputAdornment>
                          ),
                          endAdornment: searchTerm && (
                            <InputAdornment position="end">
                              <IconButton onClick={handleClearSearch} edge="end">
                                <ClearIcon />
                              </IconButton>
                            </InputAdornment>
                          )
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <FormControl fullWidth>
                        <InputLabel id="tool-filter-label">Tool</InputLabel>
                        <Select
                          labelId="tool-filter-label"
                          id="tool-filter"
                          value={toolFilter}
                          onChange={handleToolFilterChange}
                          label="Tool"
                        >
                          <MenuItem value="all">All Tools</MenuItem>
                          <MenuItem value="dig">dig (DNS)</MenuItem>
                          <MenuItem value="nmap">nmap (Network)</MenuItem>
                          <MenuItem value="whatweb">whatweb (Web)</MenuItem>
                          <MenuItem value="sslscan">sslscan (SSL/TLS)</MenuItem>
                          <MenuItem value="subfinder">subfinder (Subdomain)</MenuItem>
                          <MenuItem value="wpscan">wpscan (WordPress)</MenuItem>
                          <MenuItem value="nuclei">nuclei (Vulnerability)</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                  
                  <Box mt={2}>
                    <Typography variant="body2">
                      {filteredHistory.length} {filteredHistory.length === 1 ? 'result' : 'results'} found
                      {searchTerm && ` for "${searchTerm}"`}
                      {toolFilter !== 'all' && ` with tool "${toolFilter}"`}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
          
          {/* Scan History Table */}
          <Paper>
            {scanHistory.length === 0 ? (
              <Box p={3} textAlign="center">
                <Typography variant="body1" color="text.secondary" gutterBottom>
                  No scan history found for this API key
                </Typography>
                <Button 
                  variant="outlined" 
                  color="primary"
                  onClick={() => navigate('/scan')}
                  sx={{ mt: 1 }}
                >
                  Run Your First Scan
                </Button>
              </Box>
            ) : (
              <>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Scan ID</TableCell>
                        <TableCell>Domain</TableCell>
                        <TableCell>Tool</TableCell>
                        <TableCell>Date & Time</TableCell>
                        <TableCell align="center">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredHistory
                        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                        .map((scan) => (
                          <TableRow key={scan.id}>
                            <TableCell>{scan.id}</TableCell>
                            <TableCell>{scan.domain}</TableCell>
                            <TableCell>
                              <Chip 
                                label={scan.tool} 
                                size="small"
                                style={{ 
                                  backgroundColor: toolColors[scan.tool] || 'grey',
                                  color: 'white'
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              {new Date(scan.scan_time).toLocaleString()}
                            </TableCell>
                            <TableCell align="center">
                              <IconButton 
                                color="primary"
                                onClick={() => handleViewResult(scan.id)}
                                size="small"
                              >
                                <VisibilityIcon />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                
                <TablePagination
                  component="div"
                  count={filteredHistory.length}
                  page={page}
                  onPageChange={handleChangePage}
                  rowsPerPage={rowsPerPage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  rowsPerPageOptions={[5, 10, 25, 50]}
                />
              </>
            )}
          </Paper>
        </>
      )}
    </Box>
  );
};

export default HistoryPage;