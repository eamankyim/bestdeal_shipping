import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Layout,
  Menu,
  Button,
  Avatar,
  Dropdown,
  Space,
  Typography,
  Badge,
  theme,
} from 'antd';
import {
  DashboardOutlined,
  CarOutlined,
  ShopOutlined,
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
  BellOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  FileTextOutlined,
  SearchOutlined,
  PlusOutlined,
} from '@ant-design/icons';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  // Mock user data - in real app this would come from auth context
  const currentUser = {
    name: 'John Doe',
    role: 'Staff',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
  };

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      key: '/jobs',
      icon: <PlusOutlined />,
      label: 'Jobs',
    },
    {
      key: '/track-shipment',
      icon: <SearchOutlined />,
      label: 'Track Shipment',
    },
    {
      key: '/driver',
      icon: <CarOutlined />,
      label: 'Driver Operations',
    },
    {
      key: '/warehouse',
      icon: <ShopOutlined />,
      label: 'Warehouse',
    },
    {
      key: '/delivery-agent',
      icon: <UserOutlined />,
      label: 'Delivery Agent',
    },
    {
      key: '/admin',
      icon: <SettingOutlined />,
      label: 'Admin Panel',
    },
  ];

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profile',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Settings',
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      onClick: () => navigate('/login'),
    },
  ];

  const handleMenuClick = ({ key }) => {
    navigate(key);
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed}
        style={{
          background: colorBgContainer,
          boxShadow: '2px 0 8px 0 rgba(29,35,41,.05)',
        }}
      >
        <div style={{ 
          height: 64, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          borderBottom: '1px solid #f0f0f0'
        }}>
          <Title level={4} style={{ margin: 0, color: '#1890ff' }}>
            {collapsed ? 'DTD' : 'Door-to-Door'}
          </Title>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ borderRight: 0 }}
        />
      </Sider>
      
      <Layout>
        <Header
          style={{
            padding: '0 24px',
            background: colorBgContainer,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 1px 4px rgba(0,21,41,.08)',
          }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{
              fontSize: '16px',
              width: 64,
              height: 64,
            }}
          />
          
          <Space size="large">
            <Badge count={5} size="small">
              <Button 
                type="text" 
                icon={<BellOutlined />} 
                style={{ fontSize: '18px' }}
              />
            </Badge>
            
            <Dropdown
              menu={{ items: userMenuItems }}
              placement="bottomRight"
              arrow
            >
              <Space style={{ cursor: 'pointer' }}>
                <Avatar src={currentUser.avatar} size="small" />
                <span style={{ color: 'rgba(0, 0, 0, 0.88)' }}>
                  {currentUser.name}
                </span>
              </Space>
            </Dropdown>
          </Space>
        </Header>
        
        <Content
          style={{
            margin: '24px 16px',
            padding: 24,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
            minHeight: 280,
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
