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
  FlagOutlined,
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
      roles: ['superadmin', 'admin', 'customer-service', 'finance'],
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
      key: '/ghana-warehouse',
      icon: <FlagOutlined />,
      label: 'Ghana Warehouse',
      roles: ['warehouse', 'admin', 'superadmin'],
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
      roles: ['superadmin', 'admin', 'customer-service', 'warehouse', 'driver', 'delivery-agent'],
    },
    {
      key: '/customers',
      icon: <UserOutlined />,
      label: 'Customers',
      roles: ['superadmin', 'admin', 'customer-service'],
    },
    {
      key: '/batch-management',
      icon: <ContainerOutlined />,
      label: 'Batches',
      roles: ['superadmin', 'admin', 'warehouse'],
    },
    {
      key: '/invoice-management',
      icon: <DollarOutlined />,
      label: 'Invoices',
      roles: ['superadmin', 'admin', 'finance'],
    },
    {
      key: '/reports',
      icon: <BarChartOutlined />,
      label: 'Reports',
      roles: ['superadmin', 'admin', 'finance'],
    },
    {
      key: '/track-shipment',
      icon: <SearchOutlined />,
      label: 'Track Shipment',
      roles: ['superadmin', 'admin', 'customer-service', 'warehouse'],
    },
    {
      key: '/admin',
      icon: <SettingOutlined />,
      label: 'Settings',
      roles: ['superadmin', 'admin', 'driver', 'delivery-agent', 'warehouse', 'finance', 'customer-service', 'user'],
    },
  ];

  // Filter menu items based on user role and warehouse location
  const menuItems = useMemo(() => {
    if (!currentUser || !currentUser.role) return [];
    
    return allMenuItems.filter(item => {
      // Check if user role matches
      if (!item.roles.includes(currentUser.role)) return false;
      
      // Special handling for Ghana Warehouse menu item
      if (item.key === '/ghana-warehouse') {
        // Show to admin/superadmin (always)
        if (currentUser.role === 'admin' || currentUser.role === 'superadmin') return true;
        // Show to warehouse users ONLY if they have warehouseLocation = "Ghana Warehouse"
        if (currentUser.role === 'warehouse') {
          return currentUser.warehouseLocation === 'Ghana Warehouse';
        }
        return false;
      }
      
      // Regular Warehouse menu - show ONLY if user doesn't have a specific warehouse location
      // Admin and superadmin can always see it
      if (item.key === '/warehouse') {
        // Admin/superadmin can always see general warehouse dashboard
        if (currentUser.role === 'admin' || currentUser.role === 'superadmin') return true;
        // Warehouse users only see this if they don't have a specific location assigned
        if (currentUser.role === 'warehouse') {
          return !currentUser.warehouseLocation; // Only show if no specific location
        }
        return false;
      }
      
      // All other menu items - just check role
      return true;
    });
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
