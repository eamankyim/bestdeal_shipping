import React, { useState, useEffect } from 'react';
import { 
  Form, 
  Input, 
  Button, 
  Card, 
  Typography, 
  Space,
  Row,
  Col,
  Alert,
  message
} from 'antd';
import { 
  LockOutlined, 
  UserOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone,
  MailOutlined
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import config from '../config/env';
import { authAPI } from '../utils/api';

const { Title, Text } = Typography;

const AcceptInvitePage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetchingInvite, setFetchingInvite] = useState(true);
  const [inviteInfo, setInviteInfo] = useState(null);
  const [error, setError] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    console.log('🔗 Invite token received:', token);
    
    // Fetch invitation details to get the email
    const fetchInviteDetails = async () => {
      try {
        // TODO: Add proper API endpoint to get invite details
        // For now, we'll extract email from backend response when user accepts
        // const response = await api.get(`/auth/invite/${token}`);
        // const email = response.data.email;
        
        // Temporary: Set empty for now, will be populated when backend provides endpoint
        setInviteInfo({ token, email: '' });
        setFetchingInvite(false);
      } catch (err) {
        console.error('Failed to fetch invite:', err);
        setError('Invalid or expired invitation link');
        setFetchingInvite(false);
      }
    };
    
    fetchInviteDetails();
  }, [token]);

  const handleAcceptInvite = async (values) => {
    setLoading(true);
    
    console.log('📝 Accepting invitation with token:', token);
    console.log('👤 User data:', { name: values.name });
    
    try {
      const response = await authAPI.acceptInvite(token, {
        name: values.name,
        password: values.password,
      });

      console.log('✅ Invitation accepted:', response);

      // Show success and redirect to login
      message.success({
        content: '🎉 Account created successfully! Redirecting to login...',
        duration: 3,
      });

      // Store the email if provided in response
      const userEmail = response.data?.user?.email;

      setTimeout(() => {
        navigate('/login', { 
          state: { 
            message: 'Account created! Please login with your credentials.',
            email: userEmail
          } 
        });
      }, 2000);

    } catch (error) {
      console.error('❌ Failed to accept invitation:', error);
      
      const errorMsg = error?.message || error?.data?.message || 'Failed to create account';
      
      if (errorMsg.includes('expired') || errorMsg.includes('Invalid')) {
        setError('This invitation link has expired or is invalid. Please request a new invitation.');
      } else if (errorMsg.includes('already exists')) {
        setError('An account with this email already exists. Please login instead.');
      } else {
        setError(errorMsg);
      }

      message.error({
        content: `❌ ${errorMsg}`,
        duration: 5,
      });
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
        <Col xs={24} sm={22} md={20} lg={16} xl={12} style={{ maxWidth: '700px' }}>
          {/* Header - Outside Card */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
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
                color: '#fff'
              }}>
                {config.app.name}
              </span>
            </div>
            <Title level={3} style={{ color: '#fff', fontWeight: 'normal', margin: '8px 0' }}>
              Welcome to the Team! 
            </Title>
            <Text style={{ fontSize: '16px', color: 'rgba(255, 255, 255, 0.8)' }}>
              Complete your account setup to get started
            </Text>
          </div>

          {/* Onboarding Card */}
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
            {error && (
              <Alert
                message="Invitation Error"
                description={error}
                type="error"
                showIcon
                closable
                style={{ marginBottom: '24px' }}
              />
            )}

            {fetchingInvite ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <Text>Loading invitation details...</Text>
              </div>
            ) : !error && (
              <>
                <Form
                  form={form}
                  onFinish={handleAcceptInvite}
                  layout="vertical"
                  size="large"
                  initialValues={{
                    email: inviteInfo?.email || 'Loading...'
                  }}
                >
                  <Form.Item
                    name="email"
                    label="Email Address"
                  >
                    <Input 
                      prefix={<MailOutlined />} 
                      placeholder="Your email address"
                      disabled
                    />
                  </Form.Item>

                  <Form.Item
                    name="name"
                    label="Full Name"
                    rules={[
                      { required: true, message: 'Please enter your full name' },
                      { min: 2, message: 'Name must be at least 2 characters' }
                    ]}
                  >
                    <Input 
                      prefix={<UserOutlined />} 
                      placeholder="Enter your full name"
                    />
                  </Form.Item>

                  <Form.Item
                    name="password"
                    label="Password"
                    rules={[
                      { required: true, message: 'Please enter a password' },
                      { min: 6, message: 'Password must be at least 6 characters' }
                    ]}
                  >
                    <Input.Password 
                      prefix={<LockOutlined />} 
                      placeholder="Create a strong password (min. 6 characters)"
                      iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                    />
                  </Form.Item>

                  <Form.Item
                    name="confirmPassword"
                    label="Confirm Password"
                    dependencies={['password']}
                    rules={[
                      { required: true, message: 'Please confirm your password' },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          if (!value || getFieldValue('password') === value) {
                            return Promise.resolve();
                          }
                          return Promise.reject(new Error('Passwords do not match!'));
                        },
                      }),
                    ]}
                  >
                    <Input.Password 
                      prefix={<LockOutlined />} 
                      placeholder="Re-enter your password"
                      iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                    />
                  </Form.Item>

                  <Form.Item style={{ marginTop: '24px' }}>
                    <Button 
                      type="primary" 
                      htmlType="submit" 
                      loading={loading}
                      style={{ width: '100%', height: '48px', fontSize: '16px' }}
                    >
                      Create Account & Get Started
                    </Button>
                  </Form.Item>
                </Form>
              </>
            )}

            {/* Footer */}
            <div style={{ textAlign: 'center', marginTop: '24px' }}>
              <Space direction="vertical" size="small">
                <Text type="secondary" style={{ fontSize: '14px' }}>
                  Already have an account?{' '}
                  <a href="/login" style={{ color: '#1890ff', fontWeight: 500 }}>
                    Sign in here
                  </a>
                </Text>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  By creating an account, you agree to our terms and conditions
                </Text>
              </Space>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AcceptInvitePage;

