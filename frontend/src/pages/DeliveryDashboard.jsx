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
  EyeOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { dashboardAPI } from '../utils/api';

const { Title, Text } = Typography;

const DeliveryDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    fetchDeliveryDashboard();
  }, []);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchDeliveryDashboard();
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchDeliveryDashboard = async () => {
    try {
      setLoading(true);
      const response = await dashboardAPI.getDelivery();

      if (response.success) {
        setDashboardData(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch delivery dashboard:', error);
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
      title: 'Out for Delivery',
      value: stats?.outForDelivery || 0,
      prefix: <ClockCircleOutlined />,
      color: '#faad14',
    },
    {
      title: 'Delivered',
      value: stats?.attempted || 0,
      prefix: <CheckCircleOutlined />,
      color: '#52c41a',
    },
  ];

  // Deliveries table columns
  const columns = [
    {
      title: 'Tracking ID',
      dataIndex: 'trackingId',
      key: 'trackingId',
      render: (text) => <Text strong>{text}</Text>
    },
    {
      title: 'Customer',
      dataIndex: ['customer', 'name'],
      key: 'customer',
    },
    {
      title: 'Phone',
      dataIndex: ['customer', 'phone'],
      key: 'phone',
      render: (phone) => phone || 'N/A'
    },
    {
      title: 'Delivery Address',
      dataIndex: ['customer', 'address'],
      key: 'address',
      ellipsis: true,
      render: (address) => address || 'N/A'
    },
    {
      title: 'Estimated Delivery',
      dataIndex: 'estimatedDelivery',
      key: 'estimatedDelivery',
      render: (date) => date ? new Date(date).toLocaleDateString() : 'N/A'
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const colors = {
          'Out for Delivery': 'blue',
          'Delivery Attempted': 'orange',
          'Delivered': 'green',
        };
        return (
          <Tag color={colors[status] || 'default'}>
            {status?.replace(/_/g, ' ').toUpperCase()}
          </Tag>
        );
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            size="small" 
            icon={<EyeOutlined />}
            onClick={() => navigate(`/jobs`)}
          >
            View
          </Button>
          {record.customer?.phone && (
            <Button 
              size="small" 
              icon={<PhoneOutlined />}
              href={`tel:${record.customer.phone}`}
            >
              Call
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
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
          <Col xs={24} sm={8} md={8} key={index}>
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
            <Table
              columns={columns}
              dataSource={assignedDeliveries || []}
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
            />
          </Card>
        </Col>
      </Row>

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

