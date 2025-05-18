import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';

// Layout
import Layout from '../components/layout/Layout';

// Public pages
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';

// Protected pages
import DashboardPage from '../pages/DashboardPage';
import ProfilePage from '../pages/ProfilePage';
import ApiKeyPage from '../pages/ApiKeyPage';
import ScanPage from '../pages/ScanPage';
import ResultsPage from '../pages/ResultsPage';
import HistoryPage from '../pages/HistoryPage';
import AdminPage from '../pages/AdminPage';
import NotFoundPage from '../pages/NotFoundPage';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      
      {/* Protected routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/api-keys" element={<ApiKeyPage />} />
          <Route path="/scan" element={<ScanPage />} />
          <Route path="/results/:scanId" element={<ResultsPage />} />
          <Route path="/history" element={<HistoryPage />} />
        </Route>
      </Route>
      
      {/* Admin routes */}
      <Route element={<ProtectedRoute requireAdmin={true} />}>
        <Route element={<Layout />}>
          <Route path="/admin" element={<AdminPage />} />
        </Route>
      </Route>
      
      {/* Redirect to login by default */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      
      {/* 404 route */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default AppRoutes;
