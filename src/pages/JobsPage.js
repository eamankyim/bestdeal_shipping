import React, { useState } from 'react';
import { 
  Table, 
  Button, 
  Modal, 
  Form, 
  Input, 
  Select, 
  DatePicker, 
  InputNumber, 
  Switch, 
  Upload, 
  Space, 
  Tag, 
  Typography,
  Row,
  Col,
  Card,
  Statistic
} from 'antd';
import { 
  PlusOutlined, 
  SearchOutlined, 
  FilterOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  UploadOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const JobsPage = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  // Mock data for jobs
  const jobs = [
    {
      key: '1',
      jobId: 'SE001234',
      customer: 'John Smith',
      pickupAddress: '123 Main St, London',
      deliveryAddress: '456 Oak Ave, Accra, Ghana',
      status: 'In Progress',
      priority: 'High',
      assignedTo: 'Driver A',
      createdAt: '2024-01-20',
      eta: '2024-01-25',
      value: 1500,
    },
    {
      key: '2',
      jobId: 'SE001235',
      customer: 'Sarah Johnson',
      pickupAddress: '789 Park Rd, Manchester',
      deliveryAddress: '321 Pine St, Kumasi, Ghana',
      status: 'Completed',
      priority: 'Medium',
      assignedTo: 'Driver B',
      createdAt: '2024-01-19',
      eta: '2024-01-24',
      value: 800,
    },
    {
      key: '3',
      jobId: 'SE001236',
      customer: 'Mike Wilson',
      pickupAddress: '456 High St, Birmingham',
      deliveryAddress: '654 Elm St, Tamale, Ghana',
      status: 'Pending',
      priority: 'Low',
      assignedTo: 'Unassigned',
      createdAt: '2024-01-21',
      eta: '2024-01-26',
      value: 1200,
    },
    {
      key: '4',
      jobId: 'SE001237',
      customer: 'Lisa Brown',
      pickupAddress: '789 Queen St, Liverpool',
      deliveryAddress: '987 Maple Ave, Cape Coast, Ghana',
      status: 'In Transit',
      priority: 'High',
      assignedTo: 'Driver C',
      createdAt: '2024-01-18',
      eta: '2024-01-23',
      value: 2000,
    },
  ];

  // Job statistics
  const stats = [
    { title: 'Total Jobs', value: 1247, color: '#1890ff' },
    { title: 'In Progress', value: 89, color: '#faad14' },
    { title: 'Completed', value: 1056, color: '#52c41a' },
    { title: 'Pending', value: 102, color: '#f5222d' },
  ];

  const columns = [
    {
      title: 'Job ID',
      dataIndex: 'jobId',
      key: 'jobId',
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: 'Customer',
      dataIndex: 'customer',
      key: 'customer',
    },
    {
      title: 'Pickup Address',
      dataIndex: 'pickupAddress',
      key: 'pickupAddress',
      ellipsis: true,
    },
    {
      title: 'Delivery Address',
      dataIndex: 'deliveryAddress',
      key: 'deliveryAddress',
      ellipsis: true,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = 'default';
        switch (status) {
          case 'In Progress':
            color = 'processing';
            break;
          case 'Completed':
            color = 'success';
            break;
          case 'Pending':
            color = 'warning';
            break;
          case 'In Transit':
            color = 'processing';
            break;
          default:
            color = 'default';
        }
        return <Tag color={color}>{status}</Tag>;
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
      title: 'Assigned To',
      dataIndex: 'assignedTo',
      key: 'assignedTo',
    },
    {
      title: 'ETA',
      dataIndex: 'eta',
      key: 'eta',
    },
    {
      title: 'Value (£)',
      dataIndex: 'value',
      key: 'value',
      render: (value) => `£${value.toLocaleString()}`,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            type="link" 
            icon={<EyeOutlined />}
            onClick={() => handleViewJob(record)}
          >
            View
          </Button>
          <Button 
            type="link" 
            icon={<EditOutlined />}
            onClick={() => handleEditJob(record)}
          >
            Edit
          </Button>
          <Button 
            type="link" 
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteJob(record)}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  const handleNewJob = () => {
    setIsModalVisible(true);
    form.resetFields();
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      console.log('New job values:', values);
      // Here you would typically make an API call to create the job
      setIsModalVisible(false);
      form.resetFields();
      // You could add a success message here
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const handleViewJob = (job) => {
    navigate(`/track-shipment?tracking=${job.jobId}`);
  };

  const handleEditJob = (job) => {
    // Populate form with job data and open modal
    form.setFieldsValue({
      customerName: job.customer,
      pickupAddress: job.pickupAddress,
      deliveryAddress: job.deliveryAddress,
      // Add other fields as needed
    });
    setIsModalVisible(true);
  };

  const handleDeleteJob = (job) => {
    // Add confirmation dialog and delete logic
    console.log('Delete job:', job.jobId);
  };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>Jobs Management</Title>
        <Text type="secondary">Manage all delivery jobs and their statuses</Text>
      </div>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        {stats.map((stat, index) => (
          <Col xs={24} sm={12} lg={6} key={index}>
            <Card>
              <Statistic
                title={stat.title}
                value={stat.value}
                valueStyle={{ color: stat.color }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* Actions Bar */}
      <Card style={{ marginBottom: '24px' }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <Input
                placeholder="Search jobs..."
                prefix={<SearchOutlined />}
                style={{ width: 300 }}
              />
              <Button icon={<FilterOutlined />}>
                Filters
              </Button>
            </Space>
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              size="large"
              onClick={handleNewJob}
            >
              New Job
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Jobs Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={jobs}
          pagination={{
            total: jobs.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} jobs`,
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* New Job Modal */}
      <Modal
        title="Create New Job"
        visible={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        width={800}
        okText="Create Job"
        cancelText="Cancel"
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            priority: 'Medium',
            fragile: false,
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="customerName"
                label="Customer Name"
                rules={[{ required: true, message: 'Please enter customer name!' }]}
              >
                <Input placeholder="Enter customer name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="customerEmail"
                label="Customer Email"
                rules={[
                  { required: true, message: 'Please enter customer email!' },
                  { type: 'email', message: 'Please enter a valid email!' }
                ]}
              >
                <Input placeholder="Enter customer email" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="customerPhone"
                label="Customer Phone"
                rules={[{ required: true, message: 'Please enter customer phone!' }]}
              >
                <Input placeholder="Enter customer phone" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="priority"
                label="Priority"
                rules={[{ required: true, message: 'Please select priority!' }]}
              >
                <Select>
                  <Option value="Low">Low</Option>
                  <Option value="Medium">Medium</Option>
                  <Option value="High">High</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="pickupAddress"
            label="Pickup Address"
            rules={[{ required: true, message: 'Please enter pickup address!' }]}
          >
            <TextArea rows={3} placeholder="Enter pickup address" />
          </Form.Item>

          <Form.Item
            name="deliveryAddress"
            label="Delivery Address"
            rules={[{ required: true, message: 'Please enter delivery address!' }]}
          >
            <TextArea rows={3} placeholder="Enter delivery address" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="packageType"
                label="Package Type"
                rules={[{ required: true, message: 'Please select package type!' }]}
              >
                <Select>
                  <Option value="Document">Document</Option>
                  <Option value="Parcel">Parcel</Option>
                  <Option value="Fragile">Fragile</Option>
                  <Option value="Heavy">Heavy</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="weight"
                label="Weight (kg)"
                rules={[{ required: true, message: 'Please enter weight!' }]}
              >
                <InputNumber
                  min={0.1}
                  max={1000}
                  step={0.1}
                  style={{ width: '100%' }}
                  placeholder="Enter weight"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="value"
                label="Declared Value (£)"
                rules={[{ required: true, message: 'Please enter value!' }]}
              >
                <InputNumber
                  min={0}
                  step={0.01}
                  style={{ width: '100%' }}
                  placeholder="Enter value"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="pickupDate"
                label="Pickup Date"
                rules={[{ required: true, message: 'Please select pickup date!' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="deliveryDate"
                label="Expected Delivery Date"
                rules={[{ required: true, message: 'Please select delivery date!' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="Package Description"
          >
            <TextArea rows={3} placeholder="Describe the package contents" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="fragile"
                label="Fragile Package"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="insurance"
                label="Insurance Required"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="documents"
            label="Upload Documents"
          >
            <Upload>
              <Button icon={<UploadOutlined />}>Upload Files</Button>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default JobsPage;
