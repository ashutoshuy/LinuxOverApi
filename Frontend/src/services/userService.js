import api from './api';

const UserService = {
  // Get current user profile
  getUserProfile: async () => {
    try {
      const response = await api.get('/users/me');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Process payment for paid tier
  makePayment: async (username, amount) => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.post('/users/make-payment', {
        username,
        jwt_token: token,
        amount
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Check if user has paid status
  getPaidStatus: async (username) => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.get(`/users/get-paid-status/${username}?jwt_token=${token}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get user's bill amount
  getBillAmount: async (username) => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.get(`/users/get-bill-amount/${username}?jwt_token=${token}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Admin: Get all users
  getAllUsers: async (adminSecretKey) => {
    try {
      const response = await api.get(`/users/fetch-all-users?admin_secret_key=${adminSecretKey}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default UserService;