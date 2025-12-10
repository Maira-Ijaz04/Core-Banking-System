 const express = require('express');
const router = express.Router();
const loanController = require('../controllers/loanController');

router.post('/', loanController.createLoan);
router.get('/', loanController.getAllLoans);
router.get('/:id', loanController.getLoanById);

module.exports = router;
