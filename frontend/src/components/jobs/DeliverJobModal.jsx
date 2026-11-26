import React, { useEffect, useState } from 'react';
import { Form, Input, Modal, message } from 'antd';
import PhotoUpload from '../common/PhotoUpload';
import { jobAPI } from '../../utils/api';
import { filesToUploads } from '../../utils/imageUpload';

/** Mark a job delivered, with a photo of what was handed over. Pass the job to open it, or null to close it. */
const DeliverJobModal = ({ job, onClose, onDelivered }) => {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (job) form.resetFields();
  }, [job, form]);

  const handleOk = async () => {
    const values = await form.validateFields();
    setSaving(true);
    try {
      await jobAPI.updateStatus(job.id, {
        status: 'delivered',
        notes: values.notes?.trim() || 'Delivered',
        proofImages: await filesToUploads(values.photos),
      });
      message.success('Job marked as Delivered');
      onDelivered?.();
      onClose();
    } catch (error) {
      message.error(error.message || 'Failed to mark as delivered');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={`Mark as Delivered - ${job?.trackingId || ''}`}
      open={!!job}
      onOk={() => handleOk().catch(() => {})}
      onCancel={onClose}
      okText="Confirm Delivery"
      confirmLoading={saving}
      forceRender
      zIndex={1100} // above the job details drawer it can be opened from
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="photos"
          label="Photo of the item being delivered"
          extra="At least one photo is required. Everyone on the team can see it on the job."
          rules={[{ required: true, type: 'array', min: 1, message: 'Please take a photo of the item' }]}
        >
          <PhotoUpload maxCount={5} />
        </Form.Item>
        <Form.Item name="notes" label="Comment (optional)" extra="For comments only staff should see, use Add Note instead.">
          <Input.TextArea rows={2} placeholder="e.g. Received by Ama" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default DeliverJobModal;
