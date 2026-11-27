// BestDeal's Lynk messaging plan (Settings → Customer Messages → Messaging Plan): what is left
// this month, the renewal, the balance, choosing a plan and paying ahead. Every Lynk call is made
// here with the key saved in SMS & Email Setup; the browser only ever sees the answers.
// Lynk renews the plan from the balance each month by itself.

const prisma = require('../config/database');
const { getLynkEmailSetup } = require('./smsService');
const { getLynkAccount, chooseLynkPlan, createLynkTopUp, getLynkTopUp } = require('./lynkApi');

// Spending BestDeal's money is for administrators only; customer service can see the plan
const PAYERS = ['admin', 'superadmin'];
const canPay = (user) => PAYERS.includes(user?.role);

class PlanError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

/** The saved Lynk key (the same one that sends texts and emails). */
const lynkKey = async () => {
  const { apiKey, problem } = await getLynkEmailSetup();
  if (!apiKey) throw new PlanError(`${problem}. Save BestDeal's Lynk API key in SMS & Email Setup first`, 409);
  return apiKey;
};

/** A Lynk failure as a PlanError: Lynk's own refusals keep their words, anything else says what to do. */
const fromLynk = (error) => {
  if (error instanceof PlanError) return error;
  if (error.lynkStatus === 400) return new PlanError(error.message, 400);
  if (error.lynkStatus) return new PlanError(error.message, 502);
  return new PlanError('Could not reach Lynk. Please try again: choosing the same thing again is only counted once', 502);
};

const describeAccount = (account) => ({
  plan: account.plan ? { key: account.plan.key, name: account.plan.name } : null,
  textsLeft: account.texts_left ?? 0,
  emailsLeft: account.emails_left ?? 0,
  renews: account.renews
    ? {
      on: account.renews.on || null,
      plan: account.renews.plan || null,
      amountCents: account.renews.amount_cents ?? null,
      coveredByBalance: account.renews.covered_by_balance ?? null,
    }
    : null,
  endsOn: account.ends_on || null,
  balanceCents: account.balance_cents ?? 0,
  currency: account.currency || 'GHS',
  textsPastPlanFromBalance: account.texts_past_plan_from_balance === true,
  // Prices always come from Lynk
  plans: (account.plans || []).map((plan) => ({
    key: plan.key,
    name: plan.name,
    priceCedis: plan.price_cedis ?? null,
    amountCents: plan.amount_cents ?? null,
    texts: plan.texts ?? null,
    emails: plan.emails ?? null,
  })),
});

/**
 * Where Lynk sends the admin back after paying: the BestDeal address they are using (when it is
 * one of BestDeal's own), otherwise the main one. Lynk only accepts https.
 */
const backUrlFor = (origin) => {
  const own = [...(process.env.CORS_ORIGINS || '').split(','), process.env.FRONTEND_URL || '']
    .map((value) => value.trim().replace(/\/$/, ''))
    .filter(Boolean);
  const asked = String(origin || '').trim().replace(/\/$/, '');
  const base = own.includes(asked) ? asked : (process.env.FRONTEND_URL || own[0] || '').trim().replace(/\/$/, '');
  return base.startsWith('https://') ? `${base}/admin` : undefined;
};

