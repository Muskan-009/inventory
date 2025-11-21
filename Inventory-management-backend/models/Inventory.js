const db = require('../config/database');

class Inventory {
  // Get all inventory with product details
  static async findAll() {
    const result = await db.query(
      `SELECT i.*, p.name, p.sku, p.category, p.price
       FROM inventory i
       JOIN products p ON i.product_id = p.id
       ORDER BY p.name ASC`
    );
    return result.rows;
  }

  // Get inventory by product ID
  static async findByProduct(productId) {
    const result = await db.query(
      `SELECT i.*, p.name, p.sku, p.category, p.price
       FROM inventory i
       JOIN products p ON i.product_id = p.id
       WHERE i.product_id = $1`,
      [productId]
    );
    return result.rows[0];
  }

  // Update stock quantity
  static async updateStock(productId, quantity) {
    const result = await db.query(
      `UPDATE inventory 
       SET stock_qty = $1, updated_at = NOW() 
       WHERE product_id = $2 
       RETURNING *`,
      [quantity, productId]
    );
    return result.rows[0];
  }

  // Get low stock items
  static async getLowStock(threshold = 10) {
    const result = await db.query(
      `SELECT i.*, p.name, p.sku, p.category, p.price
       FROM inventory i
       JOIN products p ON i.product_id = p.id
       WHERE i.stock_qty <= $1
       ORDER BY i.stock_qty ASC`,
      [threshold]
    );
    return result.rows;
  }

  // Get out of stock items
  static async getOutOfStock() {
    const result = await db.query(
      `SELECT i.*, p.name, p.sku, p.category, p.price
       FROM inventory i
       JOIN products p ON i.product_id = p.id
       WHERE i.stock_qty = 0
       ORDER BY p.name ASC`
    );
    return result.rows;
  }

  // Get inventory value
  static async getTotalValue() {
    const result = await db.query(
      `SELECT SUM(i.stock_qty * p.price) as total_value
       FROM inventory i
       JOIN products p ON i.product_id = p.id`
    );
    return result.rows[0];
  }

  // Get inventory statistics
  static async getStats() {
    const result = await db.query(
      `SELECT 
         COUNT(*) as total_products,
         SUM(stock_qty) as total_stock,
         SUM(CASE WHEN stock_qty = 0 THEN 1 ELSE 0 END) as out_of_stock_count,
         SUM(CASE WHEN stock_qty <= 10 THEN 1 ELSE 0 END) as low_stock_count,
         SUM(stock_qty * p.price) as total_value
       FROM inventory i
       JOIN products p ON i.product_id = p.id`
    );
    return result.rows[0];
  }

  // Get inventory movements (for audit trail)
  static async getMovements(productId, limit = 50) {
    const result = await db.query(
      `(SELECT 'purchase' as type, p.qty as quantity, p.purchase_date as date, 
               v.name as reference, p.total as amount
        FROM purchases p
        JOIN vendors v ON p.vendor_id = v.id
        WHERE p.product_id = $1)
       UNION ALL
       (SELECT 'sale' as type, -s.qty as quantity, s.sale_date as date,
               COALESCE(c.name, 'Walk-in Customer') as reference, s.total as amount
        FROM sales s
        LEFT JOIN customers c ON s.customer_id = c.id
        WHERE s.product_id = $1)
       ORDER BY date DESC
       LIMIT $2`,
      [productId, limit]
    );
    return result.rows;
  }

  // Adjust stock (manual adjustment)
  static async adjustStock(productId, adjustment, reason = 'Manual adjustment') {
    const client = await db.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Update inventory
      const result = await client.query(
        `UPDATE inventory 
         SET stock_qty = stock_qty + $1, updated_at = NOW() 
         WHERE product_id = $2 
         RETURNING *`,
        [adjustment, productId]
      );
      
      // Log the adjustment (you might want to create a separate adjustments table)
      await client.query(
        `INSERT INTO inventory_adjustments (product_id, adjustment, reason, created_at)
         VALUES ($1, $2, $3, NOW())`,
        [productId, adjustment, reason]
      );
      
      await client.query('COMMIT');
      return result.rows[0];
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = Inventory;
