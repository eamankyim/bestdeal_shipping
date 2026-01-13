import React, { useState } from 'react';
import { 
  Form, 
  Input, 
  Button, 
  Card, 
  Typography, 
  Row,
  Col,
  App
} from 'antd';
import { 
  LockOutlined, 
  MailOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import config from '../config/env';

const { Title, Text } = Typography;

const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const [loginForm] = Form.useForm();
  const { message } = App.useApp(); // Use App context message API
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Get the page user was trying to access
  const from = location.state?.from?.pathname || '/dashboard';

  // Show success message if redirected from somewhere
  React.useEffect(() => {
    if (location.state?.message) {
      message.success(location.state.message);
    }
  }, [location.state]);


  const handleLogin = async (values) => {
    setLoading(true);
    
    try {
      console.log('🔑 Login form submitted');
      const userData = await login(values.email, values.password);
      
      // Show success message
      message.success({
        content: 'Login successful! Welcome back!',
        duration: 3,
      });
      
      // Redirect to role-based dashboard
      const user = userData?.user || userData;
      const userRole = user?.role;
      const warehouseLocation = user?.warehouseLocation;
      
      // Check for warehouse location and redirect accordingly
      let dashboardPath = '/dashboard';
      
      if (userRole === 'warehouse') {
        // If user has Ghana Warehouse location, redirect to Ghana Warehouse dashboard
        if (warehouseLocation === 'Ghana Warehouse') {
          dashboardPath = '/ghana-warehouse';
        } else {
          dashboardPath = '/warehouse-dashboard';
        }
      } else {
        const roleDashboards = {
          'admin': '/dashboard',
          'driver': '/driver-dashboard',
          'delivery-agent': '/delivery-agent-dashboard',
          'customer-service': '/dashboard',
          'finance': '/dashboard',
        };
        dashboardPath = roleDashboards[userRole] || '/dashboard';
      }
      
      console.log('🎯 Redirecting to:', dashboardPath, 'for role:', userRole, 'warehouseLocation:', warehouseLocation);
      navigate(dashboardPath, { replace: true });
    } catch (error) {
      console.error('🚨 Login failed, showing error to user:', error);
      console.error('📊 Error status:', error?.status);
      console.error('📊 Error message:', error?.message);
      console.error('📊 Error data:', error?.data);
      
      // Check error status first - 401 means wrong credentials
      const isUnauthorized = error?.status === 401;
      const errorMsg = error?.message || error?.data?.message || '';
      
      // ALWAYS show an error message to the user
      let userMessage = 'Invalid email or password. Please check your credentials.';
      
      // Prioritize status code detection
      if (error?.status === 429) {
        userMessage = 'Too many login attempts from this IP address. Please try again in 15 minutes.';
      } else if (isUnauthorized) {
        userMessage = 'Invalid email or password. Please check your credentials.';
      } else if (error?.status === 403) {
        userMessage = 'Access denied. Your account may be deactivated.';
      } else if (error?.status === 500) {
        userMessage = 'Server error. Please try again later.';
      } else if (errorMsg) {
        // Sanitize error message - remove URLs but keep the message
        let cleanMsg = errorMsg
          .replace(/https?:\/\/[^\s]+/gi, '') // Remove URLs
          .replace(/localhost[^\s]*/gi, '') // Remove localhost references
          .replace(/127\.0\.0\.1[^\s]*/gi, '') // Remove localhost IP
          .replace(/\s+/g, ' ') // Clean up extra spaces
          .trim();
        
        // If we have a clean message and it's meaningful
        if (cleanMsg && cleanMsg.length > 0) {
          // Check for specific error patterns
          if (cleanMsg.toLowerCase().includes('invalid') || cleanMsg.toLowerCase().includes('wrong') || cleanMsg.toLowerCase().includes('incorrect')) {
            userMessage = 'Invalid email or password. Please check your credentials.';
          } else if (cleanMsg.includes('deactivated')) {
            userMessage = 'Your account has been deactivated. Contact support.';
          } else if (cleanMsg.includes('Network') || cleanMsg.includes('fetch') || cleanMsg.includes('Failed to fetch') || cleanMsg.includes('CORS')) {
            userMessage = 'Network error. Please check your connection and try again.';
          } else if (cleanMsg.length < 200) { // Only use if not too long
            userMessage = cleanMsg;
          }
        }
      }
      
      console.log('🔔 Showing message to user:', userMessage);
      
      // Clear any existing messages first
      message.destroy();
      
      // Display error message using App context API
      message.error({
        content: userMessage,
        duration: 8,
        maxCount: 1,
      });
      
      console.log('✅ Error message displayed via App context');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#001529',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <Row justify="center" style={{ width: '100%' }}>
        <Col xs={24} sm={22} md={20} lg={16} xl={12} style={{ maxWidth: '600px' }}>
          {/* Header - Outside Card (text-only, no logo image) */}
          <div style={{ textAlign: 'center', marginBottom: '32px', maxWidth: '600px', margin: '0 auto 32px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
              }}
            >
              <span
                style={{
                  fontSize: '40px',
                  fontWeight: 'bold',
                  color: '#ff9800',
                }}
              >
                {config.app.name}
              </span>
            </div>
            <Title level={3} style={{ color: '#fff', fontWeight: 'normal', margin: '8px 0' }}>
              Internal Access Portal
            </Title>
            <Text style={{ fontSize: '16px', color: 'rgba(255, 255, 255, 0.8)' }}>
              Sign in with your company credentials
            </Text>
          </div>

          {/* Login Card */}
          <Card 
            style={{ 
              borderRadius: '16px', 
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
              backdropFilter: 'blur(10px)',
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              maxWidth: '600px',
              margin: '0 auto'
            }}
          >
            {/* Login Form */}
            <Form
              form={loginForm}
              onFinish={handleLogin}
              layout="vertical"
              size="large"
            >
              <Form.Item
                name="email"
                label="Company Email"
                rules={[
                  { required: true, message: 'Please enter your company email' },
                  { type: 'email', message: 'Please enter a valid email' }
                ]}
              >
                <Input 
                  prefix={<MailOutlined />} 
                  placeholder="Enter your company email"
                />
              </Form.Item>

              <Form.Item
                name="password"
                label="Password"
                rules={[
                  { required: true, message: 'Please enter your password' },
                  { min: 6, message: 'Password must be at least 6 characters' }
                ]}
              >
                <Input.Password 
                  prefix={<LockOutlined />} 
                  placeholder="Enter your password"
                  iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                />
              </Form.Item>

              <Form.Item>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={loading}
                  style={{ width: '100%', height: '48px', fontSize: '16px' }}
                >
                  Sign In
                </Button>
              </Form.Item>

            </Form>

            {/* Footer */}
            <div style={{ textAlign: 'center', marginTop: '24px' }}>
              <Text type="secondary" style={{ fontSize: '14px' }}>
                Having issues logging in?{' '}
                <a href="mailto:support@icreationsglobal.com" style={{ color: '#1890ff' }}>
                  Contact Administrator
                </a>
              </Text>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default LoginPage;
