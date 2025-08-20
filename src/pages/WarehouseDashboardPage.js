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
  DatePicker,
  InputNumber,
} from 'antd';
import {
  ShopOutlined,
  ScanOutlined,
  PackageOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  PlusOutlined,
  FileTextOutlined,
  CarOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const WarehouseDashboardPage = () => {
  const [intakeModalVisible, setIntakeModalVisible] = useState(false);
  const [batchModalVisible, setBatchModalVisible] = useState(false);
  const [intakeForm] = Form.useForm();
  const [batchForm] = Form.useForm();

  // Mock data
  const warehouseStats = [
    {
      title: 'Parcels Received Today',
      value: 45,
      prefix: <PackageOutlined />,
      color: '#1890ff',
    },
    {
      title: 'Pending Processing',
      value: 12,
      prefix: <ClockCircleOutlined />,
      color: '#fa8c16',
    },
    {
      title: 'Batches Created',
      value: 8,
      prefix: <ShopOutlined />,
      color: '#52c41a',
    },
    {
      title: 'Ready for Transit',
      value: 3,
      prefix: <CarOutlined />,
      color: '#722ed1',
    },
  ];

  const recentIntakes = [
    {
      time: '2 minutes ago',
      trackingId: 'DTD-2024-001',
      customer: 'John Smith',
      status: 'Scanned',
      weight: '2.5 kg',
    },
    {
      time: '15 minutes ago',
      trackingId: 'DTD-2024-002',
      customer: 'Sarah Johnson',
      status: 'Processing',
      weight: '0.5 kg',
    },
    {
      time: '1 hour ago',
      trackingId: 'DTD-2024-003',
      customer: 'Mike Wilson',
      status: 'Batched',
      weight: '1.2 kg',
    },
  ];

  const pendingShipments = [
    {
      key: '1',
      trackingId: 'DTD-2024-001',
      customer: 'John Smith',
      weight: '2.5 kg',
      packageType: 'Electronics',
      status: 'Ready for Batching',
      priority: 'High',
    },
    {
      key: '2',
      trackingId: 'DTD-2024-002',
      customer: 'Sarah Johnson',
      weight: '0.5 kg',
      packageType: 'Documents',
      status: 'Ready for Batching',
      priority: 'Medium',
    },
    {
      key: '3',
      trackingId: 'DTD-2024-003',
      customer: 'Mike Wilson',
      weight: '1.2 kg',
      packageType: 'Clothing',
      status: 'Ready for Batching',
      priority: 'Low',
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
      title: 'Weight',
      dataIndex: 'weight',
      key: 'weight',
    },
    {
      title: 'Package Type',
      dataIndex: 'packageType',
      key: 'packageType',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color="blue">{status}</Tag>
      ),
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
        <Button
          type="primary"
          size="small"
          onClick={() => handleCreateBatch(record)}
        >
          Add to Batch
        </Button>
      ),
    },
  ];

  const handleIntakeComplete = async (values) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      message.success('Parcel intake completed successfully!');
      setIntakeModalVisible(false);
      intakeForm.resetFields();
    } catch (error) {
      message.error('Failed to complete intake. Please try again.');
    }
  };

  const handleCreateBatch = (shipment) => {
    setBatchModalVisible(true);
    batchForm.setFieldsValue({
      selectedShipments: [shipment.trackingId],
    });
  };

  const handleBatchComplete = async (values) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      message.success('Shipment batch created successfully!');
      setBatchModalVisible(false);
      batchForm.resetFields();
    } catch (error) {
      message.error('Failed to create batch. Please try again.');
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>Warehouse Dashboard</Title>
        <Text type="secondary">
          Manage parcel intake, processing, and shipment batching
        </Text>
      </div>

      {/* Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {warehouseStats.map((stat, index) => (
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

      {/* Quick Actions */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={24}>
          <Card title="Quick Actions">
            <Space size="middle">
              <Button 
                type="primary" 
                icon={<ScanOutlined />}
                size="large"
                onClick={() => setIntakeModalVisible(true)}
              >
                Scan New Parcel
              </Button>
              <Button 
                icon={<PlusOutlined />}
                size="large"
                onClick={() => setBatchModalVisible(true)}
              >
                Create Shipment Batch
              </Button>
              <Button 
                icon={<FileTextOutlined />}
                size="large"
              >
                View Inventory
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {/* Pending Shipments */}
        <Col xs={24} lg={16}>
          <Card title="Pending Shipments for Batching">
            <Table
              columns={columns}
              dataSource={pendingShipments}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>

        {/* Recent Activity */}
        <Col xs={24} lg={8}>
          <Card title="Recent Intakes">
            <Timeline
              items={recentIntakes.map((intake, index) => ({
                color: 'blue',
                children: (
                  <div>
                    <div style={{ marginBottom: 4 }}>
                      <Text strong>{intake.trackingId}</Text>
                    </div>
                    <div style={{ marginBottom: 4 }}>
                      <Text type="secondary">{intake.customer}</Text>
                    </div>
                    <div style={{ marginBottom: 4 }}>
                      <Text type="secondary">
                        {intake.status} • {intake.weight} • {intake.time}
                      </Text>
                    </div>
                  </div>
                ),
              }))}
            />
          </Card>
        </Col>
      </Row>

      {/* Intake Modal */}
      <Modal
        title="Scan New Parcel"
        open={intakeModalVisible}
        onCancel={() => setIntakeModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={intakeForm}
          layout="vertical"
          onFinish={handleIntakeComplete}
        >
          <Form.Item
            name="trackingId"
            label="Tracking ID"
            rules={[{ required: true, message: 'Please scan or enter tracking ID!' }]}
          >
            <Input 
              prefix={<ScanOutlined />}
              placeholder="Scan barcode or enter manually"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="parcelPhoto"
            label="Parcel Photo"
            rules={[{ required: true, message: 'Please upload parcel photo!' }]}
          >
            <Upload
              listType="picture-card"
              maxCount={3}
              beforeUpload={() => false}
            >
              <div>
                <PackageOutlined />
                <div style={{ marginTop: 8 }}>Upload Photo</div>
              </div>
            </Upload>
          </Form.Item>

          <Form.Item
            name="condition"
            label="Parcel Condition"
            rules={[{ required: true, message: 'Please assess parcel condition!' }]}
          >
            <Select placeholder="Select condition" size="large">
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
              placeholder="Any special notes about the parcel..."
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button 
                type="primary" 
                htmlType="submit"
                icon={<CheckCircleOutlined />}
              >
                Complete Intake
              </Button>
              <Button onClick={() => setIntakeModalVisible(false)}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Batch Modal */}
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
          onFinish={handleBatchComplete}
        >
          <Form.Item
            name="selectedShipments"
            label="Selected Shipments"
            rules={[{ required: true, message: 'Please select shipments!' }]}
          >
            <Select
              mode="multiple"
              placeholder="Select shipments to batch"
              size="large"
            >
              {pendingShipments.map(shipment => (
                <Option key={shipment.trackingId} value={shipment.trackingId}>
                  {shipment.trackingId} - {shipment.customer}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="vessel"
            label="Vessel/Flight Number"
            rules={[{ required: true, message: 'Please enter vessel/flight number!' }]}
          >
            <Input placeholder="Enter vessel or flight number" size="large" />
          </Form.Item>

          <Form.Item
            name="departureDate"
            label="Departure Date"
            rules={[{ required: true, message: 'Please select departure date!' }]}
          >
            <DatePicker style={{ width: '100%' }} size="large" />
          </Form.Item>

          <Form.Item
            name="eta"
            label="Estimated Arrival (Ghana)"
            rules={[{ required: true, message: 'Please select ETA!' }]}
          >
            <DatePicker style={{ width: '100%' }} size="large" />
          </Form.Item>

          <Form.Item
            name="batchNotes"
            label="Batch Notes"
          >
            <TextArea 
              rows={3}
              placeholder="Any special instructions for this batch..."
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button 
                type="primary" 
                htmlType="submit"
                icon={<PlusOutlined />}
              >
                Create Batch
              </Button>
              <Button onClick={() => setBatchModalVisible(false)}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default WarehouseDashboardPage;
