const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class InvoiceService {
  static generateInvoice(invoiceData) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const buffers = [];
        
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfData = Buffer.concat(buffers);
          resolve(pdfData);
        });

        // Header
        doc.fontSize(20).text('INVOICE', 50, 50);
        doc.fontSize(12).text(`Invoice #: ${invoiceData.invoice_number}`, 50, 80);
        doc.text(`Date: ${new Date(invoiceData.invoice_date).toLocaleDateString()}`, 50, 100);
        doc.text(`Due Date: ${new Date(invoiceData.due_date).toLocaleDateString()}`, 50, 120);

        // Company Info
        doc.fontSize(14).text('Your Company Name', 400, 50);
        doc.fontSize(10).text('123 Business Street', 400, 70);
        doc.text('City, State 12345', 400, 85);
        doc.text('Phone: +91-9876543210', 400, 100);
        doc.text('Email: info@company.com', 400, 115);

        // Customer Info
        doc.fontSize(12).text('Bill To:', 50, 160);
        doc.fontSize(10).text(invoiceData.customer_name || 'Walk-in Customer', 50, 180);
        if (invoiceData.customer_phone) {
          doc.text(`Phone: ${invoiceData.customer_phone}`, 50, 195);
        }
        if (invoiceData.customer_email) {
          doc.text(`Email: ${invoiceData.customer_email}`, 50, 210);
        }

        // Items Table Header
        const tableTop = 250;
        doc.fontSize(10);
        doc.text('Item', 50, tableTop);
        doc.text('Qty', 200, tableTop);
        doc.text('Rate', 250, tableTop);
        doc.text('Amount', 350, tableTop);
        doc.text('GST', 450, tableTop);

        // Draw line
        doc.moveTo(50, tableTop + 20).lineTo(550, tableTop + 20).stroke();

        // Items
        let currentY = tableTop + 30;
        invoiceData.items.forEach((item, index) => {
          doc.text(item.product_name || 'Product', 50, currentY);
          doc.text(item.quantity.toString(), 200, currentY);
          doc.text(`₹${item.unit_price}`, 250, currentY);
          doc.text(`₹${item.taxable_amount}`, 350, currentY);
          doc.text(`${item.gst_rate}%`, 450, currentY);
          currentY += 20;
        });

        // Totals
        const totalsY = currentY + 20;
        doc.text('Subtotal:', 350, totalsY);
        doc.text(`₹${invoiceData.subtotal}`, 450, totalsY);
        
        doc.text('GST:', 350, totalsY + 20);
        doc.text(`₹${invoiceData.tax_amount}`, 450, totalsY + 20);
        
        doc.fontSize(12).text('Total:', 350, totalsY + 40);
        doc.text(`₹${invoiceData.total_amount}`, 450, totalsY + 40);

        // Footer
        doc.fontSize(8).text('Thank you for your business!', 50, 700);
        doc.text('Terms: Payment due within 30 days', 50, 715);

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  static generateReceipt(transactionData) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ size: [300, 400], margin: 20 });
        const buffers = [];
        
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfData = Buffer.concat(buffers);
          resolve(pdfData);
        });

        // Header
        doc.fontSize(16).text('RECEIPT', { align: 'center' });
        doc.fontSize(10).text(`Transaction #: ${transactionData.transaction_number}`, { align: 'center' });
        doc.text(`Date: ${new Date(transactionData.transaction_date).toLocaleString()}`, { align: 'center' });

        // Items
        doc.moveDown();
        doc.fontSize(10);
        transactionData.items.forEach(item => {
          doc.text(`${item.product_name} x${item.quantity}`, { continued: true });
          doc.text(`₹${item.total_price}`, { align: 'right' });
        });

        // Totals
        doc.moveDown();
        doc.text('Subtotal:', { continued: true });
        doc.text(`₹${transactionData.subtotal}`, { align: 'right' });
        
        doc.text('GST:', { continued: true });
        doc.text(`₹${transactionData.tax_amount}`, { align: 'right' });
        
        doc.fontSize(12).text('Total:', { continued: true });
        doc.text(`₹${transactionData.total_amount}`, { align: 'right' });

        // Footer
        doc.moveDown(2);
        doc.fontSize(8).text('Thank you for your purchase!', { align: 'center' });

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
}

module.exports = InvoiceService;
