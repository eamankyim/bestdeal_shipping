import React, { useState } from 'react';
import { Typography } from 'antd';
import { CarOutlined, CheckCircleOutlined, CloseCircleOutlined, InboxOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { dashboardAPI } from '../utils/api';
import JobQueue, { StatCards } from '../components/dashboard/JobQueue';
import { DashboardLoading, useDashboard } from '../components/dashboard/useDashboard';
import JobDrawer from '../components/jobs/JobDrawer';

const { Title, Text } = Typography;

/** A driver's own collections. */
const DriverDashboardPage = () => {
  const { currentUser } = useAuth();
  const { data, error, reload } = useDashboard(dashboardAPI.getDriver);
  const [openJobId, setOpenJobId] = useState(null);
  if (!data) return <DashboardLoading error={error} retry={reload} />;

  const stats = [
    { title: 'To Collect', value: data.toCollect.count, icon: <CarOutlined />, color: '#fa8c16' },
    { title: 'Collected Today', value: data.collectedToday, icon: <CheckCircleOutlined />, color: '#52c41a' },
    { title: 'On the Way to the Warehouse', value: data.collected.count, icon: <InboxOutlined />, color: '#13c2c2' },
    { title: 'Could Not Collect', value: data.failed.count, icon: <CloseCircleOutlined />, color: data.failed.count ? '#cf1322' : '#8c8c8c' },
  ];

  return (
    <div style={{ padding: 24 }} className="dashboard-page-container">
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}><CarOutlined /> My Collections</Title>
        <Text type="secondary">Hello {currentUser?.name}. Take photos of the items when you collect them.</Text>
      </div>

      <StatCards stats={stats} />

      <JobQueue
        title="To Collect"
        icon={<CarOutlined />}
        queue={data.toCollect}
        columns={['trackingId', 'customer', 'phone', 'pickup', 'pickupDate']}
        actions={[
          { status: 'collected', label: 'Collected', primary: true },
          { status: 'collection_failed', label: 'Could Not Collect', danger: true },
        ]}
        empty="Nothing to collect right now"
        onOpen={setOpenJobId}
        onChanged={reload}
      />
      <JobQueue
        title="On the Way to the Warehouse"
        icon={<InboxOutlined />}
        queue={data.collected}
        columns={['trackingId', 'customer', 'pickup']}
        empty="Nothing waiting to be dropped at the warehouse"
        onOpen={setOpenJobId}
        onChanged={reload}
      />
      <JobQueue
        title="Could Not Collect"
        icon={<CloseCircleOutlined />}
        queue={data.failed}
        columns={['trackingId', 'customer', 'phone', 'pickup']}
        empty="None"
        onOpen={setOpenJobId}
        onChanged={reload}
      />

      <JobDrawer jobId={openJobId} onClose={() => setOpenJobId(null)} onChanged={reload} />
    </div>
  );
};

export default DriverDashboardPage;
