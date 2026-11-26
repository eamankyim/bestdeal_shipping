// Lynk Infrastructure: SMS and email with one account key.
// https://www.lynkinfra.com/developers (spec: https://www.lynkinfra.com/api/v1/openapi.json)

const { providerRequest } = require('../utils/providerRequest');

const BASE_URL = 'https://www.lynkinfra.com/api/v1';

const post = async (path, apiKey, payload) => {
  const { ok, status, data } = await providerRequest('Lynk', `${BASE_URL}${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!ok) throw new Error(data?.error ? `Lynk: ${data.error}` : `Lynk refused the message (HTTP ${status})`);
  if (data?.status === 'FAILED') throw new Error('Lynk could not send the message');
  return data || {};
};

/** Needs a key with the "sms" permission. Without a sender, Lynk's own sender name is used. */
const sendLynkSms = async ({ apiKey, to, message, sender }) => {
  const data = await post('/sms', apiKey, { to, message, ...(sender && { sender }) });
  // Lynk answers 200 even when the only number could not be used
  if (data.invalidNumbers?.length > 0) throw new Error('Lynk says this phone number is not valid');
  if (data.rejected > 0) throw new Error('The phone network rejected this SMS');
  return { id: data.id || null };
};

/** Needs a key with the "email" permission. */
const sendLynkEmail = async ({ apiKey, to, subject, text, html, fromName }) => {
  const data = await post('/email', apiKey, { to, subject, body: text, html, from_name: fromName });
  return { id: data.id || null };
};

module.exports = { sendLynkSms, sendLynkEmail };
