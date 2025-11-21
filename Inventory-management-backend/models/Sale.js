const db = require('../config/database');
const moment = require('moment');

class Sale {
  // Create new sale
  static async create(saleData) {
    const { customer_id, product_id, qty, price, gst_applied, sale_date } = saleData;
    const date = sale_date || new Date();
    
    // Start transaction
    const client = await db.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Get product details for warranty calculation
      const productResult = await client.query(
        'SELECT warranty_months, gst_rate FROM products WHERE id = $1',
        [product_id]
      );
      
      if (productResult.rows.length === 0) {
        throw new Error('Product not found');
      }
      
      const product = productResult.rows[0];
      const warranty_end_date = product.warranty_months > 0 
        ? moment(date).add(product.warranty_months, 'months').toDate()
        : null;
      
      // Calculate total with GST if applicable
      let total = qty * price;
      if (gst_applied && product.gst_rate > 0) {
        total = total + (total * product.gst_rate / 100);
      }
      
      // Check inventory availability
      const inventoryResult = await client.query(
        'SELECT stock_qty FROM inventory WHERE product_id = $1',
        [product_id]
      );
      
      if (inventoryResult.rows.length === 0 || inventoryResult.rows[0].stock_qty < qty) {
        throw new Error('Insufficient stock');
      }
      
      // Insert sale record
      const saleResult = await client.query(
        `INSERT INTO sales (customer_id, product_id, qty, price, gst_applied, total, sale_date, warranty_end_date, created_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW()) 
         RETURNING *`,
        [customer_id, product_id, qty, price, gst_applied, total, date, warranty_end_date]
      );
      
      // Update inventory - reduce stock
      await client.query(
        `UPDATE inventory 
         SET stock_qty = stock_qty - $1, updated_at = NOW() 
         WHERE product_id = $2`,
        [qty, product_id]
      );
      
      await client.query('COMMIT');
      return saleResult.rows[0];
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Find all sales with details
  static async findAll() {
    const result = await db.query(
      `SELECT s.*, 
              COALESCE(c.name, 'Walk-in Customer') as customer_name,
              pr.name as product_name, pr.sku, pr.category
       FROM sales s
       LEFT JOIN customers c ON s.customer_id = c.id
       JOIN products pr ON s.product_id = pr.id
       ORDER BY s.sale_date DESC`
    );
    return result.rows;
  }

  // Find sale by ID with full details
  static async findById(id) {
    const result = await db.query(
      `SELECT s.*, 
              COALESCE(c.name, 'Walk-in Customer') as customer_name,
              c.contact as customer_contact, c.email as customer_email,
              c.gst_no as customer_gst_no, c.address as customer_address,
              pr.name as product_name, pr.sku, pr.category, pr.gst_rate,
              pr.warranty_months
       FROM sales s
       LEFT JOIN customers c ON s.customer_id = c.id
       JOIN products pr ON s.product_id = pr.id
       WHERE s.id = $1`,
      [id]
    );
    return result.rows[0];
  }

  // Get sales by customer
  static async findByCustomer(customerId) {
    const result = await db.query(
      `SELECT s.*, pr.name as product_name, pr.sku
       FROM sales s
       JOIN products pr ON s.product_id = pr.id
       WHERE s.customer_id = $1
       ORDER BY s.sale_date DESC`,
      [customerId]
    );
    return result.rows;
  }

  // Get sales by product
  static async findByProduct(productId) {
    const result = await db.query(
      `SELECT s.*, COALESCE(c.name, 'Walk-in Customer') as customer_name
       FROM sales s
       LEFT JOIN customers c ON s.customer_id = c.id
       WHERE s.product_id = $1
       ORDER BY s.sale_date DESC`,
      [productId]
    );
    return result.rows;
  }

  // Get sales statistics
  static async getStats(startDate, endDate) {
    const result = await db.query(
      `SELECT 
         COUNT(*) as total_sales,
         SUM(total) as total_amount,
         SUM(qty) as total_quantity,
         AVG(total) as average_amount,
         SUM(CASE WHEN gst_applied = true THEN total ELSE 0 END) as gst_sales,
         SUM(CASE WHEN gst_applied = false THEN total ELSE 0 END) as non_gst_sales
       FROM sales 
       WHERE sale_date BETWEEN $1 AND $2`,
      [startDate, endDate]
    );
    return result.rows[0];
  }

  // Get monthly sales trends
  static async getMonthlyTrends() {
    const result = await db.query(
      `SELECT 
         DATE_TRUNC('month', sale_date) as month,
         COUNT(*) as sale_count,
         SUM(total) as total_amount,
         SUM(CASE WHEN gst_applied = true THEN total ELSE 0 END) as gst_amount,
         SUM(CASE WHEN gst_applied = false THEN total ELSE 0 END) as non_gst_amount
       FROM sales 
       WHERE sale_date >= NOW() - INTERVAL '12 months'
       GROUP BY DATE_TRUNC('month', sale_date)
       ORDER BY month ASC`
    );
    return result.rows;
  }

  // Get GST vs Non-GST breakdown
  static async getGSTBreakdown() {
    const result = await db.query(
      `SELECT 
         gst_applied,
         COUNT(*) as count,
         SUM(total) as total_amount
       FROM sales 
       WHERE sale_date >= NOW() - INTERVAL '1 year'
       GROUP BY gst_applied`
    );
    return result.rows;
  }
}

module.exports = Sale;
