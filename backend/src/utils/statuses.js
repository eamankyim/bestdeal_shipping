// The one list of job and batch statuses, and the rules for moving between them.
// The website reads all of it from GET /api/statuses and keeps no copy of its own, and every
// route that changes a status checks it here, so the two can never disagree.
//
// Statuses are saved as their `key`. `label` is only for showing.

const STAGES = [
  { key: 'booking', label: 'Booking' },
  { key: 'collection', label: 'Collection' },
  { key: 'uk_warehouse', label: 'UK Warehouse' },
  { key: 'shipping', label: 'Shipping' },
  { key: 'ghana', label: 'Ghana' },
  { key: 'delivery', label: 'Delivery' },
];

// `problem`: something went wrong and staff need to act. `final`: nothing happens after it.
const JOB_STATUSES = [
  { key: 'draft', label: 'Draft', stage: 'booking', color: 'default', description: 'Saved, but not booked yet' },
  { key: 'pending_collection', label: 'Pending Collection', stage: 'booking', color: 'gold', description: 'Booked and waiting for a driver' },
  { key: 'assigned', label: 'Assigned', stage: 'collection', color: 'orange', description: 'A driver is going to collect it' },
  { key: 'collected', label: 'Collected', stage: 'collection', color: 'cyan', description: 'Collected and on its way to the UK warehouse' },
  { key: 'collection_failed', label: 'Collection Failed', stage: 'collection', color: 'red', problem: true, description: 'The driver could not collect it' },
  { key: 'at_uk_warehouse', label: 'At UK Warehouse', stage: 'uk_warehouse', color: 'blue', description: 'At the UK warehouse, waiting to go in a batch' },
  { key: 'batched', label: 'Batched', stage: 'uk_warehouse', color: 'purple', description: 'Packed in a batch, waiting to ship' },
  { key: 'shipped', label: 'Shipped', stage: 'shipping', color: 'geekblue', description: 'On its way to Ghana' },
  { key: 'arrived_in_ghana', label: 'Arrived in Ghana', stage: 'ghana', color: 'lime', description: 'At the Ghana warehouse, waiting to be checked' },
  { key: 'ready_for_delivery', label: 'Ready for Delivery', stage: 'ghana', color: 'green', description: 'Checked and waiting for a dispatch rider' },
  { key: 'out_for_delivery', label: 'Out for Delivery', stage: 'delivery', color: 'volcano', description: 'With a dispatch rider' },
  { key: 'delivered', label: 'Delivered', stage: 'delivery', color: 'success', final: true, description: 'Handed over, with a photo' },
  { key: 'failed_delivery', label: 'Failed Delivery', stage: 'delivery', color: 'red', problem: true, description: 'The rider could not deliver it' },
  { key: 'cancelled', label: 'Cancelled', stage: null, color: 'default', final: true, description: 'Cancelled before it was shipped' },
];

// A batch's status moves every job in it; `jobStatus` is what its jobs become.
const BATCH_STATUSES = [
  { key: 'in_preparation', label: 'In Preparation', color: 'processing', editable: true },
  { key: 'ready_to_ship', label: 'Ready to Ship', color: 'warning', editable: true },
  { key: 'shipped', label: 'Shipped', color: 'geekblue', jobStatus: 'shipped' },
  { key: 'arrived', label: 'Arrived in Ghana', color: 'success', jobStatus: 'arrived_in_ghana' },
];

// Who can act. "office" is the roles with full access (superadmin, admin, customer service).
// Warehouse staff not placed in Ghana work at the UK warehouse.
const actorOf = (user) => {
  const role = String(user?.role || '').trim().toLowerCase().replace(/[ _]+/g, '-');
  if (['superadmin', 'admin', 'customer-service'].includes(role)) return 'office';
  if (role === 'warehouse' || role === 'warehouse-staff') return user?.warehouseLocation === 'Ghana Warehouse' ? 'ghana' : 'uk';
  if (role === 'driver') return 'driver';
  if (role === 'delivery-agent') return 'rider';
  return null;
};

