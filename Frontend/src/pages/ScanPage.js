import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  CircularProgress,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Alert,
  AlertTitle,
  Tabs,
  Tab,
  FormHelperText,
  IconButton,
  Tooltip,
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import SearchIcon from '@mui/icons-material/Search';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { useNavigate, useParams } from 'react-router-dom';
import ApiKeyService from '../services/apiKeyService';
import ScanService from '../services/scanService';
import UserService from '../services/userService';
import { useAuth } from '../context/AuthContext';
import ErrorAlert from '../components/common/ErrorAlert';

// Define tool descriptions
const toolDescriptions = {
  dig: "DNS lookup tool that queries DNS servers for information about domain names, IP addresses, mail exchanges, and related information.",
  nmap: "Network scanning tool that discovers hosts and services on a network, creating a map of the network structure.",
  whatweb: "Web scanning tool that identifies web technologies, including content management systems, blogging platforms, web frameworks, and server details.",
  sslscan: "SSL/TLS scanning tool that identifies SSL/TLS related issues, certificate information, and supported cipher suites.",
  subfinder: "Subdomain discovery tool that finds valid subdomains of websites using passive online sources.",
  wpscan: "WordPress vulnerability scanner that checks for vulnerable themes, plugins, and other security issues in WordPress installations.",
  nuclei: "Vulnerability scanner that uses templates to detect security vulnerabilities, misconfigurations, and security issues.",
};

// Tool category mapping
const toolCategories = {
  dig: "DNS",
  nmap: "Network",
  whatweb: "Web",
  sslscan: "Security",
  subfinder: "Discovery",
  wpscan: "CMS",
  nuclei: "Vulnerability",
};

// Define free tier tools
const freeTierTools = ['dig', 'nmap', 'whatweb'];

