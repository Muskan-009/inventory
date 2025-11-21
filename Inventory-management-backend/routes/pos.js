const express = require('express');
const router = express.Router();
const posController = require('../controllers/posController');
const { authenticateToken } = require('../middleware/auth');

// POS Sessions
router.post('/sessions', authenticateToken, posController.createSession);
router.get('/sessions/active', authenticateToken, posController.getActiveSession);
router.put('/sessions/:sessionId/close', authenticateToken, posController.closeSession);
router.get('/sessions/:sessionId/transactions', authenticateToken, posController.getSessionTransactions);
router.get('/sessions/:sessionId/summary', authenticateToken, posController.getSessionSummary);

// POS Transactions
router.post('/transactions', authenticateToken, posController.createTransaction);
router.get('/transactions/:transactionId', authenticateToken, posController.getTransactionWithItems);
router.post('/transactions/:transactionId/items', authenticateToken, posController.addTransactionItem);

// POS Reports
router.get('/reports/daily-sales', authenticateToken, posController.getDailySales);
router.get('/reports/top-products', authenticateToken, posController.getTopSellingProducts);
router.get('/reports/payment-modes', authenticateToken, posController.getSalesByPaymentMode);
router.get('/dashboard', authenticateToken, posController.getDashboard);

// Invoice Generation
router.get('/transactions/:transactionId/invoice', authenticateToken, posController.generateInvoice);
router.get('/transactions/:transactionId/receipt', authenticateToken, posController.generateReceipt);

module.exports = router;
