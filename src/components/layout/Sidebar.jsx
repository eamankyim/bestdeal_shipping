import React from 'react';
import { Layout, Menu } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
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

const Sidebar = ({ collapsed }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleMenuClick = (e) => {
    navigate(e.key);
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
      className="sidebar"
      width={250}
    >
      <div className="sidebar-container">
        {/* Logo Section */}
        <div className="sidebar-logo">
          {collapsed ? (
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
                whiteSpace: 'nowrap'
              }}>
                ShipEASE
              </span>
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
