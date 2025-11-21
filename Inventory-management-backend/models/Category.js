const db = require('../config/database');

class Category {
  // Create a new category
  static async create(categoryData) {
    const { name, description, parent_id, is_active = true } = categoryData;
    
    const result = await db.query(
      `INSERT INTO categories (name, description, parent_id, is_active, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING *`,
      [name, description, parent_id, is_active]
    );
    return result.rows[0];
  }

  // Find all categories
  static async findAll() {
    const result = await db.query(`
      SELECT c.*, 
             parent.name as parent_name,
             COUNT(p.id) as product_count
      FROM categories c
      LEFT JOIN categories parent ON c.parent_id = parent.id
      LEFT JOIN products p ON c.id = p.category_id
      WHERE c.is_active = true
      GROUP BY c.id, parent.name
      ORDER BY c.name ASC
    `);
    return result.rows;
  }

  // Find category by ID
  static async findById(id) {
    const result = await db.query(`
      SELECT c.*, parent.name as parent_name
      FROM categories c
      LEFT JOIN categories parent ON c.parent_id = parent.id
      WHERE c.id = $1
    `, [id]);
    return result.rows[0];
  }

  // Update category
  static async update(id, categoryData) {
    const { name, description, parent_id, is_active } = categoryData;
    
    const result = await db.query(
      `UPDATE categories 
       SET name = $1, description = $2, parent_id = $3, is_active = $4, updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [name, description, parent_id, is_active, id]
    );
    return result.rows[0];
  }

  // Delete category
  static async delete(id) {
    // Check if category has products
    const productCheck = await db.query(
      'SELECT COUNT(*) as count FROM products WHERE category_id = $1',
      [id]
    );
    
    if (parseInt(productCheck.rows[0].count) > 0) {
      throw new Error('Cannot delete category with existing products');
    }
    
    // Check if category has subcategories
    const subcategoryCheck = await db.query(
      'SELECT COUNT(*) as count FROM categories WHERE parent_id = $1',
      [id]
    );
    
    if (parseInt(subcategoryCheck.rows[0].count) > 0) {
      throw new Error('Cannot delete category with subcategories');
    }
    
    const result = await db.query(
      'DELETE FROM categories WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0];
  }

  // Get category hierarchy
  static async getHierarchy() {
    const result = await db.query(`
      WITH RECURSIVE category_tree AS (
        SELECT id, name, description, parent_id, 0 as level, 
               ARRAY[name] as path
        FROM categories 
        WHERE parent_id IS NULL AND is_active = true
        
        UNION ALL
        
        SELECT c.id, c.name, c.description, c.parent_id, ct.level + 1,
               ct.path || c.name
        FROM categories c
        JOIN category_tree ct ON c.parent_id = ct.id
        WHERE c.is_active = true
      )
      SELECT * FROM category_tree ORDER BY path
    `);
    return result.rows;
  }

  // Get subcategories
  static async getSubcategories(parentId) {
    const result = await db.query(`
      SELECT c.*, COUNT(p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id
      WHERE c.parent_id = $1 AND c.is_active = true
      GROUP BY c.id
      ORDER BY c.name ASC
    `, [parentId]);
    return result.rows;
  }

  // Get category statistics
  static async getStats() {
    const result = await db.query(`
      SELECT 
        COUNT(*) as total_categories,
        COUNT(CASE WHEN parent_id IS NULL THEN 1 END) as main_categories,
        COUNT(CASE WHEN parent_id IS NOT NULL THEN 1 END) as subcategories,
        COUNT(CASE WHEN is_active = true THEN 1 END) as active_categories
      FROM categories
    `);
    return result.rows[0];
  }

  // Search categories
  static async search(searchTerm) {
    const result = await db.query(`
      SELECT c.*, 
             parent.name as parent_name,
             COUNT(p.id) as product_count
      FROM categories c
      LEFT JOIN categories parent ON c.parent_id = parent.id
      LEFT JOIN products p ON c.id = p.category_id
      WHERE c.is_active = true 
        AND (c.name ILIKE $1 OR c.description ILIKE $1)
      GROUP BY c.id, parent.name
      ORDER BY c.name ASC
    `, [`%${searchTerm}%`]);
    return result.rows;
  }
}

module.exports = Category;
