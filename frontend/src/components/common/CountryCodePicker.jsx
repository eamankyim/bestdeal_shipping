import React, { useState } from 'react';
import { Select, Input, Space, Button, Modal, Form, message } from 'antd';
import { COUNTRY_CODES } from '../../utils/countryCodes';

const { Option } = Select;

const CountryCodePicker = ({ value, onChange, style, disabled }) => {
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customCode, setCustomCode] = useState('');
  const [form] = Form.useForm();

  const handleSelect = (code) => {
    if (code === 'OTHER') {
      setShowCustomModal(true);
    } else {
      onChange(code);
    }
  };

  const handleCustomSubmit = () => {
    if (!customCode.trim()) {
      message.error('Please enter a country code');
      return;
    }
    
    // Validate format (should start with +)
    if (!customCode.startsWith('+')) {
      message.error('Country code must start with +');
      return;
    }
    
    onChange(customCode.trim());
    setCustomCode('');
    setShowCustomModal(false);
    message.success('Custom country code saved');
  };

  const selectedCountry = COUNTRY_CODES.find(c => c.code === value);

  return (
    <>
      <Select
        value={value}
        onChange={handleSelect}
        style={style}
        disabled={disabled}
        placeholder="Select country code"
        showSearch
        filterOption={(input, option) =>
          option.children.toLowerCase().includes(input.toLowerCase())
        }
      >
        {COUNTRY_CODES.map((country) => (
          <Option key={country.code} value={country.code}>
            {country.flag} {country.code} ({country.country})
          </Option>
        ))}
        <Option value="OTHER">Other...</Option>
      </Select>

      <Modal
        title="Enter Custom Country Code"
        open={showCustomModal}
        onOk={handleCustomSubmit}
        onCancel={() => {
          setShowCustomModal(false);
          setCustomCode('');
        }}
        okText="Save"
        cancelText="Cancel"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="Country Code"
            rules={[
              { required: true, message: 'Please enter country code' },
              { pattern: /^\+[0-9]{1,4}$/, message: 'Format: +XXX (e.g., +44)' }
            ]}
          >
            <Input
              placeholder="+XXX"
              value={customCode}
              onChange={(e) => setCustomCode(e.target.value)}
              prefix="+"
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default CountryCodePicker;



<<<<<<< HEAD
=======

>>>>>>> origin/master
