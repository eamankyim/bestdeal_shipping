const test = require('node:test');
const assert = require('node:assert/strict');
const statuses = require('../src/utils/statuses');

const { JOB_STATUSES, BATCH_STATUSES, STAGES, JOB_KEYS, BATCH_KEYS } = statuses;
const office = { id: 'o', role: 'admin' };
const uk = { id: 'u', role: 'warehouse', warehouseLocation: 'UK Warehouse' };
const ghana = { id: 'g', role: 'warehouse', warehouseLocation: 'Ghana Warehouse' };
const driver = { id: 'd', role: 'driver' };
const rider = { id: 'r', role: 'delivery-agent' };

test('every status has a unique key and name, a colour, and a real stage', () => {
  for (const list of [JOB_STATUSES, BATCH_STATUSES]) {
    assert.equal(new Set(list.map((s) => s.key)).size, list.length);
    assert.equal(new Set(list.map((s) => s.label)).size, list.length);
    for (const status of list) {
      assert.match(status.key, /^[a-z_]+$/, status.key);
      assert.ok(status.color, status.key);
    }
  }
  for (const status of JOB_STATUSES) {
    assert.ok(status.stage === null || STAGES.some((stage) => stage.key === status.stage), status.key);
  }
  for (const status of BATCH_STATUSES.filter((s) => s.jobStatus)) assert.ok(JOB_KEYS.includes(status.jobStatus));
  assert.ok(!JOB_KEYS.includes('in_transit') && !BATCH_KEYS.includes('in_transit'));
});

test('every move goes from and to statuses that exist', () => {
  const all = statuses.statusesFor(office);
  for (const [from, to] of Object.entries(all.job.moves)) {
    assert.ok(JOB_KEYS.includes(from), from);
    for (const key of to) assert.ok(JOB_KEYS.includes(key), key);
  }
  for (const [from, to] of Object.entries(all.batch.moves)) {
    assert.ok(BATCH_KEYS.includes(from), from);
    for (const key of to) assert.ok(BATCH_KEYS.includes(key), key);
  }
  for (const key of [...all.job.assignDriverFrom, ...all.job.assignRiderFrom, all.job.batchable]) assert.ok(JOB_KEYS.includes(key), key);
});

test('every spelling seen in older records and the mobile app maps to a key', () => {
  const cases = {
    'Pending Collection': 'pending_collection', pending: 'pending_collection', Assigned: 'assigned',
    'At Warehouse': 'at_uk_warehouse', arrived_at_warehouse: 'at_uk_warehouse', 'At UK Warehouse': 'at_uk_warehouse',
    'Arrived at Destination': 'arrived_in_ghana', at_ghana_warehouse: 'arrived_in_ghana', 'Ready for Delivery': 'ready_for_delivery',
    'Out for Delivery': 'out_for_delivery', 'Failed Delivery': 'failed_delivery', Draft: 'draft',
  };
  for (const [spelling, key] of Object.entries(cases)) assert.equal(statuses.toJobStatus(spelling), key, spelling);
  for (const gone of ['In Transit', 'in_transit', 'En Route to Customer', 'Returning to Warehouse', 'Delivery Attempted', 'closed', '', null]) {
    assert.equal(statuses.toJobStatus(gone), null, String(gone));
  }
  assert.equal(statuses.toBatchStatus('In Preparation'), 'in_preparation');
  assert.equal(statuses.toBatchStatus('In Transit'), null);
});

test('each part of the journey belongs to one team', () => {
  const next = (user, status) => statuses.nextJobStatuses(user, { status });
  assert.deepEqual(next(driver, 'assigned'), ['collected', 'collection_failed']);
  assert.deepEqual(next(driver, 'collected'), []);
  assert.deepEqual(next(uk, 'collected'), ['at_uk_warehouse']);
  assert.deepEqual(next(office, 'collected'), ['at_uk_warehouse', 'cancelled']);
  assert.deepEqual(next(ghana, 'collected'), []);
  assert.deepEqual(next(ghana, 'arrived_in_ghana'), ['ready_for_delivery']);
  assert.deepEqual(next(uk, 'arrived_in_ghana'), []);
  assert.deepEqual(next(rider, 'out_for_delivery'), ['delivered', 'failed_delivery']);
  assert.deepEqual(next({ role: 'finance' }, 'assigned'), []);
  assert.deepEqual(next({ role: 'user' }, 'assigned'), []);
  // Statuses that follow a batch, a rider or a driver are never picked by hand
  for (const user of [office, uk, ghana, driver, rider]) {
    for (const from of JOB_KEYS) {
      for (const to of next(user, from)) assert.ok(!['assigned', 'batched', 'shipped', 'arrived_in_ghana', 'out_for_delivery', 'pending_collection'].includes(to), `${user.role} ${from}→${to}`);
    }
  }
  assert.equal(statuses.canAssignDriver(uk, { status: 'collection_failed' }), true);
  assert.equal(statuses.canAssignDriver(ghana, { status: 'pending_collection' }), false);
  assert.equal(statuses.canAssignRider(ghana, { status: 'failed_delivery' }), true);
  assert.equal(statuses.canAssignRider(uk, { status: 'ready_for_delivery' }), false);
});

test('a failure or a cancellation needs a reason, and delivering needs a photo from anyone', () => {
  assert.equal(statuses.checkJobMove(driver, { status: 'assigned' }, 'collection_failed').reason, true);
  assert.equal(statuses.checkJobMove(rider, { status: 'out_for_delivery' }, 'failed_delivery').reason, true);
  assert.equal(statuses.checkJobMove(office, { status: 'pending_collection' }, 'cancelled').reason, true);
  for (const user of [rider, ghana, office]) assert.equal(statuses.checkJobMove(user, { status: 'out_for_delivery' }, 'delivered').photos, true);
  assert.equal(statuses.checkJobMove(driver, { status: 'assigned' }, 'collected').photos, true);
  assert.equal(statuses.checkJobMove(uk, { status: 'assigned' }, 'collected').photos, false);
  assert.equal(statuses.checkJobMove(office, { status: 'batched' }, 'cancelled').ok, false);
});
