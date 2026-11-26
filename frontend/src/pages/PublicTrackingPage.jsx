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
  Steps,
  Alert,
  message
} from 'antd';
import { 
  SearchOutlined, 
  EnvironmentOutlined, 
  CalendarOutlined,
  InboxOutlined
} from '@ant-design/icons';
import config from '../config/env';
import { trackingAPI } from '../utils/api';

const { Title, Text } = Typography;

const PublicTrackingPage = () => {
  const [trackingId, setTrackingId] = useState('');
  const [trackingResult, setTrackingResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [support, setSupport] = useState(null);

  const handleSearch = async () => {
    if (!trackingId.trim()) return;
    
    setLoading(true);
    setSearched(true);
    
    try {
      const response = await trackingAPI.track(trackingId.trim());
      
      if (response.success && response.data) {
        setTrackingResult(response.data.job);
        setSupport(response.data.support);
        message.success('Job found!');
      } else {
        setTrackingResult(null);
        message.error('Job not found');
      }
    } catch (error) {
      setTrackingResult(null);
      message.error(error.message || 'Failed to find job. Please try again.');
    } finally {
      setLoading(false);
    }
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
                placeholder="Tracking number (e.g. SHIP-20251025-VSJO5)"
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
                  {/* Where the parcel is. Names and labels come with the tracking answer. */}
                  <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <InboxOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
                    <Title level={3} style={{ margin: '8px 0' }}>
                      {trackingResult.trackingId}
                    </Title>
                    <Tag color={trackingResult.statusColor} style={{ fontSize: '16px', padding: '8px 16px' }}>
                      {trackingResult.statusLabel}
                    </Tag>
                    {trackingResult.statusDescription && (
                      <div style={{ marginTop: 8 }}><Text type="secondary">{trackingResult.statusDescription}</Text></div>
                    )}
                  </div>

                  {trackingResult.problem && (
                    <Alert type="warning" showIcon style={{ marginBottom: 24 }} message="We are sorting this out" description="We will contact you to arrange a new time. You can also contact us using the details below." />
                  )}
                  {trackingResult.cancelled ? (
                    <Alert type="info" showIcon style={{ marginBottom: 24 }} message="This shipment was cancelled" />
                  ) : (
                    <Card size="small" title="Journey" style={{ marginBottom: 24 }}>
                      <Steps
                        direction="vertical"
                        size="small"
                        current={Math.max(trackingResult.stages.findIndex((stage) => stage.current), 0)}
                        status={trackingResult.problem ? 'error' : trackingResult.status === 'delivered' ? 'finish' : 'process'}
                        items={trackingResult.stages.map((stage) => ({ title: stage.label }))}
                      />
                    </Card>
                  )}

                  <Card 
                    size="small" 
                    title={<span className="user-info-title">Package Details</span>}
                    className="user-info-card"
                    style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)', borderRadius: 8, marginBottom: 24 }}
                  >
                    <div className="user-info-list">
                      {[
                        ['Service', <Tag color="blue">{trackingResult.priority || 'Standard'}</Tag>],
                        ['Weight', trackingResult.weight ? `${Number(trackingResult.weight)} kg` : null],
                        ['Items', trackingResult.quantity || 1],
                        ['Booked', trackingResult.createdAt ? new Date(trackingResult.createdAt).toLocaleDateString() : null],
                        [trackingResult.actualDelivery ? 'Delivered' : 'Expected Delivery', (trackingResult.actualDelivery || trackingResult.estimatedDelivery) && (
                          <span><CalendarOutlined style={{ color: '#1890ff', marginRight: 8 }} />{new Date(trackingResult.actualDelivery || trackingResult.estimatedDelivery).toLocaleDateString()}</span>
                        )],
                      ].filter(([, value]) => value !== null && value !== undefined && value !== '').map(([label, value]) => (
                        <div className="user-info-item" key={label}>
                          <div className="user-info-label">{label}</div>
                          <div className="user-info-value">{value}</div>
                        </div>
                      ))}
                    </div>
                  </Card>

                  <Card size="small" title="Tracking History">
                    <Timeline
                      items={[...trackingResult.timeline].reverse().map((item, index) => ({
                        key: `${item.status}-${item.timestamp}`,
                        color: index === 0 ? 'green' : 'blue',
                        children: (
                          <div>
                            <Text strong>{item.label}</Text>
                            {item.location && (
                              <>
                                <br />
                                <Space><EnvironmentOutlined /><Text type="secondary">{item.location}</Text></Space>
                              </>
                            )}
                            <br />
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                              {new Date(item.timestamp).toLocaleString()}
                            </Text>
                          </div>
                        ),
                      }))}
                    />
                  </Card>
                </div>
              ) : (
                <Empty
                  description={searched ? "No shipment found for this tracking number" : "Enter a tracking number to track your package"}
                  style={{ padding: '40px' }}
                />
              )}
            </Card>
          )}

          {/* Footer */}
          {/* Contact details as saved in Settings → Organisation (sent with the tracking answer) */}
          {(support?.email || support?.phone || config.support.email || config.support.phone) && (
            <Card style={{ marginTop: '24px', textAlign: 'center' }}>
              <Text type="secondary">
                Need help? Contact {support?.companyName || config.app.name}
                {(support?.email || config.support.email) && <> at {support?.email || config.support.email}</>}
                {(support?.phone || config.support.phone) && <> or call {support?.phone || config.support.phone}</>}
              </Text>
            </Card>
          )}
        </Col>
      </Row>
    </div>
  );
};

export default PublicTrackingPage;
