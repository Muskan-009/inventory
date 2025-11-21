const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'inventory_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
});

const updateProductSchema = async () => {
  try {
    console.log('Updating product schema for wood products...');

    // Add new columns to products table
    await pool.query(`
      ALTER TABLE products 
      ADD COLUMN IF NOT EXISTS brand VARCHAR(100),
      ADD COLUMN IF NOT EXISTS series VARCHAR(100),
      ADD COLUMN IF NOT EXISTS size VARCHAR(50),
      ADD COLUMN IF NOT EXISTS thickness VARCHAR(20),
      ADD COLUMN IF NOT EXISTS grade VARCHAR(20),
      ADD COLUMN IF NOT EXISTS finish VARCHAR(50),
      ADD COLUMN IF NOT EXISTS unit_type VARCHAR(20) DEFAULT 'sheet',
      ADD COLUMN IF NOT EXISTS price_per_sqft DECIMAL(10,2),
      ADD COLUMN IF NOT EXISTS price_per_cuft DECIMAL(10,2),
      ADD COLUMN IF NOT EXISTS cutting_option VARCHAR(20) DEFAULT 'per_sheet',
      ADD COLUMN IF NOT EXISTS wastage_percentage DECIMAL(5,2) DEFAULT 0
    `);

    // Create brands table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS brands (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create series table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS series (
        id SERIAL PRIMARY KEY,
        brand_id INTEGER NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(brand_id, name)
      )
    `);

    // Create product_wastage table for tracking cut pieces
    await pool.query(`
      CREATE TABLE IF NOT EXISTS product_wastage (
        id SERIAL PRIMARY KEY,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        original_size VARCHAR(50) NOT NULL,
        cut_size VARCHAR(50) NOT NULL,
        quantity INTEGER NOT NULL,
        wastage_reason VARCHAR(100),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create product_units table for multi-unit handling
    await pool.query(`
      CREATE TABLE IF NOT EXISTS product_units (
        id SERIAL PRIMARY KEY,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        unit_type VARCHAR(20) NOT NULL,
        conversion_factor DECIMAL(10,4) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        is_primary BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Insert default brands
    await pool.query(`
      INSERT INTO brands (name, description) VALUES 
      ('Greenply', 'Premium plywood and wood products'),
      ('Century', 'Quality wood products and laminates'),
      ('Local Brand', 'Local manufacturer products')
      ON CONFLICT (name) DO NOTHING
    `);

    // Insert default series for Greenply
    await pool.query(`
      INSERT INTO series (brand_id, name, description) 
      SELECT b.id, 'Greenply MR', 'Moisture Resistant plywood'
      FROM brands b WHERE b.name = 'Greenply'
      ON CONFLICT (brand_id, name) DO NOTHING
    `);

    await pool.query(`
      INSERT INTO series (brand_id, name, description) 
      SELECT b.id, 'Greenply BWR', 'Boiling Water Resistant plywood'
      FROM brands b WHERE b.name = 'Greenply'
      ON CONFLICT (brand_id, name) DO NOTHING
    `);

    // Insert default series for Century
    await pool.query(`
      INSERT INTO series (brand_id, name, description) 
      SELECT b.id, 'Century Marine', 'Marine grade plywood'
      FROM brands b WHERE b.name = 'Century'
      ON CONFLICT (brand_id, name) DO NOTHING
    `);

    // Create indexes for better performance
    await pool.query('CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_products_series ON products(series)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_products_size ON products(size)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_products_thickness ON products(thickness)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_products_grade ON products(grade)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_product_wastage_product_id ON product_wastage(product_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_product_units_product_id ON product_units(product_id)');

    console.log('✅ Product schema updated successfully!');
    
  } catch (error) {
    console.error('❌ Error updating schema:', error);
    throw error;
  } finally {
    await pool.end();
  }
};

// Run the update
updateProductSchema()
  .then(() => {
    console.log('Product schema update completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Product schema update failed:', error);
    process.exit(1);
  });
