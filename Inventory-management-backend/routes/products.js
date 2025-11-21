const express = require('express');
const router = express.Router();
const { validate, schemas } = require('../middleware/validation');
const { authenticateToken, authorize } = require('../middleware/auth');
const productController = require('../controllers/productController');

// @route   GET /api/products
// @desc    Get all products
// @access  Private
router.get('/', authenticateToken, productController.getAllProducts);

// @route   GET /api/products/low-stock
// @desc    Get low stock products
// @access  Private
router.get('/low-stock', authenticateToken, productController.getLowStock);

// @route   GET /api/products/code/:code
// @desc    Get product by SKU or barcode
// @access  Private
router.get('/code/:code', authenticateToken, productController.getProductByCode);

// @route   GET /api/products/:id
// @desc    Get product by ID
// @access  Private
router.get('/:id', authenticateToken, productController.getProductById);

// @route   POST /api/products
// @desc    Create new product
// @access  Private (Admin and Super Admin only)
router.post('/', 
  authenticateToken, 
  authorize('admin', 'super_admin'), 
  validate(schemas.product), 
  productController.createProduct
);

// @route   PUT /api/products/:id
// @desc    Update product
// @access  Private (Admin and Super Admin only)
router.put('/:id', 
  authenticateToken, 
  authorize('admin', 'super_admin'), 
  validate(schemas.product), 
  productController.updateProduct
);

// @route   DELETE /api/products/:id
// @desc    Delete product
// @access  Private (Super Admin only)
router.delete('/:id', 
  authenticateToken, 
  authorize('super_admin'), 
  productController.deleteProduct
);

// @route   GET /api/products/brands/all
// @desc    Get all brands
// @access  Private
router.get('/brands/all', authenticateToken, productController.getBrands);

// @route   GET /api/products/brands/:brandId/series
// @desc    Get series by brand
// @access  Private
router.get('/brands/:brandId/series', authenticateToken, productController.getSeriesByBrand);

// @route   GET /api/products/brand/:brand
// @desc    Get products by brand
// @access  Private
router.get('/brand/:brand', authenticateToken, productController.getProductsByBrand);

// @route   GET /api/products/grade/:grade
// @desc    Get products by grade
// @access  Private
router.get('/grade/:grade', authenticateToken, productController.getProductsByGrade);

// @route   GET /api/products/thickness/:thickness
// @desc    Get products by thickness
// @access  Private
router.get('/thickness/:thickness', authenticateToken, productController.getProductsByThickness);

// @route   GET /api/products/:productId/wastage
// @desc    Get wastage for a product
// @access  Private
router.get('/:productId/wastage', authenticateToken, productController.getWastage);

// @route   POST /api/products/:productId/wastage
// @desc    Add wastage entry for a product
// @access  Private (Admin and Super Admin only)
router.post('/:productId/wastage', 
  authenticateToken, 
  authorize('admin', 'super_admin'), 
  productController.addWastage
);

// @route   GET /api/products/:productId/units
// @desc    Get product units
// @access  Private
router.get('/:productId/units', authenticateToken, productController.getProductUnits);

// @route   POST /api/products/:productId/units
// @desc    Add product unit
// @access  Private (Admin and Super Admin only)
router.post('/:productId/units', 
  authenticateToken, 
  authorize('admin', 'super_admin'), 
  productController.addProductUnit
);

module.exports = router;
