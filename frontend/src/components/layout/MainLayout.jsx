import React, { useState, useEffect, useCallback } from 'react';
import { Layout, Button, Space, Avatar, Dropdown, Menu } from 'antd';
import { 
  MenuFoldOutlined, 
  MenuUnfoldOutlined, 
  LogoutOutlined,
  UserOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from './Sidebar';
import NotificationBell from '../notifications/NotificationBell';
import './MainLayout.css';

const { Header, Content } = Layout;

const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  // Detect mobile devices and handle resize
  useEffect(() => {
    const checkMobile = () => {
      const wasMobile = isMobile;
      const nowMobile = window.innerWidth <= 768;
      setIsMobile(nowMobile);
      console.log('📏 Screen width:', window.innerWidth, '| isMobile:', nowMobile);
      
      if (wasMobile !== nowMobile) {
        console.log('🔄 Device type changed from', wasMobile ? 'mobile' : 'desktop', 'to', nowMobile ? 'mobile' : 'desktop');
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, [isMobile]);

  // Function to generate initials from user name
  const getUserInitials = (name) => {
    if (!name) return 'U';
    
    const nameParts = name.trim().split(' ');
    if (nameParts.length === 1) {
      return nameParts[0].charAt(0).toUpperCase();
    }
    
    return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
  };


  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSidebarToggle = () => {
    console.log('🔄 Toggle clicked | isMobile:', isMobile, '| Current mobileMenuOpen:', mobileMenuOpen, '| Current collapsed:', collapsed);
    if (isMobile) {
      const newState = !mobileMenuOpen;
      console.log('📱 Mobile toggle | Setting mobileMenuOpen to:', newState);
      setMobileMenuOpen(newState);
    } else {
      const newState = !collapsed;
      console.log('💻 Desktop toggle | Setting collapsed to:', newState);
      setCollapsed(newState);
    }
  };

  const handleSidebarClose = useCallback(() => {
    console.log('❌ Close clicked | isMobile:', isMobile, '| Current mobileMenuOpen:', mobileMenuOpen);
    if (isMobile) {
      console.log('📱 Closing mobile sidebar');
      setMobileMenuOpen(false);
    }
  }, [isMobile, mobileMenuOpen]);

  const userMenu = (
    <Menu>
      <Menu.Item key="profile" icon={<UserOutlined />} onClick={() => navigate('/admin')}>
        Profile
      </Menu.Item>
      <Menu.Item key="settings" icon={<SettingOutlined />} onClick={() => navigate('/admin')}>
        Settings
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="logout" icon={<LogoutOutlined />} onClick={handleLogout}>
        Logout
      </Menu.Item>
    </Menu>
  );

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Mobile backdrop overlay */}
      {isMobile && mobileMenuOpen && (
        <div 
          className="mobile-backdrop"
          onClick={handleSidebarClose}
        />
      )}
      
      <Sidebar 
        collapsed={isMobile ? !mobileMenuOpen : collapsed} 
        isMobile={isMobile}
        onClose={handleSidebarClose}
      />
      
      {/* Debug info in console */}
      {console.log('🎨 Rendering Sidebar | isMobile:', isMobile, '| mobileMenuOpen:', mobileMenuOpen, '| collapsed prop:', (isMobile ? !mobileMenuOpen : collapsed))}
      
      <Layout className={`content-layout ${collapsed ? 'sidebar-collapsed' : 'sidebar-expanded'} ${isMobile ? 'mobile' : ''}`}>
        <Header className="main-header">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <Button
              type="text"
              icon={isMobile ? (mobileMenuOpen ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />) : (collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />)}
              onClick={handleSidebarToggle}
              style={{
                fontSize: '16px',
                width: 64,
                height: 64,
              }}
              className="sidebar-trigger"
            />
            
            <Space size="large">
              {/* Notifications Bell */}
              <NotificationBell />
              
              {/* User Profile with initials fallback */}
              <Dropdown overlay={userMenu} trigger={['click']} placement="bottomRight">
                <Space style={{ cursor: 'pointer' }} size={16}>
                  <Avatar 
                    src={currentUser?.avatar} 
                    size="large"
                    className="user-avatar"
                    style={{
                      backgroundColor: currentUser?.avatar ? undefined : '#1890ff',
                      color: currentUser?.avatar ? undefined : '#fff',
                      fontWeight: 'bold',
                      fontSize: '16px'
                    }}
                  >
                    {currentUser?.avatar ? undefined : getUserInitials(currentUser?.name)}
                  </Avatar>
                  <span style={{ color: '#000', fontWeight: 500 }}>
                    {currentUser?.name || 'User'}
                  </span>
                </Space>
              </Dropdown>
            </Space>
          </div>
        </Header>
        
        <Content className="main-content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
