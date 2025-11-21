const express = require('express');
const router = express.Router();
const { validate, schemas } = require('../middleware/validation');
const { authenticateToken, authorize } = require('../middleware/auth');
const saleController = require('../controllers/saleController');

// @route   GET /api/sales
// @desc    Get all sales
// @access  Private
router.get('/', authenticateToken, saleController.getAllSales);

// @route   GET /api/sales/stats
// @desc    Get sale statistics
// @access  Private
router.get('/stats', authenticateToken, saleController.getSaleStats);

// @route   GET /api/sales/trends
// @desc    Get monthly sale trends
// @access  Private
router.get('/trends', authenticateToken, saleController.getMonthlyTrends);

// @route   GET /api/sales/customer/:customerId
// @desc    Get sales by customer
// @access  Private
router.get('/customer/:customerId', authenticateToken, saleController.getSalesByCustomer);

// @route   GET /api/sales/product/:productId
// @desc    Get sales by product
// @access  Private
router.get('/product/:productId', authenticateToken, saleController.getSalesByProduct);

// @route   GET /api/sales/:id/invoice
// @desc    Generate PDF invoice
// @access  Private
router.get('/:id/invoice', authenticateToken, saleController.generateInvoice);

// @route   GET /api/sales/:id
// @desc    Get sale by ID
// @access  Private
router.get('/:id', authenticateToken, saleController.getSaleById);

// @route   POST /api/sales
// @desc    Create new sale
// @access  Private
router.post('/', 
  authenticateToken, 
  validate(schemas.sale), 
  saleController.createSale
);

module.exports = router;
