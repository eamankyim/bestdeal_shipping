import React, { useState, useEffect } from 'react';
import {
  Card,
  Tag,
  Typography,
  Alert,
  Space,
  Spin,
  message
} from 'antd';
import {
  SafetyOutlined
} from '@ant-design/icons';
import ResponsiveTable from '../common/ResponsiveTable';
import { authAPI } from '../../utils/api';

const { Title, Text } = Typography;

const RoleManagement = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const response = await authAPI.getRoles();
      
      if (response.success && response.data?.roles) {
        // Transform roles data for the table
        const transformedRoles = response.data.roles.map((role, index) => ({
          key: role.id || `role-${index}`,
          id: role.id,
          name: role.name,
          displayName: role.displayName,
          description: role.description,
          userCount: role.userCount || 0,
          isSystem: role.isSystem !== undefined ? role.isSystem : true,
          color: role.color || '#1890ff',
        }));
        setRoles(transformedRoles);
      }
    } catch (error) {
      console.error('Failed to fetch roles:', error);
      message.error('Failed to load roles. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fallback roles if API fails (using correct seed data)
  const fallbackRoles = [
    {
      key: '1',
      id: 1,
      name: 'superadmin',
      displayName: 'Super Administrator',
      description: 'Full system access with all privileges',
      userCount: 0, // Will be updated from API
      isSystem: true,
      color: '#f5222d'
    },
    {
      key: '2',
      id: 2,
      name: 'admin',
      displayName: 'Administrator',
      description: 'Full system access and management',
      userCount: 1,
      isSystem: true,
      color: '#1890ff'
    },
    {
      key: '3',
      id: 3,
      name: 'finance',
      displayName: 'Finance Manager',
      description: 'Manage invoices, payments, and financial reports',
      userCount: 1,
      isSystem: true,
      color: '#faad14'
    },
    {
      key: '4',
      id: 4,
      name: 'customer-service',
      displayName: 'Customer Service',
      description: 'Manage customers and track shipments',
      userCount: 0,
      isSystem: true, // Fixed: Should be System, not Custom
      color: '#13c2c2'
    },
    {
      key: '5',
      id: 5,
      name: 'warehouse',
      displayName: 'Warehouse Manager',
      description: 'Manage warehouse operations and batching',
      userCount: 2,
      isSystem: true,
      color: '#52c41a'
    },
    {
      key: '6',
      id: 6,
      name: 'driver',
      displayName: 'Driver',
      description: 'Collection and delivery operations',
      userCount: 3,
      isSystem: true,
      color: '#fa8c16'
    },
    {
      key: '7',
      id: 7,
      name: 'delivery-agent',
      displayName: 'Delivery Agent',
      description: 'Final delivery operations',
      userCount: 4,
      isSystem: true,
      color: '#722ed1'
    },
    {
      key: '8',
      id: 8,
      name: 'user',
      displayName: 'User',
      description: 'Basic user access',
      userCount: 0,
      isSystem: true,
      color: '#8c8c8c'
    }
  ];

  // Use API roles if available, otherwise use fallback
  const displayRoles = roles.length > 0 ? roles : fallbackRoles;

  const columns = [
    {
      title: 'Role',
      key: 'role',
      mobile: true,
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
      mobile: true,
      ellipsis: true,
    },
    {
      title: 'Users',
      dataIndex: 'userCount',
      key: 'userCount',
      mobile: true,
      render: (count) => <Tag color={count > 0 ? 'success' : 'default'}>{count} users</Tag>,
    },
    {
      title: 'Type',
      key: 'type',
      mobile: true,
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
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Spin size="large" />
            <p style={{ marginTop: 16 }}>Loading roles...</p>
          </div>
        ) : (
          <ResponsiveTable
            columns={columns}
            dataSource={displayRoles}
            pagination={false}
            size="small"
            rowKey="id"
            loading={loading}
          />
        )}
      </Card>
    </div>
  );
};

export default RoleManagement;