// Status changes made with PATCH /api/jobs/:id/status. `reason`: the reason box must be filled in.
// `photos`: at least one photo is needed (for collection only when the driver does it).
// Drivers and riders only ever reach jobs assigned to them (see jobAccess.canAccessJob).
const JOB_MOVES = [
  { from: ['assigned'], to: 'collected', who: ['driver', 'uk', 'office'], photos: ['driver'] },
  { from: ['assigned'], to: 'collection_failed', who: ['driver', 'uk', 'office'], reason: true },
  // Collected parcels arrive at the warehouse, and customers can also drop a parcel off themselves
  { from: ['pending_collection', 'collected'], to: 'at_uk_warehouse', who: ['uk', 'office'] },
  { from: ['arrived_in_ghana', 'failed_delivery'], to: 'ready_for_delivery', who: ['ghana', 'office'] },
  { from: ['out_for_delivery'], to: 'delivered', who: ['rider', 'ghana', 'office'], photos: ['rider', 'ghana', 'office'] },
  { from: ['out_for_delivery'], to: 'failed_delivery', who: ['rider', 'ghana', 'office'], reason: true },
  // Once a parcel is in a batch it can no longer be cancelled; take it out of the batch first
  { from: ['draft', 'pending_collection', 'assigned', 'collected', 'collection_failed', 'at_uk_warehouse'], to: 'cancelled', who: ['office'], reason: true },
];

// The other changes happen as a side effect of an action, never by picking a status:
//   assigning a driver → assigned; assigning a rider → out_for_delivery;
//   adding to / taking out of a batch → batched / at_uk_warehouse;
//   the batch shipping / arriving → shipped / arrived_in_ghana; finishing a draft → pending_collection.
const ASSIGN_DRIVER = { from: ['pending_collection', 'assigned', 'collection_failed'], who: ['uk', 'office'] };
const ASSIGN_RIDER = { from: ['ready_for_delivery', 'out_for_delivery', 'failed_delivery'], who: ['ghana', 'office'] };
const BATCHABLE = 'at_uk_warehouse';

const BATCH_MOVES = [
  { from: ['in_preparation'], to: 'ready_to_ship', who: ['uk', 'office'] },
  { from: ['ready_to_ship'], to: 'in_preparation', who: ['uk', 'office'] },
  { from: ['ready_to_ship'], to: 'shipped', who: ['uk', 'office'] },
  { from: ['shipped'], to: 'arrived', who: ['ghana', 'office'] },
];
const BATCH_EDITORS = ['uk', 'office'];

// Older spellings still sent by the mobile app, or found in older records
const JOB_ALIASES = {
  pending: 'pending_collection',
  at_warehouse: 'at_uk_warehouse',
  arrived_at_warehouse: 'at_uk_warehouse',
  arrived_at_hub: 'at_uk_warehouse',
  arrived_at_destination: 'arrived_in_ghana',
  at_ghana_warehouse: 'arrived_in_ghana',
  arrived: 'arrived_in_ghana',
};
const BATCH_ALIASES = { distributed: 'arrived' };

