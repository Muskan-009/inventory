const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const dashboardController = require('../controllers/dashboardController');

// @route   GET /api/dashboard/stats
// @desc    Get dashboard statistics
// @access  Private
router.get('/stats', authenticateToken, dashboardController.getStats);

// @route   GET /api/dashboard/charts
// @desc    Get chart data
// @access  Private
router.get('/charts', authenticateToken, dashboardController.getChartData);

module.exports = router;
