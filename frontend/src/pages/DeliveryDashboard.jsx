import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Statistic, 
  Table, 
  Tag, 
  Typography,
  Space,
  Button,
  Empty,
  Spin
} from 'antd';
import { 
  RocketOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  EyeOutlined,
  EditOutlined,
  FileTextOutlined,
  CameraOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { dashboardAPI, jobAPI } from '../utils/api';
import ResponsiveTable from '../components/common/ResponsiveTable';
import { formatJobStatusLabel, getStatusColor, normalizeJobStatusKey } from '../constants/jobStatuses';
import DeliverJobModal from '../components/jobs/DeliverJobModal';
import JobEditModal from '../components/jobs/JobEditModal';
import JobNoteModal from '../components/jobs/JobNoteModal';

const { Title, Text } = Typography;

const isDeliverable = (status) => ['ready_for_delivery', 'out_for_delivery'].includes(normalizeJobStatusKey(status));

const DeliveryDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [error, setError] = useState(null);
  const [deliverJob, setDeliverJob] = useState(null);
  const [editJobId, setEditJobId] = useState(null);
  const [noteJob, setNoteJob] = useState(null);

  useEffect(() => {
    fetchDeliveryDashboard();
  }, []);

  // Auto-refresh every 120 seconds (2 minutes) to reduce API load
  // Only refresh if there's no error and component is mounted
  useEffect(() => {
    if (error) return; // Don't auto-refresh if there's an error
    
    const interval = setInterval(() => {
      if (!error) { // Double-check error state before refresh
        fetchDeliveryDashboard();
      }
    }, 120000); // 120 seconds = 2 minutes
    return () => clearInterval(interval);
  }, [error]);

  const fetchDeliveryDashboard = async () => {
    try {
      setLoading(true);
      setError(null); // Clear previous errors
      const response = await dashboardAPI.getDelivery();

      if (response.success) {
        setDashboardData(response.data);
      } else {
        setError(response.message || 'Failed to load dashboard data');
      }
    } catch (error) {
      console.error('Failed to fetch delivery dashboard:', error);
      setError(error?.message || 'Failed to load delivery dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !dashboardData) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Spin size="large" />
        <p style={{ marginTop: 16 }}>Loading delivery dashboard...</p>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div style={{ padding: '24px' }}>
        <Empty description="Failed to load dashboard data" />
      </div>
    );
  }

  const { stats, assignedDeliveries } = dashboardData;

  // Statistics cards
  const statsCards = [
    {
      title: 'Total Assigned',
      value: stats?.total || 0,
      prefix: <RocketOutlined />,
      color: '#1890ff',
    },
    {
      title: 'Ready for Delivery',
      value: stats?.readyForDelivery ?? 0,
      prefix: <ClockCircleOutlined />,
      color: '#52c41a',
    },
    {
      title: 'Out for Delivery',
      value: stats?.outForDelivery || 0,
      prefix: <RocketOutlined />,
      color: '#722ed1',
    },
    {
      title: 'Delivery Attempted',
      value: stats?.attempted || 0,
      prefix: <CheckCircleOutlined />,
      color: '#faad14',
    },
    {
      title: 'Delivered',
      value: stats?.delivered ?? 0,
      prefix: <CheckCircleOutlined />,
      color: '#52c41a',
    },
  ];

  // Handle view delivery/job
  const handleViewDelivery = async (delivery) => {
    try {
      // Navigate to jobs page and open details drawer
      const response = await jobAPI.getById(delivery.id);
      if (response.success && response.data) {
        navigate('/jobs', { state: { selectedJobId: delivery.id } });
      } else {
        // Fallback: just navigate to jobs page
        navigate('/jobs');
      }
    } catch (error) {
      console.error('Failed to fetch delivery details:', error);
      navigate('/jobs');
    }
  };

  // Deliveries table columns
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
      render: (customer) => customer?.name || 'N/A',
      mobile: true,
    },
    {
      title: 'Phone',
      dataIndex: 'customer',
      key: 'phone',
      render: (customer) => customer?.phone || 'N/A',
      mobile: false,
    },
    {
      title: 'Delivery Address',
      dataIndex: 'deliveryAddress',
      key: 'address',
      ellipsis: true,
      render: (address, record) => address || record.customer?.address || 'N/A',
      mobile: false,
    },
    {
      title: 'Estimated Delivery',
      dataIndex: 'estimatedDelivery',
      key: 'estimatedDelivery',
      render: (date) => date ? new Date(date).toLocaleDateString() : 'N/A',
      mobile: false,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      mobile: true,
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {formatJobStatusLabel(status)}
        </Tag>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 270,
      mobile: true,
      render: (_, record) => (
        <Space wrap>
          {isDeliverable(record.status) && (
            <Button
              size="small"
              type="primary"
              icon={<CameraOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                setDeliverJob(record);
              }}
            >
              Mark Delivered
            </Button>
          )}
          <Button 
            size="small" 
            icon={<EyeOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              handleViewDelivery(record);
            }}
          >
            View
          </Button>
          {normalizeJobStatusKey(record.status) !== 'delivered' && (
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                setEditJobId(record.id);
              }}
            >
              Edit
            </Button>
          )}
          <Button
            size="small"
            icon={<FileTextOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              setNoteJob(record);
            }}
          >
            Add Note
          </Button>
          {record.customer?.phone && (
            <Button 
              size="small" 
              icon={<PhoneOutlined />}
              href={`tel:${record.customer.phone}`}
              onClick={(e) => e.stopPropagation()}
            >
              Call
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }} className="dashboard-page-container">
      {/* Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: '24px' }}>
        <Col>
          <Title level={2} style={{ margin: 0 }}>
            <RocketOutlined /> My Deliveries
          </Title>
          <Text type="secondary" style={{ fontSize: '16px' }}>
            Manage your assigned deliveries
          </Text>
        </Col>
        <Col>
          <Button type="primary" onClick={() => navigate('/jobs')}>
            View All Jobs
          </Button>
        </Col>
      </Row>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        {statsCards.map((stat, index) => (
          <Col xs={12} sm={12} md={8} lg={{ flex: '20%' }} key={index}>
            <Card>
              <Statistic
                title={stat.title}
                value={stat.value}
                prefix={stat.prefix}
                valueStyle={{ color: stat.color }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* Assigned Deliveries Table */}
      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Card 
            title={
              <Space>
                <EnvironmentOutlined />
                <span>Assigned Deliveries</span>
                <Tag color="blue">{assignedDeliveries?.length || 0}</Tag>
              </Space>
            }
          >
            <ResponsiveTable
              columns={columns}
              dataSource={assignedDeliveries || []}
              loading={loading}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total) => `Total ${total} deliveries`
              }}
              size="small"
              locale={{
                emptyText: 'No deliveries assigned'
              }}
              onCardClick={handleViewDelivery}
            />
          </Card>
        </Col>
      </Row>

      <DeliverJobModal job={deliverJob} onClose={() => setDeliverJob(null)} onDelivered={fetchDeliveryDashboard} />
      <JobEditModal jobId={editJobId} onClose={() => setEditJobId(null)} onSaved={fetchDeliveryDashboard} />
      <JobNoteModal job={noteJob} onClose={() => setNoteJob(null)} />

      {/* Quick Actions */}
      {assignedDeliveries && assignedDeliveries.length > 0 && (
        <Row gutter={[16, 16]} style={{ marginTop: '24px' }}>
          <Col xs={24}>
            <Card title="Quick Tips">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text>📱 <strong>Call customers</strong> before delivery to confirm availability</Text>
                <Text>📍 <strong>Check addresses</strong> before leaving for delivery</Text>
                <Text>📸 <strong>Take photos</strong> as proof of delivery</Text>
                <Text>✅ <strong>Update status</strong> immediately after each delivery</Text>
              </Space>
            </Card>
          </Col>
        </Row>
      )}
    </div>
  );
};

export default DeliveryDashboard;

