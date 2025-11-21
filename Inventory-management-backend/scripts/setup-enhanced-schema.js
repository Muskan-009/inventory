const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'inventory_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
});

const setupEnhancedSchema = async () => {
  try {
    console.log('🚀 Setting up Enhanced Inventory Management Schema...\n');

    // ==================== UPDATE PRODUCTS TABLE ====================
    console.log('📦 Updating Products table for wood products...');
    
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

    // ==================== CREATE BRANDS AND SERIES TABLES ====================
    console.log('🏷️  Creating Brands and Series tables...');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS brands (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

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

    // ==================== CREATE PRODUCT WASTAGE TABLE ====================
    console.log('✂️  Creating Product Wastage table...');
    
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

    // ==================== CREATE PRODUCT UNITS TABLE ====================
    console.log('📏 Creating Product Units table...');
    
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

    // ==================== CREATE STOCK MANAGEMENT TABLES ====================
    console.log('🏪 Creating Stock Management tables...');
    
    // Locations table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS locations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        type VARCHAR(50) NOT NULL CHECK (type IN ('warehouse', 'showroom', 'godown', 'retail_store')),
        address TEXT,
        contact_person VARCHAR(100),
        contact_phone VARCHAR(15),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Stock batches table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS stock_batches (
        id SERIAL PRIMARY KEY,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        batch_number VARCHAR(50) NOT NULL,
        lot_number VARCHAR(50),
        supplier_batch VARCHAR(50),
        manufacturing_date DATE,
        expiry_date DATE,
        quality_grade VARCHAR(20),
        initial_quantity INTEGER NOT NULL,
        remaining_quantity INTEGER NOT NULL,
        unit_cost DECIMAL(10,2) NOT NULL,
        location_id INTEGER NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'exhausted', 'damaged')),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(product_id, batch_number, location_id)
      )
    `);

    // Stock locations table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS stock_locations (
        id SERIAL PRIMARY KEY,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        location_id INTEGER NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
        current_stock INTEGER NOT NULL DEFAULT 0,
        reserved_stock INTEGER NOT NULL DEFAULT 0,
        available_stock INTEGER GENERATED ALWAYS AS (current_stock - reserved_stock) STORED,
        reorder_level INTEGER DEFAULT 0,
        max_stock_level INTEGER,
        last_updated TIMESTAMP DEFAULT NOW(),
        UNIQUE(product_id, location_id)
      )
    `);

    // Stock movements table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS stock_movements (
        id SERIAL PRIMARY KEY,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        batch_id INTEGER REFERENCES stock_batches(id) ON DELETE SET NULL,
        from_location_id INTEGER REFERENCES locations(id) ON DELETE SET NULL,
        to_location_id INTEGER REFERENCES locations(id) ON DELETE SET NULL,
        movement_type VARCHAR(20) NOT NULL CHECK (movement_type IN ('purchase', 'sale', 'transfer', 'adjustment', 'damage', 'return', 'production')),
        quantity INTEGER NOT NULL,
        unit_cost DECIMAL(10,2),
        total_cost DECIMAL(10,2),
        reference_type VARCHAR(20),
        reference_id INTEGER,
        notes TEXT,
        created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Stock transfers table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS stock_transfers (
        id SERIAL PRIMARY KEY,
        transfer_number VARCHAR(50) UNIQUE NOT NULL,
        from_location_id INTEGER NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
        to_location_id INTEGER NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_transit', 'completed', 'cancelled')),
        requested_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        dispatched_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        received_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        requested_date TIMESTAMP DEFAULT NOW(),
        approved_date TIMESTAMP,
        dispatched_date TIMESTAMP,
        received_date TIMESTAMP,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Stock transfer items table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS stock_transfer_items (
        id SERIAL PRIMARY KEY,
        transfer_id INTEGER NOT NULL REFERENCES stock_transfers(id) ON DELETE CASCADE,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        batch_id INTEGER REFERENCES stock_batches(id) ON DELETE SET NULL,
        quantity INTEGER NOT NULL,
        unit_cost DECIMAL(10,2),
        total_cost DECIMAL(10,2),
        notes TEXT
      )
    `);

    // Damaged stock table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS damaged_stock (
        id SERIAL PRIMARY KEY,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        batch_id INTEGER REFERENCES stock_batches(id) ON DELETE SET NULL,
        location_id INTEGER NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
        damage_type VARCHAR(50) NOT NULL CHECK (damage_type IN ('defective', 'damaged', 'expired', 'broken', 'water_damage', 'other')),
        damage_reason TEXT,
        quantity INTEGER NOT NULL,
        unit_cost DECIMAL(10,2),
        total_loss DECIMAL(10,2),
        disposal_method VARCHAR(50) CHECK (disposal_method IN ('scrap', 'return_to_supplier', 'repair', 'donate', 'destroy')),
        disposal_date DATE,
        reported_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        status VARCHAR(20) DEFAULT 'reported' CHECK (status IN ('reported', 'approved', 'disposed', 'rejected')),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Stock valuations table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS stock_valuations (
        id SERIAL PRIMARY KEY,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        location_id INTEGER NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
        valuation_method VARCHAR(20) NOT NULL CHECK (valuation_method IN ('FIFO', 'LIFO', 'Weighted_Average', 'Specific_Identification')),
        current_value DECIMAL(15,2) NOT NULL DEFAULT 0,
        average_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
        last_calculated TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(product_id, location_id, valuation_method)
      )
    `);

    // Odd size pieces table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS odd_size_pieces (
        id SERIAL PRIMARY KEY,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        original_batch_id INTEGER REFERENCES stock_batches(id) ON DELETE SET NULL,
        location_id INTEGER NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
        piece_size VARCHAR(50) NOT NULL,
        quantity INTEGER NOT NULL,
        unit_cost DECIMAL(10,2),
        total_value DECIMAL(10,2),
        status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'sold', 'scrapped')),
        created_from VARCHAR(50),
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Stock alerts table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS stock_alerts (
        id SERIAL PRIMARY KEY,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        location_id INTEGER NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
        alert_type VARCHAR(20) NOT NULL CHECK (alert_type IN ('low_stock', 'out_of_stock', 'overstock', 'expiry_warning', 'damage_alert')),
        current_stock INTEGER NOT NULL,
        threshold_value INTEGER,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        is_resolved BOOLEAN DEFAULT FALSE,
        resolved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        resolved_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // ==================== INSERT DEFAULT DATA ====================
    console.log('📝 Inserting default data...');
    
    // Insert default brands
    await pool.query(`
      INSERT INTO brands (name, description) VALUES 
      ('Greenply', 'Premium plywood and wood products'),
      ('Century', 'Quality wood products and laminates'),
      ('Local Brand', 'Local manufacturer products')
      ON CONFLICT (name) DO NOTHING
    `);

    // Insert default series
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

    await pool.query(`
      INSERT INTO series (brand_id, name, description) 
      SELECT b.id, 'Century Marine', 'Marine grade plywood'
      FROM brands b WHERE b.name = 'Century'
      ON CONFLICT (brand_id, name) DO NOTHING
    `);

    // Insert default locations
    await pool.query(`
      INSERT INTO locations (name, type, address, is_active) VALUES 
      ('Main Warehouse', 'warehouse', 'Main warehouse address', true),
      ('Showroom', 'showroom', 'Showroom address', true),
      ('Godown A', 'godown', 'Godown A address', true),
      ('Retail Store', 'retail_store', 'Retail store address', true)
      ON CONFLICT DO NOTHING
    `);

    // ==================== CREATE INDEXES ====================
    console.log('🔍 Creating indexes for better performance...');
    
    // Product indexes
    await pool.query('CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_products_series ON products(series)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_products_size ON products(size)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_products_thickness ON products(thickness)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_products_grade ON products(grade)');
    
    // Stock management indexes
    await pool.query('CREATE INDEX IF NOT EXISTS idx_stock_batches_product_id ON stock_batches(product_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_stock_batches_location_id ON stock_batches(location_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_stock_batches_batch_number ON stock_batches(batch_number)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_stock_locations_product_id ON stock_locations(product_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_stock_locations_location_id ON stock_locations(location_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_stock_movements_product_id ON stock_movements(product_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_stock_movements_batch_id ON stock_movements(batch_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_stock_movements_created_at ON stock_movements(created_at)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_stock_transfers_from_location ON stock_transfers(from_location_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_stock_transfers_to_location ON stock_transfers(to_location_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_damaged_stock_product_id ON damaged_stock(product_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_damaged_stock_location_id ON damaged_stock(location_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_odd_size_pieces_product_id ON odd_size_pieces(product_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_stock_alerts_product_id ON stock_alerts(product_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_stock_alerts_location_id ON stock_alerts(location_id)');

    console.log('\n✅ Enhanced Inventory Management Schema setup completed successfully!');
    console.log('\n📋 Summary of features added:');
    console.log('   • Wood product attributes (size, thickness, grade, finish)');
    console.log('   • Brand and series management');
    console.log('   • Multi-unit handling (Sheet, Sq.Ft., Cu.Ft.)');
    console.log('   • Wastage tracking for cut pieces');
    console.log('   • Batch/lot tracking for quality & grade');
    console.log('   • Multi-location stock management');
    console.log('   • Stock transfer between branches');
    console.log('   • Damaged/defective stock tracking');
    console.log('   • Stock valuation (FIFO/Weighted Avg)');
    console.log('   • Odd-size/balance pieces management');
    console.log('   • Real-time stock alerts and reorder levels');
    
  } catch (error) {
    console.error('❌ Error setting up enhanced schema:', error);
    throw error;
  } finally {
    await pool.end();
  }
};

// Run the setup
setupEnhancedSchema()
  .then(() => {
    console.log('\n🎉 Setup completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Setup failed:', error);
    process.exit(1);
  });