const paymentPage = (url) => {
  if (!/^https:\/\//.test(String(url || ''))) throw new PlanError('Lynk did not give a payment page. Please try again', 502);
  return url;
};

const audit = (user, action, values, ip) =>
  prisma.auditLog.create({ data: { userId: user.id, action, entityType: 'messaging_plan', newValues: values, ipAddress: ip || null } })
    .catch((error) => console.error('⚠️ Could not record a messaging plan change:', error.message));

/** What Settings shows. A missing or refused key is shown on the page, not as an error. */
const getPlan = async (user) => {
  const { apiKey, problem } = await getLynkEmailSetup();
  if (!apiKey) return { connected: false, problem: `${problem}. Save BestDeal's Lynk API key in SMS & Email Setup`, canPay: canPay(user) };
  try {
    return { connected: true, account: describeAccount(await getLynkAccount(apiKey)), canPay: canPay(user) };
  } catch (error) {
    return { connected: false, problem: fromLynk(error).message, canPay: canPay(user) };
  }
};

/** `requestId` comes from the page, so pressing Choose twice (or retrying) counts once. */
const choosePlan = async (user, { plan, requestId } = {}, { origin, ip } = {}) => {
  if (!canPay(user)) throw new PlanError('Only an administrator can choose the messaging plan', 403);
  if (!/^[a-z][a-z0-9_-]{0,39}$/.test(String(plan || ''))) throw new PlanError('Choose one of the plans');
  if (!/^[A-Za-z0-9_-]{8,80}$/.test(String(requestId || ''))) throw new PlanError('Missing request id');
  const apiKey = await lynkKey();
  let answer;
  try {
    answer = await chooseLynkPlan(apiKey, { plan, requestId, backUrl: backUrlFor(origin) });
  } catch (error) {
    throw fromLynk(error);
  }
  const result = {
    status: answer.status,
    startedOn: answer.started_on || null,
    startsOn: answer.starts_on || null,
    topUpId: answer.top_up_id || null,
    amountCents: answer.amount_cents ?? null,
    currency: answer.currency || null,
    paymentUrl: answer.status === 'payment_needed' ? paymentPage(answer.payment_url) : null,
  };
  if (!['on', 'from_next_renewal', 'payment_needed'].includes(result.status)) {
    throw new PlanError('Lynk gave an answer BestDeal does not understand. Please check the plan again in a minute', 502);
  }
  await audit(user, 'choose_plan', { plan, requestId, status: result.status, topUpId: result.topUpId, amountCents: result.amountCents }, ip);
  return result;
};

/** Pay ahead onto the balance. The amount is in the balance's currency, in pesewas (cents). */
const payAhead = async (user, { amountCents } = {}, { origin, ip } = {}) => {
  if (!canPay(user)) throw new PlanError('Only an administrator can pay for messaging', 403);
  const amount = Number(amountCents);
  if (!Number.isInteger(amount) || amount < 100 || amount > 100000000) throw new PlanError('Enter an amount to pay');
  const apiKey = await lynkKey();
  let answer;
  try {
    answer = await createLynkTopUp(apiKey, { amountCents: amount, backUrl: backUrlFor(origin) });
  } catch (error) {
    throw fromLynk(error);
  }
  const result = {
    topUpId: answer.top_up_id || null,
    status: answer.status || 'pending',
    amountCents: answer.amount_cents ?? amount,
    currency: answer.currency || null,
    paymentUrl: paymentPage(answer.payment_url),
  };
  await audit(user, 'pay_ahead', { amountCents: result.amountCents, topUpId: result.topUpId }, ip);
  return result;
};

/** Asked when the admin comes back from Lynk's payment page: the return link alone proves nothing. */
const checkPayment = async (user, id) => {
  if (!canPay(user)) throw new PlanError('Only an administrator can check a payment', 403);
  if (!/^[A-Za-z0-9_-]{1,100}$/.test(String(id || ''))) throw new PlanError('Not a payment id');
  const apiKey = await lynkKey();
  let answer;
  try {
    answer = await getLynkTopUp(apiKey, id);
  } catch (error) {
    if (error.lynkStatus === 404) throw new PlanError('Lynk has no payment like that on BestDeal\'s account', 404);
    throw fromLynk(error);
  }
  return {
    topUpId: answer.top_up_id || id,
    status: ['pending', 'paid', 'failed'].includes(answer.status) ? answer.status : 'pending',
    amountCents: answer.amount_cents ?? null,
    currency: answer.currency || null,
    createdAt: answer.created_at || null,
  };
};

module.exports = { getPlan, choosePlan, payAhead, checkPayment, backUrlFor, PlanError };
