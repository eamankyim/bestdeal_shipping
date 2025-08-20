import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import MainLayout from './components/layout/MainLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import JobsPage from './pages/JobsPage';
import ShipmentTrackingPage from './pages/ShipmentTrackingPage';
import DriverDashboardPage from './pages/DriverDashboardPage';
import WarehouseDashboardPage from './pages/WarehouseDashboardPage';
import DeliveryAgentDashboardPage from './pages/DeliveryAgentDashboardPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import './App.css';

const { defaultAlgorithm } = theme;

function App() {
  return (
    <ConfigProvider
      theme={{
        algorithm: defaultAlgorithm,
        token: {
          colorPrimary: '#1890ff',
          borderRadius: 6,
        },
      }}
    >
      <Router>
        <div className="App">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<MainLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="jobs" element={<JobsPage />} />
              <Route path="track-shipment" element={<ShipmentTrackingPage />} />
              <Route path="driver" element={<DriverDashboardPage />} />
              <Route path="warehouse" element={<WarehouseDashboardPage />} />
              <Route path="delivery-agent" element={<DeliveryAgentDashboardPage />} />
              <Route path="admin" element={<AdminDashboardPage />} />
            </Route>
          </Routes>
        </div>
      </Router>
    </ConfigProvider>
  );
}

export default App;
