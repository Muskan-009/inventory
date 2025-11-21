const db = require('../config/database');

class Product {
  // Create new product
  static async create(productData) {
    const { 
      name, sku, barcode, category, price, gst_rate, warranty_months, description,
      brand, series, size, thickness, grade, finish, unit_type, 
      price_per_sqft, price_per_cuft, cutting_option, wastage_percentage 
    } = productData;
    
    const result = await db.query(
      `INSERT INTO products (
        name, sku, barcode, category, price, gst_rate, warranty_months, description,
        brand, series, size, thickness, grade, finish, unit_type,
        price_per_sqft, price_per_cuft, cutting_option, wastage_percentage, created_at
      ) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, NOW()) 
       RETURNING *`,
      [
        name, sku, barcode, category, price, gst_rate || 0, warranty_months || 0, description,
        brand, series, size, thickness, grade, finish, unit_type || 'sheet',
        price_per_sqft, price_per_cuft, cutting_option || 'per_sheet', wastage_percentage || 0
      ]
    );
    
    // Initialize inventory for new product
    await db.query(
      'INSERT INTO inventory (product_id, stock_qty, updated_at) VALUES ($1, 0, NOW())',
      [result.rows[0].id]
    );
    
    // Create default unit entry
    await db.query(
      `INSERT INTO product_units (product_id, unit_type, conversion_factor, price) 
       VALUES ($1, $2, 1.0, $3)`,
      [result.rows[0].id, unit_type || 'sheet', price]
    );
    
    return result.rows[0];
  }

  // Find all products with inventory
  static async findAll() {
    const result = await db.query(
      `SELECT p.*, i.stock_qty 
       FROM products p
       LEFT JOIN inventory i ON p.id = i.product_id
       ORDER BY p.created_at DESC`
    );
    return result.rows;
  }

  // Find product by ID
  static async findById(id) {
    const result = await db.query(
      `SELECT p.*, i.stock_qty 
       FROM products p
       LEFT JOIN inventory i ON p.id = i.product_id
       WHERE p.id = $1`,
      [id]
    );
    return result.rows[0];
  }

  // Find product by SKU or barcode
  static async findByCode(code) {
    const result = await db.query(
      `SELECT p.*, i.stock_qty 
       FROM products p
       LEFT JOIN inventory i ON p.id = i.product_id
       WHERE p.sku = $1 OR p.barcode = $1`,
      [code]
    );
    return result.rows[0];
  }

  // Update product
  static async update(id, productData) {
    const { 
      name, sku, barcode, category, price, gst_rate, warranty_months, description,
      brand, series, size, thickness, grade, finish, unit_type, 
      price_per_sqft, price_per_cuft, cutting_option, wastage_percentage 
    } = productData;
    
    const result = await db.query(
      `UPDATE products 
       SET name = $1, sku = $2, barcode = $3, category = $4, price = $5, 
           gst_rate = $6, warranty_months = $7, description = $8,
           brand = $9, series = $10, size = $11, thickness = $12, grade = $13, 
           finish = $14, unit_type = $15, price_per_sqft = $16, price_per_cuft = $17,
           cutting_option = $18, wastage_percentage = $19, updated_at = NOW() 
       WHERE id = $20 
       RETURNING *`,
      [
        name, sku, barcode, category, price, gst_rate, warranty_months, description,
        brand, series, size, thickness, grade, finish, unit_type,
        price_per_sqft, price_per_cuft, cutting_option, wastage_percentage, id
      ]
    );
    
    return result.rows[0];
  }

  // Delete product
  static async delete(id) {
    // Delete inventory record first
    await db.query('DELETE FROM inventory WHERE product_id = $1', [id]);
    
    const result = await db.query('DELETE FROM products WHERE id = $1', [id]);
    return result.rowCount > 0;
  }

  // Get low stock products
  static async getLowStock(threshold = 10) {
    const result = await db.query(
      `SELECT p.*, i.stock_qty 
       FROM products p
       JOIN inventory i ON p.id = i.product_id
       WHERE i.stock_qty <= $1
       ORDER BY i.stock_qty ASC`,
      [threshold]
    );
    return result.rows;
  }

  // Search products
  static async search(searchTerm) {
    const result = await db.query(
      `SELECT p.*, i.stock_qty 
       FROM products p
       LEFT JOIN inventory i ON p.id = i.product_id
       WHERE p.name ILIKE $1 OR p.sku ILIKE $1 OR p.barcode ILIKE $1 OR p.category ILIKE $1
       ORDER BY p.created_at DESC`,
      [`%${searchTerm}%`]
    );
    return result.rows;
  }

  // Get products by category
  static async findByCategory(category) {
    const result = await db.query(
      `SELECT p.*, i.stock_qty 
       FROM products p
       LEFT JOIN inventory i ON p.id = i.product_id
       WHERE p.category = $1
       ORDER BY p.name ASC`,
      [category]
    );
    return result.rows;
  }

  // Get all brands
  static async getBrands() {
    const result = await db.query('SELECT * FROM brands ORDER BY name ASC');
    return result.rows;
  }

  // Get series by brand
  static async getSeriesByBrand(brandId) {
    const result = await db.query(
      'SELECT * FROM series WHERE brand_id = $1 ORDER BY name ASC',
      [brandId]
    );
    return result.rows;
  }

  // Add wastage entry
  static async addWastage(productId, wastageData) {
    const { original_size, cut_size, quantity, wastage_reason } = wastageData;
    
    const result = await db.query(
      `INSERT INTO product_wastage (product_id, original_size, cut_size, quantity, wastage_reason, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING *`,
      [productId, original_size, cut_size, quantity, wastage_reason]
    );
    
    return result.rows[0];
  }

  // Get wastage for a product
  static async getWastage(productId) {
    const result = await db.query(
      'SELECT * FROM product_wastage WHERE product_id = $1 ORDER BY created_at DESC',
      [productId]
    );
    return result.rows;
  }

  // Get product units
  static async getProductUnits(productId) {
    const result = await db.query(
      'SELECT * FROM product_units WHERE product_id = $1 ORDER BY is_primary DESC, unit_type ASC',
      [productId]
    );
    return result.rows;
  }

  // Add product unit
  static async addProductUnit(productId, unitData) {
    const { unit_type, conversion_factor, price, is_primary } = unitData;
    
    const result = await db.query(
      `INSERT INTO product_units (product_id, unit_type, conversion_factor, price, is_primary, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING *`,
      [productId, unit_type, conversion_factor, price, is_primary || false]
    );
    
    return result.rows[0];
  }

  // Get products by brand
  static async findByBrand(brand) {
    const result = await db.query(
      `SELECT p.*, i.stock_qty 
       FROM products p
       LEFT JOIN inventory i ON p.id = i.product_id
       WHERE p.brand = $1
       ORDER BY p.name ASC`,
      [brand]
    );
    return result.rows;
  }

  // Get products by grade
  static async findByGrade(grade) {
    const result = await db.query(
      `SELECT p.*, i.stock_qty 
       FROM products p
       LEFT JOIN inventory i ON p.id = i.product_id
       WHERE p.grade = $1
       ORDER BY p.name ASC`,
      [grade]
    );
    return result.rows;
  }

  // Get products by thickness
  static async findByThickness(thickness) {
    const result = await db.query(
      `SELECT p.*, i.stock_qty 
       FROM products p
       LEFT JOIN inventory i ON p.id = i.product_id
       WHERE p.thickness = $1
       ORDER BY p.name ASC`,
      [thickness]
    );
    return result.rows;
  }
}

module.exports = Product;
