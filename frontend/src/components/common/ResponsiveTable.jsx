import React, { useState, useEffect } from 'react';
import { Table, Card, Button, Space, Typography, Drawer, Row, Col, Tag, Avatar, Divider } from 'antd';
import { EyeOutlined, MoreOutlined, UserOutlined, RightOutlined, SafetyOutlined } from '@ant-design/icons';

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
  onCardClick, // Handler for when card is clicked - goes directly to details
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
    const jobIdColumn = columns.find(col => col.dataIndex === 'jobId' || col.dataIndex === 'trackingId' || col.dataIndex === 'invoiceNumber' || col.dataIndex === 'batchId' || col.dataIndex === 'id');
    const customerColumn = columns.find(col => col.dataIndex === 'customer' || (col.key === 'customer' && col.title === 'Customer'));
    const userColumn = columns.find(col => col.key === 'user' || (col.title === 'User' && col.dataIndex === 'name'));
    const roleColumn = columns.find(col => col.dataIndex === 'role' || col.key === 'role');
    const roleNameColumn = columns.find(col => col.title === 'Role' && col.key === 'role');
    const descriptionColumn = columns.find(col => col.dataIndex === 'description' || col.title === 'Description');
    const usersColumn = columns.find(col => col.dataIndex === 'userCount' || col.title === 'Users');
    const typeColumn = columns.find(col => col.key === 'type' || col.title === 'Type');
    const statusColumn = columns.find(col => col.dataIndex === 'status');
    const priorityColumn = columns.find(col => col.dataIndex === 'priority');
    const dateColumn = columns.find(col => col.dataIndex === 'date' || col.dataIndex === 'createdAt');
    
    // Check if this is role data (has displayName and description)
    const isRoleData = record.displayName && record.description && record.userCount !== undefined;

    // Handle card click - if onCardClick is provided, use it directly, otherwise use drawer
    const handleCardClick = () => {
      if (onCardClick) {
        // Direct navigation to details page
        onCardClick(record);
      } else {
        // Fallback to drawer (for backward compatibility)
        setSelectedRecord(record);
        setDrawerVisible(true);
      }
    };

    return (
      <Card
        key={record.id || record.key || index}
        size="small"
        style={{ 
          marginBottom: 12,
          borderRadius: 8,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          cursor: 'pointer'
        }}
        bodyStyle={{ padding: 16 }}
        onClick={handleCardClick}
        actions={onCardClick ? [] : [
          <Button
            key="details"
            type="text"
            icon={<RightOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              handleCardClick();
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
          {/* Role Data - Special Handling */}
          {isRoleData && (() => {
            return (
              <>
                {/* Role Name */}
                <div style={{ marginBottom: 12 }}>
                  <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                    Role
                  </Text>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <SafetyOutlined style={{ color: record.color || '#1890ff', fontSize: 18 }} />
                    <div>
                      <Text strong style={{ fontSize: 16, color: '#1890ff', display: 'block' }}>
                        {record.displayName}
                      </Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {record.name}
                      </Text>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div style={{ marginBottom: 12 }}>
                  <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                    Description
                  </Text>
                  <Text style={{ fontSize: 14 }}>
                    {record.description}
                  </Text>
                </div>

                {/* Users and Type Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, gap: 16 }}>
                  {/* Users */}
                  {usersColumn && (
                    <div style={{ flex: 1 }}>
                      <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                        Users
                      </Text>
                      <div>
                        {usersColumn.render ? usersColumn.render(record.userCount, record) : (
                          <Tag color={record.userCount > 0 ? 'success' : 'default'}>{record.userCount} users</Tag>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Type */}
                  {typeColumn && (
                    <div style={{ flex: 1 }}>
                      <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                        Type
                      </Text>
                      <div>
                        {typeColumn.render ? typeColumn.render(null, record) : (
                          <Tag color={record.isSystem ? 'blue' : 'green'}>
                            {record.isSystem ? 'System' : 'Custom'}
                          </Tag>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </>
            );
          })()}

          {/* Job/Tracking/Invoice/Batch ID - Not for users/team members/roles */}
          {!isRoleData && jobIdColumn && !userColumn && (() => {
            const idValue = record[jobIdColumn.dataIndex];
            let idLabel = 'ID';
            
            // Determine label based on dataIndex
            if (jobIdColumn.dataIndex === 'trackingId') {
              idLabel = 'Tracking ID';
            } else if (jobIdColumn.dataIndex === 'invoiceNumber') {
              idLabel = 'Invoice #';
            } else if (jobIdColumn.dataIndex === 'batchId') {
              idLabel = 'Batch ID';
            } else if (jobIdColumn.dataIndex === 'jobId') {
              idLabel = 'Job ID';
            } else if (jobIdColumn.title) {
              idLabel = jobIdColumn.title;
            }
            
            return (
              <div style={{ marginBottom: 8 }}>
                <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
                  {idLabel}
                </Text>
                <Text strong style={{ fontSize: 16, color: '#1890ff' }}>
                  {idValue || 'N/A'}
                </Text>
              </div>
            );
          })()}

          {/* User/Team Member - Enhanced Layout */}
          {userColumn && (() => {
            const userName = record.name || 'N/A';
            const userEmail = record.email || '';
            const userRole = record.role ? record.role.replace('-', ' ').toUpperCase() : '';
            
            return (
              <div style={{ marginBottom: 12 }}>
                {/* User Name */}
                <div style={{ marginBottom: 8 }}>
                  <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
                    Name
                  </Text>
                  <Text strong style={{ fontSize: 16, color: '#1890ff' }}>
                    {userName}
                  </Text>
                </div>
                
                {/* Email */}
                {userEmail && userEmail !== 'N/A' && (
                  <div style={{ marginBottom: 8 }}>
                    <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
                      Email
                    </Text>
                    <Text style={{ fontSize: 14 }}>
                      {userEmail}
                    </Text>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Customer - Standard Layout */}
          {!userColumn && customerColumn && (() => {
            let customerName = 'N/A';
            
            // Check if we have a customer column
            if (customerColumn) {
              const customerValue = customerColumn.dataIndex ? record[customerColumn.dataIndex] : null;
              
              // Extract customer name directly from record (don't use render function as it may return React elements)
              if (customerValue) {
                if (typeof customerValue === 'string') {
                  customerName = customerValue;
                } else if (customerValue?.name) {
                  customerName = customerValue.name;
                } else if (Array.isArray(customerValue) && customerValue.length > 0) {
                  customerName = customerValue[0]?.name || customerValue[0] || 'N/A';
                } else if (customerValue && typeof customerValue === 'object') {
                  // Try to extract name from nested structures
                  customerName = customerValue.name || customerValue.fullName || customerValue.customerName || 'N/A';
                }
              }
            }
            
            // Fallback: Check if record has name field directly (for CustomersPage)
            if (customerName === 'N/A' && record.name) {
              customerName = record.name;
            }
            
            // Only show customer section if we found a name or have a customer column
            if (customerColumn || customerName !== 'N/A') {
              return (
                <div style={{ marginBottom: 8 }}>
                  <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
                    Customer
                  </Text>
                  <Text strong style={{ fontSize: 14 }}>
                    {customerName}
                  </Text>
                </div>
              );
            }
            
            return null;
          })()}

          {/* Fallback: Name field without user column (for CustomersPage) */}
          {!userColumn && !customerColumn && record.name && (
            <div style={{ marginBottom: 8 }}>
              <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
                Name
              </Text>
              <Text strong style={{ fontSize: 14 }}>
                {record.name}
              </Text>
            </div>
          )}

          {/* Role and Status Row - For Team Members */}
          {userColumn && (roleColumn || statusColumn) && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, gap: 16 }}>
              {/* Role */}
              {roleColumn && (
                <div style={{ flex: 1 }}>
                  <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                    Role
                  </Text>
                  <div>
                    {roleColumn.render ? roleColumn.render(record[roleColumn.dataIndex], record) : (
                      <Tag color="blue">{record[roleColumn.dataIndex]}</Tag>
                    )}
                  </div>
                </div>
              )}

              {/* Status */}
              {statusColumn && (
                <div style={{ flex: 1 }}>
                  <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                    Status
                  </Text>
                  <div>
                    {statusColumn.render ? statusColumn.render(record[statusColumn.dataIndex], record) : (
                      <Tag color={record[statusColumn.dataIndex] === 'active' ? 'success' : 'error'}>
                        {record[statusColumn.dataIndex]?.toUpperCase() || record[statusColumn.dataIndex]}
                      </Tag>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Status and Priority Row - For Jobs/Other */}
          {!userColumn && (statusColumn || priorityColumn) && (
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
          )}

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