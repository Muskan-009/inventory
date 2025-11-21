const Sale = require('../models/Sale');
const jsPDF = require('jspdf');
const moment = require('moment');

// Get all sales
const getAllSales = async (req, res) => {
  try {
    const sales = await Sale.findAll();
    
    res.json({
      success: true,
      data: sales
    });
  } catch (error) {
    console.error('Get sales error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get sale by ID
const getSaleById = async (req, res) => {
  try {
    const { id } = req.params;
    const sale = await Sale.findById(id);
    
    if (!sale) {
      return res.status(404).json({
        success: false,
        message: 'Sale not found'
      });
    }

    res.json({
      success: true,
      data: sale
    });
  } catch (error) {
    console.error('Get sale error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Create new sale
const createSale = async (req, res) => {
  try {
    const sale = await Sale.create(req.body);
    
    res.status(201).json({
      success: true,
      message: 'Sale created successfully',
      data: sale
    });
  } catch (error) {
    console.error('Create sale error:', error);
    
    if (error.message === 'Insufficient stock') {
      return res.status(400).json({
        success: false,
        message: 'Insufficient stock for this product'
      });
    }
    
    if (error.message === 'Product not found') {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    if (error.code === '23503') { // Foreign key constraint violation
      return res.status(400).json({
        success: false,
        message: 'Invalid customer or product ID'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get sales by customer
const getSalesByCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;
    const sales = await Sale.findByCustomer(customerId);
    
    res.json({
      success: true,
      data: sales
    });
  } catch (error) {
    console.error('Get sales by customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get sales by product
const getSalesByProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const sales = await Sale.findByProduct(productId);
    
    res.json({
      success: true,
      data: sales
    });
  } catch (error) {
    console.error('Get sales by product error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get sale statistics
const getSaleStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1);
    const end = endDate ? new Date(endDate) : new Date();
    
    const stats = await Sale.getStats(start, end);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get sale stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get monthly sale trends
const getMonthlyTrends = async (req, res) => {
  try {
    const trends = await Sale.getMonthlyTrends();
    
    res.json({
      success: true,
      data: trends
    });
  } catch (error) {
    console.error('Get monthly trends error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Generate PDF invoice
const generateInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const sale = await Sale.findById(id);
    
    if (!sale) {
      return res.status(404).json({
        success: false,
        message: 'Sale not found'
      });
    }

    // Create PDF
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text('INVOICE', 105, 20, { align: 'center' });
    
    // Company details (you can customize this)
    doc.setFontSize(12);
    doc.text('Inventory Management System', 20, 40);
    doc.text('123 Business Street', 20, 50);
    doc.text('City, State 12345', 20, 60);
    doc.text('Phone: (555) 123-4567', 20, 70);
    
    // Invoice details
    doc.text(`Invoice #: INV-${sale.id.toString().padStart(6, '0')}`, 120, 40);
    doc.text(`Date: ${moment(sale.sale_date).format('DD/MM/YYYY')}`, 120, 50);
    
    // Customer details
    doc.text('Bill To:', 20, 90);
    doc.text(sale.customer_name, 20, 100);
    if (sale.customer_contact) {
      doc.text(`Phone: ${sale.customer_contact}`, 20, 110);
    }
    if (sale.customer_email) {
      doc.text(`Email: ${sale.customer_email}`, 20, 120);
    }
    if (sale.customer_address) {
      doc.text(sale.customer_address, 20, 130);
    }
    
    // Table header
    const startY = 150;
    doc.line(20, startY, 190, startY);
    doc.text('Product', 25, startY + 10);
    doc.text('SKU', 80, startY + 10);
    doc.text('Qty', 110, startY + 10);
    doc.text('Price', 130, startY + 10);
    doc.text('Total', 160, startY + 10);
    doc.line(20, startY + 15, 190, startY + 15);
    
    // Product details
    const productY = startY + 25;
    doc.text(sale.product_name, 25, productY);
    doc.text(sale.sku, 80, productY);
    doc.text(sale.qty.toString(), 110, productY);
    doc.text(`₹${sale.price.toFixed(2)}`, 130, productY);
    doc.text(`₹${(sale.qty * sale.price).toFixed(2)}`, 160, productY);
    
    // Totals
    const totalsY = productY + 20;
    doc.line(20, totalsY, 190, totalsY);
    
    const subtotal = sale.qty * sale.price;
    doc.text('Subtotal:', 130, totalsY + 10);
    doc.text(`₹${subtotal.toFixed(2)}`, 160, totalsY + 10);
    
    if (sale.gst_applied && sale.gst_rate > 0) {
      const gstAmount = subtotal * sale.gst_rate / 100;
      doc.text(`GST (${sale.gst_rate}%):`, 130, totalsY + 20);
      doc.text(`₹${gstAmount.toFixed(2)}`, 160, totalsY + 20);
      
      doc.setFont(undefined, 'bold');
      doc.text('Total:', 130, totalsY + 35);
      doc.text(`₹${sale.total.toFixed(2)}`, 160, totalsY + 35);
    } else {
      doc.setFont(undefined, 'bold');
      doc.text('Total:', 130, totalsY + 20);
      doc.text(`₹${sale.total.toFixed(2)}`, 160, totalsY + 20);
    }
    
    // Warranty info
    if (sale.warranty_end_date) {
      doc.setFont(undefined, 'normal');
      doc.text('Warranty Information:', 20, totalsY + 50);
      doc.text(`Warranty valid until: ${moment(sale.warranty_end_date).format('DD/MM/YYYY')}`, 20, totalsY + 60);
    }
    
    // Footer
    doc.setFontSize(10);
    doc.text('Thank you for your business!', 105, 280, { align: 'center' });
    
    // Generate PDF buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${sale.id}.pdf`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    // Send PDF
    res.send(pdfBuffer);
    
  } catch (error) {
    console.error('Generate invoice error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  getAllSales,
  getSaleById,
  createSale,
  getSalesByCustomer,
  getSalesByProduct,
  getSaleStats,
  getMonthlyTrends,
  generateInvoice
};
