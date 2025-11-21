const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'inventory_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
});

const createCategoriesSchema = async () => {
  try {
    console.log('🚀 Creating Categories table and related schema...\n');

    // Create categories table
    console.log('📁 Creating categories table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        parent_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create indexes for better performance
    console.log('🔍 Creating indexes...');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_categories_is_active ON categories(is_active)');

    // Insert some default categories for wood products
    console.log('📝 Inserting default categories...');
    
    // Main categories
    await pool.query(`
      INSERT INTO categories (name, description, parent_id, is_active) VALUES 
      ('Plywood', 'Various types of plywood sheets', NULL, true),
      ('Laminates', 'Decorative laminates and veneers', NULL, true),
      ('Particle Board', 'Particle board and MDF products', NULL, true),
      ('Hardware', 'Hardware items and fittings', NULL, true),
      ('Accessories', 'Tools and accessories', NULL, true)
      ON CONFLICT DO NOTHING
    `);

    // Get the inserted main categories
    const mainCategories = await pool.query(`
      SELECT id, name FROM categories WHERE parent_id IS NULL
    `);

    // Insert subcategories for each main category
    for (const mainCat of mainCategories.rows) {
      if (mainCat.name === 'Plywood') {
        await pool.query(`
          INSERT INTO categories (name, description, parent_id, is_active) VALUES 
          ('MR Grade', 'Moisture Resistant plywood', $1, true),
          ('BWR Grade', 'Boiling Water Resistant plywood', $1, true),
          ('Marine Grade', 'Marine grade plywood', $1, true),
          ('Commercial Grade', 'Commercial grade plywood', $1, true),
          ('Fire Retardant', 'Fire retardant plywood', $1, true)
          ON CONFLICT DO NOTHING
        `, [mainCat.id]);
      } else if (mainCat.name === 'Laminates') {
        await pool.query(`
          INSERT INTO categories (name, description, parent_id, is_active) VALUES 
          ('High Pressure Laminates', 'HPL sheets and panels', $1, true),
          ('Low Pressure Laminates', 'LPL sheets and panels', $1, true),
          ('Veneers', 'Wood veneers and finishes', $1, true),
          ('Edge Banding', 'Edge banding materials', $1, true)
          ON CONFLICT DO NOTHING
        `, [mainCat.id]);
      } else if (mainCat.name === 'Particle Board') {
        await pool.query(`
          INSERT INTO categories (name, description, parent_id, is_active) VALUES 
          ('MDF', 'Medium Density Fiberboard', $1, true),
          ('HDF', 'High Density Fiberboard', $1, true),
          ('Particle Board', 'Standard particle board', $1, true),
          ('OSB', 'Oriented Strand Board', $1, true)
          ON CONFLICT DO NOTHING
        `, [mainCat.id]);
      } else if (mainCat.name === 'Hardware') {
        await pool.query(`
          INSERT INTO categories (name, description, parent_id, is_active) VALUES 
          ('Screws & Nails', 'Screws, nails and fasteners', $1, true),
          ('Hinges', 'Door and cabinet hinges', $1, true),
          ('Handles', 'Door and drawer handles', $1, true),
          ('Locks', 'Locks and latches', $1, true),
          ('Brackets', 'Support brackets and fittings', $1, true)
          ON CONFLICT DO NOTHING
        `, [mainCat.id]);
      } else if (mainCat.name === 'Accessories') {
        await pool.query(`
          INSERT INTO categories (name, description, parent_id, is_active) VALUES 
          ('Tools', 'Cutting and measuring tools', $1, true),
          ('Adhesives', 'Glues and adhesives', $1, true),
          ('Finishes', 'Wood finishes and stains', $1, true),
          ('Safety Equipment', 'Safety gear and equipment', $1, true)
          ON CONFLICT DO NOTHING
        `, [mainCat.id]);
      }
    }

    // Update the products table to use category_id instead of category string
    console.log('🔄 Updating products table to reference categories...');
    
    // First, check if products table has category column
    const columnCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'products' AND column_name = 'category'
    `);

    if (columnCheck.rows.length > 0) {
      // Add category_id column if it doesn't exist
      await pool.query(`
        ALTER TABLE products 
        ADD COLUMN IF NOT EXISTS category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL
      `);

      // Update existing products to use category_id
      await pool.query(`
        UPDATE products 
        SET category_id = (
          SELECT id FROM categories 
          WHERE name = products.category 
          LIMIT 1
        )
        WHERE category_id IS NULL AND category IS NOT NULL
      `);

      console.log('✅ Updated existing products to use category references');
    }

    console.log('\n✅ Categories schema created successfully!');
    console.log('\n📋 Summary of categories created:');
    console.log('   • Main Categories: Plywood, Laminates, Particle Board, Hardware, Accessories');
    console.log('   • Subcategories for each main category');
    console.log('   • Proper foreign key relationships');
    console.log('   • Indexes for better performance');
    console.log('   • Default data for immediate use');
    
  } catch (error) {
    console.error('❌ Error creating categories schema:', error);
    throw error;
  } finally {
    await pool.end();
  }
};

// Run the setup
createCategoriesSchema()
  .then(() => {
    console.log('\n🎉 Categories setup completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Categories setup failed:', error);
    process.exit(1);
  });
