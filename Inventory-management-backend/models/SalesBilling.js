const db = require('../config/database');

class SalesBilling {
  // Customer Types Management
  static async createCustomerType(customerTypeData) {
    const { name, description, discount_percentage, credit_limit, credit_days } = customerTypeData;
    
    const result = await db.query(
      `INSERT INTO customer_types (name, description, discount_percentage, credit_limit, credit_days)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, description, discount_percentage || 0, credit_limit || 0, credit_days || 0]
    );
    return result.rows[0];
  }

  static async getAllCustomerTypes() {
    const result = await db.query('SELECT * FROM customer_types WHERE is_active = true ORDER BY name');
    return result.rows;
  }

  static async getCustomerTypeById(id) {
    const result = await db.query('SELECT * FROM customer_types WHERE id = $1', [id]);
    return result.rows[0];
  }

  static async updateCustomerType(id, customerTypeData) {
    const { name, description, discount_percentage, credit_limit, credit_days } = customerTypeData;
    
    const result = await db.query(
      `UPDATE customer_types 
       SET name = $1, description = $2, discount_percentage = $3, credit_limit = $4, credit_days = $5, updated_at = NOW()
       WHERE id = $6
       RETURNING *`,
      [name, description, discount_percentage, credit_limit, credit_days, id]
    );
    return result.rows[0];
  }

  // Pricing Tiers Management
  static async createPricingTier(pricingTierData) {
    const { name, description, markup_percentage } = pricingTierData;
    
    const result = await db.query(
      `INSERT INTO pricing_tiers (name, description, markup_percentage)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [name, description, markup_percentage || 0]
    );
    return result.rows[0];
  }

  static async getAllPricingTiers() {
    const result = await db.query('SELECT * FROM pricing_tiers WHERE is_active = true ORDER BY name');
    return result.rows;
  }

  static async getPricingTierById(id) {
    const result = await db.query('SELECT * FROM pricing_tiers WHERE id = $1', [id]);
    return result.rows[0];
  }

  // Product Pricing Management
  static async setProductPricing(productId, pricingTierId, price, minQuantity = 1, maxQuantity = null, effectiveFrom, effectiveTo = null) {
    const result = await db.query(
      `INSERT INTO product_pricing (product_id, pricing_tier_id, price, min_quantity, max_quantity, effective_from, effective_to)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [productId, pricingTierId, price, minQuantity, maxQuantity, effectiveFrom, effectiveTo]
    );
    return result.rows[0];
  }

  static async getProductPricing(productId, pricingTierId = null) {
    let query = `
      SELECT pp.*, pt.name as tier_name, p.name as product_name
      FROM product_pricing pp
      JOIN pricing_tiers pt ON pp.pricing_tier_id = pt.id
      JOIN products p ON pp.product_id = p.id
      WHERE pp.product_id = $1 AND pp.is_active = true
    `;
    let params = [productId];
    
    if (pricingTierId) {
      query += ' AND pp.pricing_tier_id = $2';
      params.push(pricingTierId);
    }
    
    query += ' ORDER BY pp.effective_from DESC';
    
    const result = await db.query(query, params);
    return result.rows;
  }

  // HSN Codes Management
  static async createHSNCode(hsnData) {
    const { code, description, gst_rate, cgst_rate, sgst_rate, igst_rate } = hsnData;
    
    const result = await db.query(
      `INSERT INTO hsn_codes (code, description, gst_rate, cgst_rate, sgst_rate, igst_rate)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [code, description, gst_rate, cgst_rate, sgst_rate, igst_rate]
    );
    return result.rows[0];
  }

  static async getAllHSNCodes() {
    const result = await db.query('SELECT * FROM hsn_codes WHERE is_active = true ORDER BY code');
    return result.rows;
  }

  static async getHSNCodeByCode(code) {
    const result = await db.query('SELECT * FROM hsn_codes WHERE code = $1', [code]);
    return result.rows[0];
  }

