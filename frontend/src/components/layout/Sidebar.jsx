import React, { useEffect, useRef, useMemo } from 'react';
import { Layout, Menu, Button } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { CloseOutlined } from '@ant-design/icons';
import {
  DashboardOutlined,
  ShoppingOutlined,
  UserOutlined,
  HomeOutlined,
  SettingOutlined,
  BarChartOutlined,
  ContainerOutlined,
  DollarOutlined,
  FlagOutlined,
} from '@ant-design/icons';
import config from '../../config/env';
import { useAuth } from '../../contexts/AuthContext';
import { canManageInvoices, hasFullAccess, isGhanaWarehouse, isStaffMember } from '../../utils/permissions';
import './Sidebar.css';

const { Sider } = Layout;

const Sidebar = ({ collapsed, isMobile, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const previousPath = useRef(location.pathname);
  const { currentUser } = useAuth();

  // Auto-hide sidebar on mobile when location ACTUALLY changes
  useEffect(() => {
    // Only close if path actually changed (not on initial render or re-renders)
    if (isMobile && onClose && previousPath.current !== location.pathname) {
      previousPath.current = location.pathname;
      onClose();
    } else {
      previousPath.current = location.pathname;
    }
  }, [location.pathname, isMobile, onClose]);

  const handleMenuClick = (e) => {
    navigate(e.key);
    // Close sidebar on mobile after navigation
    if (isMobile && onClose) {
      onClose();
    }
  };

  const handleCloseClick = () => {
    if (onClose) {
      onClose();
    }
  };

  // One menu for everyone; `show` decides who sees each item. The Dashboard is each role's own
  // home page (pages/DashboardPage.jsx); the office can also open each warehouse's dashboard.
  const menuItems = useMemo(() => {
    if (!currentUser?.role) return [];
    const role = currentUser.role === 'warehouse_staff' ? 'warehouse' : currentUser.role;
    const office = hasFullAccess(currentUser);
    const items = [
      { key: '/dashboard', icon: <DashboardOutlined />, label: role === 'driver' ? 'My Collections' : role === 'delivery-agent' ? 'My Deliveries' : 'Dashboard', show: true },
      { key: '/uk-warehouse', icon: <HomeOutlined />, label: 'UK Warehouse', show: office },
      { key: '/ghana-warehouse', icon: <FlagOutlined />, label: 'Ghana Warehouse', show: office },
      { key: '/jobs', icon: <ShoppingOutlined />, label: 'Jobs', show: isStaffMember(currentUser) },
      { key: '/customers', icon: <UserOutlined />, label: 'Customers', show: office },
      { key: '/batch-management', icon: <ContainerOutlined />, label: 'Batches', show: office || role === 'warehouse' },
      // The Ghana warehouse adds notes on the state of invoices
      { key: '/invoice-management', icon: <DollarOutlined />, label: 'Invoices', show: canManageInvoices(currentUser) || isGhanaWarehouse(currentUser) },
      { key: '/reports', icon: <BarChartOutlined />, label: 'Reports', show: office || role === 'finance' },
      { key: '/admin', icon: <SettingOutlined />, label: 'Settings', show: true },
    ];
    return items.filter((item) => item.show).map(({ show, ...item }) => item);
  }, [currentUser]);

  return (
    <Sider
      trigger={null}
      collapsible
      collapsed={collapsed}
      className={`sidebar ${isMobile ? 'mobile-sidebar' : ''}`}
      width={isMobile ? '100vw' : 250}
      collapsedWidth={isMobile ? 0 : 80}
    >
      <div className="sidebar-container">
        {/* Logo Section */}
        <div className="sidebar-logo">
          {collapsed && !isMobile ? (
            <img 
              src={config.app.logoPath} 
              alt={config.app.name} 
              style={{ 
                width: '32px', 
                height: '32px',
                objectFit: 'cover',
                borderRadius: '4px'
              }} 
            />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
              <img 
                src={config.app.logoPath} 
                alt={config.app.name} 
                style={{ 
                  width: '40px', 
                  height: '40px',
                  objectFit: 'cover',
                  borderRadius: '4px'
                }} 
              />
              <span style={{ 
                color: 'white', 
                fontSize: '18px', 
                fontWeight: 'bold',
                whiteSpace: 'nowrap',
                flex: 1
              }}>
                {config.app.name}
              </span>
              {/* Close button for mobile */}
              {isMobile && (
                <Button
                  type="text"
                  icon={<CloseOutlined />}
                  onClick={handleCloseClick}
                  className="sidebar-close-button"
                  style={{
                    color: 'white',
                    border: 'none',
                    padding: '8px',
                    minWidth: '40px',
                    height: '40px',
                    fontSize: '18px',
                    borderRadius: '6px'
                  }}
                />
              )}
            </div>
          )}
        </div>

        {/* Menu */}
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
          className="sidebar-menu"
        />
      </div>
    </Sider>
  );
};

export default Sidebar;
