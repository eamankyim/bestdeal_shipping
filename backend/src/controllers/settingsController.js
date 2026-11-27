const { sendSuccess, sendError } = require('../utils/responseUtils');
const { asyncHandler } = require('../middleware/errorHandler');
const { isEmailReady, sendTestEmail } = require('../services/emailService');
const { CUSTOMER_MESSAGES, getMessages, getPlaceholders, saveMessages } = require('../services/customerMessageService');
const { getSmsSettings, saveSmsSettings, sendTestSms, getSmsHistory } = require('../services/smsService');
const messagingPlan = require('../services/messagingPlanService');

/**
 * @route   GET /api/settings/customer-messages
 * @desc    Emails and SMS sent to customers at each stage, and the placeholders they can use
 * @access  Admin
 */
exports.getCustomerMessages = asyncHandler(async (req, res) => {
  const sms = await getSmsSettings();
  return sendSuccess(res, 200, 'Customer messages retrieved successfully', {
    messages: await getMessages(),
    placeholders: await getPlaceholders(),
    emailConfigured: await isEmailReady(),
    smsReady: sms.ready,
    smsProblem: sms.problem,
  });
});

/**
 * @route   PUT /api/settings/customer-messages
 * @desc    Change wording, or switch emails and SMS on and off for each stage
 * @access  Admin
 */
exports.updateCustomerMessages = asyncHandler(async (req, res) => {
  const result = await saveMessages(req.body.messages, req.user.id);
  if (result.error) return sendError(res, 400, result.error);
  return sendSuccess(res, 200, 'Customer messages saved', { messages: result.messages });
});

/**
 * @route   GET /api/settings/sms
 * @desc    SMS provider set-up. Keys are never returned, only whether they are saved.
 * @access  Admin
 */
exports.getSmsSettings = asyncHandler(async (req, res) => {
  return sendSuccess(res, 200, 'SMS settings retrieved successfully', { sms: await getSmsSettings() });
});

/**
 * @route   PUT /api/settings/sms
 * @desc    Choose the SMS provider, enter its keys, and switch SMS (and email through Lynk) on or off
 * @access  Admin
 */
exports.updateSmsSettings = asyncHandler(async (req, res) => {
  const result = await saveSmsSettings(req.body, req.user.id);
  if (result.error) return sendError(res, 400, result.error);
  return sendSuccess(res, 200, 'SMS settings saved', { sms: result.settings });
});

/**
 * @route   POST /api/settings/sms/test
 * @desc    Send a test SMS with the saved set-up
 * @access  Admin
 */
exports.sendTestSms = asyncHandler(async (req, res) => {
  const result = await sendTestSms(req.body.phone);
  if (!result.sent) return sendError(res, 400, result.reason);
  return sendSuccess(res, 200, 'Test SMS sent');
});

/**
 * @route   POST /api/settings/email/test
 * @desc    Send a test email with the saved Lynk key
 * @access  Admin
 */
exports.sendTestEmail = asyncHandler(async (req, res) => {
  const result = await sendTestEmail(req.body.email);
  if (!result.sent) return sendError(res, 400, result.reason);
  return sendSuccess(res, 200, 'Test email sent');
});

/**
 * @route   GET /api/settings/sms/history
 * @desc    SMS sent to customers, newest first, with the reason for any that were not sent
 * @access  Admin
 */
exports.getSmsHistory = asyncHandler(async (req, res) => {
  const history = await getSmsHistory(req.query);
  const labels = Object.fromEntries(CUSTOMER_MESSAGES.map((message) => [message.key, message.label]));
  return sendSuccess(res, 200, 'SMS history retrieved successfully', {
    ...history,
    messages: history.messages.map((message) => ({ ...message, eventLabel: labels[message.event] || 'Test message' })),
  });
});

// ==================== Messaging plan (BestDeal's Lynk sub-account) ====================

const planAnswer = (handler) => asyncHandler(async (req, res) => {
  try {
    return await handler(req, res);
  } catch (error) {
    if (error instanceof messagingPlan.PlanError) return sendError(res, error.status, error.message);
    throw error;
  }
});
const caller = (req) => ({ origin: req.get('origin'), ip: req.ip });

/**
 * @route   GET /api/settings/messaging-plan
 * @desc    Texts and emails left this month, the plan and its renewal, the balance, and the plans on offer
 * @access  Admin (and customer service, who can see but not pay)
 */
exports.getMessagingPlan = planAnswer(async (req, res) =>
  sendSuccess(res, 200, 'Messaging plan retrieved successfully', await messagingPlan.getPlan(req.user)));

/**
 * @route   POST /api/settings/messaging-plan/choose
 * @desc    Choose a monthly plan. May answer with Lynk's payment page when the balance is short
 * @access  Administrators only
 */
exports.chooseMessagingPlan = planAnswer(async (req, res) =>
  sendSuccess(res, 200, 'Plan chosen', await messagingPlan.choosePlan(req.user, req.body, caller(req))));

/**
 * @route   POST /api/settings/messaging-plan/top-ups
 * @desc    Pay ahead onto the Lynk balance: answers with Lynk's payment page
 * @access  Administrators only
 */
exports.payAheadForMessaging = planAnswer(async (req, res) =>
  sendSuccess(res, 200, 'Payment started', await messagingPlan.payAhead(req.user, req.body, caller(req))));

/**
 * @route   GET /api/settings/messaging-plan/top-ups/:id
 * @desc    Whether a payment made on Lynk's page went through
 * @access  Administrators only
 */
exports.checkMessagingPayment = planAnswer(async (req, res) =>
  sendSuccess(res, 200, 'Payment checked', await messagingPlan.checkPayment(req.user, req.params.id)));