  // Product Bundles Management
  static async createProductBundle(bundleData) {
    const { name, description, bundle_code, total_price, discount_percentage } = bundleData;
    
    const result = await db.query(
      `INSERT INTO product_bundles (name, description, bundle_code, total_price, discount_percentage)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, description, bundle_code, total_price, discount_percentage || 0]
    );
    return result.rows[0];
  }

  static async addBundleItem(bundleId, productId, quantity, unitPrice) {
    const totalPrice = quantity * unitPrice;
    
    const result = await db.query(
      `INSERT INTO product_bundle_items (bundle_id, product_id, quantity, unit_price, total_price)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [bundleId, productId, quantity, unitPrice, totalPrice]
    );
    return result.rows[0];
  }

  static async getAllBundles() {
    const result = await db.query(`
      SELECT pb.*, 
             COUNT(pbi.id) as item_count,
             SUM(pbi.total_price) as calculated_total
      FROM product_bundles pb
      LEFT JOIN product_bundle_items pbi ON pb.id = pbi.bundle_id
      WHERE pb.is_active = true
      GROUP BY pb.id
      ORDER BY pb.name
    `);
    return result.rows;
  }

  static async getBundleWithItems(bundleId) {
    const bundleResult = await db.query('SELECT * FROM product_bundles WHERE id = $1', [bundleId]);
    const itemsResult = await db.query(`
      SELECT pbi.*, p.name as product_name, p.sku, p.category
      FROM product_bundle_items pbi
      JOIN products p ON pbi.product_id = p.id
      WHERE pbi.bundle_id = $1
    `, [bundleId]);
    
    return {
      bundle: bundleResult.rows[0],
      items: itemsResult.rows
    };
  }

  // Sales Orders Management
  static async createSalesOrder(orderData) {
    const {
      order_number, customer_id, customer_type_id, order_date, delivery_date,
      order_type, subtotal, discount_amount, discount_percentage, tax_amount,
      total_amount, notes, created_by
    } = orderData;
    
    const result = await db.query(
      `INSERT INTO sales_orders (
        order_number, customer_id, customer_type_id, order_date, delivery_date,
        order_type, subtotal, discount_amount, discount_percentage, tax_amount,
        total_amount, notes, created_by
      )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [
        order_number, customer_id, customer_type_id, order_date, delivery_date,
        order_type, subtotal, discount_amount, discount_percentage, tax_amount,
        total_amount, notes, created_by
      ]
    );
    return result.rows[0];
  }

  static async addOrderItem(orderId, productId, bundleId, quantity, unitType, unitPrice, discountPercentage, notes) {
    const discountAmount = (quantity * unitPrice * discountPercentage) / 100;
    const totalPrice = (quantity * unitPrice) - discountAmount;
    
    const result = await db.query(
      `INSERT INTO sales_order_items (
        order_id, product_id, bundle_id, quantity, unit_type, unit_price,
        discount_percentage, discount_amount, total_price, notes
      )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [orderId, productId, bundleId, quantity, unitType, unitPrice, discountPercentage, discountAmount, totalPrice, notes]
    );
    return result.rows[0];
  }

