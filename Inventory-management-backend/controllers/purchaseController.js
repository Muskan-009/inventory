const Purchase = require('../models/Purchase');

// Get all purchases
const getAllPurchases = async (req, res) => {
  try {
    const purchases = await Purchase.findAll();
    
    res.json({
      success: true,
      data: purchases
    });
  } catch (error) {
    console.error('Get purchases error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get purchase by ID
const getPurchaseById = async (req, res) => {
  try {
    const { id } = req.params;
    const purchase = await Purchase.findById(id);
    
    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: 'Purchase not found'
      });
    }

    res.json({
      success: true,
      data: purchase
    });
  } catch (error) {
    console.error('Get purchase error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Create new purchase
const createPurchase = async (req, res) => {
  try {
    const purchase = await Purchase.create(req.body);
    
    res.status(201).json({
      success: true,
      message: 'Purchase created successfully',
      data: purchase
    });
  } catch (error) {
    console.error('Create purchase error:', error);
    
    if (error.code === '23503') { // Foreign key constraint violation
      return res.status(400).json({
        success: false,
        message: 'Invalid vendor or product ID'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get purchases by vendor
const getPurchasesByVendor = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const purchases = await Purchase.findByVendor(vendorId);
    
    res.json({
      success: true,
      data: purchases
    });
  } catch (error) {
    console.error('Get purchases by vendor error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get purchases by product
const getPurchasesByProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const purchases = await Purchase.findByProduct(productId);
    
    res.json({
      success: true,
      data: purchases
    });
  } catch (error) {
    console.error('Get purchases by product error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get purchase statistics
const getPurchaseStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1);
    const end = endDate ? new Date(endDate) : new Date();
    
    const stats = await Purchase.getStats(start, end);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get purchase stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get monthly purchase trends
const getMonthlyTrends = async (req, res) => {
  try {
    const trends = await Purchase.getMonthlyTrends();
    
    res.json({
      success: true,
      data: trends
    });
  } catch (error) {
    console.error('Get monthly trends error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  getAllPurchases,
  getPurchaseById,
  createPurchase,
  getPurchasesByVendor,
  getPurchasesByProduct,
  getPurchaseStats,
  getMonthlyTrends
};
