import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, InputNumber, Radio, message } from 'antd';
import { DollarOutlined } from '@ant-design/icons';

const { Option } = Select;
const { TextArea } = Input;

const toSafeNumber = (value, fallback = 0) => {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const cleaned = value.replace(/[^0-9.-]+/g, '');
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  if (typeof value === 'object') {
    const candidate =
      value.amount ??
      value.value ??
      value.total ??
      value.totalAmount ??
      value.price ??
      value.estimatedPrice ??
      value.invoiceAmount ??
      value.amountDue;

    return toSafeNumber(candidate, fallback);
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const PaymentRecordingModal = ({ 
  visible, 
  onCancel, 
  onOk, 
  job,
  invoiceAmount = 0,
  loading = false 
}) => {
  const [form] = Form.useForm();
  const [paymentType, setPaymentType] = useState('full');
  const normalizedInvoiceAmount = toSafeNumber(invoiceAmount);
  const [amountPaid, setAmountPaid] = useState(normalizedInvoiceAmount);

  useEffect(() => {
    if (visible && job) {
      const nextAmount = toSafeNumber(invoiceAmount);
      form.setFieldsValue({
        paymentType: 'full',
        amountPaid: nextAmount,
        paymentMethod: 'cash',
      });
      setPaymentType('full');
      setAmountPaid(nextAmount);
    }
  }, [visible, job, invoiceAmount, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      const safeInvoiceAmount = toSafeNumber(invoiceAmount);
      
      // Validate payment amount
      if (values.paymentType === 'part' && (!values.amountPaid || values.amountPaid <= 0)) {
        message.error('Please enter a valid payment amount');
        return;
      }
      
      if (values.paymentType === 'part' && values.amountPaid > safeInvoiceAmount) {
        message.error(`Payment amount cannot exceed invoice amount of £${safeInvoiceAmount.toFixed(2)}`);
        return;
      }
      
      const paymentData = {
        jobId: job?.id,
        paymentType: values.paymentType, // 'full' or 'part'
        amountPaid: values.paymentType === 'full' ? safeInvoiceAmount : values.amountPaid,
        paymentMethod: values.paymentMethod, // 'POS', 'Bank', 'Cash'
        paymentReference: values.paymentReference || '',
        notes: values.notes || '',
      };
      
      await onOk(paymentData);
      
      // Reset form
      form.resetFields();
      setPaymentType('full');
      setAmountPaid(safeInvoiceAmount);
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setPaymentType('full');
    setAmountPaid(normalizedInvoiceAmount);
    onCancel();
  };

  const handlePaymentTypeChange = (e) => {
    const nextAmount = toSafeNumber(invoiceAmount);
    setPaymentType(e.target.value);
    if (e.target.value === 'full') {
      form.setFieldsValue({ amountPaid: nextAmount });
      setAmountPaid(nextAmount);
    }
  };

  return (
    <Modal
      title={
        <span>
          <DollarOutlined style={{ marginRight: 8 }} />
          Record Payment - {job?.trackingId || 'Job'}
        </span>
      }
      open={visible}
      onOk={handleOk}
      onCancel={handleCancel}
      confirmLoading={loading}
      okText="Record Payment"
      cancelText="Cancel"
      width={600}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          paymentType: 'full',
          amountPaid: normalizedInvoiceAmount,
          paymentMethod: 'cash',
        }}
      >
        <Form.Item
          name="paymentType"
          label="Payment Type"
          rules={[{ required: true, message: 'Please select payment type!' }]}
        >
          <Radio.Group onChange={handlePaymentTypeChange}>
            <Radio value="full">Full Payment (£{normalizedInvoiceAmount.toFixed(2)})</Radio>
            <Radio value="part">Part Payment</Radio>
          </Radio.Group>
        </Form.Item>

        {paymentType === 'part' && (
          <Form.Item
            name="amountPaid"
            label="Amount Paid (£)"
            rules={[
              { required: true, message: 'Please enter payment amount!' },
              { type: 'number', min: 0.01, message: 'Amount must be greater than 0' },
              { 
                type: 'number', 
                max: normalizedInvoiceAmount,
                message: `Amount cannot exceed £${normalizedInvoiceAmount.toFixed(2)}`
              }
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0.01}
              max={normalizedInvoiceAmount}
              step={0.01}
              precision={2}
              prefix="£"
              placeholder="Enter amount paid"
              onChange={(value) => setAmountPaid(value || 0)}
            />
          </Form.Item>
        )}

        {paymentType === 'part' && (
          <div style={{ marginBottom: 16, padding: 12, backgroundColor: '#f5f5f5', borderRadius: 4 }}>
            <strong>Remaining Balance: </strong>
            <span style={{ color: '#f5222d', fontSize: '16px' }}>
              £{(normalizedInvoiceAmount - (amountPaid || 0)).toFixed(2)}
            </span>
          </div>
        )}

        <Form.Item
          name="paymentMethod"
          label="Payment Method"
          rules={[{ required: true, message: 'Please select payment method!' }]}
        >
          <Select placeholder="Select payment method">
            <Option value="POS">POS</Option>
            <Option value="Bank">Bank Transfer</Option>
            <Option value="Cash">Cash</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="paymentReference"
          label="Payment Reference (Optional)"
        >
          <Input placeholder="Transaction ID, receipt number, etc." />
        </Form.Item>

        <Form.Item
          name="notes"
          label="Notes (Optional)"
        >
          <TextArea 
            rows={3} 
            placeholder="Any additional notes about this payment"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default PaymentRecordingModal;

