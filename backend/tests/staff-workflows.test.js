const test = require('node:test');
const assert = require('node:assert/strict');
const { canAccessJob, canEditJob, canCreateJob, canViewInvoices } = require('../src/utils/jobAccess');
const { buildJobUpdate } = require('../src/utils/jobEdit');
const { parseImage, contentDisposition } = require('../src/utils/imageUpload');

const admin = { id: 'admin', role: 'admin' };
const driver = { id: 'driver', role: 'driver' };
const rider = { id: 'rider', role: 'delivery-agent' };
const ukWarehouse = { id: 'uk', role: 'warehouse', warehouseLocation: 'UK Warehouse' };
const ghanaWarehouse = { id: 'gh', role: 'warehouse', warehouseLocation: 'Ghana Warehouse' };
const job = {
  id: 'job', status: 'Assigned', assignedDriverId: 'driver', assignedDeliveryAgentId: null, createdBy: 'admin',
  referenceNumber: 'REF-1', receiverName: 'Ama', receiverAddress: 'Accra', receiverContact: '+233', freightType: 'Air Freight',
  pickupAddress: 'London', deliveryAddress: 'Kumasi', specialInstructions: 'Fragile', priority: 'Urgent', description: 'Box',
  weight: 5, value: 100, quantity: 1, packages: [{ description: 'Box', weight: 5, estimatedPrice: 100, fragile: true }],
  pickupDate: new Date('2026-11-01T00:00:00Z'), estimatedDelivery: null, customerId: 'customer',
};

test('staff can edit the jobs they can see, except dispatch riders, and nobody else can', () => {
  for (const role of ['superadmin', 'admin', 'customer-service', 'finance', 'warehouse', 'warehouse_staff']) {
    assert.equal(canEditJob({ id: 'x', role }, job), true, role);
  }
  assert.equal(canEditJob(driver, job), true);
  assert.equal(canEditJob({ id: 'other', role: 'driver' }, job), false);
  assert.equal(canEditJob(rider, job), false);
  // Riders only deliver: they cannot edit a job, even one assigned to them
  assert.equal(canEditJob(rider, { ...job, assignedDeliveryAgentId: 'rider' }), false);
  // Riders only reach the jobs the Ghana warehouse has given them
  assert.equal(canEditJob(rider, { ...job, status: 'ready_for_delivery' }), false);
  assert.equal(canEditJob(rider, { ...job, status: 'ready_for_delivery', assignedDeliveryAgentId: 'someone-else' }), false);
  // Anyone can self-register as "user", so it must never be enough to edit or read other people's jobs.
  assert.equal(canEditJob({ id: 'public', role: 'user' }, { ...job, createdBy: 'public' }), false);
  assert.equal(canAccessJob({ id: 'public', role: 'user' }, job), false);
});

test('UK-side warehouse staff create jobs; Ghana warehouse staff view invoices', () => {
  assert.equal(canCreateJob(ukWarehouse), true);
  assert.equal(canCreateJob({ id: 'w', role: 'warehouse', warehouseLocation: null }), true);
  assert.equal(canCreateJob(admin), true);
  for (const user of [ghanaWarehouse, driver, rider, { id: 'f', role: 'finance' }, { id: 'u', role: 'user' }]) {
    assert.equal(canCreateJob(user), false, user.role);
  }
  assert.equal(canViewInvoices(ghanaWarehouse), true);
  for (const user of [ukWarehouse, driver, rider, { id: 'u', role: 'user' }]) assert.equal(canViewInvoices(user), false, user.role);
});

test('an edit never deletes a detail: blank, null and missing values are ignored', () => {
  const blanks = {
    referenceNumber: '', receiverName: null, receiverAddress: '  ', receiverContact: '', receiverPhone: null, freightType: '',
    customerId: '', pickupAddress: '', deliveryAddress: null, pickupDate: null, estimatedDelivery: '', specialInstructions: '',
    priority: '', parcelDetails: { description: '', weight: null, value: null, quantity: null, dimensions: null, packages: [] },
  };
  assert.deepEqual(buildJobUpdate(job, blanks, admin).data, {});
  assert.deepEqual(buildJobUpdate(job, {}, admin).data, {});
  assert.deepEqual(buildJobUpdate(job, { pickupDate: 'not a date', parcelDetails: { weight: 'heavy' } }, admin).data, {});
});

test('an edit writes only what changed and keeps the previous value', () => {
  const { data, oldValues, newValues } = buildJobUpdate(job, { receiverName: ' Kofi ', priority: 'Urgent', pickupDate: '2026-11-01T00:00:00.000Z' }, driver);
  assert.deepEqual(data, { receiverName: 'Kofi' });
  assert.deepEqual(oldValues, { receiverName: 'Ama' });
  assert.deepEqual(newValues, { receiverName: 'Kofi' });
});

test('sending fewer packages does not remove packages or their details', () => {
  const twoPackages = { ...job, packages: [...job.packages, { description: 'Barrel', weight: 20 }] };
  const { data } = buildJobUpdate(twoPackages, { parcelDetails: { packages: [{ description: 'Big box', weight: '' }] } }, admin);
  assert.equal(data.packages.length, 2);
  // Lines are tidied up (a quantity and a type), and nothing that was there is lost
  assert.deepEqual(data.packages[0], { description: 'Big box', packageType: null, quantity: 1, weight: 5, estimatedPrice: 100, fragile: true });
  assert.equal(data.packages[1].description, 'Barrel');
});

test('drivers and riders cannot change the price, and edits cannot move the status', () => {
  assert.deepEqual(buildJobUpdate(job, { parcelDetails: { value: 1 }, status: 'delivered' }, driver).data, {});
  assert.deepEqual(buildJobUpdate(job, { parcelDetails: { value: 1 } }, rider).data, {});
  assert.deepEqual(buildJobUpdate(job, { parcelDetails: { value: 150 }, status: 'Draft' }, admin).data, { value: 150 });
  assert.deepEqual(buildJobUpdate({ ...job, status: 'Draft' }, { status: 'Pending Collection' }, admin).data, { status: 'pending_collection' });
});

const JPEG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(32)]).toString('base64');

test('only real images count as photos', () => {
  assert.equal(parseImage({ fileData: `data:image/jpeg;base64,${JPEG}` }, 'photo').mimeType, 'image/jpeg');
  assert.equal(parseImage({ fileData: JPEG }, 'photo').fileName, 'photo.jpg');
  // The claimed type is not trusted
  assert.equal(parseImage({ fileData: Buffer.from('<svg onload=alert(1)></svg>').toString('base64'), mimeType: 'image/png' }), null);
  for (const bad of [null, {}, { fileData: '' }, { fileData: 42 }, { fileData: 'data:image/png;base64,' }]) assert.equal(parseImage(bad), null);
});

test('file names that are not plain ASCII are safe in response headers', () => {
  const header = contentDisposition('Screenshot 4.47 PM "x".png');
  assert.match(header, /^[\x20-\x7e]+$/);
});
