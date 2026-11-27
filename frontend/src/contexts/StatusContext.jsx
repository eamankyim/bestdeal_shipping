import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Button, Spin } from 'antd';
import { statusesAPI } from '../utils/api';
import { setStatusData } from '../constants/jobStatuses';
import { fromEarly } from '../utils/earlyData';
import { useAuth } from './AuthContext';

const CACHE_KEY = 'bestdeal_statuses';

/** The copy saved on this device, if it was saved for this same user and role. */
const readCache = (userKey) => {
  try {
    const saved = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
    return saved?.userKey === userKey ? saved.data : null;
  } catch (error) {
    return null;
  }
};

/**
 * Gives every signed-in page the backend's status list and this user's allowed moves
 * (constants/jobStatuses.js). The copy saved on this device is used straight away and a fresh one
 * is fetched in the background, so pages never wait for it after the first visit. The list only
 * changes when the app is updated, and the backend checks every action anyway.
 */
export const StatusProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [loadedFor, setLoadedFor] = useState(null);
  const [error, setError] = useState(null);
  // Moves depend on the role (and warehouse), so the list is kept per user
  const userKey = currentUser ? `${currentUser.id}:${currentUser.role}:${currentUser.warehouseLocation || ''}` : null;

  const load = useCallback(async () => {
    setError(null);
    try {
      // Usually already on its way since the app opened (utils/homeDashboard.js warmUp)
      const response = await fromEarly(statusesAPI.get);
      setStatusData(response.data);
      localStorage.setItem(CACHE_KEY, JSON.stringify({ userKey, data: response.data }));
      setLoadedFor(userKey);
    } catch (err) {
      // With a saved copy on screen, a failed refresh changes nothing
      if (!readCache(userKey)) setError(err.message || 'Could not load the job statuses');
    }
  }, [userKey]);

  useEffect(() => {
    if (!userKey) return;
    const saved = readCache(userKey);
    if (saved) {
      setStatusData(saved);
      setLoadedFor(userKey);
    }
    load();
  }, [userKey, load]);

  if (error) {
    return (
      <div style={{ padding: 24 }}>
        <Alert type="error" showIcon message="Something went wrong loading the app" description={error} action={<Button onClick={load}>Retry</Button>} />
      </div>
    );
  }
  if (!userKey || loadedFor !== userKey) {
    return <div style={{ padding: 48, textAlign: 'center' }}><Spin size="large" /></div>;
  }
  return children;
};

export default StatusProvider;
