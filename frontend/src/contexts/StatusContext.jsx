import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Button, Spin } from 'antd';
import { statusesAPI } from '../utils/api';
import { setStatusData } from '../constants/jobStatuses';
import { useAuth } from './AuthContext';

/**
 * Loads the status list and this user's allowed moves from the backend before showing any
 * signed-in page, so every page uses the backend's names and rules (constants/jobStatuses.js).
 */
export const StatusProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [loadedFor, setLoadedFor] = useState(null);
  const [error, setError] = useState(null);
  // Moves depend on the role (and warehouse), so load again when the user changes
  const userKey = currentUser ? `${currentUser.id}:${currentUser.role}:${currentUser.warehouseLocation || ''}` : null;

  const load = useCallback(async () => {
    setError(null);
    try {
      const response = await statusesAPI.get();
      setStatusData(response.data);
      setLoadedFor(userKey);
    } catch (err) {
      setError(err.message || 'Could not load the job statuses');
    }
  }, [userKey]);

  useEffect(() => {
    if (userKey) load();
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
