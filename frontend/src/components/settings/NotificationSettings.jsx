import React, { useState, useEffect } from 'react';
import { Card, Switch, Typography, Space, Button, message } from 'antd';
import { BellOutlined, SoundOutlined } from '@ant-design/icons';
import soundNotificationService from '../../services/soundNotificationService';

const { Title, Text } = Typography;

const NotificationSettings = () => {
  const [soundEnabled, setSoundEnabled] = useState(soundNotificationService.isSoundEnabled());

  const handleSoundToggle = (enabled) => {
    setSoundEnabled(enabled);
    soundNotificationService.setSoundEnabled(enabled);
    
    if (enabled) {
      // Play a test sound when enabling
      soundNotificationService.playNotificationSound('success');
      message.success('Sound notifications enabled');
    } else {
      message.info('Sound notifications disabled');
    }
  };

  const handleTestSound = () => {
    soundNotificationService.playNotificationSound('default');
    message.info('Test sound played');
  };

  return (
    <Card title={
      <Space>
        <BellOutlined />
        <span>Notification Settings</span>
      </Space>
    }>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <Text type="secondary" style={{ display: 'block', marginBottom: '16px', fontSize: '14px' }}>
            Enable or disable sound notifications for new alerts
          </Text>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '150px', flex: '1 1 auto' }}>
              <SoundOutlined style={{ fontSize: '16px' }} />
              <Text style={{ whiteSpace: 'nowrap', fontSize: '14px' }}>Sound Notifications</Text>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0, height: '24px' }}>
              <Switch 
                checked={soundEnabled} 
                onChange={handleSoundToggle}
                size="default"
                style={{ minWidth: '44px' }}
                className="notification-switch-fixed"
              />
            </div>
            <Button 
              type="link" 
              onClick={handleTestSound}
              disabled={!soundEnabled}
              icon={<BellOutlined />}
              style={{ padding: '0', whiteSpace: 'nowrap', flexShrink: 0, minHeight: '32px' }}
            >
              Test Sound
            </Button>
          </div>
        </div>

        <div style={{ 
          padding: '16px', 
          backgroundColor: '#f5f5f5', 
          borderRadius: '6px',
          border: '1px solid #d9d9d9'
        }}>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            <strong>Note:</strong> Sound notifications will play when new jobs are created, 
            status changes occur, or other important events happen. You can test the sound 
            using the button above.
          </Text>
        </div>
      </Space>
    </Card>
  );
};

export default NotificationSettings;
