// SMS set-up (which provider, which keys) and sending. What each SMS says, and when, is in customerMessageService.
// The Lynk key can also be used to send emails.

const prisma = require('../config/database');
const { PROVIDERS } = require('./smsProviders');
const { toE164 } = require('../utils/phone');
const { encrypt, decrypt } = require('../utils/secretBox');

const SETTING_KEY = 'sms_config';

const readStored = async () => {
  const setting = await prisma.setting.findUnique({ where: { key: SETTING_KEY } });
  try {
    return JSON.parse(setting?.value || '{}') || {};
  } catch (error) {
    console.error('⚠️ Stored SMS settings are not valid JSON');
    return {};
  }
};

/** Turn what is stored into usable values, and say what is missing. */
const resolveSetup = (stored) => {
  const provider = PROVIDERS[stored.provider];
  if (!provider) return { enabled: false, configured: false, ready: false, problem: 'SMS has not been set up yet' };

  const saved = stored.credentials?.[stored.provider] || {};
  const values = {};
  let problem = null;
  for (const field of provider.fields) {
    const value = field.secret && saved[field.key] ? decrypt(saved[field.key]) : saved[field.key];
    if (field.secret && saved[field.key] && value === null) {
      problem = problem || `The saved ${field.label} can no longer be read. Please enter it again`;
    } else if (field.required && !value) {
      problem = problem || `${field.label} is missing`;
    }
    values[field.key] = value || '';
  }

  const enabled = stored.enabled === true;
  return {
    enabled,
    configured: !problem,
    ready: enabled && !problem,
    problem: problem || (enabled ? null : 'SMS is switched off'),
    providerKey: stored.provider,
    provider,
    values,
  };
};

const getSmsSetup = async () => resolveSetup(await readStored());

/** Sending emails with the Lynk key, whichever provider sends the SMS. */
const resolveLynkEmail = (stored) => {
  const savedKey = stored.credentials?.lynk?.apiKey;
  const apiKey = savedKey ? decrypt(savedKey) : null;
  let problem = null;
  if (!savedKey) problem = 'The Lynk API Key is missing';
  else if (!apiKey) problem = 'The saved Lynk API Key can no longer be read. Please enter it again';
  return { enabled: stored.lynkEmail === true, configured: !problem, apiKey, problem };
};

const getLynkEmailSetup = async () => resolveLynkEmail(await readStored());

/** What the settings page may see: never the secrets themselves, only whether they are saved. */
const describeSetup = (stored) => {
  const setup = resolveSetup(stored);
  return {
    enabled: setup.enabled,
    provider: stored.provider || null,
    ready: setup.ready,
    configured: setup.configured,
    problem: setup.problem,
    lynkEmail: { enabled: stored.lynkEmail === true, configured: resolveLynkEmail(stored).configured },
    providers: Object.entries(PROVIDERS).map(([key, provider]) => ({
      key,
      label: provider.label,
      coverage: provider.coverage,
      fields: provider.fields.map(({ pattern, ...field }) => {
        const saved = stored.credentials?.[key]?.[field.key];
        return { ...field, value: field.secret ? '' : saved || '', saved: Boolean(saved) };
      }),
    })),
  };
};

const getSmsSettings = async () => describeSetup(await readStored());

/** Returns { error } for bad input, otherwise { settings }. Blank keys and required fields keep their saved value. */
const saveSmsSettings = async (input, userId) => {
  const provider = PROVIDERS[input?.provider];
  if (!provider) return { error: 'Choose an SMS provider' };

  const stored = await readStored();
  const saved = { ...(stored.credentials?.[input.provider] || {}) };
  for (const field of provider.fields) {
    const value = String(input.values?.[field.key] ?? '').trim();
    if (!value) {
      // Optional settings are shown on the page, so clearing one there means removing it
      if (!field.secret && !field.required && input.values && field.key in input.values) delete saved[field.key];
      continue;
    }
    if (value.length > 300) return { error: `${field.label} is too long` };
    if (field.pattern && !field.pattern.test(value)) return { error: `${field.label} is not valid.${field.help ? ` ${field.help}.` : ''}` };
    try {
      saved[field.key] = field.secret ? encrypt(value) : value;
    } catch (error) {
      return { error: error.message };
    }
  }

  const next = {
    ...stored,
    provider: input.provider,
    enabled: input.enabled === true,
    lynkEmail: input.lynkEmail === undefined ? stored.lynkEmail === true : input.lynkEmail === true,
    credentials: { ...(stored.credentials || {}), [input.provider]: saved },
  };
  const setup = resolveSetup(next);
  if (next.enabled && !setup.configured) return { error: `SMS cannot be switched on yet: ${setup.problem}` };
  const lynkEmail = resolveLynkEmail(next);
  if (next.lynkEmail && !lynkEmail.configured) return { error: `Email through Lynk cannot be switched on yet: ${lynkEmail.problem}` };

  const value = JSON.stringify(next);
  await prisma.setting.upsert({
    where: { key: SETTING_KEY },
    create: { key: SETTING_KEY, value, type: 'json', description: 'SMS and email provider set-up (keys are encrypted)', updatedBy: userId },
    update: { value, updatedBy: userId },
  });
  return { settings: describeSetup(next) };
};

const logSms = async (entry) => {
  try {
    await prisma.smsMessage.create({ data: entry });
  } catch (error) {
    console.error('⚠️ Could not record an SMS in the history:', error.message);
  }
};

/**
 * Send one SMS and record what happened. Never throws.
 * @param {{ phone, body, event, jobId?, customerId?, reference? }} sms
 * @param {object} setup - from getSmsSetup(), so a batch reads the settings once
 */
const sendSms = async ({ phone, body, event, jobId = null, customerId = null, reference = null }, setup) => {
  const record = { event, body, jobId, customerId, reference, provider: setup.providerKey || null };

  const to = toE164(phone);
  if (!to) {
    const error = phone ? `"${phone}" is not a phone number that can receive SMS` : 'Customer has no phone number';
    await logSms({ ...record, recipient: String(phone || ''), status: 'skipped', error });
    return { sent: false, reason: error };
  }

  try {
    const { id } = await setup.provider.send({ to, body, values: setup.values });
    await logSms({ ...record, recipient: to, status: 'sent', providerMessageId: id });
    return { sent: true, messageId: id };
  } catch (error) {
    console.error(`⚠️ SMS "${event}" was not sent:`, error.message);
    await logSms({ ...record, recipient: to, status: 'failed', error: String(error.message).slice(0, 500) });
    return { sent: false, reason: error.message };
  }
};

/** Lets an admin check the set-up before switching SMS on for customers. */
const sendTestSms = async (phone) => {
  const setup = await getSmsSetup();
  if (!setup.configured) return { sent: false, reason: setup.problem };
  return sendSms({ phone, event: 'test', body: 'Test message: your SMS set-up is working.' }, setup);
};

const getSmsHistory = async ({ page = 1, limit = 20 } = {}) => {
  const take = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
  const current = Math.max(parseInt(page, 10) || 1, 1);
  const [messages, total] = await Promise.all([
    prisma.smsMessage.findMany({ orderBy: { createdAt: 'desc' }, skip: (current - 1) * take, take }),
    prisma.smsMessage.count(),
  ]);
  return { messages, total, page: current, limit: take };
};

module.exports = { getSmsSetup, getLynkEmailSetup, getSmsSettings, saveSmsSettings, sendSms, sendTestSms, getSmsHistory };
