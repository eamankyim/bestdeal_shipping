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
  Statistic
} from 'antd';
import { 
  BarChartOutlined,
  PlusOutlined,
  DownloadOutlined,
  ShareAltOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

const ReportsPage = () => {
  const [activeTab, setActiveTab] = useState('overview');

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
            <Col xs={24} md={12}>
              <Card title="Revenue Analysis">
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <Text type="secondary">Chart placeholder</Text>
                  <br />
                  <Text>Revenue breakdown by service type</Text>
                </div>
              </Card>
            </Col>
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
          <div style={{ marginBottom: '16px' }}>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
            >
              Generate New Report
            </Button>
          </div>
          <Table
            columns={[
              {
                title: 'Report Name',
                dataIndex: 'name',
                key: 'name',
              },
              {
                title: 'Type',
                dataIndex: 'type',
                key: 'type',
              },
              {
                title: 'Generated Date',
                dataIndex: 'date',
                key: 'date',
              },
              {
                title: 'Status',
                dataIndex: 'status',
                key: 'status',
                render: (status) => (
                  <Tag color={status === 'Ready' ? 'success' : 'processing'}>
                    {status}
                  </Tag>
                ),
              },
              {
                title: 'Actions',
                key: 'actions',
                render: () => (
                  <Space>
                    <Button size="small" icon={<DownloadOutlined />}>Download</Button>
                    <Button size="small" icon={<ShareAltOutlined />}>Share</Button>
                  </Space>
                ),
              },
            ]}
            dataSource={[
              {
                key: '1',
                name: 'Monthly Performance Report',
                type: 'Performance',
                date: '2024-01-20',
                status: 'Ready',
              },
              {
                key: '2',
                name: 'Revenue Analysis Q4 2023',
                type: 'Financial',
                date: '2024-01-15',
                status: 'Ready',
              },
              {
                key: '3',
                name: 'Customer Satisfaction Survey',
                type: 'Customer',
                date: '2024-01-18',
                status: 'Processing',
              },
            ]}
            pagination={false}
            size="small"
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
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Reports"
              value={24}
              suffix=""
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="This Month"
              value={8}
              suffix=""
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Ready for Download"
              value={18}
              suffix=""
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Processing"
              value={6}
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

