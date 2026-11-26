const nodemailer = require('nodemailer');
const { getLynkEmailSetup } = require('./smsService');
const { sendLynkEmail } = require('./lynkApi');

const DEFAULT_FROM_NAME = 'BestDeal Shipping';

const escapeHtml = (value) => String(value || '').replace(/[&<>"']/g, (char) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}[char]));

const getEmailConfig = () => {
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const secureEnv = String(process.env.SMTP_SECURE || '').toLowerCase();

  return {
    host: process.env.SMTP_HOST,
    port,
    secure: secureEnv === 'true' || port === 465,
    user: process.env.SMTP_USER,
    password: process.env.SMTP_PASSWORD,
    fromName: process.env.SMTP_FROM_NAME || DEFAULT_FROM_NAME,
    from: process.env.SMTP_FROM,
  };
};

const isEmailConfigured = () => {
  const config = getEmailConfig();
  return Boolean(config.host && config.port && config.user && config.password);
};

const createTransporter = () => {
  const config = getEmailConfig();

  if (!isEmailConfigured()) {
    throw new Error('SMTP email delivery is not configured');
  }

  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.password,
    },
  });
};

const getFromAddress = () => {
  const config = getEmailConfig();

  if (config.from) {
    return config.from;
  }

  return `"${config.fromName}" <${config.user}>`;
};

/** Can emails be sent right now, through Lynk or SMTP? */
const isEmailReady = async () => {
  const lynk = await getLynkEmailSetup();
  return lynk.enabled ? lynk.configured : isEmailConfigured();
};

/** Lets an admin check the Lynk key before switching emails over to it. */
const sendTestEmail = async (to) => {
  const lynk = await getLynkEmailSetup();
  if (!lynk.configured) return { sent: false, reason: lynk.problem };
  try {
    const { id } = await sendLynkEmail({
      apiKey: lynk.apiKey,
      to,
      subject: 'Test email',
      text: 'Your email set-up is working.',
      html: '<p>Your email set-up is working.</p>',
      fromName: getEmailConfig().fromName,
    });
    return { sent: true, messageId: id };
  } catch (error) {
    return { sent: false, reason: error.message };
  }
};

const sendEmail = async ({ to, subject, text, html }) => {
  const lynk = await getLynkEmailSetup();
  if (lynk.enabled) {
    if (!lynk.configured) return { sent: false, reason: lynk.problem };
    const { id } = await sendLynkEmail({ apiKey: lynk.apiKey, to, subject, text, html, fromName: getEmailConfig().fromName });
    return { sent: true, messageId: id };
  }

  if (!isEmailConfigured()) {
    console.warn('Email delivery skipped: SMTP email delivery is not configured');
    return { sent: false, reason: 'SMTP email delivery is not configured' };
  }

  const transporter = createTransporter();
  const info = await transporter.sendMail({
    from: getFromAddress(),
    to,
    subject,
    text,
    html,
  });

  return { sent: true, messageId: info.messageId };
};

const verifyEmailTransport = async () => {
  const transporter = createTransporter();
  await transporter.verify();
  return true;
};

const sendInvitationEmail = async ({ to, role, inviteLink, inviterName }) => {
  const roleLabel = role ? role.replace(/_/g, ' ') : 'team member';
  const sender = inviterName || 'BestDeal Shipping';
  const safeRoleLabel = escapeHtml(roleLabel);
  const safeSender = escapeHtml(sender);
  const safeInviteLink = escapeHtml(inviteLink);

  return sendEmail({
    to,
    subject: 'Your BestDeal Shipping invitation',
    text: [
      `${sender} invited you to join BestDeal Shipping as ${roleLabel}.`,
      '',
      `Accept your invitation: ${inviteLink}`,
      '',
      'This invitation expires in 7 days.',
    ].join('\n'),
    html: `
      <p>${safeSender} invited you to join BestDeal Shipping as <strong>${safeRoleLabel}</strong>.</p>
      <p><a href="${safeInviteLink}">Accept your invitation</a></p>
      <p>This invitation expires in 7 days.</p>
    `,
  });
};

module.exports = {
  getEmailConfig,
  isEmailConfigured,
  isEmailReady,
  sendEmail,
  sendTestEmail,
  sendInvitationEmail,
  verifyEmailTransport,
};
