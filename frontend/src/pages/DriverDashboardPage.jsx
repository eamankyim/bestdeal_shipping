import React, { useState, useEffect } from 'react';
import { 
  Row, 
  Col, 
  Card, 
  Statistic, 
  Table, 
  Button, 
  Modal, 
  Form, 
  Input, 
  Upload, 
  Typography, 
  Tag, 
  Space,
  message,
  Timeline,
  Drawer,
  Descriptions,
  Divider,
  Progress,
  Tabs,
  Dropdown,
  Menu
} from 'antd';
import { 
  CarOutlined, 
  CheckCircleOutlined, 
  ClockCircleOutlined, 
  UploadOutlined,
  SignatureOutlined,
  EditOutlined,
  EyeOutlined,
  UserOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  PhoneOutlined,
  PlayCircleOutlined,
  HomeOutlined,
  MoreOutlined
} from '@ant-design/icons';
import { JOB_STATUSES, getStatusColor } from '../constants/jobStatuses';
import { jobAPI } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import ResponsiveTable from '../components/common/ResponsiveTable';
import { hasPermission } from '../utils/permissions';

const { Title, Text } = Typography;
const { TextArea } = Input;

const DriverDashboardPage = () => {
  const { currentUser } = useAuth();
  const canViewRevenue = hasPermission(currentUser, 'financial:view');
  const [completionModalVisible, setCompletionModalVisible] = useState(false);
  const [isDetailsDrawerVisible, setIsDetailsDrawerVisible] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [assignedJobs, setAssignedJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [stats, setStats] = useState([
    { title: 'Collections Today', value: 0, suffix: '', color: '#1890ff' },
    { title: 'Completed', value: 0, suffix: '', color: '#52c41a' },
    { title: 'Pending', value: 0, suffix: '', color: '#faad14' },
    { title: 'Total Weight', value: 0, suffix: ' kg', color: '#722ed1' },
  ]);
  const [form] = Form.useForm();

  // Create broadcast channel for cross-tab communication
  useEffect(() => {
    const channel = new BroadcastChannel('job_updates');
    
    // Listen for updates from other tabs
    channel.onmessage = (event) => {
      console.log('📡 Received job update from another tab:', event.data);
      if (event.data.type === 'JOB_STATUS_UPDATED' || event.data.type === 'JOB_CREATED' || event.data.type === 'BATCH_CREATED' || event.data.type === 'BATCH_SHIPPED') {
        // Refresh jobs list silently
        fetchMyJobs(true);
      }
    };
    
    // Cleanup
    return () => {
      channel.close();
    };
  }, []);

  // Fetch driver's assigned jobs
  useEffect(() => {
    fetchMyJobs();
  }, []);

  // Auto-refresh jobs every 120 seconds (2 minutes) to reduce API load
  useEffect(() => {
    // Don't auto-refresh if there's an API error (rate limit, etc.)
    if (apiError) return;
    
    const interval = setInterval(() => {
      if (!apiError) { // Double-check error state before refresh
        console.log('🔄 Auto-refreshing driver jobs...');
        fetchMyJobs(true); // Silent refresh
      }
    }, 120000); // 120 seconds (2 minutes)

    return () => clearInterval(interval);
  }, [apiError]);

  const fetchMyJobs = async (silent = false) => {
    if (!silent) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    
    try {
      console.log(silent ? '🔄 Silently fetching driver jobs...' : '📥 Fetching driver assigned jobs...');
      
      // Jobs are automatically filtered by backend based on user role
      const response = await jobAPI.getAll();
      
      console.log('✅ Driver jobs fetched:', response);
      
      if (response.success && response.data) {
        const rawJobs = Array.isArray(response.data) ? response.data : response.data.jobs || [];
        console.log('📋 Raw driver jobs:', rawJobs);
        
        // Transform backend data to match table format
        const transformedJobs = rawJobs.map(job => ({
          id: job.id,
          trackingId: job.trackingId,
          jobId: job.trackingId,
          customer: job.customer?.name || 'N/A',
          customerPhone: job.customer?.phone || 'N/A',
          pickupAddress: job.pickupAddress,
          deliveryAddress: job.deliveryAddress,
          warehouseLocation: job.warehouseLocation || 'Main Warehouse',
          status: job.status,
          priority: job.priority || 'Standard',
          pickupDate: job.pickupDate ? new Date(job.pickupDate).toLocaleDateString() : 'N/A',
          weight: job.weight || 0,
          value: job.value || 0,
          description: job.description || 'N/A',
          specialInstructions: job.specialInstructions || 'None',
        }));
        
        console.log('📋 Transformed driver jobs:', transformedJobs);
        setAssignedJobs(transformedJobs);
        
        // Calculate statistics
        const today = new Date().toDateString();
        const collectionsToday = transformedJobs.filter(j => 
          new Date(j.pickupDate).toDateString() === today
        ).length;
        
        const completed = transformedJobs.filter(j => 
          ['delivered', 'arrived_at_warehouse'].includes(j.status)
        ).length;
        
        const pending = transformedJobs.filter(j => 
          ['pending', 'assigned'].includes(j.status)
        ).length;
        
        const totalWeight = transformedJobs.reduce((sum, j) => sum + (parseFloat(j.weight) || 0), 0);
        
        setStats([
          { title: 'Collections Today', value: collectionsToday, suffix: '', color: '#1890ff' },
          { title: 'Completed', value: completed, suffix: '', color: '#52c41a' },
          { title: 'Pending', value: pending, suffix: '', color: '#faad14' },
          { title: 'Total Weight', value: totalWeight.toFixed(1), suffix: ' kg', color: '#722ed1' },
        ]);
        // Clear API error on successful fetch
        setApiError(null);
      }
    } catch (error) {
      console.error('❌ Failed to fetch driver jobs:', error);
      
      // Check if it's a rate limit error
      if (error.message && error.message.includes('Too many requests')) {
        setApiError('rate_limit');
        if (!silent) {
          message.error('Too many requests. Please wait a moment and refresh the page.');
        }
      } else {
        setApiError(null); // Clear error for non-rate-limit issues
        if (!silent) {
          message.error('Failed to load your jobs');
        }
      }
      
      setAssignedJobs([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const recentCollections = assignedJobs.filter(j => 
    ['collected', 'in_transit', 'arrived_at_warehouse'].includes(j.status)
  ).slice(0, 5);

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Urgent':
        return 'error';
      case 'Express':
        return 'warning';
      case 'Standard':
        return 'default';
      default:
        return 'default';
    }
  };

  const handleStartJourney = async (job) => {
    try {
      console.log('🚀 Starting journey for job:', job.trackingId);
      
      // Determine next status based on current status
      let nextStatus = 'collected';
      let notes = 'Driver collected package from customer';
      
      if (job.status === 'collected') {
        nextStatus = 'in_transit';
        notes = 'Package in transit to warehouse';
      }
      
      // Update job status
      await jobAPI.updateStatus(job.id, { 
        status: nextStatus,
        notes: notes
      });
      
      message.success(`Status updated to: ${nextStatus.replace(/_/g, ' ')}`);
      
      // Refresh jobs list
      await fetchMyJobs();
    } catch (error) {
      console.error('Failed to update status:', error);
      message.error(error.message || 'Failed to update status');
    }
  };

  const handleConfirmDropoff = async (job) => {
    try {
      console.log('🏠 Confirming warehouse drop-off:', job.trackingId);
      
      // Update job status to 'arrived_at_warehouse'
      await jobAPI.updateStatus(job.id, { 
        status: 'arrived_at_warehouse',
        notes: 'Package arrived at warehouse'
      });
      
      message.success('Warehouse drop-off confirmed!');
      
      // Refresh jobs list
      await fetchMyJobs();
    } catch (error) {
      console.error('Failed to confirm drop-off:', error);
      message.error(error.message || 'Failed to update status');
    }
  };

  const columns = [
    {
      title: 'Tracking ID',
      dataIndex: 'trackingId',
      key: 'trackingId',
      render: (text) => <Text strong>{text}</Text>,
      mobile: true,
    },
    {
      title: 'Customer',
      dataIndex: 'customer',
      key: 'customer',
      mobile: true,
    },
    {
      title: 'Pickup Address',
      dataIndex: 'pickupAddress',
      key: 'pickupAddress',
      ellipsis: true,
      mobile: false,
    },
    {
      title: 'Warehouse',
      dataIndex: 'warehouseLocation',
      key: 'warehouseLocation',
      render: (text) => text || 'Main Warehouse',
      mobile: false,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      mobile: true,
      render: (status) => (
        <Tag color={
          ['delivered', 'arrived_at_warehouse'].includes(status) ? 'green' :
          ['in_transit', 'collected', 'out_for_delivery'].includes(status) ? 'blue' :
          ['assigned', 'batched'].includes(status) ? 'orange' :
          status === 'cancelled' ? 'red' :
          'default'
        }>
          {status?.replace(/_/g, ' ').toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      mobile: true,
      render: (priority) => (
        <Tag color={priority === 'Urgent' ? 'red' : priority === 'Express' ? 'orange' : 'blue'}>
          {priority}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      mobile: true,
      render: (_, record) => (
        <Space size="small">
          {/* Show different buttons based on job status */}
          {record.status === 'assigned' && (
            <Button 
              type="primary"
              size="small"
              icon={<PlayCircleOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                handleStartJourney(record);
              }}
            >
              Mark as Collected
            </Button>
          )}
          
          {record.status === 'collected' && (
            <Button 
              type="primary"
              size="small"
              icon={<CarOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                handleStartJourney(record);
              }}
            >
              Mark as In Transit
            </Button>
          )}
          
          {record.status === 'in_transit' && (
            <Button 
              type="primary"
              size="small"
              icon={<HomeOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                handleConfirmDropoff(record);
              }}
            >
              Mark as Arrived at Warehouse
            </Button>
          )}
          
          <Button 
            size="small"
            icon={<EyeOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              handleViewJob(record);
            }}
          >
            View
          </Button>
        </Space>
      ),
    },
  ];

  const handleViewJob = async (job) => {
    try {
      console.log('🔍 Viewing job details:', job.id);
      
      // Fetch full job details from backend
      const response = await jobAPI.getById(job.id);
      
      if (response.success && response.data) {
        console.log('✅ Job details fetched:', response.data);
        setSelectedJob(response.data.job);
        setIsDetailsDrawerVisible(true);
      } else {
        message.error('Failed to load job details');
      }
    } catch (error) {
      console.error('❌ Failed to fetch job details:', error);
      message.error(error.message || 'Failed to load job details');
    }
  };

  const handleUpdateStatus = async (status, notes = '') => {
    if (!selectedJob) return;
    
    setUpdatingStatus(true);
    const statusLabel = status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    
    try {
      console.log('🔄 Updating job status to:', status);
      
      message.loading({ content: `Updating status to ${statusLabel}...`, key: 'statusUpdate' });
      
      const response = await jobAPI.updateStatus(selectedJob.id, { 
        status, 
        notes: notes || `Status updated to ${statusLabel}` 
      });
      
      if (response.success) {
        message.success({ content: `Job marked as ${statusLabel}`, key: 'statusUpdate', duration: 2 });
        
        // Broadcast update to other tabs
        const channel = new BroadcastChannel('job_updates');
        channel.postMessage({
          type: 'JOB_STATUS_UPDATED',
          jobId: selectedJob.id,
          newStatus: status,
          timestamp: new Date().toISOString()
        });
        channel.close();
        
        // Refresh job details
        await handleViewJob({ id: selectedJob.id });
        
        // Refresh jobs list
        await fetchMyJobs();
      } else {
        message.error({ content: response.message || 'Failed to update status', key: 'statusUpdate', duration: 3 });
      }
    } catch (error) {
      console.error('❌ Failed to update status:', error);
      message.error({ content: error.message || 'Failed to update status', key: 'statusUpdate', duration: 3 });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleCompleteCollection = (job) => {
    setSelectedJob(job);
    setCompletionModalVisible(true);
  };

  const handleCompletionSubmit = async (values) => {
    try {
      // TODO: API call to update job status to "Collected"
      // PUT /api/jobs/:jobId/status
      // Body: { status: 'Collected', ...values }
      
      console.log('Confirming collection for job:', selectedJob?.jobId, values);
      message.success('Collection confirmed! Job updated to "Collected"');
      setCompletionModalVisible(false);
      form.resetFields();
      setSelectedJob(null);
    } catch (error) {
      message.error('Failed to complete collection. Please try again.');
    }
  };

  return (
    <div>
      <Title level={2} style={{ marginBottom: '24px' }}>
        Driver Dashboard
      </Title>

      {/* Driver Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        {stats.map((stat, index) => (
          <Col xs={12} sm={12} md={6} key={index}>
            <Card>
              <Statistic
                title={stat.title}
                value={stat.value}
                suffix={stat.suffix}
                valueStyle={{ color: stat.color }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* Assigned Collection Jobs */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col span={24}>
          <Card title="Assigned Collection Jobs">
            <ResponsiveTable
              columns={columns}
              dataSource={assignedJobs}
              loading={loading}
              rowKey="id"
              pagination={false}
              size="small"
              locale={{
                emptyText: 'No jobs assigned to you yet. Jobs will appear here when assigned by admin.'
              }}
              onCardClick={handleViewJob}
            />
          </Card>
        </Col>
      </Row>

      {/* Recent Collections */}
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card title="Recent Collections">
            <Timeline>
              {recentCollections.map((collection, index) => (
                <Timeline.Item 
                  key={index} 
                  dot={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                >
                  <div>
                    <Text strong>{collection.action}</Text>
                    <br />
                    <Text type="secondary">{collection.customer} - {collection.location}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {collection.time}
                    </Text>
                  </div>
                </Timeline.Item>
              ))}
            </Timeline>
          </Card>
        </Col>
      </Row>

      {/* Collection Completion Modal */}
      <Modal
        title={`Complete Collection - ${selectedJob?.trackingId}`}
        open={completionModalVisible}
        onCancel={() => setCompletionModalVisible(false)}
        footer={null}
        width={700}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCompletionSubmit}
        >
          {/* Collection Proof Section */}
          <Card size="small" title="Collection Proof" style={{ marginBottom: 16 }}>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Form.Item
                  name="collectionPhotos"
                  label="Collection Photos"
                  rules={[{ required: true, message: 'Please upload at least one photo' }]}
                >
                  <Upload
                    listType="picture-card"
                    maxCount={5}
                    beforeUpload={() => false}
                    accept="image/*"
                  >
                    <div>
                      <UploadOutlined />
                      <div style={{ marginTop: 8 }}>Upload Photos</div>
                    </div>
                  </Upload>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="customerSignature"
                  label="Customer Signature"
                  rules={[{ required: true, message: 'Please capture customer signature' }]}
                >
                  <div style={{ 
                    border: '1px dashed #d9d9d9', 
                    borderRadius: '6px', 
                    padding: '20px', 
                    textAlign: 'center',
                    background: '#fafafa'
                  }}>
                    <SignatureOutlined style={{ fontSize: '24px', color: '#999' }} />
                    <div style={{ marginTop: 8, color: '#999' }}>
                      Signature capture will be implemented
                    </div>
                  </div>
                </Form.Item>
              </Col>
            </Row>
          </Card>

          {/* Collection Details Section */}
          <Card size="small" title="Collection Details" style={{ marginBottom: 16 }}>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Form.Item
                  name="collectionTime"
                  label="Actual Collection Time"
                  rules={[{ required: true, message: 'Please enter collection time' }]}
                >
                  <Input placeholder="e.g., 14:30" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="packageCondition"
                  label="Package Condition"
                  rules={[{ required: true, message: 'Please select package condition' }]}
                >
                  <Input placeholder="e.g., Good, Damaged, etc." />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <Form.Item
                  name="collectionNotes"
                  label="Collection Notes"
                >
                  <TextArea 
                    rows={3} 
                    placeholder="Any additional notes about the collection, customer interaction, or package condition"
                  />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          {/* Confirmation Section */}
          <Card size="small" title="Confirmation" style={{ marginBottom: 16 }}>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Form.Item
                  name="customerName"
                  label="Customer Name Confirmed"
                  rules={[{ required: true, message: 'Please confirm customer name' }]}
                >
                  <Input 
                    placeholder="Customer name" 
                    defaultValue={selectedJob?.customer}
                    disabled
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="packageCount"
                  label="Package Count"
                  rules={[{ required: true, message: 'Please enter package count' }]}
                >
                  <Input placeholder="e.g., 2 boxes, 1 envelope" />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button 
                onClick={() => setCompletionModalVisible(false)}
                size="large"
              >
                Cancel
              </Button>
              <Button 
                type="primary" 
                htmlType="submit"
                size="large"
                icon={<CheckCircleOutlined />}
              >
                Confirm Collection
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Job Details Side Drawer */}
      <Drawer
        title={`Job Details - ${selectedJob?.trackingId || ''}`}
        placement="right"
        onClose={() => setIsDetailsDrawerVisible(false)}
        open={isDetailsDrawerVisible}
        width={720}
        className="user-details-drawer"
        extra={
          selectedJob && (
            <Dropdown
              overlay={
                <Menu>
                  {selectedJob.status === 'assigned' && (
                    <Menu.Item
                      key="collected"
                      onClick={() => handleUpdateStatus('collected', 'Driver collected package from customer')}
                      disabled={updatingStatus}
                    >
                      Mark as Collected
                    </Menu.Item>
                  )}
                  {selectedJob.status === 'collected' && (
                    <Menu.Item
                      key="in_transit"
                      onClick={() => handleUpdateStatus('in_transit', 'Package in transit to warehouse')}
                      disabled={updatingStatus}
                    >
                      Mark as In Transit
                    </Menu.Item>
                  )}
                  {selectedJob.status === 'in_transit' && (
                    <Menu.Item
                      key="arrived_at_warehouse"
                      onClick={() => handleUpdateStatus('arrived_at_warehouse', 'Package arrived at warehouse')}
                      disabled={updatingStatus}
                    >
                      Mark as Arrived at Warehouse
                    </Menu.Item>
                  )}
                  {!['assigned', 'collected', 'in_transit'].includes(selectedJob.status) && (
                    <Menu.Item disabled>No actions available</Menu.Item>
                  )}
                </Menu>
              }
              trigger={['click']}
              placement="bottomRight"
            >
              <Button 
                type="text" 
                icon={<MoreOutlined style={{ fontSize: 20 }} />}
                style={{ 
                  border: '1px solid #d9d9d9',
                  borderRadius: '4px'
                }}
              />
            </Dropdown>
          )
        }
      >
        {selectedJob && (
          <Tabs defaultActiveKey="details">
            <Tabs.TabPane tab="Details" key="details">

            {/* Customer Information Card */}
            <Card 
              size="small" 
              title={<span className="user-info-title">Customer Information</span>}
              className="user-info-card"
              style={{ 
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                borderRadius: 8,
                marginBottom: 24
              }}
            >
              <div className="user-info-list">
                <div className="user-info-item">
                  <div className="user-info-label">Name</div>
                  <div className="user-info-value">
                    <UserOutlined style={{ color: '#1890ff', marginRight: '8px' }} />
                <Text strong>{selectedJob.customer?.name}</Text>
                  </div>
              </div>
              {selectedJob.customer?.phone && (
                  <div className="user-info-item">
                    <div className="user-info-label">Phone</div>
                    <div className="user-info-value">
                      <PhoneOutlined style={{ color: '#1890ff', marginRight: '8px' }} />
                  <Text>{selectedJob.customer.phone}</Text>
                    </div>
                </div>
              )}
              </div>
            </Card>

            {/* Address Information Card */}
            <Card 
              size="small" 
              title={<span className="user-info-title">Address Information</span>}
              className="user-info-card"
              style={{ 
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                borderRadius: 8,
                marginBottom: 24
              }}
            >
              <div className="user-info-list">
                <div className="user-info-item">
                  <div className="user-info-label">Pickup</div>
                  <div className="user-info-value">
                    <EnvironmentOutlined style={{ color: '#1890ff', marginRight: '8px' }} />
                <Text>{selectedJob.pickupAddress}</Text>
              </div>
                </div>
                <div className="user-info-item">
                  <div className="user-info-label">Warehouse</div>
                  <div className="user-info-value">
                    <HomeOutlined style={{ color: '#1890ff', marginRight: '8px' }} />
                <Text>{selectedJob.warehouseLocation || 'Main Warehouse'}</Text>
                  </div>
                </div>
              </div>
            </Card>

            {/* Job Information Card */}
            <Card 
              size="small" 
              title={<span className="user-info-title">Job Information</span>}
              className="user-info-card"
              style={{ 
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                borderRadius: 8,
                marginBottom: 24
              }}
            >
              <div className="user-info-list">
                <div className="user-info-item">
                  <div className="user-info-label">Status</div>
                  <div className="user-info-value">
                <Tag color={
                  ['delivered', 'arrived_at_warehouse'].includes(selectedJob.status) ? 'green' :
                  ['in_transit', 'collected', 'out_for_delivery'].includes(selectedJob.status) ? 'blue' :
                  ['assigned', 'batched'].includes(selectedJob.status) ? 'orange' :
                  selectedJob.status === 'cancelled' ? 'red' :
                  'default'
                }>
                  {selectedJob.status?.replace(/_/g, ' ').toUpperCase()}
                </Tag>
              </div>
                </div>
                <div className="user-info-item">
                  <div className="user-info-label">Priority</div>
                  <div className="user-info-value">
                <Tag color={selectedJob.priority === 'Urgent' ? 'red' : selectedJob.priority === 'Express' ? 'orange' : 'blue'}>
                  {selectedJob.priority}
                </Tag>
              </div>
                </div>
                <div className="user-info-item">
                  <div className="user-info-label">Pickup Date</div>
                  <div className="user-info-value">
                    <CalendarOutlined style={{ color: '#1890ff', marginRight: '8px' }} />
                <Text>{selectedJob.pickupDate ? new Date(selectedJob.pickupDate).toLocaleDateString() : 'Not set'}</Text>
                  </div>
                </div>
              </div>
            </Card>

            {/* Package Details Card */}
            <Card 
              size="small" 
              title={<span className="user-info-title">Package Details</span>}
              className="user-info-card"
              style={{ 
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                borderRadius: 8,
                marginBottom: 24
              }}
            >
              <div className="user-info-list">
              {selectedJob.description && (
                  <div className="user-info-item">
                    <div className="user-info-label">Description</div>
                    <div className="user-info-value">
                  <Text>{selectedJob.description}</Text>
                    </div>
                </div>
              )}
              {selectedJob.weight && (
                  <div className="user-info-item">
                    <div className="user-info-label">Weight</div>
                    <div className="user-info-value">
                  <Text>{selectedJob.weight} kg</Text>
                    </div>
                </div>
              )}
                {canViewRevenue && selectedJob.value && (
                  <div className="user-info-item">
                    <div className="user-info-label">Value</div>
                    <div className="user-info-value">
                  <Text>£{selectedJob.value}</Text>
                    </div>
                </div>
              )}
              </div>
            </Card>

            {/* Special Instructions */}
            {selectedJob.specialInstructions && (
              <Card 
                size="small" 
                title="Special Instructions" 
                style={{ marginBottom: 16 }}
              >
                <Text>{selectedJob.specialInstructions}</Text>
              </Card>
            )}
            </Tabs.TabPane>

            {/* Activities Tab */}
            <Tabs.TabPane tab="Activities" key="activities">
              {selectedJob.timeline && selectedJob.timeline.length > 0 ? (
                <Timeline>
                  {selectedJob.timeline.map((entry, index) => (
                    <Timeline.Item
                      key={index}
                      color={
                        ['delivered', 'arrived_at_warehouse'].includes(entry.status) ? 'green' :
                        ['in_transit', 'collected', 'out_for_delivery'].includes(entry.status) ? 'blue' :
                        ['assigned', 'batched'].includes(entry.status) ? 'orange' :
                        entry.status === 'cancelled' ? 'red' :
                        'gray'
                      }
                    >
                      <div>
                        <Tag 
                          color={
                            ['delivered', 'arrived_at_warehouse'].includes(entry.status) ? 'green' :
                            ['in_transit', 'collected', 'out_for_delivery'].includes(entry.status) ? 'blue' :
                            ['assigned', 'batched'].includes(entry.status) ? 'orange' :
                            entry.status === 'cancelled' ? 'red' :
                            'default'
                          }
                        >
                          {entry.status.replace(/_/g, ' ').toUpperCase()}
                        </Tag>
                        <br />
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          {new Date(entry.timestamp).toLocaleString()}
                        </Text>
                        {entry.notes && (
                          <>
                            <br />
                            <Text>{entry.notes}</Text>
                          </>
                        )}
                        {entry.updater && (
                          <>
                            <br />
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                              By: {entry.updater.name}
                            </Text>
                          </>
                        )}
                      </div>
                    </Timeline.Item>
                  ))}
                </Timeline>
              ) : (
                <Text type="secondary">No activity recorded yet</Text>
              )}
            </Tabs.TabPane>
          </Tabs>
        )}
      </Drawer>
    </div>
  );
};

export default DriverDashboardPage;
