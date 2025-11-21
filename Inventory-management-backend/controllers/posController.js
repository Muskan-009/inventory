const POS = require('../models/POS');
const InvoiceService = require('../services/invoiceService');

// Create POS session
const createSession = async (req, res) => {
  try {
    const sessionNumber = await POS.generateSessionNumber();
    const sessionData = {
      ...req.body,
      session_number: sessionNumber,
      user_id: req.user.id
    };
    
    const session = await POS.createSession(sessionData);
    
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

// Close POS session
const closeSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await POS.closeSession(sessionId, req.body);
    
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

// Get active session
const getActiveSession = async (req, res) => {
  try {
    const session = await POS.getActiveSession(req.user.id);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'No active session found'
      });
    }
    
    res.json({
      success: true,
      data: session
    });
  } catch (error) {
    console.error('Error fetching active session:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching active session',
      error: error.message
    });
  }
};

// Create POS transaction
const createTransaction = async (req, res) => {
  try {
    const transactionNumber = await POS.generateTransactionNumber();
    const transactionData = {
      ...req.body,
      transaction_number: transactionNumber,
      created_by: req.user.id
    };
    
    const transaction = await POS.createTransaction(transactionData);
    
    res.status(201).json({
      success: true,
      message: 'Transaction created successfully',
      data: transaction
    });
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating transaction',
      error: error.message
    });
  }
};

// Add transaction item
const addTransactionItem = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const item = await POS.addTransactionItem({
      ...req.body,
      transaction_id: transactionId
    });
    
    res.status(201).json({
      success: true,
      message: 'Transaction item added successfully',
      data: item
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

// Get transaction with items
const getTransactionWithItems = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const transaction = await POS.getTransactionWithItems(transactionId);
    
    if (!transaction.transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }
    
    res.json({
      success: true,
      data: transaction
    });
  } catch (error) {
    console.error('Error fetching transaction:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching transaction',
      error: error.message
    });
  }
};

// Get session transactions
const getSessionTransactions = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const transactions = await POS.getSessionTransactions(sessionId);
    
    res.json({
      success: true,
      data: transactions
    });
  } catch (error) {
    console.error('Error fetching session transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching session transactions',
      error: error.message
    });
  }
};

// Get session summary
const getSessionSummary = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const summary = await POS.getSessionSummary(sessionId);
    
    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error fetching session summary:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching session summary',
      error: error.message
    });
  }
};

// Get daily sales
const getDailySales = async (req, res) => {
  try {
    const { date } = req.query;
    const sales = await POS.getDailySales(date || new Date().toISOString().split('T')[0]);
    
    res.json({
      success: true,
      data: sales
    });
  } catch (error) {
    console.error('Error fetching daily sales:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching daily sales',
      error: error.message
    });
  }
};

// Get top selling products
const getTopSellingProducts = async (req, res) => {
  try {
    const { limit = 10, date } = req.query;
    const products = await POS.getTopSellingProducts(parseInt(limit), date);
    
    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error('Error fetching top selling products:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching top selling products',
      error: error.message
    });
  }
};

// Get sales by payment mode
const getSalesByPaymentMode = async (req, res) => {
  try {
    const { date } = req.query;
    const sales = await POS.getSalesByPaymentMode(date);
    
    res.json({
      success: true,
      data: sales
    });
  } catch (error) {
    console.error('Error fetching sales by payment mode:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching sales by payment mode',
      error: error.message
    });
  }
};

// Get POS dashboard
const getDashboard = async (req, res) => {
  try {
    const dashboardData = await POS.getDashboardData();
    
    res.json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    console.error('Error fetching POS dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching POS dashboard',
      error: error.message
    });
  }
};

// Generate invoice PDF
const generateInvoice = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const transaction = await POS.getTransactionWithItems(transactionId);
    
    if (!transaction.transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    const pdfBuffer = await InvoiceService.generateInvoice(transaction);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${transaction.transaction.transaction_number}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generating invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating invoice',
      error: error.message
    });
  }
};

// Generate receipt PDF
const generateReceipt = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const transaction = await POS.getTransactionWithItems(transactionId);
    
    if (!transaction.transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    const pdfBuffer = await InvoiceService.generateReceipt(transaction);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="receipt-${transaction.transaction.transaction_number}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generating receipt:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating receipt',
      error: error.message
    });
  }
};

module.exports = {
  createSession,
  closeSession,
  getActiveSession,
  createTransaction,
  addTransactionItem,
  getTransactionWithItems,
  getSessionTransactions,
  getSessionSummary,
  getDailySales,
  getTopSellingProducts,
  getSalesByPaymentMode,
  getDashboard,
  generateInvoice,
  generateReceipt
};
