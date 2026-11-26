import React, { useState } from 'react';
import { Button, Card, Col, Result, Row, Space, Tag, Typography } from 'antd';
import {
  CarOutlined, ClockCircleOutlined, DollarOutlined, FileTextOutlined, PlusOutlined, ShoppingOutlined, UserOutlined, WarningOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { dashboardAPI } from '../utils/api';
import { canCreateJobs, hasFullAccess, isGhanaWarehouse } from '../utils/permissions';
import { jobStatusList, stageList } from '../constants/jobStatuses';
import JobQueue, { StatCards } from '../components/dashboard/JobQueue';
import { DashboardLoading, useDashboard } from '../components/dashboard/useDashboard';
import JobDrawer from '../components/jobs/JobDrawer';
import FinanceDashboard from './FinanceDashboard';
import WarehouseDashboard from './WarehouseDashboard';
import GhanaWarehouseDashboardPage from './GhanaWarehouseDashboardPage';
import DriverDashboardPage from './DriverDashboardPage';
import DeliveryDashboard from './DeliveryDashboard';

const { Title, Text } = Typography;
const money = (value) => `£${Number(value || 0).toFixed(2)}`;

/** The office's view of the whole business. */
const OfficeOverview = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { data, error, reload } = useDashboard(dashboardAPI.getOverview);
  const [openJobId, setOpenJobId] = useState(null);
  if (!data) return <DashboardLoading error={error} retry={reload} />;

  const { counts, totals } = data;
  const stats = [
    { title: 'Active Jobs', value: totals.active, icon: <ShoppingOutlined />, color: '#1890ff', note: `${totals.jobs} in all` },
    { title: 'Waiting for a Driver', value: data.waitingForDriver, icon: <ClockCircleOutlined />, color: '#faad14' },
    { title: 'Needs Attention', value: data.needsAttention.count, icon: <WarningOutlined />, color: data.needsAttention.count ? '#cf1322' : '#52c41a', note: 'Failed collections and deliveries' },
    { title: 'Customers', value: totals.customers, icon: <UserOutlined />, color: '#52c41a' },
    { title: 'Paid This Month', value: money(data.revenueThisMonth), icon: <DollarOutlined />, color: '#722ed1' },
    { title: 'Unpaid Invoices', value: money(data.unpaidInvoices.total), icon: <FileTextOutlined />, color: '#d46b08', note: `${data.unpaidInvoices.count} invoices` },
  ];

  return (
    <div style={{ padding: 24 }} className="dashboard-page-container">
      <Row justify="space-between" align="middle" gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col>
          <Title level={2} style={{ margin: 0 }}>Dashboard</Title>
          <Text type="secondary">Every job, from booking to delivery</Text>
        </Col>
        <Col>
          <Space wrap>
            <Button onClick={() => navigate('/uk-warehouse')}>UK Warehouse</Button>
            <Button onClick={() => navigate('/ghana-warehouse')}>Ghana Warehouse</Button>
            {canCreateJobs(currentUser) && (
              <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/jobs', { state: { openNewJobModal: true } })}>New Job</Button>
            )}
          </Space>
        </Col>
      </Row>

      <StatCards stats={stats} />

      <Card title="Jobs at Each Stage" style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]}>
          {[...stageList(), { key: null, label: 'Closed' }].map((stage) => {
            const statuses = jobStatusList().filter((status) => status.stage === stage.key);
            const total = statuses.reduce((sum, status) => sum + (counts[status.key] || 0), 0);
            return (
              <Col xs={24} sm={12} lg={8} xl={6} key={stage.key || 'closed'}>
                <Card size="small" title={`${stage.label} (${total})`}>
                  {statuses.map((status) => (
                    <div
                      key={status.key}
                      role="button"
                      tabIndex={0}
                      onClick={() => navigate('/jobs', { state: { status: status.key } })}
                      onKeyDown={(event) => event.key === 'Enter' && navigate('/jobs', { state: { status: status.key } })}
                      style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', cursor: 'pointer' }}
                    >
                      <Tag color={status.color}>{status.label}</Tag>
                      <Text strong={counts[status.key] > 0} type={counts[status.key] ? undefined : 'secondary'}>{counts[status.key] || 0}</Text>
                    </div>
                  ))}
                </Card>
              </Col>
            );
          })}
        </Row>
      </Card>

      <JobQueue
        title="Needs Attention"
        icon={<WarningOutlined style={{ color: '#cf1322' }} />}
        queue={data.needsAttention}
        columns={['trackingId', 'customer', 'status', 'driver', 'rider']}
        actions={[
          { assign: 'driver', label: 'Assign Driver', primary: true },
          { status: 'ready_for_delivery', label: 'Back to Ready for Delivery' },
        ]}
        empty="No failed collections or deliveries"
        onOpen={setOpenJobId}
        onChanged={reload}
      />
      <JobQueue
        title="Newest Jobs"
        icon={<CarOutlined />}
        queue={{ count: data.recentJobs.length, jobs: data.recentJobs }}
        columns={['trackingId', 'customer', 'status', 'pickupDate']}
        empty="No jobs yet"
        onOpen={setOpenJobId}
        onChanged={reload}
      />

      <JobDrawer jobId={openJobId} onClose={() => setOpenJobId(null)} onChanged={reload} />
    </div>
  );
};

/** Everyone's home page: each role sees its own dashboard. */
const DashboardPage = () => {
  const { currentUser } = useAuth();
  const role = currentUser?.role === 'warehouse_staff' ? 'warehouse' : currentUser?.role;

  if (role === 'finance') return <FinanceDashboard />;
  if (role === 'warehouse') return isGhanaWarehouse(currentUser) ? <GhanaWarehouseDashboardPage /> : <WarehouseDashboard />;
  if (role === 'driver') return <DriverDashboardPage />;
  if (role === 'delivery-agent') return <DeliveryDashboard />;
  if (hasFullAccess(currentUser)) return <OfficeOverview />;
  return (
    <Result
      status="info"
      title={`Welcome${currentUser?.name ? `, ${currentUser.name}` : ''}`}
      subTitle="Your account has no dashboard yet. Ask an administrator to give you a role."
    />
  );
};

export default DashboardPage;
