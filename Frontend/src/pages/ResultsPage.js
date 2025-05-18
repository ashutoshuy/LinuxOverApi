import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Divider,
  Grid,
  CircularProgress,
  Button,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { 
  ArrowBack as ArrowBackIcon,
  ContentCopy as ContentCopyIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import ScanService from '../services/scanService';
import { useAuth } from '../context/AuthContext';
import ErrorAlert from '../components/common/ErrorAlert';

const ResultsPage = () => {
  const { scanId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  // Get apiKey from query params or location state
  const queryParams = new URLSearchParams(location.search);
  const apiKeyParam = queryParams.get('api_key');
  const apiKey = apiKeyParam || location.state?.apiKey;
  
  const [scanResult, setScanResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showError, setShowError] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // Tool descriptions (same as in ScanPage)
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

  useEffect(() => {
    const fetchScanResult = async () => {
      if (!scanId || !apiKey) {
        setError(new Error('Scan ID or API key is missing'));
        setShowError(true);
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        
        const result = await ScanService.getScanResult(scanId, apiKey);
        setScanResult(result);
      } catch (err) {
        console.error('Error fetching scan result:', err);
        setError(err);
        setShowError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchScanResult();
  }, [scanId, apiKey]);

  // Handle error alert close
  const handleErrorClose = () => {
    setShowError(false);
  };

  // Handle back button click
  const handleBack = () => {
    navigate(-1);
  };

  // Handle refresh button click
  const handleRefresh = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await ScanService.getScanResult(scanId, apiKey);
      setScanResult(result);
    } catch (err) {
      console.error('Error refreshing scan result:', err);
      setError(err);
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

  // Handle copy to clipboard
  const handleCopyResult = () => {
    if (scanResult) {
      navigator.clipboard.writeText(scanResult.result);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  // Handle download result
  const handleDownloadResult = () => {
    if (scanResult) {
      const blob = new Blob([scanResult.result], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${scanResult.tool}-${scanResult.domain}-${new Date(scanResult.scan_time).toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={3}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          sx={{ mr: 2 }}
        >
          Back
        </Button>
        <Typography variant="h4">
          Scan Result
        </Typography>
      </Box>

      {/* Error Alert */}
      <ErrorAlert 
        error={error} 
        open={showError} 
        onClose={handleErrorClose} 
      />

      {loading ? (
        <Box display="flex" flexDirection="column" alignItems="center" my={8}>
          <CircularProgress size={60} />
          <Typography variant="body1" sx={{ mt: 2 }}>
            Loading scan result...
          </Typography>
        </Box>
      ) : !scanResult ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" color="error" gutterBottom>
            Scan result not found
          </Typography>
          <Typography variant="body1" paragraph>
            The scan result you are looking for might have been deleted or is not accessible with the provided API key.
          </Typography>
          <Button
            variant="contained"
            startIcon={<ArrowBackIcon />}
            onClick={handleBack}
          >
            Go Back
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {/* Scan Information */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Scan Information
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <Typography variant="body2" color="text.secondary">
                    Tool
                  </Typography>
                </Grid>
                <Grid item xs={8}>
                  <Typography variant="body2" fontWeight="medium">
                    {scanResult.tool}
                  </Typography>
                </Grid>
                
                <Grid item xs={4}>
                  <Typography variant="body2" color="text.secondary">
                    Category
                  </Typography>
                </Grid>
                <Grid item xs={8}>
                  <Typography variant="body2" fontWeight="medium">
                    {toolCategories[scanResult.tool] || "Other"}
                  </Typography>
                </Grid>
                
                <Grid item xs={4}>
                  <Typography variant="body2" color="text.secondary">
                    Domain
                  </Typography>
                </Grid>
                <Grid item xs={8}>
                  <Typography variant="body2" fontWeight="medium">
                    {scanResult.domain}
                  </Typography>
                </Grid>
                
                <Grid item xs={4}>
                  <Typography variant="body2" color="text.secondary">
                    Scan ID
                  </Typography>
                </Grid>
                <Grid item xs={8}>
                  <Typography variant="body2" fontWeight="medium">
                    {scanResult.id}
                  </Typography>
                </Grid>
                
                <Grid item xs={4}>
                  <Typography variant="body2" color="text.secondary">
                    Scan Time
                  </Typography>
                </Grid>
                <Grid item xs={8}>
                  <Typography variant="body2" fontWeight="medium">
                    {new Date(scanResult.scan_time).toLocaleString()}
                  </Typography>
                </Grid>
                
                <Grid item xs={4}>
                  <Typography variant="body2" color="text.secondary">
                    API Key
                  </Typography>
                </Grid>
                <Grid item xs={8}>
                  <Typography variant="body2" fontWeight="medium">
                    {apiKey ? `${apiKey.substring(0, 8)}...` : "N/A"}
                  </Typography>
                </Grid>
              </Grid>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="subtitle2" gutterBottom>
                Tool Description
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {toolDescriptions[scanResult.tool] || "No description available"}
              </Typography>
            </Paper>

            {/* Tool Suggestion */}
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  Recommended Next Steps
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  After reviewing these results, consider running these additional scans:
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Tool</TableCell>
                        <TableCell>Purpose</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {scanResult.tool === 'dig' && (
                        <>
                          <TableRow>
                            <TableCell>nmap</TableCell>
                            <TableCell>Scan for open ports and services</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>whatweb</TableCell>
                            <TableCell>Identify web technologies</TableCell>
                          </TableRow>
                        </>
                      )}
                      {scanResult.tool === 'nmap' && (
                        <>
                          <TableRow>
                            <TableCell>sslscan</TableCell>
                            <TableCell>Check SSL/TLS configuration</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>nuclei</TableCell>
                            <TableCell>Scan for vulnerabilities</TableCell>
                          </TableRow>
                        </>
                      )}
                      {scanResult.tool === 'whatweb' && (
                        <>
                          <TableRow>
                            <TableCell>wpscan</TableCell>
                            <TableCell>Scan WordPress if detected</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>nuclei</TableCell>
                            <TableCell>Scan for vulnerabilities</TableCell>
                          </TableRow>
                        </>
                      )}
                      {['sslscan', 'subfinder', 'wpscan', 'nuclei'].includes(scanResult.tool) && (
                        <>
                          <TableRow>
                            <TableCell>dig</TableCell>
                            <TableCell>Analyze DNS records</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>nmap</TableCell>
                            <TableCell>Map network services</TableCell>
                          </TableRow>
                        </>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Scan Results */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  Scan Results
                </Typography>
                <Box>
                  <Tooltip title="Refresh">
                    <IconButton onClick={handleRefresh} disabled={loading}>
                      <RefreshIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={copySuccess ? "Copied!" : "Copy Results"}>
                    <IconButton onClick={handleCopyResult}>
                      <ContentCopyIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Download Results">
                    <IconButton onClick={handleDownloadResult}>
                      <DownloadIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
              <Divider sx={{ mb: 2 }} />
              <Box 
                sx={{ 
                  bgcolor: 'background.paper',
                  borderRadius: 1,
                  p: 2,
                  maxHeight: '600px',
                  overflow: 'auto',
                  fontFamily: 'monospace',
                  fontSize: '0.875rem',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all'
                }}
              >
                {scanResult.result}
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default ResultsPage;