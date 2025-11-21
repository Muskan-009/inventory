const express = require('express');
const router = express.Router();
const wastageController = require('../controllers/wastageController');
const { authenticateToken, authorize } = require('../middleware/auth');

// Wastage Records Routes
router.post('/records',
  authenticateToken,
  wastageController.createWastageEntry
);

router.get('/records',
  authenticateToken,
  wastageController.getWastageEntries
);

router.get('/records/:id',
  authenticateToken,
  wastageController.getWastageEntryById
);

router.put('/records/:id',
  authenticateToken,
  authorize('admin', 'super_admin'),
  wastageController.updateWastageEntry
);

// Wastage Categories Routes
router.get('/categories',
  authenticateToken,
  wastageController.getWastageCategories
);

router.get('/types',
  authenticateToken,
  wastageController.getAllWastageTypes
);

router.get('/types/:categoryId',
  authenticateToken,
  wastageController.getWastageTypesByCategory
);

// Wastage Reports Routes
router.get('/reports/summary',
  authenticateToken,
  wastageController.getWastageSummary
);

router.get('/reports/by-category',
  authenticateToken,
  wastageController.getWastageByCategory
);

router.get('/reports/by-product',
  authenticateToken,
  wastageController.getWastageByProduct
);

router.get('/reports/by-location',
  authenticateToken,
  wastageController.getWastageByLocation
);

// Wastage Disposal Routes
router.post('/disposal',
  authenticateToken,
  authorize('admin', 'super_admin'),
  wastageController.recordDisposalAction
);

router.put('/disposal/:id',
  authenticateToken,
  authorize('admin', 'super_admin'),
  wastageController.updateDisposalStatus
);

router.post('/recovery',
  authenticateToken,
  authorize('admin', 'super_admin'),
  wastageController.recordRecoveryAction
);

// Wastage Analytics Routes
router.get('/patterns',
  authenticateToken,
  wastageController.getWastagePatterns
);

router.get('/alerts',
  authenticateToken,
  wastageController.getWastageAlerts
);

router.get('/alerts/check',
  authenticateToken,
  wastageController.checkWastageAlerts
);

router.get('/report',
  authenticateToken,
  wastageController.getWastageReport
);

module.exports = router;
