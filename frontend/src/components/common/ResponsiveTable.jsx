import React, { useState, useEffect } from 'react';
import { Table, Card, Button, Space, Typography, Drawer, Row, Col, Tag, Avatar, Divider } from 'antd';
import { EyeOutlined, MoreOutlined, UserOutlined, RightOutlined } from '@ant-design/icons';

const { Text, Title } = Typography;

/**
 * ResponsiveTable - A mobile-friendly table component
 * Shows cards on mobile, table on desktop
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
      const wasMobile = isMobile;
      const nowMobile = window.innerWidth <= 768;
      setIsMobile(nowMobile);
      console.log('📱 ResponsiveTable mobile check:', {
        windowWidth: window.innerWidth,
        isMobile: nowMobile,
        wasMobile: wasMobile,
        changed: wasMobile !== nowMobile
      });
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, [isMobile]);

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

  // Render mobile card for each row - SIMPLIFIED VERSION
  const renderMobileCard = (record, index) => {
    // Get only the most essential columns for the card
    const jobIdColumn = columns.find(col => col.dataIndex === 'jobId' || col.dataIndex === 'id');
    const customerColumn = columns.find(col => col.dataIndex === 'customer');
    const statusColumn = columns.find(col => col.dataIndex === 'status');
    const priorityColumn = columns.find(col => col.dataIndex === 'priority');
    const dateColumn = columns.find(col => col.dataIndex === 'date' || col.dataIndex === 'createdAt');

    return (
      <Card
        key={record.id || record.key || index}
        size="small"
        style={{ 
          marginBottom: 12,
          borderRadius: 8,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
        }}
        bodyStyle={{ padding: 16 }}
        actions={[
          <Button
            key="details"
            type="text"
            icon={<RightOutlined />}
            onClick={() => {
              setSelectedRecord(record);
              setDrawerVisible(true);
            }}
            style={{ 
              color: '#1890ff',
              fontWeight: 500,
              fontSize: 14
            }}
          >
            View Details
          </Button>
        ]}
      >
        {/* Essential Information Only */}
        <div style={{ marginBottom: 12 }}>
          {/* Job ID */}
          {jobIdColumn && (
            <div style={{ marginBottom: 8 }}>
              <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
                Job ID
              </Text>
              <Text strong style={{ fontSize: 16, color: '#1890ff' }}>
                {record[jobIdColumn.dataIndex]}
              </Text>
            </div>
          )}

          {/* Customer */}
          {customerColumn && (
            <div style={{ marginBottom: 8 }}>
              <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
                Customer
              </Text>
              <Text strong style={{ fontSize: 14 }}>
                {customerColumn.render ? customerColumn.render(record[customerColumn.dataIndex], record) : record[customerColumn.dataIndex]}
              </Text>
            </div>
          )}

          {/* Status and Priority Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            {/* Status */}
            {statusColumn && (
              <div>
                <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
                  Status
                </Text>
                <div style={{ marginTop: 2 }}>
                  {statusColumn.render ? statusColumn.render(record[statusColumn.dataIndex], record) : (
                    <Tag color="blue">{record[statusColumn.dataIndex]}</Tag>
                  )}
                </div>
              </div>
            )}

            {/* Priority */}
            {priorityColumn && (
              <div>
                <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
                  Priority
                </Text>
                <div style={{ marginTop: 2 }}>
                  {priorityColumn.render ? priorityColumn.render(record[priorityColumn.dataIndex], record) : (
                    <Tag color="green">{record[priorityColumn.dataIndex]}</Tag>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Date */}
          {dateColumn && (
            <div>
              <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
                Date
              </Text>
              <Text style={{ fontSize: 13 }}>
                {dateColumn.render ? dateColumn.render(record[dateColumn.dataIndex], record) : record[dateColumn.dataIndex]}
              </Text>
            </div>
          )}
        </div>
      </Card>
    );
  };

  // Create mobile drawer content - ENHANCED VERSION
  const renderMobileDetails = () => {
    if (!selectedRecord) return null;

    // Get all columns except actions
    const detailColumns = columns.filter(col => col.key !== 'actions');
    
    return (
      <div>
        {/* Header */}
        <div style={{ marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid #f0f0f0' }}>
          <Title level={4} style={{ margin: 0, color: '#1890ff' }}>
            {selectedRecord.jobId || selectedRecord.id || 'Job Details'}
          </Title>
          <Text type="secondary" style={{ fontSize: 14 }}>
            Complete information
          </Text>
        </div>
        
        {/* Details Grid */}
        <div style={{ display: 'grid', gap: '16px' }}>
          {detailColumns.map(column => {
            const value = selectedRecord[column.dataIndex];
            if (!value && column.dataIndex !== 'actions') return null;

            return (
              <div key={column.key} style={{ 
                padding: '12px',
                backgroundColor: '#fafafa',
                borderRadius: '6px',
                border: '1px solid #f0f0f0'
              }}>
                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: '4px' }}>
                  {column.title}
                </Text>
                <div style={{ fontSize: 14 }}>
                  {column.render ? column.render(value, selectedRecord) : (
                    <Text>{value}</Text>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Actions Section */}
        {columns.find(col => col.key === 'actions') && (
          <div style={{ 
            marginTop: '24px', 
            paddingTop: '16px', 
            borderTop: '1px solid #f0f0f0',
            display: 'flex',
            gap: '12px',
            justifyContent: 'center'
          }}>
            {columns.find(col => col.key === 'actions')?.render?.(null, selectedRecord)}
          </div>
        )}
      </div>
    );
  };

  // Render mobile cards or desktop table
  console.log('🎨 ResponsiveTable render:', {
    isMobile,
    dataSourceLength: dataSource?.length,
    loading,
    willRenderCards: isMobile
  });

  if (isMobile) {
    console.log('📱 Rendering mobile cards');
    return (
      <>
        <div className="mobile-table-cards" style={{ marginBottom: 16 }}>
          {loading ? (
            <div className="mobile-table-cards-loading">
              <div>Loading...</div>
            </div>
          ) : dataSource.length === 0 ? (
            <div className="mobile-table-cards-empty">
              <div>No data available</div>
            </div>
          ) : (
            dataSource.map((record, index) => renderMobileCard(record, index))
          )}
        </div>

        {/* Mobile Details Drawer */}
        <Drawer
          title={
            <div>
              <Text strong style={{ fontSize: 16 }}>Job Details</Text>
              <br />
              <Text type="secondary" style={{ fontSize: 12 }}>
                {selectedRecord?.jobId || selectedRecord?.id || 'Complete Information'}
              </Text>
            </div>
          }
          placement="bottom"
          height="80%"
          open={drawerVisible}
          onClose={() => setDrawerVisible(false)}
          style={{
            '.ant-drawer-body': {
              padding: '20px',
            }
          }}
        >
          {renderMobileDetails()}
        </Drawer>
      </>
    );
  }

  // Desktop table
  console.log('💻 Rendering desktop table');
  return (
    <Table
      columns={getResponsiveColumns()}
      dataSource={dataSource}
      loading={loading}
      pagination={pagination}
      size={size}
      locale={locale}
      scroll={{ x: 400 }}
      {...props}
    />
  );
};

export default ResponsiveTable;