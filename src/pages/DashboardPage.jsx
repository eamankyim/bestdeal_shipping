import React, { useState } from 'react';
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
  Timeline,
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

const { Title, Text } = Typography;

const DashboardPage = () => {
  const navigate = useNavigate();

  // Mock data for statistics
  const stats = [
    {
      title: 'Total Jobs',
      value: 156,
      prefix: <ShoppingOutlined />,
      color: '#1890ff',
      suffix: ''
    },
    {
      title: 'Active Jobs',
      value: 89,
      prefix: <ClockCircleOutlined />,
      color: '#faad14',
      suffix: ''
    },
    {
      title: 'Total Customers',
      value: 234,
      prefix: <UserOutlined />,
      color: '#52c41a',
      suffix: ''
    },
    {
      title: 'Revenue This Month',
      value: 12450,
      prefix: <DollarOutlined />,
      color: '#722ed1',
      suffix: '£'
    }
  ];

  // Mock data for recent jobs
  const recentJobs = [
    {
      key: '1',
      jobId: 'JOB001',
      customer: 'John Smith',
      service: 'Express',
      status: 'In Transit',
      date: '2024-01-21'
    },
    {
      key: '2',
      jobId: 'JOB002',
      customer: 'Sarah Johnson',
      service: 'Standard',
      status: 'Collected',
      date: '2024-01-20'
    },
    {
      key: '3',
      jobId: 'JOB003',
      customer: 'Mike Wilson',
      service: 'Premium',
      status: 'Delivered',
      date: '2024-01-19'
    },
    {
      key: '4',
      jobId: 'JOB004',
      customer: 'Lisa Brown',
      service: 'Standard',
      status: 'Pending',
      date: '2024-01-18'
    }
  ];

  // Mock data for recent activities
  const recentActivities = [
    {
      time: '2 hours ago',
      activity: 'Job JOB001 marked as In Transit',
      user: 'John Driver'
    },
    {
      time: '4 hours ago',
      activity: 'New customer Sarah Johnson added',
      user: 'Admin User'
    },
    {
      time: '6 hours ago',
      activity: 'Job JOB003 delivered successfully',
      user: 'Mike Delivery'
    },
    {
      time: '8 hours ago',
      activity: 'Warehouse inventory updated',
      user: 'Sarah Warehouse'
    }
  ];

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
        <Tag color={service === 'Premium' ? 'gold' : service === 'Express' ? 'blue' : 'default'}>
          {service}
        </Tag>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = 'default';
        switch (status) {
          case 'Delivered':
            color = 'success';
            break;
          case 'In Transit':
            color = 'processing';
            break;
          case 'Collected':
            color = 'warning';
            break;
          case 'Pending':
            color = 'default';
            break;
          default:
            color = 'default';
        }
        return <Tag color={color}>{status}</Tag>;
      }
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

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <Title level={2} style={{ margin: 0, color: '#333' }}>
            Dashboard
          </Title>
          <Text type="secondary" style={{ fontSize: '16px' }}>
            Welcome to your delivery management dashboard
          </Text>
        </div>
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          size="large"
          onClick={() => navigate('/jobs')}
        >
          New Job
        </Button>
      </div>

      {/* Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        {stats.map((stat, index) => (
          <Col xs={24} sm={12} lg={6} key={index}>
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
        ))}
      </Row>

      {/* Main Content */}
      <Row gutter={[24, 24]}>
        {/* Recent Jobs */}
        <Col xs={24} lg={16}>
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
              pagination={false}
              size="small"
            />
          </Card>
        </Col>

        {/* Recent Activities */}
        <Col xs={24} lg={8}>
          <Card title="Recent Activities">
            <Timeline
              items={recentActivities.map((activity, index) => ({
                children: (
                  <div>
                    <Text strong>{activity.activity}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      by {activity.user} • {activity.time}
                    </Text>
                  </div>
                ),
              }))}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DashboardPage;