const slug = (value) => String(value || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
const JOB_KEYS = JOB_STATUSES.map((status) => status.key);
const BATCH_KEYS = BATCH_STATUSES.map((status) => status.key);

/** The saved key for a job status in any spelling ("At Warehouse" → at_uk_warehouse), or null. */
const toJobStatus = (value) => {
  const key = JOB_ALIASES[slug(value)] || slug(value);
  return JOB_KEYS.includes(key) ? key : null;
};

const toBatchStatus = (value) => {
  const key = BATCH_ALIASES[slug(value)] || slug(value);
  return BATCH_KEYS.includes(key) ? key : null;
};

const jobStatusInfo = (value) => JOB_STATUSES.find((status) => status.key === toJobStatus(value)) || null;
const jobStatusLabel = (value) => jobStatusInfo(value)?.label || String(value || '');
const batchStatusInfo = (value) => BATCH_STATUSES.find((status) => status.key === toBatchStatus(value)) || null;
const isFinal = (value) => Boolean(jobStatusInfo(value)?.final);

const movesFrom = (moves, actor, from) => (actor ? moves.filter((move) => move.who.includes(actor) && move.from.includes(from)) : []);

/** The statuses this user may move this job to with PATCH /status. */
const nextJobStatuses = (user, job) => movesFrom(JOB_MOVES, actorOf(user), toJobStatus(job?.status)).map((move) => move.to);

/**
 * Whether this user may move the job to `to`. Returns { ok, message, reason, photos }:
 * `reason` and `photos` say whether a reason and photos are needed.
 */
const checkJobMove = (user, job, to) => {
  const target = toJobStatus(to);
  const from = toJobStatus(job?.status);
  const actor = actorOf(user);
  if (!target) return { ok: false, message: 'Unknown status' };
  const move = movesFrom(JOB_MOVES, actor, from).find((candidate) => candidate.to === target);
  if (!move) {
    const auto = {
      assigned: 'Assign a driver instead',
      out_for_delivery: 'Assign a dispatch rider instead',
      batched: 'Add the job to a batch instead',
      shipped: 'Mark its batch as shipped instead',
      arrived_in_ghana: 'Mark its batch as arrived instead',
      pending_collection: 'Finish the draft from the edit form instead',
    }[target];
    return { ok: false, message: `A job that is ${jobStatusLabel(from) || 'in this state'} cannot be set to ${jobStatusLabel(target)} by you.${auto ? ` ${auto}.` : ''}` };
  }
  return { ok: true, reason: Boolean(move.reason), photos: (move.photos || []).includes(actor) };
};

const canAssignDriver = (user, job) => ASSIGN_DRIVER.who.includes(actorOf(user)) && ASSIGN_DRIVER.from.includes(toJobStatus(job?.status));
const canAssignRider = (user, job) => ASSIGN_RIDER.who.includes(actorOf(user)) && ASSIGN_RIDER.from.includes(toJobStatus(job?.status));

/** Why this user can't assign a driver / rider to this job: { code, message }, or null when they can. */
const assignmentProblem = (kind, user, job) => {
  const rule = kind === 'driver' ? ASSIGN_DRIVER : ASSIGN_RIDER;
  if (!rule.who.includes(actorOf(user))) {
    return { code: 403, message: kind === 'driver' ? 'Only the office and the UK warehouse assign drivers' : 'Only the office and the Ghana warehouse assign dispatch riders' };
  }
  if (!rule.from.includes(toJobStatus(job?.status))) {
    const needs = rule.from.map((key) => jobStatusLabel(key)).join(', ');
    return { code: 400, message: `A ${kind === 'driver' ? 'driver' : 'dispatch rider'} can only be assigned to a job that is ${needs}. This job is ${jobStatusLabel(job?.status)}.` };
  }
  return null;
};

const nextBatchStatuses = (user, batch) => movesFrom(BATCH_MOVES, actorOf(user), toBatchStatus(batch?.status)).map((move) => move.to);
const canEditBatch = (user, batch) => BATCH_EDITORS.includes(actorOf(user)) && Boolean(batchStatusInfo(batch?.status)?.editable);
const canCreateBatch = (user) => BATCH_EDITORS.includes(actorOf(user));

/** Everything the website needs: the lists, and what this user is allowed to do. */
const statusesFor = (user) => {
  const actor = actorOf(user);
  const allowed = (moves) => Object.fromEntries(
    [...new Set(moves.flatMap((move) => move.from))].map((from) => [from, movesFrom(moves, actor, from).map((move) => move.to)]).filter(([, to]) => to.length > 0)
  );
  const rules = Object.fromEntries(JOB_MOVES.filter((move) => move.who.includes(actor)).map((move) => [move.to, {
    reason: Boolean(move.reason),
    photos: (move.photos || []).includes(actor),
  }]));
  return {
    stages: STAGES,
    job: {
      statuses: JOB_STATUSES,
      moves: allowed(JOB_MOVES),
      rules,
      assignDriverFrom: ASSIGN_DRIVER.who.includes(actor) ? ASSIGN_DRIVER.from : [],
      assignRiderFrom: ASSIGN_RIDER.who.includes(actor) ? ASSIGN_RIDER.from : [],
      batchable: BATCHABLE,
    },
    batch: {
      statuses: BATCH_STATUSES,
      moves: allowed(BATCH_MOVES),
      canCreate: canCreateBatch(user),
      canEdit: BATCH_EDITORS.includes(actor),
    },
  };
};

module.exports = {
  STAGES,
  JOB_STATUSES,
  BATCH_STATUSES,
  JOB_KEYS,
  BATCH_KEYS,
  BATCHABLE,
  actorOf,
  toJobStatus,
  toBatchStatus,
  jobStatusInfo,
  jobStatusLabel,
  batchStatusInfo,
  isFinal,
  nextJobStatuses,
  checkJobMove,
  canAssignDriver,
  canAssignRider,
  assignmentProblem,
  nextBatchStatuses,
  canEditBatch,
  canCreateBatch,
  statusesFor,
};
