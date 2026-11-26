import React, { useEffect, useState } from 'react';
import { Form, Input, Modal, message } from 'antd';
import { jobAPI } from '../../utils/api';

/** Add an internal note to a job. Pass the job to open it, or null to close it. */
const JobNoteModal = ({ job, onClose, onAdded }) => {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (job) form.resetFields();
  }, [job, form]);

  const handleOk = async () => {
    const { note } = await form.validateFields();
    setSaving(true);
    try {
      await jobAPI.addNote(job.id, note.trim());
      message.success('Note added');
      onAdded?.();
      onClose();
    } catch (error) {
      message.error(error.message || 'Failed to add note');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={`Add Note - ${job?.trackingId || ''}`}
      open={!!job}
      onOk={() => handleOk().catch(() => {})}
      onCancel={onClose}
      okText="Add Note"
      confirmLoading={saving}
      forceRender
      zIndex={1100} // above the job details drawer it can be opened from
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="note"
          label="Note"
          extra="Visible to staff only. Customers do not see it on the tracking page."
          rules={[{ required: true, whitespace: true, message: 'Please enter a note' }]}
        >
          <Input.TextArea rows={4} maxLength={5000} placeholder="e.g. Customer asked to collect after 5pm" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default JobNoteModal;
