import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Button, Spin } from 'antd';

/**
 * Loads a dashboard endpoint and keeps it fresh: every two minutes, and straight away when a job
 * is changed in another tab. Returns { data, error, reload }.
 */
export const useDashboard = (fetcher) => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const reload = useCallback(async () => {
    try {
      const response = await fetcherRef.current();
      setData(response.data);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load the dashboard');
    }
  }, []);

  useEffect(() => {
    reload();
    const timer = setInterval(reload, 120000);
    const channel = new BroadcastChannel('job_updates');
    channel.onmessage = () => reload();
    return () => {
      clearInterval(timer);
      channel.close();
    };
  }, [reload]);

  return { data, error, reload };
};

/** What a dashboard shows until its data has arrived. */
export const DashboardLoading = ({ error, retry }) => (
  <div style={{ padding: 24 }}>
    {error ? (
      <Alert type="error" showIcon message="Could not load the dashboard" description={error} action={<Button size="small" onClick={retry}>Retry</Button>} />
    ) : (
      <div style={{ textAlign: 'center', padding: 48 }}><Spin size="large" /></div>
    )}
  </div>
);

export default useDashboard;
