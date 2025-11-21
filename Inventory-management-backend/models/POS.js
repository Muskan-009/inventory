const db = require('../config/database');

class POS {
  // Create POS session
  static async createSession(sessionData) {
    const { session_number, user_id, location_id, opening_cash } = sessionData;
    
    const result = await db.query(
      `INSERT INTO pos_sessions (session_number, user_id, location_id, opening_cash, start_time)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING *`,
      [session_number, user_id, location_id, opening_cash || 0]
    );
    return result.rows[0];
  }

  // Close POS session
  static async closeSession(sessionId, closingData) {
    const { closing_cash, notes } = closingData;
    
    const result = await db.query(
      `UPDATE pos_sessions 
       SET end_time = NOW(), closing_cash = $1, status = 'closed', notes = $2, updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [closing_cash, notes, sessionId]
    );
    return result.rows[0];
  }

  // Get active session
  static async getActiveSession(userId) {
    const result = await db.query(
      `SELECT ps.*, u.name as user_name, l.name as location_name
       FROM pos_sessions ps
       JOIN users u ON ps.user_id = u.id
       JOIN locations l ON ps.location_id = l.id
       WHERE ps.user_id = $1 AND ps.status = 'active'
       ORDER BY ps.start_time DESC
       LIMIT 1`,
      [userId]
    );
    return result.rows[0];
  }

  // Create POS transaction
  static async createTransaction(transactionData) {
    const {
      transaction_number, session_id, customer_id, transaction_type,
      subtotal, discount_amount, tax_amount, total_amount, notes, created_by
    } = transactionData;
    
    const result = await db.query(
      `INSERT INTO pos_transactions (
        transaction_number, session_id, customer_id, transaction_type,
        subtotal, discount_amount, tax_amount, total_amount, notes, created_by, transaction_date
      )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
       RETURNING *`,
      [
        transaction_number, session_id, customer_id, transaction_type,
        subtotal, discount_amount, tax_amount, total_amount, notes, created_by
      ]
    );
    return result.rows[0];
  }

  // Add transaction item
  static async addTransactionItem(itemData) {
    const { transaction_id, product_id, quantity, unit_type, unit_price, discount_percentage } = itemData;
    
    const discountAmount = (quantity * unit_price * discount_percentage) / 100;
    const totalPrice = (quantity * unit_price) - discountAmount;
    
    const result = await db.query(
      `INSERT INTO pos_transaction_items (
        transaction_id, product_id, quantity, unit_type, unit_price, discount_percentage, total_price
      )
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [transaction_id, product_id, quantity, unit_type, unit_price, discount_percentage, totalPrice]
    );
    return result.rows[0];
  }

  // Get transaction with items
  static async getTransactionWithItems(transactionId) {
    const transactionResult = await db.query(`
      SELECT pt.*, c.name as customer_name, c.phone as customer_phone,
             ps.session_number, u.name as created_by_name
      FROM pos_transactions pt
      LEFT JOIN customers c ON pt.customer_id = c.id
      JOIN pos_sessions ps ON pt.session_id = ps.id
      JOIN users u ON pt.created_by = u.id
      WHERE pt.id = $1
    `, [transactionId]);
    
    const itemsResult = await db.query(`
      SELECT pti.*, p.name as product_name, p.sku, p.category
      FROM pos_transaction_items pti
      JOIN products p ON pti.product_id = p.id
      WHERE pti.transaction_id = $1
    `, [transactionId]);
    
    return {
      transaction: transactionResult.rows[0],
      items: itemsResult.rows
    };
  }

  // Get session transactions
  static async getSessionTransactions(sessionId) {
    const result = await db.query(`
      SELECT pt.*, c.name as customer_name
      FROM pos_transactions pt
      LEFT JOIN customers c ON pt.customer_id = c.id
      WHERE pt.session_id = $1
      ORDER BY pt.transaction_date DESC
    `, [sessionId]);
    return result.rows;
  }

