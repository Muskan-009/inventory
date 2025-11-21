const express = require('express');
const router = express.Router();
const returnsController = require('../controllers/returnsController');
const { authenticateToken, authorize } = require('../middleware/auth');

// Create return
router.post('/', authenticateToken, returnsController.createReturn);

// Add return item
router.post('/:returnId/items', authenticateToken, returnsController.addReturnItem);

// Get all returns
router.get('/', authenticateToken, returnsController.getAllReturns);

// Get return by ID
router.get('/:id', authenticateToken, returnsController.getReturnById);

// Update return status
router.put('/:id/status', 
  authenticateToken, 
  authorize('admin', 'super_admin'), 
  returnsController.updateReturnStatus
);

// Get return statistics
router.get('/stats/overview', authenticateToken, returnsController.getReturnStats);

// Get returns by product
router.get('/product/:productId', authenticateToken, returnsController.getReturnsByProduct);

// Get return reasons summary
router.get('/reports/reasons', authenticateToken, returnsController.getReturnReasonsSummary);

module.exports = router;
