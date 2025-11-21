const express = require('express');
const router = express.Router();
const { validate, schemas } = require('../middleware/validation');
const { authenticateToken, authorize } = require('../middleware/auth');
const stockController = require('../controllers/stockController');

// ==================== LOCATION MANAGEMENT ====================

// @route   GET /api/stock/locations
// @desc    Get all locations
// @access  Private
router.get('/locations', authenticateToken, stockController.getLocations);

// @route   POST /api/stock/locations
// @desc    Create new location
// @access  Private (Admin and Super Admin only)
router.post('/locations', 
  authenticateToken, 
  authorize('admin', 'super_admin'), 
  stockController.createLocation
);

// ==================== BATCH MANAGEMENT ====================

// @route   POST /api/stock/batches
// @desc    Create new batch
// @access  Private (Admin and Super Admin only)
router.post('/batches', 
  authenticateToken, 
  authorize('admin', 'super_admin'), 
  stockController.createBatch
);

// @route   GET /api/stock/products/:productId/batches
// @desc    Get batches by product
// @access  Private
router.get('/products/:productId/batches', authenticateToken, stockController.getBatchesByProduct);

// ==================== STOCK LOCATION MANAGEMENT ====================

// @route   GET /api/stock/locations/:locationId/stock
// @desc    Get stock by location
// @access  Private
router.get('/locations/:locationId/stock', authenticateToken, stockController.getStockByLocation);

// @route   GET /api/stock/products/:productId/stock
// @desc    Get stock by product across all locations
// @access  Private
router.get('/products/:productId/stock', authenticateToken, stockController.getStockByProduct);

// @route   PUT /api/stock/products/:productId/locations/:locationId/quantity
// @desc    Update stock quantity
// @access  Private (Admin and Super Admin only)
router.put('/products/:productId/locations/:locationId/quantity', 
  authenticateToken, 
  authorize('admin', 'super_admin'), 
  stockController.updateStockQuantity
);

// ==================== STOCK MOVEMENTS ====================

// @route   POST /api/stock/movements
// @desc    Record stock movement
// @access  Private (Admin and Super Admin only)
router.post('/movements', 
  authenticateToken, 
  authorize('admin', 'super_admin'), 
  stockController.recordMovement
);

// @route   GET /api/stock/movements
// @desc    Get stock movements
// @access  Private
router.get('/movements', authenticateToken, stockController.getStockMovements);

// @route   POST /api/stock/movements/process
// @desc    Process stock movement with batch tracking
// @access  Private (Admin and Super Admin only)
router.post('/movements/process', 
  authenticateToken, 
  authorize('admin', 'super_admin'), 
  stockController.processStockMovement
);

// ==================== STOCK TRANSFERS ====================

// @route   POST /api/stock/transfers
// @desc    Create stock transfer
// @access  Private (Admin and Super Admin only)
router.post('/transfers', 
  authenticateToken, 
  authorize('admin', 'super_admin'), 
  stockController.createTransfer
);

// @route   GET /api/stock/transfers/:transferId
// @desc    Get transfer details
// @access  Private
router.get('/transfers/:transferId', authenticateToken, stockController.getTransfer);

// @route   POST /api/stock/transfers/:transferId/items
// @desc    Add transfer item
// @access  Private (Admin and Super Admin only)
router.post('/transfers/:transferId/items', 
  authenticateToken, 
  authorize('admin', 'super_admin'), 
  stockController.addTransferItem
);

// ==================== DAMAGED STOCK ====================

// @route   POST /api/stock/damaged
// @desc    Report damaged stock
// @access  Private (Admin and Super Admin only)
router.post('/damaged', 
  authenticateToken, 
  authorize('admin', 'super_admin'), 
  stockController.reportDamagedStock
);

// @route   GET /api/stock/damaged
// @desc    Get damaged stock
// @access  Private
router.get('/damaged', authenticateToken, stockController.getDamagedStock);

// ==================== STOCK VALUATION ====================

// @route   GET /api/stock/products/:productId/locations/:locationId/valuation
// @desc    Calculate stock valuation
// @access  Private
router.get('/products/:productId/locations/:locationId/valuation', 
  authenticateToken, 
  stockController.calculateStockValuation
);

// @route   PUT /api/stock/products/:productId/locations/:locationId/valuation
// @desc    Update stock valuation
// @access  Private (Admin and Super Admin only)
router.put('/products/:productId/locations/:locationId/valuation', 
  authenticateToken, 
  authorize('admin', 'super_admin'), 
  stockController.updateStockValuation
);

// ==================== ODD SIZE PIECES ====================

// @route   POST /api/stock/odd-size-pieces
// @desc    Add odd size piece
// @access  Private (Admin and Super Admin only)
router.post('/odd-size-pieces', 
  authenticateToken, 
  authorize('admin', 'super_admin'), 
  stockController.addOddSizePiece
);

// @route   GET /api/stock/odd-size-pieces
// @desc    Get odd size pieces
// @access  Private
router.get('/odd-size-pieces', authenticateToken, stockController.getOddSizePieces);

// ==================== STOCK ALERTS ====================

// @route   GET /api/stock/alerts
// @desc    Get stock alerts
// @access  Private
router.get('/alerts', authenticateToken, stockController.getStockAlerts);

// @route   POST /api/stock/alerts/check-low-stock
// @desc    Check and create low stock alerts
// @access  Private (Admin and Super Admin only)
router.post('/alerts/check-low-stock', 
  authenticateToken, 
  authorize('admin', 'super_admin'), 
  stockController.checkLowStockAlerts
);

// ==================== COMPREHENSIVE REPORTS ====================

// @route   GET /api/stock/report
// @desc    Get comprehensive stock report
// @access  Private
router.get('/report', authenticateToken, stockController.getStockReport);

module.exports = router;
