const express = require('express');
const router = express.Router();
const accountController = require('../controllers/accountController');

// FIX: Change from '/' to '/create' to avoid conflicts
router.post('/create', accountController.createAccount);
router.post('/', accountController.createAccount); // Keep both for compatibility
router.get('/', accountController.getAllAccounts);
router.get('/:accountNo', accountController.getAccountByNumber);
router.get('/:accountNo/balance', accountController.getBalance);
router.put('/:accountNo/status', accountController.updateAccountStatus);

module.exports = router;