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
  Alert
} from 'antd';
import { 
  InboxOutlined,
  ShoppingOutlined,
  BoxPlotOutlined,
  CarOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { dashboardAPI, jobAPI } from '../utils/api';
import ResponsiveTable from '../components/common/ResponsiveTable';
import { useAuth } from '../contexts/AuthContext';

const { Title, Text } = Typography;

const WarehouseDashboard = ({ dashboardApi = null, title = 'Warehouse Dashboard', isUK = false }) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [error, setError] = useState(null);
  const api = dashboardApi || dashboardAPI.getWarehouse;

  // Redirect warehouse users with specific location to their dedicated dashboard
  useEffect(() => {
    if (!currentUser) return;
    if (currentUser.role === 'warehouse' && currentUser.warehouseLocation === 'Ghana Warehouse') {
      navigate('/ghana-warehouse', { replace: true });
      return;
    }
    if (isUK && currentUser.role === 'warehouse' && currentUser.warehouseLocation !== 'UK Warehouse') {
      navigate('/warehouse-dashboard', { replace: true });
      return;
    }
    if (currentUser.role === 'warehouse' && !currentUser.warehouseLocation && !isUK) {
      fetchWarehouseDashboard();
    } else if (currentUser.role !== 'warehouse' || isUK) {
      fetchWarehouseDashboard();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, navigate, isUK]);

  // Auto-refresh every 120 seconds (2 minutes) to reduce API load
  // Only refresh if there's no error and component is mounted
  useEffect(() => {
    if (error) return; // Don't auto-refresh if there's an error
    
    const interval = setInterval(() => {
      if (!error) { // Double-check error state before refresh
        fetchWarehouseDashboard();
      }
    }, 120000); // 120 seconds = 2 minutes
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- run on mount and when error changes
  }, [error]);

  const fetchWarehouseDashboard = async () => {
    if (currentUser?.role === 'warehouse' && currentUser?.warehouseLocation === 'Ghana Warehouse') {
      navigate('/ghana-warehouse', { replace: true });
      return;
    }
    if (isUK && currentUser?.role === 'warehouse' && currentUser?.warehouseLocation !== 'UK Warehouse') {
      navigate('/warehouse-dashboard', { replace: true });
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await api();

      if (response.success) {
        setDashboardData(response.data);
      } else {
        setError(response.message || 'Failed to load dashboard data');
      }
    } catch (error) {
      console.error('Failed to fetch warehouse dashboard:', error);
      
      // Extract error message
      let errorMessage = 'Failed to load warehouse dashboard data';
      
      if (error?.status === 403) {
        errorMessage = error?.message || 'Access denied. Please use your assigned warehouse dashboard.';
        // If user is assigned to Ghana Warehouse, redirect them immediately
        if (currentUser?.warehouseLocation === 'Ghana Warehouse') {
          navigate('/ghana-warehouse', { replace: true });
          return;
        }
        if (isUK && currentUser?.warehouseLocation !== 'UK Warehouse') {
          navigate('/warehouse-dashboard', { replace: true });
          return;
        }
      } else if (error?.status === 401) {
        errorMessage = 'Unauthorized. Please login again.';
      } else if (error?.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
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
        {error ? (
          <Alert
            message="Error Loading Dashboard"
            description={error}
            type="error"
            showIcon
            action={
              <Button size="small" onClick={fetchWarehouseDashboard}>
                Retry
              </Button>
            }
          />
        ) : (
          <Empty description="Failed to load dashboard data" />
        )}
      </div>
    );
  }

  const { 
    jobStats, 
    batchStats, 
    jobsReadyForBatching, 
    jobsAtWarehouse,
    unassignedJobs,
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

  // Jobs ready for batching table
  const batchingColumns = [
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
      mobile: false,
    },
    {
      title: 'Value',
      dataIndex: 'value',
      key: 'value',
      render: (value) => value ? `$${parseFloat(value).toFixed(2)}` : 'N/A',
      mobile: false,
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

  // Jobs at warehouse table
  const warehouseColumns = [
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
      title: 'Driver',
      dataIndex: 'assignedDriver',
      key: 'driver',
      render: (driver) => driver?.name || <Text type="secondary">Unassigned</Text>,
      mobile: false,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      mobile: true,
      render: (status) => (
        <Tag color={status === 'Collected' ? 'green' : 'orange'}>
          {status?.replace(/_/g, ' ').toUpperCase()}
        </Tag>
      )
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
          <Title level={2} style={{ margin: 0 }}>
            <BoxPlotOutlined /> {title}
          </Title>
          <Text type="secondary" style={{ fontSize: '16px' }}>
            Manage warehouse operations and batching
          </Text>
        </Col>
        <Col>
          <Button onClick={() => navigate('/jobs')}>
            View All Jobs
          </Button>
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
            <ResponsiveTable
              columns={batchingColumns}
              dataSource={jobsReadyForBatching?.jobs || []}
              loading={loading}
              rowKey="id"
              pagination={false}
              size="small"
              locale={{
                emptyText: 'No jobs ready for batching'
              }}
              onCardClick={handleViewJob}
            />
          </Card>
        </Col>
      </Row>

      {/* Jobs at Warehouse */}
      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Card title="Jobs at Warehouse">
            <ResponsiveTable
              columns={warehouseColumns}
              dataSource={jobsAtWarehouse || []}
              loading={loading}
              rowKey="id"
              pagination={false}
              size="small"
              locale={{
                emptyText: 'No jobs at warehouse'
              }}
              onCardClick={handleViewJob}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default WarehouseDashboard;

