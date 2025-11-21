const Category = require('../models/Category');

// Get all categories
const getAllCategories = async (req, res) => {
    try {
        const categories = await Category.findAll();
        res.json({
            success: true,
            data: categories
        });
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching categories',
            error: error.message
        });
    }
};

// Get category by ID
const getCategoryById = async (req, res) => {
    try {
        const { id } = req.params;
        const category = await Category.findById(id);

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        res.json({
            success: true,
            data: category
        });
    } catch (error) {
        console.error('Error fetching category:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching category',
            error: error.message
        });
    }
};

// Create new category
const createCategory = async (req, res) => {
    try {
        const category = await Category.create(req.body);
        res.status(201).json({
            success: true,
            message: 'Category created successfully',
            data: category
        });
    } catch (error) {
        console.error('Error creating category:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating category',
            error: error.message
        });
    }
};

// Update category
const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const category = await Category.update(id, req.body);

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        res.json({
            success: true,
            message: 'Category updated successfully',
            data: category
        });
    } catch (error) {
        console.error('Error updating category:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating category',
            error: error.message
        });
    }
};

// Delete category
const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const category = await Category.delete(id);

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        res.json({
            success: true,
            message: 'Category deleted successfully',
            data: category
        });
    } catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error deleting category'
        });
    }
};

// Get category hierarchy
const getCategoryHierarchy = async (req, res) => {
    try {
        const hierarchy = await Category.getHierarchy();
        res.json({
            success: true,
            data: hierarchy
        });
    } catch (error) {
        console.error('Error fetching category hierarchy:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching category hierarchy',
            error: error.message
        });
    }
};

// Get subcategories
const getSubcategories = async (req, res) => {
    try {
        const { parentId } = req.params;
        const subcategories = await Category.getSubcategories(parentId);
        res.json({
            success: true,
            data: subcategories
        });
    } catch (error) {
        console.error('Error fetching subcategories:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching subcategories',
            error: error.message
        });
    }
};

// Get category statistics
const getCategoryStats = async (req, res) => {
    try {
        const stats = await Category.getStats();
        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Error fetching category stats:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching category stats',
            error: error.message
        });
    }
};

// Search categories
const searchCategories = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) {
            return res.status(400).json({
                success: false,
                message: 'Search query is required'
            });
        }

        const categories = await Category.search(q);
        res.json({
            success: true,
            data: categories
        });
    } catch (error) {
        console.error('Error searching categories:', error);
        res.status(500).json({
            success: false,
            message: 'Error searching categories',
            error: error.message
        });
    }
};

module.exports = {
    getAllCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory,
    getCategoryHierarchy,
    getSubcategories,
    getCategoryStats,
    searchCategories
};
