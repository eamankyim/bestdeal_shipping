import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, message } from 'antd';
import { UndoOutlined } from '@ant-design/icons';

const { Option } = Select;
const { TextArea } = Input;

const StatusRevertModal = ({ 
  visible, 
  onCancel, 
  onOk, 
  currentStatus,
  jobHistory = [],
  loading = false 
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (visible) {
      form.resetFields();
    }
  }, [visible, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      
      if (!values.previousStatus) {
        message.error('Please select a previous status to revert to');
        return;
      }
      
      if (!values.comment || values.comment.trim() === '') {
        message.error('Please provide a reason for reverting the status');
        return;
      }
      
      await onOk({
        previousStatus: values.previousStatus,
        comment: values.comment,
      });
      
      form.resetFields();
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  // Get previous statuses from job history
  const previousStatuses = jobHistory
    .map(item => item.status)
    .filter((status, index, self) => self.indexOf(status) === index && status !== currentStatus)
    .reverse(); // Most recent first

  return (
    <Modal
      title={
        <span>
          <UndoOutlined style={{ marginRight: 8 }} />
          Revert Job Status
        </span>
      }
      open={visible}
      onOk={handleOk}
      onCancel={handleCancel}
      confirmLoading={loading}
      okText="Revert Status"
      cancelText="Cancel"
      okButtonProps={{ danger: true }}
      width={600}
    >
      <Form
        form={form}
        layout="vertical"
      >
        <div style={{ marginBottom: 16, padding: 12, backgroundColor: '#fff7e6', borderRadius: 4, border: '1px solid #ffd591' }}>
          <strong>Current Status: </strong>
          <span style={{ color: '#d46b08' }}>{currentStatus}</span>
        </div>

        <Form.Item
          name="previousStatus"
          label="Revert To Status"
          rules={[{ required: true, message: 'Please select a status to revert to!' }]}
        >
          <Select placeholder="Select previous status">
            {previousStatuses.map(status => (
              <Option key={status} value={status}>
                {status}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="comment"
          label="Reason for Revert *"
          rules={[
            { required: true, message: 'Please provide a reason for reverting the status!' },
            { min: 10, message: 'Reason must be at least 10 characters' }
          ]}
        >
          <TextArea 
            rows={4} 
            placeholder="Explain why you are reverting this job status..."
          />
        </Form.Item>

        <div style={{ marginTop: 16, padding: 12, backgroundColor: '#fff1f0', borderRadius: 4, border: '1px solid #ffccc7' }}>
          <strong style={{ color: '#cf1322' }}>⚠️ Warning:</strong>
          <p style={{ margin: '8px 0 0', color: '#cf1322' }}>
            Reverting a job status will change the current status back to a previous state. 
            This action will be logged and may affect job tracking and reporting.
          </p>
        </div>
      </Form>
    </Modal>
  );
};

export default StatusRevertModal;



<<<<<<< HEAD
=======

>>>>>>> origin/master
