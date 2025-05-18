import api from './api';

const ScanService = {
  // Get all available scanning tools
  getAvailableTools: async () => {
    try {
      const response = await api.get('/scans/tools');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Execute a scan with a specific tool
  executeScan: async (toolName, domain, apiKey) => {
    try {
      const response = await api.post(`/scans/scan/${toolName}`, {
        domain,
        api_key: apiKey
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get scan history for an API key
  getScanHistory: async (apiKey, limit = 10) => {
    try {
      const response = await api.get(`/scans/history/${apiKey}?limit=${limit}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get detailed scan result
  getScanResult: async (scanId, apiKey) => {
    try {
      const response = await api.get(`/scans/result/${scanId}?api_key=${apiKey}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default ScanService;