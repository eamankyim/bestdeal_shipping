import React, { useEffect } from 'react';
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
} from '@ant-design/icons';
import './Sidebar.css';

const { Sider } = Layout;

const Sidebar = ({ collapsed, isMobile, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Auto-hide sidebar on mobile when location changes
  useEffect(() => {
    if (isMobile && onClose) {
      onClose();
    }
  }, [location.pathname, isMobile, onClose]);

  const handleMenuClick = (e) => {
    navigate(e.key);
    // Close sidebar on mobile after navigation
    if (isMobile && onClose) {
      onClose();
    }
  };

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      key: '/jobs',
      icon: <ShoppingOutlined />,
      label: 'Jobs',
    },
    {
      key: '/customers',
      icon: <UserOutlined />,
      label: 'Customers',
    },
    {
      key: '/reports',
      icon: <BarChartOutlined />,
      label: 'Reports',
    },
    {
      key: '/track-shipment',
      icon: <SearchOutlined />,
      label: 'Track Shipment',
    },
    {
      key: '/driver',
      icon: <CarOutlined />,
      label: 'Driver Dashboard',
    },
    {
      key: '/warehouse',
      icon: <HomeOutlined />,
      label: 'Warehouse',
    },
    {
      key: '/batch-management',
      icon: <ContainerOutlined />,
      label: 'Batch Management',
    },
    {
      key: '/invoice-management',
      icon: <FileTextOutlined />,
      label: 'Invoice Management',
    },
    {
      key: '/delivery-agent',
      icon: <UserSwitchOutlined />,
      label: 'Delivery Agent',
    },
    {
      key: '/admin',
      icon: <SettingOutlined />,
      label: 'Settings',
    },
  ];

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
              src="/AppLogo.png" 
              alt="ShipEASE" 
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
                src="/AppLogo.png" 
                alt="ShipEASE" 
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
                ShipEASE
              </span>
              {/* Close button for mobile */}
              {isMobile && (
                <Button
                  type="text"
                  icon={<CloseOutlined />}
                  onClick={onClose}
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
