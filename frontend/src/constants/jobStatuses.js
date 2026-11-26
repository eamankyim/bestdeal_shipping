// Job and batch statuses. The website keeps no list of its own: names, colours, stages and the
// moves the signed-in user may make all come from the backend (GET /api/statuses, see
// backend/src/utils/statuses.js). StatusProvider loads them before any signed-in page is shown.

let data = null;

/** Called by StatusProvider with the backend's answer. */
export const setStatusData = (value) => {
  data = value;
};

const titleCase = (value) =>
  String(value || '')
    .replace(/_/g, ' ')
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

// ---- Jobs ----

export const jobStatusList = () => data?.job.statuses || [];
export const jobStatusInfo = (status) => jobStatusList().find((item) => item.key === status) || null;
export const formatJobStatusLabel = (status) => jobStatusInfo(status)?.label || titleCase(status);
export const getStatusColor = (status) => jobStatusInfo(status)?.color || 'default';
/** The button that moves a job to this status ("Check In", "Delivered"…), named by the backend. */
export const actionLabel = (status) => jobStatusInfo(status)?.action || `Mark as ${formatJobStatusLabel(status)}`;
export const isProblemStatus = (status) => Boolean(jobStatusInfo(status)?.problem);
export const isFinalStatus = (status) => Boolean(jobStatusInfo(status)?.final);
export const stageList = () => data?.stages || [];

/** The statuses this user may move the job to from the status menu. */
export const nextJobStatuses = (job) => data?.job.moves[job?.status] || [];
/** { reason, photos }: whether moving to this status needs a reason or photos from this user. */
export const moveRules = (status) => data?.job.rules[status] || { reason: false, photos: false };
export const canAssignDriver = (job) => Boolean(data?.job.assignDriverFrom.includes(job?.status));
export const canAssignRider = (job) => Boolean(data?.job.assignRiderFrom.includes(job?.status));
/** Whether this user may split the job (some items now, the rest in a later batch). */
export const canSplitJob = (job) => Boolean(data?.job.splitFrom?.includes(job?.status) && !job?.batchId);
/** Jobs that can go in a batch. */
export const isBatchable = (job) => job?.status === data?.job.batchable && !job?.batchId;

// ---- Batches ----

export const batchStatusList = () => data?.batch.statuses || [];
export const batchStatusInfo = (status) => batchStatusList().find((item) => item.key === status) || null;
export const formatBatchStatusLabel = (status) => batchStatusInfo(status)?.label || titleCase(status);
export const getBatchStatusColor = (status) => batchStatusInfo(status)?.color || 'default';
export const nextBatchStatuses = (batch) => data?.batch.moves[batch?.status] || [];
export const canCreateBatch = () => Boolean(data?.batch.canCreate);
export const canEditBatch = (batch) => Boolean(data?.batch.canEdit && batchStatusInfo(batch?.status)?.editable);
