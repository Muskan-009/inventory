const Product = require('../models/Product');

// Get all products
const getAllProducts = async (req, res) => {
  try {
    const { search, category } = req.query;
    
    let products;
    if (search) {
      products = await Product.search(search);
    } else if (category) {
      products = await Product.findByCategory(category);
    } else {
      products = await Product.findAll();
    }
    
    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get product by ID
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get product by SKU or barcode
const getProductByCode = async (req, res) => {
  try {
    const { code } = req.params;
    const product = await Product.findByCode(code);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Get product by code error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Create new product
const createProduct = async (req, res) => {
  try {
    const product = await Product.create(req.body);
    
    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });
  } catch (error) {
    console.error('Create product error:', error);
    
    if (error.code === '23505') { // Unique constraint violation
      return res.status(400).json({
        success: false,
        message: 'Product with this SKU already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update product
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.update(id, req.body);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: product
    });
  } catch (error) {
    console.error('Update product error:', error);
    
    if (error.code === '23505') { // Unique constraint violation
      return res.status(400).json({
        success: false,
        message: 'Product with this SKU already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Delete product
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Product.delete(id);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    
    if (error.code === '23503') { // Foreign key constraint violation
      return res.status(400).json({
        success: false,
        message: 'Cannot delete product with existing transactions'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get low stock products
const getLowStock = async (req, res) => {
  try {
    const { threshold = 10 } = req.query;
    const products = await Product.getLowStock(parseInt(threshold));
    
    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error('Get low stock error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get all brands
const getBrands = async (req, res) => {
  try {
    const brands = await Product.getBrands();
    res.json({
      success: true,
      data: brands
    });
  } catch (error) {
    console.error('Get brands error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get series by brand
const getSeriesByBrand = async (req, res) => {
  try {
    const { brandId } = req.params;
    const series = await Product.getSeriesByBrand(brandId);
    res.json({
      success: true,
      data: series
    });
  } catch (error) {
    console.error('Get series error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Add wastage entry
const addWastage = async (req, res) => {
  try {
    const { productId } = req.params;
    const wastageData = req.body;
    
    const wastage = await Product.addWastage(productId, wastageData);
    res.json({
      success: true,
      data: wastage,
      message: 'Wastage entry added successfully'
    });
  } catch (error) {
    console.error('Add wastage error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get wastage for a product
const getWastage = async (req, res) => {
  try {
    const { productId } = req.params;
    const wastage = await Product.getWastage(productId);
    res.json({
      success: true,
      data: wastage
    });
  } catch (error) {
    console.error('Get wastage error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get product units
const getProductUnits = async (req, res) => {
  try {
    const { productId } = req.params;
    const units = await Product.getProductUnits(productId);
    res.json({
      success: true,
      data: units
    });
  } catch (error) {
    console.error('Get product units error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Add product unit
const addProductUnit = async (req, res) => {
  try {
    const { productId } = req.params;
    const unitData = req.body;
    
    const unit = await Product.addProductUnit(productId, unitData);
    res.json({
      success: true,
      data: unit,
      message: 'Product unit added successfully'
    });
  } catch (error) {
    console.error('Add product unit error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get products by brand
const getProductsByBrand = async (req, res) => {
  try {
    const { brand } = req.params;
    const products = await Product.findByBrand(brand);
    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error('Get products by brand error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get products by grade
const getProductsByGrade = async (req, res) => {
  try {
    const { grade } = req.params;
    const products = await Product.findByGrade(grade);
    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error('Get products by grade error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get products by thickness
const getProductsByThickness = async (req, res) => {
  try {
    const { thickness } = req.params;
    const products = await Product.findByThickness(thickness);
    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error('Get products by thickness error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  getProductByCode,
  createProduct,
  updateProduct,
  deleteProduct,
  getLowStock,
  getBrands,
  getSeriesByBrand,
  addWastage,
  getWastage,
  getProductUnits,
  addProductUnit,
  getProductsByBrand,
  getProductsByGrade,
  getProductsByThickness
};
