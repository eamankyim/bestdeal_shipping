import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Statistic, 
  Tag, 
  Typography,
  Space,
  Button,
  Progress,
  Empty,
  Spin,
  Alert,
  message
} from 'antd';
import { 
  InboxOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  BoxPlotOutlined,
  CarOutlined,
  EyeOutlined,
  FlagOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { dashboardAPI, jobAPI } from '../utils/api';
import ResponsiveTable from '../components/common/ResponsiveTable';

const { Title, Text } = Typography;

const GhanaWarehouseDashboardPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchGhanaWarehouseDashboard();
  }, []);

  // Auto-refresh every 120 seconds (2 minutes) to reduce API load
  // Only refresh if there's no error and component is mounted
  useEffect(() => {
    if (error) return; // Don't auto-refresh if there's an error
    
    const interval = setInterval(() => {
      if (!error) { // Double-check error state before refresh
        fetchGhanaWarehouseDashboard();
      }
    }, 120000); // 120 seconds = 2 minutes
    return () => clearInterval(interval);
  }, [error]);

  const fetchGhanaWarehouseDashboard = async () => {
    try {
      setLoading(true);
      setError(null); // Clear previous errors
      const response = await dashboardAPI.getGhanaWarehouse();

      if (response.success) {
        setDashboardData(response.data);
      } else {
        setError(response.message || 'Failed to load dashboard data');
        message.error(response.message || 'Failed to load dashboard data');
      }
    } catch (error) {
      console.error('Failed to fetch Ghana Warehouse dashboard:', error);
      
      // Extract error message
      let errorMessage = 'Failed to load Ghana Warehouse dashboard data';
      
      if (error?.status === 403) {
        errorMessage = error?.message || 'Access denied. This dashboard is only for Ghana Warehouse staff.';
      } else if (error?.status === 401) {
        errorMessage = 'Unauthorized. Please login again.';
      } else if (error?.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !dashboardData) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Spin size="large" />
        <p style={{ marginTop: 16 }}>Loading Ghana Warehouse dashboard...</p>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div style={{ padding: '24px' }}>
        {error ? (
          <Alert
            message="Error Loading Dashboard"
            description={error}
            type="error"
            showIcon
            action={
              <Button size="small" onClick={fetchGhanaWarehouseDashboard}>
                Retry
              </Button>
            }
          />
        ) : (
          <Empty description="Failed to load Ghana Warehouse dashboard data" />
        )}
      </div>
    );
  }

  const { 
    warehouseLocation,
    jobStats,
    itemsArrivedFromShip,
    itemsStoredAtWarehouse,
    jobsReadyForDistribution,
    jobsBeingDistributed,
    jobsAtWarehouse, // For backward compatibility
    todayActivity,
    recentActivity
  } = dashboardData;

  // Statistics cards - Ghana Warehouse workflow: Receive -> Store -> Distribute
  const statsCards = [
    {
      title: 'Items Arrived',
      value: itemsArrivedFromShip?.count || jobStats?.arrivedFromShip || 0,
      prefix: <CheckCircleOutlined />,
      color: '#1890ff',
      description: 'Items arrived from ship',
    },
    {
      title: 'Items Stored',
      value: jobStats?.atWarehouse || (itemsStoredAtWarehouse?.length || 0),
      prefix: <BoxPlotOutlined />,
      color: '#52c41a',
      description: 'Currently stored at warehouse',
    },
    {
      title: 'Ready for Distribution',
      value: jobsReadyForDistribution?.count || jobStats?.readyForDistribution || 0,
      prefix: <InboxOutlined />,
      color: '#722ed1',
      description: 'Ready to distribute',
    },
    {
      title: 'Being Distributed',
      value: jobsBeingDistributed?.count || jobStats?.outForDelivery || 0,
      prefix: <CarOutlined />,
      color: '#faad14',
      description: 'Out for delivery',
    },
  ];

  // Handle view job
  const handleViewJob = async (job) => {
    try {
      const response = await jobAPI.getById(job.id);
      if (response.success && response.data) {
        navigate('/jobs', { state: { selectedJobId: job.id } });
      } else {
        navigate('/jobs');
      }
    } catch (error) {
      console.error('Failed to fetch job details:', error);
      navigate('/jobs');
    }
  };

  // Items table columns (used for arrived, ready for distribution)
  const itemsColumns = [
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
      title: 'Weight (kg)',
      dataIndex: 'weight',
      key: 'weight',
      render: (weight) => weight ? `${parseFloat(weight).toFixed(2)} kg` : 'N/A',
      mobile: true,
    },
    {
      title: 'Destination',
      dataIndex: 'deliveryAddress',
      key: 'deliveryAddress',
      render: (address) => address ? <Text ellipsis style={{ maxWidth: 200 }}>{address}</Text> : 'N/A',
      mobile: true,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      mobile: true,
      render: (status) => (
        <Tag color="blue">{status?.replace(/_/g, ' ').toUpperCase()}</Tag>
      )
    },
  ];

  // Items stored/being distributed table columns
  const storedItemsColumns = [
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
      title: 'Weight (kg)',
      dataIndex: 'weight',
      key: 'weight',
      render: (weight) => weight ? `${parseFloat(weight).toFixed(2)} kg` : 'N/A',
      mobile: true,
    },
    {
      title: 'Destination',
      dataIndex: 'deliveryAddress',
      key: 'deliveryAddress',
      render: (address) => address ? <Text ellipsis style={{ maxWidth: 200 }}>{address}</Text> : 'N/A',
      mobile: true,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      mobile: true,
      render: (status) => {
        const colors = {
          'At Ghana Warehouse': 'green',
          'at_ghana_warehouse': 'green',
          'arrived_at_warehouse': 'cyan',
          'Out for Delivery': 'orange',
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
      mobile: true,
      render: (_, record) => (
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
      ),
    },
  ];


  return (
    <div style={{ padding: '24px' }} className="dashboard-page-container">
      {/* Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: '24px' }}>
        <Col>
          <Space align="center">
            <FlagOutlined style={{ fontSize: '24px', color: '#ff9800' }} />
            <div>
              <Title level={2} style={{ margin: 0 }}>
                <BoxPlotOutlined /> Ghana Warehouse Dashboard
              </Title>
              <Text type="secondary" style={{ fontSize: '16px' }}>
                Receive items from ships, store, and distribute to final destinations
              </Text>
            </div>
          </Space>
        </Col>
        <Col>
          <Space>
            <Button onClick={() => navigate('/jobs')}>
              View All Jobs
            </Button>
            <Button type="primary" onClick={() => navigate('/jobs')}>
              Manage Jobs
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

      {/* Workflow Overview */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} md={12}>
          <Card title="Items Status - Ghana Warehouse">
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <div>
                <Text>Arrived from Ship</Text>
                <Progress 
                  percent={((jobStats?.arrivedFromShip || jobStats?.inTransit || 0) / (jobStats?.total || 1)) * 100} 
                  format={() => jobStats?.arrivedFromShip || jobStats?.inTransit || 0}
                  strokeColor="#1890ff"
                />
              </div>
              <div>
                <Text>Stored at Warehouse</Text>
                <Progress 
                  percent={((jobStats?.atWarehouse || 0) / (jobStats?.total || 1)) * 100}
                  status="active"
                  strokeColor="#52c41a"
                  format={() => jobStats?.atWarehouse || 0}
                />
              </div>
              <div>
                <Text>Ready for Distribution</Text>
                <Progress 
                  percent={((jobsReadyForDistribution?.count || 0) / (jobStats?.total || 1)) * 100}
                  strokeColor="#722ed1"
                  format={() => jobsReadyForDistribution?.count || 0}
                />
              </div>
              <div>
                <Text>Being Distributed</Text>
                <Progress 
                  percent={((jobStats?.outForDelivery || 0) / (jobStats?.total || 1)) * 100}
                  strokeColor="#faad14"
                  format={() => jobStats?.outForDelivery || 0}
                />
              </div>
            </Space>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card title="Today's Activity - Ghana Warehouse">
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <div>
                <Statistic
                  title="Items Processed Today"
                  value={todayActivity || 0}
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: '14px' }}>
                  Items received, stored, or distributed today
                </Text>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Items Arrived from Ship */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24}>
          <Card 
            title={
              <Space>
                <CheckCircleOutlined />
                <span>Items Arrived from Ship</span>
                <Tag color="blue">{itemsArrivedFromShip?.count || 0}</Tag>
              </Space>
            }
            extra={
              <Space>
                <Text>Total Weight: <strong>{itemsArrivedFromShip?.totalWeight?.toFixed(2) || 0} kg</strong></Text>
                <Text>Total Value: <strong>${itemsArrivedFromShip?.totalValue?.toFixed(2) || 0}</strong></Text>
              </Space>
            }
          >
            <ResponsiveTable
              columns={itemsColumns}
              dataSource={itemsArrivedFromShip?.jobs || []}
              loading={loading}
              rowKey="id"
              pagination={false}
              size="small"
              locale={{
                emptyText: 'No items arrived from ship yet'
              }}
              onCardClick={handleViewJob}
            />
          </Card>
        </Col>
      </Row>

      {/* Items Ready for Distribution */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24}>
          <Card 
            title={
              <Space>
                <InboxOutlined />
                <span>Items Ready for Distribution</span>
                <Tag color="purple">{jobsReadyForDistribution?.count || 0}</Tag>
              </Space>
            }
            extra={
              <Space>
                <Text>Total Weight: <strong>{jobsReadyForDistribution?.totalWeight?.toFixed(2) || 0} kg</strong></Text>
                <Text>Total Value: <strong>${jobsReadyForDistribution?.totalValue?.toFixed(2) || 0}</strong></Text>
              </Space>
            }
          >
            <ResponsiveTable
              columns={itemsColumns}
              dataSource={jobsReadyForDistribution?.jobs || []}
              loading={loading}
              rowKey="id"
              pagination={false}
              size="small"
              locale={{
                emptyText: 'No items ready for distribution'
              }}
              onCardClick={handleViewJob}
            />
          </Card>
        </Col>
      </Row>

      {/* Items Stored at Warehouse */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24}>
          <Card title="Items Stored at Warehouse">
            <ResponsiveTable
              columns={storedItemsColumns}
              dataSource={itemsStoredAtWarehouse || jobsAtWarehouse || []}
              loading={loading}
              rowKey="id"
              pagination={false}
              size="small"
              locale={{
                emptyText: 'No items stored at warehouse'
              }}
              onCardClick={handleViewJob}
            />
          </Card>
        </Col>
      </Row>

      {/* Items Being Distributed */}
      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Card title="Items Being Distributed">
            <ResponsiveTable
              columns={storedItemsColumns}
              dataSource={jobsBeingDistributed?.jobs || []}
              loading={loading}
              rowKey="id"
              pagination={false}
              size="small"
              locale={{
                emptyText: 'No items being distributed'
              }}
              onCardClick={handleViewJob}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default GhanaWarehouseDashboardPage;

