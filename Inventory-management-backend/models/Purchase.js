const db = require('../config/database');

class Purchase {
  // Create new purchase
  static async create(purchaseData) {
    const { vendor_id, product_id, qty, price, purchase_date } = purchaseData;
    const total = qty * price;
    const date = purchase_date || new Date();
    
    // Start transaction
    const client = await db.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Insert purchase record
      const purchaseResult = await client.query(
        `INSERT INTO purchases (vendor_id, product_id, qty, price, total, purchase_date, created_at) 
         VALUES ($1, $2, $3, $4, $5, $6, NOW()) 
         RETURNING *`,
        [vendor_id, product_id, qty, price, total, date]
      );
      
      // Update inventory - add stock
      await client.query(
        `UPDATE inventory 
         SET stock_qty = stock_qty + $1, updated_at = NOW() 
         WHERE product_id = $2`,
        [qty, product_id]
      );
      
      await client.query('COMMIT');
      return purchaseResult.rows[0];
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Find all purchases with details
  static async findAll() {
    const result = await db.query(
      `SELECT p.*, v.name as vendor_name, pr.name as product_name, pr.sku
       FROM purchases p
       JOIN vendors v ON p.vendor_id = v.id
       JOIN products pr ON p.product_id = pr.id
       ORDER BY p.purchase_date DESC`
    );
    return result.rows;
  }

  // Find purchase by ID
  static async findById(id) {
    const result = await db.query(
      `SELECT p.*, v.name as vendor_name, v.contact as vendor_contact,
              pr.name as product_name, pr.sku, pr.category
       FROM purchases p
       JOIN vendors v ON p.vendor_id = v.id
       JOIN products pr ON p.product_id = pr.id
       WHERE p.id = $1`,
      [id]
    );
    return result.rows[0];
  }

  // Get purchases by vendor
  static async findByVendor(vendorId) {
    const result = await db.query(
      `SELECT p.*, pr.name as product_name, pr.sku
       FROM purchases p
       JOIN products pr ON p.product_id = pr.id
       WHERE p.vendor_id = $1
       ORDER BY p.purchase_date DESC`,
      [vendorId]
    );
    return result.rows;
  }

  // Get purchases by product
  static async findByProduct(productId) {
    const result = await db.query(
      `SELECT p.*, v.name as vendor_name
       FROM purchases p
       JOIN vendors v ON p.vendor_id = v.id
       WHERE p.product_id = $1
       ORDER BY p.purchase_date DESC`,
      [productId]
    );
    return result.rows;
  }

  // Get purchase statistics
  static async getStats(startDate, endDate) {
    const result = await db.query(
      `SELECT 
         COUNT(*) as total_purchases,
         SUM(total) as total_amount,
         SUM(qty) as total_quantity,
         AVG(total) as average_amount
       FROM purchases 
       WHERE purchase_date BETWEEN $1 AND $2`,
      [startDate, endDate]
    );
    return result.rows[0];
  }

  // Get monthly purchase trends
  static async getMonthlyTrends() {
    const result = await db.query(
      `SELECT 
         DATE_TRUNC('month', purchase_date) as month,
         COUNT(*) as purchase_count,
         SUM(total) as total_amount
       FROM purchases 
       WHERE purchase_date >= NOW() - INTERVAL '12 months'
       GROUP BY DATE_TRUNC('month', purchase_date)
       ORDER BY month ASC`
    );
    return result.rows;
  }
}

module.exports = Purchase;
