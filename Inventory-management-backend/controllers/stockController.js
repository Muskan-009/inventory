const StockManagement = require('../models/StockManagement');

// ==================== LOCATION MANAGEMENT ====================

// Get all locations
const getLocations = async (req, res) => {
  try {
    const locations = await StockManagement.getLocations();
    res.json({
      success: true,
      data: locations
    });
  } catch (error) {
    console.error('Get locations error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Create new location
const createLocation = async (req, res) => {
  try {
    const location = await StockManagement.createLocation(req.body);
    res.json({
      success: true,
      data: location,
      message: 'Location created successfully'
    });
  } catch (error) {
    console.error('Create location error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// ==================== BATCH MANAGEMENT ====================

// Create new batch
const createBatch = async (req, res) => {
  try {
    const batch = await StockManagement.createBatch(req.body);
    res.json({
      success: true,
      data: batch,
      message: 'Batch created successfully'
    });
  } catch (error) {
    console.error('Create batch error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get batches by product
const getBatchesByProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const { locationId } = req.query;
    
    const batches = await StockManagement.getBatchesByProduct(productId, locationId);
    res.json({
      success: true,
      data: batches
    });
  } catch (error) {
    console.error('Get batches error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// ==================== STOCK LOCATION MANAGEMENT ====================

// Get stock by location
const getStockByLocation = async (req, res) => {
  try {
    const { locationId } = req.params;
    const stock = await StockManagement.getStockByLocation(locationId);
    res.json({
      success: true,
      data: stock
    });
  } catch (error) {
    console.error('Get stock by location error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get stock by product
const getStockByProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const stock = await StockManagement.getStockByProduct(productId);
    res.json({
      success: true,
      data: stock
    });
  } catch (error) {
    console.error('Get stock by product error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update stock quantity
const updateStockQuantity = async (req, res) => {
  try {
    const { productId, locationId } = req.params;
    const { quantityChange, movementType } = req.body;
    
    const stock = await StockManagement.updateStockQuantity(
      productId, locationId, quantityChange, movementType
    );
    
    res.json({
      success: true,
      data: stock,
      message: 'Stock updated successfully'
    });
  } catch (error) {
    console.error('Update stock error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

// ==================== STOCK MOVEMENTS ====================

// Record stock movement
const recordMovement = async (req, res) => {
  try {
    const movementData = {
      ...req.body,
      created_by: req.user.id
    };
    
    const movement = await StockManagement.recordMovement(movementData);
    res.json({
      success: true,
      data: movement,
      message: 'Stock movement recorded successfully'
    });
  } catch (error) {
    console.error('Record movement error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get stock movements
const getStockMovements = async (req, res) => {
  try {
    const { productId, locationId, limit } = req.query;
    
    const movements = await StockManagement.getStockMovements(
      productId, locationId, parseInt(limit) || 100
    );
    
    res.json({
      success: true,
      data: movements
    });
  } catch (error) {
    console.error('Get stock movements error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// ==================== STOCK TRANSFERS ====================

// Create stock transfer
const createTransfer = async (req, res) => {
  try {
    const transferData = {
      ...req.body,
      requested_by: req.user.id
    };
    
    const transfer = await StockManagement.createTransfer(transferData);
    res.json({
      success: true,
      data: transfer,
      message: 'Stock transfer created successfully'
    });
  } catch (error) {
    console.error('Create transfer error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Add transfer item
const addTransferItem = async (req, res) => {
  try {
    const { transferId } = req.params;
    const item = await StockManagement.addTransferItem(transferId, req.body);
    
    res.json({
      success: true,
      data: item,
      message: 'Transfer item added successfully'
    });
  } catch (error) {
    console.error('Add transfer item error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get transfer details
const getTransfer = async (req, res) => {
  try {
    const { transferId } = req.params;
    const transfer = await StockManagement.getTransfer(transferId);
    
    if (!transfer) {
      return res.status(404).json({
        success: false,
        message: 'Transfer not found'
      });
    }
    
    res.json({
      success: true,
      data: transfer
    });
  } catch (error) {
    console.error('Get transfer error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// ==================== DAMAGED STOCK ====================

// Report damaged stock
const reportDamagedStock = async (req, res) => {
  try {
    const damageData = {
      ...req.body,
      reported_by: req.user.id
    };
    
    const damagedStock = await StockManagement.reportDamagedStock(damageData);
    res.json({
      success: true,
      data: damagedStock,
      message: 'Damaged stock reported successfully'
    });
  } catch (error) {
    console.error('Report damaged stock error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get damaged stock
const getDamagedStock = async (req, res) => {
  try {
    const { locationId, status } = req.query;
    const damagedStock = await StockManagement.getDamagedStock(locationId, status);
    
    res.json({
      success: true,
      data: damagedStock
    });
  } catch (error) {
    console.error('Get damaged stock error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// ==================== STOCK VALUATION ====================

// Calculate stock valuation
const calculateStockValuation = async (req, res) => {
  try {
    const { productId, locationId } = req.params;
    const { method = 'FIFO' } = req.query;
    
    const valuation = await StockManagement.calculateStockValuation(
      productId, locationId, method
    );
    
    res.json({
      success: true,
      data: valuation
    });
  } catch (error) {
    console.error('Calculate stock valuation error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

// Update stock valuation
const updateStockValuation = async (req, res) => {
  try {
    const { productId, locationId } = req.params;
    const { method, currentValue, averageCost } = req.body;
    
    const valuation = await StockManagement.updateStockValuation(
      productId, locationId, method, currentValue, averageCost
    );
    
    res.json({
      success: true,
      data: valuation,
      message: 'Stock valuation updated successfully'
    });
  } catch (error) {
    console.error('Update stock valuation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// ==================== ODD SIZE PIECES ====================

// Add odd size piece
const addOddSizePiece = async (req, res) => {
  try {
    const piece = await StockManagement.addOddSizePiece(req.body);
    res.json({
      success: true,
      data: piece,
      message: 'Odd size piece added successfully'
    });
  } catch (error) {
    console.error('Add odd size piece error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get odd size pieces
const getOddSizePieces = async (req, res) => {
  try {
    const { productId, locationId } = req.query;
    const pieces = await StockManagement.getOddSizePieces(productId, locationId);
    
    res.json({
      success: true,
      data: pieces
    });
  } catch (error) {
    console.error('Get odd size pieces error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// ==================== STOCK ALERTS ====================

// Get stock alerts
const getStockAlerts = async (req, res) => {
  try {
    const { locationId, isRead } = req.query;
    const alerts = await StockManagement.getStockAlerts(locationId, isRead);
    
    res.json({
      success: true,
      data: alerts
    });
  } catch (error) {
    console.error('Get stock alerts error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Check low stock alerts
const checkLowStockAlerts = async (req, res) => {
  try {
    const alerts = await StockManagement.checkLowStockAlerts();
    res.json({
      success: true,
      data: alerts,
      message: `${alerts.length} low stock alerts created`
    });
  } catch (error) {
    console.error('Check low stock alerts error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// ==================== COMPREHENSIVE STOCK OPERATIONS ====================

// Process stock movement with batch tracking
const processStockMovement = async (req, res) => {
  try {
    const {
      productId, locationId, batchId, movementType, quantity, unitCost,
      fromLocationId, toLocationId, referenceType, referenceId, notes
    } = req.body;
    
    // Record the movement
    const movement = await StockManagement.recordMovement({
      product_id: productId,
      batch_id: batchId,
      from_location_id: fromLocationId,
      to_location_id: toLocationId,
      movement_type: movementType,
      quantity: quantity,
      unit_cost: unitCost,
      total_cost: quantity * unitCost,
      reference_type: referenceType,
      reference_id: referenceId,
      notes: notes,
      created_by: req.user.id
    });
    
    // Update stock quantities
    if (fromLocationId) {
      await StockManagement.updateStockQuantity(
        productId, fromLocationId, -quantity, movementType
      );
    }
    
    if (toLocationId) {
      await StockManagement.updateStockQuantity(
        productId, toLocationId, quantity, movementType
      );
    }
    
    // Update batch quantity if batch is specified
    if (batchId) {
      await StockManagement.updateBatchQuantity(
        batchId, -quantity, movementType
      );
    }
    
    res.json({
      success: true,
      data: movement,
      message: 'Stock movement processed successfully'
    });
  } catch (error) {
    console.error('Process stock movement error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

// Get comprehensive stock report
const getStockReport = async (req, res) => {
  try {
    const { locationId, productId, includeAlerts = false } = req.query;
    
    let stockData = [];
    
    if (locationId) {
      stockData = await StockManagement.getStockByLocation(locationId);
    } else if (productId) {
      stockData = await StockManagement.getStockByProduct(productId);
    }
    
    const report = {
      stock: stockData,
      summary: {
        totalProducts: stockData.length,
        totalValue: stockData.reduce((sum, item) => sum + (item.current_stock * item.unit_cost || 0), 0),
        lowStockItems: stockData.filter(item => item.current_stock <= item.reorder_level).length
      }
    };
    
    if (includeAlerts) {
      report.alerts = await StockManagement.getStockAlerts(locationId, false);
    }
    
    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Get stock report error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  // Location Management
  getLocations,
  createLocation,
  
  // Batch Management
  createBatch,
  getBatchesByProduct,
  
  // Stock Location Management
  getStockByLocation,
  getStockByProduct,
  updateStockQuantity,
  
  // Stock Movements
  recordMovement,
  getStockMovements,
  
  // Stock Transfers
  createTransfer,
  addTransferItem,
  getTransfer,
  
  // Damaged Stock
  reportDamagedStock,
  getDamagedStock,
  
  // Stock Valuation
  calculateStockValuation,
  updateStockValuation,
  
  // Odd Size Pieces
  addOddSizePiece,
  getOddSizePieces,
  
  // Stock Alerts
  getStockAlerts,
  checkLowStockAlerts,
  
  // Comprehensive Operations
  processStockMovement,
  getStockReport
};
