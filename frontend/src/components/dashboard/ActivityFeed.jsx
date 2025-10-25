import React from 'react';
import { Card, List, Avatar, Tag, Empty } from 'antd';
import { ClockCircleOutlined } from '@ant-design/icons';

/**
 * Reusable Activity Feed Component
 * Shows recent activities/notifications for any role
 */
const ActivityFeed = ({ 
  title = 'Recent Activity',
  activities = [],
  loading = false,
  maxItems = 5,
  onItemClick,
  showAvatar = true,
  emptyText = 'No recent activity'
}) => {
  const getStatusColor = (status) => {
    const statusColors = {
      success: 'success',
      pending: 'warning',
      failed: 'error',
      completed: 'success',
      'in-progress': 'processing',
      cancelled: 'default',
    };
    return statusColors[status?.toLowerCase()] || 'default';
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / 60000);
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <Card 
      title={title}
      bordered={false}
      className="activity-feed-card"
    >
      {activities.length === 0 ? (
        <Empty 
          description={emptyText}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : (
        <List
          loading={loading}
          dataSource={activities.slice(0, maxItems)}
          renderItem={(item) => (
            <List.Item
              onClick={() => onItemClick && onItemClick(item)}
              style={{ 
                cursor: onItemClick ? 'pointer' : 'default',
                padding: '12px 0'
              }}
            >
              <List.Item.Meta
                avatar={
                  showAvatar && (
                    <Avatar 
                      src={item.avatar} 
                      icon={item.icon}
                      style={{ backgroundColor: item.avatarColor || '#1890ff' }}
                    >
                      {!item.avatar && !item.icon && item.user?.charAt(0)}
                    </Avatar>
                  )
                }
                title={
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{item.title}</span>
                    {item.status && (
                      <Tag color={getStatusColor(item.status)}>
                        {item.status}
                      </Tag>
                    )}
                  </div>
                }
                description={
                  <>
                    <div>{item.description}</div>
                    <div style={{ marginTop: 4, fontSize: 12, color: '#999' }}>
                      <ClockCircleOutlined style={{ marginRight: 4 }} />
                      {formatTime(item.timestamp)}
                    </div>
                  </>
                }
              />
            </List.Item>
          )}
        />
      )}
    </Card>
  );
};

export default ActivityFeed;


