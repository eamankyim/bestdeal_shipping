import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Form,
  Input,
  Select,
  Button,
  Card,
  Typography,
  Row,
  Col,
  Divider,
  Space,
  message,
  Upload,
  DatePicker,
  InputNumber,
  Radio,
  Checkbox,
  Alert,
} from 'antd';
import {
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  EnvironmentOutlined,
  PackageOutlined,
  DollarOutlined,
  WeightOutlined,
  FileTextOutlined,
  PlusOutlined,
  SaveOutlined,
  SendOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const ShipmentBookingPage = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [collectionType, setCollectionType] = useState('pickup');

  const onFinish = async (values) => {
    setLoading(true);
    try {
      // Mock API call - in real app this would create the shipment
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate tracking ID
      const trackingId = `DTD-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
      
      message.success(`Shipment booked successfully! Tracking ID: ${trackingId}`);
      
      // Reset form and redirect to tracking
      form.resetFields();
      navigate('/track-shipment', { 
        state: { 
          trackingId,
          customerName: values.customerName,
          status: 'Booked'
        } 
      });
    } catch (error) {
      message.error('Failed to book shipment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const ukCities = [
    'London', 'Manchester', 'Birmingham', 'Liverpool', 'Leeds', 
    'Sheffield', 'Edinburgh', 'Glasgow', 'Bristol', 'Cardiff',
    'Newcastle', 'Nottingham', 'Leicester', 'Coventry', 'Bradford'
  ];

  const ghanaCities = [
    'Accra', 'Kumasi', 'Tamale', 'Sekondi-Takoradi', 'Ashaiman',
    'Cape Coast', 'Obuasi', 'Teshie', 'Tema', 'Madina',
    'Koforidua', 'Sunyani', 'Ho', 'Wa', 'Bolgatanga'
  ];

  const packageTypes = [
    'Documents', 'Clothing', 'Electronics', 'Books', 'Food Items',
    'Medicines', 'Cosmetics', 'Tools', 'Sports Equipment', 'Other'
  ];

  const serviceTypes = [
    'Standard (7-10 days)',
    'Express (3-5 days)',
    'Premium (1-2 days)'
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>Book New Shipment</Title>
        <Text type="secondary">
          Create a new shipment request for UK to Ghana delivery
        </Text>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          collectionType: 'pickup',
          packageType: 'Other',
          serviceType: 'Standard (7-10 days)',
          insurance: false,
        }}
      >
        {/* Customer Information */}
        <Card title="Customer Information" style={{ marginBottom: 24 }}>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="customerName"
                label="Full Name"
                rules={[{ required: true, message: 'Please enter customer name!' }]}
              >
                <Input 
                  prefix={<UserOutlined />} 
                  placeholder="Enter full name"
                  size="large"
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="phone"
                label="Phone Number"
                rules={[{ required: true, message: 'Please enter phone number!' }]}
              >
                <Input 
                  prefix={<PhoneOutlined />} 
                  placeholder="Enter phone number"
                  size="large"
                />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="email"
                label="Email Address"
                rules={[
                  { required: true, message: 'Please enter email address!' },
                  { type: 'email', message: 'Please enter a valid email!' }
                ]}
              >
                <Input 
                  prefix={<MailOutlined />} 
                  placeholder="Enter email address"
                  size="large"
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="idNumber"
                label="ID Number (Optional)"
              >
                <Input 
                  prefix={<FileTextOutlined />} 
                  placeholder="Enter ID number if available"
                  size="large"
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Collection & Delivery */}
        <Card title="Collection & Delivery Details" style={{ marginBottom: 24 }}>
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={24}>
              <Form.Item
                name="collectionType"
                label="Collection Type"
              >
                <Radio.Group onChange={(e) => setCollectionType(e.target.value)}>
                  <Radio.Button value="pickup">Pickup Service</Radio.Button>
                  <Radio.Button value="dropoff">Drop-off at Partner Point</Radio.Button>
                </Radio.Group>
              </Form.Item>
            </Col>
          </Row>

          {collectionType === 'pickup' && (
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="pickupAddress"
                  label="Pickup Address"
                  rules={[{ required: true, message: 'Please enter pickup address!' }]}
                >
                  <TextArea 
                    rows={3}
                    placeholder="Enter full pickup address"
                    size="large"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="pickupCity"
                  label="Pickup City"
                  rules={[{ required: true, message: 'Please select pickup city!' }]}
                >
                  <Select placeholder="Select pickup city" size="large">
                    {ukCities.map(city => (
                      <Option key={city} value={city}>{city}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          )}

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="deliveryAddress"
                label="Delivery Address"
                rules={[{ required: true, message: 'Please enter delivery address!' }]}
              >
                <TextArea 
                  rows={3}
                  placeholder="Enter full delivery address in Ghana"
                  size="large"
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="deliveryCity"
                label="Delivery City"
                rules={[{ required: true, message: 'Please select delivery city!' }]}
              >
                <Select placeholder="Select delivery city" size="large">
                  {ghanaCities.map(city => (
                    <Option key={city} value={city}>{city}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Package Details */}
        <Card title="Package Details" style={{ marginBottom: 24 }}>
          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item
                name="packageType"
                label="Package Type"
                rules={[{ required: true, message: 'Please select package type!' }]}
              >
                <Select placeholder="Select package type" size="large">
                  {packageTypes.map(type => (
                    <Option key={type} value={type}>{type}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name="weight"
                label="Weight (kg)"
                rules={[{ required: true, message: 'Please enter package weight!' }]}
              >
                <InputNumber
                  prefix={<WeightOutlined />}
                  placeholder="0.00"
                  min={0.1}
                  max={100}
                  step={0.1}
                  style={{ width: '100%' }}
                  size="large"
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name="value"
                label="Declared Value (£)"
                rules={[{ required: true, message: 'Please enter package value!' }]}
              >
                <InputNumber
                  prefix={<DollarOutlined />}
                  placeholder="0.00"
                  min={0}
                  max={10000}
                  step={0.01}
                  style={{ width: '100%' }}
                  size="large"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="description"
                label="Package Description"
                rules={[{ required: true, message: 'Please describe the package contents!' }]}
              >
                <TextArea 
                  rows={4}
                  placeholder="Provide detailed description of package contents..."
                  size="large"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="dimensions"
                label="Dimensions (L x W x H cm)"
              >
                <Input 
                  placeholder="e.g., 30 x 20 x 15"
                  size="large"
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="fragile"
                valuePropName="checked"
              >
                <Checkbox>Mark as Fragile</Checkbox>
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Service Options */}
        <Card title="Service Options" style={{ marginBottom: 24 }}>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="serviceType"
                label="Service Type"
                rules={[{ required: true, message: 'Please select service type!' }]}
              >
                <Select placeholder="Select service type" size="large">
                  {serviceTypes.map(type => (
                    <Option key={type} value={type}>{type}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="insurance"
                valuePropName="checked"
              >
                <Checkbox>Add Insurance Coverage</Checkbox>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="specialInstructions"
                label="Special Instructions"
              >
                <TextArea 
                  rows={3}
                  placeholder="Any special handling instructions..."
                  size="large"
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="preferredDeliveryDate"
                label="Preferred Delivery Date"
              >
                <DatePicker 
                  style={{ width: '100%' }}
                  size="large"
                  placeholder="Select preferred date"
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Documents Upload */}
        <Card title="Documents (Optional)" style={{ marginBottom: 24 }}>
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="documents"
                label="Upload Documents"
              >
                <Upload
                  listType="picture-card"
                  maxCount={5}
                  beforeUpload={() => false}
                >
                  <div>
                    <PlusOutlined />
                    <div style={{ marginTop: 8 }}>Upload</div>
                  </div>
                </Upload>
              </Form.Item>
              <Text type="secondary">
                Upload invoices, receipts, or other relevant documents (Max 5 files)
              </Text>
            </Col>
          </Row>
        </Card>

        {/* Cost Estimate */}
        <Card title="Cost Estimate" style={{ marginBottom: 24 }}>
          <Alert
            message="Cost will be calculated based on weight, service type, and additional options"
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
          <Row gutter={16}>
            <Col xs={24} md={8}>
              <div style={{ textAlign: 'center', padding: '16px', background: '#f5f5f5', borderRadius: 6 }}>
                <Text strong>Base Shipping</Text>
                <br />
                <Text type="secondary">£15.00</Text>
              </div>
            </Col>
            <Col xs={24} md={8}>
              <div style={{ textAlign: 'center', padding: '16px', background: '#f5f5f5', borderRadius: 6 }}>
                <Text strong>Weight Charge</Text>
                <br />
                <Text type="secondary">£0.00</Text>
              </div>
            </Col>
            <Col xs={24} md={8}>
              <div style={{ textAlign: 'center', padding: '16px', background: '#f5f5f5', borderRadius: 6 }}>
                <Text strong>Total Estimated</Text>
                <br />
                <Text type="secondary" style={{ fontSize: '18px', color: '#1890ff' }}>£15.00</Text>
              </div>
            </Col>
          </Row>
        </Card>

        {/* Submit Buttons */}
        <Card>
          <Row gutter={16} justify="end">
            <Col>
              <Button 
                size="large"
                onClick={() => navigate('/dashboard')}
              >
                Cancel
              </Button>
            </Col>
            <Col>
              <Button 
                type="default" 
                icon={<SaveOutlined />}
                size="large"
                onClick={() => form.submit()}
              >
                Save Draft
              </Button>
            </Col>
            <Col>
              <Button 
                type="primary" 
                icon={<SendOutlined />}
                size="large"
                loading={loading}
                onClick={() => form.submit()}
              >
                Book Shipment
              </Button>
            </Col>
          </Row>
        </Card>
      </Form>
    </div>
  );
};

export default ShipmentBookingPage;
