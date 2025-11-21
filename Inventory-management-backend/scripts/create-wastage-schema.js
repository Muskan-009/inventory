const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'inventory_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
});

const createWastageSchema = async () => {
  try {
    console.log('🗑️ Creating Wastage Management Schema...\n');

    // Create wastage_categories table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS wastage_categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create wastage_types table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS wastage_types (
        id SERIAL PRIMARY KEY,
        category_id INTEGER NOT NULL REFERENCES wastage_categories(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        default_disposal_method VARCHAR(50),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(category_id, name)
      )
    `);

    // Create wastage_entries table (main wastage tracking)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS wastage_entries (
        id SERIAL PRIMARY KEY,
        wastage_number VARCHAR(50) UNIQUE NOT NULL,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        batch_id INTEGER REFERENCES stock_batches(id) ON DELETE SET NULL,
        location_id INTEGER NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
        wastage_category_id INTEGER NOT NULL REFERENCES wastage_categories(id) ON DELETE CASCADE,
        wastage_type_id INTEGER NOT NULL REFERENCES wastage_types(id) ON DELETE CASCADE,
        original_size VARCHAR(50),
        wastage_size VARCHAR(50),
        quantity INTEGER NOT NULL,
        unit_type VARCHAR(20) DEFAULT 'sheet',
        unit_cost DECIMAL(10,2) NOT NULL,
        total_value DECIMAL(10,2) NOT NULL,
        wastage_reason TEXT NOT NULL,
        wastage_date DATE NOT NULL,
        reported_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        status VARCHAR(20) DEFAULT 'reported' CHECK (status IN ('reported', 'approved', 'disposed', 'rejected')),
        disposal_method VARCHAR(50) CHECK (disposal_method IN ('scrap', 'return_to_supplier', 'repair', 'donate', 'destroy', 'recycle', 'sell_as_scrap')),
        disposal_date DATE,
        disposal_notes TEXT,
        disposal_value DECIMAL(10,2) DEFAULT 0,
        net_loss DECIMAL(10,2) GENERATED ALWAYS AS (total_value - disposal_value) STORED,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create wastage_photos table (for documentation)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS wastage_photos (
        id SERIAL PRIMARY KEY,
        wastage_entry_id INTEGER NOT NULL REFERENCES wastage_entries(id) ON DELETE CASCADE,
        photo_url VARCHAR(500) NOT NULL,
        photo_type VARCHAR(20) DEFAULT 'damage' CHECK (photo_type IN ('damage', 'disposal', 'before', 'after')),
        description TEXT,
        uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create wastage_disposal_logs table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS wastage_disposal_logs (
        id SERIAL PRIMARY KEY,
        wastage_entry_id INTEGER NOT NULL REFERENCES wastage_entries(id) ON DELETE CASCADE,
        disposal_action VARCHAR(50) NOT NULL,
        disposal_quantity INTEGER NOT NULL,
        disposal_value DECIMAL(10,2),
        disposal_notes TEXT,
        disposed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        disposal_date TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create wastage_recovery table (for items that can be recovered)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS wastage_recovery (
        id SERIAL PRIMARY KEY,
        wastage_entry_id INTEGER NOT NULL REFERENCES wastage_entries(id) ON DELETE CASCADE,
        recovery_type VARCHAR(50) NOT NULL CHECK (recovery_type IN ('repair', 'reuse', 'recycle', 'partial_sale')),
        recovered_quantity INTEGER NOT NULL,
        recovered_value DECIMAL(10,2),
        recovery_notes TEXT,
        recovered_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        recovery_date TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create wastage_alerts table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS wastage_alerts (
        id SERIAL PRIMARY KEY,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        location_id INTEGER NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
        alert_type VARCHAR(50) NOT NULL CHECK (alert_type IN ('high_wastage', 'frequent_wastage', 'value_threshold', 'pattern_alert')),
        threshold_value DECIMAL(10,2),
        current_value DECIMAL(10,2),
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        is_resolved BOOLEAN DEFAULT FALSE,
        resolved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        resolved_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create wastage_patterns table (for analyzing wastage patterns)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS wastage_patterns (
        id SERIAL PRIMARY KEY,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        location_id INTEGER NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
        wastage_type_id INTEGER NOT NULL REFERENCES wastage_types(id) ON DELETE CASCADE,
        pattern_type VARCHAR(50) NOT NULL CHECK (pattern_type IN ('size', 'time', 'operator', 'machine', 'process')),
        pattern_value VARCHAR(100) NOT NULL,
        frequency INTEGER NOT NULL DEFAULT 1,
        total_wastage_value DECIMAL(10,2) NOT NULL DEFAULT 0,
        last_occurrence TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(product_id, location_id, wastage_type_id, pattern_type, pattern_value)
      )
    `);

    // Insert default wastage categories
    console.log('📝 Inserting default wastage categories...');
    
    await pool.query(`
      INSERT INTO wastage_categories (name, description) VALUES 
      ('Cutting Wastage', 'Wastage from cutting operations'),
      ('Damage Wastage', 'Wastage due to damage during handling'),
      ('Quality Wastage', 'Wastage due to quality issues'),
      ('Expiry Wastage', 'Wastage due to expiry'),
      ('Process Wastage', 'Wastage from manufacturing processes'),
      ('Transport Wastage', 'Wastage during transportation'),
      ('Storage Wastage', 'Wastage during storage'),
      ('Other Wastage', 'Other types of wastage')
      ON CONFLICT (name) DO NOTHING
    `);

    // Insert default wastage types
    console.log('📝 Inserting default wastage types...');
    
    // Cutting Wastage types
    await pool.query(`
      INSERT INTO wastage_types (category_id, name, description, default_disposal_method) 
      SELECT c.id, 'Cut Pieces', 'Pieces left after cutting operations', 'sell_as_scrap'
      FROM wastage_categories c WHERE c.name = 'Cutting Wastage'
      ON CONFLICT (category_id, name) DO NOTHING
    `);

    await pool.query(`
      INSERT INTO wastage_types (category_id, name, description, default_disposal_method) 
      SELECT c.id, 'Saw Dust', 'Saw dust from cutting', 'recycle'
      FROM wastage_categories c WHERE c.name = 'Cutting Wastage'
      ON CONFLICT (category_id, name) DO NOTHING
    `);

    // Damage Wastage types
    await pool.query(`
      INSERT INTO wastage_types (category_id, name, description, default_disposal_method) 
      SELECT c.id, 'Water Damage', 'Damage due to water exposure', 'destroy'
      FROM wastage_categories c WHERE c.name = 'Damage Wastage'
      ON CONFLICT (category_id, name) DO NOTHING
    `);

    await pool.query(`
      INSERT INTO wastage_types (category_id, name, description, default_disposal_method) 
      SELECT c.id, 'Physical Damage', 'Physical damage during handling', 'repair'
      FROM wastage_categories c WHERE c.name = 'Damage Wastage'
      ON CONFLICT (category_id, name) DO NOTHING
    `);

    await pool.query(`
      INSERT INTO wastage_types (category_id, name, description, default_disposal_method) 
      SELECT c.id, 'Cracked Sheets', 'Sheets with cracks', 'scrap'
      FROM wastage_categories c WHERE c.name = 'Damage Wastage'
      ON CONFLICT (category_id, name) DO NOTHING
    `);

    // Quality Wastage types
    await pool.query(`
      INSERT INTO wastage_types (category_id, name, description, default_disposal_method) 
      SELECT c.id, 'Poor Quality', 'Items not meeting quality standards', 'return_to_supplier'
      FROM wastage_categories c WHERE c.name = 'Quality Wastage'
      ON CONFLICT (category_id, name) DO NOTHING
    `);

    await pool.query(`
      INSERT INTO wastage_types (category_id, name, description, default_disposal_method) 
      SELECT c.id, 'Defective Items', 'Manufacturing defects', 'return_to_supplier'
      FROM wastage_categories c WHERE c.name = 'Quality Wastage'
      ON CONFLICT (category_id, name) DO NOTHING
    `);

    // Create indexes for better performance
    console.log('🔍 Creating indexes...');
    
    await pool.query('CREATE INDEX IF NOT EXISTS idx_wastage_entries_product_id ON wastage_entries(product_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_wastage_entries_location_id ON wastage_entries(location_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_wastage_entries_category_id ON wastage_entries(wastage_category_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_wastage_entries_type_id ON wastage_entries(wastage_type_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_wastage_entries_wastage_date ON wastage_entries(wastage_date)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_wastage_entries_status ON wastage_entries(status)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_wastage_entries_reported_by ON wastage_entries(reported_by)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_wastage_photos_entry_id ON wastage_photos(wastage_entry_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_wastage_disposal_logs_entry_id ON wastage_disposal_logs(wastage_entry_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_wastage_recovery_entry_id ON wastage_recovery(wastage_entry_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_wastage_alerts_product_id ON wastage_alerts(product_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_wastage_patterns_product_id ON wastage_patterns(product_id)');

    console.log('\n✅ Wastage Management Schema created successfully!');
    console.log('\n📋 Wastage Management Features:');
    console.log('   • Comprehensive wastage tracking');
    console.log('   • Multiple wastage categories and types');
    console.log('   • Photo documentation');
    console.log('   • Disposal management');
    console.log('   • Recovery tracking');
    console.log('   • Wastage pattern analysis');
    console.log('   • Automated alerts');
    console.log('   • Detailed reporting');
    
  } catch (error) {
    console.error('❌ Error creating wastage schema:', error);
    throw error;
  } finally {
    await pool.end();
  }
};

// Run the creation
createWastageSchema()
  .then(() => {
    console.log('\n🎉 Wastage Management schema creation completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Wastage Management schema creation failed:', error);
    process.exit(1);
  });
