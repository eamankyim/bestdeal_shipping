import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Form,
  Input,
  Button,
  Card,
  Typography,
  Space,
  Divider,
  message,
  Layout,
} from 'antd';
import {
  UserOutlined,
  LockOutlined,
  CarOutlined,
  ShopOutlined,
  UserSwitchOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Content } = Layout;

const LoginPage = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = React.useState(false);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      // Mock login - in real app this would be an API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulate role-based redirect
      const role = values.email.includes('driver') ? 'driver' : 
                   values.email.includes('warehouse') ? 'warehouse' : 
                   values.email.includes('delivery') ? 'delivery-agent' : 
                   values.email.includes('admin') ? 'admin' : 'dashboard';
      
      message.success('Login successful!');
      navigate(`/${role}`);
    } catch (error) {
      message.error('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const roleExamples = [
    {
      role: 'Staff',
      email: 'staff@company.com',
      password: 'password123',
      icon: <UserOutlined />,
      color: '#1890ff',
    },
    {
      role: 'Driver',
      email: 'driver@company.com',
      password: 'password123',
      icon: <CarOutlined />,
      color: '#52c41a',
    },
    {
      role: 'Warehouse',
      email: 'warehouse@company.com',
      password: 'password123',
      icon: <ShopOutlined />,
      color: '#fa8c16',
    },
    {
      role: 'Delivery Agent',
      email: 'delivery@company.com',
      password: 'password123',
      icon: <UserSwitchOutlined />,
      color: '#722ed1',
    },
    {
      role: 'Admin',
      email: 'admin@company.com',
      password: 'password123',
      icon: <UserOutlined />,
      color: '#eb2f96',
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <Content style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '24px'
      }}>
        <div style={{ width: '100%', maxWidth: 1000 }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <Title level={1} style={{ color: '#1890ff', marginBottom: 8 }}>
              Door-to-Door Delivery
            </Title>
            <Text type="secondary" style={{ fontSize: 16 }}>
              UK to Ghana Logistics Management System
            </Text>
          </div>

          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            {/* Login Form */}
            <Card style={{ flex: 1, minWidth: 400 }}>
              <Title level={3} style={{ textAlign: 'center', marginBottom: 32 }}>
                Sign In
              </Title>
              
              <Form
                form={form}
                name="login"
                onFinish={onFinish}
                layout="vertical"
                size="large"
              >
                <Form.Item
                  name="email"
                  label="Email"
                  rules={[
                    { required: true, message: 'Please input your email!' },
                    { type: 'email', message: 'Please enter a valid email!' }
                  ]}
                >
                  <Input 
                    prefix={<UserOutlined />} 
                    placeholder="Enter your email"
                  />
                </Form.Item>

                <Form.Item
                  name="password"
                  label="Password"
                  rules={[
                    { required: true, message: 'Please input your password!' },
                    { min: 6, message: 'Password must be at least 6 characters!' }
                  ]}
                >
                  <Input.Password 
                    prefix={<LockOutlined />} 
                    placeholder="Enter your password"
                  />
                </Form.Item>

                <Form.Item>
                  <Button 
                    type="primary" 
                    htmlType="submit" 
                    loading={loading}
                    style={{ width: '100%', height: 48 }}
                  >
                    Sign In
                  </Button>
                </Form.Item>
              </Form>
            </Card>

            {/* Role Examples */}
            <Card style={{ flex: 1, minWidth: 400 }}>
              <Title level={3} style={{ textAlign: 'center', marginBottom: 24 }}>
                Demo Accounts
              </Title>
              <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                Use these credentials to test different user roles:
              </Text>
              
              <Space direction="vertical" style={{ width: '100%' }}>
                {roleExamples.map((example, index) => (
                  <div key={index}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 12,
                      padding: '12px 16px',
                      background: '#fafafa',
                      borderRadius: 6,
                      border: `2px solid ${example.color}`,
                      cursor: 'pointer'
                    }}
                    onClick={() => {
                      form.setFieldsValue({
                        email: example.email,
                        password: example.password
                      });
                    }}
                    >
                      <div style={{ 
                        color: example.color, 
                        fontSize: 18 
                      }}>
                        {example.icon}
                      </div>
                      <div style={{ flex: 1 }}>
                        <Text strong>{example.role}</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {example.email}
                        </Text>
                      </div>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Click to fill
                      </Text>
                    </div>
                    {index < roleExamples.length - 1 && <Divider style={{ margin: '12px 0' }} />}
                  </div>
                ))}
              </Space>
            </Card>
          </div>
        </div>
      </Content>
    </Layout>
  );
};

export default LoginPage;
