import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, App as AntApp } from 'antd';
import { theme } from 'antd';
import './App.css';
import './styles/mobile.css';
import './styles/input-focus.css';

// Layout and Pages
import MainLayout from './components/layout/MainLayout';
import LoginPage from './pages/LoginPage';
import AcceptInvitePage from './pages/AcceptInvitePage';
import DashboardPage from './pages/DashboardPage';
import JobsPage from './pages/JobsPage';
import CustomersPage from './pages/CustomersPage';
import ReportsPage from './pages/ReportsPage';
import WarehouseDashboard from './pages/WarehouseDashboard';
import GhanaWarehouseDashboardPage from './pages/GhanaWarehouseDashboardPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import BatchManagementPage from './pages/BatchManagementPage';
import InvoiceManagementPage from './pages/InvoiceManagementPage';
import PublicTrackingPage from './pages/PublicTrackingPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import SupportPage from './pages/SupportPage';

// Auth Components
import { AuthProvider } from './contexts/AuthContext';
import { StatusProvider } from './contexts/StatusContext';
import ProtectedRoute from './components/auth/ProtectedRoute';

const { defaultAlgorithm } = theme;

function App() {
  return (
    <ConfigProvider
      theme={{
        algorithm: defaultAlgorithm,
        token: {
          colorPrimary: '#ff9800', // Orange for buttons
          colorSuccess: '#4caf50',
          colorWarning: '#ff5722',
          colorError: '#f44336',
          colorInfo: '#003d82', // Dark blue
          borderRadius: 8, // 8px border radius
          // Input styling
          controlOutline: '#d9d9d9', // Light grey border
          controlOutlineHover: '#ff9800', // Orange on hover
          controlOutlineActive: '#ff9800', // Orange on focus
        },
        components: {
          Button: {
            borderRadius: 8,
            primaryColor: '#ffffff',
          },
          Input: {
            borderRadius: 8,
            activeBorderColor: '#ff9800', // Orange on focus
            hoverBorderColor: '#ff9800', // Orange on hover
            borderColor: '#d9d9d9', // Light grey default
          },
          Select: {
            borderRadius: 8,
            activeBorderColor: '#ff9800',
            hoverBorderColor: '#ff9800',
            borderColor: '#d9d9d9',
          },
          DatePicker: {
            borderRadius: 8,
            activeBorderColor: '#ff9800',
            hoverBorderColor: '#ff9800',
            borderColor: '#d9d9d9',
          },
          InputNumber: {
            borderRadius: 8,
            activeBorderColor: '#ff9800',
            hoverBorderColor: '#ff9800',
            borderColor: '#d9d9d9',
          },
        },
      }}
    >
      <AntApp>
        <AuthProvider>
          <Router>
            <div className="App">
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/track" element={<PublicTrackingPage />} />
              <Route path="/privacy" element={<PrivacyPolicyPage />} />
              <Route path="/support" element={<SupportPage />} />
              <Route path="/accept-invite/:token" element={<AcceptInvitePage />} />
              
              {/* Protected Routes */}
              <Route path="/" element={
                <ProtectedRoute>
                  <StatusProvider>
                    <MainLayout />
                  </StatusProvider>
                </ProtectedRoute>
              }>
                <Route index element={<Navigate to="/dashboard" replace />} />
                {/* Everyone's home: each role sees its own dashboard (pages/DashboardPage.jsx) */}
                <Route path="dashboard" element={<DashboardPage />} />
                {/* The office can also open each warehouse's dashboard */}
                <Route path="uk-warehouse" element={<WarehouseDashboard />} />
                <Route path="ghana-warehouse" element={<GhanaWarehouseDashboardPage />} />
                <Route path="jobs" element={<JobsPage />} />
                <Route path="customers" element={<CustomersPage />} />
                <Route path="batch-management" element={<BatchManagementPage />} />
                <Route path="invoice-management" element={<InvoiceManagementPage />} />
                <Route path="reports" element={<ReportsPage />} />
                <Route path="admin" element={<AdminDashboardPage />} />
              </Route>

              {/* Catch all route - redirect to dashboard */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
            </div>
          </Router>
        </AuthProvider>
      </AntApp>
    </ConfigProvider>
  );
}

export default App;
