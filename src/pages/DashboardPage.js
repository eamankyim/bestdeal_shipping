import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Row,
  Col,
  Card,
  Statistic,
  Table,
  Button,
  Tag,
  Space,
  Typography,
  Progress,
  Timeline,
  Avatar,
  Badge,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  CarOutlined,
  ShopOutlined,
  UserOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;

const DashboardPage = () => {
  const navigate = useNavigate();

  // Mock data - in real app this would come from API
  const stats = [
    {
      title: 'Total Shipments',
      value: 1,234,
      prefix: <CarOutlined />,
      color: '#1890ff',
      change: '+12%',
      changeType: 'up',
    },
    {
      title: 'In Transit',
      value: 89,
      prefix: <ShopOutlined />,
      color: '#fa8c16',
      change: '+5%',
      changeType: 'up',
    },
    {
      title: 'Delivered Today',
      value: 23,
      prefix: <CheckCircleOutlined />,
      color: '#52c41a',
      change: '+18%',
      changeType: 'up',
    },
    {
      title: 'Pending Collections',
      value: 15,
      prefix: <ClockCircleOutlined />,
      color: '#722ed1',
      change: '-3%',
      changeType: 'down',
    },
  ];

  const recentShipments = [
    {
      key: '1',
      trackingId: 'DTD-2024-001',
      customer: 'John Smith',
      status: 'In Transit',
      origin: 'London, UK',
      destination: 'Accra, Ghana',
      eta: '2024-01-25',
      progress: 65,
    },
    {
      key: '2',
      trackingId: 'DTD-2024-002',
      customer: 'Sarah Johnson',
      status: 'At UK Warehouse',
      origin: 'Manchester, UK',
      destination: 'Kumasi, Ghana',
      eta: '2024-01-28',
      progress: 25,
    },
    {
      key: '3',
      trackingId: 'DTD-2024-003',
      customer: 'Mike Wilson',
      status: 'Out for Delivery',
      origin: 'Birmingham, UK',
      destination: 'Accra, Ghana',
      eta: '2024-01-20',
      progress: 90,
    },
    {
      key: '4',
      trackingId: 'DTD-2024-004',
      customer: 'Emma Davis',
      status: 'Delivered',
      origin: 'Liverpool, UK',
      destination: 'Accra, Ghana',
      eta: '2024-01-18',
      progress: 100,
    },
  ];

  const recentActivities = [
    {
      time: '2 minutes ago',
      action: 'Shipment DTD-2024-001 arrived at Ghana warehouse',
      user: 'Warehouse Staff',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Warehouse',
    },
    {
      time: '15 minutes ago',
      customer: 'John Smith',
      action: 'Payment received for shipment DTD-2024-005',
      user: 'Finance Team',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Finance',
    },
    {
      time: '1 hour ago',
      action: 'Driver collected parcel from Sarah Johnson',
      user: 'UK Driver',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Driver',
    },
    {
      time: '2 hours ago',
      action: 'New shipment booked by Mike Wilson',
      user: 'Staff',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Staff',
    },
  ];

  const getStatusColor = (status) => {
    const colors = {
      'Booked': 'blue',
      'Collected': 'cyan',
      'At UK Warehouse': 'orange',
      'In Transit': 'processing',
      'Arrived Ghana': 'warning',
      'At Ghana Warehouse': 'orange',
      'Out for Delivery': 'purple',
      'Delivered': 'success',
    };
    return colors[status] || 'default';
  };

  const columns = [
    {
      title: 'Tracking ID',
      dataIndex: 'trackingId',
      key: 'trackingId',
      render: (text) => <Text strong copyable>{text}</Text>,
    },
    {
      title: 'Customer',
      dataIndex: 'customer',
      key: 'customer',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {status}
        </Tag>
      ),
    },
    {
      title: 'Route',
      key: 'route',
      render: (_, record) => (
        <div>
          <div>{record.origin}</div>
          <Text type="secondary">→</Text>
          <div>{record.destination}</div>
        </div>
      ),
    },
    {
      title: 'ETA',
      dataIndex: 'eta',
      key: 'eta',
    },
    {
      title: 'Progress',
      key: 'progress',
      render: (_, record) => (
        <Progress 
          percent={record.progress} 
          size="small" 
          status={record.progress === 100 ? 'success' : 'active'}
        />
      ),
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Button 
          type="link" 
          onClick={() => navigate('/track-shipment', { state: { trackingId: record.trackingId } })}
        >
          Track
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>Dashboard</Title>
        <Text type="secondary">Welcome back! Here's what's happening with your shipments.</Text>
      </div>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {stats.map((stat, index) => (
          <Col xs={24} sm={12} lg={6} key={index}>
            <Card>
              <Statistic
                title={stat.title}
                value={stat.value}
                prefix={<div style={{ color: stat.color }}>{stat.prefix}</div>}
                suffix={
                  <div style={{ fontSize: 14, marginLeft: 8 }}>
                    <Text type={stat.changeType === 'up' ? 'success' : 'danger'}>
                      {stat.changeType === 'up' ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                      {stat.change}
                    </Text>
                  </div>
                }
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* Quick Actions */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={24}>
          <Card title="Quick Actions">
            <Space size="middle">
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                size="large"
                onClick={() => navigate('/jobs')}
              >
                New Job
              </Button>
              <Button 
                icon={<SearchOutlined />}
                size="large"
                onClick={() => navigate('/track-shipment')}
              >
                Track Shipment
              </Button>
              <Button 
                icon={<CarOutlined />}
                size="large"
                onClick={() => navigate('/driver')}
              >
                Driver Operations
              </Button>
              <Button 
                icon={<ShopOutlined />}
                size="large"
                onClick={() => navigate('/warehouse')}
              >
                Warehouse Management
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Main Content */}
      <Row gutter={[16, 16]}>
        {/* Recent Shipments */}
        <Col xs={24} lg={16}>
          <Card 
            title="Recent Shipments" 
            extra={
              <Button type="link" onClick={() => navigate('/track-shipment')}>
                View All
              </Button>
            }
          >
            <Table
              columns={columns}
              dataSource={recentShipments}
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
                color: index === 0 ? 'blue' : 'gray',
                children: (
                  <div>
                    <div style={{ marginBottom: 4 }}>
                      <Text strong>{activity.action}</Text>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Avatar size="small" src={activity.avatar} />
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {activity.user} • {activity.time}
                      </Text>
                    </div>
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
