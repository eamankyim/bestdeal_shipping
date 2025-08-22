import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import { theme } from 'antd';
import './App.css';

// Layout and Pages
import MainLayout from './components/layout/MainLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import JobsPage from './pages/JobsPage';
import CustomersPage from './pages/CustomersPage';
import ReportsPage from './pages/ReportsPage';
import ShipmentTrackingPage from './pages/ShipmentTrackingPage';
import DriverDashboardPage from './pages/DriverDashboardPage';
import WarehouseDashboardPage from './pages/WarehouseDashboardPage';
import DeliveryAgentDashboardPage from './pages/DeliveryAgentDashboardPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import BatchManagementPage from './pages/BatchManagementPage';
import InvoiceManagementPage from './pages/InvoiceManagementPage';
import PublicTrackingPage from './pages/PublicTrackingPage';

// Auth Components
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';

const { defaultAlgorithm } = theme;

function App() {
  return (
    <ConfigProvider
      theme={{
        algorithm: defaultAlgorithm,
        token: {
          colorPrimary: '#ff9800',
          colorSuccess: '#4caf50',
          colorWarning: '#ff5722',
          colorError: '#f44336',
          colorInfo: '#2196f3',
          borderRadius: 6,
        },
      }}
    >
      <AuthProvider>
        <Router>
          <div className="App">
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/track" element={<PublicTrackingPage />} />
              
              {/* Protected Routes */}
              <Route path="/" element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="jobs" element={<JobsPage />} />
                <Route path="customers" element={<CustomersPage />} />
                <Route path="reports" element={<ReportsPage />} />
                <Route path="track-shipment" element={<ShipmentTrackingPage />} />
                <Route path="driver" element={<DriverDashboardPage />} />
                <Route path="warehouse" element={<WarehouseDashboardPage />} />
                <Route path="batch-management" element={<BatchManagementPage />} />
                <Route path="invoice-management" element={<InvoiceManagementPage />} />
                <Route path="delivery-agent" element={<DeliveryAgentDashboardPage />} />
                <Route path="admin" element={<AdminDashboardPage />} />
              </Route>
              
              {/* Catch all route - redirect to dashboard */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </ConfigProvider>
  );
}

export default App;
