import React, { useEffect, useRef, useMemo } from 'react';
import { Layout, Menu, Button } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { CloseOutlined } from '@ant-design/icons';
import {
  DashboardOutlined,
  ShoppingOutlined,
  UserOutlined,
  SearchOutlined,
  CarOutlined,
  HomeOutlined,
  UserSwitchOutlined,
  SettingOutlined,
  BarChartOutlined,
  ContainerOutlined,
  FileTextOutlined,
  DollarOutlined,
  RocketOutlined,
} from '@ant-design/icons';
import config from '../../config/env';
import { useAuth } from '../../contexts/AuthContext';
import './Sidebar.css';

const { Sider } = Layout;

const Sidebar = ({ collapsed, isMobile, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const previousPath = useRef(location.pathname);
  const { currentUser } = useAuth();

  console.log('🎯 Sidebar render | collapsed:', collapsed, '| isMobile:', isMobile, '| role:', currentUser?.role);

  // Auto-hide sidebar on mobile when location ACTUALLY changes
  useEffect(() => {
    // Only close if path actually changed (not on initial render or re-renders)
    if (isMobile && onClose && previousPath.current !== location.pathname) {
      console.log('🔄 Location changed on mobile from', previousPath.current, 'to', location.pathname, '- auto-closing sidebar');
      previousPath.current = location.pathname;
      onClose();
    } else {
      previousPath.current = location.pathname;
    }
  }, [location.pathname, isMobile, onClose]);

  const handleMenuClick = (e) => {
    console.log('🔗 Menu item clicked:', e.key, '| isMobile:', isMobile);
    navigate(e.key);
    // Close sidebar on mobile after navigation
    if (isMobile && onClose) {
      console.log('📱 Closing sidebar after navigation');
      onClose();
    }
  };

  const handleCloseClick = () => {
    console.log('❌ Close button clicked in Sidebar');
    if (onClose) {
      onClose();
    }
  };

  // Define all possible menu items with role restrictions
  const allMenuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
      roles: ['admin', 'customer-service', 'finance'],
    },
    {
      key: '/driver-dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
      roles: ['driver'],
    },
    {
      key: '/warehouse',
      icon: <HomeOutlined />,
      label: 'Warehouse',
      roles: ['warehouse'],
    },
    {
      key: '/delivery-agent',
      icon: <RocketOutlined />,
      label: 'My Deliveries',
      roles: ['delivery-agent'],
    },
    {
      key: '/jobs',
      icon: <ShoppingOutlined />,
      label: 'Jobs',
      roles: ['admin', 'customer-service', 'warehouse', 'driver', 'delivery-agent'],
    },
    {
      key: '/customers',
      icon: <UserOutlined />,
      label: 'Customers',
      roles: ['admin', 'customer-service'],
    },
    {
      key: '/batch-management',
      icon: <ContainerOutlined />,
      label: 'Batches',
      roles: ['admin', 'warehouse'],
    },
    {
      key: '/invoice-management',
      icon: <DollarOutlined />,
      label: 'Invoices',
      roles: ['admin', 'finance'],
    },
    {
      key: '/reports',
      icon: <BarChartOutlined />,
      label: 'Reports',
      roles: ['admin', 'finance'],
    },
    {
      key: '/track-shipment',
      icon: <SearchOutlined />,
      label: 'Track Shipment',
      roles: ['admin', 'customer-service', 'warehouse'],
    },
    {
      key: '/admin',
      icon: <SettingOutlined />,
      label: 'Settings',
      roles: ['superadmin', 'admin', 'driver', 'delivery-agent', 'warehouse', 'finance', 'customer-service', 'user'],
    },
  ];

  // Filter menu items based on user role
  const menuItems = useMemo(() => {
    if (!currentUser || !currentUser.role) return [];
    
    return allMenuItems.filter(item => item.roles.includes(currentUser.role));
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
