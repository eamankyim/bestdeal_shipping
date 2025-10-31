import React, { useState, useEffect } from 'react';
import { 
  Row, 
  Col, 
  Card, 
  Table, 
  Button, 
  Modal, 
  Form, 
  Input, 
  Select, 
  DatePicker, 
  Typography, 
  Tag, 
  Space,
  message,
  Badge,
  Drawer,
  Descriptions,
  Divider,
  Tabs,
  Statistic,
  InputNumber,
  Switch
} from 'antd';
import { 
  PlusOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  DownloadOutlined,
  EyeOutlined,
  EditOutlined,
  SendOutlined,
  PrinterOutlined,
  MailOutlined
} from '@ant-design/icons';
import { invoiceAPI, customerAPI, jobAPI } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import ResponsiveTable from '../components/common/ResponsiveTable';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const InvoiceManagementPage = () => {
  const { currentUser } = useAuth();
  const [invoiceModalVisible, setInvoiceModalVisible] = useState(false);
  const [isDetailsDrawerVisible, setIsDetailsDrawerVisible] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [invoiceForm] = Form.useForm();
  const [activeTab, setActiveTab] = useState('invoices');
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sendingInvoice, setSendingInvoice] = useState(false);
  const [markingPaid, setMarkingPaid] = useState(false);
  
  // Available shipments is now redundant since we auto-create invoice drafts
  const availableShipments = [];

  // Fetch invoices on mount
  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      console.log('📥 Fetching invoices from backend...');
      
      const response = await invoiceAPI.getAll();
      
      if (response.success && response.data) {
        const rawInvoices = Array.isArray(response.data) ? response.data : response.data.invoices || [];
        
        // Transform to table format
        const transformedInvoices = rawInvoices.map(invoice => ({
          key: invoice.id,
          id: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          trackingId: invoice.items?.[0]?.job?.trackingId || 'Multiple Jobs',
          customer: invoice.customer?.name || 'N/A',
          amount: parseFloat(invoice.total) || 0,
          service: invoice.items?.[0]?.description?.includes('Urgent') ? 'Urgent' :
                   invoice.items?.[0]?.description?.includes('Express') ? 'Express' : 'Standard',
          status: invoice.status,
          issueDate: new Date(invoice.issueDate).toLocaleDateString(),
          dueDate: new Date(invoice.dueDate).toLocaleDateString(),
          paidDate: invoice.paidDate ? new Date(invoice.paidDate).toLocaleDateString() : null,
          subtotal: parseFloat(invoice.subtotal),
          tax: parseFloat(invoice.tax),
          total: parseFloat(invoice.total),
          items: invoice.items || [],
          notes: invoice.notes,
          customerEmail: invoice.customer?.email,
          customerPhone: invoice.customer?.phone,
          paymentMethod: invoice.paymentMethod,
          paymentReference: invoice.paymentReference,
        }));
        
        console.log('✅ Invoices fetched:', transformedInvoices);
        setInvoices(transformedInvoices);
        
        // Update statistics
        updateStats(transformedInvoices);
      }
    } catch (error) {
      console.error('❌ Failed to fetch invoices:', error);
      message.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const updateStats = (invoiceList) => {
    const totalInvoices = invoiceList.length;
    const pendingInvoices = invoiceList.filter(inv => inv.status === 'Pending').length;
    const paidInvoices = invoiceList.filter(inv => inv.status === 'Paid').length;
    const overdueInvoices = invoiceList.filter(inv => inv.status === 'Overdue').length;
    const draftInvoices = invoiceList.filter(inv => inv.status === 'Draft').length;
    
    const totalRevenue = invoiceList
      .filter(inv => inv.status === 'Paid')
      .reduce((sum, inv) => sum + inv.amount, 0);
    
    const pendingAmount = invoiceList
      .filter(inv => inv.status === 'Pending' || inv.status === 'Overdue')
      .reduce((sum, inv) => sum + inv.amount, 0);
    
    console.log('📊 Invoice Stats:', {
      total: totalInvoices,
      draft: draftInvoices,
      pending: pendingInvoices,
      paid: paidInvoices,
      overdue: overdueInvoices,
      revenue: totalRevenue,
      pendingAmount
    });
  };

  // Pricing structure for reference
  const pricingStructure = {
    standard: { base: 50, perKg: 2, days: '7-10' },
    express: { base: 75, perKg: 3, days: '3-5' },
    urgent: { base: 100, perKg: 4, days: '1-2' }
  };

  const invoiceColumns = [
    {
      title: 'Invoice #',
      dataIndex: 'invoiceNumber',
      key: 'invoiceNumber',
      render: (text) => <Text strong>{text}</Text>,
      mobile: true,
    },
    {
      title: 'Tracking ID',
      dataIndex: 'trackingId',
      key: 'trackingId',
      mobile: false,
    },
    {
      title: 'Customer',
      dataIndex: 'customer',
      key: 'customer',
      mobile: true,
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => <Text strong>£{amount.toFixed(2)}</Text>,
      mobile: true,
    },
    {
      title: 'Service',
      dataIndex: 'service',
      key: 'service',
      mobile: true,
      render: (service) => {
        let color = 'default';
        switch (service) {
          case 'Premium':
            color = 'purple';
            break;
          case 'Express':
            color = 'orange';
            break;
          case 'Standard':
            color = 'blue';
            break;
          default:
            color = 'default';
        }
        return <Tag color={color}>{service}</Tag>;
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      mobile: true,
      render: (status) => {
        let color = 'default';
        let icon = null;
        
        switch (status) {
          case 'Draft':
            color = 'default';
            icon = <EditOutlined />;
            break;
          case 'Paid':
            color = 'success';
            icon = <CheckCircleOutlined />;
            break;
          case 'Pending':
            color = 'processing';
            icon = <ClockCircleOutlined />;
            break;
          case 'Overdue':
            color = 'error';
            icon = <ClockCircleOutlined />;
            break;
          case 'Cancelled':
            color = 'error';
            break;
          default:
            color = 'default';
        }
        
        return (
          <Tag color={color} icon={icon}>
            {status}
          </Tag>
        );
      },
    },
    {
      title: 'Issue Date',
      dataIndex: 'issueDate',
      key: 'issueDate',
      mobile: false,
    },
    {
      title: 'Due Date',
      dataIndex: 'dueDate',
      key: 'dueDate',
      mobile: false,
    },
    {
      title: 'Actions',
      key: 'actions',
      mobile: true,
      render: (_, record) => (
        <Space>
          {record.status === 'Draft' && (
            <Button 
              size="small"
              type="primary"
              icon={<SendOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                handleSendInvoice(record);
              }}
              loading={sendingInvoice}
            >
              Send
            </Button>
          )}
          {record.status === 'Pending' && (
            <Button 
              size="small"
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                handleMarkAsPaid(record);
              }}
              loading={markingPaid}
              style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
            >
              Mark Paid
            </Button>
          )}
          <Button 
            size="small"
            icon={<EyeOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              handleViewInvoice(record);
            }}
          >
            View
          </Button>
          <Button 
            size="small"
            icon={<DownloadOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              handleDownloadInvoice(record);
            }}
          >
            Download
          </Button>
        </Space>
      ),
    },
  ];

  const shipmentColumns = [
    {
      title: 'Tracking ID',
      dataIndex: 'trackingId',
      key: 'trackingId',
      mobile: true,
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: 'Customer',
      dataIndex: 'customer',
      key: 'customer',
      mobile: true,
    },
    {
      title: 'Weight',
      dataIndex: 'weight',
      key: 'weight',
      mobile: true,
    },
    {
      title: 'Service',
      dataIndex: 'service',
      key: 'service',
      mobile: true,
      render: (service) => {
        let color = 'default';
        switch (service) {
          case 'Premium':
            color = 'purple';
            break;
          case 'Express':
            color = 'orange';
            break;
          case 'Standard':
            color = 'blue';
            break;
          default:
            color = 'default';
        }
        return <Tag color={color}>{service}</Tag>;
      },
    },
    {
      title: 'Destination',
      dataIndex: 'destination',
      key: 'destination',
      mobile: true,
    },
    {
      title: 'Collection Date',
      dataIndex: 'collectionDate',
      key: 'collectionDate',
      mobile: true,
    },
    {
      title: 'Actions',
      key: 'actions',
      mobile: true,
      render: (_, record) => (
        <Button 
          type="primary"
          size="small"
          icon={<PlusOutlined />}
          onClick={(e) => {
            e.stopPropagation();
            handleGenerateInvoice(record);
          }}
          disabled={record.invoiceGenerated}
        >
          Generate Invoice
        </Button>
      ),
    },
  ];

  const handleGenerateInvoice = (shipment) => {
    setSelectedInvoice(shipment);
    invoiceForm.setFieldsValue({
      trackingId: shipment.trackingId,
      customer: shipment.customer,
      customerEmail: shipment.customerEmail,
      weight: parseFloat(shipment.weight),
      value: shipment.value,
      service: shipment.service,
      destination: shipment.destination
    });
    setInvoiceModalVisible(true);
  };

  const handleViewInvoice = (invoice) => {
    setSelectedInvoice(invoice);
    setIsDetailsDrawerVisible(true);
  };

  const handleDownloadInvoice = (invoice) => {
    message.info(`Downloading invoice ${invoice.invoiceNumber}...`);
  };

  const handleSendInvoice = async (invoice) => {
    setSendingInvoice(true);
    try {
      message.loading({ content: 'Sending invoice...', key: 'sendInvoice' });
      
      const response = await invoiceAPI.send(invoice.id);
      
      if (response.success) {
        message.success({ 
          content: `Invoice ${invoice.invoiceNumber} sent to ${invoice.customer}!`,
          key: 'sendInvoice',
          duration: 3
        });
        
        // Refresh invoices list
        await fetchInvoices();
      } else {
        message.error({ content: response.message || 'Failed to send invoice', key: 'sendInvoice', duration: 3 });
      }
    } catch (error) {
      console.error('❌ Failed to send invoice:', error);
      message.error({ content: error.message || 'Failed to send invoice', key: 'sendInvoice', duration: 3 });
    } finally {
      setSendingInvoice(false);
    }
  };

  const handleMarkAsPaid = async (invoice) => {
    Modal.confirm({
      title: 'Mark Invoice as Paid?',
      content: (
        <div>
          <p>Invoice: <strong>{invoice.invoiceNumber}</strong></p>
          <p>Amount: <strong>£{invoice.amount.toFixed(2)}</strong></p>
          <Form layout="vertical" style={{ marginTop: 16 }}>
            <Form.Item label="Payment Method">
              <Select defaultValue="bank_transfer" id="paymentMethod">
                <Option value="bank_transfer">Bank Transfer</Option>
                <Option value="cash">Cash</Option>
                <Option value="card">Card</Option>
                <Option value="check">Check</Option>
              </Select>
            </Form.Item>
            <Form.Item label="Payment Reference (Optional)">
              <Input placeholder="Transaction ID or reference" id="paymentReference" />
            </Form.Item>
          </Form>
        </div>
      ),
      okText: 'Mark as Paid',
      cancelText: 'Cancel',
      onOk: async () => {
        setMarkingPaid(true);
        try {
          const paymentMethod = document.getElementById('paymentMethod')?.value || 'bank_transfer';
          const paymentReference = document.getElementById('paymentReference')?.value || '';
          
          message.loading({ content: 'Marking invoice as paid...', key: 'markPaid' });
          
          const response = await invoiceAPI.markAsPaid(invoice.id, {
            paymentMethod,
            paymentReference
          });
          
          if (response.success) {
            message.success({ 
              content: `Invoice ${invoice.invoiceNumber} marked as paid!`,
              key: 'markPaid',
              duration: 3
            });
            
            // Refresh invoices
            await fetchInvoices();
          } else {
            message.error({ content: response.message || 'Failed to mark as paid', key: 'markPaid', duration: 3 });
          }
        } catch (error) {
          console.error('❌ Failed to mark invoice as paid:', error);
          message.error({ content: error.message || 'Failed to mark as paid', key: 'markPaid', duration: 3 });
        } finally {
          setMarkingPaid(false);
        }
      }
    });
  };

  const calculateShippingCost = (weight, service) => {
    const pricing = pricingStructure[service.toLowerCase()];
    if (!pricing) return 0;
    
    return pricing.base + (weight * pricing.perKg);
  };

  const handleInvoiceSubmit = async (values) => {
    try {
      const shippingCost = calculateShippingCost(values.weight, values.service);
      const totalAmount = shippingCost + (values.value * 0.01);
      
      // TODO: Replace with actual API call
      message.info('Backend API not yet implemented');
      setInvoiceModalVisible(false);
      invoiceForm.resetFields();
      setSelectedInvoice(null);
    } catch (error) {
      message.error('Failed to generate invoice. Please try again.');
    }
  };

  const tabItems = [
    {
      key: 'invoices',
      label: 'Invoice Management',
      children: (
        <div>
          <Card size="small" style={{ marginBottom: '16px' }}>
            <Row gutter={[16, 16]}>
              <Col xs={12} sm={12} lg={6}>
                <Statistic
                  title="Total Invoices"
                  value={invoices.length}
                  suffix=""
                  valueStyle={{ color: '#1890ff' }}
                />
              </Col>
              <Col xs={12} sm={12} lg={6}>
                <Statistic
                  title="Paid"
                  value={invoices.filter(inv => inv.status === 'Paid').length}
                  suffix=""
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
              <Col xs={12} sm={12} lg={6}>
                <Statistic
                  title="Pending"
                  value={invoices.filter(inv => inv.status === 'Pending').length}
                  suffix=""
                  valueStyle={{ color: '#faad14' }}
                />
              </Col>
              <Col xs={12} sm={12} lg={6}>
                <Statistic
                  title="Overdue"
                  value={invoices.filter(inv => inv.status === 'Overdue').length}
                  suffix=""
                  valueStyle={{ color: '#f5222d' }}
                />
              </Col>
            </Row>
          </Card>
          <ResponsiveTable
            columns={invoiceColumns}
            dataSource={invoices}
            loading={loading}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showTotal: (total) => `Total ${total} invoices`
            }}
            locale={{
              emptyText: 'No invoices created yet. Invoices are auto-generated when jobs are delivered.'
            }}
            size="small"
            onCardClick={handleViewInvoice}
          />
        </div>
      ),
    },
    {
      key: 'shipments',
      label: 'Available Shipments',
      children: (
        <div>
          <Card size="small" style={{ marginBottom: '16px' }}>
            <Row gutter={[16, 16]}>
              <Col xs={12} sm={12} lg={6}>
                <Statistic
                  title="Available for Invoice"
                  value={availableShipments.filter(s => !s.invoiceGenerated).length}
                  suffix=""
                  valueStyle={{ color: '#1890ff' }}
                />
              </Col>
              <Col xs={12} sm={12} lg={6}>
                <Statistic
                  title="Total Weight"
                  value={availableShipments.reduce((sum, s) => sum + parseFloat(s.weight), 0).toFixed(1)}
                  suffix=" kg"
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
              <Col xs={12} sm={12} lg={6}>
                <Statistic
                  title="Total Value"
                  value={availableShipments.reduce((sum, s) => sum + s.value, 0)}
                  suffix=" £"
                  valueStyle={{ color: '#722ed1' }}
                />
              </Col>
              <Col xs={12} sm={12} lg={6}>
                <Statistic
                  title="Premium Service"
                  value={availableShipments.filter(s => s.service === 'Premium').length}
                  suffix=""
                  valueStyle={{ color: '#faad14' }}
                />
              </Col>
            </Row>
          </Card>
          <ResponsiveTable
            columns={shipmentColumns}
            dataSource={availableShipments.filter(s => !s.invoiceGenerated)}
            pagination={false}
            size="small"
            rowKey="trackingId"
          />
        </div>
      ),
    },
  ];

  return (
    <div>
      <Title level={2} style={{ marginBottom: '24px' }}>
        Invoice Management
      </Title>

      {/* Main Content Tabs */}
      <Card>
        <Tabs 
          defaultActiveKey="invoices" 
          items={tabItems}
          onChange={setActiveTab}
        />
      </Card>

      {/* Generate Invoice Modal */}
      <Modal
        title={`Generate Invoice - ${selectedInvoice?.trackingId}`}
        open={invoiceModalVisible}
        onCancel={() => setInvoiceModalVisible(false)}
        footer={null}
        width={800}
      >
        <Form
          form={invoiceForm}
          layout="vertical"
          onFinish={handleInvoiceSubmit}
        >
          {/* Shipment Information */}
          <Card size="small" title="Shipment Information" style={{ marginBottom: 16 }}>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Form.Item
                  name="trackingId"
                  label="Tracking ID"
                >
                  <Input disabled />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="customer"
                  label="Customer Name"
                >
                  <Input disabled />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Form.Item
                  name="customerEmail"
                  label="Customer Email"
                >
                  <Input disabled />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="destination"
                  label="Destination"
                >
                  <Input disabled />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          {/* Package Details */}
          <Card size="small" title="Package Details" style={{ marginBottom: 16 }}>
            <Row gutter={[16, 16]}>
              <Col span={8}>
                <Form.Item
                  name="weight"
                  label="Weight (kg)"
                >
                  <InputNumber 
                    style={{ width: '100%' }} 
                    min={0} 
                    step={0.1} 
                    disabled 
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="value"
                  label="Declared Value (£)"
                >
                  <InputNumber 
                    style={{ width: '100%' }} 
                    min={0} 
                    disabled 
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="service"
                  label="Service Type"
                >
                  <Select disabled>
                    <Option value="Standard">Standard</Option>
                    <Option value="Express">Express</Option>
                    <Option value="Premium">Premium</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          </Card>

          {/* Cost Calculation */}
          <Card size="small" title="Cost Calculation" style={{ marginBottom: 16 }}>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Form.Item
                  name="shippingBase"
                  label="Shipping Base Cost"
                >
                  <Input 
                    addonBefore="£"
                    value={pricingStructure[selectedInvoice?.service?.toLowerCase()]?.base || 0}
                    disabled
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="shippingPerKg"
                  label="Shipping Per KG"
                >
                  <Input 
                    addonBefore="£"
                    value={pricingStructure[selectedInvoice?.service?.toLowerCase()]?.perKg || 0}
                    disabled
                  />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Form.Item
                  name="insuranceFee"
                  label="Insurance Fee (1% of value)"
                >
                  <Input 
                    addonBefore="£"
                    value={((selectedInvoice?.value || 0) * 0.01).toFixed(2)}
                    disabled
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="totalAmount"
                  label="Total Amount"
                >
                  <Input 
                    addonBefore="£"
                    value={calculateShippingCost(selectedInvoice?.weight || 0, selectedInvoice?.service || 'Standard') + ((selectedInvoice?.value || 0) * 0.01)}
                    disabled
                    style={{ fontWeight: 'bold', color: '#1890ff' }}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          {/* Invoice Settings */}
          <Card size="small" title="Invoice Settings" style={{ marginBottom: 16 }}>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Form.Item
                  name="issueDate"
                  label="Issue Date"
                  rules={[{ required: true, message: 'Please select issue date' }]}
                >
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="dueDate"
                  label="Due Date"
                  rules={[{ required: true, message: 'Please select due date' }]}
                >
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <Form.Item
                  name="notes"
                  label="Invoice Notes"
                >
                  <TextArea 
                    rows={3} 
                    placeholder="Any additional notes for the customer"
                  />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <Form.Item
                  name="autoSend"
                  label="Auto-send to customer"
                  valuePropName="checked"
                >
                  <Switch defaultChecked />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button 
                onClick={() => setInvoiceModalVisible(false)}
                size="large"
              >
                Cancel
              </Button>
              <Button 
                type="primary" 
                htmlType="submit"
                size="large"
                icon={<FileTextOutlined />}
              >
                Generate Invoice
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Invoice Details Side Drawer */}
      <Drawer
        title="Invoice Details"
        placement="right"
        onClose={() => setIsDetailsDrawerVisible(false)}
        open={isDetailsDrawerVisible}
        width={800}
        className="user-details-drawer"
        extra={[
          <Button 
            key="download"
            icon={<DownloadOutlined />}
            onClick={() => handleDownloadInvoice(selectedInvoice)}
          >
            Download
          </Button>,
          ...(selectedInvoice?.status === 'Pending' ? [
            <Button 
              key="resend"
              icon={<SendOutlined />}
              onClick={() => handleSendInvoice(selectedInvoice)}
            >
              Resend
            </Button>
          ] : []),
          <Button 
            key="print"
            icon={<PrinterOutlined />}
            onClick={() => message.info('Print functionality will be implemented')}
          >
            Print
          </Button>,
        ]}
      >
        {selectedInvoice && (
          <div>
            {/* Invoice Overview */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              <Col span={8}>
                <div style={{ textAlign: 'center' }}>
                  <FileTextOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
                  <Title level={4} style={{ margin: '8px 0 0' }}>{selectedInvoice.invoiceNumber}</Title>
                  <Text type="secondary">Invoice</Text>
                </div>
              </Col>
              <Col span={8}>
                <div style={{ textAlign: 'center' }}>
                  <Text strong>Status</Text>
                  <br />
                  <Tag color="processing" style={{ fontSize: '16px' }}>
                    {selectedInvoice.status}
                  </Tag>
                </div>
              </Col>
              <Col span={8}>
                <div style={{ textAlign: 'center' }}>
                  <Text strong>Amount</Text>
                  <br />
                  <Text style={{ fontSize: '24px', color: '#1890ff', fontWeight: 'bold' }}>
                    £{selectedInvoice.amount.toFixed(2)}
                  </Text>
                </div>
              </Col>
            </Row>
            <Divider />

            {/* Invoice Details */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              <Col span={24}>
                <Card 
                  size="small" 
                  title={<span className="user-info-title">Invoice Information</span>}
                  className="user-info-card"
                  style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)', borderRadius: 8, marginBottom: 24 }}
                >
                  <div className="user-info-list">
                    <div className="user-info-item">
                      <div className="user-info-label">Tracking ID</div>
                      <div className="user-info-value">
                        <Text>{selectedInvoice.trackingId}</Text>
                      </div>
                    </div>
                    <div className="user-info-item">
                      <div className="user-info-label">Customer</div>
                      <div className="user-info-value">
                        <Text>{selectedInvoice.customer}</Text>
                      </div>
                    </div>
                    <div className="user-info-item">
                      <div className="user-info-label">Customer Email</div>
                      <div className="user-info-value">
                        <MailOutlined style={{ color: '#1890ff', marginRight: '8px' }} />
                        <Text>{selectedInvoice.customerEmail}</Text>
                      </div>
                    </div>
                    <div className="user-info-item">
                      <div className="user-info-label">Service</div>
                      <div className="user-info-value">
                      <Tag color="blue">{selectedInvoice.service}</Tag>
                      </div>
                    </div>
                    <div className="user-info-item">
                      <div className="user-info-label">Issue Date</div>
                      <div className="user-info-value">
                        <Text>{selectedInvoice.issueDate}</Text>
                      </div>
                    </div>
                    <div className="user-info-item">
                      <div className="user-info-label">Due Date</div>
                      <div className="user-info-value">
                        <Text>{selectedInvoice.dueDate}</Text>
                      </div>
                    </div>
                  </div>
                </Card>
              </Col>
            </Row>

            {/* Payment Information */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              <Col span={24}>
                <Card 
                  size="small" 
                  title={<span className="user-info-title">Payment Information</span>}
                  className="user-info-card"
                  style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)', borderRadius: 8 }}
                >
                  <div className="user-info-list">
                    <div className="user-info-item">
                      <div className="user-info-label">Payment Status</div>
                      <div className="user-info-value">
                      <Tag color={selectedInvoice.status === 'Paid' ? 'success' : 'processing'}>
                        {selectedInvoice.status}
                      </Tag>
                      </div>
                    </div>
                    <div className="user-info-item">
                      <div className="user-info-label">Payment Method</div>
                      <div className="user-info-value">
                        <Text>{selectedInvoice.paymentMethod || 'Not specified'}</Text>
                      </div>
                    </div>
                    <div className="user-info-item">
                      <div className="user-info-label">Payment Date</div>
                      <div className="user-info-value">
                        <Text>{selectedInvoice.paymentDate || 'Not paid'}</Text>
                      </div>
                    </div>
                    <div className="user-info-item">
                      <div className="user-info-label">Amount</div>
                      <div className="user-info-value">
                      <Text strong>£{selectedInvoice.amount.toFixed(2)}</Text>
                      </div>
                    </div>
                  </div>
                </Card>
              </Col>
            </Row>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default InvoiceManagementPage;
