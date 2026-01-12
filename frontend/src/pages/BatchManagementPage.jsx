import React, { useState, useEffect } from 'react';
import { 
  Row, 
  Col, 
  Card, 
  Table, 
  Button, 
  Modal, 
  Form, 
  Input, 
  InputNumber,
  Select, 
  DatePicker, 
  Typography, 
  Tag, 
  Space,
  message,
  Progress,
  Badge,
  Drawer,
  Divider,
  Tabs,
  Transfer,
  Statistic,
  Popconfirm
} from 'antd';
import dayjs from 'dayjs';
import { 
  PlusOutlined,
  CarOutlined,
  RocketOutlined,
  ContainerOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  ExportOutlined,
  ImportOutlined,
  SendOutlined,
  InboxOutlined,
  DollarOutlined,
  ApartmentOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import { JOB_STATUSES, BATCH_STATUSES, getBatchStatusColor } from '../constants/jobStatuses';
import { jobAPI, batchAPI } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import ResponsiveTable from '../components/common/ResponsiveTable';
import { hasPermission } from '../utils/permissions';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const BatchManagementPage = () => {
  const { currentUser } = useAuth();
  const canViewRevenue = hasPermission(currentUser, 'financial:view');
  const isGhanaWarehouse = currentUser?.role === 'warehouse' && currentUser?.warehouseLocation === 'Ghana Warehouse';
  const [batchModalVisible, setBatchModalVisible] = useState(false);
  const [isDetailsDrawerVisible, setIsDetailsDrawerVisible] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [selectedParcels, setSelectedParcels] = useState([]);
  const [batchForm] = Form.useForm();
  const [activeTab, setActiveTab] = useState('batches');
  const [availableJobs, setAvailableJobs] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [creatingBatch, setCreatingBatch] = useState(false);
  const [shippingBatch, setShippingBatch] = useState(false);

  // Create broadcast channel for cross-tab communication
  useEffect(() => {
    const channel = new BroadcastChannel('job_updates');
    
    // Listen for updates from other tabs
    channel.onmessage = (event) => {
      console.log('📡 Batch page received update from another tab:', event.data);
      if (event.data.type === 'JOB_STATUS_UPDATED' || event.data.type === 'JOB_CREATED') {
        // Refresh available jobs
        fetchAvailableJobs();
      }
      if (event.data.type === 'BATCH_CREATED' || event.data.type === 'BATCH_SHIPPED') {
        // Refresh batches list
        fetchBatches();
        fetchAvailableJobs(); // Also refresh available jobs
      }
    };
    
    // Cleanup
    return () => {
      channel.close();
    };
  }, []);

  // Fetch jobs and batches on mount
  useEffect(() => {
    fetchAvailableJobs();
    fetchBatches();
  }, []);

  // Auto-refresh jobs and batches every 120 seconds (2 minutes) to reduce API load
  useEffect(() => {
    // Don't auto-refresh if there's an error (rate limit, etc.)
    if (loading || loadingBatches) return;
    
    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing batch jobs and batches...');
      fetchAvailableJobs();
      fetchBatches();
    }, 120000); // 120 seconds (2 minutes)

    return () => clearInterval(interval);
  }, [loading, loadingBatches]);

  const fetchAvailableJobs = async () => {
    setLoading(true);
    try {
      console.log('📥 Fetching jobs ready for batching...');
      
      const response = await jobAPI.getAll();
      
      if (response.success && response.data) {
        const rawJobs = Array.isArray(response.data) ? response.data : response.data.jobs || [];
        
        // Filter jobs with status "arrived_at_warehouse" (ready for batching)
        const readyJobs = rawJobs.filter(job => job.status === 'arrived_at_warehouse');
        
        // Transform to table format
        const transformedJobs = readyJobs.map(job => ({
          key: job.id,
          id: job.id,
          jobId: job.trackingId,
          trackingId: job.trackingId,
          customer: job.customer?.name || 'N/A',
          pickupAddress: job.pickupAddress,
          deliveryAddress: job.deliveryAddress,
          weight: job.weight || 0,
          value: job.value || 0,
          description: job.description || 'N/A',
          priority: job.priority || 'Standard',
        }));
        
        console.log('✅ Jobs ready for batching:', transformedJobs);
        setAvailableJobs(transformedJobs);
      }
    } catch (error) {
      console.error('❌ Failed to fetch jobs:', error);
      message.error('Failed to load jobs ready for batching');
    } finally {
      setLoading(false);
    }
  };

  const fetchBatches = async () => {
    setLoadingBatches(true);
    try {
      console.log('📥 Fetching batches from backend...');
      
      const response = await batchAPI.getAll();
      
      if (response.success && response.data) {
        const rawBatches = Array.isArray(response.data) ? response.data : response.data.batches || [];
        
        // Transform to table format
        const transformedBatches = rawBatches.map(batch => ({
          key: batch.id,
          id: batch.id,
          batchId: batch.batchId,
          name: batch.destination || 'N/A',
          status: batch.status,
          totalParcels: batch.totalJobs || 0,
          totalWeight: `${batch.totalWeight || 0} kg`,
          vessel: batch.carrier || 'N/A',
          departure: batch.estimatedShipDate ? new Date(batch.estimatedShipDate).toLocaleDateString() : 'Not set',
          eta: batch.estimatedArrival ? new Date(batch.estimatedArrival).toLocaleDateString() : 'Not set',
          progress: batch.status === 'Distributed' ? 100 : 
                   batch.status === 'Arrived' ? 80 :
                   batch.status === 'In Transit' ? 60 :
                   batch.status === 'Shipped' ? 40 :
                   batch.status === 'Ready to Ship' ? 20 : 10,
          jobs: batch.jobs || [],
          trackingNumber: batch.trackingNumber,
          notes: batch.notes,
          createdBy: batch.creator?.name || 'Unknown',
          createdAt: batch.createdAt,
        }));
        
        console.log('✅ Batches fetched:', transformedBatches);
        setBatches(transformedBatches);
      }
    } catch (error) {
      console.error('❌ Failed to fetch batches:', error);
      message.error('Failed to load batches');
    } finally {
      setLoadingBatches(false);
    }
  };

  // TODO: Fetch vessel/flight options from API
  const vesselOptions = [
    { value: 'MS Sea Express', label: 'MS Sea Express (Sea)', type: 'Sea' },
    { value: 'MS Atlantic Star', label: 'MS Atlantic Star (Sea)', type: 'Sea' },
    { value: 'BA Flight 123', label: 'BA Flight 123 (Air)', type: 'Air' },
    { value: 'AF Flight 456', label: 'AF Flight 456 (Air)', type: 'Air' }
  ];

  const batchColumns = [
    {
      title: 'Batch ID',
      dataIndex: 'batchId',
      key: 'batchId',
      render: (text) => <Text strong>{text}</Text>,
      mobile: true,
    },
    {
      title: 'Batch Name',
      dataIndex: 'name',
      key: 'name',
      mobile: true,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      mobile: true,
      render: (status) => (
        <Tag color={getBatchStatusColor(status)}>
          {status}
        </Tag>
      ),
    },
    {
      title: 'Jobs',
      dataIndex: 'totalParcels',
      key: 'totalParcels',
      render: (count) => <Badge count={count} style={{ backgroundColor: '#1890ff' }} />,
      mobile: true,
    },
    {
      title: 'Total Weight',
      dataIndex: 'totalWeight',
      key: 'totalWeight',
      mobile: false,
    },
    {
      title: 'Vessel/Flight',
      dataIndex: 'vessel',
      key: 'vessel',
      mobile: false,
                           render: (vessel) => (
          <Space>
            {vessel?.includes('Flight') ? <RocketOutlined /> : <CarOutlined />}
            {vessel || 'N/A'}
          </Space>
        ),
    },
    {
      title: 'Departure',
      dataIndex: 'departureDate',
      key: 'departureDate',
      mobile: false,
    },
    {
      title: 'ETA',
      dataIndex: 'eta',
      key: 'eta',
      mobile: false,
    },
    {
      title: 'Progress',
      dataIndex: 'progress',
      key: 'progress',
      mobile: false,
      render: (progress) => <Progress percent={progress} size="small" />,
    },
    {
      title: 'Actions',
      key: 'actions',
      mobile: true,
      render: (_, record) => (
        <Button 
          size="small"
          icon={<EyeOutlined />}
          onClick={(e) => {
            e.stopPropagation();
            handleViewBatch(record);
          }}
        >
          View
        </Button>
      ),
    },
  ];

  const jobSelectionColumns = [
    {
      title: 'Job ID',
      dataIndex: 'jobId',
      key: 'jobId',
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: 'Tracking ID',
      dataIndex: 'trackingId',
      key: 'trackingId',
    },
    {
      title: 'Customer',
      dataIndex: 'customer',
      key: 'customer',
    },
    {
      title: 'Destination',
      dataIndex: 'deliveryAddress',
      key: 'deliveryAddress',
      ellipsis: true,
    },
    {
      title: 'Weight',
      dataIndex: 'weight',
      key: 'weight',
      render: (weight) => `${weight} kg`,
    },
    {
      title: 'Value',
      dataIndex: 'value',
      key: 'value',
      render: (value) => `£${value}`,
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority) => {
        let color = 'default';
        switch (priority) {
          case 'Urgent':
            color = 'error';
            break;
          case 'Express':
            color = 'warning';
            break;
          case 'Standard':
            color = 'default';
            break;
          default:
            color = 'default';
        }
        return <Tag color={color}>{priority}</Tag>;
      },
    },
  ];

  const handleCreateBatch = () => {
    // Prevent Ghana Warehouse users from creating batches
    if (isGhanaWarehouse) {
      message.warning('Ghana Warehouse users cannot create batches. This page is view-only.');
      return;
    }
    setSelectedBatch(null);
    setSelectedParcels([]);
    batchForm.resetFields();
    setBatchModalVisible(true);
  };

  const handleViewBatch = (batch) => {
    setSelectedBatch(batch);
    setIsDetailsDrawerVisible(true);
  };

  const handleEditBatch = (batch) => {
    // Prevent Ghana Warehouse users from editing batches
    if (isGhanaWarehouse) {
      message.warning('Ghana Warehouse users cannot edit batches. This page is view-only.');
      return;
    }
    setSelectedBatch(batch);
    setSelectedParcels(batch.jobs?.map(j => j.key) || []);
    
    // Convert dates to dayjs objects for DatePicker
    const formValues = {
      ...batch,
      departureDate: batch.departureDate ? dayjs(batch.departureDate) : null,
      eta: batch.eta ? dayjs(batch.eta) : null,
    };
    
    batchForm.setFieldsValue(formValues);
    setBatchModalVisible(true);
  };

  const handleUpdateBatchStatus = async (newStatus, statusLabel) => {
    if (!selectedBatch) return;
    
    setShippingBatch(true);
    
    try {
      console.log(`📦 Updating batch ${selectedBatch.batchId} to:`, newStatus);
      
      message.loading({ content: `Marking batch as ${statusLabel}...`, key: 'updateBatch' });
      
      const response = await batchAPI.updateStatus(selectedBatch.id, {
        status: newStatus,
        notes: `Batch ${statusLabel.toLowerCase()} by ${currentUser?.name || 'admin'}`
      });
      
      if (response.success) {
        message.success({ 
          content: `Batch ${selectedBatch.batchId} marked as ${statusLabel}!`,
          key: 'updateBatch',
          duration: 3
        });
        
        // Broadcast update to other tabs
        const channel = new BroadcastChannel('job_updates');
        channel.postMessage({
          type: 'BATCH_STATUS_UPDATED',
          batchId: selectedBatch.id,
          newStatus: newStatus,
          timestamp: new Date().toISOString()
        });
        channel.close();
        
        setIsDetailsDrawerVisible(false);
        
        // Refresh batches list
        await fetchBatches();
        
        // Refresh batch details
        const updatedBatch = await batchAPI.getById(selectedBatch.id);
        if (updatedBatch.success) {
          setSelectedBatch(updatedBatch.data.batch);
        }
      } else {
        message.error({ content: response.message || 'Failed to update batch', key: 'updateBatch', duration: 3 });
      }
    } catch (error) {
      console.error('❌ Failed to update batch status:', error);
      message.error({ content: error.message || 'Failed to update batch', key: 'updateBatch', duration: 3 });
    } finally {
      setShippingBatch(false);
    }
  };

  const handleShipBatch = () => handleUpdateBatchStatus('Shipped', 'Shipped');
  const handleMarkInTransit = () => handleUpdateBatchStatus('In Transit', 'In Transit');
  const handleMarkArrived = () => handleUpdateBatchStatus('Arrived', 'Arrived');
  const handleMarkDistributed = () => handleUpdateBatchStatus('Distributed', 'Distributed');

  const handleBatchSubmit = async (values) => {
    setCreatingBatch(true);
    
    try {
      // Validation: Check if jobs are selected
      if (selectedParcels.length === 0) {
        message.warning('Please select at least one job for this batch');
        setCreatingBatch(false);
        return;
      }

      const batchData = {
        name: values.name,
        route: values.route,
        vessel: values.vessel,
        containerNumber: values.containerNumber, // Seal Number
        departureDate: values.departureDate ? values.departureDate.toISOString() : null,
        eta: values.eta ? values.eta.toISOString() : null,
        notes: values.notes,
        jobs: selectedParcels, // Array of selected job IDs
        batchItems: values.batchItems || [], // Batch items for Ghana delivery
      };
      
      console.log('📦 Creating batch with jobs:', batchData);
      
      message.loading({ content: 'Creating batch...', key: 'batchCreate' });
      
      // Call API to create batch
      const response = await batchAPI.create(batchData);
      
      if (response.success) {
        message.success({ 
          content: `Batch created successfully! ${response.data.jobsUpdated} jobs updated to "Batched" status.`, 
          key: 'batchCreate',
          duration: 3
        });
        
        // Broadcast batch creation to other tabs
        const channel = new BroadcastChannel('job_updates');
        channel.postMessage({
          type: 'BATCH_CREATED',
          batchId: response.data.batch?.id,
          jobsUpdated: response.data.jobsUpdated,
          timestamp: new Date().toISOString()
        });
        channel.close();
        
        setBatchModalVisible(false);
        batchForm.resetFields();
        setSelectedBatch(null);
        setSelectedParcels([]);
        
        // Refresh available jobs (batched jobs should be removed)
        await fetchAvailableJobs();
        
        // Refresh batches list
        await fetchBatches();
      } else {
        message.error({ content: response.message || 'Failed to create batch', key: 'batchCreate', duration: 3 });
      }
    } catch (error) {
      console.error('❌ Failed to create batch:', error);
      message.error({ content: error.message || 'Failed to save batch. Please try again.', key: 'batchCreate', duration: 3 });
    } finally {
      setCreatingBatch(false);
    }
  };

  const calculateTotalWeight = () => {
    const selected = availableJobs.filter(j => selectedParcels.includes(j.key));
    return selected.reduce((sum, j) => sum + parseFloat(j.weight || 0), 0).toFixed(1);
  };

  const calculateTotalValue = () => {
    const selected = availableJobs.filter(j => selectedParcels.includes(j.key));
    return selected.reduce((sum, j) => sum + (j.value || 0), 0);
  };

  const tabItems = [
    {
      key: 'batches',
      label: 'Batch Management',
      children: (
        <div>
          {/* Hide batch creation for Ghana Warehouse users */}
          {!isGhanaWarehouse && (
            <div style={{ marginBottom: '16px', textAlign: 'right' }} className="create-batch-button-container">
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={handleCreateBatch}
                size="large"
                className="create-batch-button-mobile"
              >
                Create New Batch
              </Button>
            </div>
          )}
          {isGhanaWarehouse && (
            <div style={{ marginBottom: '16px', padding: '12px', background: '#f0f0f0', borderRadius: '4px' }}>
              <Text type="secondary" style={{ fontSize: '14px' }}>
                <EyeOutlined /> View-only mode: Ghana Warehouse users can view batches but cannot create or edit them.
              </Text>
            </div>
          )}
          <ResponsiveTable
            columns={batchColumns}
            dataSource={batches}
            loading={loadingBatches}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showTotal: (total) => `Total ${total} batches`
            }}
            locale={{
              emptyText: 'No batches created yet'
            }}
            size="small"
            onCardClick={handleViewBatch}
          />
        </div>
      ),
    },
  ];

  return (
    <div>
      <Title level={2} style={{ marginBottom: '24px' }}>
        Batch Management
      </Title>

      {/* Main Content Tabs */}
      <Card>
        <Tabs 
          defaultActiveKey="batches" 
          items={tabItems}
          onChange={setActiveTab}
        />
      </Card>

      {/* Create/Edit Batch Modal - Hidden for Ghana Warehouse users */}
      {!isGhanaWarehouse && (
        <Modal
          title={selectedBatch ? `Edit Batch - ${selectedBatch.batchId}` : 'Create New Batch'}
          open={batchModalVisible}
          onCancel={() => {
            setBatchModalVisible(false);
            setSelectedParcels([]);
          }}
          footer={null}
          width={1000}
        styles={{ 
          body: {
            maxHeight: '75vh', 
            overflowY: 'auto',
            paddingRight: '8px'
          }
        }}
      >
        <Form
          form={batchForm}
          layout="vertical"
          onFinish={handleBatchSubmit}
        >
          {/* Basic Information */}
          <Card size="small" title="Basic Information" style={{ marginBottom: 16 }}>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="name"
                  label="Batch Name"
                  rules={[{ required: true, message: 'Please enter batch name' }]}
                >
                  <Input placeholder="e.g., Accra Express Batch" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="route"
                  label="Route"
                  rules={[{ required: true, message: 'Please select route' }]}
                >
                  <Select placeholder="Select route">
                    <Option value="London → Accra">London → Accra</Option>
                    <Option value="London → Accra → Kumasi">London → Accra → Kumasi</Option>
                    <Option value="London → Accra → Tamale">London → Accra → Tamale</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          </Card>

          {/* Vessel/Flight Details */}
          <Card size="small" title="Vessel/Flight Details" style={{ marginBottom: 16 }}>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="vessel"
                  label="Vessel/Flight"
                  rules={[{ required: true, message: 'Please select vessel/flight' }]}
                >
                  <Select placeholder="Select vessel or flight">
                    {vesselOptions.map(option => (
                      <Option key={option.value} value={option.value}>
                        <Space>
                          {option.type === 'Air' ? <RocketOutlined /> : <CarOutlined />}
                          {option.label}
                        </Space>
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="departureDate"
                  label="Departure Date"
                >
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="eta"
                  label="Estimated Time of Arrival"
                >
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="containerNumber"
                  label="Seal Number"
                  rules={[{ required: true, message: 'Please enter seal number!' }]}
                >
                  <Input placeholder="e.g., SEAL001234" />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          {/* Job Selection */}
          <Card size="small" title="Select Jobs for This Batch" style={{ marginBottom: 16 }}>
            <Space direction="vertical" style={{ width: '100%', marginBottom: 16 }}>
              <Row gutter={16}>
                <Col xs={24} sm={8}>
                  <Statistic
                    title="Selected Jobs"
                    value={selectedParcels.length}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Col>
                <Col xs={24} sm={8}>
                  <Statistic
                    title="Total Weight"
                    value={calculateTotalWeight()}
                    suffix=" kg"
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Col>
                <Col xs={24} sm={8}>
                  <Statistic
                    title="Total Value"
                    value={`£${calculateTotalValue()}`}
                    valueStyle={{ color: '#722ed1' }}
                  />
                </Col>
              </Row>
            </Space>
            <Table
              rowSelection={{
                selectedRowKeys: selectedParcels,
                onChange: (selectedRowKeys) => {
                  setSelectedParcels(selectedRowKeys);
                },
                getCheckboxProps: (record) => ({
                  name: record.jobId,
                }),
              }}
              columns={jobSelectionColumns}
              dataSource={availableJobs}
              loading={loading}
              pagination={false}
              scroll={{ y: 300 }}
              size="small"
              locale={{
                emptyText: 'No jobs available for batching. Jobs must have "Arrived At Hub" status to be ready for batching.'
              }}
            />
          </Card>

          {/* Batch Items for Ghana Delivery */}
          <Card size="small" title="Batch Items (Ghana Delivery)" style={{ marginBottom: 16 }}>
            <Form.List name="batchItems">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => (
                    <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                      <Form.Item
                        {...restField}
                        name={[name, 'itemName']}
                        label="Item Name"
                        rules={[{ required: true, message: 'Missing item name' }]}
                      >
                        <Input placeholder="Item name" />
                      </Form.Item>
                      <Form.Item
                        {...restField}
                        name={[name, 'quantity']}
                        label="Quantity"
                        rules={[{ required: true, message: 'Missing quantity' }]}
                      >
                        <InputNumber min={1} placeholder="Qty" />
                      </Form.Item>
                      <Form.Item
                        {...restField}
                        name={[name, 'description']}
                        label="Description"
                      >
                        <Input placeholder="Description" />
                      </Form.Item>
                      <Button type="link" onClick={() => remove(name)} danger>
                        Remove
                      </Button>
                    </Space>
                  ))}
                  <Form.Item>
                    <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                      Add Batch Item
                    </Button>
                  </Form.Item>
                </>
              )}
            </Form.List>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              Add items that will be included in this batch for delivery in Ghana
            </Text>
          </Card>

          {/* Batch Notes */}
          <Card size="small" title="Additional Information" style={{ marginBottom: 16 }}>
            <Form.Item
              name="notes"
              label="Batch Notes"
            >
              <TextArea 
                rows={3} 
                placeholder="Any special instructions or notes for this batch"
              />
            </Form.Item>
          </Card>

          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
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
                loading={creatingBatch}
                icon={!creatingBatch && <PlusOutlined />}
              >
                {creatingBatch ? 'Creating Batch...' : (selectedBatch ? 'Update Batch' : 'Create Batch')}
              </Button>
            </Space>
          </Form.Item>
        </Form>
        </Modal>
      )}

      {/* Batch Details Side Drawer */}
      <Drawer
        title="Batch Details"
        placement="right"
        onClose={() => setIsDetailsDrawerVisible(false)}
        open={isDetailsDrawerVisible}
        width={800}
        className="user-details-drawer"
        extra={
          selectedBatch && !isGhanaWarehouse && (
            <Space>
              {/* In Preparation → Show Ship and Edit buttons */}
              {selectedBatch.status === 'In Preparation' && (
                <>
                  <Button 
                    key="ship"
                    type="primary"
                    loading={shippingBatch}
                    onClick={handleShipBatch}
                    style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                  >
                    {shippingBatch ? 'Updating...' : 'Mark as Shipped'}
                  </Button>
                  <Button 
                    key="edit"
                    icon={<EditOutlined />}
                    onClick={() => {
                      setIsDetailsDrawerVisible(false);
                      handleEditBatch(selectedBatch);
                    }}
                  >
                    Edit Batch
                  </Button>
                </>
              )}

              {/* Shipped → Show In Transit button */}
              {selectedBatch.status === 'Shipped' && (
                <Button 
                  key="in-transit"
                  type="primary"
                  loading={shippingBatch}
                  onClick={handleMarkInTransit}
                  style={{ backgroundColor: '#1890ff', borderColor: '#1890ff' }}
                >
                  {shippingBatch ? 'Updating...' : 'Mark as In Transit'}
                </Button>
              )}

              {/* In Transit → Show Arrived button */}
              {selectedBatch.status === 'In Transit' && (
                <Button 
                  key="arrived"
                  type="primary"
                  loading={shippingBatch}
                  onClick={handleMarkArrived}
                  style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                >
                  {shippingBatch ? 'Updating...' : 'Mark as Arrived'}
                </Button>
              )}

              {/* Arrived → Show Distributed button */}
              {selectedBatch.status === 'Arrived' && (
                <Button 
                  key="distributed"
                  type="primary"
                  loading={shippingBatch}
                  onClick={handleMarkDistributed}
                  style={{ backgroundColor: '#722ed1', borderColor: '#722ed1' }}
                >
                  {shippingBatch ? 'Updating...' : 'Mark as Distributed'}
                </Button>
              )}
            </Space>
          )
        }
      >
        {selectedBatch && (
          <div>
            {/* Batch Overview */}
            <Card size="small" style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', padding: '8px 0' }}>
                <Text strong style={{ width: '140px', color: '#8c8c8c' }}>Batch ID</Text>
                <Text strong>{selectedBatch.batchId}</Text>
              </div>
              <div style={{ display: 'flex', padding: '8px 0' }}>
                <Text strong style={{ width: '140px', color: '#8c8c8c' }}>Destination</Text>
                <Text>{selectedBatch.name}</Text>
              </div>
              <div style={{ display: 'flex', padding: '8px 0' }}>
                <Text strong style={{ width: '140px', color: '#8c8c8c' }}>Status</Text>
                <Tag color={
                  selectedBatch.status === 'Distributed' ? 'green' :
                  selectedBatch.status === 'Arrived' ? 'blue' :
                  selectedBatch.status === 'In Transit' ? 'cyan' :
                  selectedBatch.status === 'Shipped' ? 'geekblue' :
                  selectedBatch.status === 'Ready to Ship' ? 'orange' :
                  'default'
                }>
                  {selectedBatch.status}
                </Tag>
              </div>
              <div style={{ display: 'flex', padding: '8px 0', alignItems: 'center' }}>
                <Text strong style={{ width: '140px', color: '#8c8c8c' }}>Progress</Text>
                <div style={{ flex: 1 }}>
                  <Progress 
                    percent={selectedBatch.progress} 
                    size="small"
                    strokeColor={{
                      '0%': '#108ee9',
                      '100%': '#87d068',
                    }}
                  />
                </div>
              </div>
            </Card>

            {/* Batch Details */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              <Col span={24}>
                <Card 
                  size="small" 
                  title={<span className="user-info-title">Batch Information</span>}
                  className="user-info-card"
                  style={{ 
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    borderRadius: 8,
                    marginBottom: 24
                  }}
                >
                  <div className="user-info-list">
                    <div className="user-info-item">
                      <div className="user-info-label">Total Parcels</div>
                      <div className="user-info-value">
                        <InboxOutlined style={{ color: '#1890ff', marginRight: '8px' }} />
                      <Badge count={selectedBatch.totalParcels} style={{ backgroundColor: '#1890ff' }} />
                      </div>
                    </div>
                    <div className="user-info-item">
                      <div className="user-info-label">Total Weight</div>
                      <div className="user-info-value">
                      <Text strong>{selectedBatch.totalWeight}</Text>
                      </div>
                    </div>
                    {canViewRevenue && (
                      <div className="user-info-item">
                        <div className="user-info-label">Total Value</div>
                        <div className="user-info-value">
                          <DollarOutlined style={{ color: '#1890ff', marginRight: '8px' }} />
                      <Text strong>£{selectedBatch.totalValue}</Text>
                        </div>
                      </div>
                    )}
                    <div className="user-info-item">
                      <div className="user-info-label">Route</div>
                      <div className="user-info-value">
                        <ApartmentOutlined style={{ color: '#1890ff', marginRight: '8px' }} />
                        <Text>{selectedBatch.route}</Text>
                      </div>
                    </div>
                  </div>
                </Card>
              </Col>
            </Row>

            {/* Vessel/Flight Details */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              <Col span={24}>
                <Card 
                  size="small" 
                  title={<span className="user-info-title">Transportation Details</span>}
                  className="user-info-card"
                  style={{ 
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    borderRadius: 8,
                    marginBottom: 24
                  }}
                >
                  <div className="user-info-list">
                    <div className="user-info-item">
                      <div className="user-info-label">Vessel/Flight</div>
                      <div className="user-info-value">
                        {selectedBatch.vessel?.includes('Flight') ? (
                          <RocketOutlined style={{ color: '#1890ff', marginRight: '8px' }} />
                        ) : (
                          <CarOutlined style={{ color: '#1890ff', marginRight: '8px' }} />
                        )}
                        <Text>{selectedBatch.vessel || 'N/A'}</Text>
                      </div>
                    </div>
                    <div className="user-info-item">
                      <div className="user-info-label">Departure Date</div>
                      <div className="user-info-value">
                        <CalendarOutlined style={{ color: '#1890ff', marginRight: '8px' }} />
                        <Text>{selectedBatch.departureDate}</Text>
                      </div>
                    </div>
                    <div className="user-info-item">
                      <div className="user-info-label">ETA</div>
                      <div className="user-info-value">
                        <ClockCircleOutlined style={{ color: '#1890ff', marginRight: '8px' }} />
                        <Text>{selectedBatch.eta}</Text>
                      </div>
                    </div>
                    {selectedBatch.trackingNumber && (
                      <div className="user-info-item">
                        <div className="user-info-label">Seal Number</div>
                        <div className="user-info-value">
                          <Text strong>{selectedBatch.trackingNumber}</Text>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              </Col>
            </Row>

            {/* Jobs in Batch - Tabular View */}
            {selectedBatch.jobs && selectedBatch.jobs.length > 0 && (
              <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col span={24}>
                  <Card 
                    size="small" 
                    title={<span className="user-info-title">Jobs in Batch ({selectedBatch.jobs.length})</span>}
                    className="user-info-card"
                    style={{ 
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      borderRadius: 8
                    }}
                  >
                    <Table
                      columns={[
                        {
                          title: 'Job ID',
                          dataIndex: 'trackingId',
                          key: 'trackingId',
                          render: (text) => <Text strong>{text}</Text>,
                        },
                        {
                          title: 'Customer',
                          dataIndex: 'customer',
                          key: 'customer',
                          render: (customer) => customer?.name || 'N/A',
                        },
                        {
                          title: 'Status',
                          dataIndex: 'status',
                          key: 'status',
                          render: (status) => (
                            <Tag color={
                              status === 'delivered' ? 'green' :
                              status === 'batched' ? 'purple' :
                              status === 'shipped' ? 'blue' :
                              'default'
                            }>
                              {status?.replace(/_/g, ' ').toUpperCase()}
                            </Tag>
                          ),
                        },
                        {
                          title: 'Weight',
                          dataIndex: 'weight',
                          key: 'weight',
                          render: (weight) => `${weight || 0} kg`,
                        },
                        {
                          title: 'Value',
                          dataIndex: 'value',
                          key: 'value',
                          render: (value) => `£${value || 0}`,
                        },
                      ]}
                      dataSource={selectedBatch.jobs}
                      rowKey="id"
                      pagination={false}
                      size="small"
                      scroll={{ x: 'max-content' }}
                    />
                  </Card>
                </Col>
              </Row>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default BatchManagementPage;
