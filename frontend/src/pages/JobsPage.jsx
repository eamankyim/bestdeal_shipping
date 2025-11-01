import React, { useState, useEffect } from 'react';
import { 
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
  Menu,
  message,
  Radio,
  Image,
  Spin,
  Tooltip
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
  MoreOutlined,
  CarOutlined,
  UserOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  DollarOutlined,
  DownOutlined,
  SettingOutlined,
  MailOutlined,
  PhoneOutlined,
  HomeOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import ResponsiveTable from '../components/common/ResponsiveTable';
import { JOB_STATUSES, STATUS_GROUPS, getStatusColor } from '../constants/jobStatuses';
import { jobAPI, customerAPI, authAPI } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { hasPermission } from '../utils/permissions';
import { compressFiles } from '../utils/fileCompression';

const { Title, Text } = Typography;
const { Option } = Select;
const { OptGroup } = Select;
const { TextArea } = Input;

// Text File Viewer Component
const TextFileViewer = ({ documentUrl, fileName, fileExtension }) => {
  const [textContent, setTextContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadTextContent = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(documentUrl);
        if (response.ok) {
          const text = await response.text();
          setTextContent(text);
        } else {
          setError('Failed to load text content');
        }
      } catch (err) {
        console.error('Error loading text file:', err);
        setError('Failed to load text content');
      } finally {
        setLoading(false);
      }
    };

    if (documentUrl) {
      loadTextContent();
    }
  }, [documentUrl]);

  if (loading) {
    return (
      <div style={{ 
        height: '100%', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center' 
      }}>
        <Spin size="large" />
        <Text style={{ marginLeft: 16 }}>Loading text content...</Text>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        height: '100%', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center' 
      }}>
        <Text type="danger">{error}</Text>
      </div>
    );
  }

  return (
    <div style={{ 
      height: '100%', 
      padding: '16px',
      backgroundColor: '#f5f5f5',
      overflow: 'auto'
    }}>
      <pre style={{ 
        margin: 0, 
        fontSize: '14px',
        fontFamily: 'monospace',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        backgroundColor: 'white',
        padding: '16px',
        borderRadius: '4px',
        border: '1px solid #d9d9d9'
      }}>
        {textContent}
      </pre>
    </div>
  );
};

const JobsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const canViewRevenue = hasPermission(currentUser, 'financial:view');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDetailsDrawerVisible, setIsDetailsDrawerVisible] = useState(false);
  const [isStatusUpdateModalVisible, setIsStatusUpdateModalVisible] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [customerType, setCustomerType] = useState('existing'); // 'existing' or 'new'
  const [statusFilter, setStatusFilter] = useState(null); // Status filter
  const [form] = Form.useForm();
  const [statusUpdateForm] = Form.useForm();

  const [jobs, setJobs] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [loadingTeamMembers, setLoadingTeamMembers] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [stats, setStats] = useState([
    { title: 'Total Jobs', value: 0, color: '#1890ff' },
    { title: 'In Progress', value: 0, color: '#faad14' },
    { title: 'Completed', value: 0, color: '#52c41a' },
    { title: 'Pending', value: 0, color: '#f5222d' },
  ]);

  // Document viewer modal state
  const [documentModalVisible, setDocumentModalVisible] = useState(false);
  const [currentDocument, setCurrentDocument] = useState(null);
  const [documentLoading, setDocumentLoading] = useState(false);
  const [documentUrl, setDocumentUrl] = useState(null);

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

  // Fetch jobs, customers, and team members on mount
  useEffect(() => {
    fetchJobs();
    fetchCustomers();
    fetchTeamMembers();
  }, []);

  // Auto-refresh jobs every 120 seconds (2 minutes) to reduce API load
  useEffect(() => {
    // Don't auto-refresh if there's an API error (rate limit, etc.)
    if (apiError) return;
    
    const interval = setInterval(() => {
      if (!apiError) { // Double-check error state before refresh
        console.log('🔄 Auto-refreshing jobs...');
        fetchJobs(true); // Silent refresh
      }
    }, 120000); // 120 seconds (2 minutes)

    return () => clearInterval(interval);
  }, [apiError]);

  // Open modal automatically if navigated from dashboard with state
  useEffect(() => {
    if (location.state?.openNewJobModal) {
      console.log('🚀 Opening New Job modal from dashboard');
      setIsModalVisible(true);
      // Clear the state so modal doesn't reopen on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const fetchJobs = async (silent = false) => {
    if (!silent) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    
    try {
      console.log(silent ? '🔄 Silently fetching jobs...' : '📥 Fetching jobs from backend...');
      
      const response = await jobAPI.getAll();
      
      console.log('✅ Jobs fetched:', response);
      
      if (response.success && response.data) {
        const rawJobs = Array.isArray(response.data) ? response.data : response.data.jobs || [];
        console.log('📋 Raw jobs:', rawJobs);
        
        // Transform backend data to match table format
        const transformedJobs = rawJobs.map(job => ({
          id: job.id,
          jobId: job.trackingId,
          customer: job.customer?.name || 'N/A',
          customerEmail: job.customer?.email,
          pickupAddress: job.pickupAddress,
          deliveryAddress: job.deliveryAddress,
          status: job.status,
          priority: job.priority || 'Standard',
          assignedTo: job.assignedDriver?.name || 'Unassigned',
          eta: job.estimatedDelivery ? new Date(job.estimatedDelivery).toLocaleDateString() : 'TBD',
          pickupDate: job.pickupDate ? new Date(job.pickupDate).toLocaleDateString() : 'N/A',
          createdAt: job.createdAt,
        }));
        
        console.log('📋 Transformed jobs:', transformedJobs);
        setJobs(transformedJobs);
        
        // Calculate statistics
        const total = transformedJobs.length;
        const pending = transformedJobs.filter(j => j.status === 'pending').length;
        const inProgress = transformedJobs.filter(j => 
          ['assigned', 'collected', 'in_transit', 'arrived_at_warehouse', 'out_for_delivery'].includes(j.status)
        ).length;
        const completed = transformedJobs.filter(j => j.status === 'delivered').length;
        
        setStats([
          { title: 'Total Jobs', value: total, color: '#1890ff' },
          { title: 'In Progress', value: inProgress, color: '#faad14' },
          { title: 'Completed', value: completed, color: '#52c41a' },
          { title: 'Pending', value: pending, color: '#f5222d' },
        ]);
        // Clear API error on successful fetch
        setApiError(null);
      }
    } catch (error) {
      console.error('❌ Failed to fetch jobs:', error);
      
      // Check if it's a rate limit error
      if (error.message && error.message.includes('Too many requests')) {
        setApiError('rate_limit');
        if (!silent) {
          message.error('Too many requests. Please wait a moment and refresh the page.');
        }
      } else {
        setApiError(null); // Clear error for non-rate-limit issues
        if (!silent) {
          message.error('Failed to load jobs');
        }
      }
      setJobs([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
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

  const fetchTeamMembers = async () => {
    setLoadingTeamMembers(true);
    try {
      console.log('📥 Fetching team members for assignment dropdown...');
      
      const response = await authAPI.getUsers();
      
      if (response.success && response.data) {
        const rawUsers = Array.isArray(response.data) ? response.data : response.data.users || [];
        // Filter for roles that can be assigned to jobs (driver, delivery-agent, warehouse)
        const assignableUsers = rawUsers.filter(user => 
          ['driver', 'delivery-agent', 'warehouse', 'admin'].includes(user.role)
        );
        setTeamMembers(assignableUsers);
        console.log('✅ Team members loaded for dropdown:', assignableUsers.length);
      }
    } catch (error) {
      console.error('❌ Failed to fetch team members:', error);
      setTeamMembers([]);
    } finally {
      setLoadingTeamMembers(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Urgent':
        return 'error';
      case 'Express':
        return 'warning';
      case 'Standard':
        return 'default';
      default:
        return 'default';
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
        <Tag color={
          ['delivered', 'arrived_at_warehouse'].includes(status) ? 'green' :
          ['in_transit', 'collected', 'out_for_delivery'].includes(status) ? 'blue' :
          ['assigned', 'batched'].includes(status) ? 'orange' :
          status === 'cancelled' ? 'red' :
          'default'
        }>
          {status?.replace(/_/g, ' ').toUpperCase()}
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
          onClick={() => handleViewJob(record)}
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
      const jobData = {
        pickupAddress: values.pickupAddress,
        deliveryAddress: values.deliveryAddress,
        pickupDate: values.pickupDate ? values.pickupDate.toISOString() : null,
        parcelDetails: {
          description: values.description,
          weight: values.weight,
          dimensions: {
            length: values.length,
            width: values.width,
            height: values.height,
          },
          quantity: values.quantity || 1,
          value: values.value,
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
          phone: values.customerPhone,
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
      
      // Add documents if any
      if (values.documents && values.documents.fileList && values.documents.fileList.length > 0) {
        try {
          // Extract original file objects
          const originalFiles = values.documents.fileList.map(file => file.originFileObj || file);
          
          // Show loading message for compression
          message.loading({ content: 'Compressing files...', key: 'compressing', duration: 0 });
          
          // Compress all files to 5MB maximum each
          const compressedFiles = await compressFiles(originalFiles, 5);
          
          // Validate total file size (25MB max total after compression)
          const maxTotalSize = 25 * 1024 * 1024; // 25MB
          const totalSize = compressedFiles.reduce((sum, file) => sum + file.size, 0);
          
          if (totalSize > maxTotalSize) {
            message.destroy('compressing');
            message.error(`Total file size after compression (${(totalSize / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size of 25MB. Please upload fewer files.`);
            setSubmitting(false);
            return;
          }
          
          message.destroy('compressing');
          message.success({ content: `Compressed ${compressedFiles.length} file(s) successfully`, key: 'compressing', duration: 2 });
          
          // Convert compressed files to base64 for storage in database
          const documentPromises = compressedFiles.map(file => {
            return new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => {
                resolve({
                  fileName: file.name,
                  fileSize: file.size,
                  mimeType: file.type,
                  fileData: reader.result, // Base64 string
                });
              };
              reader.onerror = reject;
              reader.readAsDataURL(file);
            });
          });
          
          jobData.documents = await Promise.all(documentPromises);
          console.log('📎 Documents to upload:', jobData.documents.length, 'files');
        } catch (error) {
          message.destroy('compressing');
          message.error(error.message || 'Failed to compress files. Please check file sizes and try again.');
          setSubmitting(false);
          return;
        }
      }

      // Call API to create job
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


  const handleViewJob = async (job) => {
    try {
      console.log('🔍 Viewing job details:', job.id);
      
      // Fetch full job details from backend
      const response = await jobAPI.getById(job.id);
      
      if (response.success && response.data) {
        console.log('✅ Job details fetched:', response.data);
        setSelectedJob(response.data.job);
        setIsDetailsDrawerVisible(true);
      } else {
        message.error('Failed to load job details');
      }
    } catch (error) {
      console.error('❌ Failed to fetch job details:', error);
      message.error(error.message || 'Failed to load job details');
    }
  };

  // Document viewer handler
  const handleViewDocument = async (document) => {
    try {
      setDocumentLoading(true);
      setCurrentDocument(document);
      setDocumentModalVisible(true);
      
      console.log('📄 Loading document:', document.fileName);
      
      // Fetch document from backend
      const token = localStorage.getItem('shipease_token');
      const apiUrl = `${process.env.REACT_APP_API_URL}${process.env.REACT_APP_API_BASE_PATH}/jobs/documents/${document.id}`;
      
      console.log('📄 Fetching document from:', apiUrl);
      
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const contentType = response.headers.get('content-type') || document.mimeType || 'application/octet-stream';
        console.log('📄 Document Content-Type:', contentType);
        console.log('📄 Document MIME type from DB:', document.mimeType);
        
        const blob = await response.blob();
        console.log('📄 Blob created:', { type: blob.type, size: blob.size });
        
        // Ensure blob has correct MIME type (in case response header was wrong)
        if (blob.type === 'application/octet-stream' && contentType !== 'application/octet-stream') {
          // Recreate blob with correct MIME type
          const blobWithType = new Blob([blob], { type: contentType });
          const url = window.URL.createObjectURL(blobWithType);
          setDocumentUrl(url);
          console.log('✅ Document loaded with corrected MIME type:', contentType);
        } else {
          const url = window.URL.createObjectURL(blob);
          setDocumentUrl(url);
          console.log('✅ Document loaded successfully');
        }
      } else {
        const errorText = await response.text();
        console.error('❌ Failed to load document:', response.status, errorText);
        message.error(`Failed to load document: ${response.status}`);
        setDocumentModalVisible(false);
      }
    } catch (error) {
      console.error('❌ Error loading document:', error);
      message.error('Failed to load document');
      setDocumentModalVisible(false);
    } finally {
      setDocumentLoading(false);
    }
  };

  // Close document modal and cleanup
  const handleCloseDocumentModal = () => {
    setDocumentModalVisible(false);
    setCurrentDocument(null);
    if (documentUrl) {
      window.URL.revokeObjectURL(documentUrl);
      setDocumentUrl(null);
    }
  };

  const handleUpdateJobStatus = async (status, notes = '') => {
    if (!selectedJob) return;
    
    setUpdatingStatus(true);
    const statusLabel = status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    
    try {
      console.log('🔄 Updating job status to:', status);
      
      message.loading({ content: `Updating status to ${statusLabel}...`, key: 'statusUpdate' });
      
      const response = await jobAPI.updateStatus(selectedJob.id, { 
        status, 
        notes: notes || `Status updated to ${statusLabel}` 
      });
      
      if (response.success) {
        message.success({ content: `Job marked as ${statusLabel}`, key: 'statusUpdate', duration: 2 });
        
        // Broadcast update to other tabs
        const channel = new BroadcastChannel('job_updates');
        channel.postMessage({
          type: 'JOB_STATUS_UPDATED',
          jobId: selectedJob.id,
          newStatus: status,
          timestamp: new Date().toISOString()
        });
        channel.close();
        
        // Refresh job details
        await handleViewJob({ id: selectedJob.id });
        
        // Refresh jobs list
        await fetchJobs();
      } else {
        message.error({ content: response.message || 'Failed to update status', key: 'statusUpdate', duration: 3 });
      }
    } catch (error) {
      console.error('❌ Failed to update status:', error);
      message.error({ content: error.message || 'Failed to update job status', key: 'statusUpdate', duration: 3 });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getNextStatusOptions = (currentStatus) => {
    const statusFlow = {
      'pending': ['assigned'],
      'assigned': ['collected'],
      'collected': ['in_transit'],
      'in_transit': ['arrived_at_warehouse'],
      'arrived_at_warehouse': ['batched'],
      'batched': ['shipped'],
      'shipped': ['out_for_delivery'],
      'out_for_delivery': ['delivered', 'failed_delivery'],
      'failed_delivery': ['out_for_delivery'],
      'delivered': [],
      'cancelled': [],
    };
    
    return statusFlow[currentStatus] || [];
  };

  const handleCancelJob = async () => {
    if (!selectedJob) return;
    
    Modal.confirm({
      title: 'Cancel Job?',
      content: 'Are you sure you want to cancel this job? This action cannot be undone.',
      okText: 'Yes, Cancel Job',
      okType: 'danger',
      cancelText: 'No, Keep Job',
      onOk: async () => {
        try {
          console.log('🚫 Cancelling job:', selectedJob.trackingId);
          
          const response = await jobAPI.updateStatus(selectedJob.id, { 
            status: 'cancelled',
            notes: 'Job cancelled by admin'
          });
          
          if (response.success) {
            message.success('Job cancelled successfully');
            setIsDetailsDrawerVisible(false);
            
            // Refresh jobs list
            await fetchJobs();
          } else {
            message.error(response.message || 'Failed to cancel job');
          }
        } catch (error) {
          console.error('❌ Failed to cancel job:', error);
          message.error(error.message || 'Failed to cancel job');
        }
      },
    });
  };

  const handleEditJob = (job) => {
    form.setFieldsValue({
      customerName: job.customer,
      pickupAddress: job.pickupAddress,
      deliveryAddress: job.deliveryAddress,
    });
    setIsModalVisible(true);
  };

  const handleDeleteJob = (job) => {
    console.log('Delete job:', job.jobId);
    message.info('Backend API not yet implemented');
  };

  const handleStatusUpdate = () => {
    setIsStatusUpdateModalVisible(true);
    statusUpdateForm.resetFields();
  };

  const handleStatusUpdateOk = async () => {
    try {
      const values = await statusUpdateForm.validateFields();
      console.log('Status update values:', values);
      // TODO: Replace with API call
      message.info('Backend API not yet implemented');
      setIsStatusUpdateModalVisible(false);
      statusUpdateForm.resetFields();
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
          <Col xs={12} sm={12} lg={6} key={index}>
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
        <Row justify="space-between" align="middle" className="search-filter-container" gutter={[16, 16]}>
          <Col xs={24} lg={16}>
            <Space wrap style={{ width: '100%' }} className="mobile-stack">
              <Input
                placeholder="Search jobs..."
                prefix={<SearchOutlined />}
                style={{ width: '100%', maxWidth: 250 }}
                className="mobile-full-width"
              />
              <Select
                placeholder="Filter by status"
                allowClear
                style={{ width: '100%', maxWidth: 220 }}
                className="mobile-full-width"
                value={statusFilter}
                onChange={setStatusFilter}
              >
                <OptGroup label={STATUS_GROUPS.COLLECTION.label}>
                  {STATUS_GROUPS.COLLECTION.statuses.map(status => (
                    <Option key={status} value={status}>
                      <Tag color={getStatusColor(status)} style={{ marginRight: 8 }}>
                        {status}
                      </Tag>
                    </Option>
                  ))}
                </OptGroup>
                <OptGroup label={STATUS_GROUPS.WAREHOUSE.label}>
                  {STATUS_GROUPS.WAREHOUSE.statuses.map(status => (
                    <Option key={status} value={status}>
                      <Tag color={getStatusColor(status)} style={{ marginRight: 8 }}>
                        {status}
                      </Tag>
                    </Option>
                  ))}
                </OptGroup>
                <OptGroup label={STATUS_GROUPS.SHIPPING.label}>
                  {STATUS_GROUPS.SHIPPING.statuses.map(status => (
                    <Option key={status} value={status}>
                      <Tag color={getStatusColor(status)} style={{ marginRight: 8 }}>
                        {status}
                      </Tag>
                    </Option>
                  ))}
                </OptGroup>
                <OptGroup label={STATUS_GROUPS.DELIVERY.label}>
                  {STATUS_GROUPS.DELIVERY.statuses.map(status => (
                    <Option key={status} value={status}>
                      <Tag color={getStatusColor(status)} style={{ marginRight: 8 }}>
                        {status}
                      </Tag>
                    </Option>
                  ))}
                </OptGroup>
              </Select>
            </Space>
          </Col>
          <Col xs={24} lg={8} style={{ textAlign: 'right' }} className="mobile-full-width">
            {(currentUser?.role === 'admin' || currentUser?.role === 'customer-service') && (
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
            emptyText: 'No jobs yet. Click "New Job" to create your first job.'
          }}
          pagination={{
            total: jobs.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} jobs`,
          }}
          mobileCardView={true}
          mobileBreakpoint={768}
          onCardClick={handleViewJob}
        />
      </Card>

      {/* New Job Modal */}
      <Modal
        title="Create New Job"
        visible={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        confirmLoading={submitting}
        width={window.innerWidth <= 768 ? '95%' : 800}
        okText={submitting ? "Creating Job..." : "Create Job"}
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
                      label="Email Address"
                      rules={[
                        { required: true, message: 'Please enter email!' },
                        { type: 'email', message: 'Please enter a valid email!' }
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
                      label="Phone Number"
                      rules={[{ required: true, message: 'Please enter phone!' }]}
                    >
                      <Input placeholder="Enter phone number" />
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
                  label="Delivery Address"
                  rules={[{ required: true, message: 'Please enter delivery address!' }]}
                >
                  <TextArea rows={2} placeholder="Enter delivery address" />
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
                  <Select>
                    <Option value="Standard">Standard</Option>
                    <Option value="Express">Express</Option>
                    <Option value="Urgent">Urgent</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="assignedTo"
                  label="Assign To"
                >
                  <Select 
                    placeholder="Select team member (optional)"
                    showSearch
                    allowClear
                    loading={loadingTeamMembers}
                    notFoundContent={loadingTeamMembers ? "Loading team members..." : "No team members available"}
                    optionFilterProp="children"
                    filterOption={(input, option) =>
                      option.children.props?.children[1]?.toLowerCase().includes(input.toLowerCase())
                    }
                  >
                    <Option value={null}>
                      <Space>
                        <UserOutlined />
                        Unassigned
                      </Space>
                    </Option>
                    {teamMembers.map(member => (
                      <Option key={member.id} value={member.id}>
                        <Space>
                          <UserOutlined />
                          {member.name} - {member.role.replace('-', ' ').toUpperCase()}
                        </Space>
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          </Card>

          {/* Package Details */}
          <Card size="small" title="Package Details" style={{ marginBottom: 16 }}>
            <Row gutter={16}>
              <Col xs={24} sm={12} md={8}>
                <Form.Item
                  name="packageType"
                  label="Package Type"
                  rules={[{ required: true, message: 'Please select package type!' }]}
                >
                  <Select>
                    <Option value="Document">Document</Option>
                    <Option value="Parcel">Parcel</Option>
                    <Option value="Box">Box</Option>
                    <Option value="Fragile">Fragile</Option>
                    <Option value="Heavy">Heavy</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={8}>
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
              <Col xs={24} sm={12} md={8}>
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

            <Form.Item
              name="description"
              label="Package Description"
            >
              <TextArea rows={2} placeholder="Describe the package contents" />
            </Form.Item>

            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="fragile"
                  label="Fragile Package"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="insurance"
                  label="Insurance Required"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>
              </Col>
            </Row>
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
            extra="Files will be automatically compressed to 5MB maximum each. Images are compressed automatically. PDFs and other files must be under 5MB. Maximum 5 files, 25MB total."
          >
            <Upload 
              beforeUpload={(file) => {
                // Allow all files - compression will happen during submission
                // Just validate that it's not extremely large (e.g., over 50MB)
                const absoluteMaxSize = 50 * 1024 * 1024; // 50MB absolute max
                if (file.size > absoluteMaxSize) {
                  message.error(`${file.name} is too large (${(file.size / 1024 / 1024).toFixed(2)}MB). Maximum allowed is 50MB. Files will be compressed to 5MB during upload.`);
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
      <Drawer
        title={`Job Details - ${selectedJob?.trackingId || ''}`}
        placement="right"
        onClose={() => setIsDetailsDrawerVisible(false)}
        open={isDetailsDrawerVisible}
        width={720}
        className="user-details-drawer"
        extra={
          selectedJob && ['admin', 'driver', 'delivery-agent', 'warehouse'].includes(currentUser?.role) && (
            <Dropdown
              overlay={
                <Menu>
                  {getNextStatusOptions(selectedJob.status).length > 0 && (
                    <>
                      <Menu.ItemGroup title="Update Status">
                        {getNextStatusOptions(selectedJob.status).map(status => (
                          <Menu.Item
                            key={status}
                            onClick={() => handleUpdateJobStatus(status)}
                            disabled={updatingStatus}
                          >
                            Mark as {status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </Menu.Item>
                        ))}
                      </Menu.ItemGroup>
                      {currentUser?.role === 'admin' && selectedJob.status !== 'cancelled' && selectedJob.status !== 'delivered' && (
                        <Menu.Divider />
                      )}
                    </>
                  )}
                  {currentUser?.role === 'admin' && selectedJob.status !== 'cancelled' && selectedJob.status !== 'delivered' && (
                    <Menu.Item
                      key="cancel"
                      danger
                      onClick={handleCancelJob}
                    >
                      Cancel Job
                    </Menu.Item>
                  )}
                  {getNextStatusOptions(selectedJob.status).length === 0 && 
                   !(currentUser?.role === 'admin' && selectedJob.status !== 'cancelled' && selectedJob.status !== 'delivered') && (
                    <Menu.Item disabled>No actions available</Menu.Item>
                  )}
                </Menu>
              }
              trigger={['click']}
              placement="bottomRight"
            >
              <Button 
                type="text" 
                icon={<MoreOutlined style={{ fontSize: 20 }} />}
                style={{ 
                  border: '1px solid #d9d9d9',
                  borderRadius: '4px'
                }}
              />
            </Dropdown>
          )
        }
      >
        {selectedJob && (
          <Tabs defaultActiveKey="details">
            <Tabs.TabPane tab="Details" key="details">

            {/* Customer Information Card */}
            <Card 
              size="small" 
              title={<span className="user-info-title">Customer Information</span>}
              className="user-info-card"
              style={{ marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', borderRadius: 8 }}
            >
              <div className="user-info-list">
                <div className="user-info-item">
                  <div className="user-info-label">Name</div>
                  <div className="user-info-value">
                <Text strong>{selectedJob.customer?.name}</Text>
                  </div>
              </div>
              {selectedJob.customer?.email && (
                  <div className="user-info-item">
                    <div className="user-info-label">Email</div>
                    <div className="user-info-value">
                      <MailOutlined style={{ color: '#1890ff', marginRight: '8px' }} />
                  <Text>{selectedJob.customer.email}</Text>
                    </div>
                </div>
              )}
              {selectedJob.customer?.phone && (
                  <div className="user-info-item">
                    <div className="user-info-label">Phone</div>
                    <div className="user-info-value">
                      <PhoneOutlined style={{ color: '#1890ff', marginRight: '8px' }} />
                  <Text>{selectedJob.customer.phone}</Text>
                    </div>
                </div>
              )}
                <div className="user-info-item">
                  <div className="user-info-label">Type</div>
                  <div className="user-info-value">
                <Tag color={selectedJob.customer?.customerType === 'Company' ? 'blue' : 'green'}>
                  {selectedJob.customer?.customerType}
                </Tag>
                  </div>
                </div>
              </div>
            </Card>

            {/* Address Information Card */}
            <Card 
              size="small" 
              title={<span className="user-info-title">Address Information</span>}
              className="user-info-card"
              style={{ marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', borderRadius: 8 }}
            >
              <div className="user-info-list">
                <div className="user-info-item">
                  <div className="user-info-label">Pickup</div>
                  <div className="user-info-value">
                    <EnvironmentOutlined style={{ color: '#1890ff', marginRight: '8px' }} />
                <Text>{selectedJob.pickupAddress}</Text>
              </div>
                </div>
                <div className="user-info-item">
                  <div className="user-info-label">Delivery</div>
                  <div className="user-info-value">
                    <EnvironmentOutlined style={{ color: '#1890ff', marginRight: '8px' }} />
                <Text>{selectedJob.deliveryAddress}</Text>
                  </div>
                </div>
              </div>
            </Card>

            {/* Package Details Card */}
            <Card 
              size="small" 
              title={<span className="user-info-title">Package Details</span>}
              className="user-info-card"
              style={{ marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', borderRadius: 8 }}
            >
              <div className="user-info-list">
              {selectedJob.description && (
                  <div className="user-info-item">
                    <div className="user-info-label">Description</div>
                    <div className="user-info-value">
                  <Text>{selectedJob.description}</Text>
                    </div>
                </div>
              )}
              {selectedJob.weight && (
                  <div className="user-info-item">
                    <div className="user-info-label">Weight</div>
                    <div className="user-info-value">
                  <Text>{selectedJob.weight} kg</Text>
                    </div>
                </div>
              )}
                {canViewRevenue && selectedJob.value && (
                  <div className="user-info-item">
                    <div className="user-info-label">Value</div>
                    <div className="user-info-value">
                  <Text>£{selectedJob.value}</Text>
                    </div>
                </div>
              )}
              {selectedJob.quantity && (
                  <div className="user-info-item">
                    <div className="user-info-label">Quantity</div>
                    <div className="user-info-value">
                  <Text>{selectedJob.quantity}</Text>
                    </div>
                </div>
              )}
              </div>
            </Card>

            {/* Job Information Card */}
            <Card 
              size="small" 
              title={<span className="user-info-title">Job Information</span>}
              className="user-info-card"
              style={{ marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', borderRadius: 8 }}
            >
              <div className="user-info-list">
                <div className="user-info-item">
                  <div className="user-info-label">Status</div>
                  <div className="user-info-value">
                <Tag color={
                  ['delivered', 'arrived_at_warehouse'].includes(selectedJob.status) ? 'green' :
                  ['in_transit', 'collected', 'out_for_delivery'].includes(selectedJob.status) ? 'blue' :
                  ['assigned', 'batched'].includes(selectedJob.status) ? 'orange' :
                  selectedJob.status === 'cancelled' ? 'red' :
                  'default'
                }>
                  {selectedJob.status?.replace(/_/g, ' ').toUpperCase()}
                </Tag>
              </div>
                </div>
                <div className="user-info-item">
                  <div className="user-info-label">Priority</div>
                  <div className="user-info-value">
                <Tag color={selectedJob.priority === 'Urgent' ? 'red' : selectedJob.priority === 'Express' ? 'orange' : 'blue'}>
                  {selectedJob.priority}
                </Tag>
              </div>
                </div>
                <div className="user-info-item">
                  <div className="user-info-label">Assigned To</div>
                  <div className="user-info-value">
                <Text>{selectedJob.assignedDriver?.name || 'Unassigned'}</Text>
              </div>
                </div>
                <div className="user-info-item">
                  <div className="user-info-label">Pickup Date</div>
                  <div className="user-info-value">
                <Text>{selectedJob.pickupDate ? new Date(selectedJob.pickupDate).toLocaleDateString() : 'Not set'}</Text>
              </div>
                </div>
                <div className="user-info-item">
                  <div className="user-info-label">Created</div>
                  <div className="user-info-value">
                <Text type="secondary">{new Date(selectedJob.createdAt).toLocaleString()}</Text>
                  </div>
                </div>
              </div>
            </Card>

            {/* Special Instructions */}
            {selectedJob.specialInstructions && (
              <Card 
                size="small" 
                title="Special Instructions" 
                style={{ marginBottom: 16 }}
              >
                <Text>{selectedJob.specialInstructions}</Text>
              </Card>
            )}

            {/* Documents Card */}
            <Card size="small" title="Attached Documents">
              {selectedJob.documents && selectedJob.documents.length > 0 ? (
                <Space direction="vertical" style={{ width: '100%' }}>
                  {selectedJob.documents.map((doc, index) => (
                    <div 
                      key={index} 
                      style={{ 
                        padding: 12, 
                        backgroundColor: '#f5f5f5', 
                        borderRadius: 4,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <Text strong>{doc.fileName}</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          {new Date(doc.uploadedAt).toLocaleString()}
                          {doc.uploader && ` • ${doc.uploader.name}`}
                          {doc.fileSize && ` • ${(doc.fileSize / 1024).toFixed(2)} KB`}
                        </Text>
                      </div>
                      <Button
                        type="primary"
                        size="small"
                        icon={<EyeOutlined />}
                        onClick={() => handleViewDocument(doc)}
                      >
                        View
                      </Button>
                    </div>
                  ))}
                </Space>
              ) : (
                <Text type="secondary">No documents attached</Text>
              )}
            </Card>
            </Tabs.TabPane>

            {/* Activities Tab */}
            <Tabs.TabPane tab="Activities" key="activities">
              {selectedJob.timeline && selectedJob.timeline.length > 0 ? (
                <Timeline>
                  {selectedJob.timeline.map((entry, index) => (
                    <Timeline.Item
                      key={index}
                      color={
                        ['delivered', 'arrived_at_warehouse'].includes(entry.status) ? 'green' :
                        ['in_transit', 'collected', 'out_for_delivery'].includes(entry.status) ? 'blue' :
                        ['assigned', 'batched'].includes(entry.status) ? 'orange' :
                        entry.status === 'cancelled' ? 'red' :
                        'gray'
                      }
                    >
                      <div>
                        <Tag 
                          color={
                            ['delivered', 'arrived_at_warehouse'].includes(entry.status) ? 'green' :
                            ['in_transit', 'collected', 'out_for_delivery'].includes(entry.status) ? 'blue' :
                            ['assigned', 'batched'].includes(entry.status) ? 'orange' :
                            entry.status === 'cancelled' ? 'red' :
                            'default'
                          }
                        >
                          {entry.status.replace(/_/g, ' ').toUpperCase()}
                        </Tag>
                        <br />
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          {new Date(entry.timestamp).toLocaleString()}
                        </Text>
                        {entry.notes && (
                          <>
                            <br />
                            <Text>{entry.notes}</Text>
                          </>
                        )}
                        {entry.updater && (
                          <>
                            <br />
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                              By: {entry.updater.name}
                            </Text>
                          </>
                        )}
                      </div>
                    </Timeline.Item>
                  ))}
                </Timeline>
              ) : (
                <Text type="secondary">No activity recorded yet</Text>
              )}
            </Tabs.TabPane>
          </Tabs>
        )}
      </Drawer>

      {/* Document Viewer Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileTextOutlined />
            <span>{currentDocument?.fileName || 'Document Viewer'}</span>
          </div>
        }
        open={documentModalVisible}
        onCancel={handleCloseDocumentModal}
        width="90%"
        style={{ top: 20 }}
        footer={[
          <Button key="close" onClick={handleCloseDocumentModal}>
            Close
          </Button>,
          documentUrl && (
            <Button 
              key="download" 
              type="primary" 
              onClick={() => {
                const link = document.createElement('a');
                link.href = documentUrl;
                link.download = currentDocument?.fileName || 'document';
                link.click();
              }}
            >
              Download
            </Button>
          )
        ]}
        bodyStyle={{ padding: 0, height: '80vh' }}
      >
        {documentLoading ? (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100%' 
          }}>
            <Spin size="large" />
            <Text style={{ marginLeft: 16 }}>Loading document...</Text>
          </div>
        ) : documentUrl && currentDocument ? (
          <div style={{ height: '100%', overflow: 'hidden' }}>
            {(() => {
              const fileExtension = currentDocument.fileName?.split('.').pop()?.toLowerCase();
              console.log('📄 Document viewer - File extension:', fileExtension);
              console.log('📄 Document viewer - Document URL:', documentUrl);
              console.log('📄 Document viewer - Current document:', currentDocument);
              
              // Handle PDF files
              if (fileExtension === 'pdf') {
                return (
                  <iframe
                    src={documentUrl}
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      border: 'none' 
                    }}
                    title={currentDocument.fileName}
                    onLoad={() => console.log('✅ PDF iframe loaded')}
                    onError={(e) => console.error('❌ PDF iframe error:', e)}
                  />
                );
              }
              
              // Handle image files
              if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(fileExtension)) {
                return (
                  <div style={{ 
                    height: '100%', 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center',
                    backgroundColor: '#f5f5f5'
                  }}>
                    <Image
                      src={documentUrl}
                      alt={currentDocument.fileName}
                      style={{ maxHeight: '100%', maxWidth: '100%' }}
                      preview={false}
                    />
                  </div>
                );
              }
              
              // Handle text files
              if (['txt', 'csv', 'json', 'xml', 'log'].includes(fileExtension)) {
                return (
                  <TextFileViewer 
                    documentUrl={documentUrl} 
                    fileName={currentDocument.fileName}
                    fileExtension={fileExtension}
                  />
                );
              }
              
              // Default fallback for other file types
              return (
                <div style={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  justifyContent: 'center', 
                  alignItems: 'center',
                  padding: '20px',
                  textAlign: 'center'
                }}>
                  <FileTextOutlined style={{ fontSize: '64px', color: '#1890ff', marginBottom: '16px' }} />
                  <Title level={4}>{currentDocument.fileName}</Title>
                  <Text type="secondary" style={{ marginBottom: '20px' }}>
                    This file type cannot be previewed in the browser.
                  </Text>
                  <Button 
                    type="primary" 
                    size="large"
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = documentUrl;
                      link.download = currentDocument.fileName;
                      link.click();
                    }}
                  >
                    Download File
                  </Button>
                </div>
              );
            })()}
          </div>
        ) : (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100%' 
          }}>
            <Text type="secondary">Failed to load document</Text>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default JobsPage;
