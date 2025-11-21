const SalesBilling = require('../models/SalesBilling');

// Customer Types Management
const createCustomerType = async (req, res) => {
  try {
    const customerType = await SalesBilling.createCustomerType(req.body);
    res.status(201).json({
      success: true,
      message: 'Customer type created successfully',
      data: customerType
    });
  } catch (error) {
    console.error('Error creating customer type:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating customer type',
      error: error.message
    });
  }
};

const getAllCustomerTypes = async (req, res) => {
  try {
    const customerTypes = await SalesBilling.getAllCustomerTypes();
    res.json({
      success: true,
      data: customerTypes
    });
  } catch (error) {
    console.error('Error fetching customer types:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching customer types',
      error: error.message
    });
  }
};

const getCustomerTypeById = async (req, res) => {
  try {
    const { id } = req.params;
    const customerType = await SalesBilling.getCustomerTypeById(id);
    
    if (!customerType) {
      return res.status(404).json({
        success: false,
        message: 'Customer type not found'
      });
    }
    
    res.json({
      success: true,
      data: customerType
    });
  } catch (error) {
    console.error('Error fetching customer type:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching customer type',
      error: error.message
    });
  }
};

const updateCustomerType = async (req, res) => {
  try {
    const { id } = req.params;
    const customerType = await SalesBilling.updateCustomerType(id, req.body);
    
    if (!customerType) {
      return res.status(404).json({
        success: false,
        message: 'Customer type not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Customer type updated successfully',
      data: customerType
    });
  } catch (error) {
    console.error('Error updating customer type:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating customer type',
      error: error.message
    });
  }
};

// Pricing Tiers Management
const createPricingTier = async (req, res) => {
  try {
    const pricingTier = await SalesBilling.createPricingTier(req.body);
    res.status(201).json({
      success: true,
      message: 'Pricing tier created successfully',
      data: pricingTier
    });
  } catch (error) {
    console.error('Error creating pricing tier:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating pricing tier',
      error: error.message
    });
  }
};

const getAllPricingTiers = async (req, res) => {
  try {
    const pricingTiers = await SalesBilling.getAllPricingTiers();
    res.json({
      success: true,
      data: pricingTiers
    });
  } catch (error) {
    console.error('Error fetching pricing tiers:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pricing tiers',
      error: error.message
    });
  }
};

// Product Pricing Management
const setProductPricing = async (req, res) => {
  try {
    const { productId } = req.params;
    const { pricingTierId, price, minQuantity, maxQuantity, effectiveFrom, effectiveTo } = req.body;
    
    const productPricing = await SalesBilling.setProductPricing(
      productId, pricingTierId, price, minQuantity, maxQuantity, effectiveFrom, effectiveTo
    );
    
    res.status(201).json({
      success: true,
      message: 'Product pricing set successfully',
      data: productPricing
    });
  } catch (error) {
    console.error('Error setting product pricing:', error);
    res.status(500).json({
      success: false,
      message: 'Error setting product pricing',
      error: error.message
    });
  }
};

const getProductPricing = async (req, res) => {
  try {
    const { productId } = req.params;
    const { pricingTierId } = req.query;
    
    const productPricing = await SalesBilling.getProductPricing(productId, pricingTierId);
    
    res.json({
      success: true,
      data: productPricing
    });
  } catch (error) {
    console.error('Error fetching product pricing:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching product pricing',
      error: error.message
    });
  }
};

// HSN Codes Management
const createHSNCode = async (req, res) => {
  try {
    const hsnCode = await SalesBilling.createHSNCode(req.body);
    res.status(201).json({
      success: true,
      message: 'HSN code created successfully',
      data: hsnCode
    });
  } catch (error) {
    console.error('Error creating HSN code:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating HSN code',
      error: error.message
    });
  }
};

const getAllHSNCodes = async (req, res) => {
  try {
    const hsnCodes = await SalesBilling.getAllHSNCodes();
    res.json({
      success: true,
      data: hsnCodes
    });
  } catch (error) {
    console.error('Error fetching HSN codes:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching HSN codes',
      error: error.message
    });
  }
};

// Product Bundles Management
const createProductBundle = async (req, res) => {
  try {
    const bundle = await SalesBilling.createProductBundle(req.body);
    res.status(201).json({
      success: true,
      message: 'Product bundle created successfully',
      data: bundle
    });
  } catch (error) {
    console.error('Error creating product bundle:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating product bundle',
      error: error.message
    });
  }
};

const addBundleItem = async (req, res) => {
  try {
    const { bundleId } = req.params;
    const { productId, quantity, unitPrice } = req.body;
    
    const bundleItem = await SalesBilling.addBundleItem(bundleId, productId, quantity, unitPrice);
    
    res.status(201).json({
      success: true,
      message: 'Bundle item added successfully',
      data: bundleItem
    });
  } catch (error) {
    console.error('Error adding bundle item:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding bundle item',
      error: error.message
    });
  }
};

const getAllBundles = async (req, res) => {
  try {
    const bundles = await SalesBilling.getAllBundles();
    res.json({
      success: true,
      data: bundles
    });
  } catch (error) {
    console.error('Error fetching bundles:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching bundles',
      error: error.message
    });
  }
};

