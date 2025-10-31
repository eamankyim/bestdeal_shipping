import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Statistic, 
  Button, 
  Table, 
  Tag, 
  Space, 
  Typography,
  Avatar,
  Progress
} from 'antd';
import { 
  ShoppingOutlined, 
  UserOutlined, 
  DollarOutlined, 
  ClockCircleOutlined,
  CheckCircleOutlined,
  CarOutlined,
  HomeOutlined,
  UserSwitchOutlined,
  PlusOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getStatusColor } from '../constants/jobStatuses';
import { jobAPI, customerAPI } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import FinanceDashboard from './FinanceDashboard';
import { hasPermission } from '../utils/permissions';

const { Title, Text } = Typography;

const DashboardPage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // Declare all state hooks first
  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [stats, setStats] = useState([
    {
      title: 'Total Jobs',
      value: 0,
      prefix: <ShoppingOutlined />,
      color: '#1890ff',
      suffix: ''
    },
    {
      title: 'Active Jobs',
      value: 0,
      prefix: <ClockCircleOutlined />,
      color: '#faad14',
      suffix: ''
    },
    {
      title: 'Total Customers',
      value: 0,
      prefix: <UserOutlined />,
      color: '#52c41a',
      suffix: ''
    },
    {
      title: 'Revenue This Month',
      value: 0,
      prefix: <DollarOutlined />,
      color: '#722ed1',
      suffix: '£'
    }
  ]);

  // Redirect warehouse users to their dedicated dashboard
  useEffect(() => {
    if (!currentUser) {
      return; // Wait for user to load
    }
    
    if (currentUser.role === 'warehouse') {
      // If user has Ghana Warehouse location, redirect to Ghana Warehouse dashboard
      if (currentUser.warehouseLocation === 'Ghana Warehouse') {
        navigate('/ghana-warehouse', { replace: true });
      } else {
        navigate('/warehouse-dashboard', { replace: true });
      }
    }
  }, [currentUser, navigate]);

  // Create broadcast channel for cross-tab communication
  useEffect(() => {
    const channel = new BroadcastChannel('job_updates');
    
    // Listen for updates from other tabs
    channel.onmessage = (event) => {
      console.log('📡 Dashboard received update from another tab:', event.data);
      if (event.data.type === 'JOB_STATUS_UPDATED' || event.data.type === 'JOB_CREATED' || event.data.type === 'BATCH_CREATED' || event.data.type === 'BATCH_SHIPPED') {
        // Refresh dashboard data silently
        fetchDashboardData();
      }
    };
    
    // Cleanup
    return () => {
      channel.close();
    };
  }, []);

  // Fetch dashboard data on mount
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Auto-refresh dashboard every 120 seconds (2 minutes) to reduce API load
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing dashboard...');
      fetchDashboardData(true); // Silent refresh
    }, 120000); // 120 seconds = 2 minutes

    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async (silent = false) => {
    if (!silent) {
      setLoading(true);
    }
    try {
      // Fetch jobs and customers in parallel
      const [jobsResponse, customersResponse] = await Promise.all([
        jobAPI.getAll(),
        customerAPI.getAll()
      ]);

      // Process jobs
      if (jobsResponse.success && jobsResponse.data) {
        const rawJobs = Array.isArray(jobsResponse.data) ? jobsResponse.data : jobsResponse.data.jobs || [];
        setJobs(rawJobs);

        // Calculate statistics
        const total = rawJobs.length;
        const activeJobs = rawJobs.filter(j => 
          !['delivered', 'cancelled'].includes(j.status)
        ).length;
        
        // Build stats array conditionally based on permissions
        const baseStats = [
          {
            title: 'Total Jobs',
            value: total,
            prefix: <ShoppingOutlined />,
            color: '#1890ff',
            suffix: ''
          },
          {
            title: 'Active Jobs',
            value: activeJobs,
            prefix: <ClockCircleOutlined />,
            color: '#faad14',
            suffix: ''
          },
          {
            title: 'Total Customers',
            value: 0, // Will be updated below
            prefix: <UserOutlined />,
            color: '#52c41a',
            suffix: ''
          }
        ];

        // Only calculate and show revenue if user has financial:view permission
        const canViewRevenue = hasPermission(currentUser, 'financial:view');
        if (canViewRevenue) {
          // Calculate revenue (sum of all delivered job values this month)
          const currentMonth = new Date().getMonth();
          const currentYear = new Date().getFullYear();
          const revenue = rawJobs
            .filter(j => {
              if (j.status !== 'delivered' || !j.actualDelivery) return false;
              const deliveryDate = new Date(j.actualDelivery);
              return deliveryDate.getMonth() === currentMonth && 
                     deliveryDate.getFullYear() === currentYear;
            })
            .reduce((sum, j) => sum + (parseFloat(j.value) || 0), 0);

          baseStats.push({
            title: 'Revenue This Month',
            value: revenue.toFixed(2),
            prefix: <DollarOutlined />,
            color: '#722ed1',
            suffix: '£'
          });
        }

        setStats(baseStats);
      }

      // Process customers
      if (customersResponse.success && customersResponse.data) {
        const rawCustomers = Array.isArray(customersResponse.data) ? customersResponse.data : customersResponse.data.customers || [];
        setCustomers(rawCustomers);

        // Update customer count in stats
        setStats(prev => prev.map(stat => 
          stat.title === 'Total Customers' 
            ? { ...stat, value: rawCustomers.length }
            : stat
        ));
      }

    } catch (error) {
      console.error('❌ Failed to fetch dashboard data:', error);
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  // Get recent 5 jobs
  const recentJobs = jobs
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5)
    .map(job => ({
      key: job.id,
      jobId: job.trackingId,
      customer: job.customer?.name || 'N/A',
      service: job.priority || 'Standard',
      status: job.status,
      date: new Date(job.createdAt).toLocaleDateString()
    }));

  const jobColumns = [
    {
      title: 'Job ID',
      dataIndex: 'jobId',
      key: 'jobId',
      render: (text) => <Text strong>{text}</Text>
    },
    {
      title: 'Customer',
      dataIndex: 'customer',
      key: 'customer',
    },
    {
      title: 'Service',
      dataIndex: 'service',
      key: 'service',
      render: (service) => (
        <Tag color={service === 'Urgent' ? 'red' : service === 'Express' ? 'orange' : 'blue'}>
          {service}
        </Tag>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={
          ['delivered', 'arrived_at_hub'].includes(status) ? 'green' :
          ['in_transit', 'collected', 'out_for_delivery'].includes(status) ? 'blue' :
          ['assigned', 'batched'].includes(status) ? 'orange' :
          status === 'cancelled' ? 'red' :
          'default'
        }>
          {status?.replace(/_/g, ' ').toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            size="small" 
            icon={<EyeOutlined />}
            onClick={() => navigate('/jobs')}
          >
            View
          </Button>
        </Space>
      ),
    },
  ];

  // Conditional rendering after all hooks
  if (currentUser?.role === 'finance') {
    return <FinanceDashboard />;
  }

  return (
    <div style={{ padding: '24px' }} className="dashboard-page-container">
      {/* Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: '24px' }} gutter={[16, 16]}>
        <Col xs={24} md={16}>
          <Title level={2} style={{ margin: 0, color: '#333' }}>
            Dashboard
          </Title>
          <Text type="secondary" style={{ fontSize: '16px' }}>
            Welcome to your delivery management dashboard
          </Text>
        </Col>
        <Col xs={24} md={8} style={{ textAlign: 'right' }} className="mobile-full-width">
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            size="large"
            className="mobile-full-width"
            onClick={() => navigate('/jobs', { state: { openNewJobModal: true } })}
            style={{ width: 'auto' }}
          >
            New Job
          </Button>
        </Col>
      </Row>

      {/* Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        {stats.map((stat, index) => {
          // Calculate column span dynamically based on number of cards
          // For 3 cards: 24/3 = 8, For 4 cards: 24/4 = 6
          const totalCards = stats.length;
          const colSpan = Math.floor(24 / totalCards);
          
          return (
            <Col xs={24} sm={12} md={colSpan} key={index}>
              <Card>
                <Statistic
                  title={stat.title}
                  value={stat.value}
                  prefix={stat.prefix}
                  suffix={stat.suffix}
                  valueStyle={{ color: stat.color }}
                />
              </Card>
            </Col>
          );
        })}
      </Row>

      {/* Main Content */}
      <Row gutter={[24, 24]}>
        {/* Recent Jobs */}
        <Col xs={24}>
          <Card 
            title="Recent Jobs" 
            extra={
              <Button type="link" onClick={() => navigate('/jobs')}>
                View All
              </Button>
            }
          >
            <Table
              columns={jobColumns}
              dataSource={recentJobs}
              loading={loading}
              pagination={false}
              size="small"
              locale={{
                emptyText: 'No recent jobs'
              }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DashboardPage;
