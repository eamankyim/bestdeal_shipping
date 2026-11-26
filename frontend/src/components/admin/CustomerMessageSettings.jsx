import React, { useState } from 'react';
import { Tabs, Typography } from 'antd';
import CustomerMessageStages from './CustomerMessageStages';
import SmsSetup from './SmsSetup';
import SmsHistory from './SmsHistory';

/** What customers are told by SMS and email, at which stage, and how SMS is sent. */
const CustomerMessageSettings = () => {
  const [tab, setTab] = useState('stages');

  return (
    <div>
      <Typography.Title level={4}>Customer Messages</Typography.Title>
      <Tabs
        activeKey={tab}
        onChange={setTab}
        items={[
          { key: 'stages', label: 'Stages & Wording', children: <CustomerMessageStages active={tab === 'stages'} onOpenSetup={() => setTab('sms')} /> },
          { key: 'sms', label: 'SMS & Email Setup', children: <SmsSetup /> },
          { key: 'history', label: 'SMS History', children: <SmsHistory active={tab === 'history'} /> },
        ]}
      />
    </div>
  );
};

export default CustomerMessageSettings;