const getBundleWithItems = async (req, res) => {
  try {
    const { bundleId } = req.params;
    const bundle = await SalesBilling.getBundleWithItems(bundleId);
    
    if (!bundle.bundle) {
      return res.status(404).json({
        success: false,
        message: 'Bundle not found'
      });
    }
    
    res.json({
      success: true,
      data: bundle
    });
  } catch (error) {
    console.error('Error fetching bundle:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching bundle',
      error: error.message
    });
  }
};

// Sales Orders Management
const createSalesOrder = async (req, res) => {
  try {
    const orderNumber = await SalesBilling.generateOrderNumber();
    const orderData = {
      ...req.body,
      order_number: orderNumber,
      created_by: req.user.id
    };
    
    const order = await SalesBilling.createSalesOrder(orderData);
    
    res.status(201).json({
      success: true,
      message: 'Sales order created successfully',
      data: order
    });
  } catch (error) {
    console.error('Error creating sales order:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating sales order',
      error: error.message
    });
  }
};

const addOrderItem = async (req, res) => {
  try {
    const { orderId } = req.params;
    const orderItem = await SalesBilling.addOrderItem(orderId, req.body);
    
    res.status(201).json({
      success: true,
      message: 'Order item added successfully',
      data: orderItem
    });
  } catch (error) {
    console.error('Error adding order item:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding order item',
      error: error.message
    });
  }
};

const getAllSalesOrders = async (req, res) => {
  try {
    const filters = req.query;
    const orders = await SalesBilling.getAllSalesOrders(filters);
    
    res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    console.error('Error fetching sales orders:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching sales orders',
      error: error.message
    });
  }
};

const getSalesOrderWithItems = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await SalesBilling.getSalesOrderWithItems(orderId);
    
    if (!order.order) {
      return res.status(404).json({
        success: false,
        message: 'Sales order not found'
      });
    }
    
    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Error fetching sales order:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching sales order',
      error: error.message
    });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    
    const order = await SalesBilling.updateOrderStatus(orderId, status, req.user.id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Sales order not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Order status updated successfully',
      data: order
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating order status',
      error: error.message
    });
  }
};

// Sales Invoices Management
const createSalesInvoice = async (req, res) => {
  try {
    const invoiceNumber = await SalesBilling.generateInvoiceNumber();
    const invoiceData = {
      ...req.body,
      invoice_number: invoiceNumber,
      created_by: req.user.id
    };
    
    const invoice = await SalesBilling.createSalesInvoice(invoiceData);
    
    res.status(201).json({
      success: true,
      message: 'Sales invoice created successfully',
      data: invoice
    });
  } catch (error) {
    console.error('Error creating sales invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating sales invoice',
      error: error.message
    });
  }
};

const addInvoiceItem = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const invoiceItem = await SalesBilling.addInvoiceItem(invoiceId, req.body);
    
    res.status(201).json({
      success: true,
      message: 'Invoice item added successfully',
      data: invoiceItem
    });
  } catch (error) {
    console.error('Error adding invoice item:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding invoice item',
      error: error.message
    });
  }
};

const getAllInvoices = async (req, res) => {
  try {
    const filters = req.query;
    const invoices = await SalesBilling.getAllInvoices(filters);
    
    res.json({
      success: true,
      data: invoices
    });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching invoices',
      error: error.message
    });
  }
};

const getInvoiceWithItems = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const invoice = await SalesBilling.getInvoiceWithItems(invoiceId);
    
    if (!invoice.invoice) {
      return res.status(404).json({
        success: false,
        message: 'Sales invoice not found'
      });
    }
    
    res.json({
      success: true,
      data: invoice
    });
  } catch (error) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching invoice',
      error: error.message
    });
  }
};

// Payment Management
const createPaymentMode = async (req, res) => {
  try {
    const paymentMode = await SalesBilling.createPaymentMode(req.body);
    res.status(201).json({
      success: true,
      message: 'Payment mode created successfully',
      data: paymentMode
    });
  } catch (error) {
    console.error('Error creating payment mode:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating payment mode',
      error: error.message
    });
  }
};

const getAllPaymentModes = async (req, res) => {
  try {
    const paymentModes = await SalesBilling.getAllPaymentModes();
    res.json({
      success: true,
      data: paymentModes
    });
  } catch (error) {
    console.error('Error fetching payment modes:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching payment modes',
      error: error.message
    });
  }
};

const recordPayment = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const paymentData = {
      ...req.body,
      processed_by: req.user.id
    };
    
    const payment = await SalesBilling.recordPayment(invoiceId, paymentData);
    
    res.status(201).json({
      success: true,
      message: 'Payment recorded successfully',
      data: payment
    });
  } catch (error) {
    console.error('Error recording payment:', error);
    res.status(500).json({
      success: false,
      message: 'Error recording payment',
      error: error.message
    });
  }
};

const getInvoicePayments = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const payments = await SalesBilling.getInvoicePayments(invoiceId);
    
    res.json({
      success: true,
      data: payments
    });
  } catch (error) {
    console.error('Error fetching invoice payments:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching invoice payments',
      error: error.message
    });
  }
};

