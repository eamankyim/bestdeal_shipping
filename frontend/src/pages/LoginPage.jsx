import React, { useState } from 'react';
import { 
  Form, 
  Input, 
  Button, 
  Card, 
  Typography, 
  Space,
  Row,
  Col,
  message
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

  // Test function to verify messages work
  const testMessage = () => {
    console.log('🧪 Testing message display');
    message.error('This is a test error message!');
  };

  const handleLogin = async (values) => {
    setLoading(true);
    
    try {
      console.log('🔑 Login form submitted');
      const userData = await login(values.email, values.password);
      
      // Show success message
      message.success({
        content: '🎉 Login successful! Welcome back!',
        duration: 3,
      });
      
      // Redirect to role-based dashboard
      const roleDashboards = {
        'admin': '/dashboard',
        'driver': '/driver-dashboard',
        'warehouse': '/warehouse-dashboard',
        'delivery-agent': '/delivery-agent-dashboard',
        'customer-service': '/dashboard',
        'finance': '/dashboard',
      };
      
      const userRole = userData?.user?.role || userData?.role;
      const dashboardPath = roleDashboards[userRole] || '/dashboard';
      
      console.log('🎯 Redirecting to:', dashboardPath, 'for role:', userRole);
      navigate(dashboardPath, { replace: true });
    } catch (error) {
      console.error('🚨 Login failed, showing error to user:', error);
      
      // Extract error message
      const errorMsg = error?.message || error?.data?.message || 'Login failed. Please try again.';
      
      console.log('💬 Displaying error message:', errorMsg);
      console.log('📊 Error object:', error);
      
      // ALWAYS show an error message to the user
      let userMessage = '❌ Login failed. Please try again.';
      
      if (errorMsg.includes('Invalid email or password')) {
        userMessage = '❌ Invalid email or password. Please check your credentials.';
      } else if (errorMsg.includes('deactivated')) {
        userMessage = '⚠️ Your account has been deactivated. Contact support.';
      } else if (errorMsg.includes('Network') || errorMsg.includes('fetch') || errorMsg.includes('Failed to fetch')) {
        userMessage = '🌐 Network error. Please check your connection and try again.';
      } else if (errorMsg) {
        userMessage = `❌ ${errorMsg}`;
      }
      
      console.log('🔔 Showing message to user:', userMessage);
      
      // FORCE message display
      message.destroy(); // Clear any existing messages
      
      // Show message with maximum visibility
      message.error({
        content: userMessage,
        duration: 6,
        className: 'login-error-message',
      });
      
      console.log('✅ message.error() called');
      
      // Visual alert as backup
      alert(`LOGIN ERROR:\n\n${userMessage}\n\n(This alert is temporary - message toast should appear at top of screen)`);
      
      console.log('✅ Alert shown as backup');
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
          {/* Header - Outside Card */}
          <div style={{ textAlign: 'center', marginBottom: '32px', maxWidth: '600px', margin: '0 auto 32px' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '16px',
              marginBottom: '16px'
            }}>
              <img 
                src={config.app.logoPath} 
                alt={config.app.name} 
                style={{ 
                  width: '56px', 
                  height: '56px',
                  objectFit: 'cover',
                  borderRadius: '8px'
                }} 
              />
              <span style={{ 
                fontSize: '40px', 
                fontWeight: 'bold',
                color: '#ff9800'
              }}>
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

              {/* Temporary test button - Remove after testing */}
              <Form.Item>
                <Button 
                  type="dashed" 
                  onClick={testMessage}
                  style={{ width: '100%' }}
                >
                  🧪 Test Error Message
                </Button>
              </Form.Item>
            </Form>

            {/* Footer */}
            <div style={{ textAlign: 'center', marginTop: '24px' }}>
              <Space direction="vertical" size="small">
                <Text type="secondary" style={{ fontSize: '14px' }}>
                  Need access? Contact your administrator for an invitation.
                </Text>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  This is an internal company portal. Access is by invitation only.
                </Text>
              </Space>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default LoginPage;
