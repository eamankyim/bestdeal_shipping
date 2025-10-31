import React, { useState } from 'react';
import { 
  Input, 
  Button, 
  Card, 
  Row, 
  Col, 
  Progress, 
  Timeline, 
  Tag, 
  Typography, 
  Space,
  message,
  Divider
} from 'antd';
import { SearchOutlined, CarOutlined, CheckCircleOutlined, ClockCircleOutlined, UserOutlined, PhoneOutlined, MailOutlined, EnvironmentOutlined, InboxOutlined, CalendarOutlined } from '@ant-design/icons';
import { trackingAPI } from '../utils/api';
import { getStatusColor } from '../constants/jobStatuses';
import { useAuth } from '../contexts/AuthContext';
import { hasPermission } from '../utils/permissions';

const { Title, Text } = Typography;
const { Search } = Input;

const ShipmentTrackingPage = () => {
  const { currentUser } = useAuth();
  const canViewRevenue = hasPermission(currentUser, 'financial:view');
  const [trackingId, setTrackingId] = useState('');
  const [shipment, setShipment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!trackingId.trim()) {
      message.warning('Please enter a job ID');
      return;
    }

    setLoading(true);
    setShipment(null);
    setSearched(true);
    
    try {
      console.log('🔍 Tracking shipment:', trackingId);
      const response = await trackingAPI.track(trackingId);
      
      if (response.success && response.data) {
        console.log('✅ Tracking data received:', response.data);
        setShipment(response.data.job);
        message.success('Job found!');
      } else {
        message.error('Job not found');
      }
    } catch (error) {
      console.error('❌ Tracking error:', error);
      message.error(error.message || 'Failed to find job. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColorLocal = (status) => {
    return getStatusColor(status);
  };

  return (
    <div>
      <Title level={2} style={{ marginBottom: '24px' }}>
        Track Shipment
      </Title>

      {/* Search Section */}
      <Card style={{ marginBottom: '24px', maxWidth: '600px', margin: '0 auto 24px' }}>
        <Row gutter={[8, 8]} align="middle" className="search-row-container">
          <Col xs={24} md="auto" style={{ flex: 'auto' }}>
            <Search
              placeholder="Enter job ID (e.g., SHIP-20251025-VSJO5)"
              value={trackingId}
              onChange={(e) => setTrackingId(e.target.value)}
              onPressEnter={handleSearch}
              size="large"
            />
          </Col>
          <Col xs={24} md="auto">
            <Button 
              type="primary" 
              icon={<SearchOutlined />} 
              size="large"
              loading={loading}
              onClick={handleSearch}
              className="track-button-mobile"
            >
              Track
            </Button>
          </Col>
        </Row>
      </Card>

      {shipment && (
        <>
          {/* Header Card with Tracking ID and Status */}
          <Card 
            style={{ 
              marginBottom: '24px',
              background: '#001529',
              color: 'white',
              border: 'none'
            }}
          >
            <Row gutter={[24, 16]} align="middle">
              <Col xs={24} md={12}>
                <div style={{ textAlign: 'left' }}>
                  <Title level={2} style={{ color: 'white', margin: 0 }}>
                    {shipment.trackingId}
                  </Title>
                  <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: '16px' }}>
                    Track your shipment in real-time
                  </Text>
                </div>
              </Col>
              <Col xs={24} md={12}>
                <div style={{ textAlign: 'right' }}>
                  <Tag 
                    color={getStatusColorLocal(shipment.status)} 
                    style={{ 
                      fontSize: '16px', 
                      padding: '8px 16px',
                      borderRadius: '20px',
                      fontWeight: 'bold'
                    }}
                  >
                    {shipment.status?.replace(/_/g, ' ').toUpperCase()}
                  </Tag>
                </div>
              </Col>
            </Row>
          </Card>

          {/* Main Content Grid */}
          <Row gutter={[24, 24]}>
            {/* Left Column - Timeline */}
            <Col xs={24} lg={12}>
              <Card 
                title={
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ClockCircleOutlined style={{ color: '#1890ff' }} />
                    <span>Shipment Timeline</span>
                  </div>
                }
                style={{ height: '100%' }}
              >
                {shipment.timeline && shipment.timeline.length > 0 ? (
                <Timeline>
                  {shipment.timeline.map((item, index) => (
                    <Timeline.Item 
                      key={index} 
                        color={index === shipment.timeline.length - 1 ? 'green' : 'blue'}
                        dot={index === shipment.timeline.length - 1 ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
                    >
                      <div>
                          <Text strong style={{ fontSize: '16px' }}>
                            {item.status?.replace(/_/g, ' ').toUpperCase()}
                          </Text>
                          {item.location && (
                            <>
                        <br />
                              <Space>
                                <EnvironmentOutlined style={{ color: '#1890ff' }} />
                        <Text type="secondary">{item.location}</Text>
                              </Space>
                            </>
                          )}
                          {item.notes && (
                            <>
                              <br />
                              <Text type="secondary" style={{ fontSize: '14px' }}>
                                {item.notes}
                              </Text>
                            </>
                          )}
                        <br />
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                            {new Date(item.timestamp).toLocaleString()}
                        </Text>
                      </div>
                    </Timeline.Item>
                  ))}
                </Timeline>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px' }}>
                    <ClockCircleOutlined style={{ fontSize: '48px', color: '#d9d9d9' }} />
                    <div style={{ marginTop: '16px' }}>
                      <Text type="secondary">No timeline events yet</Text>
                    </div>
                  </div>
                )}
              </Card>
            </Col>

            {/* Right Column - Details */}
            <Col xs={24} lg={12}>
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                {/* Package Information */}
                <Card 
                  title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <InboxOutlined style={{ color: '#52c41a' }} />
                      <span>Package Details</span>
                    </div>
                  }
                  size="small"
                >
                  <Row gutter={[8, 8]}>
                    <Col span={12}>
                      <div style={{ textAlign: 'center', padding: '8px' }}>
                        <Text type="secondary" style={{ fontSize: '12px' }}>WEIGHT</Text>
                        <br />
                        <Text strong style={{ fontSize: '18px', color: '#1890ff' }}>
                          {shipment.weight ? `${shipment.weight}kg` : 'N/A'}
                        </Text>
                      </div>
                    </Col>
                    {canViewRevenue && (
                    <Col span={12}>
                      <div style={{ textAlign: 'center', padding: '8px' }}>
                        <Text type="secondary" style={{ fontSize: '12px' }}>VALUE</Text>
                        <br />
                        <Text strong style={{ fontSize: '18px', color: '#52c41a' }}>
                          {shipment.value ? `£${shipment.value}` : 'N/A'}
                        </Text>
                      </div>
                    </Col>
                    )}
                    <Col span={12}>
                      <div style={{ textAlign: 'center', padding: '8px' }}>
                        <Text type="secondary" style={{ fontSize: '12px' }}>SERVICE</Text>
                        <br />
                        <Tag color="blue" style={{ fontSize: '12px' }}>
                          {shipment.priority || 'Standard'}
                        </Tag>
                      </div>
                    </Col>
                    <Col span={12}>
                      <div style={{ textAlign: 'center', padding: '8px' }}>
                        <Text type="secondary" style={{ fontSize: '12px' }}>QUANTITY</Text>
                        <br />
                        <Text strong style={{ fontSize: '18px' }}>
                          {shipment.quantity || 1}
                        </Text>
                      </div>
                    </Col>
                  </Row>
                </Card>

                {/* Customer Information */}
                <Card 
                  title={<span className="user-info-title">Customer Information</span>}
                  className="user-info-card"
                  size="small"
                  style={{ 
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    borderRadius: 8,
                    marginBottom: 24
                  }}
                >
                  <div className="user-info-list">
                    <div className="user-info-item">
                      <div className="user-info-label">Name</div>
                      <div className="user-info-value">
                        <UserOutlined style={{ color: '#1890ff', marginRight: '8px' }} />
                        <Text strong>{shipment.customer?.name || 'N/A'}</Text>
                      </div>
                    </div>
                    {shipment.customer?.phone && (
                      <div className="user-info-item">
                        <div className="user-info-label">Phone</div>
                        <div className="user-info-value">
                          <PhoneOutlined style={{ color: '#1890ff', marginRight: '8px' }} />
                          <Text>{shipment.customer.phone}</Text>
                        </div>
                      </div>
                    )}
                    {shipment.customer?.email && (
                      <div className="user-info-item">
                        <div className="user-info-label">Email</div>
                        <div className="user-info-value">
                          <MailOutlined style={{ color: '#1890ff', marginRight: '8px' }} />
                          <Text>{shipment.customer.email}</Text>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>

                {/* Addresses */}
                <Card 
                  title={<span className="user-info-title">Addresses</span>}
                  className="user-info-card"
                  size="small"
                  style={{ 
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    borderRadius: 8,
                    marginBottom: 24
                  }}
                >
                  <div className="user-info-list">
                    <div className="user-info-item">
                      <div className="user-info-label">Collection Address</div>
                      <div className="user-info-value">
                        <EnvironmentOutlined style={{ color: '#1890ff', marginRight: '8px' }} />
                        <Text>{shipment.pickupAddress || 'N/A'}</Text>
                      </div>
                    </div>
                    <div className="user-info-item">
                      <div className="user-info-label">Delivery Address</div>
                      <div className="user-info-value">
                        <EnvironmentOutlined style={{ color: '#1890ff', marginRight: '8px' }} />
                        <Text>{shipment.deliveryAddress || 'N/A'}</Text>
                </div>
                    </div>
                  </div>
                </Card>

                {/* Collection Date */}
                <Card 
                  title={<span className="user-info-title">Collection Date</span>}
                  className="user-info-card"
                  size="small"
                  style={{ 
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    borderRadius: 8,
                    marginBottom: 24
                  }}
                >
                  <div className="user-info-list">
                    <div className="user-info-item">
                      <div className="user-info-label">Date</div>
                      <div className="user-info-value">
                        <CalendarOutlined style={{ color: '#1890ff', marginRight: '8px' }} />
                        <Text strong style={{ fontSize: '16px' }}>
                      {shipment.createdAt ? new Date(shipment.createdAt).toLocaleDateString() : 'N/A'}
                    </Text>
                      </div>
                    </div>
                </div>
              </Card>
              </Space>
            </Col>
          </Row>
        </>
      )}

      {!shipment && !loading && (
        <Card>
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <SearchOutlined style={{ fontSize: '48px', color: '#d9d9d9', marginBottom: '16px' }} />
            <Title level={4} type="secondary">
              {searched ? 'No shipment found for this job ID' : 'Enter a job ID to get started'}
            </Title>
            <Text type="secondary">
              {searched ? 'Please check the job ID and try again' : 'Track your shipment from collection to delivery'}
            </Text>
          </div>
        </Card>
      )}
    </div>
  );
};

export default ShipmentTrackingPage;

