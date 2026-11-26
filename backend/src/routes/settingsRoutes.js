const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { authenticate, authorize } = require('../middleware/auth');
const { body } = require('express-validator');
const { validate } = require('../middleware/validation');

router.use(authenticate, authorize('admin'));

// What customers are told, and when
router.get('/customer-messages', settingsController.getCustomerMessages);
router.put('/customer-messages', settingsController.updateCustomerMessages);

// SMS provider set-up
router.get('/sms', settingsController.getSmsSettings);
router.put('/sms', settingsController.updateSmsSettings);
router.post('/sms/test', settingsController.sendTestSms);
router.get('/sms/history', settingsController.getSmsHistory);
router.post('/email/test', body('email').isEmail().withMessage('Please enter a valid email address'), validate, settingsController.sendTestEmail);

module.exports = router;
