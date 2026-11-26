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
  Select,
  DatePicker,
  Typography,
  Tag,
  Space,
  message,
  Progress,
  Badge,
  Drawer,
  Tabs,
  Statistic,
} from 'antd';
import dayjs from 'dayjs';
import {
  PlusOutlined,
  CarOutlined,
  RocketOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  EditOutlined,
  InboxOutlined,
  DollarOutlined,
  ApartmentOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import {
  batchStatusList, canCreateBatch, canEditBatch, formatBatchStatusLabel, formatJobStatusLabel, getBatchStatusColor, getStatusColor, nextBatchStatuses,
} from '../constants/jobStatuses';
import { itemCount, lineLabel, linesOf } from '../utils/packages';
import SplitChooser, { allNow, isPartial } from '../components/jobs/SplitChooser';
import BatchSummaryModal from '../components/batches/BatchSummaryModal';
import { jobAPI, batchAPI } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import ResponsiveTable from '../components/common/ResponsiveTable';
import { hasPermission } from '../utils/permissions';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

// Row shape of the "Select Jobs" table
const toSelectableJob = (job) => ({
  key: job.id,
  id: job.id,
  jobId: job.trackingId,
  trackingId: job.trackingId,
  partNumber: job.partNumber,
  packages: job.packages,
  quantity: job.quantity,
  description: job.description,
  customer: job.customer?.name || 'N/A',
  deliveryAddress: job.deliveryAddress,
  weight: Number(job.weight) || 0,
  value: Number(job.value) || 0,
  priority: job.priority || 'Standard',
});


const formatDate = (date) => (date ? new Date(date).toLocaleDateString() : 'Not set');

const BatchManagementPage = () => {
  const { currentUser } = useAuth();
  const canViewRevenue = hasPermission(currentUser, 'financial:view');
  // Making and editing batches is for the office and the UK warehouse; the Ghana warehouse marks them arrived
  const canManage = canCreateBatch();
  const [batchModalVisible, setBatchModalVisible] = useState(false);
  const [isDetailsDrawerVisible, setIsDetailsDrawerVisible] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [selectedParcels, setSelectedParcels] = useState([]);
  // Jobs going only in part: { jobId: [how many of each item line go in this batch] }
  const [splits, setSplits] = useState({});
  const [choosing, setChoosing] = useState(null); // { job, going } while choosing items
  // Ready to Ship and Shipped are confirmed on a full summary of the batch first
  const [confirming, setConfirming] = useState(null);
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
      
      const response = await jobAPI.getAll({ status: 'at_uk_warehouse', limit: 100 });

      if (response.success && response.data) {
        const rawJobs = Array.isArray(response.data) ? response.data : response.data.jobs || [];
        const readyJobs = rawJobs.filter((job) => !job.batchId);
        
        // Transform to table format
        const transformedJobs = readyJobs.map(toSelectableJob);
        
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
          name: batch.name || batch.destination || 'N/A',
          destination: batch.destination,
          route: batch.route,
          status: batch.status,
          totalParcels: batch.totalJobs || 0,
          totalWeight: `${batch.totalWeight || 0} kg`,
          totalValue: batch.totalValue || 0,
          vessel: batch.carrier || 'N/A',
          departureDate: formatDate(batch.estimatedShipDate),
          eta: formatDate(batch.estimatedArrival),
          // Unformatted values, for the edit form
          carrier: batch.carrier,
          estimatedShipDate: batch.estimatedShipDate,
          estimatedArrival: batch.estimatedArrival,
          // How far along the batch is, by its place in the backend's list of batch statuses
          progress: Math.round(((batchStatusList().findIndex((item) => item.key === batch.status) + 1) / Math.max(batchStatusList().length, 1)) * 100),
          jobs: batch.jobs || [],
          trackingNumber: batch.trackingNumber,
          sealNumber: batch.sealNumber,
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

  // Vessel/flight options: MSC (not MD Sea); custom field allowed
  const vesselOptions = [
    { value: 'MSC', label: 'MSC (Sea)', type: 'Sea' },
    { value: 'MSC Express', label: 'MSC Express (Sea)', type: 'Sea' },
    { value: 'BA Flight 123', label: 'BA Flight 123 (Air)', type: 'Air' },
    { value: 'AF Flight 456', label: 'AF Flight 456 (Air)', type: 'Air' },
    { value: '__custom__', label: 'Other (enter below)', type: 'Custom' }
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
          {formatBatchStatusLabel(status)}
        </Tag>
      ),
    },
    {
      title: 'Jobs',
      dataIndex: 'totalParcels',
      key: 'totalParcels',
      render: (count, record) => (
        <Space direction="vertical" size={0}>
          <Badge count={count} style={{ backgroundColor: '#1890ff' }} />
          {record.trackingNumber && (
            <Text type="secondary" style={{ fontSize: '12px' }}>Container: {record.trackingNumber}</Text>
          )}
        </Space>
      ),
      mobile: true,
    },
    {
      title: 'Container #',
      dataIndex: 'trackingNumber',
      key: 'containerNumber',
      mobile: false,
      render: (text) => text ? <Text strong>{text}</Text> : '—',
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

  const inThisBatch = (row) => (selectedBatch?.jobs || []).some((job) => job.id === row.id);
  const goingLines = (row) => linesOf(row).map((line, index) => ({ ...line, quantity: splits[row.id] ? splits[row.id][index] : Number(line.quantity) || 1 }));
  const goingWeight = (row) => (splits[row.id] ? goingLines(row).reduce((sum, line) => sum + (Number(line.weight) || 0) * line.quantity, 0) : row.weight);
  const goingValue = (row) => (splits[row.id] && goingLines(row).every((line) => line.estimatedPrice != null)
    ? goingLines(row).reduce((sum, line) => sum + Number(line.estimatedPrice) * line.quantity, 0)
    : row.value);

  const jobSelectionColumns = [
    {
      title: 'Tracking ID',
      dataIndex: 'trackingId',
      key: 'trackingId',
      render: (text, row) => (
        <Space size={4}>
          <Text strong>{text}</Text>
          {row.partNumber && <Tag>Part {row.partNumber}</Tag>}
        </Space>
      ),
    },
    {
      title: 'Items',
      key: 'items',
      render: (_, row) => {
        const total = itemCount(row);
        const going = splits[row.id];
        const canChoose = canManage && selectedParcels.includes(row.id) && !inThisBatch(row) && total > 1;
        return (
          <Space direction="vertical" size={2}>
            <Text>{going ? goingLines(row).filter((line) => line.quantity > 0).map(lineLabel).join(', ') : (row.description || `${total} item${total === 1 ? '' : 's'}`)}</Text>
            {going && <Tag color="orange">{going.reduce((sum, count) => sum + count, 0)} of {total} items go now</Tag>}
            {canChoose && (
              <Button size="small" onClick={(event) => { event.stopPropagation(); setChoosing({ job: row, going: going || allNow(row) }); }}>
                {going ? 'Change items' : 'Send only some items'}
              </Button>
            )}
          </Space>
        );
      },
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
      render: (_, row) => `${Math.round(goingWeight(row) * 100) / 100} kg`,
    },
    {
      title: 'Value',
      dataIndex: 'value',
      key: 'value',
      render: (_, row) => `£${Number(goingValue(row)).toFixed(2)}`,
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
    if (!canManage) return;
    setSelectedBatch(null);
    setSelectedParcels([]);
    setSplits({});
    batchForm.resetFields();
    setBatchModalVisible(true);
  };

  const handleViewBatch = (batch) => {
    setSelectedBatch(batch);
    setIsDetailsDrawerVisible(true);
  };

  const handleEditBatch = (batch) => {
    if (!canEditBatch(batch)) return;
    setSelectedBatch(batch);
    setSelectedParcels(batch.jobs?.map(j => j.id) || []);
    setSplits({});

    const isListedVessel = vesselOptions.some(option => option.value === batch.carrier);
    batchForm.resetFields();
    batchForm.setFieldsValue({
      name: batch.name,
      route: batch.route,
      vessel: !batch.carrier ? undefined : isListedVessel ? batch.carrier : '__custom__',
      vesselCustom: isListedVessel ? undefined : batch.carrier,
      containerNumber: batch.trackingNumber,
      sealNumber: batch.sealNumber,
      departureDate: batch.estimatedShipDate ? dayjs(batch.estimatedShipDate) : null,
      eta: batch.estimatedArrival ? dayjs(batch.estimatedArrival) : null,
      notes: batch.notes,
    });
    setBatchModalVisible(true);
  };

  const handleUpdateBatchStatus = async (newStatus) => {
    if (!selectedBatch) return;
    const statusLabel = formatBatchStatusLabel(newStatus);
    
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


  const handleBatchSubmit = async (values) => {
    setCreatingBatch(true);
    const isEditing = !!selectedBatch;
    
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
        vessel: values.vessel === '__custom__' ? (values.vesselCustom || '') : values.vessel,
        containerNumber: values.containerNumber,
        sealNumber: values.sealNumber,
        departureDate: values.departureDate ? values.departureDate.toISOString() : null,
        eta: values.eta ? values.eta.toISOString() : null,
        notes: values.notes,
        jobs: selectedParcels, // Array of selected job IDs
        // Jobs going only in part are split as the batch is saved (the rest waits as a new part)
        split: Object.fromEntries(Object.entries(splits).filter(([jobId]) => selectedParcels.includes(jobId))),
      };
      
      message.loading({ content: isEditing ? 'Updating batch...' : 'Creating batch...', key: 'batchCreate' });
      
      const response = isEditing
        ? await batchAPI.update(selectedBatch.id, batchData)
        : await batchAPI.create(batchData);
      
      if (response.success) {
        message.success({ 
          content: isEditing
            ? `Batch ${selectedBatch.batchId} updated successfully!`
            : `Batch created successfully! ${response.data.jobsUpdated} jobs updated to "Batched" status.`, 
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
        
        if (response.data.parts?.length) {
          message.info(`${response.data.parts.map((part) => `${part.trackingId} (${part.description})`).join(', ')} wait for a later batch`, 6);
        }
        setBatchModalVisible(false);
        batchForm.resetFields();
        setSelectedBatch(null);
        setSelectedParcels([]);
        setSplits({});
        
        // Refresh available jobs (batched jobs should be removed)
        await fetchAvailableJobs();
        
        // Refresh batches list
        await fetchBatches();
      } else {
        message.error({ content: response.message || 'Failed to save batch', key: 'batchCreate', duration: 3 });
      }
    } catch (error) {
      console.error('❌ Failed to save batch:', error);
      message.error({ content: error.message || 'Failed to save batch. Please try again.', key: 'batchCreate', duration: 3 });
    } finally {
      setCreatingBatch(false);
    }
  };

  // When editing, the batch's own jobs are listed first so they can be kept or taken out
  const selectableJobs = [
    ...(batchModalVisible && selectedBatch ? (selectedBatch.jobs || []).map(toSelectableJob) : []),
    ...availableJobs,
  ].filter((job, index, list) => list.findIndex(other => other.key === job.key) === index);

  const selectedJobs = selectableJobs.filter(j => selectedParcels.includes(j.key));
  const calculateTotalWeight = () => selectedJobs.reduce((sum, j) => sum + goingWeight(j), 0).toFixed(1);
  const calculateTotalValue = () => selectedJobs.reduce((sum, j) => sum + Number(goingValue(j)), 0).toFixed(2);

  const tabItems = [
    {
      key: 'batches',
      label: 'Batch Management',
      children: (
        <div>
          {canManage && (
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
          {!canManage && (
            <div style={{ marginBottom: '16px', padding: '12px', background: '#f0f0f0', borderRadius: '4px' }}>
              <Text type="secondary" style={{ fontSize: '14px' }}>
                <EyeOutlined /> Batches are made at the UK warehouse. Open a batch that has shipped to mark it {formatBatchStatusLabel('arrived')}.
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

      {/* Create/Edit Batch Modal - only for those who make batches */}
      {canManage && (
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
                  rules={[{ required: !selectedBatch, message: 'Please enter batch name' }]}
                >
                  <Input placeholder="e.g., Accra Express Batch" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="route"
                  label="Route"
                  rules={[{ required: !selectedBatch, message: 'Please select route' }]}
                >
                  <Select placeholder="Select route">
                    <Option value="London → Accra">London → Accra</Option>
                    <Option value="London → Accra → Kumasi">London → Accra → Kumasi</Option>
                    <Option value="London → Accra → Tamale">London → Accra → Tamale</Option>
                    {/* A route entered in the mobile app */}
                    {selectedBatch?.route && !['London → Accra', 'London → Accra → Kumasi', 'London → Accra → Tamale'].includes(selectedBatch.route) && (
                      <Option value={selectedBatch.route}>{selectedBatch.route}</Option>
                    )}
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
                  rules={[{ required: !selectedBatch, message: 'Please select vessel/flight' }]}
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
                  label="Container Number"
                  rules={[{ required: !selectedBatch, message: 'Please enter the container number!' }]}
                >
                  <Input placeholder="e.g. MSCU1234567" />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item name="sealNumber" label="Seal Number" extra="The number on the container's seal. You can add it later.">
                  <Input placeholder="e.g. SL0012345" />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item noStyle shouldUpdate={(prev, curr) => prev.vessel !== curr.vessel}>
              {({ getFieldValue }) =>
                getFieldValue('vessel') === '__custom__' ? (
                  <Form.Item
                    name="vesselCustom"
                    label="Custom Vessel/Flight Name"
                    rules={[{ required: true, message: 'Please enter vessel or flight name' }]}
                  >
                    <Input placeholder="e.g., MSC Olympia, Flight BA 456" />
                  </Form.Item>
                ) : null
              }
            </Form.Item>
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
              dataSource={selectableJobs}
              loading={loading}
              pagination={false}
              scroll={{ y: 300 }}
              size="small"
              locale={{
                emptyText: 'No jobs available for batching. Jobs must have "Arrived At Hub" status to be ready for batching.'
              }}
            />
          </Card>

          <Modal
            title={`Which items go in this batch? - ${choosing?.job.trackingId || ''}`}
            open={Boolean(choosing)}
            onCancel={() => setChoosing(null)}
            zIndex={1100}
            okText="Use These"
            okButtonProps={{ disabled: !choosing || choosing.going.every((count) => count === 0) }}
            onOk={() => {
              const { job, going } = choosing;
              setSplits((current) => {
                const next = { ...current };
                if (isPartial(job, going)) next[job.id] = going; else delete next[job.id];
                return next;
              });
              setChoosing(null);
            }}
          >
            <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
              What doesn't go now becomes a new part of the same order, with its own tracking number and invoice, waiting at the UK warehouse for a later batch.
            </Text>
            {choosing && (
              <SplitChooser
                lines={linesOf(choosing.job)}
                value={choosing.going}
                onChange={(going) => setChoosing((current) => ({ ...current, going }))}
                nowLabel="In this batch"
                laterLabel="Later batch"
              />
            )}
          </Modal>

          {selectedBatch && (
            <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
              Blank fields keep their saved value. Jobs you untick go back to the warehouse; nothing is deleted. Only jobs you add now can be sent in part.
            </Text>
          )}

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
                icon={!creatingBatch && (selectedBatch ? <EditOutlined /> : <PlusOutlined />)}
              >
                {creatingBatch ? 'Saving...' : (selectedBatch ? 'Update Batch' : 'Create Batch')}
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
          selectedBatch && (
            <Space wrap>
              {nextBatchStatuses(selectedBatch).map((status) => (
                <Button
                  key={status}
                  type={status === 'in_preparation' ? 'default' : 'primary'}
                  loading={shippingBatch}
                  onClick={() => (['ready_to_ship', 'shipped'].includes(status) ? setConfirming(status) : handleUpdateBatchStatus(status))}
                >
                  {status === 'in_preparation' ? 'Back to In Preparation' : `Mark as ${formatBatchStatusLabel(status)}`}
                </Button>
              ))}
              {canEditBatch(selectedBatch) && (
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
                <Text strong style={{ width: '140px', color: '#8c8c8c' }}>Batch Name</Text>
                <Text>{selectedBatch.name}</Text>
              </div>
              <div style={{ display: 'flex', padding: '8px 0' }}>
                <Text strong style={{ width: '140px', color: '#8c8c8c' }}>Destination</Text>
                <Text>{selectedBatch.destination || 'N/A'}</Text>
              </div>
              {selectedBatch.notes && (
                <div style={{ display: 'flex', padding: '8px 0' }}>
                  <Text strong style={{ width: '140px', color: '#8c8c8c', flexShrink: 0 }}>Notes</Text>
                  <Text style={{ whiteSpace: 'pre-wrap' }}>{selectedBatch.notes}</Text>
                </div>
              )}
              <div style={{ display: 'flex', padding: '8px 0' }}>
                <Text strong style={{ width: '140px', color: '#8c8c8c' }}>Status</Text>
                <Tag color={getBatchStatusColor(selectedBatch.status)}>
                  {formatBatchStatusLabel(selectedBatch.status)}
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
                        <div className="user-info-label">Container Number</div>
                        <div className="user-info-value">
                          <Text strong>{selectedBatch.trackingNumber}</Text>
                        </div>
                      </div>
                    )}
                    {selectedBatch.sealNumber && (
                      <div className="user-info-item">
                        <div className="user-info-label">Seal Number</div>
                        <div className="user-info-value">
                          <Text strong>{selectedBatch.sealNumber}</Text>
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
                            <Tag color={getStatusColor(status)}>
                              {formatJobStatusLabel(status)}
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
      <BatchSummaryModal
        batch={confirming ? selectedBatch : null}
        status={confirming}
        showValue={canViewRevenue}
        loading={shippingBatch}
        onCancel={() => setConfirming(null)}
        onConfirm={async () => {
          await handleUpdateBatchStatus(confirming);
          setConfirming(null);
        }}
      />
    </div>
  );
};

export default BatchManagementPage;
