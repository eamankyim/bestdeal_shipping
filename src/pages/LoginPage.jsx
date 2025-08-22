import React, { useState } from 'react';
import { 
  Form, 
  Input, 
  Button, 
  Card, 
  Typography, 
  message, 
  Space,
  Row,
  Col
} from 'antd';
import { 
  LockOutlined, 
  MailOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

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

  const handleLogin = async (values) => {
    setLoading(true);
    try {
      await login(values.email, values.password);
      message.success('Login successful!');
      navigate(from, { replace: true });
    } catch (error) {
      message.error(error.message || 'Login failed. Please try again.');
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
        <Col xs={24} sm={20} md={16} lg={12} xl={8}>
          <Card 
            style={{ 
              borderRadius: '16px', 
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
              backdropFilter: 'blur(10px)',
              backgroundColor: 'rgba(255, 255, 255, 0.95)'
            }}
          >
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '16px',
                marginBottom: '16px'
              }}>
                <img 
                  src="/AppLogo.png" 
                  alt="ShipEASE" 
                  style={{ 
                    width: '48px', 
                    height: '48px',
                    objectFit: 'cover',
                    borderRadius: '6px'
                  }} 
                />
                <span style={{ 
                  fontSize: '32px', 
                  fontWeight: 'bold',
                  color: '#ff9800'
                }}>
                  ShipEASE
                </span>
              </div>
              <Title level={3} style={{ color: '#666', fontWeight: 'normal', margin: 0 }}>
                Internal Access Portal
              </Title>
              <Text type="secondary" style={{ fontSize: '16px' }}>
                Sign in with your company credentials
              </Text>
            </div>

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
