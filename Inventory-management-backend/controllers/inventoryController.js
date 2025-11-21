const Inventory = require('../models/Inventory');

// Get all inventory
const getAllInventory = async (req, res) => {
  try {
    const inventory = await Inventory.findAll();
    
    res.json({
      success: true,
      data: inventory
    });
  } catch (error) {
    console.error('Get inventory error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get inventory by product ID
const getInventoryByProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const inventory = await Inventory.findByProduct(productId);
    
    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: 'Inventory record not found'
      });
    }

    res.json({
      success: true,
      data: inventory
    });
  } catch (error) {
    console.error('Get inventory by product error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get low stock items
const getLowStock = async (req, res) => {
  try {
    const { threshold = 10 } = req.query;
    const lowStockItems = await Inventory.getLowStock(parseInt(threshold));
    
    res.json({
      success: true,
      data: lowStockItems
    });
  } catch (error) {
    console.error('Get low stock error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get out of stock items
const getOutOfStock = async (req, res) => {
  try {
    const outOfStockItems = await Inventory.getOutOfStock();
    
    res.json({
      success: true,
      data: outOfStockItems
    });
  } catch (error) {
    console.error('Get out of stock error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get inventory statistics
const getInventoryStats = async (req, res) => {
  try {
    const stats = await Inventory.getStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get inventory stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get inventory movements
const getInventoryMovements = async (req, res) => {
  try {
    const { productId } = req.params;
    const { limit = 50 } = req.query;
    
    const movements = await Inventory.getMovements(productId, parseInt(limit));
    
    res.json({
      success: true,
      data: movements
    });
  } catch (error) {
    console.error('Get inventory movements error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update stock quantity
const updateStock = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;
    
    if (typeof quantity !== 'number' || quantity < 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid quantity. Must be a non-negative number.'
      });
    }
    
    const inventory = await Inventory.updateStock(productId, quantity);
    
    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: 'Inventory record not found'
      });
    }

    res.json({
      success: true,
      message: 'Stock updated successfully',
      data: inventory
    });
  } catch (error) {
    console.error('Update stock error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Adjust stock (manual adjustment)
const adjustStock = async (req, res) => {
  try {
    const { productId } = req.params;
    const { adjustment, reason } = req.body;
    
    if (typeof adjustment !== 'number') {
      return res.status(400).json({
        success: false,
        message: 'Invalid adjustment. Must be a number.'
      });
    }
    
    const inventory = await Inventory.adjustStock(productId, adjustment, reason);
    
    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: 'Inventory record not found'
      });
    }

    res.json({
      success: true,
      message: 'Stock adjusted successfully',
      data: inventory
    });
  } catch (error) {
    console.error('Adjust stock error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  getAllInventory,
  getInventoryByProduct,
  getLowStock,
  getOutOfStock,
  getInventoryStats,
  getInventoryMovements,
  updateStock,
  adjustStock
};