// Sales Returns Management
const createSalesReturn = async (req, res) => {
  try {
    const returnNumber = await SalesBilling.generateReturnNumber();
    const returnData = {
      ...req.body,
      return_number: returnNumber,
      created_by: req.user.id
    };
    
    const salesReturn = await SalesBilling.createSalesReturn(returnData);
    
    res.status(201).json({
      success: true,
      message: 'Sales return created successfully',
      data: salesReturn
    });
  } catch (error) {
    console.error('Error creating sales return:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating sales return',
      error: error.message
    });
  }
};

const addReturnItem = async (req, res) => {
  try {
    const { returnId } = req.params;
    const returnItem = await SalesBilling.addReturnItem(returnId, req.body);
    
    res.status(201).json({
      success: true,
      message: 'Return item added successfully',
      data: returnItem
    });
  } catch (error) {
    console.error('Error adding return item:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding return item',
      error: error.message
    });
  }
};

const getAllReturns = async (req, res) => {
  try {
    const filters = req.query;
    const returns = await SalesBilling.getAllReturns(filters);
    
    res.json({
      success: true,
      data: returns
    });
  } catch (error) {
    console.error('Error fetching returns:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching returns',
      error: error.message
    });
  }
};

// POS System Management
const createPOSSession = async (req, res) => {
  try {
    const sessionNumber = await SalesBilling.generateSessionNumber();
    const sessionData = {
      ...req.body,
      session_number: sessionNumber,
      user_id: req.user.id
    };
    
    const session = await SalesBilling.createPOSSession(sessionData);
    
    res.status(201).json({
      success: true,
      message: 'POS session created successfully',
      data: session
    });
  } catch (error) {
    console.error('Error creating POS session:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating POS session',
      error: error.message
    });
  }
};

const closePOSSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { closing_cash, notes } = req.body;
    
    const session = await SalesBilling.closePOSSession(sessionId, closing_cash, notes);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'POS session not found'
      });
    }
    
    res.json({
      success: true,
      message: 'POS session closed successfully',
      data: session
    });
  } catch (error) {
    console.error('Error closing POS session:', error);
    res.status(500).json({
      success: false,
      message: 'Error closing POS session',
      error: error.message
    });
  }
};

const createPOSTransaction = async (req, res) => {
  try {
    const transactionNumber = await SalesBilling.generateTransactionNumber();
    const transactionData = {
      ...req.body,
      transaction_number: transactionNumber,
      created_by: req.user.id
    };
    
    const transaction = await SalesBilling.createPOSTransaction(transactionData);
    
    res.status(201).json({
      success: true,
      message: 'POS transaction created successfully',
      data: transaction
    });
  } catch (error) {
    console.error('Error creating POS transaction:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating POS transaction',
      error: error.message
    });
  }
};

const addPOSTransactionItem = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const transactionItem = await SalesBilling.addPOSTransactionItem(transactionId, req.body);
    
    res.status(201).json({
      success: true,
      message: 'Transaction item added successfully',
      data: transactionItem
    });
  } catch (error) {
    console.error('Error adding transaction item:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding transaction item',
      error: error.message
    });
  }
};

// Measurement Units Management
const createMeasurementUnit = async (req, res) => {
  try {
    const unit = await SalesBilling.createMeasurementUnit(req.body);
    res.status(201).json({
      success: true,
      message: 'Measurement unit created successfully',
      data: unit
    });
  } catch (error) {
    console.error('Error creating measurement unit:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating measurement unit',
      error: error.message
    });
  }
};

const getAllMeasurementUnits = async (req, res) => {
  try {
    const units = await SalesBilling.getAllMeasurementUnits();
    res.json({
      success: true,
      data: units
    });
  } catch (error) {
    console.error('Error fetching measurement units:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching measurement units',
      error: error.message
    });
  }
};

module.exports = {
  // Customer Types
  createCustomerType,
  getAllCustomerTypes,
  getCustomerTypeById,
  updateCustomerType,
  
  // Pricing Tiers
  createPricingTier,
  getAllPricingTiers,
  
  // Product Pricing
  setProductPricing,
  getProductPricing,
  
  // HSN Codes
  createHSNCode,
  getAllHSNCodes,
  
  // Product Bundles
  createProductBundle,
  addBundleItem,
  getAllBundles,
  getBundleWithItems,
  
  // Sales Orders
  createSalesOrder,
  addOrderItem,
  getAllSalesOrders,
  getSalesOrderWithItems,
  updateOrderStatus,
  
  // Sales Invoices
  createSalesInvoice,
  addInvoiceItem,
  getAllInvoices,
  getInvoiceWithItems,
  
  // Payment Management
  createPaymentMode,
  getAllPaymentModes,
  recordPayment,
  getInvoicePayments,
  
  // Sales Returns
  createSalesReturn,
  addReturnItem,
  getAllReturns,
  
  // POS System
  createPOSSession,
  closePOSSession,
  createPOSTransaction,
  addPOSTransactionItem,
  
  // Measurement Units
  createMeasurementUnit,
  getAllMeasurementUnits
};
