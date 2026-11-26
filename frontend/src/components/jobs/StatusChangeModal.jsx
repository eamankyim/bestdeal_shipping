import React, { useEffect, useState } from 'react';
import { Form, Input, Modal, Typography, message } from 'antd';
import PhotoUpload from '../common/PhotoUpload';
import { jobAPI } from '../../utils/api';
import { filesToUploads } from '../../utils/imageUpload';
import { formatJobStatusLabel, jobStatusInfo, moveRules } from '../../constants/jobStatuses';

const PHOTO_LABELS = {
  collected: 'Photos of the collected items',
  delivered: 'Photo of the item being delivered',
};

/**
 * Moves a job to a status. Whether a reason or photos are needed is decided by the backend
 * (constants/jobStatuses.js → moveRules). Pass `job` and `status` to open it.
 */
const StatusChangeModal = ({ job, status, onClose, onDone }) => {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const open = Boolean(job && status);
  const rules = moveRules(status);
  const label = formatJobStatusLabel(status);
  const cancelling = status === 'cancelled';

  useEffect(() => {
    if (open) form.resetFields();
  }, [open, form]);

  const handleOk = async () => {
    const values = await form.validateFields();
    setSaving(true);
    try {
      await jobAPI.updateStatus(job.id, {
        status,
        notes: values.notes?.trim() || '',
        proofImages: await filesToUploads(values.photos || []),
      });
      message.success(cancelling ? `${job.trackingId} cancelled` : `${job.trackingId} marked as ${label}`);
      onDone?.();
      onClose();
    } catch (error) {
      message.error(error.message || `Could not mark as ${label}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={`${cancelling ? 'Cancel Job' : `Mark as ${label}`} - ${job?.trackingId || ''}`}
      open={open}
      onOk={() => handleOk().catch(() => {})}
      onCancel={onClose}
      okText={cancelling ? 'Cancel Job' : `Mark as ${label}`}
      cancelText={cancelling ? 'Keep Job' : 'Close'}
      okButtonProps={{ danger: cancelling || Boolean(jobStatusInfo(status)?.problem) }}
      confirmLoading={saving}
      forceRender
      zIndex={1100} // above the job details drawer it is opened from
    >
      {jobStatusInfo(status)?.description && (
        <Typography.Paragraph type="secondary">{jobStatusInfo(status).description}.</Typography.Paragraph>
      )}
      <Form form={form} layout="vertical">
        <Form.Item
          name="photos"
          label={rules.photos ? PHOTO_LABELS[status] || 'Photos' : 'Photos (optional)'}
          extra={rules.photos ? 'At least one photo is needed. Everyone on the team can see it on the job.' : undefined}
          rules={rules.photos ? [{ required: true, type: 'array', min: 1, message: 'Please add at least one photo' }] : []}
        >
          <PhotoUpload maxCount={5} />
        </Form.Item>
        <Form.Item
          name="notes"
          label={rules.reason ? 'Reason' : 'Comment (optional)'}
          rules={rules.reason ? [{ required: true, whitespace: true, message: 'Please give a reason' }] : []}
        >
          <Input.TextArea rows={3} maxLength={1000} placeholder={rules.reason ? 'What happened?' : 'e.g. Received by Ama'} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default StatusChangeModal;
