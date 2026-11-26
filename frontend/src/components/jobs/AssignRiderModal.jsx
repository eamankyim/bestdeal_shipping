import React, { useEffect, useState } from 'react';
import { Form, Modal, Select, Typography, message } from 'antd';
import { authAPI, jobAPI } from '../../utils/api';

/** Hand a job to a dispatch rider (delivery agent). Pass the job to open it, or null to close it. */
const AssignRiderModal = ({ job, onClose, onAssigned }) => {
  const [form] = Form.useForm();
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!job) return;
    form.resetFields();
    form.setFieldsValue({ riderId: job.assignedDeliveryAgentId || job.assignedDeliveryAgent?.id || undefined });
    setLoading(true);
    authAPI.getUsers()
      .then((response) => {
        const users = response.data?.users || [];
        setRiders(users.filter((user) => ['delivery-agent', 'delivery_agent'].includes(user.role) && user.active !== false));
      })
      .catch((error) => message.error(error.message || 'Failed to load dispatch riders'))
      .finally(() => setLoading(false));
  }, [job, form]);

  const handleOk = async () => {
    const { riderId } = await form.validateFields();
    setSaving(true);
    try {
      await jobAPI.assignDeliveryAgent(job.id, riderId);
      message.success(`${job.trackingId} assigned to ${riders.find((rider) => rider.id === riderId)?.name}`);
      onAssigned?.();
      onClose();
    } catch (error) {
      message.error(error.message || 'Failed to assign dispatch rider');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={`Assign Dispatch Rider - ${job?.trackingId || ''}`}
      open={!!job}
      onOk={() => handleOk().catch(() => {})}
      onCancel={onClose}
      okText="Assign"
      confirmLoading={saving}
      forceRender
      zIndex={1100} // above the job details drawer it can be opened from
    >
      <Form form={form} layout="vertical">
        <Form.Item name="riderId" label="Dispatch Rider" rules={[{ required: true, message: 'Please choose a dispatch rider' }]}>
          <Select
            placeholder="Choose a dispatch rider"
            loading={loading}
            showSearch
            optionFilterProp="label"
            notFoundContent={loading ? 'Loading...' : 'No delivery agents yet. Invite one from Settings.'}
            options={riders.map((rider) => ({ value: rider.id, label: rider.phone ? `${rider.name} (${rider.phone})` : rider.name }))}
          />
        </Form.Item>
      </Form>
      <Typography.Text type="secondary">The job moves to Out for Delivery and the rider is notified.</Typography.Text>
    </Modal>
  );
};

export default AssignRiderModal;
