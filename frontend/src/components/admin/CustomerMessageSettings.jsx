import React, { useState } from 'react';
import { Tabs, Typography } from 'antd';
import CustomerMessageStages from './CustomerMessageStages';
import SmsSetup from './SmsSetup';
import SmsHistory from './SmsHistory';
import MessagingPlan, { RenewalWarning, useMessagingPlan } from './MessagingPlan';

/**
 * What customers are told by SMS and email, at which stage, how it is sent, and the messaging
 * plan that pays for it. `initialTab`: 'plan' when coming back from Lynk's payment page.
 */
const CustomerMessageSettings = ({ initialTab = 'stages' }) => {
  const [tab, setTab] = useState(initialTab);
  const [payAheadOpen, setPayAheadOpen] = useState(false);
  const { plan, loading, reload } = useMessagingPlan();
  const openPayAhead = () => {
    setTab('plan');
    setPayAheadOpen(true);
  };

  return (
    <div>
      <Typography.Title level={4}>Customer Messages</Typography.Title>
      {/* A renewal the balance will not cover is shown whichever tab is open */}
      <RenewalWarning plan={plan} onPayAhead={openPayAhead} />
      <Tabs
        activeKey={tab}
        onChange={setTab}
        items={[
          { key: 'stages', label: 'Stages & Wording', children: <CustomerMessageStages active={tab === 'stages'} onOpenSetup={() => setTab('sms')} /> },
          {
            key: 'plan',
            label: 'Messaging Plan',
            children: (
              <MessagingPlan
                plan={plan}
                loading={loading}
                reload={reload}
                onOpenSetup={() => setTab('sms')}
                payAheadOpen={payAheadOpen}
                setPayAheadOpen={setPayAheadOpen}
              />
            ),
          },
          // Saving a new Lynk key here also refreshes the plan (it is read with the same key)
          { key: 'sms', label: 'SMS & Email Setup', children: <SmsSetup onSaved={reload} /> },
          { key: 'history', label: 'SMS History', children: <SmsHistory active={tab === 'history'} /> },
        ]}
      />
    </div>
  );
};

export default CustomerMessageSettings;
