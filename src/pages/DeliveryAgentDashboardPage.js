import React, { useState } from 'react';
import {
  Card,
  Typography,
  Row,
  Col,
  Table,
  Button,
  Tag,
  Space,
  Statistic,
  Timeline,
  Upload,
  message,
  Modal,
  Form,
  Input,
  Select,
} from 'antd';
import {
  UserOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  MapOutlined,
  CameraOutlined,
  FileTextOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const DeliveryAgentDashboardPage = () => {
  const [deliveryModalVisible, setDeliveryModalVisible] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [deliveryForm] = Form.useForm();

  // Mock data
  const deliveryStats = [
    {
      title: 'Today\'s Deliveries',
      value: 12,
      prefix: <UserOutlined />,
      color: '#1890ff',
    },
    {
      title: 'Completed',
      value: 8,
      prefix: <CheckCircleOutlined />,
      color: '#52c41a',
    },
    {
      title: 'Pending',
      value: 4,
      prefix: <ClockCircleOutlined />,
      color: '#fa8c16',
    },
    {
      title: 'Success Rate',
      value: 95,
      prefix: '%',
      color: '#722ed1',
    },
  ];

  const assignedDeliveries = [
    {
      key: '1',
      trackingId: 'DTD-2024-001',
      customer: 'John Smith',
      address: '456 Ring Road, Accra, Ghana',
      phone: '+233 24 123 4567',
      scheduledTime: '09:00 - 11:00',
      status: 'Assigned',
      priority: 'High',
      packageType: 'Electronics',
      weight: '2.5 kg',
    },
    {
      key: '2',
      trackingId: 'DTD-2024-002',
      customer: 'Sarah Johnson',
      address: '789 High Street, Kumasi, Ghana',
      phone: '+233 24 654 3210',
      scheduledTime: '11:30 - 13:30',
      status: 'In Progress',
      priority: 'Medium',
      packageType: 'Documents',
      weight: '0.5 kg',
    },
  ];

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
      title: 'Address',
      dataIndex: 'address',
      key: 'address',
      render: (address) => (
        <div style={{ maxWidth: 200 }}>
          <Text type="secondary">{address}</Text>
        </div>
      ),
    },
    {
      title: 'Scheduled',
      dataIndex: 'scheduledTime',
      key: 'scheduledTime',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const colors = {
          'Assigned': 'blue',
          'In Progress': 'processing',
          'Completed': 'success',
        };
        return <Tag color={colors[status]}>{status}</Tag>;
      },
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          onClick={() => handleDeliveryComplete(record)}
          disabled={record.status === 'Completed'}
        >
          {record.status === 'In Progress' ? 'Complete' : 'Start'}
        </Button>
      ),
    },
  ];

  const handleDeliveryComplete = (delivery) => {
    setSelectedDelivery(delivery);
    setDeliveryModalVisible(true);
  };

  const handleDeliverySubmit = async (values) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      message.success('Delivery completed successfully!');
      setDeliveryModalVisible(false);
      deliveryForm.resetFields();
    } catch (error) {
      message.error('Failed to complete delivery. Please try again.');
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>Delivery Agent Dashboard</Title>
        <Text type="secondary">
          Manage your delivery assignments and capture proof of delivery
        </Text>
      </div>

      {/* Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {deliveryStats.map((stat, index) => (
          <Col xs={24} sm={12} lg={6} key={index}>
            <Card>
              <Statistic
                title={stat.title}
                value={stat.value}
                prefix={<div style={{ color: stat.color }}>{stat.prefix}</div>}
                valueStyle={{ color: stat.color }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* Main Content */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card title="Assigned Deliveries">
            <Table
              columns={columns}
              dataSource={assignedDeliveries}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="Quick Actions">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button 
                type="default" 
                icon={<MapOutlined />}
                block
              >
                View Today's Route
              </Button>
              <Button 
                type="default" 
                icon={<FileTextOutlined />}
                block
              >
                Download Delivery List
              </Button>
              <Button 
                type="default" 
                icon={<PhoneOutlined />}
                block
              >
                Contact Dispatch
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Delivery Modal */}
      <Modal
        title={`Complete Delivery - ${selectedDelivery?.trackingId}`}
        open={deliveryModalVisible}
        onCancel={() => setDeliveryModalVisible(false)}
        footer={null}
        width={600}
      >
        {selectedDelivery && (
          <div>
            <Card size="small" style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                <Col span={12}>
                  <Text strong>Customer:</Text>
                  <br />
                  <Text>{selectedDelivery.customer}</Text>
                </Col>
                <Col span={12}>
                  <Text strong>Address:</Text>
                  <br />
                  <Text type="secondary">{selectedDelivery.address}</Text>
                </Col>
              </Row>
            </Card>

            <Form
              form={deliveryForm}
              layout="vertical"
              onFinish={handleDeliverySubmit}
            >
              <Form.Item
                name="deliveryProof"
                label="Proof of Delivery"
                rules={[{ required: true, message: 'Please upload delivery proof!' }]}
              >
                <Upload
                  listType="picture-card"
                  maxCount={3}
                  beforeUpload={() => false}
                >
                  <div>
                    <CameraOutlined />
                    <div style={{ marginTop: 8 }}>Upload Photo</div>
                  </div>
                </Upload>
              </Form.Item>

              <Form.Item
                name="signature"
                label="Customer Signature"
                rules={[{ required: true, message: 'Please capture customer signature!' }]}
              >
                <Input placeholder="Customer signature or name" />
              </Form.Item>

              <Form.Item
                name="deliveryNotes"
                label="Delivery Notes"
              >
                <TextArea 
                  rows={3}
                  placeholder="Any notes about the delivery..."
                />
              </Form.Item>

              <Form.Item>
                <Space>
                  <Button 
                    type="primary" 
                    htmlType="submit"
                    icon={<CheckCircleOutlined />}
                  >
                    Complete Delivery
                  </Button>
                  <Button onClick={() => setDeliveryModalVisible(false)}>
                    Cancel
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DeliveryAgentDashboardPage;
