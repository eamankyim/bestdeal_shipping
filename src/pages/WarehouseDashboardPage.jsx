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
  Select, 
  DatePicker, 
  InputNumber, 
  Typography, 
  Tag, 
  Space,
  message,
  Timeline,
  Drawer,
  Descriptions,
  Divider,
  Progress,
  Tabs
} from 'antd';
import { 
  HomeOutlined, 
  ScanOutlined, 
  PlusOutlined, 
  CheckCircleOutlined, 
  ClockCircleOutlined,
  UploadOutlined,
  EyeOutlined,
  UserOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  BoxOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const WarehouseDashboardPage = () => {
  const [intakeModalVisible, setIntakeModalVisible] = useState(false);
  const [batchModalVisible, setBatchModalVisible] = useState(false);
  const [isDetailsDrawerVisible, setIsDetailsDrawerVisible] = useState(false);
  const [selectedParcel, setSelectedParcel] = useState(null);
  const [intakeForm] = Form.useForm();
  const [batchForm] = Form.useForm();

  // Quality Check state
  const [qualityCheckModalVisible, setQualityCheckModalVisible] = useState(false);
  const [qualityCheckForm] = Form.useForm();
  const [selectedParcelForQuality, setSelectedParcelForQuality] = useState(null);
  const [qualityCheckResults, setQualityCheckResults] = useState([]);
  const [qualityCheckLoading, setQualityCheckLoading] = useState(false);

  // Mock data for warehouse statistics
  const stats = [
    { title: 'Parcels Received Today', value: 45, suffix: '', color: '#1890ff' },
    { title: 'Pending Batching', value: 23, suffix: '', color: '#faad14' },
    { title: 'Batches Created', value: 8, suffix: '', color: '#52c41a' },
    { title: 'Total Weight', value: 67, suffix: ' kg', color: '#722ed1' },
    { title: 'Quality Checks', value: qualityCheckResults.length, suffix: '', color: '#13c2c2' },
  ];

  // Mock data for pending shipments
  const pendingShipments = [
    {
      key: '1',
      trackingId: 'CN001234',
      customer: 'John Smith',
      destination: 'Accra, Ghana',
      weight: '2.5 kg',
      dimensions: '30x20x15 cm',
      receivedTime: '09:15',
      priority: 'High',
      status: 'Pending Batching',
    },
    {
      key: '2',
      trackingId: 'CN001235',
      customer: 'Sarah Johnson',
      destination: 'Kumasi, Ghana',
      weight: '1.8 kg',
      dimensions: '25x18x12 cm',
      receivedTime: '10:30',
      priority: 'Medium',
      status: 'Pending Batching',
    },
    {
      key: '3',
      trackingId: 'CN001236',
      customer: 'Mike Wilson',
      destination: 'Tamale, Ghana',
      weight: '3.2 kg',
      dimensions: '35x25x20 cm',
      receivedTime: '11:45',
      priority: 'Low',
      status: 'Pending Batching',
    },
  ];

  // Mock data for recent intake activities
  const recentIntakeActivities = [
    {
      action: 'Parcel Received',
      customer: 'John Smith',
      weight: '2.5 kg',
      time: '2 hours ago'
    },
    {
      action: 'Batch Created',
      destination: 'Accra, Ghana',
      vessel: 'MV Ghana Star',
      time: '4 hours ago'
    },
    {
      action: 'Parcel Received',
      customer: 'Sarah Johnson',
      weight: '1.8 kg',
      time: '6 hours ago'
    }
  ];

  // Quality Check Functions
  const handleQualityCheck = () => {
    setQualityCheckModalVisible(true);
    qualityCheckForm.resetFields();
  };

  const handleQualityCheckSubmit = async (values) => {
    setQualityCheckLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const qualityResult = {
        id: Date.now(),
        trackingId: selectedParcelForQuality?.trackingId || 'N/A',
        customer: selectedParcelForQuality?.customer || 'N/A',
        inspector: 'Warehouse Staff',
        timestamp: new Date().toLocaleString(),
        ...values,
        status: values.overallCondition === 'excellent' ? 'Passed' : 'Failed'
      };
      
      setQualityCheckResults(prev => [qualityResult, ...prev]);
      message.success('Quality check completed successfully!');
      setQualityCheckModalVisible(false);
      qualityCheckForm.resetFields();
      setSelectedParcelForQuality(null);
    } catch (error) {
      message.error('Failed to complete quality check');
    } finally {
      setQualityCheckLoading(false);
    }
  };

  const handleParcelSelectForQuality = (parcel) => {
    setSelectedParcelForQuality(parcel);
    qualityCheckForm.setFieldsValue({
      trackingId: parcel.trackingId,
      customer: parcel.customer,
      weight: parcel.weight,
      dimensions: parcel.dimensions
    });
  };

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
      title: 'Destination',
      dataIndex: 'destination',
      key: 'destination',
    },
    {
      title: 'Weight',
      dataIndex: 'weight',
      key: 'weight',
    },
    {
      title: 'Dimensions',
      dataIndex: 'dimensions',
      key: 'dimensions',
    },
    {
      title: 'Received Time',
      dataIndex: 'receivedTime',
      key: 'receivedTime',
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
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color="warning" icon={<ClockCircleOutlined />}>
          {status}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button 
          size="small"
          icon={<EyeOutlined />}
          onClick={() => handleViewParcel(record)}
        >
          View
        </Button>
      ),
    },
  ];

  const handleIntakeSubmit = async (values) => {
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      message.success('Parcel intake recorded successfully!');
      setIntakeModalVisible(false);
      intakeForm.resetFields();
    } catch (error) {
      message.error('Failed to record parcel intake. Please try again.');
    }
  };

  const handleViewParcel = (parcel) => {
    setSelectedParcel(parcel);
    setIsDetailsDrawerVisible(true);
  };

  const handleBatchSubmit = async (values) => {
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      message.success('Shipment batch created successfully!');
      setBatchModalVisible(false);
      batchForm.resetFields();
    } catch (error) {
      message.error('Failed to create shipment batch. Please try again.');
    }
  };

  return (
    <div>
      <Title level={2} style={{ marginBottom: '24px' }}>
        Warehouse Dashboard
      </Title>

      {/* Warehouse Statistics */}
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

      {/* Quick Actions */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col span={24}>
          <Card title="Quick Actions">
            <Space wrap>
              <Button 
                type="primary" 
                icon={<ScanOutlined />}
                onClick={() => setIntakeModalVisible(true)}
                size="large"
              >
                Scan New Parcel
              </Button>
              <Button 
                icon={<PlusOutlined />}
                onClick={() => setBatchModalVisible(true)}
                size="large"
              >
                Create Shipment Batch
              </Button>
              <Button 
                icon={<UploadOutlined />}
                size="large"
              >
                Upload Manifest
              </Button>
              <Button 
                icon={<CheckCircleOutlined />}
                size="large"
                onClick={handleQualityCheck}
              >
                Quality Check
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Pending Shipments for Batching */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col span={24}>
          <Card title="Pending Shipments for Batching">
            <Table
              columns={columns}
              dataSource={pendingShipments}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>

      {/* Recent Intake Activities */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card title="Recent Intake Activities">
            <Timeline>
              {recentIntakeActivities.map((activity, index) => (
                <Timeline.Item 
                  key={index} 
                  dot={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                >
                  <div>
                    <Text strong>{activity.action}</Text>
                    <br />
                    <Text type="secondary">
                      {activity.customer && `${activity.customer} - ${activity.weight}`}
                      {activity.destination && `${activity.destination} - ${activity.vessel}`}
                    </Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {activity.time}
                    </Text>
                  </div>
                </Timeline.Item>
              ))}
            </Timeline>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Warehouse Status">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text strong>Storage Capacity:</Text>
                <br />
                <Text type="secondary">67 m³ / 100 m³ (67%)</Text>
              </div>
              <div>
                <Text strong>Temperature:</Text>
                <br />
                <Text type="secondary">22°C (Normal)</Text>
              </div>
              <div>
                <Text strong>Humidity:</Text>
                <br />
                <Text type="secondary">45% (Normal)</Text>
              </div>
              <div>
                <Text strong>Security Status:</Text>
                <br />
                <Tag color="success">Secure</Tag>
              </div>
              <div>
                <Text strong>Quality Status:</Text>
                <br />
                {qualityCheckResults.length > 0 ? (
                  <Tag color="success">Active Monitoring</Tag>
                ) : (
                  <Tag color="default">No Checks Yet</Tag>
                )}
              </div>
              <div>
                <Text strong>Last Quality Check:</Text>
                <br />
                <Text type="secondary">
                  {qualityCheckResults.length > 0 
                    ? qualityCheckResults[0].timestamp 
                    : 'Not available'
                  }
                </Text>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Quality Check Results */}
      {qualityCheckResults.length > 0 && (
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          <Col span={24}>
            <Card title="Recent Quality Check Results">
              <Table
                columns={[
                  {
                    title: 'Tracking ID',
                    dataIndex: 'trackingId',
                    key: 'trackingId',
                    render: (id) => <Text strong>{id}</Text>
                  },
                  {
                    title: 'Customer',
                    dataIndex: 'customer',
                    key: 'customer'
                  },
                  {
                    title: 'Overall Condition',
                    dataIndex: 'overallCondition',
                    key: 'overallCondition',
                    render: (condition) => {
                      const colors = {
                        excellent: 'success',
                        good: 'processing',
                        fair: 'warning',
                        poor: 'error'
                      };
                      return <Tag color={colors[condition]}>{condition.toUpperCase()}</Tag>;
                    }
                  },
                  {
                    title: 'Status',
                    dataIndex: 'status',
                    key: 'status',
                    render: (status) => (
                      <Tag color={status === 'Passed' ? 'success' : 'error'}>
                        {status}
                      </Tag>
                    )
                  },
                  {
                    title: 'Inspector',
                    dataIndex: 'inspector',
                    key: 'inspector'
                  },
                  {
                    title: 'Timestamp',
                    dataIndex: 'timestamp',
                    key: 'timestamp',
                    render: (timestamp) => <Text type="secondary">{timestamp}</Text>
                  }
                ]}
                dataSource={qualityCheckResults}
                pagination={false}
                size="small"
                rowKey="id"
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* Parcel Intake Modal */}
      <Modal
        title="Record Parcel Intake"
        open={intakeModalVisible}
        onCancel={() => setIntakeModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={intakeForm}
          layout="vertical"
          onFinish={handleIntakeSubmit}
        >
          <Form.Item
            name="trackingId"
            label="Tracking ID"
            rules={[{ required: true, message: 'Please enter tracking ID' }]}
          >
            <Input placeholder="Scan or enter tracking ID" />
          </Form.Item>

          <Form.Item
            name="customerName"
            label="Customer Name"
            rules={[{ required: true, message: 'Please enter customer name' }]}
          >
            <Input placeholder="Enter customer name" />
          </Form.Item>

          <Form.Item
            name="weight"
            label="Weight (kg)"
            rules={[{ required: true, message: 'Please enter weight' }]}
          >
            <InputNumber 
              min={0.1} 
              max={100} 
              step={0.1} 
              style={{ width: '100%' }}
              placeholder="Enter weight in kg"
            />
          </Form.Item>

          <Form.Item
            name="dimensions"
            label="Dimensions (L x W x H cm)"
          >
            <Input.Group compact>
              <Form.Item name="length" noStyle>
                <InputNumber placeholder="L" style={{ width: '33%' }} />
              </Form.Item>
              <Form.Item name="width" noStyle>
                <InputNumber placeholder="W" style={{ width: '33%' }} />
              </Form.Item>
              <Form.Item name="height" noStyle>
                <InputNumber placeholder="H" style={{ width: '33%' }} />
              </Form.Item>
            </Input.Group>
          </Form.Item>

          <Form.Item
            name="condition"
            label="Parcel Condition"
            rules={[{ required: true, message: 'Please select condition' }]}
          >
            <Select placeholder="Select parcel condition">
              <Option value="excellent">Excellent</Option>
              <Option value="good">Good</Option>
              <Option value="fair">Fair</Option>
              <Option value="damaged">Damaged</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="notes"
            label="Intake Notes"
          >
            <TextArea 
              rows={3} 
              placeholder="Any notes about the parcel condition or special handling"
            />
          </Form.Item>

          <Form.Item>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Space>
                <Button 
                  onClick={() => setIntakeModalVisible(false)}
                  size="large"
                >
                  Cancel
                </Button>
                <Button 
                  type="primary" 
                  htmlType="submit"
                  size="large"
                >
                  Record Intake
                </Button>
              </Space>
            </div>
          </Form.Item>
        </Form>
      </Modal>

      {/* Create Shipment Batch Modal */}
      <Modal
        title="Create Shipment Batch"
        open={batchModalVisible}
        onCancel={() => setBatchModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={batchForm}
          layout="vertical"
          onFinish={handleBatchSubmit}
        >
          <Form.Item
            name="destination"
            label="Destination"
            rules={[{ required: true, message: 'Please select destination' }]}
          >
            <Select placeholder="Select destination">
              <Option value="accra">Accra, Ghana</Option>
              <Option value="kumasi">Kumasi, Ghana</Option>
              <Option value="tamale">Tamale, Ghana</Option>
              <Option value="cape-coast">Cape Coast, Ghana</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="vessel"
            label="Vessel/Flight Number"
            rules={[{ required: true, message: 'Please enter vessel/flight number' }]}
          >
            <Input placeholder="e.g., BA123 or Vessel Name" />
          </Form.Item>

          <Form.Item
            name="departureDate"
            label="Departure Date"
            rules={[{ required: true, message: 'Please select departure date' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="estimatedArrival"
            label="Estimated Arrival"
            rules={[{ required: true, message: 'Please select estimated arrival' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="batchNotes"
            label="Batch Notes"
          >
            <TextArea 
              rows={3} 
              placeholder="Any special instructions for this batch"
            />
          </Form.Item>

          <Form.Item>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Space>
                <Button 
                  onClick={() => setBatchModalVisible(false)}
                  size="large"
                >
                  Cancel
                </Button>
                <Button 
                  type="primary" 
                  htmlType="submit"
                  size="large"
                >
                  Create Batch
                </Button>
              </Space>
            </div>
          </Form.Item>
        </Form>
      </Modal>

      {/* Parcel Details Side Drawer */}
      <Drawer
        title="Parcel Details"
        placement="right"
        onClose={() => setIsDetailsDrawerVisible(false)}
        open={isDetailsDrawerVisible}
        width={800}
      >
        {selectedParcel && (
          <div>
            {/* Parcel Status Overview */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              <Col span={8}>
                <div style={{ textAlign: 'center' }}>
                  <Title level={3} style={{ marginBottom: '8px' }}>
                    {selectedParcel.trackingId}
                  </Title>
                  <Tag color="warning" size="large">
                    {selectedParcel.status}
                  </Tag>
                </div>
              </Col>
              <Col span={8}>
                <div style={{ textAlign: 'center' }}>
                  <Text strong>Priority</Text>
                  <br />
                  <Tag color={selectedParcel.priority === 'High' ? 'error' : selectedParcel.priority === 'Medium' ? 'warning' : 'default'} size="large">
                    {selectedParcel.priority}
                  </Tag>
                </div>
              </Col>
              <Col span={8}>
                <div style={{ textAlign: 'center' }}>
                  <Text strong>Weight</Text>
                  <br />
                  <Text style={{ fontSize: '18px', color: '#1890ff' }}>
                    {selectedParcel.weight}
                  </Text>
                </div>
              </Col>
            </Row>
            <Divider />
            {/* Parcel Details */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              <Col span={24}>
                <Card size="small" title="Parcel Information">
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="Customer">
                      <Space>
                        <UserOutlined />
                        {selectedParcel.customer}
                      </Space>
                    </Descriptions.Item>
                    <Descriptions.Item label="Destination">
                      <Space>
                        <EnvironmentOutlined />
                        {selectedParcel.destination}
                      </Space>
                    </Descriptions.Item>
                    <Descriptions.Item label="Weight">
                      <Space>
                        <InfoCircleOutlined />
                        {selectedParcel.weight}
                      </Space>
                    </Descriptions.Item>
                    <Descriptions.Item label="Dimensions">
                      {selectedParcel.dimensions}
                    </Descriptions.Item>
                    <Descriptions.Item label="Received Time">
                      <Space>
                        <CalendarOutlined />
                        {selectedParcel.receivedTime}
                      </Space>
                    </Descriptions.Item>
                    <Descriptions.Item label="Priority">
                      <Tag color={selectedParcel.priority === 'High' ? 'error' : selectedParcel.priority === 'Medium' ? 'warning' : 'default'}>
                        {selectedParcel.priority}
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Status">
                      <Tag color="warning" icon={<ClockCircleOutlined />}>
                        {selectedParcel.status}
                      </Tag>
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              </Col>
            </Row>
          </div>
        )}
      </Drawer>

      {/* Quality Check Modal */}
      <Modal
        title="Quality Check - Parcel Inspection"
        open={qualityCheckModalVisible}
        onCancel={() => setQualityCheckModalVisible(false)}
        footer={null}
        width={800}
        destroyOnClose
      >
        <Form
          form={qualityCheckForm}
          layout="vertical"
          onFinish={handleQualityCheckSubmit}
        >
          {/* Parcel Selection */}
          <Card size="small" title="Select Parcel for Quality Check" style={{ marginBottom: 16 }}>
            <Form.Item label="Choose Parcel">
              <Select
                placeholder="Select a parcel to inspect"
                onChange={(value) => {
                  const parcel = pendingShipments.find(p => p.trackingId === value);
                  handleParcelSelectForQuality(parcel);
                }}
                style={{ width: '100%' }}
              >
                {pendingShipments.map(parcel => (
                  <Select.Option key={parcel.trackingId} value={parcel.trackingId}>
                    {parcel.trackingId} - {parcel.customer} ({parcel.weight})
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Card>

          {/* Quality Check Form */}
          <Card size="small" title="Quality Inspection Details">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="Tracking ID" name="trackingId">
                  <Input disabled />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Customer" name="customer">
                  <Input disabled />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="Weight" name="weight">
                  <Input disabled />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Dimensions" name="dimensions">
                  <Input disabled />
                </Form.Item>
              </Col>
            </Row>
            
            <Divider />
            
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item 
                  label="Package Condition" 
                  name="packageCondition"
                  rules={[{ required: true, message: 'Please assess package condition' }]}
                >
                  <Select placeholder="Select condition">
                    <Select.Option value="excellent">Excellent - No damage</Select.Option>
                    <Select.Option value="good">Good - Minor wear</Select.Option>
                    <Select.Option value="fair">Fair - Some damage</Select.Option>
                    <Select.Option value="poor">Poor - Significant damage</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item 
                  label="Seal Integrity" 
                  name="sealIntegrity"
                  rules={[{ required: true, message: 'Please check seal integrity' }]}
                >
                  <Select placeholder="Select integrity">
                    <Select.Option value="excellent">Excellent - Fully intact</Select.Option>
                    <Select.Option value="good">Good - Minor wear</Select.Option>
                    <Select.Option value="fair">Fair - Some wear</Select.Option>
                    <Select.Option value="poor">Poor - Compromised</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item 
                  label="Weight Verification" 
                  name="weightVerification"
                  rules={[{ required: true, message: 'Please verify weight' }]}
                >
                  <Select placeholder="Select verification">
                    <Select.Option value="excellent">Excellent - Matches declared</Select.Option>
                    <Select.Option value="good">Good - Within 5% tolerance</Select.Option>
                    <Select.Option value="fair">Fair - Within 10% tolerance</Select.Option>
                    <Select.Option value="poor">Poor - Significant variance</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item 
                  label="Overall Condition" 
                  name="overallCondition"
                  rules={[{ required: true, message: 'Please provide overall assessment' }]}
                >
                  <Select placeholder="Select overall condition">
                    <Select.Option value="excellent">Excellent - Ready for shipment</Select.Option>
                    <Select.Option value="good">Good - Minor issues noted</Select.Option>
                    <Select.Option value="fair">Fair - Requires attention</Select.Option>
                    <Select.Option value="poor">Poor - Rejection recommended</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            
            <Form.Item 
              label="Additional Notes" 
              name="notes"
            >
              <TextArea rows={3} placeholder="Enter any additional observations or issues..." />
            </Form.Item>
            
            <Form.Item>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Space>
                  <Button onClick={() => setQualityCheckModalVisible(false)}>
                    Cancel
                  </Button>
                  <Button 
                    type="primary" 
                    htmlType="submit"
                    loading={qualityCheckLoading}
                    icon={<CheckCircleOutlined />}
                  >
                    Complete Quality Check
                  </Button>
                </Space>
              </div>
            </Form.Item>
          </Card>
        </Form>
      </Modal>
    </div>
  );
};

export default WarehouseDashboardPage;
