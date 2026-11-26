import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Button, List, Tag, Typography } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { settingsAPI } from '../../utils/api';

const { Text, Paragraph } = Typography;

const STATUS = {
  sent: { color: 'success', label: 'Sent' },
  failed: { color: 'error', label: 'Failed' },
  skipped: { color: 'warning', label: 'Not sent' },
};

/** SMS to customers, newest first, with the reason for any that did not go. */
const SmsHistory = ({ active }) => {
  const [page, setPage] = useState(1);
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await settingsAPI.getSmsHistory({ page, limit: 20 });
      setHistory(response.data);
    } catch (err) {
      setError(err.message || 'Failed to load the SMS history');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    if (active) load();
  }, [active, load]);

  if (error) return <Alert type="error" showIcon message={error} action={<Button size="small" onClick={load}>Retry</Button>} />;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 16 }}>
        <Text type="secondary">&quot;Sent&quot; means the provider accepted the SMS. Use the provider&apos;s dashboard to see whether it reached the phone.</Text>
        <Button icon={<ReloadOutlined />} onClick={load} loading={loading}>Refresh</Button>
      </div>
      <List
        bordered
        loading={loading}
        dataSource={history?.messages || []}
        locale={{ emptyText: 'No SMS yet' }}
        pagination={{ current: page, pageSize: 20, total: history?.total || 0, onChange: setPage, showSizeChanger: false, hideOnSinglePage: true }}
        renderItem={(item) => (
          <List.Item>
            <div style={{ width: '100%' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '4px 8px' }}>
                <Tag color={STATUS[item.status]?.color}>{STATUS[item.status]?.label || item.status}</Tag>
                <Text strong>{item.eventLabel}</Text>
                {item.reference && <Text>{item.reference}</Text>}
                <Text>{item.recipient || 'No number'}</Text>
                <Text type="secondary" style={{ fontSize: 12 }}>{new Date(item.createdAt).toLocaleString()}</Text>
              </div>
              <Paragraph style={{ margin: '4px 0 0', whiteSpace: 'pre-wrap' }}>{item.body}</Paragraph>
              {item.error && <Text type="danger">{item.error}</Text>}
            </div>
          </List.Item>
        )}
      />
    </div>
  );
};

export default SmsHistory;
