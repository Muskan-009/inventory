const WastageManagement = require('../models/WastageManagement');

// ==================== WASTAGE CATEGORIES & TYPES ====================

// Get all wastage categories
const getWastageCategories = async (req, res) => {
  try {
    const categories = await WastageManagement.getWastageCategories();
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Get wastage categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get wastage types by category
const getWastageTypesByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const types = await WastageManagement.getWastageTypesByCategory(categoryId);
    res.json({
      success: true,
      data: types
    });
  } catch (error) {
    console.error('Get wastage types error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get all wastage types
const getAllWastageTypes = async (req, res) => {
  try {
    const types = await WastageManagement.getAllWastageTypes();
    res.json({
      success: true,
      data: types
    });
  } catch (error) {
    console.error('Get all wastage types error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// ==================== WASTAGE ENTRIES ====================

// Create wastage entry
const createWastageEntry = async (req, res) => {
  try {
    const wastage = await WastageManagement.createWastageEntry(req.body);
    
    res.json({
      success: true,
      data: wastage,
      message: 'Wastage entry created successfully'
    });
  } catch (error) {
    console.error('Create wastage entry error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get wastage entries
const getWastageEntries = async (req, res) => {
  try {
    const filters = {
      productId: req.query.productId,
      locationId: req.query.locationId,
      categoryId: req.query.categoryId,
      typeId: req.query.typeId,
      status: req.query.status,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      reportedBy: req.query.reportedBy,
      limit: req.query.limit
    };
    
    const wastageEntries = await WastageManagement.getWastageEntries(filters);
    res.json({
      success: true,
      data: wastageEntries
    });
  } catch (error) {
    console.error('Get wastage entries error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get wastage entry by ID
const getWastageEntryById = async (req, res) => {
  try {
    const { wastageId } = req.params;
    const wastage = await WastageManagement.getWastageEntryById(wastageId);
    
    if (!wastage) {
      return res.status(404).json({
        success: false,
        message: 'Wastage entry not found'
      });
    }
    
    res.json({
      success: true,
      data: wastage
    });
  } catch (error) {
    console.error('Get wastage entry error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update wastage entry
const updateWastageEntry = async (req, res) => {
  try {
    const { wastageId } = req.params;
    const updateData = {
      ...req.body,
      approved_by: req.user.id
    };
    
    const wastage = await WastageManagement.updateWastageEntry(wastageId, updateData);
    res.json({
      success: true,
      data: wastage,
      message: 'Wastage entry updated successfully'
    });
  } catch (error) {
    console.error('Update wastage entry error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// ==================== WASTAGE PHOTOS ====================

// Add wastage photo
const addWastagePhoto = async (req, res) => {
  try {
    const { wastageId } = req.params;
    const photoData = {
      ...req.body,
      uploaded_by: req.user.id
    };
    
    const photo = await WastageManagement.addWastagePhoto(wastageId, photoData);
    res.json({
      success: true,
      data: photo,
      message: 'Photo added successfully'
    });
  } catch (error) {
    console.error('Add wastage photo error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// ==================== WASTAGE DISPOSAL ====================

// Record disposal action
const recordDisposalAction = async (req, res) => {
  try {
    const { wastageId } = req.params;
    const disposalData = {
      ...req.body,
      disposed_by: req.user.id
    };
    
    const disposal = await WastageManagement.recordDisposalAction(wastageId, disposalData);
    res.json({
      success: true,
      data: disposal,
      message: 'Disposal action recorded successfully'
    });
  } catch (error) {
    console.error('Record disposal action error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update disposal status
const updateDisposalStatus = async (req, res) => {
  try {
    const { wastageId } = req.params;
    const disposal = await WastageManagement.updateDisposalStatus(wastageId, req.body);
    res.json({
      success: true,
      data: disposal,
      message: 'Disposal status updated successfully'
    });
  } catch (error) {
    console.error('Update disposal status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// ==================== WASTAGE RECOVERY ====================

// Record recovery action
const recordRecoveryAction = async (req, res) => {
  try {
    const { wastageId } = req.params;
    const recoveryData = {
      ...req.body,
      recovered_by: req.user.id
    };
    
    const recovery = await WastageManagement.recordRecoveryAction(wastageId, recoveryData);
    res.json({
      success: true,
      data: recovery,
      message: 'Recovery action recorded successfully'
    });
  } catch (error) {
    console.error('Record recovery action error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// ==================== WASTAGE ANALYTICS ====================

// Get wastage summary
const getWastageSummary = async (req, res) => {
  try {
    const { startDate, endDate, groupBy } = req.query;
    
    const summary = await WastageManagement.getWastageSummary(
      startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate || new Date().toISOString().split('T')[0],
      groupBy || 'month'
    );
    
    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Get wastage summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get wastage by category
const getWastageByCategory = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const wastageByCategory = await WastageManagement.getWastageByCategory(
      startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate || new Date().toISOString().split('T')[0]
    );
    
    res.json({
      success: true,
      data: wastageByCategory
    });
  } catch (error) {
    console.error('Get wastage by category error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get wastage by product
const getWastageByProduct = async (req, res) => {
  try {
    const { startDate, endDate, limit } = req.query;
    
    const wastageByProduct = await WastageManagement.getWastageByProduct(
      startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate || new Date().toISOString().split('T')[0],
      parseInt(limit) || 20
    );
    
    res.json({
      success: true,
      data: wastageByProduct
    });
  } catch (error) {
    console.error('Get wastage by product error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get wastage by location
const getWastageByLocation = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const wastageByLocation = await WastageManagement.getWastageByLocation(
      startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate || new Date().toISOString().split('T')[0]
    );
    
    res.json({
      success: true,
      data: wastageByLocation
    });
  } catch (error) {
    console.error('Get wastage by location error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// ==================== WASTAGE PATTERNS ====================

// Get wastage patterns
const getWastagePatterns = async (req, res) => {
  try {
    const { productId, locationId } = req.query;
    
    const patterns = await WastageManagement.getWastagePatterns(productId, locationId);
    res.json({
      success: true,
      data: patterns
    });
  } catch (error) {
    console.error('Get wastage patterns error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// ==================== WASTAGE ALERTS ====================

// Get wastage alerts
const getWastageAlerts = async (req, res) => {
  try {
    const { locationId, isRead } = req.query;
    const alerts = await WastageManagement.getWastageAlerts(locationId, isRead);
    
    res.json({
      success: true,
      data: alerts
    });
  } catch (error) {
    console.error('Get wastage alerts error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Check wastage alerts
const checkWastageAlerts = async (req, res) => {
  try {
    const alerts = await WastageManagement.checkWastageAlerts();
    res.json({
      success: true,
      data: alerts,
      message: `${alerts.length} wastage alerts created`
    });
  } catch (error) {
    console.error('Check wastage alerts error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// ==================== COMPREHENSIVE WASTAGE REPORTS ====================

// Get comprehensive wastage report
const getWastageReport = async (req, res) => {
  try {
    const { startDate, endDate, locationId, productId } = req.query;
    
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const end = endDate || new Date().toISOString().split('T')[0];
    
    const [summary, byCategory, byProduct, byLocation, patterns] = await Promise.all([
      WastageManagement.getWastageSummary(start, end, 'day'),
      WastageManagement.getWastageByCategory(start, end),
      WastageManagement.getWastageByProduct(start, end, 10),
      WastageManagement.getWastageByLocation(start, end),
      WastageManagement.getWastagePatterns(productId, locationId)
    ]);
    
    const report = {
      period: { startDate: start, endDate: end },
      summary: {
        totalEntries: summary.reduce((sum, item) => sum + parseInt(item.total_entries), 0),
        totalQuantity: summary.reduce((sum, item) => sum + parseInt(item.total_quantity), 0),
        totalValue: summary.reduce((sum, item) => sum + parseFloat(item.total_value), 0),
        totalNetLoss: summary.reduce((sum, item) => sum + parseFloat(item.total_net_loss), 0),
        avgWastageValue: summary.reduce((sum, item) => sum + parseFloat(item.avg_wastage_value), 0) / summary.length
      },
      byCategory,
      byProduct,
      byLocation,
      patterns,
      dailySummary: summary
    };
    
    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Get wastage report error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  // Wastage Categories & Types
  getWastageCategories,
  getWastageTypesByCategory,
  getAllWastageTypes,
  
  // Wastage Entries
  createWastageEntry,
  getWastageEntries,
  getWastageEntryById,
  updateWastageEntry,
  
  // Wastage Photos
  addWastagePhoto,
  
  // Wastage Disposal
  recordDisposalAction,
  updateDisposalStatus,
  
  // Wastage Recovery
  recordRecoveryAction,
  
  // Wastage Analytics
  getWastageSummary,
  getWastageByCategory,
  getWastageByProduct,
  getWastageByLocation,
  
  // Wastage Patterns
  getWastagePatterns,
  
  // Wastage Alerts
  getWastageAlerts,
  checkWastageAlerts,
  
  // Comprehensive Reports
  getWastageReport
};
