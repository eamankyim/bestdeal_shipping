import React, { useState } from 'react';
import {
  Card,
  Table,
  Tag,
  Typography,
  Alert,
  Space
} from 'antd';
import {
  SafetyOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

const RoleManagement = () => {
  // TODO: Fetch roles from API
  const [roles] = useState([
    {
      key: '1',
      id: 1,
      name: 'admin',
      displayName: 'Administrator',
      description: 'Full system access with all permissions',
      userCount: 1,
      isSystem: true, // System roles cannot be deleted
      color: 'red'
    },
    {
      key: '2',
      id: 2,
      name: 'driver',
      displayName: 'Driver',
      description: 'Collection driver with pickup permissions',
      userCount: 3,
      isSystem: true,
      color: 'blue'
    },
    {
      key: '3',
      id: 3,
      name: 'warehouse',
      displayName: 'Warehouse Staff',
      description: 'Warehouse operations and inventory management',
      userCount: 2,
      isSystem: true,
      color: 'green'
    },
    {
      key: '4',
      id: 4,
      name: 'delivery-agent',
      displayName: 'Delivery Agent',
      description: 'Final mile delivery agent',
      userCount: 4,
      isSystem: true,
      color: 'orange'
    },
    {
      key: '5',
      id: 5,
      name: 'finance',
      displayName: 'Finance Officer',
      description: 'Financial operations and invoice management',
      userCount: 1,
      isSystem: true,
      color: 'purple'
    },
    {
      key: '6',
      id: 6,
      name: 'customer-service',
      displayName: 'Customer Service',
      description: 'Customer support and tracking',
      userCount: 0,
      isSystem: false,
      color: 'cyan'
    }
  ]);

  const columns = [
    {
      title: 'Role',
      key: 'role',
      render: (_, record) => (
        <Space>
          <SafetyOutlined style={{ color: record.color || '#1890ff', fontSize: '18px' }} />
          <div>
            <Text strong>{record.displayName}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.name}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Users',
      dataIndex: 'userCount',
      key: 'userCount',
      render: (count) => <Tag color={count > 0 ? 'success' : 'default'}>{count} users</Tag>,
    },
    {
      title: 'Type',
      key: 'type',
      render: (_, record) => (
        <Tag color={record.isSystem ? 'blue' : 'green'}>
          {record.isSystem ? 'System' : 'Custom'}
        </Tag>
      ),
    }
  ];

  return (
    <div>
      <div style={{ marginBottom: '16px' }}>
        <Title level={4} style={{ margin: 0 }}>Role Management</Title>
        <Text type="secondary">View all user roles in the system</Text>
      </div>

      <Alert
        message="About Roles"
        description="Roles define user access levels in the system. All roles and their permissions are managed on the backend."
        type="info"
        showIcon
        style={{ marginBottom: '16px' }}
        closable
      />

      <Card>
        <Table
          columns={columns}
          dataSource={roles}
          pagination={false}
          size="small"
        />
      </Card>
    </div>
  );
};

export default RoleManagement;

