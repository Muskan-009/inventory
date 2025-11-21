const express = require('express');
const router = express.Router();
const { validate, schemas } = require('../middleware/validation');
const { authenticateToken, authorize } = require('../middleware/auth');
const purchaseController = require('../controllers/purchaseController');

// @route   GET /api/purchases
// @desc    Get all purchases
// @access  Private
router.get('/', authenticateToken, purchaseController.getAllPurchases);

// @route   GET /api/purchases/stats
// @desc    Get purchase statistics
// @access  Private
router.get('/stats', authenticateToken, purchaseController.getPurchaseStats);

// @route   GET /api/purchases/trends
// @desc    Get monthly purchase trends
// @access  Private
router.get('/trends', authenticateToken, purchaseController.getMonthlyTrends);

// @route   GET /api/purchases/vendor/:vendorId
// @desc    Get purchases by vendor
// @access  Private
router.get('/vendor/:vendorId', authenticateToken, purchaseController.getPurchasesByVendor);

// @route   GET /api/purchases/product/:productId
// @desc    Get purchases by product
// @access  Private
router.get('/product/:productId', authenticateToken, purchaseController.getPurchasesByProduct);

// @route   GET /api/purchases/:id
// @desc    Get purchase by ID
// @access  Private
router.get('/:id', authenticateToken, purchaseController.getPurchaseById);

// @route   POST /api/purchases
// @desc    Create new purchase
// @access  Private (Admin and Super Admin only)
router.post('/', 
  authenticateToken, 
  authorize('admin', 'super_admin'), 
  validate(schemas.purchase), 
  purchaseController.createPurchase
);

module.exports = router;
