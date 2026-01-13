import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Upload, Button, Select, Space, Checkbox } from 'antd';
import { UploadOutlined, UserOutlined } from '@ant-design/icons';

const { TextArea } = Input;
const { Option } = Select;

const StatusUpdateModal = ({ 
  visible, 
  onCancel, 
  onOk, 
  currentStatus,
  nextStatuses = [],
  loading = false,
  teamMembers = [],
  allowReassignment = true,
}) => {
  const [form] = Form.useForm();
  const [documentFile, setDocumentFile] = useState(null);
  const [reassignJob, setReassignJob] = useState(false);

  useEffect(() => {
    if (visible) {
      form.setFieldsValue({
        reassignJob: false,
        assignedTo: null,
      });
      setReassignJob(false);
    }
  }, [visible, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      
      // Get the document file if uploaded
      const file = documentFile;
      
      // Prepare update data
      const updateData = {
        status: values.status,
        comment: values.comment || '',
        document: file,
        reassignTo: reassignJob && values.assignedTo ? values.assignedTo : null,
      };
      
      // Call parent's onOk with status, notes, document, and reassignment
      await onOk(updateData);
      
      // Reset form
      form.resetFields();
      setDocumentFile(null);
      setReassignJob(false);
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setDocumentFile(null);
    onCancel();
  };

  const handleFileChange = (info) => {
    if (info.fileList.length > 0) {
      const file = info.file.originFileObj || info.file;
      setDocumentFile(file);
    } else {
      setDocumentFile(null);
    }
  };

  return (
    <Modal
      title="Update Job Status"
      open={visible}
      onOk={handleOk}
      onCancel={handleCancel}
      confirmLoading={loading}
      okText="Update Status"
      cancelText="Cancel"
      width={600}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          status: nextStatuses[0] || currentStatus,
        }}
      >
        <Form.Item
          name="status"
          label="New Status"
          rules={[{ required: true, message: 'Please select a status!' }]}
        >
          <Select placeholder="Select status">
            {nextStatuses.map(status => (
              <Option key={status} value={status}>
                {status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="comment"
          label="Comment (Optional)"
        >
          <TextArea 
            rows={3} 
            placeholder="Add any notes or comments about this status update"
          />
        </Form.Item>

        <Form.Item
          label="Attach Document (Optional)"
        >
          <Upload
            beforeUpload={() => false}
            maxCount={1}
            onChange={handleFileChange}
            fileList={documentFile ? [{
              uid: '-1',
              name: documentFile.name,
              status: 'done',
            }] : []}
          >
            <Button icon={<UploadOutlined />}>Select Document</Button>
          </Upload>
        </Form.Item>

        {allowReassignment && teamMembers.length > 0 && (
          <>
            <Form.Item>
              <Checkbox 
                checked={reassignJob}
                onChange={(e) => {
                  setReassignJob(e.target.checked);
                  if (!e.target.checked) {
                    form.setFieldsValue({ assignedTo: null });
                  }
                }}
              >
                Reassign Job to Different Team Member
              </Checkbox>
            </Form.Item>

            {reassignJob && (
              <Form.Item
                name="assignedTo"
                label="Assign To"
                rules={reassignJob ? [{ required: true, message: 'Please select a team member!' }] : []}
              >
                <Select 
                  placeholder="Select team member"
                  showSearch
                  allowClear
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    (option.children?.props?.children?.[1] || option.children || '').toLowerCase().includes(input.toLowerCase())
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
                        {member.name} - {member.role?.replace('-', ' ').toUpperCase() || 'N/A'}
                      </Space>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            )}
          </>
        )}
      </Form>
    </Modal>
  );
};

export default StatusUpdateModal;

