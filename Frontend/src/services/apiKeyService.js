import api from './api';

const ApiKeyService = {
  // Generate a new API key
  generateApiKey: async (username, apiType) => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.post('/apikeys/generate-api-key', {
        username,
        api_type: apiType,
        jwt_token: token
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get all API keys for a user
  getUserApiKeys: async (username) => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.get(`/apikeys/get-api-keys/${username}?jwt_token=${token}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get usage count for an API key
  getApiKeyCount: async (apiKey) => {
    try {
      const response = await api.get(`/apikeys/get-count/${apiKey}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Admin: Get all API keys
  getAllApiKeys: async (adminSecretKey) => {
    try {
      const response = await api.get(`/apikeys/fetch-all?admin_secret_key=${adminSecretKey}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Admin: Increment API key usage count
  incrementApiKeyCount: async (apiKey, adminSecretKey) => {
    try {
      const response = await api.post(`/apikeys/increment-count/${apiKey}?admin_secret_key=${adminSecretKey}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default ApiKeyService;