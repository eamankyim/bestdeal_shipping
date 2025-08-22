import React, { useState } from 'react';
import { 
  Card, 
  Button, 
  Table, 
  Modal, 
  Form, 
  Input, 
  Select, 
  message, 
  Space, 
  Tag, 
  Typography,
  Row,
  Col,
  Tabs,
  Avatar,
  Drawer,
  Descriptions,
  Divider,
  InputNumber,
  Switch
} from 'antd';
import { 
  PlusOutlined, 
  UserOutlined, 
  MailOutlined, 
  PhoneOutlined,
  EditOutlined,
  EyeOutlined,
  SettingOutlined,
  TeamOutlined,
  MailOutlined as MailIcon
} from '@ant-design/icons';
import InviteManagement from '../components/admin/InviteManagement';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const AdminDashboardPage = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [userModalVisible, setUserModalVisible] = useState(false);
  const [isDetailsDrawerVisible, setIsDetailsDrawerVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userForm] = Form.useForm();

  // Function to generate initials from user name
  const getUserInitials = (name) => {
    if (!name) return 'U';
    
    const nameParts = name.trim().split(' ');
    if (nameParts.length === 1) {
      return nameParts[0].charAt(0).toUpperCase();
    }
    
    return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
  };

  // Mock user data for display
  const [users] = useState([
    {
      key: '1',
      id: 1,
      name: 'Admin User',
      email: 'admin@shipease.com',
      role: 'admin',
      status: 'active',
      avatar: null, // No avatar to show initials
      phone: '+44 20 1234 5678',
      department: 'Management',
      joinedDate: '2024-01-01',
      lastLogin: '2024-01-21 14:30'
    },
    {
      key: '2',
      id: 2,
      name: 'John Driver',
      email: 'driver@shipease.com',
      role: 'driver',
      status: 'active',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=driver',
      phone: '+44 20 1234 5679',
      department: 'Operations',
      joinedDate: '2024-01-06',
      lastLogin: '2024-01-21 12:15'
    },
    {
      key: '3',
      id: 3,
      name: 'Sarah Warehouse',
      email: 'warehouse@shipease.com',
      role: 'warehouse',
      status: 'active',
      avatar: null, // No avatar to show initials
      phone: '+44 20 1234 5680',
      department: 'Operations',
      joinedDate: '2024-01-04',
      lastLogin: '2024-01-21 09:45'
    },
    {
      key: '4',
      id: 4,
      name: 'Mike Delivery',
      email: 'delivery@shipease.com',
      role: 'delivery-agent',
      status: 'active',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=delivery',
      phone: '+44 20 1234 5681',
      department: 'Operations',
      joinedDate: '2024-01-03',
      lastLogin: '2024-01-21 11:20'
    }
  ]);

  const userColumns = [
    {
      title: 'User',
      key: 'user',
      render: (_, record) => (
        <Space>
          <Avatar 
            src={record.avatar} 
            size="large"
            style={{
              backgroundColor: record.avatar ? undefined : '#1890ff',
              color: record.avatar ? undefined : '#fff',
              fontWeight: 'bold',
              fontSize: '16px'
            }}
          >
            {record.avatar ? undefined : getUserInitials(record.name)}
          </Avatar>
          <div>
            <Text strong>{record.name}</Text>
            <br />
            <Text type="secondary">{record.email}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role) => {
        const roleColors = {
          admin: 'red',
          driver: 'blue',
          warehouse: 'green',
          'delivery-agent': 'orange',
          finance: 'purple',
          'customer-service': 'cyan'
        };
        return <Tag color={roleColors[role] || 'default'}>{role.replace('-', ' ').toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Department',
      dataIndex: 'department',
      key: 'department',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'active' ? 'success' : 'error'}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Joined Date',
      dataIndex: 'joinedDate',
      key: 'joinedDate',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewUser(record)}
          >
            View
          </Button>
        </Space>
      ),
    },
  ];

  const handleViewUser = (user) => {
    setSelectedUser(user);
    setIsDetailsDrawerVisible(true);
  };

  const handleInviteTeamMember = () => {
    // This will be handled by the InviteManagement component
    message.info('Use the Invite Management tab to send invitations');
  };

  const tabItems = [
    {
      key: 'profile',
      label: 'Profile',
      children: (
        <div>
          <Title level={4}>Personal Profile</Title>
          <Card>
            <Form layout="vertical">
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="Full Name" name="name">
                    <Input prefix={<UserOutlined />} placeholder="Your full name" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Email" name="email">
                    <Input prefix={<MailOutlined />} placeholder="Your email" />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="Phone" name="phone">
                    <Input prefix={<PhoneOutlined />} placeholder="Your phone number" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Department" name="department">
                    <Select placeholder="Select department">
                      <Option value="management">Management</Option>
                      <Option value="operations">Operations</Option>
                      <Option value="finance">Finance</Option>
                      <Option value="customer-service">Customer Service</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item>
                <Button type="primary">Update Profile</Button>
              </Form.Item>
            </Form>
          </Card>
        </div>
      ),
    },
    {
      key: 'organisation',
      label: 'Organisation',
      children: (
        <div>
          <Title level={4}>Organisation Settings</Title>
          <Card>
            <Form layout="vertical">
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="Company Name" name="companyName">
                    <Input placeholder="ShipEASE Ltd" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Business Registration" name="businessReg">
                    <Input placeholder="Company registration number" />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="VAT Number" name="vatNumber">
                    <Input placeholder="VAT registration number" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Industry" name="industry">
                    <Select placeholder="Select industry">
                      <Option value="logistics">Logistics & Transportation</Option>
                      <Option value="ecommerce">E-commerce</Option>
                      <Option value="retail">Retail</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={24}>
                  <Form.Item label="Company Address" name="address">
                    <TextArea rows={3} placeholder="Enter company address" />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item>
                <Button type="primary">Save Organisation Settings</Button>
              </Form.Item>
            </Form>
          </Card>
        </div>
      ),
    },
    {
      key: 'invites',
      label: 'Invites',
      children: <InviteManagement />,
    },
    {
      key: 'team-members',
      label: 'Team Members',
      children: (
        <div>
          <div style={{ marginBottom: '16px' }}>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={handleInviteTeamMember}
            >
              Invite Team Member
            </Button>
          </div>
          <Table
            columns={userColumns}
            dataSource={users}
            pagination={false}
            size="small"
          />
        </div>
      ),
    },
  ];

  return (
    <div>
      <Title level={2} style={{ marginBottom: '24px' }}>
        Settings
      </Title>

      {/* Main Content Tabs */}
      <Card>
        <Tabs
          defaultActiveKey="profile"
          items={tabItems}
          onChange={setActiveTab}
        />
      </Card>

      {/* User Details Side Drawer */}
      <Drawer
        title="User Details"
        placement="right"
        onClose={() => setIsDetailsDrawerVisible(false)}
        open={isDetailsDrawerVisible}
        width={600}
      >
        {selectedUser && (
          <div>
            {/* User Overview */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              <Col span={8}>
                <div style={{ textAlign: 'center' }}>
                  <Avatar 
                    src={selectedUser.avatar} 
                    size={64}
                    style={{
                      backgroundColor: selectedUser.avatar ? undefined : '#1890ff',
                      color: selectedUser.avatar ? undefined : '#fff',
                      fontWeight: 'bold',
                      fontSize: '24px'
                    }}
                  >
                    {selectedUser.avatar ? undefined : getUserInitials(selectedUser.name)}
                  </Avatar>
                  <Title level={4} style={{ margin: '8px 0 0' }}>
                    {selectedUser.name}
                  </Title>
                  <Text type="secondary">{selectedUser.role}</Text>
                </div>
              </Col>
              <Col span={16}>
                <div style={{ textAlign: 'center' }}>
                  <Text strong>Status</Text>
                  <br />
                  <Tag color="success" style={{ fontSize: '16px' }}>
                    {selectedUser.status.toUpperCase()}
                  </Tag>
                </div>
              </Col>
            </Row>
            <Divider />

            {/* User Details */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              <Col span={24}>
                <Card size="small" title="User Information">
                  <Descriptions column={2} size="small">
                    <Descriptions.Item label="Email">
                      <Space>
                        <MailOutlined />
                        {selectedUser.email}
                      </Space>
                    </Descriptions.Item>
                    <Descriptions.Item label="Phone">
                      <Space>
                        <PhoneOutlined />
                        {selectedUser.phone}
                      </Space>
                    </Descriptions.Item>
                    <Descriptions.Item label="Department">
                      {selectedUser.department}
                    </Descriptions.Item>
                    <Descriptions.Item label="Role">
                      <Tag color="blue">{selectedUser.role.replace('-', ' ').toUpperCase()}</Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Joined Date">
                      {selectedUser.joinedDate}
                    </Descriptions.Item>
                    <Descriptions.Item label="Last Login">
                      {selectedUser.lastLogin}
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              </Col>
            </Row>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default AdminDashboardPage;
