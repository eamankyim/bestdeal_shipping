import React, { useCallback, useEffect, useState } from 'react';
import { Button, Card, Drawer, Dropdown, Modal, Space, Spin, Tabs, Tag, Timeline, Typography, message } from 'antd';
import {
  CarOutlined, DeleteOutlined, DollarOutlined, EditOutlined, EnvironmentOutlined, EyeOutlined,
  FileTextOutlined, MailOutlined, MoreOutlined, PhoneOutlined, UndoOutlined, UserOutlined,
} from '@ant-design/icons';
import { jobAPI } from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';
import { canEditJobs, hasFullAccess, hasPermission } from '../../utils/permissions';
import {
  canAssignDriver, canAssignRider, formatJobStatusLabel, getStatusColor, isFinalStatus, nextJobStatuses,
} from '../../constants/jobStatuses';
import StatusChangeModal from './StatusChangeModal';
import AssignPersonModal from './AssignPersonModal';
import JobEditModal from './JobEditModal';
import JobEditHistory from './JobEditHistory';
import JobNoteModal from './JobNoteModal';
import JobNotes from './JobNotes';
import JobPhotos from './JobPhotos';
import PaymentRecordingModal from './PaymentRecordingModal';
import StatusRevertModal from './StatusRevertModal';
import DocumentViewer from './DocumentViewer';

