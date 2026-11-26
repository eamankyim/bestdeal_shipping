import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Button, Card, Form, Input, Select, Space, Spin, Switch, Typography, message } from 'antd';
import { SaveOutlined, SendOutlined } from '@ant-design/icons';
import { settingsAPI } from '../../utils/api';

const { Text } = Typography;

/** Choose the SMS provider, enter its keys, test it, and switch SMS (and email through Lynk) on or off. */
const SmsSetup = () => {
  const [form] = Form.useForm();
  const [sms, setSms] = useState(null);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [testPhone, setTestPhone] = useState('');
  const [testing, setTesting] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [testingEmail, setTestingEmail] = useState(false);
  const providerKey = Form.useWatch('provider', form);

  const show = useCallback((settings) => {
    setSms(settings);
    form.setFieldsValue({
      provider: settings.provider || settings.providers[0]?.key,
      enabled: settings.enabled,
      lynkEmail: settings.lynkEmail.enabled,
      values: Object.fromEntries(settings.providers.map((provider) => [
        provider.key,
        Object.fromEntries(provider.fields.map((field) => [field.key, field.value])),
      ])),
    });
  }, [form]);

  const load = useCallback(async () => {
    setError(null);
    try {
      const response = await settingsAPI.getSms();
      show(response.data.sms);
    } catch (err) {
      setError(err.message || 'Failed to load SMS settings');
    }
  }, [show]);

  useEffect(() => { load(); }, [load]);

  const save = async (values) => {
    setSaving(true);
    try {
      const response = await settingsAPI.updateSms({
        provider: values.provider,
        enabled: values.enabled === true,
        lynkEmail: values.lynkEmail === true,
        values: values.values?.[values.provider] || {},
      });
      show(response.data.sms);
      message.success('Settings saved');
    } catch (err) {
      message.error(err.message || 'Failed to save the settings');
    } finally {
      setSaving(false);
    }
  };

  const sendTest = async () => {
    setTesting(true);
    try {
      await settingsAPI.sendTestSms(testPhone.trim());
      message.success('Test SMS sent. Check the phone.');
    } catch (err) {
      message.error(err.message || 'The test SMS was not sent');
    } finally {
      setTesting(false);
    }
  };

  const sendEmailTest = async () => {
    setTestingEmail(true);
    try {
      await settingsAPI.sendTestEmail(testEmail.trim());
      message.success('Test email sent. Check the inbox.');
    } catch (err) {
      message.error(err.message || 'The test email was not sent');
    } finally {
      setTestingEmail(false);
    }
  };

  if (error) return <Alert type="error" showIcon message={error} action={<Button size="small" onClick={load}>Retry</Button>} />;

  const provider = sms?.providers.find((item) => item.key === providerKey);

  return (
    <div>
      {!sms && <div style={{ textAlign: 'center', padding: 32 }}><Spin /></div>}
      <div style={{ display: sms ? 'block' : 'none', maxWidth: 640 }}>
        {sms && (
          <Alert
            type={sms.ready ? 'success' : 'warning'}
            showIcon
            style={{ marginBottom: 16 }}
            message={sms.ready ? 'SMS is on. Customers receive the stages you switched on.' : `No SMS is being sent: ${sms.problem}.`}
          />
        )}

        <Card size="small" title="Provider" style={{ marginBottom: 16 }}>
          <Form form={form} layout="vertical" onFinish={save} autoComplete="off">
            <Form.Item name="provider" label="SMS Provider" rules={[{ required: true, message: 'Please choose a provider' }]}>
              <Select
                placeholder="Choose a provider"
                options={(sms?.providers || []).map((item) => ({ value: item.key, label: `${item.label} (${item.coverage})` }))}
              />
            </Form.Item>

            {provider?.fields.map((field) => (
              <Form.Item
                key={`${provider.key}-${field.key}`}
                name={['values', provider.key, field.key]}
                label={field.label}
                extra={field.help}
                rules={[{ required: field.required && !field.saved, message: `Please enter the ${field.label}` }]}
              >
                {field.secret ? (
                  <Input.Password autoComplete="new-password" placeholder={field.saved ? 'Saved. Leave blank to keep it' : ''} />
                ) : (
                  <Input autoComplete="off" />
                )}
              </Form.Item>
            ))}

            <Form.Item name="enabled" label="Send SMS to customers" valuePropName="checked" extra="Off stops every SMS, whatever the stages say.">
              <Switch checkedChildren="On" unCheckedChildren="Off" aria-label="Send SMS to customers" />
            </Form.Item>

            {/* Kept in the form even when hidden, so changing the SMS provider never changes how emails are sent */}
            <Form.Item
              name="lynkEmail"
              label="Send emails through Lynk"
              valuePropName="checked"
              hidden={providerKey !== 'lynk' && !sms?.lynkEmail.enabled}
              extra="Customer emails, invoices and staff invitations use the same Lynk key. Off keeps the current email (SMTP) set-up."
            >
              <Switch checkedChildren="On" unCheckedChildren="Off" aria-label="Send emails through Lynk" />
            </Form.Item>

            <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={saving}>Save Settings</Button>
          </Form>
        </Card>

        <Card size="small" title="Send a test SMS">
          <Space.Compact style={{ width: '100%' }}>
            <Input
              value={testPhone}
              aria-label="Test phone number"
              placeholder="e.g. +233 24 000 0000 or +44 7700 900123"
              onChange={(event) => setTestPhone(event.target.value)}
            />
            <Button icon={<SendOutlined />} onClick={sendTest} loading={testing} disabled={!testPhone.trim() || !sms?.configured}>Send Test</Button>
          </Space.Compact>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Uses the saved settings, and works before SMS is switched on. Your provider charges for it as usual.
          </Text>
        </Card>

        {sms?.lynkEmail.configured && (
          <Card size="small" title="Send a test email through Lynk" style={{ marginTop: 16 }}>
            <Space.Compact style={{ width: '100%' }}>
              <Input
                value={testEmail}
                type="email"
                aria-label="Test email address"
                placeholder="e.g. you@example.com"
                onChange={(event) => setTestEmail(event.target.value)}
              />
              <Button icon={<SendOutlined />} onClick={sendEmailTest} loading={testingEmail} disabled={!testEmail.trim()}>Send Test Email</Button>
            </Space.Compact>
            <Text type="secondary" style={{ fontSize: 12 }}>Uses the saved Lynk key, and works before emails are switched over.</Text>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SmsSetup;
