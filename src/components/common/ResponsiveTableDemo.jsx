import React from 'react';
import { Card, Title, Text, Space, Tag } from 'antd';
import ResponsiveTable from './ResponsiveTable';

const ResponsiveTableDemo = () => {
  // Sample data for demonstration
  const demoData = [
    {
      id: '1',
      title: 'Sample Job 1',
      name: 'John Doe',
      trackingId: 'TRK001',
      status: 'Pending',
      priority: 'High',
      email: 'john.doe@example.com',
      phone: '+44 7911 123456',
      address: '123 Main Street, London, UK',
      createdAt: '2024-01-20',
      eta: '2024-01-25',
      assignedTo: 'Driver A',
      notes: 'Fragile package, handle with care'
    },
    {
      id: '2',
      title: 'Sample Job 2',
      name: 'Jane Smith',
      trackingId: 'TRK002',
      status: 'In Progress',
      priority: 'Medium',
      email: 'jane.smith@example.com',
      phone: '+44 7911 654321',
      address: '456 Oak Avenue, Manchester, UK',
      createdAt: '2024-01-21',
      eta: '2024-01-26',
      assignedTo: 'Driver B',
      notes: 'Standard delivery, no special requirements'
    },
    {
      id: '3',
      title: 'Sample Job 3',
      name: 'Bob Johnson',
      trackingId: 'TRK003',
      status: 'Completed',
      priority: 'Low',
      email: 'bob.johnson@example.com',
      phone: '+44 7911 987654',
      address: '789 Pine Road, Birmingham, UK',
      createdAt: '2024-01-19',
      eta: '2024-01-24',
      assignedTo: 'Driver C',
      notes: 'Delivered successfully, customer satisfied'
    }
  ];

  const columns = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      mobile: true,
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: 'Customer',
      dataIndex: 'name',
      key: 'name',
      mobile: true,
    },
    {
      title: 'Tracking ID',
      dataIndex: 'trackingId',
      key: 'trackingId',
      mobile: true,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      mobile: true,
      render: (status) => {
        const colors = {
          'Pending': 'warning',
          'In Progress': 'processing',
          'Completed': 'success',
          'Cancelled': 'error'
        };
        return <Tag color={colors[status] || 'default'}>{status}</Tag>;
      },
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      mobile: true,
      render: (priority) => {
        const colors = {
          'High': 'error',
          'Medium': 'warning',
          'Low': 'default'
        };
        return <Tag color={colors[priority] || 'default'}>{priority}</Tag>;
      },
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      mobile: false,
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
      mobile: false,
    },
    {
      title: 'Address',
      dataIndex: 'address',
      key: 'address',
      mobile: false,
      ellipsis: true,
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      mobile: false,
    },
    {
      title: 'ETA',
      dataIndex: 'eta',
      key: 'eta',
      mobile: false,
    },
    {
      title: 'Assigned To',
      dataIndex: 'assignedTo',
      key: 'assignedTo',
      mobile: false,
    },
    {
      title: 'Notes',
      dataIndex: 'notes',
      key: 'notes',
      mobile: false,
      ellipsis: true,
    },
    {
      title: 'Actions',
      key: 'actions',
      mobile: true,
      render: (_, record) => (
        <Space size="small">
          <Tag color="blue" style={{ cursor: 'pointer' }}>View</Tag>
          <Tag color="green" style={{ cursor: 'pointer' }}>Edit</Tag>
          <Tag color="red" style={{ cursor: 'pointer' }}>Delete</Tag>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Title level={3}>ResponsiveTable Demo</Title>
        <Text type="secondary">
          This demonstrates how tables automatically adapt to mobile devices. 
          Resize your browser window or view on mobile to see the transformation.
        </Text>
        
        <div style={{ marginTop: '24px' }}>
          <ResponsiveTable
            columns={columns}
            dataSource={demoData}
            pagination={{
              total: demoData.length,
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} of ${total} items`,
            }}
            mobileCardView={true}
            mobileBreakpoint={768}
            rowKey="id"
          />
        </div>
      </Card>
    </div>
  );
};

export default ResponsiveTableDemo;