const { Text } = Typography;
const PHOTO_TYPES = ['photo', 'proof_of_delivery'];
const cardStyle = { marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', borderRadius: 8 };

const InfoCard = ({ title, rows }) => {
  const shown = rows.filter(([, value]) => value !== null && value !== undefined && value !== '');
  if (shown.length === 0) return null;
  return (
    <Card size="small" title={<span className="user-info-title">{title}</span>} className="user-info-card" style={cardStyle}>
      <div className="user-info-list">
        {shown.map(([label, value]) => (
          <div className="user-info-item" key={label}>
            <div className="user-info-label">{label}</div>
            <div className="user-info-value">{value}</div>
          </div>
        ))}
      </div>
    </Card>
  );
};

/** Tell other open tabs to refresh their lists. */
const announceChange = (jobId) => {
  const channel = new BroadcastChannel('job_updates');
  channel.postMessage({ type: 'JOB_STATUS_UPDATED', jobId, timestamp: new Date().toISOString() });
  channel.close();
};

/**
 * One job, with everything that can be done to it. Used by the Jobs page and every dashboard, so
 * a job looks and behaves the same wherever it is opened. Which actions show depends on the
 * job's status and the user's role, as decided by the backend (constants/jobStatuses.js).
 */
const JobDrawer = ({ jobId, onClose, onChanged }) => {
  const { currentUser } = useAuth();
  const [job, setJob] = useState(null);
  const [moveTo, setMoveTo] = useState(null);
  const [assignKind, setAssignKind] = useState(null);
  const [editing, setEditing] = useState(false);
  const [noting, setNoting] = useState(false);
  const [paying, setPaying] = useState(false);
  const [undoing, setUndoing] = useState(false);
  const [viewing, setViewing] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!jobId) return;
    try {
      const response = await jobAPI.getById(jobId);
      setJob(response.data.job);
    } catch (error) {
      message.error(error.message || 'Failed to load the job');
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload only when another job is opened
  }, [jobId]);

  useEffect(() => {
    setJob(null);
    load();
  }, [load]);

  const changed = async () => {
    announceChange(jobId);
    await load();
    onChanged?.();
  };

  const canViewRevenue = hasPermission(currentUser, 'financial:view');
  const canPay = hasFullAccess(currentUser) || currentUser?.role === 'finance';
  const office = hasFullAccess(currentUser);

  const remove = () => Modal.confirm({
    title: `Delete ${job.trackingId}?`,
    content: 'The job and its history are removed for good.',
    okText: 'Delete',
    okType: 'danger',
    zIndex: 1100,
    onOk: async () => {
      try {
        await jobAPI.delete(job.id);
        message.success('Job deleted');
        announceChange(job.id);
        onChanged?.();
        onClose();
      } catch (error) {
        message.error(error.message || 'Failed to delete the job');
      }
    },
  });

  const recordPayment = async (payment) => {
    setBusy(true);
    try {
      await jobAPI.recordPayment(job.id, payment);
      message.success('Payment recorded');
      setPaying(false);
      await changed();
    } catch (error) {
      message.error(error.message || 'Failed to record payment');
    } finally {
      setBusy(false);
    }
  };

  const undo = async ({ previousStatus, comment }) => {
    setBusy(true);
    try {
      await jobAPI.revertStatus(job.id, { previousStatus, comment });
      message.success(`Status set back to ${formatJobStatusLabel(previousStatus)}`);
      setUndoing(false);
      await changed();
    } catch (error) {
      message.error(error.message || 'Failed to undo the status');
    } finally {
      setBusy(false);
    }
  };

  // ---- The actions menu: built from what the backend says this user may do ----
  const menuItems = [];
  if (job) {
    const moves = nextJobStatuses(job).filter((status) => status !== 'cancelled');
    if (moves.length > 0) {
      menuItems.push({
        type: 'group',
        label: 'Update Status',
        children: moves.map((status) => ({ key: `move:${status}`, label: `Mark as ${formatJobStatusLabel(status)}` })),
      });
    }
    if (canAssignDriver(job)) menuItems.push({ key: 'assign:driver', icon: <UserOutlined />, label: job.assignedDriver ? 'Change Driver' : 'Assign Driver' });
    if (canAssignRider(job)) menuItems.push({ key: 'assign:rider', icon: <CarOutlined />, label: job.assignedDeliveryAgent ? 'Change Dispatch Rider' : 'Assign Dispatch Rider' });
    if (menuItems.length > 0) menuItems.push({ type: 'divider' });
    if (canEditJobs(currentUser) && !isFinalStatus(job.status)) {
      menuItems.push({ key: 'edit', icon: <EditOutlined />, label: job.status === 'draft' ? 'Edit or Book Draft' : 'Edit Job' });
    }
    if (canEditJobs(currentUser)) menuItems.push({ key: 'note', icon: <FileTextOutlined />, label: 'Add Note' });
    if (canPay && job.status !== 'draft') menuItems.push({ key: 'pay', icon: <DollarOutlined />, label: 'Record Payment' });
    if (office && (job.timeline || []).length > 1) menuItems.push({ key: 'undo', icon: <UndoOutlined />, label: 'Undo a Status Change' });
    if (nextJobStatuses(job).includes('cancelled')) menuItems.push({ type: 'divider' }, { key: 'move:cancelled', danger: true, label: 'Cancel Job' });
    if (office && ['draft', 'cancelled'].includes(job.status)) menuItems.push({ key: 'delete', danger: true, icon: <DeleteOutlined />, label: 'Delete Job' });
  }

  const onMenu = ({ key }) => {
    const [action, value] = key.split(':');
    if (action === 'move') setMoveTo(value);
    if (action === 'assign') setAssignKind(value);
    if (action === 'edit') setEditing(true);
    if (action === 'note') setNoting(true);
    if (action === 'pay') setPaying(true);
    if (action === 'undo') setUndoing(true);
    if (action === 'delete') remove();
  };

  const documents = (job?.documents || []).filter((doc) => !(PHOTO_TYPES.includes(doc.documentType) && (doc.mimeType || '').startsWith('image/')));

  return (
    <>
      <Drawer
        title={`Job Details - ${job?.trackingId || ''}`}
        placement="right"
        onClose={onClose}
        open={Boolean(jobId)}
        width={720}
        className="user-details-drawer"
        extra={menuItems.length > 0 && (
          <Dropdown menu={{ items: menuItems, onClick: onMenu }} trigger={['click']} placement="bottomRight">
            <Button type="text" aria-label="Job actions" icon={<MoreOutlined style={{ fontSize: 20 }} />} style={{ border: '1px solid #d9d9d9', borderRadius: 4 }} />
          </Dropdown>
        )}
      >
        {!job && <div style={{ textAlign: 'center', padding: 48 }}><Spin /></div>}
        {job && (
          <Tabs
            defaultActiveKey="details"
            items={[
              {
                key: 'details',
                label: 'Details',
                children: (
                  <>
                    <InfoCard
                      title="Status"
                      rows={[
                        ['Status', <Tag color={getStatusColor(job.status)}>{formatJobStatusLabel(job.status)}</Tag>],
                        ['Driver', job.assignedDriver?.name || <Text type="secondary">None</Text>],
                        ['Dispatch Rider', job.assignedDeliveryAgent?.name],
                        ['Batch', job.batch ? `${job.batch.name || ''} ${job.batch.batchId}`.trim() : null],
                      ]}
                    />
                    <InfoCard
                      title="Customer"
                      rows={[
                        ['Name', <Text strong>{job.customer?.name}</Text>],
                        ['Email', job.customer?.email && <span><MailOutlined style={{ color: '#1890ff', marginRight: 8 }} />{job.customer.email}</span>],
                        ['Phone', job.customer?.phone && <span><PhoneOutlined style={{ color: '#1890ff', marginRight: 8 }} />{job.customer.phone}</span>],
                        ['Type', job.customer?.customerType && <Tag color={job.customer.customerType === 'Company' ? 'blue' : 'green'}>{job.customer.customerType}</Tag>],
                      ]}
                    />
                    <InfoCard
                      title="Addresses"
                      rows={[
                        ['Pickup', job.pickupAddress && <span><EnvironmentOutlined style={{ color: '#1890ff', marginRight: 8 }} />{job.pickupAddress}</span>],
                        ['Delivery', job.deliveryAddress && <span><EnvironmentOutlined style={{ color: '#1890ff', marginRight: 8 }} />{job.deliveryAddress}</span>],
                      ]}
                    />
                    <InfoCard title="Receiver" rows={[['Name', job.receiverName], ['Phone', job.receiverContact], ['Address', job.receiverAddress]]} />
                    <InfoCard
                      title="Package"
                      rows={[
                        ['Description', job.description],
                        ['Weight', job.weight ? `${Number(job.weight)} kg` : null],
                        ['Quantity', job.quantity],
                        ['Value', canViewRevenue && job.value ? `£${Number(job.value).toFixed(2)}` : null],
                        ['Paid', canViewRevenue && Number(job.amountPaid) > 0 ? `£${Number(job.amountPaid).toFixed(2)}` : null],
                      ]}
                    />
                    <InfoCard
                      title="Job"
                      rows={[
                        ['Reference', job.referenceNumber],
                        ['Priority', <Tag color={job.priority === 'Urgent' ? 'red' : job.priority === 'Express' ? 'orange' : 'blue'}>{job.priority}</Tag>],
                        ['Pickup Date', job.pickupDate ? new Date(job.pickupDate).toLocaleDateString() : 'Not set'],
                        ['Expected Delivery', job.estimatedDelivery ? new Date(job.estimatedDelivery).toLocaleDateString() : null],
                        ['Delivered', job.actualDelivery ? new Date(job.actualDelivery).toLocaleString() : null],
                        ['Created', <Text type="secondary">{new Date(job.createdAt).toLocaleString()}{job.creator?.name ? ` by ${job.creator.name}` : ''}</Text>],
                      ]}
                    />
                    {job.specialInstructions && (
                      <Card size="small" title="Special Instructions" style={{ marginBottom: 16 }}>
                        <Text>{job.specialInstructions}</Text>
                      </Card>
                    )}
                    <JobNotes notes={job.jobNotes} onAdd={canEditJobs(currentUser) ? () => setNoting(true) : undefined} />
                    <JobPhotos documents={job.documents} />
                    <Card size="small" title="Other Documents">
                      {documents.length === 0 ? <Text type="secondary">No other documents</Text> : (
                        <Space direction="vertical" style={{ width: '100%' }}>
                          {documents.map((doc) => (
                            <div key={doc.id} style={{ padding: 12, background: '#f5f5f5', borderRadius: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                              <div>
                                <Text strong>{doc.fileName}</Text>
                                <br />
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                  {new Date(doc.uploadedAt).toLocaleString()}
                                  {doc.uploader && ` • ${doc.uploader.name}`}
                                  {doc.fileSize && ` • ${(doc.fileSize / 1024).toFixed(1)} KB`}
                                </Text>
                              </div>
                              <Button type="primary" size="small" icon={<EyeOutlined />} onClick={() => setViewing(doc)}>View</Button>
                            </div>
                          ))}
                        </Space>
                      )}
                    </Card>
                  </>
                ),
              },
              {
                key: 'activity',
                label: 'Activity',
                children: (job.timeline || []).length === 0 ? <Text type="secondary">No activity recorded yet</Text> : (
                  <Timeline
                    items={job.timeline.map((entry) => ({
                      key: entry.id,
                      color: getStatusColor(entry.status) === 'red' ? 'red' : 'blue',
                      children: (
                        <div>
                          <Tag color={getStatusColor(entry.status)}>{formatJobStatusLabel(entry.status)}</Tag>
                          <br />
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {new Date(entry.timestamp).toLocaleString()}{entry.updater ? ` • ${entry.updater.name}` : ''}
                          </Text>
                          {entry.notes && <><br /><Text>{entry.notes}</Text></>}
                        </div>
                      ),
                    }))}
                  />
                ),
              },
              { key: 'edit-history', label: 'Edit History', children: <JobEditHistory jobId={job.id} refreshKey={job.updatedAt} /> },
            ]}
          />
        )}
      </Drawer>

      <StatusChangeModal job={moveTo ? job : null} status={moveTo} onClose={() => setMoveTo(null)} onDone={changed} />
      <AssignPersonModal job={assignKind ? job : null} kind={assignKind} onClose={() => setAssignKind(null)} onDone={changed} />
      <JobEditModal jobId={editing ? job?.id : null} onClose={() => setEditing(false)} onSaved={changed} />
      <JobNoteModal job={noting ? job : null} onClose={() => setNoting(false)} onAdded={changed} />
      <DocumentViewer document={viewing} onClose={() => setViewing(null)} />
      <StatusRevertModal
        visible={undoing}
        onCancel={() => setUndoing(false)}
        onOk={undo}
        currentStatus={job?.status}
        jobHistory={job?.timeline || []}
        loading={busy}
      />
      <PaymentRecordingModal
        visible={paying}
        onCancel={() => setPaying(false)}
        onOk={recordPayment}
        job={job}
        invoiceAmount={Math.max(0, Number(job?.value || 0) - Number(job?.amountPaid || 0))}
        loading={busy}
      />
    </>
  );
};

export default JobDrawer;
