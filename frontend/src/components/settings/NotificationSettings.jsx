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
          <Title level={4}>Sound Notifications</Title>
          <Text type="secondary">
            Enable or disable sound notifications for new alerts
          </Text>
          
          <div style={{ marginTop: '16px' }}>
            <Space size="large" align="center">
              <Space>
                <SoundOutlined />
                <Text>Sound Notifications</Text>
              </Space>
              <Switch 
                checked={soundEnabled} 
                onChange={handleSoundToggle}
                size="default"
              />
              <Button 
                type="link" 
                onClick={handleTestSound}
                disabled={!soundEnabled}
                icon={<BellOutlined />}
              >
                Test Sound
              </Button>
            </Space>
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
