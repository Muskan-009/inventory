const db = require('../config/database');

class Returns {
  // Create return record
  static async createReturn(returnData) {
    const {
      original_transaction_id, customer_id, return_type, return_reason,
      return_date, total_amount, notes, created_by
    } = returnData;
    
    const result = await db.query(
      `INSERT INTO returns (
        original_transaction_id, customer_id, return_type, return_reason,
        return_date, total_amount, notes, created_by, created_at
      )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
       RETURNING *`,
      [
        original_transaction_id, customer_id, return_type, return_reason,
        return_date, total_amount, notes, created_by
      ]
    );
    return result.rows[0];
  }

  // Add return item
  static async addReturnItem(itemData) {
    const {
      return_id, product_id, original_quantity, returned_quantity,
      unit_price, reason, condition
    } = itemData;
    
    const result = await db.query(
      `INSERT INTO return_items (
        return_id, product_id, original_quantity, returned_quantity,
        unit_price, reason, condition, created_at
      )
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       RETURNING *`,
      [
        return_id, product_id, original_quantity, returned_quantity,
        unit_price, reason, condition
      ]
    );
    return result.rows[0];
  }

  // Get all returns
  static async getAllReturns(filters = {}) {
    let query = `
      SELECT r.*, 
             c.name as customer_name, c.phone as customer_phone,
             pt.transaction_number as original_transaction_number,
             u.name as created_by_name
      FROM returns r
      LEFT JOIN customers c ON r.customer_id = c.id
      LEFT JOIN pos_transactions pt ON r.original_transaction_id = pt.id
      JOIN users u ON r.created_by = u.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 0;
    
    if (filters.customer_id) {
      paramCount++;
      query += ` AND r.customer_id = $${paramCount}`;
      params.push(filters.customer_id);
    }
    
    if (filters.return_type) {
      paramCount++;
      query += ` AND r.return_type = $${paramCount}`;
      params.push(filters.return_type);
    }
    
    if (filters.date_from) {
      paramCount++;
      query += ` AND DATE(r.return_date) >= $${paramCount}`;
      params.push(filters.date_from);
    }
    
    if (filters.date_to) {
      paramCount++;
      query += ` AND DATE(r.return_date) <= $${paramCount}`;
      params.push(filters.date_to);
    }
    
    query += ` ORDER BY r.return_date DESC`;
    
    const result = await db.query(query, params);
    return result.rows;
  }

  // Get return by ID with items
  static async getReturnById(returnId) {
    const returnResult = await db.query(`
      SELECT r.*, 
             c.name as customer_name, c.phone as customer_phone, c.email as customer_email,
             pt.transaction_number as original_transaction_number,
             u.name as created_by_name
      FROM returns r
      LEFT JOIN customers c ON r.customer_id = c.id
      LEFT JOIN pos_transactions pt ON r.original_transaction_id = pt.id
      JOIN users u ON r.created_by = u.id
      WHERE r.id = $1
    `, [returnId]);
    
    const itemsResult = await db.query(`
      SELECT ri.*, p.name as product_name, p.sku, p.category
      FROM return_items ri
      JOIN products p ON ri.product_id = p.id
      WHERE ri.return_id = $1
    `, [returnId]);
    
    return {
      return: returnResult.rows[0],
      items: itemsResult.rows
    };
  }

  // Update return status
  static async updateReturnStatus(returnId, status, notes = null) {
    const result = await db.query(
      `UPDATE returns 
       SET status = $1, notes = COALESCE($2, notes), updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [status, notes, returnId]
    );
    return result.rows[0];
  }

  // Get return statistics
  static async getReturnStats(dateFrom = null, dateTo = null) {
    let query = `
      SELECT 
        COUNT(*) as total_returns,
        SUM(total_amount) as total_return_amount,
        COUNT(CASE WHEN return_type = 'refund' THEN 1 END) as refund_count,
        COUNT(CASE WHEN return_type = 'exchange' THEN 1 END) as exchange_count,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_returns,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_returns,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_returns
      FROM returns
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 0;
    
    if (dateFrom) {
      paramCount++;
      query += ` AND DATE(return_date) >= $${paramCount}`;
      params.push(dateFrom);
    }
    
    if (dateTo) {
      paramCount++;
      query += ` AND DATE(return_date) <= $${paramCount}`;
      params.push(dateTo);
    }
    
    const result = await db.query(query, params);
    return result.rows[0];
  }

  // Get returns by product
  static async getReturnsByProduct(productId, dateFrom = null, dateTo = null) {
    let query = `
      SELECT ri.*, r.return_date, r.return_type, r.status,
             p.name as product_name, p.sku,
             c.name as customer_name
      FROM return_items ri
      JOIN returns r ON ri.return_id = r.id
      JOIN products p ON ri.product_id = p.id
      LEFT JOIN customers c ON r.customer_id = c.id
      WHERE ri.product_id = $1
    `;
    
    const params = [productId];
    let paramCount = 1;
    
    if (dateFrom) {
      paramCount++;
      query += ` AND DATE(r.return_date) >= $${paramCount}`;
      params.push(dateFrom);
    }
    
    if (dateTo) {
      paramCount++;
      query += ` AND DATE(r.return_date) <= $${paramCount}`;
      params.push(dateTo);
    }
    
    query += ` ORDER BY r.return_date DESC`;
    
    const result = await db.query(query, params);
    return result.rows;
  }

  // Get return reasons summary
  static async getReturnReasonsSummary() {
    const result = await db.query(`
      SELECT return_reason, COUNT(*) as count, SUM(total_amount) as total_amount
      FROM returns
      GROUP BY return_reason
      ORDER BY count DESC
    `);
    return result.rows;
  }
}

module.exports = Returns;
