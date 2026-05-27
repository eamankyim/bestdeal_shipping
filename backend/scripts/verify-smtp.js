require('dotenv').config();

const { sendEmail, verifyEmailTransport } = require('../src/services/emailService');

async function main() {
  await verifyEmailTransport();
  console.log('SMTP configuration verified successfully.');

  if (process.env.SMTP_TEST_TO) {
    const result = await sendEmail({
      to: process.env.SMTP_TEST_TO,
      subject: 'BestDeal Shipping SMTP test',
      text: 'SMTP delivery is configured for BestDeal Shipping.',
    });

    console.log(`SMTP test email sent: ${result.messageId || 'no message id returned'}`);
  } else {
    console.log('No email was sent. Set SMTP_TEST_TO to send a test message.');
  }
}

main().catch((error) => {
  console.error('SMTP verification failed:', error.message);
  process.exit(1);
});
