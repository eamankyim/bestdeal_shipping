import React, { useState } from 'react';
import { Select, Input, Modal, Form, message } from 'antd';

const { Option } = Select;

const DropdownWithOther = ({ 
  value, 
  onChange, 
  options, 
  placeholder = 'Select...',
  allowOther = true,
  style,
  ...rest 
}) => {
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customValue, setCustomValue] = useState('');
  const [form] = Form.useForm();

  const handleSelect = (selectedValue) => {
    if (selectedValue === 'OTHER' && allowOther) {
      setShowCustomModal(true);
    } else {
      onChange(selectedValue);
    }
  };

  const handleCustomSubmit = () => {
    if (!customValue.trim()) {
      message.error('Please enter a value');
      return;
    }
    
    onChange(customValue.trim());
    setCustomValue('');
    setShowCustomModal(false);
    message.success('Custom value saved');
  };

  return (
    <>
      <Select
        value={value}
        onChange={handleSelect}
        placeholder={placeholder}
        style={style}
        {...rest}
      >
        {options.map((option) => (
          <Option key={option} value={option}>
            {option}
          </Option>
        ))}
        {allowOther && <Option value="OTHER">Other...</Option>}
      </Select>

      <Modal
        title="Enter Custom Value"
        open={showCustomModal}
        onOk={handleCustomSubmit}
        onCancel={() => {
          setShowCustomModal(false);
          setCustomValue('');
        }}
        okText="Save"
        cancelText="Cancel"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="Custom Value"
            rules={[{ required: true, message: 'Please enter a value' }]}
          >
            <Input
              placeholder="Enter custom value"
              value={customValue}
              onChange={(e) => setCustomValue(e.target.value)}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default DropdownWithOther;




