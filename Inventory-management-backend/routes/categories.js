const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { authenticateToken, authorize } = require('../middleware/auth');

// Get all categories
router.get('/', authenticateToken, categoryController.getAllCategories);

// Get category by ID
router.get('/:id', authenticateToken, categoryController.getCategoryById);

// Create new category
router.post('/', 
  authenticateToken, 
  authorize('admin', 'super_admin'), 
  categoryController.createCategory
);

// Update category
router.put('/:id', 
  authenticateToken, 
  authorize('admin', 'super_admin'), 
  categoryController.updateCategory
);

// Delete category
router.delete('/:id', 
  authenticateToken, 
  authorize('admin', 'super_admin'), 
  categoryController.deleteCategory
);

// Get category hierarchy
router.get('/hierarchy/all', authenticateToken, categoryController.getCategoryHierarchy);

// Get subcategories
router.get('/:parentId/subcategories', authenticateToken, categoryController.getSubcategories);

// Get category statistics
router.get('/stats/overview', authenticateToken, categoryController.getCategoryStats);

// Search categories
router.get('/search/query', authenticateToken, categoryController.searchCategories);

module.exports = router;
