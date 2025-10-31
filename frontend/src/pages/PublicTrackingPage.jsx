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
            <Row gutter={[8, 8]} align="middle">
              <Col xs={24} md="auto" style={{ flex: 'auto' }}>
              <Input
                size="large"
                placeholder="Enter job ID (e.g., SHIP-20251025-VSJO5)"
                value={trackingId}
                onChange={(e) => setTrackingId(e.target.value)}
                onPressEnter={handleSearch}
                prefix={<SearchOutlined />}
              />
              </Col>
              <Col xs={24} md="auto">
              <Button 
                type="primary" 
                size="large"
                onClick={handleSearch}
                loading={loading}
                  className="track-button-mobile"
              >
                Track
              </Button>
              </Col>
            </Row>
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
                  <Card 
                    size="small" 
                    title={<span className="user-info-title">Package Details</span>}
                    className="user-info-card"
                    style={{ 
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      borderRadius: 8,
                      marginBottom: 24
                    }}
                  >
                    <div className="user-info-list">
                      <div className="user-info-item">
                        <div className="user-info-label">Customer</div>
                        <div className="user-info-value">
                          <UserOutlined style={{ color: '#1890ff', marginRight: '8px' }} />
                          <Text>{trackingResult.customer?.name || 'N/A'}</Text>
                        </div>
                      </div>
                      <div className="user-info-item">
                        <div className="user-info-label">Service</div>
                        <div className="user-info-value">
                            <Tag color="blue">{trackingResult.priority || 'Standard'}</Tag>
                        </div>
                      </div>
                      <div className="user-info-item">
                        <div className="user-info-label">Weight</div>
                        <div className="user-info-value">
                          <InboxOutlined style={{ color: '#1890ff', marginRight: '8px' }} />
                          <Text>{trackingResult.weight ? `${trackingResult.weight}kg` : 'N/A'}</Text>
                        </div>
                      </div>
                      {/* Value hidden on public tracking page for privacy */}
                      <div className="user-info-item">
                        <div className="user-info-label">Quantity</div>
                        <div className="user-info-value">
                          <Text>{trackingResult.quantity || 1}</Text>
                        </div>
                      </div>
                      <div className="user-info-item">
                        <div className="user-info-label">Origin</div>
                        <div className="user-info-value">
                          <EnvironmentOutlined style={{ color: '#1890ff', marginRight: '8px' }} />
                          <Text>{trackingResult.pickupAddress || 'N/A'}</Text>
                        </div>
                      </div>
                      <div className="user-info-item">
                        <div className="user-info-label">Destination</div>
                        <div className="user-info-value">
                          <EnvironmentOutlined style={{ color: '#1890ff', marginRight: '8px' }} />
                          <Text>{trackingResult.deliveryAddress || 'N/A'}</Text>
                        </div>
                      </div>
                      <div className="user-info-item">
                        <div className="user-info-label">Collection Date</div>
                        <div className="user-info-value">
                          <CalendarOutlined style={{ color: '#1890ff', marginRight: '8px' }} />
                          <Text>{trackingResult.createdAt ? new Date(trackingResult.createdAt).toLocaleDateString() : 'N/A'}</Text>
                        </div>
                      </div>
                      <div className="user-info-item">
                        <div className="user-info-label">Estimated Delivery</div>
                        <div className="user-info-value">
                          <CalendarOutlined style={{ color: '#1890ff', marginRight: '8px' }} />
                          <Text>{trackingResult.estimatedDelivery ? new Date(trackingResult.estimatedDelivery).toLocaleDateString() : 'N/A'}</Text>
                        </div>
                      </div>
                    </div>
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
