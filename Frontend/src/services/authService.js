import api from './api';
import { jwtDecode } from 'jwt-decode';

const AuthService = {
  // Register a new user
  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Login user
  login: async (username, password) => {
    try {
      const response = await api.post('/auth/login', { 
        username, 
        password 
      });
      
      // Store token and user data
      const { access_token } = response.data;
      localStorage.setItem('token', access_token);
      
      // Fetch user details
      const userResponse = await api.get('/users/me');
      localStorage.setItem('user', JSON.stringify(userResponse.data));
      
      return userResponse.data;
    } catch (error) {
      throw error;
    }
  },

  // Logout user
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    const token = localStorage.getItem('token');
    if (!token) return false;
    
    try {
      const decodedToken = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      
      // Check if token is expired
      return decodedToken.exp > currentTime;
    } catch (error) {
      return false;
    }
  },

  // Get current user
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    
    try {
      return JSON.parse(userStr);
    } catch (error) {
      return null;
    }
  },

  // Validate token
  validateToken: async (username, token) => {
    try {
      const response = await api.post('/auth/validate-token', { 
        username, 
        token 
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default AuthService;