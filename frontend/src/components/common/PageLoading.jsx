import React from 'react';
import { Spin } from 'antd';

/** Shown for the moment a page is being fetched. */
const PageLoading = () => (
  <div style={{ padding: 48, textAlign: 'center' }}>
    <Spin size="large" />
  </div>
);

export default PageLoading;
