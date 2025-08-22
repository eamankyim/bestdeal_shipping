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
  Statistic,
  Tooltip
} from 'antd';
import { 
  PlusOutlined, 
  MailOutlined, 
  UserOutlined, 
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';

const { Title, Text } = Typography;
const { Option } = Select;

const InviteManagement = () => {
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [inviteForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  
  const { sendInvite, pendingInvites } = useAuth();

  const roleOptions = [
    { value: 'driver', label: 'Driver', description: 'Collection and delivery operations' },
    { value: 'warehouse', label: 'Warehouse Staff', description: 'Inventory and storage management' },
    { value: 'delivery-agent', label: 'Delivery Agent', description: 'Final mile delivery' },
    { value: 'finance', label: 'Finance Staff', description: 'Billing and payment management' },
    { value: 'customer-service', label: 'Customer Service', description: 'Customer support and tracking' },
    { value: 'admin', label: 'Administrator', description: 'Full system access' }
  ];

  const handleSendInvite = async (values) => {
    setLoading(true);
    try {
      await sendInvite(values);
      message.success('Invitation sent successfully!');
      setInviteModalVisible(false);
      inviteForm.resetFields();
    } catch (error) {
      message.error(error.message || 'Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'processing';
      case 'accepted':
        return 'success';
      case 'expired':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <ClockCircleOutlined />;
      case 'accepted':
        return <CheckCircleOutlined />;
      case 'expired':
        return <CloseCircleOutlined />;
      default:
        return <ClockCircleOutlined />;
    }
  };

  const isExpired = (expiresAt) => {
    return new Date(expiresAt) < new Date();
  };

  const inviteColumns = [
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      render: (email) => (
        <Space>
          <MailOutlined />
          <Text strong>{email}</Text>
        </Space>
      ),
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role) => {
        const roleOption = roleOptions.find(r => r.value === role);
        return (
          <Space>
            <UserOutlined />
            <div>
              <Text strong>{roleOption?.label || role}</Text>
              <br />
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {roleOption?.description}
              </Text>
            </div>
          </Space>
        );
      },
    },
    {
      title: 'Invited By',
      dataIndex: 'invitedBy',
      key: 'invitedBy',
      render: (invitedBy) => (
        <Text type="secondary">{invitedBy}</Text>
      ),
    },
    {
      title: 'Invited Date',
      dataIndex: 'invitedAt',
      key: 'invitedAt',
      render: (invitedAt) => (
        <Text>{invitedAt}</Text>
      ),
    },
    {
      title: 'Expires',
      dataIndex: 'expiresAt',
      key: 'expiresAt',
      render: (expiresAt) => {
        const expired = isExpired(expiresAt);
        return (
          <Tag color={expired ? 'error' : 'processing'}>
            {expired ? 'Expired' : expiresAt}
          </Tag>
        );
      },
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => {
        const expired = isExpired(record.expiresAt);
        const status = expired ? 'expired' : record.status;
        return (
          <Tag color={getStatusColor(status)} icon={getStatusIcon(status)}>
            {status === 'pending' && !expired ? 'Pending' : 
             status === 'accepted' ? 'Accepted' : 'Expired'}
          </Tag>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => {
        const expired = isExpired(record.expiresAt);
        return (
          <Space>
            <Tooltip title="Resend invitation">
              <Button 
                size="small" 
                icon={<MailOutlined />}
                disabled={expired}
                onClick={() => handleResendInvite(record)}
              >
                Resend
              </Button>
            </Tooltip>
            <Tooltip title="Cancel invitation">
              <Button 
                size="small" 
                danger
                onClick={() => handleCancelInvite(record.id)}
              >
                Cancel
              </Button>
            </Tooltip>
          </Space>
        );
      },
    },
  ];

  const handleResendInvite = async (invite) => {
    try {
      // In real app, this would resend the email
      message.success('Invitation resent successfully!');
    } catch (error) {
      message.error('Failed to resend invitation');
    }
  };

  const handleCancelInvite = async (inviteId) => {
    try {
      // In real app, this would remove the invite
      message.success('Invitation cancelled successfully!');
    } catch (error) {
      message.error('Failed to cancel invitation');
    }
  };

  // Calculate statistics
  const totalInvites = pendingInvites.length;
  const pendingInvitesCount = pendingInvites.filter(inv => !isExpired(inv.expiresAt)).length;
  const expiredInvitesCount = pendingInvites.filter(inv => isExpired(inv.expiresAt)).length;

  return (
    <div>
      <Title level={3} style={{ marginBottom: '24px' }}>
        User Invitation Management
      </Title>

      {/* Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Total Invites"
              value={totalInvites}
              prefix={<MailOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Pending Invites"
              value={pendingInvitesCount}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Expired Invites"
              value={expiredInvitesCount}
              prefix={<CloseCircleOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Actions */}
      <Card style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title level={4} style={{ margin: 0 }}>
              Pending Invitations
            </Title>
            <Text type="secondary">
              Manage user invitations and track their status
            </Text>
          </div>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => setInviteModalVisible(true)}
          >
            Send New Invite
          </Button>
        </div>
      </Card>

      {/* Invites Table */}
      <Card>
        <Table
          columns={inviteColumns}
          dataSource={pendingInvites}
          rowKey="id"
          pagination={false}
          size="small"
        />
      </Card>

      {/* Send Invite Modal */}
      <Modal
        title="Send User Invitation"
        open={inviteModalVisible}
        onCancel={() => setInviteModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={inviteForm}
          layout="vertical"
          onFinish={handleSendInvite}
        >
          <Form.Item
            name="email"
            label="Email Address"
            rules={[
              { required: true, message: 'Please enter email address' },
              { type: 'email', message: 'Please enter a valid email' }
            ]}
          >
            <Input 
              prefix={<MailOutlined />} 
              placeholder="Enter email address"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="role"
            label="User Role"
            rules={[
              { required: true, message: 'Please select a role' }
            ]}
          >
            <Select 
              placeholder="Select user role"
              size="large"
            >
              {roleOptions.map(option => (
                <Option key={option.value} value={option.value}>
                  <div>
                    <Text strong>{option.label}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {option.description}
                    </Text>
                  </div>
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="message"
            label="Personal Message (Optional)"
          >
            <Input.TextArea 
              rows={3}
              placeholder="Add a personal message to the invitation email..."
            />
          </Form.Item>

          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setInviteModalVisible(false)}>
                Cancel
              </Button>
              <Button 
                type="primary" 
                htmlType="submit"
                loading={loading}
                icon={<MailOutlined />}
              >
                Send Invitation
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default InviteManagement;