  // Get session summary
  static async getSessionSummary(sessionId) {
    const result = await db.query(`
      SELECT 
        COUNT(pt.id) as total_transactions,
        SUM(pt.total_amount) as total_sales,
        SUM(pt.discount_amount) as total_discounts,
        SUM(pt.tax_amount) as total_tax,
        AVG(pt.total_amount) as average_transaction
      FROM pos_transactions pt
      WHERE pt.session_id = $1
    `, [sessionId]);
    return result.rows[0];
  }

  // Get daily sales report
  static async getDailySales(date) {
    const result = await db.query(`
      SELECT 
        COUNT(pt.id) as total_transactions,
        SUM(pt.total_amount) as total_sales,
        SUM(pt.discount_amount) as total_discounts,
        SUM(pt.tax_amount) as total_tax,
        COUNT(DISTINCT pt.session_id) as active_sessions
      FROM pos_transactions pt
      WHERE DATE(pt.transaction_date) = $1
    `, [date]);
    return result.rows[0];
  }

  // Get top selling products
  static async getTopSellingProducts(limit = 10, date = null) {
    let query = `
      SELECT p.name as product_name, p.sku,
             SUM(pti.quantity) as total_quantity,
             SUM(pti.total_price) as total_revenue,
             COUNT(DISTINCT pti.transaction_id) as transaction_count
      FROM pos_transaction_items pti
      JOIN products p ON pti.product_id = p.id
      JOIN pos_transactions pt ON pti.transaction_id = pt.id
    `;
    
    let params = [];
    if (date) {
      query += ` WHERE DATE(pt.transaction_date) = $1`;
      params.push(date);
    }
    
    query += ` GROUP BY p.id, p.name, p.sku ORDER BY total_quantity DESC LIMIT $${params.length + 1}`;
    params.push(limit);
    
    const result = await db.query(query, params);
    return result.rows;
  }

  // Get sales by payment mode
  static async getSalesByPaymentMode(date = null) {
    let query = `
      SELECT pm.name as payment_mode,
             COUNT(sp.id) as transaction_count,
             SUM(sp.amount) as total_amount
      FROM sales_payments sp
      JOIN payment_modes pm ON sp.payment_mode_id = pm.id
      JOIN pos_transactions pt ON sp.invoice_id = pt.id
    `;
    
    let params = [];
    if (date) {
      query += ` WHERE DATE(pt.transaction_date) = $1`;
      params.push(date);
    }
    
    query += ` GROUP BY pm.id, pm.name ORDER BY total_amount DESC`;
    
    const result = await db.query(query, params);
    return result.rows;
  }

  // Generate transaction number
  static async generateTransactionNumber() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    
    const result = await db.query(
      `SELECT COUNT(*) as count FROM pos_transactions WHERE DATE(transaction_date) = CURRENT_DATE`
    );
    
    const count = parseInt(result.rows[0].count) + 1;
    return `POS${year}${month}${day}${String(count).padStart(4, '0')}`;
  }

  // Generate session number
  static async generateSessionNumber() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    
    const result = await db.query(
      `SELECT COUNT(*) as count FROM pos_sessions WHERE DATE(start_time) = CURRENT_DATE`
    );
    
    const count = parseInt(result.rows[0].count) + 1;
    return `SES${year}${month}${day}${String(count).padStart(4, '0')}`;
  }

  // Get POS dashboard data
  static async getDashboardData() {
    const today = new Date().toISOString().split('T')[0];
    
    const [dailySales, topProducts, paymentModes, activeSessions] = await Promise.all([
      this.getDailySales(today),
      this.getTopSellingProducts(5, today),
      this.getSalesByPaymentMode(today),
      db.query(`
        SELECT COUNT(*) as count 
        FROM pos_sessions 
        WHERE status = 'active' AND DATE(start_time) = CURRENT_DATE
      `)
    ]);
    
    return {
      dailySales,
      topProducts,
      paymentModes,
      activeSessions: parseInt(activeSessions.rows[0].count)
    };
  }
}

module.exports = POS;
