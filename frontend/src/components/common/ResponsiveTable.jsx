import React, { useState, useEffect } from 'react';
import { Table, Card, Button, Space, Typography, Drawer } from 'antd';
import { EyeOutlined, MoreOutlined } from '@ant-design/icons';

const { Text } = Typography;

/**
 * ResponsiveTable - A mobile-friendly table component
 * Automatically adapts columns based on screen size
 */
const ResponsiveTable = ({ 
  columns, 
  dataSource, 
  loading, 
  pagination = true,
  size = 'small',
  locale,
  title,
  extra,
  ...props 
}) => {
  const [isMobile, setIsMobile] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  // Detect mobile devices
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Filter columns based on mobile property
  const getResponsiveColumns = () => {
    if (!isMobile) {
      return columns; // Show all columns on desktop
    }

    // On mobile, only show columns marked as mobile: true
    const mobileColumns = columns.filter(col => col.mobile !== false);
    
    // Add a "More" button column for mobile
    const moreColumn = {
      title: '',
      key: 'more',
      width: 50,
      render: (_, record) => (
        <Button
          type="text"
          size="small"
          icon={<MoreOutlined />}
          onClick={() => {
            setSelectedRecord(record);
            setDrawerVisible(true);
          }}
        />
      ),
    };

    return [...mobileColumns, moreColumn];
  };

  // Create mobile drawer content
  const renderMobileDetails = () => {
    if (!selectedRecord) return null;

    const hiddenColumns = columns.filter(col => col.mobile === false);
    
    return (
      <div>
        <div style={{ marginBottom: '16px' }}>
          <Text strong style={{ fontSize: '16px' }}>{selectedRecord.jobId || selectedRecord.id}</Text>
        </div>
        
        {hiddenColumns.map(column => {
          const value = selectedRecord[column.dataIndex];
          if (!value && column.dataIndex !== 'actions') return null;

          return (
            <div key={column.key} style={{ marginBottom: '12px' }}>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {column.title}:
              </Text>
              <div style={{ marginTop: '4px' }}>
                {column.render ? column.render(value, selectedRecord) : value}
              </div>
            </div>
          );
        })}
        
        {/* Show actions if they exist */}
        {columns.find(col => col.key === 'actions') && (
          <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f0f0f0' }}>
            {columns.find(col => col.key === 'actions')?.render?.(null, selectedRecord)}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <Table
        columns={getResponsiveColumns()}
        dataSource={dataSource}
        loading={loading}
        pagination={pagination}
        size={size}
        locale={locale}
        scroll={{ x: isMobile ? 400 : undefined }}
        {...props}
      />

      {/* Mobile Details Drawer */}
      <Drawer
        title="Details"
        placement="bottom"
        height="70%"
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        style={{
          '.ant-drawer-body': {
            padding: '16px',
          }
        }}
      >
        {renderMobileDetails()}
      </Drawer>
    </>
  );
};

export default ResponsiveTable;