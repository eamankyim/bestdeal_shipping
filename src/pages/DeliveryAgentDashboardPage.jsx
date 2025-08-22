import React, { useState } from 'react';
import { 
  Row, 
  Col, 
  Card, 
  Statistic, 
  Table, 
  Button, 
  Modal, 
  Form, 
  Input, 
  Upload, 
  Typography, 
  Tag, 
  Space,
  message,
  Timeline,
  Drawer,
  Descriptions,
  Divider,
  Avatar
} from 'antd';
import { 
  UserOutlined, 
  CheckCircleOutlined, 
  ClockCircleOutlined, 
  UploadOutlined,
  SignatureOutlined,
  EditOutlined,
  PhoneOutlined,
  EyeOutlined,
  MailOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { TextArea } = Input;

const DeliveryAgentDashboardPage = () => {
  const [deliveryModalVisible, setDeliveryModalVisible] = useState(false);
  const [isDetailsDrawerVisible, setIsDetailsDrawerVisible] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [form] = Form.useForm();

  // Mock data for delivery statistics
  const stats = [
    { title: 'Deliveries Today', value: 12, suffix: '', color: '#1890ff' },
    { title: 'Completed', value: 8, suffix: '', color: '#52c41a' },
    { title: 'Pending', value: 4, suffix: '', color: '#faad14' },
    { title: 'Total Distance', value: 38, suffix: ' km', color: '#722ed1' },
  ];

  // Mock data for assigned deliveries
  const assignedDeliveries = [
    {
      key: '1',
      trackingId: 'CN001234',
      customer: 'John Smith',
      address: '456 Main Road, Accra, Ghana',
      scheduledTime: '09:00 - 11:00',
      status: 'Pending',
      priority: 'High',
      instructions: 'Call customer 15 minutes before arrival',
      phone: '+233 24 123 4567',
      email: 'john.smith@email.com',
      packageType: 'Electronics',
      weight: '2.5 kg',
      value: 450,
      progress: 25,
    },
    {
      key: '2',
      trackingId: 'CN001235',
      customer: 'Sarah Johnson',
      address: '789 High Street, Kumasi, Ghana',
      scheduledTime: '11:00 - 13:00',
      status: 'In Progress',
      priority: 'Medium',
      instructions: 'Customer prefers afternoon delivery',
      phone: '+233 26 234 5678',
      email: 'sarah.johnson@email.com',
      packageType: 'Documents',
      weight: '0.8 kg',
      value: 120,
      progress: 60,
    },
    {
      key: '3',
      trackingId: 'CN001236',
      customer: 'Mike Wilson',
      address: '321 Church Road, Tamale, Ghana',
      scheduledTime: '13:00 - 15:00',
      status: 'Pending',
      priority: 'Low',
      instructions: 'No special instructions',
      phone: '+233 20 345 6789',
      email: 'mike.wilson@email.com',
      packageType: 'Clothing',
      weight: '1.2 kg',
      value: 85,
      progress: 15,
    },
  ];

  // Mock data for recent deliveries
  const recentDeliveries = [
    {
      time: '2 hours ago',
      action: 'Delivery completed for CN001230',
      customer: 'Lisa Brown',
      location: 'Accra Central',
    },
    {
      time: '4 hours ago',
      action: 'Delivery completed for CN001231',
      customer: 'David Lee',
      location: 'Kumasi Market',
    },
    {
      time: '6 hours ago',
      action: 'Delivery completed for CN001232',
      customer: 'Emma Davis',
      location: 'Tamale University',
    },
  ];

  const columns = [
    {
      title: 'Tracking ID',
      dataIndex: 'trackingId',
      key: 'trackingId',
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: 'Customer',
      dataIndex: 'customer',
      key: 'customer',
    },
    {
      title: 'Address',
      dataIndex: 'address',
      key: 'address',
      ellipsis: true,
    },
    {
      title: 'Scheduled Time',
      dataIndex: 'scheduledTime',
      key: 'scheduledTime',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = 'default';
        let icon = null;
        
        switch (status) {
          case 'Completed':
            color = 'success';
            icon = <CheckCircleOutlined />;
            break;
          case 'In Progress':
            color = 'processing';
            icon = <ClockCircleOutlined />;
            break;
          case 'Pending':
            color = 'warning';
            icon = <ClockCircleOutlined />;
            break;
          default:
            color = 'default';
        }
        
        return (
          <Tag color={color} icon={icon}>
            {status}
          </Tag>
        );
      },
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority) => {
        let color = 'default';
        switch (priority) {
          case 'High':
            color = 'error';
            break;
          case 'Medium':
            color = 'warning';
            break;
          case 'Low':
            color = 'default';
            break;
          default:
            color = 'default';
        }
        return <Tag color={color}>{priority}</Tag>;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button 
          size="small"
          icon={<EyeOutlined />}
          onClick={() => handleViewDelivery(record)}
        >
          View
        </Button>
      ),
    },
  ];

  const handleViewDelivery = (delivery) => {
    setSelectedDelivery(delivery);
    setIsDetailsDrawerVisible(true);
  };

  const handleCompleteDelivery = (delivery) => {
    setSelectedDelivery(delivery);
    setDeliveryModalVisible(true);
  };

  const handleDeliverySubmit = async (values) => {
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      message.success('Delivery completed successfully!');
      setDeliveryModalVisible(false);
      form.resetFields();
      setSelectedDelivery(null);
    } catch (error) {
      message.error('Failed to complete delivery. Please try again.');
    }
  };

  return (
    <div>
      <Title level={2} style={{ marginBottom: '24px' }}>
        Delivery Agent Dashboard
      </Title>

      {/* Delivery Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        {stats.map((stat, index) => (
          <Col xs={24} sm={12} lg={6} key={index}>
            <Card>
              <Statistic
                title={stat.title}
                value={stat.value}
                suffix={stat.suffix}
                valueStyle={{ color: stat.color }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* Assigned Deliveries */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col span={24}>
          <Card title="Assigned Deliveries">
            <Table
              columns={columns}
              dataSource={assignedDeliveries}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>

      {/* Recent Deliveries */}
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card title="Recent Deliveries">
            <Timeline>
              {recentDeliveries.map((delivery, index) => (
                <Timeline.Item 
                  key={index} 
                  dot={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                >
                  <div>
                    <Text strong>{delivery.action}</Text>
                    <br />
                    <Text type="secondary">{delivery.customer} - {delivery.location}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {delivery.time}
                    </Text>
                  </div>
                </Timeline.Item>
              ))}
            </Timeline>
          </Card>
        </Col>
      </Row>

      {/* Delivery Completion Modal */}
      <Modal
        title={`Complete Delivery - ${selectedDelivery?.trackingId}`}
        open={deliveryModalVisible}
        onCancel={() => setDeliveryModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleDeliverySubmit}
        >
          <Form.Item
            name="proofOfDelivery"
            label="Proof of Delivery (PoD)"
            rules={[{ required: true, message: 'Please upload proof of delivery' }]}
          >
            <Upload
              listType="picture"
              maxCount={3}
              beforeUpload={() => false}
            >
              <Button icon={<UploadOutlined />}>Upload Photos</Button>
            </Upload>
          </Form.Item>



          <Form.Item
            name="deliveryNotes"
            label="Delivery Notes"
          >
            <TextArea 
              rows={3} 
              placeholder="Any additional notes about the delivery"
            />
          </Form.Item>

          <Form.Item
            name="deliveryTime"
            label="Actual Delivery Time"
            rules={[{ required: true, message: 'Please enter delivery time' }]}
          >
            <Input placeholder="e.g., 14:30" />
          </Form.Item>

          <Form.Item
            name="recipientName"
            label="Recipient Name"
            rules={[{ required: true, message: 'Please enter recipient name' }]}
          >
            <Input placeholder="Enter recipient name" />
          </Form.Item>

          <Form.Item
            name="recipientId"
            label="Recipient ID (Optional)"
          >
            <Input placeholder="e.g., Driver's License, National ID" />
          </Form.Item>

          <Form.Item>
            <div style={{ textAlign: 'right' }}>
              <Space>
                <Button 
                  onClick={() => setDeliveryModalVisible(false)}
                  size="large"
                >
                  Cancel
                </Button>
                <Button 
                  type="primary" 
                  htmlType="submit"
                  size="large"
                >
                  Complete Delivery
                </Button>
              </Space>
            </div>
          </Form.Item>
        </Form>
      </Modal>

      {/* Delivery Details Side Drawer */}
      <Drawer
        title="Delivery Details"
        placement="right"
        onClose={() => setIsDetailsDrawerVisible(false)}
        open={isDetailsDrawerVisible}
        width={800}
        extra={[
          <Button 
            key="complete" 
            type="primary"
            icon={<CheckCircleOutlined />}
            onClick={() => handleCompleteDelivery(selectedDelivery)}
            disabled={selectedDelivery?.status === 'Completed'}
            style={{ marginRight: 8 }}
          >
            Complete Delivery
          </Button>,
          <Button 
            key="call" 
            type="default"
            icon={<PhoneOutlined />}
            onClick={() => {
              // Mock phone call functionality
              message.info(`Calling ${selectedDelivery?.customer} at ${selectedDelivery?.phone}`);
            }}
          >
            Call Customer
          </Button>,
        ]}
      >
        {selectedDelivery && (
          <div>
            {/* Delivery Status Overview */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              <Col span={8}>
                <div style={{ textAlign: 'center' }}>
                  <Title level={3} style={{ marginBottom: '8px' }}>
                    {selectedDelivery.trackingId}
                  </Title>
                  <Tag color={selectedDelivery.status === 'Completed' ? 'success' : selectedDelivery.status === 'In Progress' ? 'processing' : 'warning'} size="large">
                    {selectedDelivery.status}
                  </Tag>
                </div>
              </Col>
              <Col span={8}>
                <div style={{ textAlign: 'center' }}>
                  <Text strong>Progress</Text>
                  <br />
                  <Text style={{ fontSize: '18px', color: '#1890ff' }}>
                    {selectedDelivery.progress}%
                  </Text>
                </div>
              </Col>
              <Col span={8}>
                <div style={{ textAlign: 'center' }}>
                  <Text strong>Priority</Text>
                  <br />
                  <Tag color={selectedDelivery.priority === 'High' ? 'error' : selectedDelivery.priority === 'Medium' ? 'warning' : 'default'} size="large">
                    {selectedDelivery.priority}
                  </Tag>
                </div>
              </Col>
            </Row>
            <Divider />
            {/* Delivery Details */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              <Col span={24}>
                <Card size="small" title="Customer Information">
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="Name">
                      <Space>
                        <UserOutlined />
                        {selectedDelivery.customer}
                      </Space>
                    </Descriptions.Item>
                    <Descriptions.Item label="Email">
                      <Space>
                        <MailOutlined />
                        {selectedDelivery.email}
                      </Space>
                    </Descriptions.Item>
                    <Descriptions.Item label="Phone">
                      <Space>
                        <PhoneOutlined />
                        {selectedDelivery.phone}
                      </Space>
                    </Descriptions.Item>
                    <Descriptions.Item label="Address">
                      <Space>
                        <EnvironmentOutlined />
                        {selectedDelivery.address}
                      </Space>
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              </Col>
            </Row>
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              <Col span={24}>
                <Card size="small" title="Package Details">
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="Type">
                      <Space>
                        <InfoCircleOutlined />
                        {selectedDelivery.packageType}
                      </Space>
                    </Descriptions.Item>
                    <Descriptions.Item label="Weight">
                      {selectedDelivery.weight}
                    </Descriptions.Item>
                    <Descriptions.Item label="Value">
                      £{selectedDelivery.value.toLocaleString()}
                    </Descriptions.Item>
                    <Descriptions.Item label="Priority">
                      <Tag color={selectedDelivery.priority === 'High' ? 'error' : selectedDelivery.priority === 'Medium' ? 'warning' : 'default'}>
                        {selectedDelivery.priority}
                      </Tag>
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              </Col>
            </Row>
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              <Col span={24}>
                <Card size="small" title="Delivery Information">
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="Scheduled Time">
                      <Space>
                        <CalendarOutlined />
                        {selectedDelivery.scheduledTime}
                      </Space>
                    </Descriptions.Item>
                    <Descriptions.Item label="Status">
                      <Tag color={selectedDelivery.status === 'Completed' ? 'success' : selectedDelivery.status === 'In Progress' ? 'processing' : 'warning'}>
                        {selectedDelivery.status}
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Instructions">
                      {selectedDelivery.instructions}
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              </Col>
            </Row>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default DeliveryAgentDashboardPage;
