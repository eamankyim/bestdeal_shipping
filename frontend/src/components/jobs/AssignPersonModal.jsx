import React, { useEffect, useState } from 'react';
import { Form, Modal, Select, Typography, message } from 'antd';
import { authAPI, jobAPI } from '../../utils/api';
import { formatJobStatusLabel } from '../../constants/jobStatuses';

// Assigning a driver makes a job Assigned; assigning a dispatch rider makes it Out for Delivery
const KINDS = {
  driver: {
    role: 'driver',
    title: 'Assign Driver',
    field: 'Driver',
    none: 'No drivers yet. Invite one from Settings.',
    becomes: 'assigned',
    assign: (job, id) => jobAPI.assignDriver(job.id, id),
    current: (job) => job.assignedDriver?.id || job.assignedDriverId,
  },
  rider: {
    role: 'delivery-agent',
    title: 'Assign Dispatch Rider',
    field: 'Dispatch rider',
    none: 'No dispatch riders yet. Invite one from Settings.',
    becomes: 'out_for_delivery',
    assign: (job, id) => jobAPI.assignDeliveryAgent(job.id, id),
    current: (job) => job.assignedDeliveryAgent?.id || job.assignedDeliveryAgentId,
  },
};

/** Give a job to a driver or a dispatch rider. Pass the job and `kind` ('driver' | 'rider') to open it. */
const AssignPersonModal = ({ job, kind, onClose, onDone }) => {
  const [form] = Form.useForm();
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const settings = KINDS[kind] || KINDS.driver;
  const open = Boolean(job && kind);

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    form.setFieldsValue({ personId: settings.current(job) || undefined });
    setLoading(true);
    authAPI.getUsers({ role: settings.role, status: 'active' })
      .then((response) => setPeople(response.data?.users || []))
      .catch((error) => message.error(error.message || 'Failed to load the team'))
      .finally(() => setLoading(false));
  }, [open, job, settings, form]);

  const handleOk = async () => {
    const { personId } = await form.validateFields();
    setSaving(true);
    try {
      await settings.assign(job, personId);
      message.success(`${job.trackingId} assigned to ${people.find((person) => person.id === personId)?.name}`);
      onDone?.();
      onClose();
    } catch (error) {
      message.error(error.message || `Failed to assign the ${settings.field.toLowerCase()}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={`${settings.title} - ${job?.trackingId || ''}`}
      open={open}
      onOk={() => handleOk().catch(() => {})}
      onCancel={onClose}
      okText="Assign"
      confirmLoading={saving}
      forceRender
      zIndex={1100} // above the job details drawer it is opened from
    >
      <Form form={form} layout="vertical">
        <Form.Item name="personId" label={settings.field} rules={[{ required: true, message: `Please choose a ${settings.field.toLowerCase()}` }]}>
          <Select
            placeholder={`Choose a ${settings.field.toLowerCase()}`}
            loading={loading}
            showSearch
            optionFilterProp="label"
            notFoundContent={loading ? 'Loading...' : settings.none}
            options={people.map((person) => ({ value: person.id, label: person.phone ? `${person.name} (${person.phone})` : person.name }))}
          />
        </Form.Item>
      </Form>
      <Typography.Text type="secondary">
        The job becomes {formatJobStatusLabel(settings.becomes)} and they are notified.
      </Typography.Text>
    </Modal>
  );
};

export default AssignPersonModal;
