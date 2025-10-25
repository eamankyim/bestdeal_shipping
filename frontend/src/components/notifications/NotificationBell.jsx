import React, { useState, useEffect } from 'react';
import { Badge, Dropdown, List, Typography, Empty, Button, Space, Divider } from 'antd';
import { BellOutlined, CheckOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { notificationAPI } from '../../utils/api';
import { useNavigate } from 'react-router-dom';
import soundNotificationService from '../../services/soundNotificationService';
import './NotificationBell.css';

const { Text } = Typography;

const NotificationBell = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [previousUnreadCount, setPreviousUnreadCount] = useState(0);

  useEffect(() => {
    fetchUnreadCount();
    fetchNotifications();
  }, []);

  // Auto-refresh notifications every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchUnreadCount();
      if (dropdownVisible) {
        fetchNotifications();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [dropdownVisible]);

  const fetchUnreadCount = async () => {
    try {
      const response = await notificationAPI.getUnreadCount();
      if (response.success) {
        const newUnreadCount = response.data.unreadCount;
        
        // Check if there are new notifications (unread count increased)
        if (newUnreadCount > previousUnreadCount && previousUnreadCount > 0) {
          console.log('🔔 New notification detected! Playing sound...');
          // Play sound for new notification
          soundNotificationService.playNotificationSound('default');
        }
        
        setUnreadCount(newUnreadCount);
        setPreviousUnreadCount(newUnreadCount);
      }
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      console.log('📬 Fetching notifications...');
      const response = await notificationAPI.getAll({ limit: 10 });
      console.log('📬 Notifications response:', response);
      
      if (response.success) {
        setNotifications(response.data.notifications || []);
        console.log(`📬 Loaded ${response.data.notifications?.length || 0} notifications`);
      } else {
        console.error('❌ Failed to fetch notifications:', response.message);
      }
    } catch (error) {
      console.error('❌ Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationAPI.markAsRead(notificationId);
      fetchUnreadCount();
      fetchNotifications();
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      fetchUnreadCount();
      fetchNotifications();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleClearAll = async () => {
    try {
      console.log('🗑️ Clearing all notifications...');
      const response = await notificationAPI.clearAll();
      console.log('✅ Clear all response:', response);
      
      if (response.success) {
        setNotifications([]);
        setUnreadCount(0);
        console.log('✅ Notifications cleared successfully');
      } else {
        console.error('❌ Clear all failed:', response.message);
      }
    } catch (error) {
      console.error('❌ Failed to clear notifications:', error);
    }
  };

  const handleNotificationClick = (notification) => {
    // Mark as read
    if (!notification.isRead) {
      handleMarkAsRead(notification.id);
    }

    // Play sound based on notification type
    soundNotificationService.playNotificationSound(notification.type);

    // Navigate based on notification type
    if (notification.relatedEntityType === 'job') {
      navigate('/jobs');
      setDropdownVisible(false);
    } else if (notification.relatedEntityType === 'batch') {
      navigate('/batch-management');
      setDropdownVisible(false);
    } else if (notification.relatedEntityType === 'invoice') {
      navigate('/invoice-management');
      setDropdownVisible(false);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'job_status':
        return '📦';
      case 'assignment':
        return '👤';
      case 'invoice':
        return '💰';
      case 'system':
        return '⚙️';
      default:
        return '🔔';
    }
  };

  const menu = (
    <div className="notification-dropdown">
      <div className="notification-header">
        <Text strong>Notifications</Text>
        {unreadCount > 0 && (
          <Badge count={unreadCount} style={{ backgroundColor: '#ff4d4f' }} />
        )}
      </div>
      
      {notifications.length > 0 && (
        <div className="notification-actions">
          <Space size="small">
            <Button 
              type="link" 
              size="small" 
              icon={<CheckOutlined />}
              onClick={handleMarkAllAsRead}
            >
              Mark all read
            </Button>
            <Button 
              type="link" 
              size="small" 
              danger
              icon={<DeleteOutlined />}
              onClick={handleClearAll}
            >
              Clear all
            </Button>
          </Space>
        </div>
      )}

      <Divider style={{ margin: '8px 0' }} />

      <div className="notification-list">
        {notifications.length > 0 ? (
          <List
            dataSource={notifications}
            loading={loading}
            renderItem={(item) => (
              <List.Item
                className={`notification-item ${!item.isRead ? 'unread' : ''}`}
                onClick={() => handleNotificationClick(item)}
                style={{
                  cursor: 'pointer',
                  padding: '12px 16px',
                  backgroundColor: !item.isRead ? '#f0f9ff' : 'transparent',
                }}
              >
                <Space direction="vertical" style={{ width: '100%' }} size={2}>
                  <Space>
                    <span style={{ fontSize: '18px' }}>{getNotificationIcon(item.type)}</span>
                    <Text strong={!item.isRead}>{item.title}</Text>
                    {!item.isRead && (
                      <Badge dot status="processing" />
                    )}
                  </Space>
                  <Text type="secondary" style={{ fontSize: '13px' }}>
                    {item.message}
                  </Text>
                  <Text type="secondary" style={{ fontSize: '11px' }}>
                    {new Date(item.createdAt).toLocaleString()}
                  </Text>
                </Space>
              </List.Item>
            )}
          />
        ) : (
          <Empty 
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="No notifications"
            style={{ padding: '24px 0' }}
          />
        )}
      </div>
    </div>
  );

  return (
    <Dropdown
      overlay={menu}
      trigger={['click']}
      placement="bottomRight"
      open={dropdownVisible}
      onOpenChange={(visible) => {
        setDropdownVisible(visible);
        if (visible) {
          fetchNotifications();
        }
      }}
      overlayStyle={{ width: 380 }}
    >
      <Badge count={unreadCount} overflowCount={99}>
        <Button
          type="text"
          icon={<BellOutlined style={{ fontSize: '20px' }} />}
          style={{
            height: '40px',
            width: '40px',
            borderRadius: '50%',
          }}
        />
      </Badge>
    </Dropdown>
  );
};

export default NotificationBell;


