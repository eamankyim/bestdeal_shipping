// Emails and SMS sent to customers. Admins decide which go out, at which stage, and what they say
// (Settings → Customer Messages).

const prisma = require('../config/database');
const { sendEmail } = require('./emailService');
const { getSmsSetup, sendSms } = require('./smsService');
const { toJobStatus, jobStatusLabel } = require('../utils/statuses');

const SETTING_KEY = 'customer_messages';
const MAX_SUBJECT = 200;
const MAX_BODY = 5000;
const MAX_SMS = 459; // three SMS parts

const signOff = '\n\nThank you,\n{{companyName}}';

// Only the invoice email existed before this feature, so it is the only message that is on by default.
// Admins switch the others on when they are happy with the wording (and, for SMS, the cost).
// A job message has the key of the status it is sent for, and that status's name as its label.
const defineMessage = (key, when, { subject, body, sms, enabled = false, label = jobStatusLabel(key) }) => ({
  key,
  label,
  when,
  enabled,
  subject,
  body: body.startsWith('Hello') ? body : `Hello {{customerName}},\n\n${body}${signOff}`,
  smsEnabled: false,
  smsBody: sms,
});

const CUSTOMER_MESSAGES = [
  defineMessage('pending_collection', 'When a job is booked', {
    subject: 'Your shipment {{trackingId}} has been booked',
    body: 'Your shipment has been booked. Your tracking ID is {{trackingId}}.\n\nTrack it here: {{trackingLink}}',
    sms: 'Hi {{customerName}}, your shipment {{trackingId}} is booked. Track it at {{trackingLink}} - {{companyName}}',
  }),
  defineMessage('assigned', 'When a driver is assigned', {
    subject: 'A driver has been assigned to {{trackingId}}',
    body: 'A driver has been assigned to collect your shipment {{trackingId}}.',
    sms: 'Hi {{customerName}}, a driver has been assigned to collect your shipment {{trackingId}}. - {{companyName}}',
  }),
  defineMessage('collected', 'When the driver collects it', {
    subject: 'We have collected your shipment {{trackingId}}',
    body: 'Your shipment {{trackingId}} has been collected and is on its way to our warehouse.',
    sms: 'Hi {{customerName}}, we have collected your shipment {{trackingId}}. - {{companyName}}',
  }),
  defineMessage('collection_failed', 'When the driver could not collect it', {
    subject: 'We could not collect your shipment {{trackingId}}',
    body: 'We tried to collect your shipment {{trackingId}} but could not. We will contact you to arrange another time.',
    sms: 'Hi {{customerName}}, we could not collect your shipment {{trackingId}}. We will contact you to rearrange. - {{companyName}}',
  }),
  defineMessage('at_uk_warehouse', 'When it arrives at the UK warehouse', {
    subject: 'Your shipment {{trackingId}} is at our UK warehouse',
    body: 'Your shipment {{trackingId}} has arrived at our UK warehouse and will go in the next batch to Ghana.',
    sms: 'Hi {{customerName}}, your shipment {{trackingId}} is at our UK warehouse. - {{companyName}}',
  }),
  defineMessage('batched', 'When it is put in a batch', {
    subject: 'Your shipment {{trackingId}} is being prepared for shipping',
    body: 'Your shipment {{trackingId}} is being prepared for shipping.',
    sms: 'Hi {{customerName}}, your shipment {{trackingId}} is being prepared for shipping. - {{companyName}}',
  }),
  defineMessage('shipped', 'When its batch ships', {
    subject: 'Your shipment {{trackingId}} has been shipped',
    body: 'Your shipment {{trackingId}} has been shipped.\n\nTrack it here: {{trackingLink}}',
    sms: 'Hi {{customerName}}, your shipment {{trackingId}} has been shipped. Track it at {{trackingLink}} - {{companyName}}',
  }),
  defineMessage('arrived_in_ghana', 'When its batch arrives in Ghana', {
    subject: 'Your shipment {{trackingId}} has arrived in Ghana',
    body: 'Your shipment {{trackingId}} has arrived at our Ghana warehouse.',
    sms: 'Hi {{customerName}}, your shipment {{trackingId}} has arrived in Ghana. - {{companyName}}',
  }),
  defineMessage('ready_for_delivery', 'When the Ghana warehouse has checked it', {
    subject: 'Your shipment {{trackingId}} is ready for delivery',
    body: 'Your shipment {{trackingId}} is ready for delivery to {{deliveryAddress}}.',
    sms: 'Hi {{customerName}}, your shipment {{trackingId}} is ready for delivery. - {{companyName}}',
  }),
  defineMessage('out_for_delivery', 'When a dispatch rider takes it', {
    subject: 'Your shipment {{trackingId}} is out for delivery',
    body: 'Your shipment {{trackingId}} is out for delivery to {{deliveryAddress}}.',
    sms: 'Hi {{customerName}}, your shipment {{trackingId}} is out for delivery. - {{companyName}}',
  }),
  defineMessage('delivered', 'When it is delivered', {
    subject: 'Your shipment {{trackingId}} has been delivered',
    body: 'Your shipment {{trackingId}} has been delivered.',
    sms: 'Hi {{customerName}}, your shipment {{trackingId}} has been delivered. Thank you. - {{companyName}}',
  }),
  defineMessage('failed_delivery', 'When the rider could not deliver it', {
    subject: 'We could not deliver your shipment {{trackingId}}',
    body: 'We tried to deliver your shipment {{trackingId}} but could not. We will contact you to arrange another delivery.',
    sms: 'Hi {{customerName}}, we could not deliver your shipment {{trackingId}}. We will contact you to rearrange. - {{companyName}}',
  }),
  defineMessage('cancelled', 'When the job is cancelled', {
    subject: 'Your shipment {{trackingId}} has been cancelled',
    body: 'Your shipment {{trackingId}} has been cancelled. Please contact us if you have any questions.',
    sms: 'Hi {{customerName}}, your shipment {{trackingId}} has been cancelled. Please contact us with any questions. - {{companyName}}',
  }),
  defineMessage('invoice_sent', 'When an invoice is sent', {
    label: 'Invoice Sent',
    enabled: true,
    subject: 'Invoice {{invoiceNumber}} from {{companyName}}',
    body: 'Hello {{customerName}},\n\nInvoice {{invoiceNumber}} is ready.\nTotal: {{invoiceTotal}}\nDue date: {{dueDate}}\n\nPlease contact {{companyName}} if you have any questions.',
    sms: 'Hi {{customerName}}, invoice {{invoiceNumber}} for {{invoiceTotal}} is ready. Due {{dueDate}}. - {{companyName}}',
  }),
];

