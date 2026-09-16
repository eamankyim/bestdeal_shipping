const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const response = require('../src/utils/responseUtils');
function load(file, mocks) {
  const module = { exports: {} };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../src', file), 'utf8'), {
    module, exports: module.exports, require: name => {
      if (name in mocks) return mocks[name];
      throw new Error(`Unexpected dependency: ${name}`);
    }, console, Buffer,
  });
  return module.exports;
}
function res() { return { status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } }; }
const auth = load('middleware/auth.js', { '../utils/tokenUtils': {}, '../utils/responseUtils': response, '../config/database': {} });
test('customer service can access every role-protected app endpoint', () => {
  for (const role of ['admin', 'superadmin', 'finance', 'warehouse', 'driver', 'delivery-agent']) {
    let next = false; auth.authorize(role)({ user: { role: 'customer-service' } }, res(), () => { next = true; });
    assert.equal(next, true, role);
  }
});
test('unauthenticated and ordinary roles do not acquire administrative permissions', () => {
  const missing = res(); auth.authorize('admin')({}, missing, () => assert.fail()); assert.equal(missing.code, 401);
  for (const role of ['driver', 'user', 'finance', 'warehouse']) {
    const denied = res(); auth.authorize('admin')({ user: { role } }, denied, () => assert.fail()); assert.equal(denied.code, 403);
  }
});
function controller(tx) {
  return load('controllers/jobController.js', {
    '../config/database': { $transaction: fn => fn(tx) },
    '../utils/responseUtils': response,
    '../middleware/errorHandler': { asyncHandler: fn => fn },
    '../services/notificationService': {}, '../utils/trackingIdGenerator': {},
  });
}
test('partial payments preserve earlier receipts and reject overpayment', async () => {
  let job = { id: 'job', value: 100, amountPaid: 25, status: 'collected' };
  const entries = [];
  const tx = { $queryRaw: async () => [], job: { findUnique: async () => job, update: async ({ data }) => (job = { ...job, ...data }) }, jobTimeline: { create: async ({ data }) => entries.push(data) } };
  const api = controller(tx);
  const request = { params: { id: 'job' }, user: { id: 'staff' }, body: { amountPaid: 50, paymentMethod: 'cash' } };
  const ok = res(); await api.recordPayment(request, ok); assert.equal(ok.code, 200); assert.equal(job.amountPaid, 75); assert.equal(entries.length, 1);
  const overpaid = res(); await api.recordPayment(request, overpaid); assert.equal(overpaid.code, 400); assert.equal(job.amountPaid, 75);
  for (const amount of [0, -1, 'invalid', 0.001]) {
    const invalid = res(); await api.recordPayment({ ...request, body: { ...request.body, amountPaid: amount } }, invalid); assert.equal(invalid.code, 400);
  }
});
test('status revert requires actual history and records who reverted it', async () => {
  let job = { id: 'job', status: 'shipped', timeline: [{ status: 'collected' }] };
  let entry;
  const tx = { job: { findUnique: async () => job, update: async ({ data }) => (job = { ...job, ...data }) }, jobTimeline: { create: async ({ data }) => { entry = data; } } };
  const api = controller(tx);
  const request = { params: { id: 'job' }, user: { id: 'staff' }, body: { previousStatus: 'invented', comment: 'Correct mistaken shipment' } };
  const denied = res(); await api.revertStatus(request, denied); assert.equal(denied.code, 400);
  const ok = res(); await api.revertStatus({ ...request, body: { ...request.body, previousStatus: 'collected' } }, ok);
  assert.equal(ok.code, 200); assert.equal(job.status, 'collected'); assert.equal(entry.updatedBy, 'staff');
});
const { updateJobStatusValidation, registerValidation } = require('../src/middleware/validation');
async function validate(chain, body) {
  const req = { body, query: {}, params: {}, headers: {} }; const output = res();
  for (const middleware of chain) { if (middleware.run) await middleware.run(req); else middleware(req, output, () => {}); }
  return { req, output };
}
test('mobile title-case and web snake-case statuses have the same API representation', async () => {
  for (const [mobile, web] of [['At Warehouse', 'arrived_at_warehouse'], ['Delivered', 'delivered'], ['Pending Collection', 'pending']]) {
    const first = await validate(updateJobStatusValidation, { status: mobile });
    const second = await validate(updateJobStatusValidation, { status: web });
    assert.equal(first.req.body.status, second.req.body.status); assert.equal(first.output.code, undefined);
  }
});
test('public registration cannot self-assign privileged roles', async () => {
  const result = await validate(registerValidation, { email: 'test@example.com', name: 'Test User', password: 'password', role: 'admin' });
  assert.equal(result.output.code, 400);
});
const packageDetails = require('../src/middleware/packageDetails');
test('package totals are shared, retain zero prices, and reject malformed amounts', () => {
  const req = { body: { parcelDetails: { quantity: 50, value: 900, packages: [
    { description: 'Box', weight: 3, estimatedPrice: 0, fragile: true },
    { description: 'Documents', weight: 1, estimatedPrice: 12.50, insurance: true },
  ] } } };
  let accepted = false; packageDetails(req, res(), () => { accepted = true; });
  assert.equal(accepted, true); assert.equal(req.body.parcelDetails.quantity, 2);
  assert.equal(req.body.parcelDetails.weight, 4); assert.equal(req.body.parcelDetails.value, 12.5);
  assert.equal(req.body.parcelDetails.packages[0].fragile, true);
  const bad = res(); packageDetails({ body: { parcelDetails: { packages: [{ weight: 'oops' }] } } }, bad, () => assert.fail());
  assert.equal(bad.code, 400);
});
