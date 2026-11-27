// Lynk Infrastructure: SMS and email with one account key, and the account's messaging plan.
// https://www.lynkinfra.com/developers (spec: https://www.lynkinfra.com/api/v1/openapi.json)
// BestDeal has its own Lynk sub-account: its own balance, monthly plan and key. Only the server
// ever holds the key (saved encrypted in SMS & Email Setup).

const { providerRequest } = require('../utils/providerRequest');

const BASE_URL = 'https://www.lynkinfra.com/api/v1';

/** Lynk's refusals, in words an admin can act on. */
const refusal = (status, data) => {
  if (status === 401) return 'Lynk did not accept the API key. Enter BestDeal\'s own Lynk key in SMS & Email Setup';
  if (status === 402) return 'Out of messages: the monthly plan is used up and the Lynk balance cannot cover more. Choose a plan or pay ahead in Settings → Customer Messages → Messaging Plan';
  if (status === 403) return 'The Lynk key is not allowed to do this. It needs the texts (SMS) permission';
  if (status === 503) return 'Lynk is busy right now. Please try again in a minute';
  // A sender name must be approved on BestDeal's own Lynk account; without one, texts go as "Lynk"
  if (status === 400 && /sender/i.test(data?.error || '')) {
    return `Lynk: ${data.error}. Leave Sender blank in SMS & Email Setup until Lynk approves a sender name for BestDeal's account`;
  }
  return data?.error ? `Lynk: ${data.error}` : `Lynk refused the request (HTTP ${status})`;
};

const call = async (method, path, apiKey, payload) => {
  const { ok, status, data } = await providerRequest('Lynk', `${BASE_URL}${path}`, {
    method,
    headers: { Authorization: `Bearer ${apiKey}`, ...(payload && { 'Content-Type': 'application/json' }) },
    ...(payload && { body: JSON.stringify(payload) }),
  });
  if (!ok) {
    const error = new Error(refusal(status, data));
    error.lynkStatus = status;
    throw error;
  }
  return data || {};
};

/** Needs a key with the "sms" permission. Without a sender, Lynk's own sender name is used. */
const sendLynkSms = async ({ apiKey, to, message, sender }) => {
  const data = await call('POST', '/sms', apiKey, { to, message, ...(sender && { sender }) });
  if (data.status === 'FAILED') throw new Error('Lynk could not send the message');
  // Lynk answers 200 even when the only number could not be used
  if (data.invalidNumbers?.length > 0) throw new Error('Lynk says this phone number is not valid');
  if (data.rejected > 0) throw new Error('The phone network rejected this SMS');
  return { id: data.id || null };
};

/** Needs a key with the "email" permission. */
const sendLynkEmail = async ({ apiKey, to, subject, text, html, fromName }) => {
  const data = await call('POST', '/email', apiKey, { to, subject, body: text, html, from_name: fromName });
  if (data.status === 'FAILED') throw new Error('Lynk could not send the message');
  return { id: data.id || null };
};

/**
 * The plan, texts and emails left this month, the next renewal, the balance that pays it, and the
 * plans on offer (with their prices: BestDeal never keeps its own copy of the prices).
 */
const getLynkAccount = (apiKey) => call('GET', '/account', apiKey);

/**
 * Choose a monthly plan. Lynk answers `on` (started from the balance), `from_next_renewal`
 * (a plan is running; nothing paid now) or `payment_needed` with its payment page.
 * The same `requestId` sent twice counts once.
 */
const chooseLynkPlan = (apiKey, { plan, requestId, backUrl }) =>
  call('POST', '/account/plan', apiKey, { plan, request_id: requestId, ...(backUrl && { back_url: backUrl }) });

/** Pay ahead onto the balance: Lynk's payment page, paid by the admin. */
const createLynkTopUp = (apiKey, { amountCents, backUrl }) =>
  call('POST', '/account/top-ups', apiKey, { amount_cents: amountCents, ...(backUrl && { back_url: backUrl }) });

/** Whether a top-up (or a plan's payment) is pending, paid or failed. */
const getLynkTopUp = (apiKey, id) => call('GET', `/account/top-ups/${encodeURIComponent(id)}`, apiKey);

module.exports = { sendLynkSms, sendLynkEmail, getLynkAccount, chooseLynkPlan, createLynkTopUp, getLynkTopUp };