const PLACEHOLDERS = [
  { key: 'customerName', label: 'Customer name', sample: 'Jane Mensah' },
  { key: 'trackingId', label: 'Tracking ID', sample: 'SHIP-20261124-AB12C' },
  { key: 'referenceNumber', label: 'Reference number', sample: 'REF-1001' },
  { key: 'receiverName', label: 'Receiver name', sample: 'Kofi Boateng' },
  { key: 'pickupAddress', label: 'Pickup address', sample: '12 High Street, London' },
  { key: 'deliveryAddress', label: 'Delivery address', sample: '45 Ring Road, Accra' },
  { key: 'trackingLink', label: 'Tracking page link' },
  { key: 'companyName', label: 'Company name' },
  { key: 'invoiceNumber', label: 'Invoice number (invoice message only)', sample: 'INV-1001' },
  { key: 'invoiceTotal', label: 'Invoice total (invoice message only)', sample: '120.00' },
  { key: 'dueDate', label: 'Invoice due date (invoice message only)', sample: 'Fri Dec 25 2026' },
];

/** Which message, if any, belongs to a job status in any spelling. */
const messageKeyForStatus = (status) => {
  const key = toJobStatus(status);
  return CUSTOMER_MESSAGES.some((message) => message.key === key) ? key : null;
};

const render = (template, values) =>
  String(template || '').replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => (values[key] === undefined || values[key] === null ? '' : String(values[key])));

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

