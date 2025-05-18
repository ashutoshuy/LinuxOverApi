import React, { createContext, useContext, useState, useEffect } from 'react';
import AuthService from '../services/authService';

// Create context
const AuthContext = createContext();

// Create provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state on app load
  useEffect(() => {
    const initAuth = () => {
      try {
        // Check if user is authenticated
        if (AuthService.isAuthenticated()) {
          const currentUser = AuthService.getCurrentUser();
          setUser(currentUser);
        }
      } catch (error) {
        console.error('Failed to initialize auth state', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // Login user
  const login = async (username, password) => {
    try {
      const userData = await AuthService.login(username, password);
      setUser(userData);
      return userData;
    } catch (error) {
      throw error;
    }
  };

  // Register user
  const register = async (userData) => {
    try {
      const result = await AuthService.register(userData);
      return result;
    } catch (error) {
      throw error;
    }
  };

  // Logout user
  const logout = () => {
    AuthService.logout();
    setUser(null);
  };

  // Check if user is admin (placeholder - customize based on your user model)
  const isAdmin = () => {
    return user && user.username === 'admin'; // Replace with your admin criteria
  };

  // Context value
  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    isAdmin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;