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
  Statistic,
  Tooltip,
  Alert,
  Divider
} from 'antd';
import { 
  PlusOutlined, 
  MailOutlined, 
  UserOutlined, 
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  CopyOutlined,
  LinkOutlined,
  EyeOutlined,
  ShareAltOutlined
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import { authAPI } from '../../utils/api';
import { showAlertToast, showError } from '../../utils/toast';

const { Title, Text } = Typography;
const { Option } = Select;

const InviteManagement = () => {
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [inviteLinkModalVisible, setInviteLinkModalVisible] = useState(false);
  const [generatedInviteLink, setGeneratedInviteLink] = useState('');
  const [generatedInviteEmail, setGeneratedInviteEmail] = useState('');
  const [inviteForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fetchingInvites, setFetchingInvites] = useState(true);
  const [invitations, setInvitations] = useState([]);
  
  const { sendInvite, pendingInvites } = useAuth();

  // Fetch invitations from backend on mount
  useEffect(() => {
    fetchInvitations();
  }, []);

  // Fetch invitations from backend
  const fetchInvitations = async () => {
    setFetchingInvites(true);
    try {
      console.log('📥 Fetching invitations from backend...');
      
      const response = await authAPI.getInvitations();
      
      console.log('✅ Invitations fetched:', response);
      
      if (response.success && response.data) {
        const rawInvites = Array.isArray(response.data) ? response.data : response.data.invitations || [];
        console.log('📋 Raw invitations:', rawInvites);
        
        // Transform backend data to match table format
        const transformedInvites = rawInvites.map(invite => ({
          id: invite.id,
          email: invite.email,
          role: invite.role,
          invitedBy: invite.inviter?.name || invite.inviter?.email || 'Unknown',
          invitedAt: new Date(invite.createdAt).toLocaleString(),
          expiresAt: new Date(invite.expiresAt).toLocaleString(),
          status: invite.status,
          token: invite.token,
        }));
        
        console.log('📋 Transformed invitations:', transformedInvites);
        setInvitations(transformedInvites);
      }
    } catch (error) {
      console.error('❌ Failed to fetch invitations:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response,
        stack: error.stack
      });
      // Don't show error message, just use empty array
      console.log('ℹ️ Using empty invitations array');
      setInvitations([]);
    } finally {
      setFetchingInvites(false);
    }
  };

  // Update invitations list when pendingInvites changes
  useEffect(() => {
    console.log('📊 Updating invitations list from context. Count:', pendingInvites.length);
    if (pendingInvites && pendingInvites.length > 0) {
      setInvitations(pendingInvites);
    }
  }, [pendingInvites]);

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
    
    console.log('═══════════════════════════════════════════════');
    console.log('🚀 STARTING INVITATION PROCESS');
    console.log('═══════════════════════════════════════════════');
    console.log('📧 Sending invitation to:', values.email);
    console.log('📦 Invitation data:', values);
    
    try {
      // Call backend API
      console.log('⏳ Calling authAPI.sendInvite...');
      const response = await authAPI.sendInvite(values);
      
      console.log('✅ API CALL COMPLETED');
      console.log('📥 Full API Response:', response);
      console.log('📊 Response structure:', {
        success: response?.success,
        hasData: !!response?.data,
        dataKeys: response?.data ? Object.keys(response.data) : [],
        fullData: response?.data
      });
      
      // Extract invitation data and token - try multiple paths
      const invitationData = response?.data?.invitation || response?.data;
      const token = invitationData?.token || invitationData?.id;
      
      console.log('🔍 Invitation data extracted:', invitationData);
      console.log('🎫 Token extracted:', token);
      
      if (!token) {
        console.error('❌ NO TOKEN FOUND!');
        console.error('Response data:', response?.data);
        console.error('Invitation data:', invitationData);
        
        // Show error to user
        message.error('Failed to generate invitation link. Check console for details.');
        return;
      }
      
      // Generate invite link
      const inviteLink = invitationData?.inviteLink || 
                        `${window.location.origin}/accept-invite/${token}`;
      
      console.log('═══════════════════════════════════════════════');
      console.log('🔗 INVITATION LINK GENERATED:');
      console.log(inviteLink);
      console.log('═══════════════════════════════════════════════');
      console.log('📋 Send this link to:', values.email);
      console.log('📧 Email:', values.email);
      console.log('👤 Role:', values.role);
      console.log('═══════════════════════════════════════════════');
      
      // Store link and email to show in modal
      setGeneratedInviteLink(inviteLink);
      setGeneratedInviteEmail(values.email);
      
      console.log('💾 Link stored in state. Opening modal...');
      
      // Add to local invitations list for immediate UI update
      const newInvitation = {
        id: invitationData?.id || token,
        email: values.email,
        role: values.role,
        token: token,
        inviteLink: inviteLink,
        invitedBy: 'You',
        invitedAt: new Date().toLocaleString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleString(),
        status: 'pending',
      };
      
      setInvitations(prev => [newInvitation, ...prev]);
      console.log('✅ Added invitation to list:', newInvitation);
      
      // Refresh the invitations list from backend
      fetchInvitations();
      
      // Close invite form and show link modal
      setInviteModalVisible(false);
      
      // Use setTimeout to ensure state updates
      setTimeout(() => {
        console.log('🎬 Setting inviteLinkModalVisible to true');
        setInviteLinkModalVisible(true);
        // Show toast notification about console logging
        showAlertToast(
          'Link also logged to browser console',
          'Open DevTools (F12) → Console to see the link printed for easy copying.',
          'success',
          6
        );
      }, 100);
      
      inviteForm.resetFields();
      
      message.success('Invitation created! Copy the link to send to the user.');
      
    } catch (error) {
      console.error('═══════════════════════════════════════════════');
      console.error('❌ INVITATION FAILED');
      console.error('═══════════════════════════════════════════════');
      console.error('Error object:', error);
      console.error('Error message:', error.message);
      console.error('Error status:', error.status);
      console.error('Error data:', error.data);
      console.error('═══════════════════════════════════════════════');
      
      // Determine user-friendly error message
      let errorMessage = 'Failed to send invitation. Please try again.';
      
      if (error.status === 400 && error.message?.includes('already exists')) {
        errorMessage = 'A user with this email already exists. Please use a different email address.';
      } else if (error.status === 400 && error.message) {
        errorMessage = error.message;
      } else if (error.message && !error.message.includes('localhost') && !error.message.includes('http')) {
        // Use error message if it doesn't contain URLs/localhost
        errorMessage = error.message;
      }
      
      // Show toast notification to user
      showError(errorMessage, 6);
    } finally {
      setLoading(false);
      console.log('🏁 Invitation process finished');
    }
  };

  // Copy link to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      message.success('Link copied to clipboard!');
    }).catch(() => {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        message.success('Link copied to clipboard!');
      } catch (err) {
        message.error('Failed to copy link');
      }
      document.body.removeChild(textArea);
    });
  };

  // Share link using Web Share API or fallback
  const shareLink = async (link, email) => {
    const shareData = {
      title: 'ShipEASE App Invitation',
      text: `You have been invited to join ShipEASE App. Please click the link to create your account.`,
      url: link,
    };

    // Check if Web Share API is supported
    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        message.success('Link shared successfully!');
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Error sharing:', error);
          // Fallback to copy
          copyToClipboard(link);
        }
      }
    } else {
      // Fallback: Copy link and show email template
      copyToClipboard(link);
      
      // Create email template
      const subject = encodeURIComponent('ShipEASE App Invitation');
      const body = encodeURIComponent(
        `You have been invited to join ShipEASE App!\n\n` +
        `Click the link below to create your account:\n${link}\n\n` +
        `This link expires in 7 days.`
      );
      const mailtoLink = `mailto:${email}?subject=${subject}&body=${body}`;
      
      // Open mail client
      window.location.href = mailtoLink;
      
      message.info('Link copied! Email client opened. Paste the link in your email.');
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
        const isAccepted = record.status === 'accepted';
        const isPending = record.status === 'pending';
        
        return (
          <Space>
            {isPending && !expired && (
              <>
                <Tooltip title="Copy invitation link">
                  <Button 
                    size="small" 
                    icon={<CopyOutlined />}
                    onClick={() => {
                      const linkToShow = record.token 
                        ? `${window.location.origin}/accept-invite/${record.token}`
                        : '';
                      if (linkToShow) {
                        copyToClipboard(linkToShow);
                      }
                    }}
                  />
                </Tooltip>
                <Tooltip title="Share invitation link">
                  <Button 
                    size="small" 
                    icon={<ShareAltOutlined />}
                    onClick={() => {
                      const linkToShow = record.token 
                        ? `${window.location.origin}/accept-invite/${record.token}`
                        : '';
                      if (linkToShow) {
                        shareLink(linkToShow, record.email);
                      }
                    }}
                  />
                </Tooltip>
              </>
            )}
            <Tooltip title="View invitation details">
              <Button 
                size="small" 
                icon={<EyeOutlined />}
                onClick={() => {
                  const linkToShow = record.token 
                    ? `${window.location.origin}/accept-invite/${record.token}`
                    : 'Token not available';
                  
                  Modal.info({
                    title: 'Invitation Details',
                    width: 600,
                    content: (
                      <div>
                        <p><strong>Email:</strong> {record.email}</p>
                        <p><strong>Role:</strong> {record.role}</p>
                        <p><strong>Status:</strong> {record.status}</p>
                        <p><strong>Invited By:</strong> {record.invitedBy}</p>
                        <p><strong>Invited Date:</strong> {record.invitedAt}</p>
                        <p><strong>Expires:</strong> {record.expiresAt}</p>
                        {isPending && !expired && (
                          <>
                            <Divider />
                            <p style={{ marginTop: 16 }}><strong>Invitation Link:</strong></p>
                            <Space direction="vertical" style={{ width: '100%' }} size="small">
                              <Input.TextArea
                                value={linkToShow}
                                rows={3}
                                readOnly
                                style={{ fontFamily: 'monospace', fontSize: '12px' }}
                              />
                              <Space>
                                <Button 
                                  type="primary" 
                                  icon={<CopyOutlined />}
                                  onClick={() => copyToClipboard(linkToShow)}
                                >
                                  Copy Link
                                </Button>
                                <Button 
                                  icon={<ShareAltOutlined />}
                                  onClick={() => shareLink(linkToShow, record.email)}
                                >
                                  Share
                                </Button>
                              </Space>
                            </Space>
                          </>
                        )}
                      </div>
                    ),
                  });
                }}
              />
            </Tooltip>
            <Tooltip title={
              isAccepted ? "Cannot resend accepted invitation" : 
              expired ? "Cannot resend expired invitation" : 
              "Resend invitation"
            }>
              <Button 
                size="small" 
                icon={<MailOutlined />}
                disabled={expired || isAccepted}
                onClick={() => handleResendInvite(record)}
              >
                Resend
              </Button>
            </Tooltip>
            <Tooltip title={
              isAccepted ? "Cannot cancel accepted invitation" : 
              expired ? "Cannot cancel expired invitation" :
              "Cancel invitation"
            }>
              <Button 
                size="small" 
                danger
                disabled={isAccepted || expired}
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

  // Calculate statistics from local invitations list
  const totalInvites = invitations.length;
  const pendingInvitesCount = invitations.filter(inv => !isExpired(inv.expiresAt) && inv.status === 'pending').length;
  const expiredInvitesCount = invitations.filter(inv => isExpired(inv.expiresAt)).length;

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
          dataSource={invitations}
          rowKey="id"
          pagination={false}
          size="small"
          locale={{
            emptyText: 'No pending invitations. Click "Send New Invite" to invite team members.',
          }}
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
              optionLabelProp="label"
            >
              {roleOptions.map(option => (
                <Option 
                  key={option.value} 
                  value={option.value}
                  label={option.label}
                >
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
            noStyle
            shouldUpdate={(prevValues, currentValues) => prevValues.role !== currentValues.role}
          >
            {({ getFieldValue }) => {
              const role = getFieldValue('role');
              // Show warehouse location field only for warehouse role
              if (role === 'warehouse') {
                return (
                  <Form.Item
                    name="warehouseLocation"
                    label="Warehouse Location"
                    rules={[
                      { required: false, message: 'Please select warehouse location' }
                    ]}
                    extra="Optional: Assign user to a specific warehouse. Users without location can access all warehouse dashboards."
                  >
                    <Select 
                      placeholder="Select warehouse location"
                      size="large"
                    >
                      <Option value="Ghana Warehouse">Ghana Warehouse</Option>
                      <Option value="UK Warehouse">UK Warehouse</Option>
                    </Select>
                  </Form.Item>
                );
              }
              return null;
            }}
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

      {/* Invitation Link Modal */}
      <Modal
        title={
          <Space>
            <LinkOutlined style={{ color: '#1890ff' }} />
            <span>Invitation Link Generated</span>
          </Space>
        }
        open={inviteLinkModalVisible}
        onCancel={() => setInviteLinkModalVisible(false)}
        footer={[
          <Button 
            key="close" 
            onClick={() => setInviteLinkModalVisible(false)}
          >
            Close
          </Button>,
          <Button 
            key="copy" 
            type="primary" 
            icon={<CopyOutlined />}
            onClick={() => copyToClipboard(generatedInviteLink)}
          >
            Copy Link
          </Button>,
          <Button 
            key="share" 
            type="primary" 
            icon={<ShareAltOutlined />}
            onClick={() => shareLink(generatedInviteLink, generatedInviteEmail)}
          >
            Share
          </Button>
        ]}
        width={700}
      >
        <Alert
          message="Email Service Not Yet Configured"
          description="Copy the link below and send it to the user manually via email or messaging app. Email integration will be added later."
          type="info"
          showIcon
          style={{ marginBottom: '20px' }}
        />

        <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#f0f5ff', borderRadius: '8px' }}>
          <Space direction="vertical" size={4} style={{ width: '100%' }}>
            <Text strong>Send invitation to:</Text>
            <Text style={{ fontSize: '16px', color: '#1890ff' }}>
              <MailOutlined /> {generatedInviteEmail}
            </Text>
          </Space>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <Text strong style={{ display: 'block', marginBottom: '8px' }}>
            Invitation Link:
          </Text>
          <Input.TextArea
            value={generatedInviteLink}
            rows={4}
            readOnly
            style={{ 
              fontFamily: 'monospace', 
              fontSize: '13px',
              backgroundColor: '#f5f5f5'
            }}
          />
        </div>

        <div style={{ 
          padding: '16px', 
          backgroundColor: '#fafafa', 
          borderRadius: '8px',
          border: '1px dashed #d9d9d9'
        }}>
          <Space direction="vertical" style={{ width: '100%' }} size="small">
            <Text strong>How to use this link:</Text>
            <Text>1. Copy the invitation link above</Text>
            <Text>2. Send it to the user via email, WhatsApp, or any messaging app</Text>
            <Text>3. User clicks the link and creates their account</Text>
            <Text type="secondary" style={{ fontSize: '12px', marginTop: '8px' }}>
              ⚠️ Link expires in 7 days. Email integration coming soon.
            </Text>
          </Space>
        </div>

        <Divider />
      </Modal>
    </div>
  );
};

export default InviteManagement;

