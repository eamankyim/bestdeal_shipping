const test = require('node:test');
const assert = require('node:assert/strict');
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
const { toE164 } = require('../src/utils/phone');
const { encrypt, decrypt } = require('../src/utils/secretBox');
const { PROVIDERS } = require('../src/services/smsProviders');

test('UK and Ghana mobiles are understood however they are typed', () => {
  for (const typed of ['+447700900123', '+44 7700 900123', '+44 (0)7700 900123', '0044 7700 900123', '07700 900123', '07700-900-123', '447700900123', '7700900123']) {
    assert.equal(toE164(typed), '+447700900123', typed);
  }
  for (const typed of ['+233241234567', '+233 24 123 4567', '+233 (0) 24 123 4567', '00233241234567', '0241234567', '024-123-4567', '233241234567', '241234567', '+2330241234567']) {
    assert.equal(toE164(typed), '+233241234567', typed);
  }
  assert.equal(toE164('0551234567'), '+233551234567');
  assert.equal(toE164('+1 (415) 555-2671'), '+14155552671');
});

test('numbers that cannot receive SMS, or whose country is unclear, are refused', () => {
  for (const typed of ['', null, undefined, 'N/A', 'ask Jane', '123', '+442079460958', '02079460958', '+233302123456', '0302123456', '4155552671', '+44770090', '07700 900123 or 0241234567', '+', '++447700900123']) {
    assert.equal(toE164(typed), null, String(typed));
  }
});

test('saved keys are encrypted, differ each time, and cannot be altered or read with another secret', () => {
  const first = encrypt('my-api-key');
  assert.ok(!first.includes('my-api-key'));
  assert.notEqual(first, encrypt('my-api-key'));
  assert.equal(decrypt(first), 'my-api-key');
  const parts = first.split(':');
  parts[3] = Buffer.from('tampered!!').toString('base64');
  assert.equal(decrypt(parts.join(':')), null);
  for (const bad of [null, undefined, '', 'plain', 'v1:a:b']) assert.equal(decrypt(bad), null);
  const original = process.env.JWT_SECRET;
  process.env.JWT_SECRET = 'another-secret';
  assert.equal(decrypt(first), null);
  process.env.JWT_SECRET = original;
});

const withFetch = async (reply, run) => {
  const original = global.fetch;
  const calls = [];
  global.fetch = async (url, options) => {
    calls.push({ url: String(url), options });
    if (reply instanceof Error) throw reply;
    return { ok: reply.status < 400, status: reply.status, json: async () => { if (reply.body === undefined) throw new Error('not json'); return reply.body; } };
  };
  try { return { result: await run(), calls }; } finally { global.fetch = original; }
};

const ACCOUNT = `AC${'a'.repeat(32)}`;
const twilio = { accountSid: ACCOUNT, apiKeySid: '', authToken: 'secret', sender: 'BestDeal' };
const sendTwilio = (values) => () => PROVIDERS.twilio.send({ to: '+233241234567', body: 'Hi & bye', values: { ...twilio, ...values } });

test('Twilio: request matches its API, for a name, a number, a messaging service and an API key', async () => {
  const { result, calls } = await withFetch({ status: 201, body: { sid: 'SM1', status: 'queued' } }, sendTwilio());
  assert.deepEqual(result, { id: 'SM1' });
  assert.equal(calls[0].url, `https://api.twilio.com/2010-04-01/Accounts/${ACCOUNT}/Messages.json`);
  assert.equal(calls[0].options.headers.Authorization, `Basic ${Buffer.from(`${ACCOUNT}:secret`).toString('base64')}`);
  assert.deepEqual(Object.fromEntries(calls[0].options.body), { To: '+233241234567', Body: 'Hi & bye', From: 'BestDeal' });

  const service = `MG${'b'.repeat(32)}`;
  const viaService = await withFetch({ status: 201, body: { sid: 'SM2' } }, sendTwilio({ sender: service, apiKeySid: `SK${'c'.repeat(32)}` }));
  assert.equal(viaService.calls[0].options.body.get('MessagingServiceSid'), service);
  assert.equal(viaService.calls[0].options.body.get('From'), null);
  assert.equal(viaService.calls[0].options.headers.Authorization, `Basic ${Buffer.from(`SK${'c'.repeat(32)}:secret`).toString('base64')}`);
});

test('Twilio: refusals are reported with the reason', async () => {
  await assert.rejects(withFetch({ status: 400, body: { message: 'Invalid To' } }, sendTwilio()), /Invalid To/);
  await assert.rejects(withFetch({ status: 503 }, sendTwilio()), /HTTP 503/);
  await assert.rejects(withFetch({ status: 201, body: { sid: 'x', status: 'failed', error_message: 'Blocked' } }, sendTwilio()), /Blocked/);
  await assert.rejects(withFetch(new Error('ECONNREFUSED'), sendTwilio()), /Could not reach Twilio/);
  await assert.rejects(withFetch(Object.assign(new Error('t'), { name: 'TimeoutError' }), sendTwilio()), /may or may not have been sent/);
});

const lynk = { apiKey: 'lynk_abc', sender: '' };
const sendLynk = (values) => () => PROVIDERS.lynk.send({ to: '+233241234567', body: 'Hello', values: { ...lynk, ...values } });
const lynkOk = { id: 'cm1', status: 'SENT', sender: 'LYNK', recipients: 1, parts: 1, unitsUsed: 1, rejected: 0, invalidNumbers: [] };