const readStored = async () => {
  const setting = await prisma.setting.findUnique({ where: { key: SETTING_KEY } });
  if (!setting?.value) return {};
  try {
    return JSON.parse(setting.value) || {};
  } catch (error) {
    console.error('⚠️ Stored customer messages are not valid JSON; using the defaults');
    return {};
  }
};

const mergeWithDefaults = (stored) =>
  CUSTOMER_MESSAGES.map((message) => ({
    ...message,
    ...(stored[message.key] || {}),
    key: message.key,
    label: message.label,
  }));

const getMessages = async () => mergeWithDefaults(await readStored());

/**
 * Returns { error } for bad input, otherwise { messages }.
 * Messages left out of the input, and fields left out of a message, are unchanged.
 */
const saveMessages = async (input, userId) => {
  if (!Array.isArray(input) || input.length === 0) return { error: 'Send at least one message' };

  const stored = await readStored();
  for (const item of input) {
    const current = mergeWithDefaults(stored).find((message) => message.key === item?.key);
    if (!current) return { error: `Unknown message "${item?.key}"` };

    const subject = String(item.subject ?? current.subject).replace(/[\r\n]+/g, ' ').trim();
    const body = String(item.body ?? current.body).trim();
    const smsBody = String(item.smsBody ?? current.smsBody).trim();
    if (!subject || !body) return { error: `"${current.label}" needs an email subject and message` };
    if (!smsBody) return { error: `"${current.label}" needs an SMS text` };
    if (subject.length > MAX_SUBJECT) return { error: `"${current.label}" subject is longer than ${MAX_SUBJECT} characters` };
    if (body.length > MAX_BODY) return { error: `"${current.label}" message is longer than ${MAX_BODY} characters` };
    if (smsBody.length > MAX_SMS) return { error: `"${current.label}" SMS is longer than ${MAX_SMS} characters` };

    const known = PLACEHOLDERS.map((placeholder) => placeholder.key);
    const unknown = [...`${subject} ${body} ${smsBody}`.matchAll(/\{\{\s*(\w+)\s*\}\}/g)].map((match) => match[1]).find((key) => !known.includes(key));
    if (unknown) return { error: `"${current.label}" uses {{${unknown}}}, which is not an available placeholder` };

    stored[current.key] = {
      enabled: item.enabled === undefined ? current.enabled : item.enabled === true,
      subject,
      body,
      smsEnabled: item.smsEnabled === undefined ? current.smsEnabled : item.smsEnabled === true,
      smsBody,
    };
  }

  const value = JSON.stringify(stored);
  await prisma.setting.upsert({
    where: { key: SETTING_KEY },
    create: { key: SETTING_KEY, value, type: 'json', description: 'Messages sent to customers', updatedBy: userId },
    update: { value, updatedBy: userId },
  });
  return { messages: mergeWithDefaults(stored) };
};

const getCompanyName = async () => {
  const setting = await prisma.setting.findUnique({ where: { key: 'organisation' } });
  try {
    return JSON.parse(setting?.value || '{}').companyName || 'BestDeal Shipping';
  } catch (error) {
    return 'BestDeal Shipping';
  }
};

const getTrackingLink = () => {
  const base = process.env.FRONTEND_URL || process.env.PRODUCTION_URL || (process.env.CORS_ORIGINS || '').split(',')[0].trim() || 'http://localhost:3000';
  return `${base.replace(/\/$/, '')}/track`;
};

/** Placeholders with example values, so the settings page can preview a message. */
const getPlaceholders = async () => {
  const real = { trackingLink: getTrackingLink(), companyName: await getCompanyName() };
  return PLACEHOLDERS.map((placeholder) => ({ ...placeholder, sample: real[placeholder.key] || placeholder.sample }));
};

