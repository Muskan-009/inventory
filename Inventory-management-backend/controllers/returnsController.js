const Returns = require('../models/Returns');

// Create return
const createReturn = async (req, res) => {
  try {
    const returnData = {
      ...req.body,
      created_by: req.user.id
    };
    
    const returnRecord = await Returns.createReturn(returnData);
    
    res.status(201).json({
      success: true,
      message: 'Return created successfully',
      data: returnRecord
    });
  } catch (error) {
    console.error('Error creating return:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating return',
      error: error.message
    });
  }
};

// Add return item
const addReturnItem = async (req, res) => {
  try {
    const { returnId } = req.params;
    const item = await Returns.addReturnItem({
      ...req.body,
      return_id: returnId
    });
    
    res.status(201).json({
      success: true,
      message: 'Return item added successfully',
      data: item
    });
  } catch (error) {
    console.error('Error adding return item:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding return item',
      error: error.message
    });
  }
};

// Get all returns
const getAllReturns = async (req, res) => {
  try {
    const filters = req.query;
    const returns = await Returns.getAllReturns(filters);
    
    res.json({
      success: true,
      data: returns
    });
  } catch (error) {
    console.error('Error fetching returns:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching returns',
      error: error.message
    });
  }
};

// Get return by ID
const getReturnById = async (req, res) => {
  try {
    const { id } = req.params;
    const returnData = await Returns.getReturnById(id);
    
    if (!returnData.return) {
      return res.status(404).json({
        success: false,
        message: 'Return not found'
      });
    }
    
    res.json({
      success: true,
      data: returnData
    });
  } catch (error) {
    console.error('Error fetching return:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching return',
      error: error.message
    });
  }
};

// Update return status
const updateReturnStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    
    const returnRecord = await Returns.updateReturnStatus(id, status, notes);
    
    if (!returnRecord) {
      return res.status(404).json({
        success: false,
        message: 'Return not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Return status updated successfully',
      data: returnRecord
    });
  } catch (error) {
    console.error('Error updating return status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating return status',
      error: error.message
    });
  }
};

// Get return statistics
const getReturnStats = async (req, res) => {
  try {
    const { date_from, date_to } = req.query;
    const stats = await Returns.getReturnStats(date_from, date_to);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching return stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching return stats',
      error: error.message
    });
  }
};

// Get returns by product
const getReturnsByProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const { date_from, date_to } = req.query;
    const returns = await Returns.getReturnsByProduct(productId, date_from, date_to);
    
    res.json({
      success: true,
      data: returns
    });
  } catch (error) {
    console.error('Error fetching returns by product:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching returns by product',
      error: error.message
    });
  }
};

// Get return reasons summary
const getReturnReasonsSummary = async (req, res) => {
  try {
    const summary = await Returns.getReturnReasonsSummary();
    
    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error fetching return reasons summary:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching return reasons summary',
      error: error.message
    });
  }
};

module.exports = {
  createReturn,
  addReturnItem,
  getAllReturns,
  getReturnById,
  updateReturnStatus,
  getReturnStats,
  getReturnsByProduct,
  getReturnReasonsSummary
};
