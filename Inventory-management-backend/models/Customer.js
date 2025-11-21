const db = require('../config/database');

class Customer {
  // Create new customer
  static async create(customerData) {
    const { name, contact, email, gst_no, address } = customerData;
    
    const result = await db.query(
      `INSERT INTO customers (name, contact, email, gst_no, address, created_at) 
       VALUES ($1, $2, $3, $4, $5, NOW()) 
       RETURNING *`,
      [name, contact, email, gst_no, address]
    );
    
    return result.rows[0];
  }

  // Find all customers
  static async findAll() {
    const result = await db.query(
      'SELECT * FROM customers ORDER BY created_at DESC'
    );
    return result.rows;
  }

  // Find customer by ID
  static async findById(id) {
    const result = await db.query(
      'SELECT * FROM customers WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  // Update customer
  static async update(id, customerData) {
    const { name, contact, email, gst_no, address } = customerData;
    
    const result = await db.query(
      `UPDATE customers 
       SET name = $1, contact = $2, email = $3, gst_no = $4, address = $5, updated_at = NOW() 
       WHERE id = $6 
       RETURNING *`,
      [name, contact, email, gst_no, address, id]
    );
    
    return result.rows[0];
  }

  // Delete customer
  static async delete(id) {
    const result = await db.query('DELETE FROM customers WHERE id = $1', [id]);
    return result.rowCount > 0;
  }

  // Get customer with sales statistics
  static async findWithStats(id) {
    const result = await db.query(
      `SELECT c.*, 
              COUNT(s.id) as total_sales,
              COALESCE(SUM(s.total), 0) as total_amount
       FROM customers c
       LEFT JOIN sales s ON c.id = s.customer_id
       WHERE c.id = $1
       GROUP BY c.id`,
      [id]
    );
    return result.rows[0];
  }

  // Search customers
  static async search(searchTerm) {
    const result = await db.query(
      `SELECT * FROM customers 
       WHERE name ILIKE $1 OR contact ILIKE $1 OR email ILIKE $1
       ORDER BY created_at DESC`,
      [`%${searchTerm}%`]
    );
    return result.rows;
  }
}

module.exports = Customer;
