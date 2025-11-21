const express = require('express');
const router = express.Router();
const { validate, schemas } = require('../middleware/validation');
const { authenticateToken, authorize } = require('../middleware/auth');
const vendorController = require('../controllers/vendorController');

// @route   GET /api/vendors
// @desc    Get all vendors
// @access  Private
router.get('/', authenticateToken, vendorController.getAllVendors);

// @route   GET /api/vendors/:id
// @desc    Get vendor by ID
// @access  Private
router.get('/:id', authenticateToken, vendorController.getVendorById);

// @route   POST /api/vendors
// @desc    Create new vendor
// @access  Private (Admin and Super Admin only)
router.post('/', 
  authenticateToken, 
  authorize('admin', 'super_admin'), 
  validate(schemas.vendor), 
  vendorController.createVendor
);

// @route   PUT /api/vendors/:id
// @desc    Update vendor
// @access  Private (Admin and Super Admin only)
router.put('/:id', 
  authenticateToken, 
  authorize('admin', 'super_admin'), 
  validate(schemas.vendor), 
  vendorController.updateVendor
);

// @route   DELETE /api/vendors/:id
// @desc    Delete vendor
// @access  Private (Super Admin only)
router.delete('/:id', 
  authenticateToken, 
  authorize('super_admin'), 
  vendorController.deleteVendor
);

module.exports = router;