  static async getAllSalesOrders(filters = {}) {
    let query = `
      SELECT so.*, c.name as customer_name, ct.name as customer_type_name, u.name as created_by_name
      FROM sales_orders so
      LEFT JOIN customers c ON so.customer_id = c.id
      LEFT JOIN customer_types ct ON so.customer_type_id = ct.id
      LEFT JOIN users u ON so.created_by = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    if (filters.status) {
      paramCount++;
      query += ` AND so.status = $${paramCount}`;
      params.push(filters.status);
    }

    if (filters.order_type) {
      paramCount++;
      query += ` AND so.order_type = $${paramCount}`;
      params.push(filters.order_type);
    }

    if (filters.customer_id) {
      paramCount++;
      query += ` AND so.customer_id = $${paramCount}`;
      params.push(filters.customer_id);
    }

    if (filters.date_from) {
      paramCount++;
      query += ` AND so.order_date >= $${paramCount}`;
      params.push(filters.date_from);
    }

    if (filters.date_to) {
      paramCount++;
      query += ` AND so.order_date <= $${paramCount}`;
      params.push(filters.date_to);
    }

    query += ' ORDER BY so.order_date DESC, so.created_at DESC';

    const result = await db.query(query, params);
    return result.rows;
  }

  static async getSalesOrderWithItems(orderId) {
    const orderResult = await db.query(`
      SELECT so.*, c.name as customer_name, c.email as customer_email, c.phone as customer_phone,
             ct.name as customer_type_name, u.name as created_by_name
      FROM sales_orders so
      LEFT JOIN customers c ON so.customer_id = c.id
      LEFT JOIN customer_types ct ON so.customer_type_id = ct.id
      LEFT JOIN users u ON so.created_by = u.id
      WHERE so.id = $1
    `, [orderId]);
    
    const itemsResult = await db.query(`
      SELECT soi.*, p.name as product_name, p.sku, p.category,
             pb.name as bundle_name, pb.bundle_code
      FROM sales_order_items soi
      LEFT JOIN products p ON soi.product_id = p.id
      LEFT JOIN product_bundles pb ON soi.bundle_id = pb.id
      WHERE soi.order_id = $1
    `, [orderId]);
    
    return {
      order: orderResult.rows[0],
      items: itemsResult.rows
    };
  }

  static async updateOrderStatus(orderId, status, approvedBy = null) {
    const result = await db.query(
      `UPDATE sales_orders 
       SET status = $1, approved_by = $2, updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [status, approvedBy, orderId]
    );
    return result.rows[0];
  }

  // Sales Invoices Management
  static async createSalesInvoice(invoiceData) {
    const {
      invoice_number, order_id, customer_id, customer_type_id, invoice_date, due_date,
      billing_address, shipping_address, subtotal, discount_amount, tax_amount,
      total_amount, notes, terms_conditions, created_by
    } = invoiceData;
    
    const result = await db.query(
      `INSERT INTO sales_invoices (
        invoice_number, order_id, customer_id, customer_type_id, invoice_date, due_date,
        billing_address, shipping_address, subtotal, discount_amount, tax_amount,
        total_amount, notes, terms_conditions, created_by
      )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       RETURNING *`,
      [
        invoice_number, order_id, customer_id, customer_type_id, invoice_date, due_date,
        billing_address, shipping_address, subtotal, discount_amount, tax_amount,
        total_amount, notes, terms_conditions, created_by
      ]
    );
    return result.rows[0];
  }

  static async addInvoiceItem(invoiceId, productId, bundleId, hsnCode, quantity, unitType, unitPrice, discountPercentage, gstRate) {
    const discountAmount = (quantity * unitPrice * discountPercentage) / 100;
    const taxableAmount = (quantity * unitPrice) - discountAmount;
    const cgstAmount = (taxableAmount * gstRate) / 200; // GST/2 for CGST
    const sgstAmount = (taxableAmount * gstRate) / 200; // GST/2 for SGST
    const igstAmount = (taxableAmount * gstRate) / 100; // Full GST for IGST
    const totalAmount = taxableAmount + cgstAmount + sgstAmount + igstAmount;
    
    const result = await db.query(
      `INSERT INTO sales_invoice_items (
        invoice_id, product_id, bundle_id, hsn_code, quantity, unit_type, unit_price,
        discount_percentage, discount_amount, taxable_amount, gst_rate,
        cgst_amount, sgst_amount, igst_amount, total_amount
      )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       RETURNING *`,
      [
        invoiceId, productId, bundleId, hsnCode, quantity, unitType, unitPrice,
        discountPercentage, discountAmount, taxableAmount, gstRate,
        cgstAmount, sgstAmount, igstAmount, totalAmount
      ]
    );
    return result.rows[0];
  }

  static async getAllInvoices(filters = {}) {
    let query = `
      SELECT si.*, c.name as customer_name, ct.name as customer_type_name, u.name as created_by_name
      FROM sales_invoices si
      LEFT JOIN customers c ON si.customer_id = c.id
      LEFT JOIN customer_types ct ON si.customer_type_id = ct.id
      LEFT JOIN users u ON si.created_by = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    if (filters.payment_status) {
      paramCount++;
      query += ` AND si.payment_status = $${paramCount}`;
      params.push(filters.payment_status);
    }

    if (filters.invoice_status) {
      paramCount++;
      query += ` AND si.invoice_status = $${paramCount}`;
      params.push(filters.invoice_status);
    }

    if (filters.customer_id) {
      paramCount++;
      query += ` AND si.customer_id = $${paramCount}`;
      params.push(filters.customer_id);
    }

    if (filters.date_from) {
      paramCount++;
      query += ` AND si.invoice_date >= $${paramCount}`;
      params.push(filters.date_from);
    }

    if (filters.date_to) {
      paramCount++;
      query += ` AND si.invoice_date <= $${paramCount}`;
      params.push(filters.date_to);
    }

    query += ' ORDER BY si.invoice_date DESC, si.created_at DESC';

    const result = await db.query(query, params);
    return result.rows;
  }

  static async getInvoiceWithItems(invoiceId) {
    const invoiceResult = await db.query(`
      SELECT si.*, c.name as customer_name, c.email as customer_email, c.phone as customer_phone,
             ct.name as customer_type_name, u.name as created_by_name
      FROM sales_invoices si
      LEFT JOIN customers c ON si.customer_id = c.id
      LEFT JOIN customer_types ct ON si.customer_type_id = ct.id
      LEFT JOIN users u ON si.created_by = u.id
      WHERE si.id = $1
    `, [invoiceId]);
    
    const itemsResult = await db.query(`
      SELECT sii.*, p.name as product_name, p.sku, p.category,
             pb.name as bundle_name, pb.bundle_code
      FROM sales_invoice_items sii
      LEFT JOIN products p ON sii.product_id = p.id
      LEFT JOIN product_bundles pb ON sii.bundle_id = pb.id
      WHERE sii.invoice_id = $1
    `, [invoiceId]);
    
    return {
      invoice: invoiceResult.rows[0],
      items: itemsResult.rows
    };
  }

  // Payment Management
  static async createPaymentMode(paymentModeData) {
    const { name, description, is_online, processing_fee_percentage } = paymentModeData;
    
    const result = await db.query(
      `INSERT INTO payment_modes (name, description, is_online, processing_fee_percentage)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name, description, is_online || false, processing_fee_percentage || 0]
    );
    return result.rows[0];
  }

  static async getAllPaymentModes() {
    const result = await db.query('SELECT * FROM payment_modes WHERE is_active = true ORDER BY name');
    return result.rows;
  }

  static async recordPayment(invoiceId, paymentModeId, amount, paymentDate, transactionId, referenceNumber, notes, processedBy) {
    const result = await db.query(
      `INSERT INTO sales_payments (
        invoice_id, payment_mode_id, amount, payment_date, transaction_id, reference_number, notes, processed_by
      )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [invoiceId, paymentModeId, amount, paymentDate, transactionId, referenceNumber, notes, processedBy]
    );
    
    // Update invoice payment status
    await this.updateInvoicePaymentStatus(invoiceId);
    
    return result.rows[0];
  }

  static async updateInvoicePaymentStatus(invoiceId) {
    const paymentResult = await db.query(
      'SELECT SUM(amount) as total_paid FROM sales_payments WHERE invoice_id = $1',
      [invoiceId]
    );
    
    const totalPaid = parseFloat(paymentResult.rows[0].total_paid) || 0;
    
    const invoiceResult = await db.query(
      'SELECT total_amount FROM sales_invoices WHERE id = $1',
      [invoiceId]
    );
    
    const totalAmount = parseFloat(invoiceResult.rows[0].total_amount);
    
    let paymentStatus = 'pending';
    if (totalPaid >= totalAmount) {
      paymentStatus = 'paid';
    } else if (totalPaid > 0) {
      paymentStatus = 'partial';
    }
    
    await db.query(
      'UPDATE sales_invoices SET paid_amount = $1, payment_status = $2, updated_at = NOW() WHERE id = $3',
      [totalPaid, paymentStatus, invoiceId]
    );
  }

  static async getInvoicePayments(invoiceId) {
    const result = await db.query(`
      SELECT sp.*, pm.name as payment_mode_name, pm.is_online, u.name as processed_by_name
      FROM sales_payments sp
      JOIN payment_modes pm ON sp.payment_mode_id = pm.id
      LEFT JOIN users u ON sp.processed_by = u.id
      WHERE sp.invoice_id = $1
      ORDER BY sp.payment_date DESC
    `, [invoiceId]);
    return result.rows;
  }

  // Sales Returns Management
  static async createSalesReturn(returnData) {
    const {
      return_number, invoice_id, customer_id, return_date, return_reason,
      return_type, subtotal, tax_amount, total_amount, refund_amount, notes, created_by
    } = returnData;
    
    const result = await db.query(
      `INSERT INTO sales_returns (
        return_number, invoice_id, customer_id, return_date, return_reason,
        return_type, subtotal, tax_amount, total_amount, refund_amount, notes, created_by
      )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        return_number, invoice_id, customer_id, return_date, return_reason,
        return_type, subtotal, tax_amount, total_amount, refund_amount, notes, created_by
      ]
    );
    return result.rows[0];
  }

  static async addReturnItem(returnId, productId, originalInvoiceItemId, quantity, unitPrice, reason, conditionStatus) {
    const totalPrice = quantity * unitPrice;
    
    const result = await db.query(
      `INSERT INTO sales_return_items (
        return_id, product_id, original_invoice_item_id, quantity, unit_price, total_price, reason, condition_status
      )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [returnId, productId, originalInvoiceItemId, quantity, unitPrice, totalPrice, reason, conditionStatus]
    );
    return result.rows[0];
  }

  static async getAllReturns(filters = {}) {
    let query = `
      SELECT sr.*, c.name as customer_name, si.invoice_number, u.name as created_by_name
      FROM sales_returns sr
      LEFT JOIN customers c ON sr.customer_id = c.id
      LEFT JOIN sales_invoices si ON sr.invoice_id = si.id
      LEFT JOIN users u ON sr.created_by = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    if (filters.status) {
      paramCount++;
      query += ` AND sr.status = $${paramCount}`;
      params.push(filters.status);
    }

    if (filters.return_type) {
      paramCount++;
      query += ` AND sr.return_type = $${paramCount}`;
      params.push(filters.return_type);
    }

    if (filters.customer_id) {
      paramCount++;
      query += ` AND sr.customer_id = $${paramCount}`;
      params.push(filters.customer_id);
    }

    if (filters.date_from) {
      paramCount++;
      query += ` AND sr.return_date >= $${paramCount}`;
      params.push(filters.date_from);
    }

    if (filters.date_to) {
      paramCount++;
      query += ` AND sr.return_date <= $${paramCount}`;
      params.push(filters.date_to);
    }

    query += ' ORDER BY sr.return_date DESC, sr.created_at DESC';

    const result = await db.query(query, params);
    return result.rows;
  }

  // POS System Management
  static async createPOSSession(sessionData) {
    const { session_number, user_id, location_id, opening_cash } = sessionData;
    
    const result = await db.query(
      `INSERT INTO pos_sessions (session_number, user_id, location_id, opening_cash)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [session_number, user_id, location_id, opening_cash || 0]
    );
    return result.rows[0];
  }

  static async closePOSSession(sessionId, closingCash, notes) {
    const result = await db.query(
      `UPDATE pos_sessions 
       SET end_time = NOW(), closing_cash = $1, status = 'closed', notes = $2, updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [closingCash, notes, sessionId]
    );
    return result.rows[0];
  }

  static async createPOSTransaction(transactionData) {
    const {
      transaction_number, session_id, customer_id, transaction_type,
      subtotal, discount_amount, tax_amount, total_amount, notes, created_by
    } = transactionData;
    
    const result = await db.query(
      `INSERT INTO pos_transactions (
        transaction_number, session_id, customer_id, transaction_type,
        subtotal, discount_amount, tax_amount, total_amount, notes, created_by
      )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        transaction_number, session_id, customer_id, transaction_type,
        subtotal, discount_amount, tax_amount, total_amount, notes, created_by
      ]
    );
    return result.rows[0];
  }

  static async addPOSTransactionItem(transactionId, productId, quantity, unitType, unitPrice, discountPercentage) {
    const discountAmount = (quantity * unitPrice * discountPercentage) / 100;
    const totalPrice = (quantity * unitPrice) - discountAmount;
    
    const result = await db.query(
      `INSERT INTO pos_transaction_items (
        transaction_id, product_id, quantity, unit_type, unit_price, discount_percentage, total_price
      )
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [transactionId, productId, quantity, unitType, unitPrice, discountPercentage, totalPrice]
    );
    return result.rows[0];
  }

  // Measurement Units Management
  static async createMeasurementUnit(unitData) {
    const { name, symbol, type, conversion_factor } = unitData;
    
    const result = await db.query(
      `INSERT INTO measurement_units (name, symbol, type, conversion_factor)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name, symbol, type, conversion_factor || 1.0]
    );
    return result.rows[0];
  }

  static async getAllMeasurementUnits() {
    const result = await db.query('SELECT * FROM measurement_units WHERE is_active = true ORDER BY type, name');
    return result.rows;
  }

  // Utility Methods
  static async generateOrderNumber() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    
    const result = await db.query(
      `SELECT COUNT(*) as count FROM sales_orders WHERE DATE(created_at) = CURRENT_DATE`
    );
    
    const count = parseInt(result.rows[0].count) + 1;
    return `SO${year}${month}${day}${String(count).padStart(4, '0')}`;
  }

  static async generateInvoiceNumber() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    
    const result = await db.query(
      `SELECT COUNT(*) as count FROM sales_invoices WHERE DATE(created_at) = CURRENT_DATE`
    );
    
    const count = parseInt(result.rows[0].count) + 1;
    return `INV${year}${month}${day}${String(count).padStart(4, '0')}`;
  }

  static async generateReturnNumber() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    
    const result = await db.query(
      `SELECT COUNT(*) as count FROM sales_returns WHERE DATE(created_at) = CURRENT_DATE`
    );
    
    const count = parseInt(result.rows[0].count) + 1;
    return `RTN${year}${month}${day}${String(count).padStart(4, '0')}`;
  }

  static async generateSessionNumber() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    
    const result = await db.query(
      `SELECT COUNT(*) as count FROM pos_sessions WHERE DATE(created_at) = CURRENT_DATE`
    );
    
    const count = parseInt(result.rows[0].count) + 1;
    return `POS${year}${month}${day}${String(count).padStart(4, '0')}`;
  }

  static async generateTransactionNumber() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    
    const result = await db.query(
      `SELECT COUNT(*) as count FROM pos_transactions WHERE DATE(created_at) = CURRENT_DATE`
    );
    
    const count = parseInt(result.rows[0].count) + 1;
    return `TXN${year}${month}${day}${String(count).padStart(4, '0')}`;
  }
}

module.exports = SalesBilling;
