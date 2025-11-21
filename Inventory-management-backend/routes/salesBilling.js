const express = require('express');
const router = express.Router();
const salesBillingController = require('../controllers/salesBillingController');
const { authenticateToken, authorize } = require('../middleware/auth');

// Customer Types Routes
router.post('/customer-types',
  authenticateToken,
  authorize('admin', 'super_admin'),
  salesBillingController.createCustomerType
);

router.get('/customer-types',
  authenticateToken,
  salesBillingController.getAllCustomerTypes
);

router.get('/customer-types/:id',
  authenticateToken,
  salesBillingController.getCustomerTypeById
);

router.put('/customer-types/:id',
  authenticateToken,
  authorize('admin', 'super_admin'),
  salesBillingController.updateCustomerType
);

// Pricing Tiers Routes
router.post('/pricing-tiers',
  authenticateToken,
  authorize('admin', 'super_admin'),
  salesBillingController.createPricingTier
);

router.get('/pricing-tiers',
  authenticateToken,
  salesBillingController.getAllPricingTiers
);

// Product Pricing Routes
router.post('/products/:productId/pricing',
  authenticateToken,
  authorize('admin', 'super_admin'),
  salesBillingController.setProductPricing
);

router.get('/products/:productId/pricing',
  authenticateToken,
  salesBillingController.getProductPricing
);

// HSN Codes Routes
router.post('/hsn-codes',
  authenticateToken,
  authorize('admin', 'super_admin'),
  salesBillingController.createHSNCode
);

router.get('/hsn-codes',
  authenticateToken,
  salesBillingController.getAllHSNCodes
);

// Product Bundles Routes
router.post('/bundles',
  authenticateToken,
  authorize('admin', 'super_admin'),
  salesBillingController.createProductBundle
);

router.post('/bundles/:bundleId/items',
  authenticateToken,
  authorize('admin', 'super_admin'),
  salesBillingController.addBundleItem
);

router.get('/bundles',
  authenticateToken,
  salesBillingController.getAllBundles
);

router.get('/bundles/:bundleId',
  authenticateToken,
  salesBillingController.getBundleWithItems
);

// Sales Orders Routes
router.post('/orders',
  authenticateToken,
  salesBillingController.createSalesOrder
);

router.post('/orders/:orderId/items',
  authenticateToken,
  salesBillingController.addOrderItem
);

router.get('/orders',
  authenticateToken,
  salesBillingController.getAllSalesOrders
);

router.get('/orders/:orderId',
  authenticateToken,
  salesBillingController.getSalesOrderWithItems
);

router.put('/orders/:orderId/status',
  authenticateToken,
  authorize('admin', 'super_admin'),
  salesBillingController.updateOrderStatus
);

// Sales Invoices Routes
router.post('/invoices',
  authenticateToken,
  salesBillingController.createSalesInvoice
);

router.post('/invoices/:invoiceId/items',
  authenticateToken,
  salesBillingController.addInvoiceItem
);

router.get('/invoices',
  authenticateToken,
  salesBillingController.getAllInvoices
);

router.get('/invoices/:invoiceId',
  authenticateToken,
  salesBillingController.getInvoiceWithItems
);

// Payment Management Routes
router.post('/payment-modes',
  authenticateToken,
  authorize('admin', 'super_admin'),
  salesBillingController.createPaymentMode
);

router.get('/payment-modes',
  authenticateToken,
  salesBillingController.getAllPaymentModes
);

router.post('/invoices/:invoiceId/payments',
  authenticateToken,
  salesBillingController.recordPayment
);

router.get('/invoices/:invoiceId/payments',
  authenticateToken,
  salesBillingController.getInvoicePayments
);

// Sales Returns Routes
router.post('/returns',
  authenticateToken,
  salesBillingController.createSalesReturn
);

router.post('/returns/:returnId/items',
  authenticateToken,
  salesBillingController.addReturnItem
);

router.get('/returns',
  authenticateToken,
  salesBillingController.getAllReturns
);

// POS System Routes
router.post('/pos/sessions',
  authenticateToken,
  salesBillingController.createPOSSession
);

router.put('/pos/sessions/:sessionId/close',
  authenticateToken,
  salesBillingController.closePOSSession
);

router.post('/pos/transactions',
  authenticateToken,
  salesBillingController.createPOSTransaction
);

router.post('/pos/transactions/:transactionId/items',
  authenticateToken,
  salesBillingController.addPOSTransactionItem
);

// Measurement Units Routes
router.post('/measurement-units',
  authenticateToken,
  authorize('admin', 'super_admin'),
  salesBillingController.createMeasurementUnit
);

router.get('/measurement-units',
  authenticateToken,
  salesBillingController.getAllMeasurementUnits
);

module.exports = router;