const buildValues = ({ customer, job, invoice, companyName }) => ({
  customerName: customer?.name || 'Customer',
  trackingId: job?.trackingId,
  referenceNumber: job?.referenceNumber,
  receiverName: job?.receiverName,
  pickupAddress: job?.pickupAddress,
  deliveryAddress: job?.deliveryAddress,
  trackingLink: getTrackingLink(),
  companyName,
  invoiceNumber: invoice?.invoiceNumber,
  invoiceTotal: invoice ? Number(invoice.total || 0).toFixed(2) : undefined,
  dueDate: invoice?.dueDate ? new Date(invoice.dueDate).toDateString() : undefined,
});

/** Everything a send needs, read once. */
const loadContext = async () => {
  const [messages, companyName, smsSetup] = await Promise.all([getMessages(), getCompanyName(), getSmsSetup()]);
  return { messages, companyName, smsSetup };
};

const emailCustomer = async (message, customer, values) => {
  if (!message.enabled) return { sent: false, reason: 'This email is switched off in Settings' };
  if (!customer?.email) return { sent: false, reason: 'Customer has no email address' };
  try {
    const text = render(message.body, values);
    return await sendEmail({
      to: customer.email,
      subject: render(message.subject, values).replace(/[\r\n]+/g, ' '),
      text,
      html: `<p>${escapeHtml(text).replace(/\n\n+/g, '</p><p>').replace(/\n/g, '<br>')}</p>`,
    });
  } catch (error) {
    console.error(`⚠️ Customer email "${message.key}" was not sent:`, error.message);
    return { sent: false, reason: 'Email delivery failed' };
  }
};

const textCustomer = async (message, { customer, job, invoice }, values, smsSetup) => {
  if (!message.smsEnabled) return { sent: false, reason: 'This SMS is switched off in Settings' };
  if (!smsSetup.ready) return { sent: false, reason: smsSetup.problem };
  return sendSms(
    {
      phone: customer?.phone,
      body: render(message.smsBody, values),
      event: message.key,
      jobId: job?.id,
      customerId: customer?.id,
      reference: invoice?.invoiceNumber || job?.trackingId,
    },
    smsSetup
  );
};

/** Send whatever the admin has switched on for this stage. Never throws. */
const sendCustomerMessage = async (key, { customer, job, invoice } = {}, context = null) => {
  const nothing = (reason) => ({ email: { sent: false, reason }, sms: { sent: false, reason } });
  try {
    const { messages, companyName, smsSetup } = context || (await loadContext());
    const message = messages.find((item) => item.key === key);
    if (!message) return nothing('No customer message for this event');

    const values = buildValues({ customer, job, invoice, companyName });
    const [email, sms] = await Promise.all([
      emailCustomer(message, customer, values),
      textCustomer(message, { customer, job, invoice }, values, smsSetup),
    ]);
    return { email, sms };
  } catch (error) {
    console.error(`⚠️ Customer message "${key}" was not sent:`, error.message);
    return nothing('The message could not be sent');
  }
};

/** Tell a job's customer about a status change. Jobs must include their customer. */
const notifyCustomerOfStatus = (job, status, previousStatus) => {
  // Staying in the same status (a new driver, say) is not news
  const key = toJobStatus(previousStatus) === toJobStatus(status) ? null : messageKeyForStatus(status);
  return sendCustomerMessage(key, { customer: job?.customer, job });
};

/** Same, for a whole batch: settings are read once and messages go out a few at a time. */
const notifyCustomersOfStatus = async (jobs, status) => {
  const key = messageKeyForStatus(status);
  if (!key || jobs.length === 0) return;
  try {
    const context = await loadContext();
    const message = context.messages.find((item) => item.key === key);
    if (!message.enabled && !message.smsEnabled) return;
    for (let i = 0; i < jobs.length; i += 10) {
      await Promise.all(jobs.slice(i, i + 10).map((job) => sendCustomerMessage(key, { customer: job.customer, job }, context)));
    }
  } catch (error) {
    console.error('⚠️ Failed to send customer messages for batch:', error.message);
  }
};

module.exports = {
  CUSTOMER_MESSAGES,
  PLACEHOLDERS,
  getMessages,
  getPlaceholders,
  saveMessages,
  render,
  messageKeyForStatus,
  sendCustomerMessage,
  notifyCustomerOfStatus,
  notifyCustomersOfStatus,
};
