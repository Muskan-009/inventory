const db = require('../config/database');

class WastageManagement {
  // ==================== WASTAGE CATEGORIES ====================
  
  // Get all wastage categories
  static async getWastageCategories() {
    const result = await db.query(
      'SELECT * FROM wastage_categories WHERE is_active = true ORDER BY name ASC'
    );
    return result.rows;
  }

  // Get wastage category by ID
  static async getWastageCategoryById(id) {
    const result = await db.query(
      'SELECT * FROM wastage_categories WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  // Create wastage category
  static async createWastageCategory(categoryData) {
    const { name, description, disposal_method, environmental_impact } = categoryData;
    
    const result = await db.query(
      `INSERT INTO wastage_categories (name, description, disposal_method, environmental_impact)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name, description, disposal_method, environmental_impact]
    );
    return result.rows[0];
  }

  // ==================== WASTAGE RECORDS ====================
  
  // Create wastage record
  static async createWastageEntry(wastageData) {
    const {
      product_id, category_id, location_id, wastage_type, quantity, unit, cost_per_unit, reason, wastage_date
    } = wastageData;
    
    const total_cost = quantity * cost_per_unit;
    
    const result = await db.query(
      `INSERT INTO wastage_records (
        product_id, category_id, location_id, wastage_type, quantity, unit, cost_per_unit, total_cost, reason, wastage_date
      )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [product_id, category_id, location_id, wastage_type, quantity, unit, cost_per_unit, total_cost, reason, wastage_date]
    );
    return result.rows[0];
  }

  // Get wastage records
  static async getWastageEntries(filters = {}) {
    let query = `
      SELECT wr.*, 
             p.name as product_name, p.sku, p.brand, p.size, p.thickness, p.grade,
             wc.name as category_name
      FROM wastage_records wr
      JOIN products p ON wr.product_id = p.id
      JOIN wastage_categories wc ON wr.category_id = wc.id
      WHERE 1=1
    `;
    
    let params = [];
    let paramCount = 0;

    if (filters.productId) {
      paramCount++;
      query += ` AND wr.product_id = $${paramCount}`;
      params.push(filters.productId);
    }

    if (filters.categoryId) {
      paramCount++;
      query += ` AND wr.category_id = $${paramCount}`;
      params.push(filters.categoryId);
    }

    if (filters.locationId) {
      paramCount++;
      query += ` AND wr.location_id = $${paramCount}`;
      params.push(filters.locationId);
    }

    if (filters.startDate) {
      paramCount++;
      query += ` AND wr.wastage_date >= $${paramCount}`;
      params.push(filters.startDate);
    }

    if (filters.endDate) {
      paramCount++;
      query += ` AND wr.wastage_date <= $${paramCount}`;
      params.push(filters.endDate);
    }

    query += ' ORDER BY wr.wastage_date DESC, wr.created_at DESC';

    if (filters.limit) {
      paramCount++;
      query += ` LIMIT $${paramCount}`;
      params.push(filters.limit);
    }

    const result = await db.query(query, params);
    return result.rows;
  }

  // Get wastage record by ID
  static async getWastageEntryById(id) {
    const result = await db.query(`
      SELECT wr.*, 
             p.name as product_name, p.sku, p.brand, p.size, p.thickness, p.grade,
             wc.name as category_name
      FROM wastage_records wr
      JOIN products p ON wr.product_id = p.id
      JOIN wastage_categories wc ON wr.category_id = wc.id
      WHERE wr.id = $1
    `, [id]);
    return result.rows[0];
  }

  // Update wastage record
  static async updateWastageEntry(id, wastageData) {
    const {
      product_id, category_id, location_id, wastage_type, quantity, unit, cost_per_unit, reason, wastage_date
    } = wastageData;
    
    const total_cost = quantity * cost_per_unit;
    
    const result = await db.query(
      `UPDATE wastage_records 
       SET product_id = $1, category_id = $2, location_id = $3, wastage_type = $4, 
           quantity = $5, unit = $6, cost_per_unit = $7, total_cost = $8, 
           reason = $9, wastage_date = $10, updated_at = NOW()
       WHERE id = $11
       RETURNING *`,
      [product_id, category_id, location_id, wastage_type, quantity, unit, cost_per_unit, total_cost, reason, wastage_date, id]
    );
    return result.rows[0];
  }

  // Delete wastage record
  static async deleteWastageEntry(id) {
    const result = await db.query(
      'DELETE FROM wastage_records WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0];
  }

  // ==================== WASTAGE REPORTS ====================
  
  // Get wastage summary
  static async getWastageSummary() {
    const result = await db.query(`
      SELECT 
        COUNT(*) as total_records,
        SUM(total_cost) as total_cost,
        COUNT(DISTINCT product_id) as products_affected,
        COUNT(DISTINCT category_id) as categories_affected
      FROM wastage_records
    `);
    return result.rows[0];
  }

  // Get wastage by category
  static async getWastageByCategory(startDate = null, endDate = null) {
    let query = `
      SELECT wc.name as category_name, 
             COUNT(wr.id) as record_count,
             SUM(wr.total_cost) as total_cost,
             SUM(wr.quantity) as total_quantity
      FROM wastage_categories wc
      LEFT JOIN wastage_records wr ON wc.id = wr.category_id
    `;
    
    let params = [];
    let paramCount = 0;

    if (startDate && endDate) {
      paramCount++;
      query += ` WHERE wr.wastage_date >= $${paramCount}`;
      params.push(startDate);
      paramCount++;
      query += ` AND wr.wastage_date <= $${paramCount}`;
      params.push(endDate);
    }

    query += ` GROUP BY wc.id, wc.name ORDER BY total_cost DESC`;

    const result = await db.query(query, params);
    return result.rows;
  }

  // Get wastage by product
  static async getWastageByProduct(startDate = null, endDate = null, limit = 10) {
    let query = `
      SELECT p.name as product_name, p.sku,
             COUNT(wr.id) as record_count,
             SUM(wr.total_cost) as total_cost,
             SUM(wr.quantity) as total_quantity
      FROM products p
      JOIN wastage_records wr ON p.id = wr.product_id
    `;
    
    let params = [];
    let paramCount = 0;

    if (startDate && endDate) {
      paramCount++;
      query += ` WHERE wr.wastage_date >= $${paramCount}`;
      params.push(startDate);
      paramCount++;
      query += ` AND wr.wastage_date <= $${paramCount}`;
      params.push(endDate);
    }

    query += ` GROUP BY p.id, p.name, p.sku ORDER BY total_cost DESC LIMIT $${paramCount + 1}`;
    params.push(limit);

    const result = await db.query(query, params);
    return result.rows;
  }

  // Get wastage by location
  static async getWastageByLocation(startDate = null, endDate = null) {
    let query = `
      SELECT l.name as location_name, l.type as location_type,
             COUNT(wr.id) as record_count,
             SUM(wr.total_cost) as total_cost,
             SUM(wr.quantity) as total_quantity
      FROM locations l
      LEFT JOIN wastage_records wr ON l.id = wr.location_id
    `;
    
    let params = [];
    let paramCount = 0;

    if (startDate && endDate) {
      paramCount++;
      query += ` WHERE wr.wastage_date >= $${paramCount}`;
      params.push(startDate);
      paramCount++;
      query += ` AND wr.wastage_date <= $${paramCount}`;
      params.push(endDate);
    }

    query += ` GROUP BY l.id, l.name, l.type ORDER BY total_cost DESC`;

    const result = await db.query(query, params);
    return result.rows;
  }

  // ==================== WASTAGE DISPOSAL ====================
  
  // Record disposal action
  static async recordDisposalAction(disposalData) {
    const { wastage_record_id, disposal_method, disposal_date, disposal_cost, disposal_company, notes } = disposalData;
    
    const result = await db.query(
      `INSERT INTO wastage_disposal (
        wastage_record_id, disposal_method, disposal_date, disposal_cost, disposal_company, notes
      )
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [wastage_record_id, disposal_method, disposal_date, disposal_cost, disposal_company, notes]
    );
    return result.rows[0];
  }

  // Update disposal status
  static async updateDisposalStatus(id, status) {
    const result = await db.query(
      'UPDATE wastage_disposal SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [status, id]
    );
    return result.rows[0];
  }

  // ==================== UTILITY METHODS ====================
  
  // Get wastage patterns
  static async getWastagePatterns() {
    const result = await db.query(`
      SELECT 
        wastage_type,
        COUNT(*) as frequency,
        AVG(total_cost) as avg_cost,
        SUM(total_cost) as total_cost
      FROM wastage_records
      GROUP BY wastage_type
      ORDER BY frequency DESC
    `);
    return result.rows;
  }

  // Get wastage alerts
  static async getWastageAlerts() {
    const result = await db.query(`
      SELECT 
        p.name as product_name,
        COUNT(wr.id) as wastage_count,
        SUM(wr.total_cost) as total_cost
      FROM wastage_records wr
      JOIN products p ON wr.product_id = p.id
      WHERE wr.wastage_date >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY p.id, p.name
      HAVING COUNT(wr.id) > 3 OR SUM(wr.total_cost) > 10000
      ORDER BY total_cost DESC
    `);
    return result.rows;
  }

  // Check wastage alerts
  static async checkWastageAlerts() {
    const result = await db.query(`
      SELECT 
        COUNT(*) as high_frequency_products,
        SUM(total_cost) as high_cost_wastage
      FROM (
        SELECT 
          p.id,
          COUNT(wr.id) as wastage_count,
          SUM(wr.total_cost) as total_cost
        FROM wastage_records wr
        JOIN products p ON wr.product_id = p.id
        WHERE wr.wastage_date >= CURRENT_DATE - INTERVAL '7 days'
        GROUP BY p.id
        HAVING COUNT(wr.id) > 3 OR SUM(wr.total_cost) > 10000
      ) alerts
    `);
    return result.rows[0];
  }

  // Get comprehensive wastage report
  static async getWastageReport(startDate, endDate) {
    const [summary, byCategory, byProduct, byLocation, patterns] = await Promise.all([
      this.getWastageSummary(),
      this.getWastageByCategory(startDate, endDate),
      this.getWastageByProduct(startDate, endDate, 10),
      this.getWastageByLocation(startDate, endDate),
      this.getWastagePatterns()
    ]);

    return {
      summary,
      byCategory,
      byProduct,
      byLocation,
      patterns
    };
  }
}

module.exports = WastageManagement;