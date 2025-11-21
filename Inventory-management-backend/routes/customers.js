const express = require('express');
const router = express.Router();
const { validate, schemas } = require('../middleware/validation');
const { authenticateToken, authorize } = require('../middleware/auth');
const customerController = require('../controllers/customerController');

// @route   GET /api/customers
// @desc    Get all customers
// @access  Private
router.get('/', authenticateToken, customerController.getAllCustomers);

// @route   GET /api/customers/:id
// @desc    Get customer by ID
// @access  Private
router.get('/:id', authenticateToken, customerController.getCustomerById);

// @route   POST /api/customers
// @desc    Create new customer
// @access  Private
router.post('/', 
  authenticateToken, 
  validate(schemas.customer), 
  customerController.createCustomer
);

// @route   PUT /api/customers/:id
// @desc    Update customer
// @access  Private
router.put('/:id', 
  authenticateToken, 
  validate(schemas.customer), 
  customerController.updateCustomer
);

// @route   DELETE /api/customers/:id
// @desc    Delete customer
// @access  Private (Admin and Super Admin only)
router.delete('/:id', 
  authenticateToken, 
  authorize('admin', 'super_admin'), 
  customerController.deleteCustomer
);

module.exports = router;
