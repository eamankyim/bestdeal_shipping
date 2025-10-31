import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Button, 
  Modal, 
  Form, 
  Input, 
  Select, 
  DatePicker, 
  Space, 
  Tag, 
  Typography,
  Row,
  Col,
  Card,
  Statistic,
  Descriptions,
  Divider,
  Avatar,
  message,
  Drawer
} from 'antd';
import { 
  PlusOutlined, 
  SearchOutlined, 
  FilterOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  EnvironmentOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { customerAPI } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import ResponsiveTable from '../components/common/ResponsiveTable';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const CustomersPage = () => {
  const { currentUser } = useAuth();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDetailsModalVisible, setIsDetailsModalVisible] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [stats, setStats] = useState([
    { title: 'Total Customers', value: 0, color: '#1890ff' },
    { title: 'Active Customers', value: 0, color: '#52c41a' },
    { title: 'Individual Customers', value: 0, color: '#52c41a' },
    { title: 'Company Customers', value: 0, color: '#1890ff' },
  ]);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  // Fetch customers on mount
  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      console.log('📥 Fetching customers from backend...');
      
      const response = await customerAPI.getAll();
      
      console.log('✅ Customers fetched:', response);
      
      if (response.success && response.data) {
        const rawCustomers = Array.isArray(response.data) ? response.data : response.data.customers || [];
        console.log('📋 Raw customers:', rawCustomers);
        
        // Transform backend data to match table format
        const transformedCustomers = rawCustomers.map(customer => ({
          id: customer.id,
          customerId: customer.id.substring(0, 8).toUpperCase(),
          name: customer.name,
          email: customer.email || 'N/A',
          phone: customer.phone || 'N/A',
          address: customer.address || 'N/A',
          customerType: customer.customerType,
          status: 'Active', // TODO: Add status field to backend
          registrationDate: new Date(customer.createdAt).toLocaleDateString(),
          lastJob: 'N/A', // TODO: Calculate from jobs
          totalJobs: 0, // TODO: Calculate from jobs
          notes: customer.notes || '',
          totalSpent: 0, // TODO: Calculate from invoices
        }));
        
        console.log('📋 Transformed customers:', transformedCustomers);
        setCustomers(transformedCustomers);
        
        // Calculate statistics
        const total = transformedCustomers.length;
        const individual = transformedCustomers.filter(c => c.customerType === 'Individual').length;
        const company = transformedCustomers.filter(c => c.customerType === 'Company').length;
        
        setStats([
          { title: 'Total Customers', value: total, color: '#1890ff' },
          { title: 'Active Customers', value: total, color: '#52c41a' },
          { title: 'Individual Customers', value: individual, color: '#52c41a' },
          { title: 'Company Customers', value: company, color: '#1890ff' },
        ]);
      }
    } catch (error) {
      console.error('❌ Failed to fetch customers:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response,
        stack: error.stack
      });
      message.error('Failed to load customers');
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Customer ID',
      dataIndex: 'customerId',
      key: 'customerId',
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: 'Customer',
      key: 'customer',
      render: (_, record) => (
        <Space>
          <Avatar icon={<UserOutlined />} />
          <div>
            <div><Text strong>{record.name}</Text></div>
            <div><Text type="secondary">{record.email}</Text></div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: 'City',
      dataIndex: 'city',
      key: 'city',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'Active' ? 'success' : 'default'}>
          {status}
        </Tag>
      ),
    },
    {
      title: 'Customer Type',
      dataIndex: 'customerType',
      key: 'customerType',
      render: (type) => (
        <Tag color={type === 'Company' ? 'blue' : 'green'}>
          {type}
        </Tag>
      ),
    },
         {
       title: 'Total Jobs',
       dataIndex: 'totalJobs',
       key: 'totalJobs',
       render: (value) => <Text strong>{value}</Text>,
     },
         {
       title: 'Actions',
       key: 'actions',
       render: (_, record) => (
         <Button 
           size="small"
           icon={<EyeOutlined />}
           onClick={() => handleViewCustomer(record)}
         >
           View
         </Button>
       ),
     },
  ];

  const handleNewCustomer = () => {
    setIsModalVisible(true);
    form.resetFields();
  };

  const handleModalOk = async () => {
    setSubmitting(true);
    try {
      const values = await form.validateFields();
      console.log('New customer values:', values);
      
      // Call API to create customer
      const response = await customerAPI.create(values);
      
      if (response.success) {
        message.success('Customer created successfully!');
        setIsModalVisible(false);
        form.resetFields();
        
        // Refresh customer list
        await fetchCustomers();
      } else {
        message.error(response.message || 'Failed to create customer');
      }
    } catch (error) {
      if (error.name === 'ValidationError') {
        console.error('Validation failed:', error);
      } else {
        console.error('Failed to create customer:', error);
        message.error(error.message || 'Failed to create customer');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const handleViewCustomer = (customer) => {
    setSelectedCustomer(customer);
    setIsDetailsModalVisible(true);
  };

  const handleEditCustomer = (customer) => {
    form.setFieldsValue({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      city: customer.city,
      country: customer.country,
      customerType: customer.customerType,
    });
    setIsModalVisible(true);
  };

  const handleDeleteCustomer = (customer) => {
    message.info(`Delete customer: ${customer.name}`);
  };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>Customers Management</Title>
        <Text type="secondary">Manage all customer information and details</Text>
      </div>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        {stats.map((stat, index) => (
          <Col xs={12} sm={12} md={6} key={index}>
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
        <Row justify="space-between" align="middle" gutter={[16, 16]} className="search-filter-container">
          <Col xs={24} lg={16}>
            <Space wrap style={{ width: '100%' }} className="mobile-stack">
              <Input
                placeholder="Search customers..."
                prefix={<SearchOutlined />}
                style={{ width: '100%', maxWidth: 300 }}
                className="mobile-full-width"
              />
              <Button icon={<FilterOutlined />} className="mobile-full-width">
                Filters
              </Button>
            </Space>
          </Col>
          <Col xs={24} lg={8} style={{ textAlign: 'right' }} className="mobile-full-width">
            {(currentUser?.role === 'admin' || currentUser?.role === 'customer-service') && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                size="large"
                onClick={handleNewCustomer}
                className="mobile-full-width"
                style={{ width: 'auto', minWidth: '160px' }}
              >
                New Customer
              </Button>
            )}
          </Col>
        </Row>
      </Card>

      {/* Customers Table */}
      <Card>
        <ResponsiveTable
          columns={columns}
          dataSource={customers}
          loading={loading}
          rowKey="id"
          locale={{
            emptyText: 'No customers yet. Click "New Customer" to add your first customer.'
          }}
          pagination={{
            total: customers.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} customers`,
          }}
          scroll={{ x: 1200 }}
          onCardClick={handleViewCustomer}
        />
      </Card>

      {/* New Customer Modal */}
      <Modal
        title="Add New Customer"
        visible={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        confirmLoading={submitting}
        width={800}
        okText={submitting ? "Creating Customer..." : "Create Customer"}
        cancelText="Cancel"
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            customerType: 'Individual',
            country: 'United Kingdom',
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="Full Name"
                rules={[{ required: true, message: 'Please enter customer name!' }]}
              >
                <Input placeholder="Enter full name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="email"
                label="Email Address"
                rules={[
                  { required: true, message: 'Please enter email address!' },
                  { type: 'email', message: 'Please enter a valid email!' }
                ]}
              >
                <Input placeholder="Enter email address" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="phone"
                label="Phone Number"
                rules={[{ required: true, message: 'Please enter phone number!' }]}
              >
                <Input placeholder="Enter phone number" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="customerType"
                label="Customer Type"
                rules={[{ required: true, message: 'Please select customer type!' }]}
              >
                <Select>
                  <Option value="Individual">Individual</Option>
                  <Option value="Company">Company</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="address"
            label="Address"
            rules={[{ required: true, message: 'Please enter address!' }]}
          >
            <TextArea rows={3} placeholder="Enter full address" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="city"
                label="City"
                rules={[{ required: true, message: 'Please enter city!' }]}
              >
                <Input placeholder="Enter city" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="country"
                label="Country"
                rules={[{ required: true, message: 'Please select country!' }]}
              >
                <Select>
                  <Option value="United Kingdom">United Kingdom</Option>
                  <Option value="Ghana">Ghana</Option>
                  <Option value="Nigeria">Nigeria</Option>
                  <Option value="Kenya">Kenya</Option>
                  <Option value="South Africa">South Africa</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="notes"
            label="Additional Notes"
          >
            <TextArea rows={3} placeholder="Any additional notes about the customer" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Customer Details Side Drawer */}
      <Drawer
        title="Customer Details"
        placement="right"
        onClose={() => setIsDetailsModalVisible(false)}
        open={isDetailsModalVisible}
        width={600}
        className="user-details-drawer"
               extra={[
         <Button 
           key="edit" 
           type="primary"
           icon={<EditOutlined />}
           onClick={() => {
             setIsDetailsModalVisible(false);
             handleEditCustomer(selectedCustomer);
           }}
         >
           Edit
         </Button>,
       ]}
      >
        {selectedCustomer && (
          <div>
            {/* Customer Overview - Mobile Optimized */}
            <div className="user-details-header" style={{ textAlign: 'center', marginBottom: 24, padding: '16px 0' }}>
              <Avatar 
                size={64}
                className="user-details-avatar"
                icon={<UserOutlined />}
                style={{
                  marginBottom: 16
                }}
              />
              <Title level={3} className="user-details-name" style={{ margin: '8px 0 8px' }}>
                {selectedCustomer.name}
              </Title>
              <div style={{ marginBottom: 12 }}>
                <Tag 
                  color={selectedCustomer.status === 'Active' ? 'success' : 'error'} 
                  className="user-details-status-tag" 
                  style={{ padding: '4px 12px' }}
                >
                  {selectedCustomer.status.toUpperCase()}
                    </Tag>
                  </div>
                </div>

            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              <Col span={12}>
                <Statistic title="Total Jobs" value={selectedCustomer.totalJobs} />
              </Col>
              <Col span={12}>
                <Statistic 
                  title="Total Spent" 
                  value={`$${(selectedCustomer.totalSpent || 0).toLocaleString()}`} 
                />
              </Col>
            </Row>

            <Divider style={{ margin: '24px 0' }} />

            {/* Contact Information */}
            <div style={{ marginBottom: 24 }}>
              <Card 
                size="small" 
                title={<span className="user-info-title">Contact Information</span>}
                className="user-info-card"
                style={{ 
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  borderRadius: 8,
                  marginBottom: 24
                }}
              >
                <div className="user-info-list">
                  {/* Email */}
                  <div className="user-info-item">
                    <div className="user-info-label">Email</div>
                    <div className="user-info-value">
                      <MailOutlined style={{ color: '#1890ff', marginRight: '8px' }} />
                      <Text>{selectedCustomer.email}</Text>
                    </div>
                  </div>
                  
                  {/* Phone */}
                  <div className="user-info-item">
                    <div className="user-info-label">Phone</div>
                    <div className="user-info-value">
                      <PhoneOutlined style={{ color: '#1890ff', marginRight: '8px' }} />
                      <Text>{selectedCustomer.phone}</Text>
                    </div>
                  </div>
                  
                  {/* Address */}
                  <div className="user-info-item">
                    <div className="user-info-label">Address</div>
                    <div className="user-info-value">
                      <EnvironmentOutlined style={{ color: '#1890ff', marginRight: '8px' }} />
                      <Text>{selectedCustomer.address}</Text>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Account Information */}
            <div style={{ marginBottom: 24 }}>
              <Card 
                size="small" 
                title={<span className="user-info-title">Account Information</span>}
                className="user-info-card"
                style={{ 
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  borderRadius: 8
                }}
              >
                <div className="user-info-list">
                  {/* Customer ID */}
                  <div className="user-info-item">
                    <div className="user-info-label">Customer ID</div>
                    <div className="user-info-value">
                      <Text>{selectedCustomer.customerId}</Text>
                    </div>
                  </div>
                  
                  {/* Customer Type */}
                  <div className="user-info-item">
                    <div className="user-info-label">Customer Type</div>
                    <div className="user-info-value">
                <Tag color={selectedCustomer.customerType === 'Company' ? 'blue' : 'green'}>
                  {selectedCustomer.customerType}
                </Tag>
                    </div>
                  </div>
                  
                  {/* Registration Date */}
                  <div className="user-info-item">
                    <div className="user-info-label">Registration Date</div>
                    <div className="user-info-value">
                      <Text>{selectedCustomer.registrationDate}</Text>
                    </div>
                  </div>
                  
                  {/* Last Job */}
                  <div className="user-info-item">
                    <div className="user-info-label">Last Job</div>
                    <div className="user-info-value">
                      <Text>{selectedCustomer.lastJob}</Text>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default CustomersPage;
