import React, { useState } from 'react';
import { 
  Row, 
  Col, 
  Card, 
  Tabs, 
  Table, 
  Button, 
  Typography, 
  Tag, 
  Space,
  Statistic,
  Select,
  DatePicker,
  Input,
  Alert
} from 'antd';
import { 
  BarChartOutlined,
  PlusOutlined,
  DownloadOutlined,
  ShareAltOutlined,
  FilterOutlined,
  SearchOutlined
} from '@ant-design/icons';
import ResponsiveTable from '../components/common/ResponsiveTable';
import { useAuth } from '../contexts/AuthContext';
import { hasPermission } from '../utils/permissions';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const ReportsPage = () => {
  const { currentUser } = useAuth();
  const canViewRevenue = hasPermission(currentUser, 'financial:view');
  const [activeTab, setActiveTab] = useState('overview');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [dateRange, setDateRange] = useState(null);
  const [searchText, setSearchText] = useState('');

  const tabItems = [
    {
      key: 'overview',
      label: 'Report Overview',
      children: (
        <div>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Card title="Shipment Volume">
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <Text type="secondary">Chart placeholder</Text>
                  <br />
                  <Text>Monthly shipment volume trends</Text>
                </div>
              </Card>
            </Col>
            {canViewRevenue && (
              <Col xs={24} md={12}>
                <Card title="Revenue Analysis">
                  <div style={{ textAlign: 'center', padding: '20px' }}>
                    <Text type="secondary">Chart placeholder</Text>
                    <br />
                    <Text>Revenue breakdown by service type</Text>
                  </div>
                </Card>
              </Col>
            )}
            <Col xs={24} md={12}>
              <Card title="Customer Satisfaction">
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <Text type="secondary">Chart placeholder</Text>
                  <br />
                  <Text>Customer satisfaction ratings</Text>
                </div>
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card title="Performance Metrics">
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <Text type="secondary">Chart placeholder</Text>
                  <br />
                  <Text>On-time delivery performance</Text>
                </div>
              </Card>
            </Col>
          </Row>
        </div>
      ),
    },
    {
      key: 'generated',
      label: 'Generated Reports',
      children: (
        <div>
          {/* Mobile Alert - Hide Generate Report Button on Mobile */}
          <Alert
            message="Report Generation"
            description="Please use the web version to generate reports. Mobile devices are optimized for viewing reports only."
            type="info"
            showIcon
            closable
            style={{ marginBottom: '16px', display: 'block' }}
            className="generate-report-mobile-alert"
          />

          {/* Filters and Actions */}
          <Row gutter={[16, 16]} style={{ marginBottom: '16px' }} className="search-filter-container">
            <Col xs={24} md={6}>
              <Input
                placeholder="Search reports..."
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                allowClear
                className="mobile-full-width"
                style={{ width: '100%' }}
              />
            </Col>
            <Col xs={24} sm={12} md={4}>
              <Select
                placeholder="Report Type"
                value={filterType}
                onChange={setFilterType}
                style={{ width: '100%' }}
                allowClear
                className="mobile-full-width"
              >
                <Select.Option value="all">All Types</Select.Option>
                <Select.Option value="performance">Performance</Select.Option>
                <Select.Option value="financial">Financial</Select.Option>
                <Select.Option value="customer">Customer</Select.Option>
                <Select.Option value="operations">Operations</Select.Option>
              </Select>
            </Col>
            <Col xs={24} sm={12} md={4}>
              <Select
                placeholder="Status"
                value={filterStatus}
                onChange={setFilterStatus}
                style={{ width: '100%' }}
                allowClear
                className="mobile-full-width"
              >
                <Select.Option value="all">All Status</Select.Option>
                <Select.Option value="ready">Ready</Select.Option>
                <Select.Option value="processing">Processing</Select.Option>
              </Select>
            </Col>
            <Col xs={24} md={6}>
              <RangePicker
                value={dateRange}
                onChange={setDateRange}
                style={{ width: '100%' }}
                placeholder={['Start Date', 'End Date']}
                className="mobile-full-width"
              />
            </Col>
            <Col xs={24} md={4} style={{ textAlign: 'right' }} className="mobile-full-width generate-report-button-container">
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                className="mobile-full-width generate-report-button"
                style={{ width: 'auto' }}
              >
                Generate Report
              </Button>
            </Col>
          </Row>

          <ResponsiveTable
            columns={[
              {
                title: 'Report Name',
                dataIndex: 'name',
                key: 'name',
                mobile: true,
              },
              {
                title: 'Type',
                dataIndex: 'type',
                key: 'type',
                mobile: true,
              },
              {
                title: 'Generated Date',
                dataIndex: 'date',
                key: 'date',
                mobile: true,
              },
              {
                title: 'Status',
                dataIndex: 'status',
                key: 'status',
                mobile: true,
                render: (status) => (
                  <Tag color={status === 'Ready' ? 'success' : 'processing'}>
                    {status}
                  </Tag>
                ),
              },
              {
                title: 'Actions',
                key: 'actions',
                mobile: true,
                render: (_, record) => (
                  <Space onClick={(e) => e.stopPropagation()}>
                    <Button size="small" icon={<DownloadOutlined />} style={{ width: 'auto' }} onClick={(e) => e.stopPropagation()}>
                      Download
                    </Button>
                    <Button size="small" icon={<ShareAltOutlined />} style={{ width: 'auto' }} onClick={(e) => e.stopPropagation()}>
                      Share
                    </Button>
                  </Space>
                ),
              },
            ]}
            dataSource={[]}
            pagination={false}
            size="small"
            rowKey="id"
            locale={{
              emptyText: 'No reports generated yet. Click "Generate New Report" to create your first report.',
            }}
          />
        </div>
      ),
    },
  ];

  return (
    <div>
      <Title level={2} style={{ marginBottom: '24px' }}>
        Reports & Analytics
      </Title>

      {/* Reports Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={12} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Reports"
              value={0}
              suffix=""
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} lg={6}>
          <Card>
            <Statistic
              title="This Month"
              value={0}
              suffix=""
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Ready for Download"
              value={0}
              suffix=""
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Processing"
              value={0}
              suffix=""
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Main Content Tabs */}
      <Card>
        <Tabs 
          defaultActiveKey="overview" 
          items={tabItems}
          onChange={setActiveTab}
        />
      </Card>
    </div>
  );
};

export default ReportsPage;