const ScanPage = () => {
  const { user } = useAuth();
  const { toolName } = useParams();
  const navigate = useNavigate();
  
  const [domain, setDomain] = useState('');
  const [selectedTool, setSelectedTool] = useState(toolName || 'dig');
  const [apiKeys, setApiKeys] = useState([]);
  const [selectedApiKey, setSelectedApiKey] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showError, setShowError] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [paidStatus, setPaidStatus] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [copySuccess, setCopySuccess] = useState(false);

  // Fetch user data on load
  useEffect(() => {
    const fetchData = async () => {
      try {
        setDataLoading(true);
        setError(null);

        if (user && user.username) {
          // Fetch API keys
          const fetchedApiKeys = await ApiKeyService.getUserApiKeys(user.username);
          setApiKeys(fetchedApiKeys || []);
          
          // Auto-select the first API key if available
          if (fetchedApiKeys && fetchedApiKeys.length > 0) {
            setSelectedApiKey(fetchedApiKeys[0].apikey);
          }

          // Fetch paid status
          const status = await UserService.getPaidStatus(user.username);
          setPaidStatus(status);
          
          // If a tool was specified in the URL, select it
          if (toolName) {
            setSelectedTool(toolName);
          }
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err);
        setShowError(true);
      } finally {
        setDataLoading(false);
      }
    };

    fetchData();
  }, [user, toolName]);

  // Handle domain input change
  const handleDomainChange = (event) => {
    setDomain(event.target.value);
    // Clear domain error when user types
    if (formErrors.domain) {
      setFormErrors({
        ...formErrors,
        domain: '',
      });
    }
  };

  // Handle tool selection change
  const handleToolChange = (event) => {
    setSelectedTool(event.target.value);
    setScanResult(null); // Clear previous results
    
    // Update URL to reflect selected tool
    navigate(`/scan/${event.target.value}`);
  };

  // Handle API key selection change
  const handleApiKeyChange = (event) => {
    setSelectedApiKey(event.target.value);
    // Clear API key error when user selects a key
    if (formErrors.apiKey) {
      setFormErrors({
        ...formErrors,
        apiKey: '',
      });
    }
  };

  // Handle form submission
  const handleSubmit = async (event) => {
    event.preventDefault();
    
    // Validate form
    const errors = {};
    if (!domain.trim()) {
      errors.domain = 'Domain is required';
    } else if (!/^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/.test(domain.trim())) {
      errors.domain = 'Please enter a valid domain (e.g., example.com)';
    }
    
    if (!selectedApiKey) {
      errors.apiKey = 'Please select an API key';
    }
    
    // Check if selected tool is available for user's tier
    if (!paidStatus && !freeTierTools.includes(selectedTool)) {
      errors.tool = 'This tool is only available in the paid tier';
    }
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    // Clear any previous errors
    setFormErrors({});
    setError(null);
    setShowError(false);
    
    try {
      setLoading(true);
      setScanResult(null);
      
      // Execute scan
      const result = await ScanService.executeScan(selectedTool, domain.trim(), selectedApiKey);
      
      // Process and set scan result
      setScanResult(result);
      setTabValue(0); // Switch to the result tab
    } catch (err) {
      console.error('Scan failed:', err);
      setError(err);
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

  // Handle error alert close
  const handleErrorClose = () => {
    setShowError(false);
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Handle copy to clipboard
  const handleCopyResult = () => {
    if (scanResult) {
      navigator.clipboard.writeText(scanResult.result);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  // Find the selected API key object for usage information
  const selectedKeyObject = apiKeys.find(key => key.apikey === selectedApiKey);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Security Scan
      </Typography>

      {/* Error Alert */}
      <ErrorAlert 
        error={error} 
        open={showError} 
        onClose={handleErrorClose} 
      />

      <Grid container spacing={3}>
        {/* Scan Configuration */}
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Scan Configuration
            </Typography>
            <Box component="form" onSubmit={handleSubmit}>
              {/* Domain Input */}
              <TextField
                margin="normal"
                required
                fullWidth
                id="domain"
                label="Domain"
                name="domain"
                placeholder="example.com"
                value={domain}
                onChange={handleDomainChange}
                error={!!formErrors.domain}
                helperText={formErrors.domain}
                disabled={loading || dataLoading}
              />

              {/* Tool Selection */}
              <FormControl 
                fullWidth 
                margin="normal"
                error={!!formErrors.tool}
              >
                <InputLabel id="tool-select-label">Security Tool</InputLabel>
                <Select
                  labelId="tool-select-label"
                  id="tool-select"
                  value={selectedTool}
                  onChange={handleToolChange}
                  label="Security Tool"
                  disabled={loading || dataLoading}
                >
                  {Object.keys(toolDescriptions).map((tool) => (
                    <MenuItem 
                      key={tool} 
                      value={tool}
                      disabled={!paidStatus && !freeTierTools.includes(tool)}
                    >
                      {`${tool} (${toolCategories[tool]})`}
                    </MenuItem>
                  ))}
                </Select>
                {!!formErrors.tool && (
                  <FormHelperText>{formErrors.tool}</FormHelperText>
                )}
                {!paidStatus && !freeTierTools.includes(selectedTool) && (
                  <FormHelperText error>
                    This tool requires a paid subscription
                  </FormHelperText>
                )}
              </FormControl>

              {/* API Key Selection */}
              <FormControl 
                fullWidth 
                margin="normal"
                error={!!formErrors.apiKey}
              >
                <InputLabel id="api-key-select-label">API Key</InputLabel>
                <Select
                  labelId="api-key-select-label"
                  id="api-key-select"
                  value={selectedApiKey}
                  onChange={handleApiKeyChange}
                  label="API Key"
                  disabled={loading || dataLoading || apiKeys.length === 0}
                >
                  {apiKeys.map((key) => (
                    <MenuItem 
                      key={key.id} 
                      value={key.apikey}
                      disabled={
                        // Disable free tier keys that reached limit
                        key.api_type === 'free' && key.count >= 15
                      }
                    >
                      {`${key.apikey.substring(0, 8)}... (${key.api_type})`}
                    </MenuItem>
                  ))}
                </Select>
                {!!formErrors.apiKey && (
                  <FormHelperText>{formErrors.apiKey}</FormHelperText>
                )}
                {selectedKeyObject && selectedKeyObject.api_type === 'free' && (
                  <FormHelperText>
                    {`Usage: ${selectedKeyObject.count || 0}/15`}
                  </FormHelperText>
                )}
                {apiKeys.length === 0 && (
                  <FormHelperText error>
                    No API keys available. Please generate an API key first.
                  </FormHelperText>
                )}
              </FormControl>

              {/* Submit Button */}
              <Button
                type="submit"
                fullWidth
                variant="contained"
                color="primary"
                disabled={loading || dataLoading || apiKeys.length === 0}
                startIcon={loading ? <CircularProgress size={20} /> : <SearchIcon />}
                sx={{ mt: 3 }}
              >
                {loading ? 'Scanning...' : 'Execute Scan'}
              </Button>
            </Box>

            {/* Tool Description */}
            <Box mt={4}>
              <Typography variant="subtitle1" gutterBottom>
                Tool Information
              </Typography>
              <Card variant="outlined">
                <CardHeader
                  title={selectedTool}
                  subheader={`Category: ${toolCategories[selectedTool]}`}
                />
                <Divider />
                <CardContent>
                  <Typography variant="body2" color="text.secondary">
                    {toolDescriptions[selectedTool]}
                  </Typography>
                </CardContent>
              </Card>
            </Box>

            {/* Tier Information */}
            <Box mt={4}>
              {!paidStatus ? (
                <Alert severity="info">
                  <AlertTitle>Free Tier Limitations</AlertTitle>
                  You have access to basic security tools (dig, nmap, whatweb) with a limit of 15 scans per API key.
                  <Button 
                    color="primary" 
                    size="small" 
                    sx={{ mt: 1 }}
                    onClick={() => navigate('/profile')}
                  >
                    Upgrade to Paid Tier
                  </Button>
                </Alert>
              ) : (
                <Alert severity="success">
                  <AlertTitle>Paid Tier Active</AlertTitle>
                  You have access to all security tools with unlimited scans.
                </Alert>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Scan Results */}
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                Scan Results
              </Typography>
              {scanResult && (
                <Tooltip title={copySuccess ? "Copied!" : "Copy Results"}>
                  <IconButton onClick={handleCopyResult}>
                    <ContentCopyIcon />
                  </IconButton>
                </Tooltip>
              )}
            </Box>

            {loading ? (
              <Box display="flex" flexDirection="column" alignItems="center" my={8}>
                <CircularProgress size={60} />
                <Typography variant="body1" sx={{ mt: 2 }}>
                  Scanning {domain} with {selectedTool}...
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  This may take a few moments
                </Typography>
              </Box>
            ) : scanResult ? (
              <Box>
                <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                  <Tabs 
                    value={tabValue} 
                    onChange={handleTabChange}
                    aria-label="scan result tabs"
                  >
                    <Tab label="Results" id="tab-0" />
                    <Tab label="Details" id="tab-1" />
                  </Tabs>
                </Box>

                {/* Results Tab */}
                <div role="tabpanel" hidden={tabValue !== 0}>
                  {tabValue === 0 && (
                    <Box>
                      <Box display="flex" justifyContent="space-between" mb={2}>
                        <Typography variant="subtitle1">
                          Tool: {scanResult.tool}
                        </Typography>
                        <Typography variant="subtitle1">
                          Domain: {scanResult.domain}
                        </Typography>
                      </Box>
                      <Box 
                        sx={{ 
                          bgcolor: 'background.paper',
                          borderRadius: 1,
                          p: 2,
                          maxHeight: '400px',
                          overflow: 'auto',
                          fontFamily: 'monospace',
                          fontSize: '0.875rem',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-all'
                        }}
                      >
                        {scanResult.result}
                      </Box>
                    </Box>
                  )}
                </div>

                {/* Details Tab */}
                <div role="tabpanel" hidden={tabValue !== 1}>
                  {tabValue === 1 && (
                    <Box>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">
                            <strong>Scan ID:</strong> {scanResult.id}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">
                            <strong>API Key:</strong> {selectedApiKey.substring(0, 8)}...
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">
                            <strong>Tool:</strong> {scanResult.tool}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">
                            <strong>Domain:</strong> {scanResult.domain}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">
                            <strong>Scan Time:</strong> {new Date(scanResult.scan_time).toLocaleString()}
                          </Typography>
                        </Grid>
                        <Grid item xs={12}>
                          <Divider sx={{ my: 1 }} />
                          <Typography variant="body2">
                            <strong>Tool Description:</strong>
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {toolDescriptions[scanResult.tool]}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Box>
                  )}
                </div>
              </Box>
            ) : (
              <Box textAlign="center" py={8}>
                <InfoIcon color="disabled" sx={{ fontSize: 60, mb: 2 }} />
                <Typography variant="body1" gutterBottom>
                  No scan results to display
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Configure your scan parameters and click "Execute Scan" to start
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ScanPage;