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
  Statistic,
  Drawer,
  Timeline,
  Descriptions,
  Divider,
  Progress,
  Avatar,
  Tabs,
  Dropdown,
  message
} from 'antd';
import { 
  PlusOutlined, 
  SearchOutlined, 
  FilterOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  UploadOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CarOutlined,
  UserOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  DollarOutlined,
  DownOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const JobsPage = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDetailsDrawerVisible, setIsDetailsDrawerVisible] = useState(false);
  const [isStatusUpdateModalVisible, setIsStatusUpdateModalVisible] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [form] = Form.useForm();
  const [statusUpdateForm] = Form.useForm();
  const navigate = useNavigate();

  // Mock data for jobs
  const jobs = [
    {
      key: '1',
      jobId: 'SE001234',
      customer: 'John Smith',
      customerEmail: 'john.smith@email.com',
      customerPhone: '+44 7911 123456',
      pickupAddress: '123 Main St, London',
      deliveryAddress: '456 Oak Ave, Accra, Ghana',
      status: 'In Progress',
      priority: 'High',
      assignedTo: 'Driver A',
      createdAt: '2024-01-20',
      eta: '2024-01-25',
      value: 1500,
      packageType: 'Box',
      weight: '2.5 kg',
      progress: 75,
             timeline: [
         {
           time: '2024-01-20 14:30',
           event: 'Job created',
           location: 'London, UK',
           status: 'completed',
           icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />
         },
         {
           time: '2024-01-21 09:15',
           event: 'Assigned to driver',
           location: 'London',
           status: 'completed',
           icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />
         },
         {
           time: '2024-01-22 16:45',
           event: 'Pickup completed',
           location: 'London',
           status: 'completed',
           icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />
         },
         {
           time: '2024-01-23 08:30',
           event: 'In transit to Ghana',
           location: 'En route',
           status: 'in-progress',
           icon: <CarOutlined style={{ color: '#1890ff' }} />
         },
         {
           time: '2024-01-25 10:00',
           event: 'Expected delivery',
           location: 'Accra, Ghana',
           status: 'pending',
           icon: <ClockCircleOutlined style={{ color: '#faad14' }} />
         }
       ],
       activities: [
         {
           time: '2024-01-20 14:30',
           user: 'John Doe',
           action: 'created the job',
           details: 'Job SE001234 created for John Smith'
         },
         {
           time: '2024-01-21 09:15',
           user: 'Sarah Manager',
           action: 'assigned driver',
           details: 'Assigned to Driver A'
         },
         {
           time: '2024-01-22 16:45',
           user: 'Driver A',
           action: 'updated status',
           details: 'Status changed to "Pickup completed"'
         },
         {
           time: '2024-01-23 08:30',
           user: 'Warehouse Staff',
           action: 'updated status',
           details: 'Status changed to "In transit to Ghana"'
                  }
       ],
       activities: [
         {
           time: '2024-01-19 10:00',
           user: 'John Doe',
           action: 'created the job',
           details: 'Job SE001235 created for Sarah Johnson'
         },
         {
           time: '2024-01-20 14:30',
           user: 'Driver B',
           action: 'updated status',
           details: 'Status changed to "Pickup completed"'
         },
         {
           time: '2024-01-22 16:00',
           user: 'Driver B',
           action: 'updated status',
           details: 'Status changed to "Delivered successfully"'
         }
       ]
     },
     {
       key: '2',
      jobId: 'SE001235',
      customer: 'Sarah Johnson',
      customerEmail: 'sarah.johnson@email.com',
      customerPhone: '+44 7911 234567',
      pickupAddress: '789 Park Rd, Manchester',
      deliveryAddress: '321 Pine St, Kumasi, Ghana',
      status: 'Completed',
      priority: 'Medium',
      assignedTo: 'Driver B',
      createdAt: '2024-01-19',
      eta: '2024-01-24',
      value: 800,
      packageType: 'Document',
      weight: '0.5 kg',
      progress: 100,
      timeline: [
        {
          time: '2024-01-19 10:00',
          event: 'Job created',
          location: 'Manchester, UK',
          status: 'completed',
          icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />
        },
        {
          time: '2024-01-20 14:30',
          event: 'Pickup completed',
          location: 'Manchester',
          status: 'completed',
          icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />
        },
        {
          time: '2024-01-22 16:00',
          event: 'Delivered successfully',
          location: 'Kumasi, Ghana',
          status: 'completed',
          icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />
                 }
       ],
       activities: [
         {
           time: '2024-01-21 11:00',
           user: 'John Doe',
           action: 'created the job',
           details: 'Job SE001236 created for Mike Wilson'
         },
         {
           time: '2024-01-22 09:00',
           user: 'System',
           action: 'status update',
           details: 'Status remains "Pending" - awaiting driver assignment'
         }
       ]
     },
     {
       key: '3',
      jobId: 'SE001236',
      customer: 'Mike Wilson',
      customerEmail: 'mike.wilson@email.com',
      customerPhone: '+44 7911 345678',
      pickupAddress: '456 High St, Birmingham',
      deliveryAddress: '654 Elm St, Tamale, Ghana',
      status: 'Pending',
      priority: 'Low',
      assignedTo: 'Unassigned',
      createdAt: '2024-01-21',
      eta: '2024-01-26',
      value: 1200,
      packageType: 'Parcel',
      weight: '1.8 kg',
      progress: 0,
      timeline: [
        {
          time: '2024-01-21 11:00',
          event: 'Job created',
          location: 'Birmingham, UK',
          status: 'completed',
          icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />
        },
        {
          time: '2024-01-22 09:00',
          event: 'Awaiting driver assignment',
          location: 'Birmingham',
          status: 'pending',
          icon: <ClockCircleOutlined style={{ color: '#faad14' }} />
        }
      ]
    },
    {
      key: '4',
      jobId: 'SE001237',
      customer: 'Lisa Brown',
      customerEmail: 'lisa.brown@email.com',
      customerPhone: '+44 7911 456789',
      pickupAddress: '789 Queen St, Liverpool',
      deliveryAddress: '987 Maple Ave, Cape Coast, Ghana',
      status: 'In Transit',
      priority: 'High',
      assignedTo: 'Driver C',
      createdAt: '2024-01-18',
      eta: '2024-01-23',
      value: 2000,
      packageType: 'Fragile',
      weight: '3.2 kg',
      progress: 60,
      timeline: [
        {
          time: '2024-01-18 08:00',
          event: 'Job created',
          location: 'Liverpool, UK',
          status: 'completed',
          icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />
        },
        {
          time: '2024-01-19 15:30',
          event: 'Pickup completed',
          location: 'Liverpool',
          status: 'completed',
          icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />
        },
        {
          time: '2024-01-20 12:00',
          event: 'In transit to Ghana',
          location: 'En route',
          status: 'in-progress',
          icon: <CarOutlined style={{ color: '#1890ff' }} />
        },
        {
          time: '2024-01-23 10:00',
          event: 'Expected delivery',
          location: 'Cape Coast, Ghana',
          status: 'pending',
          icon: <ClockCircleOutlined style={{ color: '#faad14' }} />
                 }
       ],
       activities: [
         {
           time: '2024-01-18 08:00',
           user: 'John Doe',
           action: 'created the job',
           details: 'Job SE001237 created for Lisa Brown'
         },
         {
           time: '2024-01-19 15:30',
           user: 'Driver C',
           action: 'updated status',
           details: 'Status changed to "Pickup completed"'
         },
         {
           time: '2024-01-20 12:00',
           user: 'Warehouse Staff',
           action: 'updated status',
           details: 'Status changed to "In transit to Ghana"'
         }
       ]
     },
   ];

  // Helper functions for colors
  const getStatusColor = (status) => {
    switch (status) {
      case 'In Progress':
        return 'processing';
      case 'Completed':
        return 'success';
      case 'Pending':
        return 'warning';
      case 'In Transit':
        return 'processing';
      default:
        return 'default';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High':
        return 'error';
      case 'Medium':
        return 'warning';
      case 'Low':
        return 'default';
      default:
        return 'default';
    }
  };

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
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button 
          size="small"
          icon={<EyeOutlined />}
          onClick={() => handleViewJob(record)}
        >
          View
        </Button>
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
    setSelectedJob(job);
    setIsDetailsDrawerVisible(true);
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

  const handleStatusUpdate = () => {
    setIsStatusUpdateModalVisible(true);
    statusUpdateForm.resetFields();
  };

  const handleStatusUpdateOk = async () => {
    try {
      const values = await statusUpdateForm.validateFields();
      console.log('Status update values:', values);
      
      // Here you would typically make an API call to update the job status
      // and add the activity/comment to the timeline
      
      message.success('Job status updated successfully');
      setIsStatusUpdateModalVisible(false);
      statusUpdateForm.resetFields();
      
      // Close the details drawer to refresh the view
      setIsDetailsDrawerVisible(false);
    } catch (error) {
      console.error('Status update validation failed:', error);
    }
  };

  const handleStatusUpdateCancel = () => {
    setIsStatusUpdateModalVisible(false);
    statusUpdateForm.resetFields();
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
            assignedTo: 'Unassigned',
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

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="assignedTo"
                label="Assign To"
                rules={[{ required: true, message: 'Please select a team member!' }]}
              >
                <Select placeholder="Select team member">
                  <Option value="Driver A">Driver A</Option>
                  <Option value="Driver B">Driver B</Option>
                  <Option value="Driver C">Driver C</Option>
                  <Option value="Warehouse Team">Warehouse Team</Option>
                  <Option value="Delivery Agent A">Delivery Agent A</Option>
                  <Option value="Delivery Agent B">Delivery Agent B</Option>
                  <Option value="Unassigned">Unassigned</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="pickupDate"
                label="Pickup Date"
                rules={[{ required: true, message: 'Please select pickup date!' }]}
              >
                <DatePicker style={{ width: '100%' }} />
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

        {/* Status Update Modal */}
        <Modal
          title="Update Job Status"
          visible={isStatusUpdateModalVisible}
          onOk={handleStatusUpdateOk}
          onCancel={handleStatusUpdateCancel}
          width={600}
          okText="Update Status"
          cancelText="Cancel"
        >
          <Form
            form={statusUpdateForm}
            layout="vertical"
            initialValues={{
              status: selectedJob?.status || 'Pending',
            }}
          >
            <Form.Item
              name="status"
              label="New Status"
              rules={[{ required: true, message: 'Please select a new status!' }]}
            >
              <Select>
                <Option value="Pending">Pending</Option>
                <Option value="In Progress">In Progress</Option>
                <Option value="In Transit">In Transit</Option>
                <Option value="Completed">Completed</Option>
                <Option value="Cancelled">Cancelled</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="comment"
              label="Comment"
              rules={[{ required: true, message: 'Please add a comment for this status update!' }]}
            >
              <TextArea 
                rows={4} 
                placeholder="Describe what happened or why the status is being updated..."
              />
            </Form.Item>
          </Form>
        </Modal>

       {/* Job Details Side Drawer */}
       <Drawer
         title="Job Details"
         placement="right"
         onClose={() => setIsDetailsDrawerVisible(false)}
         open={isDetailsDrawerVisible}
         width={800}
         extra={[
           <Dropdown
             key="actions"
             menu={{
               items: [
                 {
                   key: 'edit',
                   label: 'Edit',
                   icon: <EditOutlined />,
                   onClick: () => {
                     setIsDetailsDrawerVisible(false);
                     handleEditJob(selectedJob);
                   },
                 },
                 {
                   key: 'updateStatus',
                   label: 'Update Status',
                   icon: <SettingOutlined />,
                   onClick: handleStatusUpdate,
                 },
               ],
             }}
             placement="bottomRight"
             arrow
           >
             <Button type="primary">
               Actions <DownOutlined />
             </Button>
           </Dropdown>,
         ]}
       >
         {selectedJob && (
           <div>
             {/* Job Status Overview */}
             <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
               <Col span={8}>
                 <div style={{ textAlign: 'center' }}>
                   <Title level={3} style={{ marginBottom: '8px' }}>
                     {selectedJob.jobId}
                   </Title>
                   <Tag color={getStatusColor(selectedJob.status)} size="large">
                     {selectedJob.status}
                   </Tag>
                 </div>
               </Col>
               <Col span={8}>
                 <div style={{ textAlign: 'center' }}>
                   <Text strong>Progress</Text>
                   <br />
                   <Progress 
                     type="circle" 
                     percent={selectedJob.progress} 
                     size={80}
                     strokeColor={selectedJob.progress === 100 ? '#52c41a' : '#1890ff'}
                   />
                 </div>
               </Col>
               <Col span={8}>
                 <div style={{ textAlign: 'center' }}>
                   <Text strong>ETA</Text>
                   <br />
                   <Text style={{ fontSize: '18px', color: '#1890ff' }}>
                     {selectedJob.eta}
                   </Text>
                 </div>
               </Col>
             </Row>

             <Divider />

             {/* Tabs for Timeline, Activities, and Details */}
             <Tabs
               defaultActiveKey="timeline"
               items={[
                 {
                   key: 'timeline',
                   label: 'Timeline',
                   children: (
                     <Card title="Job Timeline" size="small">
                       <Timeline>
                         {selectedJob.timeline.map((item, index) => (
                           <Timeline.Item 
                             key={index} 
                             dot={item.icon}
                             color={item.status === 'completed' ? 'green' : item.status === 'in-progress' ? 'blue' : 'gray'}
                           >
                             <div>
                               <Text strong>{item.event}</Text>
                               <br />
                               <Text type="secondary">{item.location}</Text>
                               <br />
                               <Text type="secondary" style={{ fontSize: '12px' }}>
                                 {item.time}
                               </Text>
                             </div>
                           </Timeline.Item>
                         ))}
                       </Timeline>
                     </Card>
                   ),
                 },
                 {
                   key: 'activities',
                   label: 'Activities',
                   children: (
                     <Card title="User Activities" size="small">
                       <Timeline>
                         {selectedJob.activities.map((activity, index) => (
                           <Timeline.Item 
                             key={index}
                             dot={<UserOutlined style={{ color: '#1890ff' }} />}
                           >
                             <div>
                               <Text strong>{activity.user}</Text>
                               <Text> {activity.action}</Text>
                               <br />
                               <Text type="secondary">{activity.details}</Text>
                               <br />
                               <Text type="secondary" style={{ fontSize: '12px' }}>
                                 {activity.time}
                               </Text>
                             </div>
                           </Timeline.Item>
                         ))}
                       </Timeline>
                     </Card>
                   ),
                 },
                 {
                   key: 'details',
                   label: 'Details',
                   children: (
                     <div>
                                               {/* Job Information */}
                        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                          <Col span={24}>
                            <Card size="small" title="Customer Information">
                              <Descriptions column={1} size="small">
                                <Descriptions.Item label="Name">
                                  <Space>
                                    <UserOutlined />
                                    {selectedJob.customer}
                                  </Space>
                                </Descriptions.Item>
                                <Descriptions.Item label="Email">
                                  {selectedJob.customerEmail}
                                </Descriptions.Item>
                                <Descriptions.Item label="Phone">
                                  {selectedJob.customerPhone}
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
                                  {selectedJob.packageType}
                                </Descriptions.Item>
                                <Descriptions.Item label="Weight">
                                  {selectedJob.weight}
                                </Descriptions.Item>
                                <Descriptions.Item label="Value">
                                  <Space>
                                    <DollarOutlined />
                                    £{selectedJob.value.toLocaleString()}
                                  </Space>
                                </Descriptions.Item>
                                <Descriptions.Item label="Priority">
                                  <Tag color={getPriorityColor(selectedJob.priority)}>
                                    {selectedJob.priority}
                                  </Tag>
                                </Descriptions.Item>
                              </Descriptions>
                            </Card>
                          </Col>
                        </Row>

                       <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                         <Col span={24}>
                           <Card size="small" title="Addresses">
                             <Descriptions column={1} size="small">
                               <Descriptions.Item label="Pickup Address">
                                 <Space>
                                   <EnvironmentOutlined />
                                   {selectedJob.pickupAddress}
                                 </Space>
                               </Descriptions.Item>
                               <Descriptions.Item label="Delivery Address">
                                 <Space>
                                   <EnvironmentOutlined />
                                   {selectedJob.deliveryAddress}
                                 </Space>
                               </Descriptions.Item>
                             </Descriptions>
                           </Card>
                         </Col>
                       </Row>

                       <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                         <Col span={24}>
                           <Card size="small" title="Job Information">
                             <Descriptions column={1} size="small">
                               <Descriptions.Item label="Assigned To">
                                 {selectedJob.assignedTo}
                               </Descriptions.Item>
                               <Descriptions.Item label="Created Date">
                                 {selectedJob.createdAt}
                               </Descriptions.Item>
                               <Descriptions.Item label="Expected Delivery">
                                 {selectedJob.eta}
                               </Descriptions.Item>
                             </Descriptions>
                           </Card>
                         </Col>
                       </Row>
                     </div>
                   ),
                 },
               ]}
             />
           </div>
         )}
       </Drawer>
     </div>
   );
 };

export default JobsPage;
