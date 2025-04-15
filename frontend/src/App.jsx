import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from './theme';
import Layout from './components/Layout';
import Dashboard from './modules/dashboard/Dashboard';
import EmployeesModule from './modules/employees/EmployeesModule';
import AttendanceModule from './modules/attendance/AttendanceModule';
import LeaveModule from './modules/leave/LeaveModule';
import RecruitmentRoutes from './modules/recruitment/recruitmentRoutes';
import PerformanceModule from './modules/performance/PerformanceModule';
import PayrollModule from './modules/payroll/PayrollModule';
import SettingsModule from './modules/settings/SettingsModule';
import Login from './components/Login/Login';
import LoginTest from './components/Login/LoginTest';

// Check if user is authenticated
const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  const tokenExpiry = localStorage.getItem('token_expiry');
  
  if (!token || !tokenExpiry) {
    return false;
  }
  
  // Check if token is expired
  const now = new Date();
  const expiry = new Date(tokenExpiry);
  
  return now < expiry;
};

// Protected route component
const ProtectedRoute = ({ children }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Login />} />
          <Route path="/login-test" element={<LoginTest />} />
          
          {/* Protected routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/employees/*" element={
            <ProtectedRoute>
              <Layout>
                <EmployeesModule />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/attendance/*" element={
            <ProtectedRoute>
              <Layout>
                <AttendanceModule />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/leave/*" element={
            <ProtectedRoute>
              <Layout>
                <LeaveModule />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/recruitment/*" element={
            <ProtectedRoute>
              <Layout>
                <RecruitmentRoutes />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/performance/*" element={
            <ProtectedRoute>
              <Layout>
                <PerformanceModule />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/payroll/*" element={
            <ProtectedRoute>
              <Layout>
                <PayrollModule />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/settings/*" element={
            <ProtectedRoute>
              <Layout>
                <SettingsModule />
              </Layout>
            </ProtectedRoute>
          } />
          
          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App; 