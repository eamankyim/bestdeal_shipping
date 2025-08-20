import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Card,
  Typography,
  Row,
  Col,
  Timeline,
  Tag,
  Button,
  Space,
  Divider,
  Descriptions,
  Avatar,
  Progress,
  Alert,
  Input,
  Form,
  message,
  Statistic,
} from 'antd';
import {
  SearchOutlined,
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  EnvironmentOutlined,
  PackageOutlined,
  DollarOutlined,
  WeightOutlined,
  CarOutlined,
  ShopOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  FileTextOutlined,
  CopyOutlined,
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;

const ShipmentTrackingPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchForm] = Form.useForm();
  const [trackingData, setTrackingData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Mock shipment data - in real app this would come from API
  const mockShipmentData = {
    'DTD-2024-001': {
      trackingId: 'DTD-2024-001',
      customerName: 'John Smith',
      phone: '+44 7911 123456',
      email: 'john.smith@email.com',
      status: 'In Transit',
      progress: 65,
      origin: 'London, UK',
      destination: 'Accra, Ghana',
      packageType: 'Electronics',
      weight: '2.5 kg',
      value: '£150.00',
      description: 'Laptop and accessories',
      serviceType: 'Standard (7-10 days)',
      collectionType: 'Pickup Service',
      pickupAddress: '123 Oxford Street, London, W1D 1BS',
      deliveryAddress: '456 Ring Road, Accra, Ghana',
      eta: '2024-01-25',
      timeline: [
        {
          time: '2024-01-15 09:30',
          status: 'Booked',
          description: 'Shipment request received and confirmed',
          icon: <CheckCircleOutlined />,
          color: 'green',
        },
        {
          time: '2024-01-16 14:15',
          status: 'Collected',
          description: 'Parcel collected by driver from pickup address',
          icon: <CarOutlined />,
          color: 'blue',
        },
        {
          time: '2024-01-17 10:00',
          status: 'At UK Warehouse',
          description: 'Parcel received and scanned at UK warehouse',
          icon: <ShopOutlined />,
          color: 'orange',
        },
        {
          time: '2024-01-18 16:30',
          status: 'In Transit',
          description: 'Shipment departed UK warehouse, en route to Ghana',
          icon: <CarOutlined />,
          color: 'processing',
        },
        {
          time: '2024-01-20 08:45',
          status: 'Arrived Ghana',
          description: 'Shipment arrived at Ghana airport/port',
          icon: <ShopOutlined />,
          color: 'warning',
        },
        {
          time: '2024-01-21 11:20',
          status: 'At Ghana Warehouse',
          description: 'Parcel received and processed at Ghana warehouse',
          icon: <ShopOutlined />,
          color: 'orange',
        },
        {
          time: '2024-01-22 09:00',
          status: 'Out for Delivery',
          description: 'Assigned to delivery agent for final delivery',
          icon: <CarOutlined />,
          color: 'purple',
        },
      ],
    },
  };

  useEffect(() => {
    if (location.state?.trackingId) {
      searchShipment(location.state.trackingId);
    }
  }, [location.state]);

  const searchShipment = async (trackingId) => {
    setLoading(true);
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const data = mockShipmentData[trackingId];
      if (data) {
        setTrackingData(data);
        message.success('Shipment found!');
      } else {
        message.error('Shipment not found. Please check the tracking ID.');
        setTrackingData(null);
      }
    } catch (error) {
      message.error('Failed to search shipment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onSearch = (values) => {
    if (values.trackingId) {
      searchShipment(values.trackingId);
    }
  };

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

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    message.success('Copied to clipboard!');
  };

  if (!trackingData) {
    return (
      <div>
        <div style={{ marginBottom: 24 }}>
          <Title level={2}>Track Shipment</Title>
          <Text type="secondary">
            Enter your tracking ID to check shipment status
          </Text>
        </div>

        <Card style={{ maxWidth: 600, margin: '0 auto' }}>
          <Form form={searchForm} onFinish={onSearch} layout="vertical">
            <Form.Item
              name="trackingId"
              rules={[{ required: true, message: 'Please enter tracking ID!' }]}
            >
              <Search
                placeholder="Enter tracking ID (e.g., DTD-2024-001)"
                enterButton="Track Shipment"
                size="large"
                loading={loading}
                onSearch={searchForm.submit}
              />
            </Form.Item>
          </Form>

          <Divider>Demo Tracking IDs</Divider>
          <Space direction="vertical" style={{ width: '100%' }}>
            {Object.keys(mockShipmentData).map((trackingId) => (
              <Button
                key={trackingId}
                type="dashed"
                block
                onClick={() => searchShipment(trackingId)}
              >
                {trackingId}
              </Button>
            ))}
          </Space>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>Shipment Tracking</Title>
        <Text type="secondary">
          Tracking ID: <Text strong copyable>{trackingData.trackingId}</Text>
        </Text>
      </div>

      {/* Status Overview */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={8}>
            <div style={{ textAlign: 'center' }}>
              <Tag color={getStatusColor(trackingData.status)} size="large">
                {trackingData.status}
              </Tag>
              <div style={{ marginTop: 8 }}>
                <Text type="secondary">Current Status</Text>
              </div>
            </div>
          </Col>
          <Col xs={24} md={8}>
            <div style={{ textAlign: 'center' }}>
              <Progress
                type="circle"
                percent={trackingData.progress}
                size={80}
                status={trackingData.progress === 100 ? 'success' : 'active'}
              />
              <div style={{ marginTop: 8 }}>
                <Text type="secondary">Progress</Text>
              </div>
            </div>
          </Col>
          <Col xs={24} md={8}>
            <div style={{ textAlign: 'center' }}>
              <Statistic
                title="Estimated Delivery"
                value={trackingData.eta}
                valueStyle={{ color: '#1890ff' }}
              />
            </div>
          </Col>
        </Row>
      </Card>

      <Row gutter={[16, 16]}>
        {/* Timeline */}
        <Col xs={24} lg={16}>
          <Card title="Shipment Timeline">
            <Timeline
              items={trackingData.timeline.map((item, index) => ({
                color: item.color,
                children: (
                  <div>
                    <div style={{ marginBottom: 8 }}>
                      <Text strong>{item.status}</Text>
                      <Text type="secondary" style={{ marginLeft: 16 }}>
                        {item.time}
                      </Text>
                    </div>
                    <Text type="secondary">{item.description}</Text>
                  </div>
                ),
              }))}
            />
          </Card>
        </Col>

        {/* Shipment Details */}
        <Col xs={24} lg={8}>
          <Card title="Shipment Details">
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Customer">
                <Space>
                  <Avatar size="small" icon={<UserOutlined />} />
                  {trackingData.customerName}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="Phone">
                <Space>
                  <PhoneOutlined />
                  {trackingData.phone}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="Email">
                <Space>
                  <MailOutlined />
                  {trackingData.email}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="Package Type">
                <Space>
                  <PackageOutlined />
                  {trackingData.packageType}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="Weight">
                <Space>
                  <WeightOutlined />
                  {trackingData.weight}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="Value">
                <Space>
                  <DollarOutlined />
                  {trackingData.value}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="Service Type">
                {trackingData.serviceType}
              </Descriptions.Item>
            </Descriptions>

            <Divider />

            <div style={{ marginBottom: 16 }}>
              <Text strong>Route Information</Text>
            </div>
            <div style={{ marginBottom: 8 }}>
              <Text type="secondary">From:</Text>
              <br />
              <Text>{trackingData.origin}</Text>
            </div>
            <div style={{ marginBottom: 8 }}>
              <Text type="secondary">To:</Text>
              <br />
              <Text>{trackingData.destination}</Text>
            </div>

            <Divider />

            <div style={{ marginBottom: 16 }}>
              <Text strong>Package Description</Text>
            </div>
            <Text type="secondary">{trackingData.description}</Text>
          </Card>
        </Col>
      </Row>

      {/* Actions */}
      <Card style={{ marginTop: 24 }}>
        <Row gutter={16} justify="center">
          <Col>
            <Button 
              type="primary" 
              icon={<SearchOutlined />}
              onClick={() => {
                setTrackingData(null);
                searchForm.resetFields();
              }}
            >
              Track Another Shipment
            </Button>
          </Col>
          <Col>
            <Button 
              icon={<FileTextOutlined />}
              onClick={() => navigate('/jobs')}
            >
              New Job
            </Button>
          </Col>
          <Col>
            <Button 
              icon={<CopyOutlined />}
              onClick={() => copyToClipboard(trackingData.trackingId)}
            >
              Copy Tracking ID
            </Button>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default ShipmentTrackingPage;
