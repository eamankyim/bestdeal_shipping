const nodemailer = require('nodemailer');

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

const sendEmail = async ({ to, subject, text, html }) => {
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

const sendInvoiceEmail = async ({ invoice }) => {
  const customer = invoice.customer;
  const total = Number(invoice.total || 0).toFixed(2);
  const safeCustomerName = escapeHtml(customer.name || 'Customer');
  const safeInvoiceNumber = escapeHtml(invoice.invoiceNumber);
  const safeTotal = escapeHtml(total);
  const safeDueDate = invoice.dueDate ? escapeHtml(new Date(invoice.dueDate).toDateString()) : null;

  return sendEmail({
    to: customer.email,
    subject: `Invoice ${invoice.invoiceNumber} from BestDeal Shipping`,
    text: [
      `Hello ${customer.name || 'Customer'},`,
      '',
      `Invoice ${invoice.invoiceNumber} is ready.`,
      `Total: ${total}`,
      invoice.dueDate ? `Due date: ${new Date(invoice.dueDate).toDateString()}` : null,
      '',
      'Please contact BestDeal Shipping if you have any questions.',
    ].filter(Boolean).join('\n'),
    html: `
      <p>Hello ${safeCustomerName},</p>
      <p>Invoice <strong>${safeInvoiceNumber}</strong> is ready.</p>
      <p><strong>Total:</strong> ${safeTotal}</p>
      ${safeDueDate ? `<p><strong>Due date:</strong> ${safeDueDate}</p>` : ''}
      <p>Please contact BestDeal Shipping if you have any questions.</p>
    `,
  });
};

module.exports = {
  getEmailConfig,
  isEmailConfigured,
  sendEmail,
  sendInvitationEmail,
  sendInvoiceEmail,
  verifyEmailTransport,
};
