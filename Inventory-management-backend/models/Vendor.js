const db = require('../config/database');

class Vendor {
  // Create new vendor
  static async create(vendorData) {
    const { name, contact, email, gst_no, address } = vendorData;
    
    const result = await db.query(
      `INSERT INTO vendors (name, contact, email, gst_no, address, created_at) 
       VALUES ($1, $2, $3, $4, $5, NOW()) 
       RETURNING *`,
      [name, contact, email, gst_no, address]
    );
    
    return result.rows[0];
  }

  // Find all vendors
  static async findAll() {
    const result = await db.query(
      'SELECT * FROM vendors ORDER BY created_at DESC'
    );
    return result.rows;
  }

  // Find vendor by ID
  static async findById(id) {
    const result = await db.query(
      'SELECT * FROM vendors WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  // Update vendor
  static async update(id, vendorData) {
    const { name, contact, email, gst_no, address } = vendorData;
    
    const result = await db.query(
      `UPDATE vendors 
       SET name = $1, contact = $2, email = $3, gst_no = $4, address = $5, updated_at = NOW() 
       WHERE id = $6 
       RETURNING *`,
      [name, contact, email, gst_no, address, id]
    );
    
    return result.rows[0];
  }

  // Delete vendor
  static async delete(id) {
    const result = await db.query('DELETE FROM vendors WHERE id = $1', [id]);
    return result.rowCount > 0;
  }

  // Get vendor with purchase statistics
  static async findWithStats(id) {
    const result = await db.query(
      `SELECT v.*, 
              COUNT(p.id) as total_purchases,
              COALESCE(SUM(p.total), 0) as total_amount
       FROM vendors v
       LEFT JOIN purchases p ON v.id = p.vendor_id
       WHERE v.id = $1
       GROUP BY v.id`,
      [id]
    );
    return result.rows[0];
  }
}

module.exports = Vendor;
