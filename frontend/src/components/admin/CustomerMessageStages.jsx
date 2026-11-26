import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Button, Collapse, Form, Input, Space, Spin, Switch, Tag, Typography, message } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import { settingsAPI } from '../../utils/api';
import { countSmsParts, previewMessage } from '../../utils/sms';

const { Text } = Typography;
const MAX_SMS = 459;

const SmsPreview = ({ text, placeholders }) => {
  const preview = previewMessage(text, placeholders);
  const { length, parts, isGsm } = countSmsParts(preview);
  return (
    <div style={{ background: '#f5f5f5', borderRadius: 6, padding: 12 }}>
      <Text style={{ whiteSpace: 'pre-wrap' }}>{preview}</Text>
      <div>
        <Text type={parts > 1 ? 'warning' : 'secondary'} style={{ fontSize: 12 }}>
          Example: {length} characters, charged as {parts} SMS
          {!isGsm && ' (special letters or emoji make a text cost more)'}
        </Text>
      </div>
    </div>
  );
};

/** Which stages send the customer an SMS or an email, and what each one says. */
const CustomerMessageStages = ({ active, onOpenSetup }) => {
  const [data, setData] = useState(null);
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState(null);
  const [dirty, setDirty] = useState([]);
  const [saving, setSaving] = useState(false);

  const hasEdits = useRef(false);
  hasEdits.current = dirty.length > 0;

  const load = useCallback(async ({ keepEdits = false } = {}) => {
    setError(null);
    try {
      const response = await settingsAPI.getCustomerMessages();
      setData(response.data);
      if (keepEdits) return;
      setMessages(response.data.messages);
      setDirty([]);
    } catch (err) {
      setError(err.message || 'Failed to load customer messages');
    }
  }, []);

  // Coming back from the set-up tab refreshes the warning, but never throws away unsaved wording
  useEffect(() => {
    if (active) load({ keepEdits: hasEdits.current });
  }, [active, load]);

  const change = (key, changes) => {
    setMessages((current) => current.map((item) => (item.key === key ? { ...item, ...changes } : item)));
    setDirty((current) => (current.includes(key) ? current : [...current, key]));
  };

  const save = async () => {
    setSaving(true);
    try {
      const response = await settingsAPI.updateCustomerMessages(
        messages
          .filter((item) => dirty.includes(item.key))
          .map(({ key, enabled, subject, body, smsEnabled, smsBody }) => ({ key, enabled, subject, body, smsEnabled, smsBody }))
      );
      setMessages(response.data.messages);
      setDirty([]);
      message.success('Customer messages saved');
    } catch (err) {
      message.error(err.message || 'Failed to save customer messages');
    } finally {
      setSaving(false);
    }
  };

  if (error) return <Alert type="error" showIcon message={error} action={<Button size="small" onClick={() => load({ keepEdits: dirty.length > 0 })}>Retry</Button>} />;
  if (!data) return <div style={{ textAlign: 'center', padding: 32 }}><Spin /></div>;

  const channelSwitch = (item, channel, field) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <Text type="secondary" style={{ fontSize: 12 }}>{channel}</Text>
      <Switch
        checked={item[field]}
        aria-label={`${channel}: ${item.label}`}
        onChange={(value) => change(item.key, { [field]: value })}
      />
    </div>
  );

  return (
    <div>
      <Text type="secondary">
        Choose which stages send the customer an SMS or an email, and write each one in your own words.
      </Text>

      {!data.smsReady && (
        <Alert
          type="warning"
          showIcon
          style={{ marginTop: 16 }}
          message={`No SMS will be sent yet: ${data.smsProblem}.`}
          action={<Button size="small" onClick={onOpenSetup}>Set Up</Button>}
        />
      )}
      {!data.emailConfigured && (
        <Alert
          type="warning"
          showIcon
          style={{ marginTop: 16 }}
          message="No emails will be sent yet: email is not set up."
          action={<Button size="small" onClick={onOpenSetup}>Set Up</Button>}
        />
      )}

      {/* Plain flex rows: the app's phone styles stack every Ant Design Space into a column */}
      <div style={{ margin: '16px 0', display: 'flex', flexWrap: 'wrap', gap: '8px 4px' }}>
        <Text strong>You can use:</Text>
        {data.placeholders.map((placeholder) => (
          <Tag key={placeholder.key} title={placeholder.label}>{`{{${placeholder.key}}}`}</Tag>
        ))}
      </div>

      <Collapse
        items={messages.map((item) => ({
          key: item.key,
          label: (
            <Space wrap size={[8, 0]}>
              <span>{item.label}</span>
              {dirty.includes(item.key) && <Tag color="orange">Not saved</Tag>}
            </Space>
          ),
          extra: (
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-end', gap: '4px 16px' }} onClick={(event) => event.stopPropagation()}>
              {channelSwitch(item, 'SMS', 'smsEnabled')}
              {channelSwitch(item, 'Email', 'enabled')}
            </div>
          ),
          children: (
            <Form layout="vertical" component="div">
              <Form.Item label="SMS text" required>
                <Input.TextArea
                  value={item.smsBody}
                  rows={3}
                  maxLength={MAX_SMS}
                  aria-label={`SMS text: ${item.label}`}
                  onChange={(event) => change(item.key, { smsBody: event.target.value })}
                />
                <div style={{ marginTop: 8 }}><SmsPreview text={item.smsBody} placeholders={data.placeholders} /></div>
              </Form.Item>
              <Form.Item label="Email subject" required>
                <Input
                  value={item.subject}
                  maxLength={200}
                  aria-label={`Email subject: ${item.label}`}
                  onChange={(event) => change(item.key, { subject: event.target.value })}
                />
              </Form.Item>
              <Form.Item label="Email message" required style={{ marginBottom: 0 }}>
                <Input.TextArea
                  value={item.body}
                  rows={7}
                  maxLength={5000}
                  aria-label={`Email message: ${item.label}`}
                  onChange={(event) => change(item.key, { body: event.target.value })}
                />
              </Form.Item>
            </Form>
          ),
        }))}
      />

      <Space style={{ marginTop: 16 }}>
        <Button type="primary" icon={<SaveOutlined />} onClick={save} loading={saving} disabled={dirty.length === 0}>Save Changes</Button>
        <Button onClick={() => load()} disabled={saving || dirty.length === 0}>Discard Changes</Button>
      </Space>
    </div>
  );
};

export default CustomerMessageStages;
