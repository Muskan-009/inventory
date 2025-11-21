const express = require('express');
const router = express.Router();
const { authenticateToken, authorize } = require('../middleware/auth');
const inventoryController = require('../controllers/inventoryController');

// @route   GET /api/inventory
// @desc    Get all inventory
// @access  Private
router.get('/', authenticateToken, inventoryController.getAllInventory);

// @route   GET /api/inventory/stats
// @desc    Get inventory statistics
// @access  Private
router.get('/stats', authenticateToken, inventoryController.getInventoryStats);

// @route   GET /api/inventory/low-stock
// @desc    Get low stock items
// @access  Private
router.get('/low-stock', authenticateToken, inventoryController.getLowStock);

// @route   GET /api/inventory/out-of-stock
// @desc    Get out of stock items
// @access  Private
router.get('/out-of-stock', authenticateToken, inventoryController.getOutOfStock);

// @route   GET /api/inventory/product/:productId
// @desc    Get inventory by product ID
// @access  Private
router.get('/product/:productId', authenticateToken, inventoryController.getInventoryByProduct);

// @route   GET /api/inventory/movements/:productId
// @desc    Get inventory movements for a product
// @access  Private
router.get('/movements/:productId', authenticateToken, inventoryController.getInventoryMovements);

// @route   PUT /api/inventory/product/:productId
// @desc    Update stock quantity
// @access  Private (Admin and Super Admin only)
router.put('/product/:productId', 
  authenticateToken, 
  authorize('admin', 'super_admin'), 
  inventoryController.updateStock
);

// @route   POST /api/inventory/adjust/:productId
// @desc    Adjust stock (manual adjustment)
// @access  Private (Admin and Super Admin only)
router.post('/adjust/:productId', 
  authenticateToken, 
  authorize('admin', 'super_admin'), 
  inventoryController.adjustStock
);

module.exports = router;
