import React, { useEffect, useRef, useState } from 'react';
import {
  Button,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  Upload,
  Space,
  Tag,
  Typography,
  Row,
  Col,
  Card,
  Divider,
  message,
  Radio,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EyeOutlined,
  UploadOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useLocation } from 'react-router-dom';
import ResponsiveTable from '../components/common/ResponsiveTable';
import { canAssignDriver, formatJobStatusLabel, getStatusColor, jobStatusList, stageList } from '../constants/jobStatuses';
import { jobAPI, customerAPI, authAPI } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { canCreateJobs } from '../utils/permissions';
import { filesToUploads } from '../utils/imageUpload';
import DropdownWithOther from '../components/common/DropdownWithOther';
import JobDrawer from '../components/jobs/JobDrawer';

const { Title, Text } = Typography;
const { Option, OptGroup } = Select;
const { TextArea } = Input;

const JobsPage = () => {
  const location = useLocation();
  const { currentUser } = useAuth();
  // A new job can be given to a driver straight away by those who assign drivers
  const canChooseDriver = canAssignDriver({ status: 'pending_collection' });
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [openJobId, setOpenJobId] = useState(null);
  const [customerType, setCustomerType] = useState('existing'); // 'existing' or 'new'
  const [statusFilter, setStatusFilter] = useState(null);
  const [search, setSearch] = useState('');
  const [paging, setPaging] = useState({ page: 1, pageSize: 20, total: 0 });
  const [form] = Form.useForm();

  const [jobs, setJobs] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [loadingDrivers, setLoadingDrivers] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState(null);
  // The latest filters, so a refresh from another tab or the timer uses what is on screen
  const query = useRef({ page: 1, pageSize: 20, search: '', status: null });
  // Only the newest request's answer is shown (an older, slower one must not overwrite it)
  const latestRequest = useRef(0);

  // Create broadcast channel for cross-tab communication
  useEffect(() => {
    const channel = new BroadcastChannel('job_updates');
    
    // Listen for updates from other tabs
    channel.onmessage = (event) => {
      console.log('📡 Received job update from another tab:', event.data);
      if (event.data.type === 'JOB_STATUS_UPDATED' || event.data.type === 'JOB_CREATED' || event.data.type === 'BATCH_CREATED' || event.data.type === 'BATCH_SHIPPED') {
        // Refresh jobs list silently
        fetchJobs(true);
      }
    };
    
    // Cleanup
    return () => {
      channel.close();
    };
  }, []);

  useEffect(() => {
    fetchJobs();
    fetchCustomers();
    if (canChooseDriver) fetchDrivers();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount
  }, []);

  // Auto-refresh jobs every 120 seconds (2 minutes) to reduce API load
  useEffect(() => {
    // Don't auto-refresh if there's an API error (rate limit, etc.)
    if (apiError) return;
    
    const interval = setInterval(() => {
      if (!apiError) { // Double-check error state before refresh
        fetchJobs(true); // Silent refresh
      }
    }, 120000); // 120 seconds (2 minutes)

    return () => clearInterval(interval);
  }, [apiError]);

  // Open modal or job drawer automatically if navigated from a dashboard
  useEffect(() => {
    if (location.state?.openNewJobModal) {
      setIsModalVisible(true);
      window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
    }

    if (location.state?.selectedJobId) {
      setOpenJobId(location.state.selectedJobId);
      window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
    }

    // "See them all" on a dashboard opens the list filtered to that status
    if (location.state?.status) {
      onStatusChange(location.state.status);
      window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- react to navigation only
  }, [location.state]);

  const fetchJobs = async (silent = false, changes = {}) => {
    query.current = { ...query.current, ...changes };
    const { page, pageSize, search: text, status } = query.current;
    const request = latestRequest.current + 1;
    latestRequest.current = request;
    if (!silent) setLoading(true);
    try {
      const response = await jobAPI.getAll({ page, limit: pageSize, search: text.trim(), status });
      if (request !== latestRequest.current) return;
      const rawJobs = Array.isArray(response.data) ? response.data : response.data?.jobs || [];
      setJobs(rawJobs.map((job) => ({
        id: job.id,
        jobId: job.trackingId,
        customer: job.customer?.name || 'N/A',
        pickupAddress: job.pickupAddress,
        deliveryAddress: job.deliveryAddress,
        status: job.status,
        priority: job.priority || 'Standard',
        assignedTo: job.assignedDeliveryAgent?.name || job.assignedDriver?.name || 'Unassigned',
        eta: job.estimatedDelivery ? new Date(job.estimatedDelivery).toLocaleDateString() : 'TBD',
        createdAt: job.createdAt,
      })));
      setPaging({ page, pageSize, total: response.pagination?.total ?? rawJobs.length });
      setApiError(null);
    } catch (error) {
      if (error.message && error.message.includes('Too many requests')) {
        setApiError('rate_limit');
        if (!silent) message.error('Too many requests. Please wait a moment and refresh the page.');
      } else {
        setApiError(null);
        if (!silent) message.error(error.message || 'Failed to load jobs');
      }
    } finally {
      if (request === latestRequest.current) setLoading(false);
    }
  };

  // Typing waits a moment before searching, so each key press is not a request
  const searchTimer = useRef(null);
  const onSearchChange = (value) => {
    setSearch(value);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => fetchJobs(false, { search: value, page: 1 }), 400);
  };
  const onStatusChange = (value) => {
    setStatusFilter(value || null);
    fetchJobs(false, { status: value || null, page: 1 });
  };

  const fetchCustomers = async () => {
    setLoadingCustomers(true);
    try {
      console.log('📥 Fetching customers for dropdown...');
      
      const response = await customerAPI.getAll();
      
      if (response.success && response.data) {
        const rawCustomers = Array.isArray(response.data) ? response.data : response.data.customers || [];
        setCustomers(rawCustomers);
        console.log('✅ Customers loaded for dropdown:', rawCustomers.length);
      }
    } catch (error) {
      console.error('❌ Failed to fetch customers:', error);
      setCustomers([]);
    } finally {
      setLoadingCustomers(false);
    }
  };

  const fetchDrivers = async () => {
    setLoadingDrivers(true);
    try {
      const response = await authAPI.getUsers({ role: 'driver', status: 'active' });
      setDrivers(response.data?.users || []);
    } catch (error) {
      setDrivers([]);
    } finally {
      setLoadingDrivers(false);
    }
  };

  const columns = [
    {
      title: 'Job ID',
      dataIndex: 'jobId',
      key: 'jobId',
      render: (text) => <Text strong>{text}</Text>,
      mobile: true,
    },
    {
      title: 'Customer',
      dataIndex: 'customer',
      key: 'customer',
      mobile: true,
    },
    {
      title: 'Pickup Address',
      dataIndex: 'pickupAddress',
      key: 'pickupAddress',
      ellipsis: true,
      mobile: false,
    },
    {
      title: 'Delivery Address',
      dataIndex: 'deliveryAddress',
      key: 'deliveryAddress',
      ellipsis: true,
      mobile: false,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      mobile: true,
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {formatJobStatusLabel(status)}
        </Tag>
      ),
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      mobile: true,
      render: (priority) => (
        <Tag color={priority === 'Urgent' ? 'red' : priority === 'Express' ? 'orange' : 'blue'}>
          {priority}
        </Tag>
      ),
    },
    {
      title: 'Assigned To',
      dataIndex: 'assignedTo',
      key: 'assignedTo',
      mobile: false,
    },
    {
      title: 'ETA',
      dataIndex: 'eta',
      key: 'eta',
      mobile: false,
    },
    {
      title: 'Actions',
      key: 'actions',
      mobile: true,
      render: (_, record) => (
        <Button 
          size="small"
          icon={<EyeOutlined />}
          onClick={() => setOpenJobId(record.id)}
        >
          View
        </Button>
      ),
    },
  ];

  const handleNewJob = () => {
    setIsModalVisible(true);
    setCustomerType('existing');
    form.resetFields();
  };

  const handleModalOk = async () => {
    setSubmitting(true);
    try {
      const values = await form.validateFields();
      console.log('📝 Form values:', values);
      
      // Prepare job data
      const packageDescription = values.packageDescription?.trim() || '';
      if (!packageDescription) {
        message.error('Please describe the package(s) before creating the job.');
        setSubmitting(false);
        return;
      }

      const jobData = {
        referenceNumber: values.referenceNumber,
        pickupAddress: values.pickupAddress,
        deliveryAddress: values.deliveryAddress,
        pickupDate: values.pickupDate ? values.pickupDate.toISOString() : null,
        estimatedDelivery: values.deliveryDate ? values.deliveryDate.toISOString() : null,
        // Receiver information (delivery address is same as receiver address)
        receiverName: values.receiverName,
        receiverAddress: values.deliveryAddress,
        receiverContact: values.receiverContact,
        parcelDetails: {
          description: packageDescription,
          value: values.estimatedValue != null && values.estimatedValue !== '' ? Number(values.estimatedValue) : undefined,
        },
        specialInstructions: values.specialInstructions,
        priority: values.priority || 'Standard',
        assignedDriverId: values.assignedTo || null,
      };

      // If creating a new customer
      if (customerType === 'new') {
        const newCustomer = {
          name: values.customerName,
          email: values.customerEmail,
          phone: values.customerPhone?.trim() || '',
          address: values.customerAddress,
          customerType: values.customerType || 'Individual',
        };
        
        jobData.newCustomer = newCustomer;
        console.log('📦 Creating job with new customer:', jobData);
      } else {
        // Use existing customer
        jobData.customerId = values.customerId;
        console.log('📦 Creating job with existing customer:', jobData);
      }
      
      if (values.receiverContact?.trim()) {
        jobData.receiverContact = values.receiverContact.trim();
      }

      // Add documents if any
      if (values.documents && values.documents.fileList && values.documents.fileList.length > 0) {
        try {
          message.loading({ content: 'Preparing files...', key: 'compressing', duration: 0 });
          jobData.documents = await filesToUploads(values.documents.fileList);
          message.destroy('compressing');
        } catch (error) {
          message.destroy('compressing');
          message.error(error.message || 'Failed to compress files. Please check file sizes and try again.');
          setSubmitting(false);
          return;
        }
      }

      const response = await jobAPI.create(jobData);

      if (response.success) {
        message.success(`Job created successfully! Tracking ID: ${response.data.job?.trackingId || 'N/A'}`);

        // Broadcast new job to other tabs
        const channel = new BroadcastChannel('job_updates');
        channel.postMessage({
          type: 'JOB_CREATED',
          jobId: response.data.job?.id,
          trackingId: response.data.job?.trackingId,
          timestamp: new Date().toISOString()
        });
        channel.close();

        setIsModalVisible(false);
        form.resetFields();
        setCustomerType('existing');
        
        // Refresh jobs list
        await fetchJobs();
        
        // Refresh customers if new one was created
        if (customerType === 'new') {
          await fetchCustomers();
        }
      } else {
        message.error(response.message || 'Failed to create job');
      }
    } catch (error) {
      if (error.name === 'ValidationError') {
        console.error('Validation failed:', error);
      } else {
        console.error('Failed to create job:', error);
        message.error(error.message || 'Failed to create job');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
    setCustomerType('existing');
  };

  const handleCustomerTypeChange = (e) => {
    setCustomerType(e.target.value);
    // Clear customer-related fields when switching
    form.setFieldsValue({
      customerId: undefined,
      customerName: undefined,
      customerEmail: undefined,
      customerPhone: undefined,
      customerAddress: undefined,
      customerCity: undefined,
      customerCountry: undefined,
    });
  };


  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>Jobs Management</Title>
        <Text type="secondary">Manage all delivery jobs and their statuses</Text>
      </div>

      {/* Actions Bar */}
      <Card style={{ marginBottom: '24px' }}>
        <Row justify="space-between" align="middle" className="search-filter-container" gutter={[16, 16]}>
          <Col xs={24} lg={16}>
            <Space wrap style={{ width: '100%' }} className="mobile-stack">
              <Input
                placeholder="Tracking ID, reference, customer or receiver"
                prefix={<SearchOutlined />}
                allowClear
                value={search}
                onChange={(event) => onSearchChange(event.target.value)}
                style={{ width: '100%', maxWidth: 320 }}
                className="mobile-full-width"
              />
              <Select
                placeholder="Filter by status"
                allowClear
                style={{ width: '100%', maxWidth: 220 }}
                className="mobile-full-width"
                value={statusFilter}
                onChange={onStatusChange}
                virtual={false}
                listHeight={420}
              >
                {/* Grouped by the stages of the journey, as the backend defines them */}
                {[...stageList(), { key: null, label: 'Other' }].map((stage) => {
                  const inStage = jobStatusList().filter((status) => status.stage === stage.key);
                  if (inStage.length === 0) return null;
                  return (
                    <OptGroup key={stage.key || 'other'} label={stage.label}>
                      {inStage.map((status) => (
                        <Option key={status.key} value={status.key}>
                          <Tag color={status.color}>{status.label}</Tag>
                        </Option>
                      ))}
                    </OptGroup>
                  );
                })}
              </Select>
            </Space>
          </Col>
          <Col xs={24} lg={8} style={{ textAlign: 'right' }} className="mobile-full-width">
            {canCreateJobs(currentUser) && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                size="large"
                onClick={handleNewJob}
                className="mobile-full-width"
                style={{ width: 'auto' }}
              >
                New Job
              </Button>
            )}
          </Col>
        </Row>
      </Card>

      {/* Jobs Table */}
      <Card>
        <ResponsiveTable
          columns={columns}
          dataSource={jobs}
          loading={loading}
          rowKey="id"
          locale={{
            emptyText: (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <img
                  src="/no-jobs.png"
                  alt="No jobs"
                  style={{ width: 180, maxWidth: '70%', marginBottom: 12 }}
                />
                <div>{search || statusFilter ? 'No jobs match.' : 'No jobs yet.'}</div>
              </div>
            )
          }}
          pagination={{
            current: paging.page,
            pageSize: paging.pageSize,
            total: paging.total,
            showSizeChanger: true,
            pageSizeOptions: [20, 50, 100],
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} jobs`,
            onChange: (page, pageSize) => fetchJobs(false, { page: pageSize === paging.pageSize ? page : 1, pageSize }),
          }}
          mobileCardView={true}
          mobileBreakpoint={768}
          onCardClick={(record) => setOpenJobId(record.id)}
        />
      </Card>

      {/* New Job Modal */}
      <Modal
        title="Create New Job"
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        confirmLoading={submitting}
        width={window.innerWidth <= 768 ? '95%' : 800}
        okText={submitting ? 'Creating Job...' : 'Create Job'}
        footer={(_, { OkBtn, CancelBtn }) => (
          <>
            <CancelBtn />
            <OkBtn />
          </>
        )}
        cancelText="Cancel"
        styles={{ 
          body: {
            maxHeight: '70vh', 
            overflowY: 'auto',
            paddingRight: '8px'
          }
        }}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            priority: 'Standard',
            fragile: false,
            insurance: false,
            customerCountry: 'United Kingdom',
          }}
        >
          {/* Customer Selection */}
          <Card size="small" title="Customer Information" style={{ marginBottom: 16 }}>
            <Form.Item label="Select Customer Type">
              <Radio.Group onChange={handleCustomerTypeChange} value={customerType}>
                <Radio value="existing">Select Existing Customer</Radio>
                <Radio value="new">Create New Customer</Radio>
              </Radio.Group>
            </Form.Item>

            {customerType === 'existing' ? (
              <Form.Item
                name="customerId"
                label="Select Customer"
                rules={[{ required: true, message: 'Please select a customer!' }]}
              >
                <Select 
                  placeholder="Choose a customer"
                  showSearch
                  loading={loadingCustomers}
                  notFoundContent={loadingCustomers ? "Loading customers..." : "No customers found. Create a customer first."}
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    option.children.props.children[1].toLowerCase().includes(input.toLowerCase())
                  }
                >
                  {customers.map(customer => (
                    <Option key={customer.id} value={customer.id}>
                      <Space>
                        <UserOutlined />
                        {customer.name} - {customer.email || 'No email'}
                      </Space>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            ) : (
              <>
                <Row gutter={16}>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="customerName"
                      label="Full Name"
                      rules={[{ required: true, message: 'Please enter customer name!' }]}
                    >
                      <Input placeholder="Enter full name" prefix={<UserOutlined />} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="customerEmail"
                      label="Email Address (optional)"
                      rules={[
                        { 
                          pattern: /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 
                          message: 'Please enter a valid email! (Double dots allowed)' 
                        }
                      ]}
                    >
                      <Input placeholder="Enter email address" />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={16}>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="customerPhone"
                      label="Phone Number (include country code)"
                      rules={[{ required: true, message: 'Please enter phone with country code (e.g. +44 7700 900123)' }]}
                    >
                      <Input placeholder="e.g. +44 7700 900123" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="customerCity"
                      label="City"
                      rules={[{ required: true, message: 'Please enter city!' }]}
                    >
                      <Input placeholder="Enter city" />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={16}>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="customerCountry"
                      label="Country (optional)"
                    >
                      <Select placeholder="Select country">
                        <Option value="United Kingdom">United Kingdom</Option>
                        <Option value="Ghana">Ghana</Option>
                        <Option value="Nigeria">Nigeria</Option>
                        <Option value="Kenya">Kenya</Option>
                        <Option value="South Africa">South Africa</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="customerType"
                      label="Customer Type"
                      rules={[{ required: true, message: 'Please select customer type!' }]}
                    >
                      <Select placeholder="Select customer type">
                        <Option value="Individual">Individual</Option>
                        <Option value="Company">Company</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>
                <Form.Item
                  name="customerAddress"
                  label="Full Address"
                  rules={[{ required: true, message: 'Please enter address!' }]}
                >
                  <TextArea rows={2} placeholder="Enter full address" />
                </Form.Item>
              </>
            )}
          </Card>

          {/* Job Details */}
          <Card size="small" title="Job Details" style={{ marginBottom: 16 }}>
            <Row gutter={16}>
              <Col xs={24}>
                <Form.Item
                  name="referenceNumber"
                  label="Reference Number *"
                  rules={[{ required: true, message: 'Please enter reference number!' }]}
                  tooltip="This is the key identifier for this job"
                >
                  <Input placeholder="Enter reference number" />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="pickupAddress"
                  label="Pickup Address"
                  rules={[{ required: true, message: 'Please enter pickup address!' }]}
                >
                  <TextArea rows={2} placeholder="Enter pickup address" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="deliveryAddress"
                  label="Delivery Address (same as receiver address)"
                  rules={[{ required: true, message: 'Please enter delivery address!' }]}
                  extra="This address is used for both delivery and receiver."
                >
                  <TextArea rows={2} placeholder="Enter delivery address" />
                </Form.Item>
              </Col>
            </Row>
            
            {/* Receiver Information */}
            <Divider>Receiver Information (Optional)</Divider>
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="receiverName"
                  label="Receiver Name"
                >
                  <Input placeholder="Enter receiver name" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="receiverContact"
                  label="Receiver Phone (include country code)"
                >
                  <Input placeholder="e.g. +44 7700 900123" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="pickupDate"
                  label="Pickup Date"
                  rules={[{ required: true, message: 'Please select pickup date!' }]}
                >
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="deliveryDate"
                  label="Expected Delivery Date"
                  rules={[{ required: true, message: 'Please select delivery date!' }]}
                >
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="priority"
                  label="Priority"
                  initialValue="Standard"
                  rules={[{ required: true, message: 'Please select priority!' }]}
                >
                  <DropdownWithOther
                    options={['Standard', 'Express', 'Urgent']}
                    placeholder="Select priority"
                  />
                </Form.Item>
              </Col>
              {canChooseDriver && (
                <Col xs={24} sm={12}>
                  <Form.Item name="assignedTo" label="Driver" extra="Optional. You can also assign one later.">
                    <Select
                      placeholder="Choose a driver"
                      showSearch
                      allowClear
                      loading={loadingDrivers}
                      notFoundContent={loadingDrivers ? 'Loading drivers...' : 'No drivers yet. Invite one from Settings.'}
                      optionFilterProp="label"
                      options={drivers.map((driver) => ({ value: driver.id, label: driver.name }))}
                    />
                  </Form.Item>
                </Col>
              )}
            </Row>
          </Card>

          {/* Package Details */}
          <Card size="small" title="Package Details" style={{ marginBottom: 16 }}>
            <Form.Item
              name="packageDescription"
              label="Package Details"
              rules={[{ required: true, message: 'Please describe the package(s)!' }]}
            >
              <TextArea rows={3} placeholder="Describe the packages: type, quantity, approximate weight, contents..." />
            </Form.Item>

            <Form.Item name="estimatedValue" label="Estimated Value (£) - Optional">
              <InputNumber
                min={0}
                step={0.01}
                style={{ width: '100%' }}
                placeholder="Enter estimated value (optional)"
              />
            </Form.Item>
          </Card>

          <Form.Item
            name="specialInstructions"
            label="Special Instructions"
          >
            <TextArea rows={2} placeholder="Any special handling instructions" />
          </Form.Item>

          <Form.Item
            name="documents"
            label="Upload Documents (Optional)"
            extra="Up to 5 files, 3MB in total. Photos are compressed automatically."
          >
            <Upload 
              beforeUpload={(file) => {
                // Allow all files - compression will happen during submission
                // Just validate that it's not extremely large (e.g., over 50MB)
                const absoluteMaxSize = 50 * 1024 * 1024; // 50MB absolute max
                if (file.size > absoluteMaxSize) {
                  message.error(`${file.name} is too large (${(file.size / 1024 / 1024).toFixed(2)}MB).`);
                  return Upload.LIST_IGNORE;
                }
                return false; // Prevent auto upload
              }}
              maxCount={5}
            >
              <Button icon={<UploadOutlined />}>Upload Files</Button>
            </Upload>
          </Form.Item>

        </Form>
      </Modal>

      {/* Job Details Drawer */}
      <JobDrawer jobId={openJobId} onClose={() => setOpenJobId(null)} onChanged={() => fetchJobs(true)} />
    </div>
  );
};

export default JobsPage;
