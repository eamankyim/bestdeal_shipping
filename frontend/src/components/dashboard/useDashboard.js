import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Button, Spin } from 'antd';
import { useAuth } from '../../contexts/AuthContext';
import { fromEarly } from '../../utils/earlyData';

// The numbers each dashboard last showed in this tab, so going back to one shows them at once
// while fresh ones load. Kept in memory only, and only for the same person.
const lastShown = new Map();

/**
 * Loads a dashboard endpoint and keeps it fresh: every two minutes, and straight away when a job
 * is changed in another tab. Returns { data, error, reload }.
 */
export const useDashboard = (fetcher) => {
  const { currentUser } = useAuth();
  const userId = currentUser?.id;
  const [data, setData] = useState(() => {
    const saved = lastShown.get(fetcher);
    return saved && saved.userId === userId ? saved.data : null;
  });
  const [error, setError] = useState(null);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const reload = useCallback(async () => {
    try {
      // The first load is usually already on its way (utils/homeDashboard.js warmUp)
      const response = await fromEarly(fetcherRef.current);
      lastShown.set(fetcherRef.current, { userId, data: response.data });
      setData(response.data);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load the dashboard');
    }
  }, [userId]);

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
