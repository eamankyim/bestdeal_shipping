import React, { useState, useEffect } from 'react';
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
  Switch,
  Upload
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
  MailOutlined as MailIcon,
  CameraOutlined,
  LockOutlined,
  LoadingOutlined
} from '@ant-design/icons';
import InviteManagement from '../components/admin/InviteManagement';
import RoleManagement from '../components/admin/RoleManagement';
import NotificationSettings from '../components/settings/NotificationSettings';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../utils/api';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const AdminDashboardPage = () => {
  const { currentUser, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [userModalVisible, setUserModalVisible] = useState(false);
  const [isDetailsDrawerVisible, setIsDetailsDrawerVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingOrganisation, setIsEditingOrganisation] = useState(false);
  const [changePasswordModalVisible, setChangePasswordModalVisible] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [userForm] = Form.useForm();
  const [profileForm] = Form.useForm();
  const [organisationForm] = Form.useForm();
  const [passwordForm] = Form.useForm();

  // Set initial profile form values from current user
  useEffect(() => {
    if (currentUser) {
      profileForm.setFieldsValue({
        name: currentUser.name,
        email: currentUser.email,
        phone: currentUser.phone || '',
        role: currentUser.role,
      });
    }
  }, [currentUser, profileForm]);

  // Handle profile edit
  const handleEditProfile = () => {
    setIsEditingProfile(true);
  };

  const handleCancelEdit = () => {
    setIsEditingProfile(false);
    // Reset form to original values
    profileForm.setFieldsValue({
      name: currentUser.name,
      email: currentUser.email,
      phone: currentUser.phone || '',
      role: currentUser.role,
    });
  };

  const handleUpdateProfile = async (values) => {
    try {
      console.log('Updating profile:', values);
      
      const updateData = {
        name: values.name,
        phone: values.phone || null,
      };

      // Add avatar data if uploaded
      if (avatarPreview) {
        updateData.avatarData = avatarPreview;
      }

      const response = await authAPI.updateProfile(updateData);
      
      if (response.success) {
        message.success('Profile updated successfully!');
        setIsEditingProfile(false);
        setAvatarPreview(null);
        
        // Refresh user data in AuthContext
        if (refreshUser) {
          await refreshUser();
        }
      } else {
        message.error(response.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      message.error(error.message || 'Failed to update profile');
    }
  };

  const handleAvatarUpload = (file) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('You can only upload image files!');
      return false;
    }

    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error('Image must be smaller than 2MB!');
      return false;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onload = () => {
      setAvatarPreview(reader.result);
    };
    reader.readAsDataURL(file);

    return false; // Prevent auto upload
  };

  const handleChangePassword = async (values) => {
    try {
      const response = await authAPI.changePassword(values.currentPassword, values.newPassword);
      
      if (response.success) {
        message.success('Password changed successfully! Please login again.');
        setChangePasswordModalVisible(false);
        passwordForm.resetFields();
        
        // Logout user after password change
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else {
        message.error(response.message || 'Failed to change password');
      }
    } catch (error) {
      console.error('Failed to change password:', error);
      message.error(error.message || 'Failed to change password');
    }
  };

  // Handle organisation settings edit
  const handleEditOrganisation = () => {
    setIsEditingOrganisation(true);
  };

  const handleCancelOrganisationEdit = () => {
    setIsEditingOrganisation(false);
    organisationForm.resetFields();
  };

  const handleUpdateOrganisation = (values) => {
    console.log('Updating organisation:', values);
    // TODO: Call API to update organisation settings
    message.success('Organisation settings updated successfully!');
    setIsEditingOrganisation(false);
  };

  // Function to generate initials from user name
  const getUserInitials = (name) => {
    if (!name) return 'U';
    
    const nameParts = name.trim().split(' ');
    if (nameParts.length === 1) {
      return nameParts[0].charAt(0).toUpperCase();
    }
    
    return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
  };

  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Fetch team members/users
  useEffect(() => {
    if (activeTab === 'team-members') {
      fetchUsers();
    }
  }, [activeTab]);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      console.log('📥 Fetching team members from backend...');
      
      const response = await authAPI.getUsers();
      
      console.log('✅ Team members fetched:', response);
      
      if (response.success && response.data) {
        const rawUsers = Array.isArray(response.data) ? response.data : response.data.users || [];
        console.log('📋 Raw users:', rawUsers);
        
        // Transform backend data to match table format
        const transformedUsers = rawUsers.map(user => ({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone || 'N/A',
          department: getRoleDepartment(user.role),
          status: user.status || 'active',
          joinedDate: new Date(user.createdAt).toLocaleDateString(),
          lastLogin: user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never',
          avatar: null, // TODO: Add avatar support
        }));
        
        console.log('📋 Transformed users:', transformedUsers);
        setUsers(transformedUsers);
      }
    } catch (error) {
      console.error('❌ Failed to fetch team members:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response,
        stack: error.stack
      });
      message.error('Failed to load team members');
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Helper function to get department from role
  const getRoleDepartment = (role) => {
    const departments = {
      'superadmin': 'Administration',
      'admin': 'Administration',
      'driver': 'Operations',
      'warehouse': 'Warehouse',
      'delivery-agent': 'Delivery',
      'finance': 'Finance',
      'customer-service': 'Customer Service',
      'user': 'General'
    };
    return departments[role] || 'General';
  };

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
          superadmin: 'red',
          admin: 'blue',
          driver: 'orange',
          warehouse: 'green',
          'delivery-agent': 'purple',
          finance: 'gold',
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
            {/* User Avatar and Info */}
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <Avatar 
                  size={100} 
                  src={avatarPreview || currentUser?.avatarUrl}
                  style={{
                    backgroundColor: (avatarPreview || currentUser?.avatarUrl) ? undefined : '#1890ff',
                    fontSize: '40px',
                    fontWeight: 'bold'
                  }}
                >
                  {(avatarPreview || currentUser?.avatarUrl) ? undefined : getUserInitials(currentUser?.name)}
                </Avatar>
                {isEditingProfile && (
                  <Upload
                    showUploadList={false}
                    beforeUpload={handleAvatarUpload}
                    accept="image/*"
                  >
                    <Button
                      shape="circle"
                      icon={uploadingAvatar ? <LoadingOutlined /> : <CameraOutlined />}
                      size="large"
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        right: 0,
                        backgroundColor: '#1890ff',
                        borderColor: '#1890ff',
                        color: 'white'
                      }}
                    />
                  </Upload>
                )}
              </div>
              <Title level={3} style={{ marginTop: '16px', marginBottom: '4px' }}>
                {currentUser?.name || 'User'}
              </Title>
              <Tag color="blue" style={{ fontSize: '14px', padding: '4px 12px' }}>
                {currentUser?.role?.replace('-', ' ').toUpperCase() || 'USER'}
              </Tag>
            </div>

            <Divider />

            <Form 
              form={profileForm}
              layout="vertical"
              onFinish={handleUpdateProfile}
            >
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item 
                    label="Full Name" 
                    name="name"
                    rules={[{ required: true, message: 'Please enter your name' }]}
                  >
                    <Input 
                      prefix={<UserOutlined />} 
                      placeholder="Your full name"
                      size="large"
                      disabled={!isEditingProfile}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item 
                    label="Email" 
                    name="email"
                  >
                    <Input 
                      prefix={<MailOutlined />} 
                      placeholder="Your email"
                      disabled
                      size="large"
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item label="Phone" name="phone">
                    <Input 
                      prefix={<PhoneOutlined />} 
                      placeholder="Your phone number"
                      size="large"
                      disabled={!isEditingProfile}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label="Role" name="role">
                    <Input 
                      prefix={<TeamOutlined />} 
                      disabled
                      size="large"
                      style={{ textTransform: 'capitalize' }}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Divider />

              <Title level={5}>Account Information</Title>
              <Descriptions column={1} bordered size="small">
                <Descriptions.Item label="Account Status">
                  <Tag color="success">Active</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Last Login">
                  {currentUser?.lastLogin 
                    ? new Date(currentUser.lastLogin).toLocaleString() 
                    : 'Just now'}
                </Descriptions.Item>
              </Descriptions>

              <Divider />

              <Form.Item>
                {!isEditingProfile ? (
                  <Space>
                    <Button 
                      type="primary" 
                      icon={<EditOutlined />}
                      onClick={handleEditProfile}
                      size="large"
                    >
                      Edit Profile
                    </Button>
                    <Button 
                      size="large"
                      icon={<LockOutlined />}
                      onClick={() => setChangePasswordModalVisible(true)}
                    >
                      Change Password
                    </Button>
                  </Space>
                ) : (
                  <Space>
                    <Button 
                      type="primary" 
                      htmlType="submit" 
                      size="large"
                    >
                      Save Changes
                    </Button>
                    <Button 
                      size="large"
                      onClick={handleCancelEdit}
                    >
                      Cancel
                    </Button>
                  </Space>
                )}
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
            <Form 
              form={organisationForm}
              layout="vertical"
              onFinish={handleUpdateOrganisation}
              initialValues={{
                companyName: 'ShipEASE',
                industry: 'logistics'
              }}
            >
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item label="Company Name" name="companyName">
                    <Input 
                      placeholder="ShipEASE Ltd" 
                      size="large"
                      disabled={!isEditingOrganisation}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label="Business Registration" name="businessReg">
                    <Input 
                      placeholder="Company registration number" 
                      size="large"
                      disabled={!isEditingOrganisation}
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item label="VAT Number" name="vatNumber">
                    <Input 
                      placeholder="VAT registration number" 
                      size="large"
                      disabled={!isEditingOrganisation}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label="Industry" name="industry">
                    <Select 
                      placeholder="Select industry"
                      size="large"
                      disabled={!isEditingOrganisation}
                    >
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
                    <TextArea 
                      rows={3} 
                      placeholder="Enter company address"
                      disabled={!isEditingOrganisation}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Divider />

              <Form.Item>
                {!isEditingOrganisation ? (
                  <Button 
                    type="primary" 
                    icon={<EditOutlined />}
                    onClick={handleEditOrganisation}
                    size="large"
                  >
                    Edit Organisation Settings
                  </Button>
                ) : (
                  <Space>
                    <Button 
                      type="primary" 
                      htmlType="submit" 
                      size="large"
                    >
                      Save Changes
                    </Button>
                    <Button 
                      size="large"
                      onClick={handleCancelOrganisationEdit}
                    >
                      Cancel
                    </Button>
                  </Space>
                )}
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
      key: 'roles',
      label: 'Roles',
      children: <RoleManagement />,
    },
    {
      key: 'team-members',
      label: 'Team Members',
      children: (
        <div>
          {(currentUser?.role === 'admin' || currentUser?.role === 'superadmin') && (
            <div style={{ marginBottom: '16px', textAlign: 'right' }}>
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={handleInviteTeamMember}
                style={{ width: 'auto' }}
              >
                Invite Team Member
              </Button>
            </div>
          )}
          <Table
            columns={userColumns}
            dataSource={users}
            loading={loadingUsers}
            pagination={false}
            size="small"
            locale={{
              emptyText: 'No team members yet. Users who accept invitations will appear here.'
            }}
          />
        </div>
      ),
    },
    {
      key: 'notifications',
      label: 'Notifications',
      children: (
        <div>
          <NotificationSettings />
        </div>
      ),
    },
  ];

  // Filter tabs based on user role
  const filteredTabItems = tabItems.filter(tab => {
    // ADMIN/SUPERADMIN ONLY: Organisation, Invites, Roles
    const adminOnlyTabs = ['organisation', 'invites', 'roles'];
    
    if (adminOnlyTabs.includes(tab.key)) {
      return currentUser?.role === 'admin' || currentUser?.role === 'superadmin';
    }
    
    // ALL ROLES: Profile
    if (tab.key === 'profile') {
      return true;
    }
    
    // ALL ROLES: Team Members (view-only for non-admin)
    if (tab.key === 'team-members') {
      return true;
    }
    
    // ALL ROLES: Notifications
    if (tab.key === 'notifications') {
      return true;
    }
    
    // Default: only admin/superadmin sees unknown tabs
    return currentUser?.role === 'admin' || currentUser?.role === 'superadmin';
  });

  return (
    <div>
      <Title level={2} style={{ marginBottom: '24px' }}>
        Settings
      </Title>

      {/* Main Content Tabs */}
      <Card>
        <Tabs
          defaultActiveKey="profile"
          items={filteredTabItems}
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

      {/* Change Password Modal */}
      <Modal
        title="Change Password"
        open={changePasswordModalVisible}
        onCancel={() => {
          setChangePasswordModalVisible(false);
          passwordForm.resetFields();
        }}
        footer={null}
        width={500}
      >
        <Form
          form={passwordForm}
          layout="vertical"
          onFinish={handleChangePassword}
        >
          <Form.Item
            name="currentPassword"
            label="Current Password"
            rules={[{ required: true, message: 'Please enter your current password' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Enter current password"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="newPassword"
            label="New Password"
            rules={[
              { required: true, message: 'Please enter new password' },
              { min: 6, message: 'Password must be at least 6 characters' }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Enter new password"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="Confirm New Password"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: 'Please confirm your new password' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Passwords do not match!'));
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Confirm new password"
              size="large"
            />
          </Form.Item>

          <Divider />

          <Form.Item style={{ marginBottom: 0 }}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button 
                size="large"
                onClick={() => {
                  setChangePasswordModalVisible(false);
                  passwordForm.resetFields();
                }}
              >
                Cancel
              </Button>
              <Button 
                type="primary" 
                htmlType="submit"
                size="large"
                icon={<LockOutlined />}
              >
                Change Password
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminDashboardPage;
