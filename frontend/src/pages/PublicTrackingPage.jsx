import React, { useState } from 'react';
import { 
  Input, 
  Button, 
  Card, 
  Typography, 
  Space, 
  Tag, 
  Row, 
  Col, 
  Descriptions, 
  Timeline,
  Spin,
  Empty,
  Result,
  Divider,
  message
} from 'antd';
import { 
  SearchOutlined, 
  UserOutlined, 
  EnvironmentOutlined, 
  CalendarOutlined,
  InboxOutlined
} from '@ant-design/icons';
import config from '../config/env';
import { trackingAPI } from '../utils/api';
import { getStatusColor } from '../constants/jobStatuses';

const { Title, Text } = Typography;
const { Search } = Input;

const PublicTrackingPage = () => {
  const [trackingId, setTrackingId] = useState('');
  const [trackingResult, setTrackingResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // TODO: Remove mock data - fetch from API

  const handleSearch = async () => {
    if (!trackingId.trim()) return;
    
    setLoading(true);
    setSearched(true);
    
    try {
      console.log('🔍 Tracking shipment:', trackingId);
      const response = await trackingAPI.track(trackingId);
      
      if (response.success && response.data) {
        console.log('✅ Tracking data received:', response.data);
        setTrackingResult(response.data.job);
        message.success('Job found!');
      } else {
        setTrackingResult(null);
        message.error('Job not found');
      }
    } catch (error) {
      console.error('❌ Tracking error:', error);
      setTrackingResult(null);
      message.error(error.message || 'Failed to find job. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColorLocal = (status) => {
    return getStatusColor(status);
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <Row justify="center" style={{ width: '100%' }}>
        <Col xs={24} sm={20} md={16} lg={12} xl={8}>
          {/* Header with Logo */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <img 
              src={config.app.logoPath} 
              alt={config.app.name} 
              style={{ 
                width: '120px', 
                height: 'auto',
                objectFit: 'contain',
                marginBottom: '16px'
              }} 
            />
            <Title level={2} style={{ color: '#fff', margin: 0 }}>
              Track Your Package
            </Title>
            <Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '16px' }}>
              Enter your tracking number to get real-time updates
            </Text>
          </div>

          {/* Search Section */}
          <Card style={{ marginBottom: '24px' }}>
            <Space.Compact style={{ width: '100%' }} className="search-compact">
              <Input
                size="large"
                placeholder="Enter job ID (e.g., SHIP-20251025-VSJO5)"
                value={trackingId}
                onChange={(e) => setTrackingId(e.target.value)}
                onPressEnter={handleSearch}
                prefix={<SearchOutlined />}
              />
              <Button 
                type="primary" 
                size="large"
                onClick={handleSearch}
                loading={loading}
              >
                Track
              </Button>
            </Space.Compact>
          </Card>

          {/* Results Section */}
          {searched && (
            <Card>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <Spin size="large" />
                  <div style={{ marginTop: '16px' }}>
                    <Text>Tracking your package...</Text>
                  </div>
                </div>
              ) : trackingResult ? (
                <div>
                  {/* Package Overview */}
                  <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                      <InboxOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
                      <Title level={3} style={{ margin: '8px 0 0' }}>
                        {trackingResult.trackingId}
                      </Title>
                      <Tag
                        color={getStatusColorLocal(trackingResult.status)}
                        style={{ fontSize: '16px', padding: '8px 16px' }}
                      >
                        {trackingResult.status}
                      </Tag>
                    </div>
                  </div>

                  {/* Package Details */}
                  <Card size="small" title="Package Details" style={{ marginBottom: '24px' }}>
                    <Row gutter={[16, 16]}>
                      <Col xs={24} md={12}>
                        <Descriptions column={1} size="small">
                          <Descriptions.Item label="Customer">
                            <Space>
                              <UserOutlined />
                              {trackingResult.customer?.name || 'N/A'}
                            </Space>
                          </Descriptions.Item>
                          <Descriptions.Item label="Service">
                            <Tag color="blue">{trackingResult.priority || 'Standard'}</Tag>
                          </Descriptions.Item>
                          <Descriptions.Item label="Weight">
                            <Space>
                              <InboxOutlined />
                              {trackingResult.weight ? `${trackingResult.weight}kg` : 'N/A'}
                            </Space>
                          </Descriptions.Item>
                          <Descriptions.Item label="Declared Value">
                            {trackingResult.value ? `£${trackingResult.value}` : 'N/A'}
                          </Descriptions.Item>
                          <Descriptions.Item label="Quantity">
                            {trackingResult.quantity || 1}
                          </Descriptions.Item>
                        </Descriptions>
                      </Col>
                      <Col xs={24} md={12}>
                        <Descriptions column={1} size="small">
                          <Descriptions.Item label="Origin">
                            <Space>
                              <EnvironmentOutlined />
                              {trackingResult.pickupAddress || 'N/A'}
                            </Space>
                          </Descriptions.Item>
                          <Descriptions.Item label="Destination">
                            <Space>
                              <EnvironmentOutlined />
                              {trackingResult.deliveryAddress || 'N/A'}
                            </Space>
                          </Descriptions.Item>
                          <Descriptions.Item label="Collection Date">
                            <Space>
                              <CalendarOutlined />
                              {trackingResult.createdAt ? new Date(trackingResult.createdAt).toLocaleDateString() : 'N/A'}
                            </Space>
                          </Descriptions.Item>
                          <Descriptions.Item label="Estimated Delivery">
                            <Space>
                              <CalendarOutlined />
                              {trackingResult.estimatedDelivery ? new Date(trackingResult.estimatedDelivery).toLocaleDateString() : 'N/A'}
                            </Space>
                          </Descriptions.Item>
                        </Descriptions>
                      </Col>
                    </Row>
                  </Card>

                  {/* Current Status */}
                  <Card size="small" title="Current Status" style={{ marginBottom: '24px' }}>
                    <Space>
                      <EnvironmentOutlined style={{ color: '#1890ff' }} />
                      <Text strong>{trackingResult.status}</Text>
                    </Space>
                  </Card>

                  {/* Tracking Timeline */}
                  <Card size="small" title="Tracking Timeline">
                    <Timeline
                      items={trackingResult.timeline.map((item, index) => ({
                        color: item.status === 'completed' ? 'green' : 'blue',
                        children: (
                          <div>
                            <Text strong>{item.event}</Text>
                            <br />
                            <Space>
                              <EnvironmentOutlined />
                              <Text type="secondary">{item.location}</Text>
                            </Space>
                            <br />
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                              {item.time}
                            </Text>
                          </div>
                        ),
                      }))}
                    />
                  </Card>
                </div>
              ) : (
                <Empty
                  description={searched ? "No shipment found for this job ID" : "Enter a job ID to track your package"}
                  style={{ padding: '40px' }}
                />
              )}
            </Card>
          )}

          {/* Footer */}
          <Card style={{ marginTop: '24px', textAlign: 'center' }}>
            <Text type="secondary">
              Need help? Contact us at {config.support.email} or call {config.support.phone}
            </Text>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default PublicTrackingPage;
