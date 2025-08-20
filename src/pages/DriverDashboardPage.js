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
  Avatar,
  Progress,
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
  CarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  MapOutlined,
  CameraOutlined,
  FileTextOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  UserOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const DriverDashboardPage = () => {
  const [selectedJob, setSelectedJob] = useState(null);
  const [collectionModalVisible, setCollectionModalVisible] = useState(false);
  const [collectionForm] = Form.useForm();

  // Mock data - in real app this would come from API
  const driverStats = [
    {
      title: 'Today\'s Collections',
      value: 8,
      prefix: <CarOutlined />,
      color: '#1890ff',
    },
    {
      title: 'Completed',
      value: 5,
      prefix: <CheckCircleOutlined />,
      color: '#52c41a',
    },
    {
      title: 'Pending',
      value: 3,
      prefix: <ClockCircleOutlined />,
      color: '#fa8c16',
    },
    {
      title: 'Efficiency',
      value: 87,
      prefix: '%',
      color: '#722ed1',
    },
  ];

  const assignedJobs = [
    {
      key: '1',
      trackingId: 'DTD-2024-001',
      customer: 'John Smith',
      address: '123 Oxford Street, London, W1D 1BS',
      phone: '+44 7911 123456',
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
      address: '456 High Street, Manchester, M1 1AA',
      phone: '+44 7911 654321',
      scheduledTime: '11:30 - 13:30',
      status: 'In Progress',
      priority: 'Medium',
      packageType: 'Documents',
      weight: '0.5 kg',
    },
    {
      key: '3',
      trackingId: 'DTD-2024-003',
      customer: 'Mike Wilson',
      address: '789 Queen Street, Birmingham, B1 1AA',
      phone: '+44 7911 987654',
      scheduledTime: '14:00 - 16:00',
      status: 'Assigned',
      priority: 'Low',
      packageType: 'Clothing',
      weight: '1.2 kg',
    },
  ];

  const recentCollections = [
    {
      time: '2 hours ago',
      customer: 'Emma Davis',
      trackingId: 'DTD-2024-004',
      status: 'Collected',
      proof: 'Photo uploaded',
    },
    {
      time: '4 hours ago',
      customer: 'David Brown',
      trackingId: 'DTD-2024-005',
      status: 'Collected',
      proof: 'Signature captured',
    },
    {
      time: '6 hours ago',
      customer: 'Lisa Green',
      trackingId: 'DTD-2024-006',
      status: 'Collected',
      proof: 'Photo uploaded',
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
      render: (customer) => (
        <Space>
          <Avatar size="small" icon={<UserOutlined />} />
          {customer}
        </Space>
      ),
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
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority) => {
        const colors = {
          'High': 'red',
          'Medium': 'orange',
          'Low': 'green',
        };
        return <Tag color={colors[priority]}>{priority}</Tag>;
      },
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            size="small"
            onClick={() => handleStartCollection(record)}
            disabled={record.status === 'Completed'}
          >
            {record.status === 'In Progress' ? 'Continue' : 'Start'}
          </Button>
          <Button
            icon={<MapOutlined />}
            size="small"
            onClick={() => handleViewMap(record)}
          >
            Map
          </Button>
        </Space>
      ),
    },
  ];

  const handleStartCollection = (job) => {
    setSelectedJob(job);
    setCollectionModalVisible(true);
  };

  const handleViewMap = (job) => {
    message.info(`Opening map for ${job.customer} at ${job.address}`);
    // In real app, this would open a map with the location
  };

  const handleCollectionComplete = async (values) => {
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      message.success('Collection completed successfully!');
      setCollectionModalVisible(false);
      collectionForm.resetFields();
      
      // Update job status in real app
    } catch (error) {
      message.error('Failed to complete collection. Please try again.');
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>Driver Dashboard</Title>
        <Text type="secondary">
          Manage your collection assignments and track your progress
        </Text>
      </div>

      {/* Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {driverStats.map((stat, index) => (
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
        {/* Assigned Jobs */}
        <Col xs={24} lg={16}>
          <Card 
            title="Assigned Collection Jobs" 
            extra={
              <Button type="primary" icon={<MapOutlined />}>
                View Route Map
              </Button>
            }
          >
            <Table
              columns={columns}
              dataSource={assignedJobs}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>

        {/* Recent Collections & Quick Actions */}
        <Col xs={24} lg={8}>
          <Card title="Recent Collections" style={{ marginBottom: 16 }}>
            <Timeline
              items={recentCollections.map((collection, index) => ({
                color: 'green',
                children: (
                  <div>
                    <div style={{ marginBottom: 4 }}>
                      <Text strong>{collection.customer}</Text>
                    </div>
                    <div style={{ marginBottom: 4 }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {collection.trackingId}
                      </div>
                    <div style={{ marginBottom: 4 }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {collection.proof} • {collection.time}
                      </Text>
                    </div>
                  </div>
                ),
              }))}
            />
          </Card>

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
                Download Route Sheet
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

      {/* Collection Modal */}
      <Modal
        title={`Complete Collection - ${selectedJob?.trackingId}`}
        open={collectionModalVisible}
        onCancel={() => setCollectionModalVisible(false)}
        footer={null}
        width={600}
      >
        {selectedJob && (
          <div>
            <Card size="small" style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                <Col span={12}>
                  <Text strong>Customer:</Text>
                  <br />
                  <Text>{selectedJob.customer}</Text>
                </Col>
                <Col span={12}>
                  <Text strong>Address:</Text>
                  <br />
                  <Text type="secondary">{selectedJob.address}</Text>
                </Col>
              </Row>
              <Row gutter={16} style={{ marginTop: 8 }}>
                <Col span={12}>
                  <Text strong>Package:</Text>
                  <br />
                  <Text>{selectedJob.packageType} ({selectedJob.weight})</Text>
                </Col>
                <Col span={12}>
                  <Text strong>Phone:</Text>
                  <br />
                  <Text copyable>{selectedJob.phone}</Text>
                </Col>
              </Row>
            </Card>

            <Form
              form={collectionForm}
              layout="vertical"
              onFinish={handleCollectionComplete}
            >
              <Form.Item
                name="collectionProof"
                label="Collection Proof"
                rules={[{ required: true, message: 'Please upload collection proof!' }]}
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
                name="notes"
                label="Collection Notes"
              >
                <TextArea 
                  rows={3}
                  placeholder="Any special notes about the collection..."
                />
              </Form.Item>

              <Form.Item
                name="collectionTime"
                label="Collection Time"
                rules={[{ required: true, message: 'Please confirm collection time!' }]}
              >
                <Select placeholder="Select collection time">
                  <Option value="on_time">On Time</Option>
                  <Option value="early">Early</Option>
                  <Option value="late">Late</Option>
                </Select>
              </Form.Item>

              <Form.Item>
                <Space>
                  <Button 
                    type="primary" 
                    htmlType="submit"
                    icon={<CheckCircleOutlined />}
                  >
                    Complete Collection
                  </Button>
                  <Button onClick={() => setCollectionModalVisible(false)}>
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

export default DriverDashboardPage;
