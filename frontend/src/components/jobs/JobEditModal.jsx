import React, { useEffect, useState } from 'react';
import { Alert, Button, Col, DatePicker, Form, Input, InputNumber, Modal, Row, Select, Spin, Upload, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { customerAPI, jobAPI } from '../../utils/api';
import { filesToUploads } from '../../utils/imageUpload';
import { FREIGHT_TYPES } from '../../utils/countryCodes';
import { canEditJobValue } from '../../utils/permissions';
import { useAuth } from '../../contexts/AuthContext';

const { TextArea } = Input;

const withCurrent = (options, current) => (current && !options.includes(current) ? [...options, current] : options);

/** Edit a job's details. Pass a job id to open it, or null to close it. */
const JobEditModal = ({ jobId, onClose, onSaved }) => {
  const { currentUser } = useAuth();
  const [form] = Form.useForm();
  const [job, setJob] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!jobId) return undefined;
    let cancelled = false;
    setJob(null);
    form.resetFields();

    Promise.all([
      jobAPI.getById(jobId),
      // The customer list is only needed to move the job to another customer
      customerAPI.getAll({ limit: 100 }).catch(() => ({ data: [] })),
    ])
      .then(([jobResponse, customerResponse]) => {
        if (cancelled) return;
        const loaded = jobResponse.data.job;
        const list = Array.isArray(customerResponse.data) ? customerResponse.data : customerResponse.data?.customers || [];
        const hasCurrent = list.some((customer) => customer.id === loaded.customerId);
        setCustomers(hasCurrent || !loaded.customer ? list : [loaded.customer, ...list]);
        setJob(loaded);
        form.setFieldsValue({
          referenceNumber: loaded.referenceNumber,
          customerId: loaded.customerId,
          pickupAddress: loaded.pickupAddress,
          deliveryAddress: loaded.deliveryAddress,
          receiverName: loaded.receiverName,
          receiverContact: loaded.receiverContact,
          receiverAddress: loaded.receiverAddress,
          freightType: loaded.freightType || undefined,
          priority: loaded.priority,
          pickupDate: loaded.pickupDate ? dayjs(loaded.pickupDate) : null,
          estimatedDelivery: loaded.estimatedDelivery ? dayjs(loaded.estimatedDelivery) : null,
          description: loaded.description,
          value: loaded.value != null ? Number(loaded.value) : null,
          specialInstructions: loaded.specialInstructions,
        });
      })
      .catch((error) => {
        if (cancelled) return;
        message.error(error.message || 'Failed to load job details');
        onClose();
      });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload only when another job is opened
  }, [jobId, form]);

  // `book`: finish a draft, so the job is booked (Pending Collection) and the customer is told
  const handleOk = async (book = false) => {
    const values = await form.validateFields();
    setSaving(true);
    try {
      const { description, value, documents, pickupDate, estimatedDelivery, ...details } = values;
      const response = await jobAPI.update(jobId, {
        ...details,
        pickupDate: pickupDate ? pickupDate.toISOString() : undefined,
        estimatedDelivery: estimatedDelivery ? estimatedDelivery.toISOString() : undefined,
        parcelDetails: { description, value: value ?? undefined },
        documents: await filesToUploads(documents),
        ...(book && { status: 'pending_collection' }),
      });
      message.success(book ? 'Job booked' : 'Job updated successfully!');

      const channel = new BroadcastChannel('job_updates');
      channel.postMessage({ type: 'JOB_STATUS_UPDATED', jobId, timestamp: new Date().toISOString() });
      channel.close();

      onSaved?.(response.data.job);
      onClose();
    } catch (error) {
      message.error(error.message || 'Failed to update job');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={job ? `Edit Job - ${job.trackingId}` : 'Edit Job'}
      open={!!jobId}
      onOk={() => handleOk().catch(() => {})}
      onCancel={onClose}
      okText="Save Changes"
      okButtonProps={{ disabled: !job }}
      footer={job?.status === 'draft' ? [
        <Button key="cancel" onClick={onClose}>Cancel</Button>,
        <Button key="draft" loading={saving} onClick={() => handleOk(false).catch(() => {})}>Save Draft</Button>,
        <Button key="book" type="primary" loading={saving} onClick={() => handleOk(true).catch(() => {})}>Save &amp; Book</Button>,
      ] : undefined}
      confirmLoading={saving}
      width={window.innerWidth <= 768 ? '95%' : 800}
      styles={{ body: { maxHeight: '70vh', overflowY: 'auto', paddingRight: 8 } }}
      forceRender
      zIndex={1100} // above the job details drawer it can be opened from
    >
      {!job && <div style={{ textAlign: 'center', padding: 32 }}><Spin /></div>}
      <Form form={form} layout="vertical" style={{ display: job ? 'block' : 'none' }}>
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message="Nothing is deleted when you edit. A field left blank keeps its saved value, and earlier values stay in the edit history."
        />
        <Row gutter={16}>
          <Col xs={24} sm={12}><Form.Item name="referenceNumber" label="Reference Number"><Input /></Form.Item></Col>
          <Col xs={24} sm={12}>
            <Form.Item name="customerId" label="Customer">
              <Select
                showSearch
                optionFilterProp="label"
                options={customers.map((customer) => ({ value: customer.id, label: customer.email ? `${customer.name} - ${customer.email}` : customer.name }))}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}><Form.Item name="pickupAddress" label="Pickup Address"><TextArea rows={2} /></Form.Item></Col>
          <Col xs={24} sm={12}><Form.Item name="deliveryAddress" label="Delivery Address"><TextArea rows={2} /></Form.Item></Col>
          <Col xs={24} sm={12}><Form.Item name="receiverName" label="Receiver Name"><Input /></Form.Item></Col>
          <Col xs={24} sm={12}><Form.Item name="receiverContact" label="Receiver Phone"><Input placeholder="e.g. +233 24 000 0000" /></Form.Item></Col>
          <Col xs={24}><Form.Item name="receiverAddress" label="Receiver Address"><TextArea rows={2} /></Form.Item></Col>
          <Col xs={24} sm={12}><Form.Item name="pickupDate" label="Pickup Date"><DatePicker style={{ width: '100%' }} allowClear={false} /></Form.Item></Col>
          <Col xs={24} sm={12}><Form.Item name="estimatedDelivery" label="Expected Delivery Date"><DatePicker style={{ width: '100%' }} allowClear={false} /></Form.Item></Col>
          <Col xs={24} sm={12}>
            <Form.Item name="priority" label="Priority">
              <Select options={withCurrent(['Standard', 'Express', 'Urgent'], job?.priority).map((value) => ({ value, label: value }))} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item name="freightType" label="Freight Type">
              <Select placeholder="Select freight type" options={withCurrent(Object.values(FREIGHT_TYPES), job?.freightType).map((value) => ({ value, label: value }))} />
            </Form.Item>
          </Col>
          <Col xs={24}><Form.Item name="description" label="Package Details"><TextArea rows={3} /></Form.Item></Col>
          {canEditJobValue(currentUser) && (
            <Col xs={24} sm={12}><Form.Item name="value" label="Estimated Value (£)"><InputNumber min={0} step={0.01} style={{ width: '100%' }} /></Form.Item></Col>
          )}
          <Col xs={24}><Form.Item name="specialInstructions" label="Special Instructions"><TextArea rows={2} /></Form.Item></Col>
          <Col xs={24}>
            <Form.Item
              name="documents"
              label="Add Files (optional)"
              valuePropName="fileList"
              getValueFromEvent={(event) => event?.fileList || []}
              extra="Added to the files already on this job. Photos are compressed; up to 3MB in total."
            >
              <Upload beforeUpload={() => false} maxCount={5} multiple>
                <Button icon={<UploadOutlined />}>Select Files</Button>
              </Upload>
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

export default JobEditModal;
