// How to talk to each SMS provider. To add one: list its settings and implement send().
// send() gets { to: '+447700900123', body, values } and returns { id }, or throws with a message an admin can act on.

const { providerRequest } = require('../utils/providerRequest');
const { sendLynkSms } = require('./lynkApi');

const ALPHANUMERIC_SENDER = /^(?=.*[A-Za-z])[A-Za-z0-9 .&_-]{1,11}$/;

// The first one is offered by default
const PROVIDERS = {
  lynk: {
    label: 'Lynk',
    coverage: 'Ghana, and other countries by country code',
    fields: [
      {
        key: 'apiKey',
        label: 'API Key',
        required: true,
        secret: true,
        help: 'Starts with lynk_. Create it in Lynk under Developer / API, with the sms permission (and email, to send emails too)',
        pattern: /^lynk_[\x21-\x7e]+$/,
      },
      {
        key: 'sender',
        label: 'Sender ID (optional)',
        help: "Must be approved on BestDeal's own Lynk account first, up to 11 characters. Leave blank to send as Lynk",
        pattern: ALPHANUMERIC_SENDER,
      },
    ],
    send: ({ to, body, values }) => sendLynkSms({ apiKey: values.apiKey, to, message: body, sender: values.sender }),
  },

  // https://www.twilio.com/docs/messaging/api/message-resource
  twilio: {
    label: 'Twilio',
    coverage: 'UK, Ghana and most other countries',
    fields: [
      { key: 'accountSid', label: 'Account SID', required: true, help: 'Starts with AC', pattern: /^AC[0-9a-fA-F]{32}$/ },
      { key: 'apiKeySid', label: 'API Key SID (optional)', help: 'Starts with SK. Leave blank to use the Auth Token', pattern: /^SK[0-9a-fA-F]{32}$/ },
      { key: 'authToken', label: 'Auth Token, or API Key Secret', required: true, secret: true },
      {
        key: 'sender',
        label: 'Sender',
        required: true,
        help: 'A name of up to 11 characters, a Twilio number (+44...), or a Messaging Service SID (MG...)',
        pattern: /^(?:\+[1-9]\d{7,14}|MG[0-9a-fA-F]{32}|(?=.*[A-Za-z])[A-Za-z0-9 .&_-]{1,11})$/,
      },
    ],
    send: async ({ to, body, values }) => {
      const form = new URLSearchParams({ To: to, Body: body });
      form.set(/^MG[0-9a-fA-F]{32}$/.test(values.sender) ? 'MessagingServiceSid' : 'From', values.sender);
      const auth = Buffer.from(`${values.apiKeySid || values.accountSid}:${values.authToken}`).toString('base64');
      const { ok, status, data } = await providerRequest('Twilio', `https://api.twilio.com/2010-04-01/Accounts/${values.accountSid}/Messages.json`, {
        method: 'POST',
        headers: { Authorization: `Basic ${auth}` },
        body: form,
      });
      if (!ok) throw new Error(data?.message || `Twilio refused the SMS (HTTP ${status})`);
      if (['failed', 'undelivered', 'canceled'].includes(data?.status)) throw new Error(data.error_message || 'Twilio could not send the SMS');
      return { id: data?.sid || null };
    },
  },

  // https://developers.arkesel.com/spec/api_spec.v2.3.1.yaml
  arkesel: {
    label: 'Arkesel',
    coverage: 'Ghana and other African countries',
    fields: [
      { key: 'apiKey', label: 'API Key', required: true, secret: true },
      {
        key: 'sender',
        label: 'Sender ID',
        required: true,
        help: 'Up to 11 characters including spaces. Arkesel must approve it first',
        pattern: ALPHANUMERIC_SENDER,
      },
    ],
    send: async ({ to, body, values }) => {
      const { ok, status, data } = await providerRequest('Arkesel', 'https://sms.arkesel.com/api/v2/sms/send', {
        method: 'POST',
        headers: { 'api-key': values.apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender: values.sender, message: body, recipients: [to.replace('+', '')] }),
      });
      if (!ok || data?.status !== 'success') throw new Error(data?.message || `Arkesel refused the SMS (HTTP ${status})`);
      // A "success" answer can still list the number under "invalid numbers" instead of giving it an id
      const entries = [].concat(data.data ?? []);
      const accepted = entries.find((entry) => entry?.id);
      if (entries.length > 0 && !accepted) throw new Error('Arkesel rejected this phone number');
      return { id: accepted?.id || null };
    },
  },
};

module.exports = { PROVIDERS };
