import React, { useState } from 'react';
import {
  Card,
  Typography,
  Row,
  Col,
  Table,
  Button,
  Tag,
  Space,
  Statistic,
  Timeline,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  message,
  Tabs,
  Progress,
  Avatar,
} from 'antd';
import {
  UserOutlined,
  SettingOutlined,
  BarChartOutlined,
  TeamOutlined,
  DollarOutlined,
  CarOutlined,
  ShopOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { Switch } from 'antd';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

const AdminDashboardPage = () => {
  const [userModalVisible, setUserModalVisible] = useState(false);
  const [pricingModalVisible, setPricingModalVisible] = useState(false);
  const [userForm] = Form.useForm();
  const [pricingForm] = Form.useForm();

  // Mock data
  const adminStats = [
    {
      title: 'Total Users',
      value: 156,
      prefix: <TeamOutlined />,
      color: '#1890ff',
    },
    {
      title: 'Active Shipments',
      value: 89,
      prefix: <CarOutlined />,
      color: '#fa8c16',
    },
    {
      title: 'Monthly Revenue',
      value: '£45,230',
      prefix: <DollarOutlined />,
      color: '#52c41a',
    },
    {
      title: 'System Health',
      value: 98,
      prefix: '%',
      color: '#722ed1',
    },
  ];

  const users = [
    {
      key: '1',
      name: 'John Driver',
      email: 'john.driver@company.com',
      role: 'Driver',
      status: 'Active',
      lastLogin: '2 hours ago',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
    },
    {
      key: '2',
      name: 'Sarah Warehouse',
      email: 'sarah.warehouse@company.com',
      role: 'Warehouse Staff',
      status: 'Active',
      lastLogin: '1 hour ago',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    },
    {
      key: '3',
      name: 'Mike Delivery',
      email: 'mike.delivery@company.com',
      role: 'Delivery Agent',
      status: 'Inactive',
      lastLogin: '3 days ago',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike',
    },
  ];

  const recentActivities = [
    {
      time: '2 minutes ago',
      action: 'New user registered: John Driver',
      user: 'System',
      type: 'user',
    },
    {
      time: '15 minutes ago',
      action: 'Pricing updated for Express service',
      user: 'Admin',
      type: 'pricing',
    },
    {
      time: '1 hour ago',
      action: 'Shipment batch created: 15 parcels',
      user: 'Warehouse Staff',
      type: 'shipment',
    },
  ];

  const userColumns = [
    {
      title: 'User',
      key: 'user',
      render: (_, record) => (
        <Space>
          <Avatar src={record.avatar} size="small" />
          <div>
            <div>{record.name}</div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.email}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role) => <Tag color="blue">{role}</Tag>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'Active' ? 'green' : 'red'}>
          {status}
        </Tag>
      ),
    },
    {
      title: 'Last Login',
      dataIndex: 'lastLogin',
      key: 'lastLogin',
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleEditUser(record)}
          >
            Edit
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            size="small"
            onClick={() => handleDeleteUser(record)}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  const handleAddUser = () => {
    setUserModalVisible(true);
    userForm.resetFields();
  };

  const handleEditUser = (user) => {
    setUserModalVisible(true);
    userForm.setFieldsValue(user);
  };

  const handleDeleteUser = (user) => {
    message.success(`User ${user.name} deleted successfully`);
  };

  const handleUserSubmit = async (values) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      message.success('User saved successfully!');
      setUserModalVisible(false);
      userForm.resetFields();
    } catch (error) {
      message.error('Failed to save user. Please try again.');
    }
  };

  const handlePricingSubmit = async (values) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      message.success('Pricing updated successfully!');
      setPricingModalVisible(false);
      pricingForm.resetFields();
    } catch (error) {
      message.error('Failed to update pricing. Please try again.');
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>Admin Dashboard</Title>
        <Text type="secondary">
          Manage users, system settings, and view comprehensive reports
        </Text>
      </div>

      {/* Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {adminStats.map((stat, index) => (
          <Col xs={24} sm={12} lg={6} key={index}>
            <Card>
              <Statistic
                title={stat.title}
                value={stat.value}
                prefix={<div style={{ color: stat.color }}>{stat.prefix}</div>}
                valueStyle={{ color: stat.color }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* Main Content */}
      <Tabs defaultActiveKey="users">
        <TabPane
          tab={
            <span>
              <TeamOutlined />
              User Management
            </span>
          }
          key="users"
        >
          <Card
            title="Users"
            extra={
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAddUser}
              >
                Add User
              </Button>
            }
          >
            <Table
              columns={userColumns}
              dataSource={users}
              pagination={false}
              size="small"
            />
          </Card>
        </TabPane>

        <TabPane
          tab={
            <span>
              <DollarOutlined />
              Pricing & Billing
            </span>
          }
          key="pricing"
        >
          <Card
            title="Service Pricing"
            extra={
              <Button
                type="primary"
                icon={<EditOutlined />}
                onClick={() => setPricingModalVisible(true)}
              >
                Update Pricing
              </Button>
            }
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} md={8}>
                <Card size="small">
                  <Statistic
                    title="Standard Service"
                    value="£15.00"
                    suffix="+ £2.50/kg"
                  />
                  <Text type="secondary">7-10 days delivery</Text>
                </Card>
              </Col>
              <Col xs={24} md={8}>
                <Card size="small">
                  <Statistic
                    title="Express Service"
                    value="£25.00"
                    suffix="+ £3.50/kg"
                  />
                  <Text type="secondary">3-5 days delivery</Text>
                </Card>
              </Col>
              <Col xs={24} md={8}>
                <Card size="small">
                  <Statistic
                    title="Premium Service"
                    value="£45.00"
                    suffix="+ £5.00/kg"
                  />
                  <Text type="secondary">1-2 days delivery</Text>
                </Card>
              </Col>
            </Row>
          </Card>
        </TabPane>

        <TabPane
          tab={
            <span>
              <BarChartOutlined />
              Reports & Analytics
            </span>
          }
          key="reports"
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card title="Shipment Volume (Last 30 Days)">
                <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Text type="secondary">Chart placeholder - would show shipment trends</Text>
                </div>
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card title="Revenue Overview">
                <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Text type="secondary">Chart placeholder - would show revenue trends</Text>
                </div>
              </Card>
            </Col>
          </Row>
        </TabPane>

        <TabPane
          tab={
            <span>
              <SettingOutlined />
              System Settings
            </span>
          }
          key="settings"
        >
          <Card title="System Configuration">
            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <Card size="small" title="Email Notifications">
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div>
                      <Text>Shipment Status Updates</Text>
                      <Switch defaultChecked />
                    </div>
                    <div>
                      <Text>Payment Confirmations</Text>
                      <Switch defaultChecked />
                    </div>
                    <div>
                      <Text>System Alerts</Text>
                      <Switch defaultChecked />
                    </div>
                  </Space>
                </Card>
              </Col>
              <Col xs={24} md={12}>
                <Card size="small" title="System Health">
                  <div style={{ marginBottom: 16 }}>
                    <Text>Database Performance</Text>
                    <Progress percent={95} size="small" />
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <Text>API Response Time</Text>
                    <Progress percent={87} size="small" />
                  </div>
                  <div>
                    <Text>Storage Usage</Text>
                    <Progress percent={62} size="small" />
                  </div>
                </Card>
              </Col>
            </Row>
          </Card>
        </TabPane>
      </Tabs>

      {/* Recent Activity */}
      <Card title="Recent System Activity" style={{ marginTop: 24 }}>
        <Timeline
          items={recentActivities.map((activity, index) => ({
            color: 'blue',
            children: (
              <div>
                <div style={{ marginBottom: 4 }}>
                  <Text strong>{activity.action}</Text>
                </div>
                <div style={{ marginBottom: 4 }}>
                  <Text type="secondary">
                    {activity.user} • {activity.time}
                  </Text>
                </div>
              </div>
            ),
          }))}
        />
      </Card>

      {/* User Modal */}
      <Modal
        title="Add/Edit User"
        open={userModalVisible}
        onCancel={() => setUserModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={userForm}
          layout="vertical"
          onFinish={handleUserSubmit}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="Full Name"
                rules={[{ required: true, message: 'Please enter full name!' }]}
              >
                <Input placeholder="Enter full name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: 'Please enter email!' },
                  { type: 'email', message: 'Please enter valid email!' }
                ]}
              >
                <Input placeholder="Enter email address" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="role"
                label="Role"
                rules={[{ required: true, message: 'Please select role!' }]}
              >
                <Select placeholder="Select role">
                  <Option value="Driver">Driver</Option>
                  <Option value="Warehouse Staff">Warehouse Staff</Option>
                  <Option value="Delivery Agent">Delivery Agent</Option>
                  <Option value="Admin">Admin</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="status"
                label="Status"
                rules={[{ required: true, message: 'Please select status!' }]}
              >
                <Select placeholder="Select status">
                  <Option value="Active">Active</Option>
                  <Option value="Inactive">Inactive</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Save User
              </Button>
              <Button onClick={() => setUserModalVisible(false)}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Pricing Modal */}
      <Modal
        title="Update Service Pricing"
        open={pricingModalVisible}
        onCancel={() => setPricingModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={pricingForm}
          layout="vertical"
          onFinish={handlePricingSubmit}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="standardBase"
                label="Standard Base Price (£)"
                rules={[{ required: true, message: 'Please enter base price!' }]}
              >
                <Input placeholder="15.00" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="standardPerKg"
                label="Standard Per KG (£)"
                rules={[{ required: true, message: 'Please enter per kg price!' }]}
              >
                <Input placeholder="2.50" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="expressBase"
                label="Express Base Price (£)"
                rules={[{ required: true, message: 'Please enter base price!' }]}
              >
                <Input placeholder="25.00" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="expressPerKg"
                label="Express Per KG (£)"
                rules={[{ required: true, message: 'Please enter per kg price!' }]}
              >
                <Input placeholder="3.50" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Update Pricing
              </Button>
              <Button onClick={() => setPricingModalVisible(false)}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminDashboardPage;
