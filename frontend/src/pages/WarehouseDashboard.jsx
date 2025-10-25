import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Statistic, 
  Table, 
  Tag, 
  Typography,
  Timeline,
  Space,
  Button,
  Progress,
  Empty,
  Spin
} from 'antd';
import { 
  InboxOutlined,
  ShoppingOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  TeamOutlined,
  DollarOutlined,
  BoxPlotOutlined,
  CarOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { dashboardAPI } from '../utils/api';

const { Title, Text } = Typography;

const WarehouseDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    fetchWarehouseDashboard();
  }, []);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchWarehouseDashboard();
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchWarehouseDashboard = async () => {
    try {
      setLoading(true);
      const response = await dashboardAPI.getWarehouse();

      if (response.success) {
        setDashboardData(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch warehouse dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !dashboardData) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Spin size="large" />
        <p style={{ marginTop: 16 }}>Loading warehouse dashboard...</p>
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

  const { 
    jobStats, 
    batchStats, 
    jobsReadyForBatching, 
    recentBatches, 
    jobsAtWarehouse,
    todayActivity,
    unassignedJobs,
    recentActivity
  } = dashboardData;

  // Statistics cards
  const statsCards = [
    {
      title: 'Jobs Ready for Batching',
      value: jobsReadyForBatching?.count || 0,
      prefix: <InboxOutlined />,
      color: '#1890ff',
    },
    {
      title: 'Jobs at Warehouse',
      value: jobStats?.atWarehouse || 0,
      prefix: <BoxPlotOutlined />,
      color: '#52c41a',
    },
    {
      title: 'Total Batches',
      value: batchStats?.total || 0,
      prefix: <ShoppingOutlined />,
      color: '#722ed1',
    },
    {
      title: 'Unassigned Jobs',
      value: unassignedJobs || 0,
      prefix: <CarOutlined />,
      color: '#faad14',
    },
  ];

  // Jobs ready for batching table
  const batchingColumns = [
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
      title: 'Weight (kg)',
      dataIndex: 'weight',
      key: 'weight',
      render: (weight) => weight ? `${parseFloat(weight).toFixed(2)} kg` : 'N/A'
    },
    {
      title: 'Value',
      dataIndex: 'value',
      key: 'value',
      render: (value) => value ? `$${parseFloat(value).toFixed(2)}` : 'N/A'
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color="blue">{status?.replace(/_/g, ' ').toUpperCase()}</Tag>
      )
    },
  ];

  // Jobs at warehouse table
  const warehouseColumns = [
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
      title: 'Driver',
      dataIndex: ['assignedDriver', 'name'],
      key: 'driver',
      render: (driver) => driver || <Text type="secondary">Unassigned</Text>
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'Collected' ? 'green' : 'orange'}>
          {status?.replace(/_/g, ' ').toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button 
          size="small" 
          icon={<EyeOutlined />}
          onClick={() => navigate(`/jobs`)}
        >
          View
        </Button>
      ),
    },
  ];

  // Recent batches table
  const batchColumns = [
    {
      title: 'Batch ID',
      dataIndex: 'batchId',
      key: 'batchId',
      render: (text) => <Text strong>{text}</Text>
    },
    {
      title: 'Destination',
      dataIndex: 'destination',
      key: 'destination',
    },
    {
      title: 'Jobs',
      dataIndex: '_count',
      key: 'jobs',
      render: (count) => count?.jobs || 0
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const colors = {
          'In Preparation': 'orange',
          'Shipped': 'blue',
          'In Transit': 'cyan',
          'Arrived': 'green'
        };
        return <Tag color={colors[status] || 'default'}>{status}</Tag>;
      }
    },
    {
      title: 'Created By',
      dataIndex: ['creator', 'name'],
      key: 'creator',
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: '24px' }}>
        <Col>
          <Title level={2} style={{ margin: 0 }}>
            <BoxPlotOutlined /> Warehouse Dashboard
          </Title>
          <Text type="secondary" style={{ fontSize: '16px' }}>
            Manage warehouse operations and batching
          </Text>
        </Col>
        <Col>
          <Space>
            <Button onClick={() => navigate('/jobs')}>
              View All Jobs
            </Button>
            <Button type="primary" onClick={() => navigate('/batches')}>
              Manage Batches
            </Button>
          </Space>
        </Col>
      </Row>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        {statsCards.map((stat, index) => (
          <Col xs={12} sm={12} md={6} key={index}>
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

      {/* Job Status Overview */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} md={12}>
          <Card title="Job Status Overview">
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <div>
                <Text>Pending Collection</Text>
                <Progress 
                  percent={((jobStats?.pendingCollection || 0) / (jobStats?.total || 1)) * 100} 
                  format={() => jobStats?.pendingCollection || 0}
                />
              </div>
              <div>
                <Text>Collected</Text>
                <Progress 
                  percent={((jobStats?.collected || 0) / (jobStats?.total || 1)) * 100}
                  status="active"
                  format={() => jobStats?.collected || 0}
                />
              </div>
              <div>
                <Text>At Warehouse</Text>
                <Progress 
                  percent={((jobStats?.atWarehouse || 0) / (jobStats?.total || 1)) * 100}
                  strokeColor="#52c41a"
                  format={() => jobStats?.atWarehouse || 0}
                />
              </div>
              <div>
                <Text>Batched</Text>
                <Progress 
                  percent={((jobStats?.batched || 0) / (jobStats?.total || 1)) * 100}
                  strokeColor="#722ed1"
                  format={() => jobStats?.batched || 0}
                />
              </div>
            </Space>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card title="Batch Status Overview">
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <div>
                <Text>In Preparation</Text>
                <Progress 
                  percent={((batchStats?.inPreparation || 0) / (batchStats?.total || 1)) * 100}
                  format={() => batchStats?.inPreparation || 0}
                  strokeColor="#faad14"
                />
              </div>
              <div>
                <Text>Shipped</Text>
                <Progress 
                  percent={((batchStats?.shipped || 0) / (batchStats?.total || 1)) * 100}
                  format={() => batchStats?.shipped || 0}
                  strokeColor="#1890ff"
                />
              </div>
              <div>
                <Text>In Transit</Text>
                <Progress 
                  percent={((batchStats?.inTransit || 0) / (batchStats?.total || 1)) * 100}
                  format={() => batchStats?.inTransit || 0}
                  strokeColor="#13c2c2"
                />
              </div>
              <div>
                <Text>Arrived</Text>
                <Progress 
                  percent={((batchStats?.arrived || 0) / (batchStats?.total || 1)) * 100}
                  format={() => batchStats?.arrived || 0}
                  strokeColor="#52c41a"
                />
              </div>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Jobs Ready for Batching */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24}>
          <Card 
            title={
              <Space>
                <InboxOutlined />
                <span>Jobs Ready for Batching</span>
                <Tag color="blue">{jobsReadyForBatching?.count || 0}</Tag>
              </Space>
            }
            extra={
              <Space>
                <Text>Total Weight: <strong>{jobsReadyForBatching?.totalWeight?.toFixed(2) || 0} kg</strong></Text>
                <Text>Total Value: <strong>${jobsReadyForBatching?.totalValue?.toFixed(2) || 0}</strong></Text>
              </Space>
            }
          >
            <Table
              columns={batchingColumns}
              dataSource={jobsReadyForBatching?.jobs || []}
              rowKey="id"
              pagination={false}
              size="small"
              locale={{
                emptyText: 'No jobs ready for batching'
              }}
            />
          </Card>
        </Col>
      </Row>

      {/* Jobs at Warehouse */}
      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Card title="Jobs at Warehouse">
            <Table
              columns={warehouseColumns}
              dataSource={jobsAtWarehouse || []}
              rowKey="id"
              pagination={false}
              size="small"
              locale={{
                emptyText: 'No jobs at warehouse'
              }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default WarehouseDashboard;