test('Lynk: request matches its API, and the sender is left out when not set', async () => {
  const { result, calls } = await withFetch({ status: 200, body: lynkOk }, sendLynk());
  assert.deepEqual(result, { id: 'cm1' });
  assert.equal(calls[0].url, 'https://www.lynkinfra.com/api/v1/sms');
  assert.equal(calls[0].options.method, 'POST');
  assert.equal(calls[0].options.headers.Authorization, 'Bearer lynk_abc');
  assert.deepEqual(JSON.parse(calls[0].options.body), { to: '+233241234567', message: 'Hello' });
  const named = await withFetch({ status: 200, body: lynkOk }, sendLynk({ sender: 'BestDeal' }));
  assert.equal(JSON.parse(named.calls[0].options.body).sender, 'BestDeal');
});

test('Lynk: a 200 answer that did not reach the number is a failure, and refusals give the reason', async () => {
  await assert.rejects(withFetch({ status: 200, body: { ...lynkOk, invalidNumbers: ['x'], recipients: 0 } }, sendLynk()), /not valid/);
  await assert.rejects(withFetch({ status: 200, body: { ...lynkOk, rejected: 1 } }, sendLynk()), /network rejected/);
  await assert.rejects(withFetch({ status: 200, body: { ...lynkOk, status: 'FAILED' } }, sendLynk()), /could not send/);
  await assert.rejects(withFetch({ status: 402, body: { error: 'Insufficient wallet balance' } }, sendLynk()), /Lynk: Insufficient wallet balance/);
  await assert.rejects(withFetch({ status: 401, body: { error: 'Invalid or missing API key' } }, sendLynk()), /Invalid or missing API key/);
  await assert.rejects(withFetch({ status: 503 }, sendLynk()), /HTTP 503/);
});

test('Lynk: email request matches its API', async () => {
  const { sendLynkEmail } = require('../src/services/lynkApi');
  const { result, calls } = await withFetch({ status: 200, body: { id: 'em1', status: 'SENT', unitsUsed: 1 } }, () => sendLynkEmail({ apiKey: 'lynk_abc', to: 'a@b.test', subject: 'S', text: 'T', html: '<p>T</p>', fromName: 'BestDeal' }));
  assert.deepEqual(result, { id: 'em1' });
  assert.equal(calls[0].url, 'https://www.lynkinfra.com/api/v1/email');
  assert.deepEqual(JSON.parse(calls[0].options.body), { to: 'a@b.test', subject: 'S', body: 'T', html: '<p>T</p>', from_name: 'BestDeal' });
});

test('only a Lynk account key is accepted, not a payment key', () => {
  const { pattern } = PROVIDERS.lynk.fields.find((field) => field.key === 'apiKey');
  assert.ok(pattern.test('lynk_abc123'));
  for (const bad of ['sk_live_abc', 'lynk_', 'lynk_a b', 'lynk_a\nX: y', 'abc']) assert.ok(!pattern.test(bad), bad);
});

const sendArkesel = () => PROVIDERS.arkesel.send({ to: '+233241234567', body: 'Hello', values: { apiKey: 'k1', sender: 'BestDeal' } });

test('Arkesel: request matches its API, with the number sent without "+"', async () => {
  const { result, calls } = await withFetch({ status: 200, body: { status: 'success', data: [{ recipient: '233241234567', id: 'id-1' }] } }, sendArkesel);
  assert.deepEqual(result, { id: 'id-1' });
  assert.equal(calls[0].url, 'https://sms.arkesel.com/api/v2/sms/send');
  assert.equal(calls[0].options.headers['api-key'], 'k1');
  assert.deepEqual(JSON.parse(calls[0].options.body), { sender: 'BestDeal', message: 'Hello', recipients: ['233241234567'] });
});

test('Arkesel: "success" with the number listed as invalid is a failure', async () => {
  await assert.rejects(withFetch({ status: 200, body: { status: 'success', data: [{ 'invalid numbers': ['233241234567'] }] } }, sendArkesel), /rejected this phone number/);
  await assert.rejects(withFetch({ status: 402, body: { status: 'error', message: 'Insufficient balance or invalid coverage!' } }, sendArkesel), /Insufficient balance/);
  await assert.rejects(withFetch({ status: 200, body: { status: 'error', message: 'Nope' } }, sendArkesel), /Nope/);
});

test('settings that go into a web address or a sender name are strictly checked', () => {
  const pattern = (provider, key) => PROVIDERS[provider].fields.find((field) => field.key === key).pattern;
  assert.ok(pattern('twilio', 'accountSid').test(ACCOUNT));
  for (const bad of ['AC123', `${ACCOUNT}/../x`, `AC${'z'.repeat(32)}`, '']) assert.ok(!pattern('twilio', 'accountSid').test(bad), bad);
  for (const good of ['BestDeal', 'Best Deal', '+447700900123', `MG${'a'.repeat(32)}`]) assert.ok(pattern('twilio', 'sender').test(good), good);
  for (const provider of ['twilio', 'arkesel']) for (const bad of ['TwelveLetter', '12345', 'Déal', 'a\nb']) assert.ok(!pattern(provider, 'sender').test(bad), `${provider} ${bad}`);
});
