import React, { useState, useEffect } from 'react';
import { Table, Card, Space, Button, Tag, Typography, Divider } from 'antd';
import { EyeOutlined, EditOutlined, DeleteOutlined, MoreOutlined } from '@ant-design/icons';
import './ResponsiveTable.css';

const { Text, Title } = Typography;

const ResponsiveTable = ({
  dataSource,
  columns,
  loading = false,
  pagination = true,
  size = 'default',
  rowKey = 'id',
  onRow,
  mobileCardView = true,
  mobileBreakpoint = 768,
  ...tableProps
}) => {
  const [isMobile, setIsMobile] = useState(false);
  const [expandedRows, setExpandedRows] = useState(new Set());

  // Detect mobile devices
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= mobileBreakpoint);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, [mobileBreakpoint]);

  // Toggle row expansion
  const toggleRowExpansion = (rowId) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(rowId)) {
      newExpanded.delete(rowId);
    } else {
      newExpanded.add(rowId);
    }
    setExpandedRows(newExpanded);
  };

  // Get mobile-optimized columns (hide less important ones)
  const getMobileColumns = () => {
    return columns.filter(col => col.mobile !== false);
  };

  // Render mobile card view
  const renderMobileCard = (record, index) => {
    const isExpanded = expandedRows.has(record[rowKey]);
    
    return (
      <Card 
        key={record[rowKey] || index}
        className="mobile-table-card"
        size="small"
        style={{ marginBottom: 12 }}
      >
        <div className="card-header">
          <div className="card-title">
            <Title level={5} style={{ margin: 0 }}>
              {record.title || record.name || record.trackingId || `Item ${index + 1}`}
            </Title>
            {record.status && (
              <Tag 
                color={getStatusColor(record.status)}
                style={{ marginLeft: 8 }}
              >
                {record.status}
              </Tag>
            )}
          </div>
          <Button
            type="text"
            icon={<MoreOutlined />}
            onClick={() => toggleRowExpansion(record[rowKey])}
            className="expand-button"
          />
        </div>

        {/* Basic info always visible */}
        <div className="card-basic-info">
          {getMobileColumns().slice(0, 3).map(col => {
            if (col.key === 'actions' || col.key === 'status') return null;
            return (
              <div key={col.key} className="info-item">
                <Text type="secondary" className="info-label">
                  {col.title}:
                </Text>
                <Text className="info-value">
                  {renderCellValue(record[col.dataIndex], col, record, index)}
                </Text>
              </div>
            );
          })}
        </div>

        {/* Expanded content */}
        {isExpanded && (
          <div className="card-expanded-content">
            <Divider style={{ margin: '12px 0' }} />
            {getMobileColumns().slice(3).map(col => {
              if (col.key === 'actions') return null;
              return (
                <div key={col.key} className="info-item">
                  <Text type="secondary" className="info-label">
                    {col.title}:
                  </Text>
                  <Text className="info-value">
                    {renderCellValue(record[col.dataIndex], col, record, index)}
                  </Text>
                </div>
              );
            })}
            
            {/* Actions */}
            {columns.find(col => col.key === 'actions') && (
              <div className="card-actions">
                <Space size="small">
                  <Button 
                    type="primary" 
                    size="small" 
                    icon={<EyeOutlined />}
                    onClick={() => handleAction('view', record)}
                  >
                    View
                  </Button>
                  <Button 
                    size="small" 
                    icon={<EditOutlined />}
                    onClick={() => handleAction('edit', record)}
                  >
                    Edit
                  </Button>
                  <Button 
                    danger 
                    size="small" 
                    icon={<DeleteOutlined />}
                    onClick={() => handleAction('delete', record)}
                  >
                    Delete
                  </Button>
                </Space>
              </div>
            )}
          </div>
        )}
      </Card>
    );
  };

  // Handle action clicks
  const handleAction = (action, record) => {
    if (onRow && onRow.onClick) {
      onRow.onClick(record);
    }
    // You can add specific action handling here
    console.log(`${action} action for:`, record);
  };

  // Get status color for tags
  const getStatusColor = (status) => {
    const statusColors = {
      'Pending': 'warning',
      'In Progress': 'processing',
      'Completed': 'success',
      'Cancelled': 'error',
      'Delivered': 'success',
      'In Transit': 'processing',
      'Ready': 'default',
      'Active': 'success',
      'Inactive': 'default'
    };
    return statusColors[status] || 'default';
  };

  // Render cell value with proper formatting
  const renderCellValue = (value, column, record = null, index = null) => {
    if (value === null || value === undefined) return '-';
    
    if (column.render) {
      return column.render(value, record, index);
    }
    
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    
    if (typeof value === 'string' && value.length > 50) {
      return `${value.substring(0, 50)}...`;
    }
    
    return value;
  };

  // Mobile view
  if (isMobile && mobileCardView) {
    return (
      <div className="mobile-table-container">
        {dataSource.map((record, index) => renderMobileCard(record, index))}
      </div>
    );
  }

  // Desktop view with responsive columns
  return (
    <div className="responsive-table-container">
      <Table
        dataSource={dataSource}
        columns={isMobile ? getMobileColumns() : columns}
        loading={loading}
        pagination={pagination}
        size={size}
        rowKey={rowKey}
        onRow={onRow}
        scroll={{ x: isMobile ? 800 : 'max-content' }}
        className={isMobile ? 'mobile-table' : 'desktop-table'}
        {...tableProps}
      />
    </div>
  );
};

export default ResponsiveTable;
