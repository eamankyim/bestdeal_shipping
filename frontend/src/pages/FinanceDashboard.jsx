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
  Spin,
  Progress
} from 'antd';
import { 
  DollarOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { dashboardAPI } from '../utils/api';
import ResponsiveTable from '../components/common/ResponsiveTable';

const { Title, Text } = Typography;

const FinanceDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchFinanceDashboard();
  }, []);

  // Auto-refresh every 120 seconds (2 minutes) to reduce API load
  // Only refresh if there's no error and component is mounted
  useEffect(() => {
    if (error) return; // Don't auto-refresh if there's an error
    
    const interval = setInterval(() => {
      if (!error) { // Double-check error state before refresh
        fetchFinanceDashboard();
      }
    }, 120000); // 120 seconds = 2 minutes
    return () => clearInterval(interval);
  }, [error]);

  const fetchFinanceDashboard = async () => {
    try {
      setLoading(true);
      setError(null); // Clear previous errors
      const response = await dashboardAPI.getFinance();

      if (response.success) {
        setDashboardData(response.data);
      } else {
        setError(response.message || 'Failed to load dashboard data');
      }
    } catch (error) {
      console.error('Failed to fetch finance dashboard:', error);
      setError(error?.message || 'Failed to load finance dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !dashboardData) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Spin size="large" />
        <p style={{ marginTop: 16 }}>Loading finance dashboard...</p>
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
    invoiceStats, 
    revenueStats, 
    recentInvoices, 
    overdueInvoices,
    monthlyRevenue,
    todayActivity
  } = dashboardData;

  // Statistics cards
  const statsCards = [
    {
      title: 'Total Revenue',
      value: `$${revenueStats?.totalRevenue?.toFixed(2) || '0.00'}`,
      prefix: <DollarOutlined />,
      color: '#52c41a',
    },
    {
      title: 'Pending Revenue',
      value: `$${revenueStats?.pendingRevenue?.toFixed(2) || '0.00'}`,
      prefix: <ClockCircleOutlined />,
      color: '#faad14',
    },
    {
      title: 'This Month',
      value: `$${monthlyRevenue?.total?.toFixed(2) || '0.00'}`,
      prefix: <CheckCircleOutlined />,
      color: '#1890ff',
      suffix: ` (${monthlyRevenue?.count || 0})`,
    },
    {
      title: 'Total Invoices',
      value: invoiceStats?.total || 0,
      prefix: <FileTextOutlined />,
      color: '#722ed1',
    },
  ];

  // Handle view invoice
  const handleViewInvoice = (invoice) => {
    navigate('/invoice-management', { state: { selectedInvoiceId: invoice.id } });
  };

  // Invoice columns
  const invoiceColumns = [
    {
      title: 'Invoice #',
      dataIndex: 'invoiceNumber',
      key: 'invoiceNumber',
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
      title: 'Issue Date',
      dataIndex: 'issueDate',
      key: 'issueDate',
      render: (date) => new Date(date).toLocaleDateString(),
      mobile: false,
    },
    {
      title: 'Due Date',
      dataIndex: 'dueDate',
      key: 'dueDate',
      render: (date) => new Date(date).toLocaleDateString(),
      mobile: false,
    },
    {
      title: 'Amount',
      dataIndex: 'total',
      key: 'total',
      render: (amount) => `$${parseFloat(amount).toFixed(2)}`,
      mobile: true,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      mobile: true,
      render: (status) => {
        const colors = {
          'Paid': 'green',
          'Pending': 'orange',
          'Overdue': 'red',
          'Cancelled': 'default',
        };
        return <Tag color={colors[status] || 'default'}>{status}</Tag>;
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
            handleViewInvoice(record);
          }}
        >
          View
        </Button>
      ),
    },
  ];

  // Overdue invoice columns
  const overdueColumns = [
    {
      title: 'Invoice #',
      dataIndex: 'invoiceNumber',
      key: 'invoiceNumber',
      render: (text) => <Text strong style={{ color: '#ff4d4f' }}>{text}</Text>,
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
      title: 'Due Date',
      dataIndex: 'dueDate',
      key: 'dueDate',
      mobile: false,
      render: (date) => {
        const dueDate = new Date(date);
        const today = new Date();
        const daysOverdue = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
        return (
          <Space>
            <Text type="danger">{dueDate.toLocaleDateString()}</Text>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              ({daysOverdue} days overdue)
            </Text>
          </Space>
        );
      }
    },
    {
      title: 'Amount',
      dataIndex: 'total',
      key: 'total',
      mobile: true,
      render: (amount) => (
        <Text strong style={{ color: '#ff4d4f' }}>
          ${parseFloat(amount).toFixed(2)}
        </Text>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      mobile: true,
      render: (_, record) => (
        <Button 
          size="small" 
          type="primary"
          danger
          icon={<EyeOutlined />}
          onClick={(e) => {
            e.stopPropagation();
            handleViewInvoice(record);
          }}
        >
          Follow Up
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
            <DollarOutlined /> Finance Dashboard
          </Title>
          <Text type="secondary" style={{ fontSize: '16px' }}>
            Financial overview and invoice management
          </Text>
        </Col>
        <Col>
          <Space>
            <Button onClick={() => navigate('/invoice-management')}>
              View All Invoices
            </Button>
            <Button type="primary" onClick={() => navigate('/invoice-management')}>
              Create Invoice
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
                suffix={stat.suffix}
                valueStyle={{ color: stat.color, fontSize: stat.suffix ? '20px' : undefined }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* Invoice Status Overview */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} md={12}>
          <Card title="Invoice Status Distribution">
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <div>
                <Text>Paid</Text>
                <Progress 
                  percent={((invoiceStats?.paid || 0) / (invoiceStats?.total || 1)) * 100} 
                  format={() => invoiceStats?.paid || 0}
                  strokeColor="#52c41a"
                />
              </div>
              <div>
                <Text>Pending</Text>
                <Progress 
                  percent={((invoiceStats?.pending || 0) / (invoiceStats?.total || 1)) * 100}
                  format={() => invoiceStats?.pending || 0}
                  strokeColor="#faad14"
                />
              </div>
              <div>
                <Text>Overdue</Text>
                <Progress 
                  percent={((invoiceStats?.overdue || 0) / (invoiceStats?.total || 1)) * 100}
                  format={() => invoiceStats?.overdue || 0}
                  strokeColor="#ff4d4f"
                />
              </div>
            </Space>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card title="Today's Activity">
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <Statistic
                title="New Invoices Created"
                value={todayActivity?.newInvoices || 0}
                prefix={<FileTextOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
              <Statistic
                title="Payments Received"
                value={todayActivity?.payments || 0}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Overdue Invoices Alert */}
      {overdueInvoices && overdueInvoices.length > 0 && (
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          <Col xs={24}>
            <Card 
              title={
                <Space>
                  <WarningOutlined style={{ color: '#ff4d4f' }} />
                  <span style={{ color: '#ff4d4f' }}>Overdue Invoices - Action Required</span>
                  <Tag color="red">{overdueInvoices.length}</Tag>
                </Space>
              }
            >
              <ResponsiveTable
                columns={overdueColumns}
                dataSource={overdueInvoices || []}
                loading={loading}
                rowKey="id"
                pagination={false}
                size="small"
                onCardClick={handleViewInvoice}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* Recent Invoices */}
      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Card 
            title={
              <Space>
                <FileTextOutlined />
                <span>Recent Invoices</span>
              </Space>
            }
          >
            <ResponsiveTable
              columns={invoiceColumns}
              dataSource={recentInvoices || []}
              loading={loading}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total) => `Total ${total} invoices`
              }}
              size="small"
              locale={{
                emptyText: 'No invoices found'
              }}
              onCardClick={handleViewInvoice}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default FinanceDashboard;

