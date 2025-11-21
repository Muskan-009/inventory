const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'inventory_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
});

const createStockManagementSchema = async () => {
    try {
        console.log('Creating Stock Management schema...');

        // Create locations table (warehouse, showroom, godown, etc.)
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

        // Create stock_batches table for batch/lot tracking
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

        // Create stock_locations table for multi-location stock
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

        // Create stock_movements table for tracking all stock movements
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

        // Create stock_transfers table for inter-location transfers
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

        // Create stock_transfer_items table
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

        // Create damaged_stock table
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

        // Create stock_valuations table for FIFO/Weighted Average
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

        // Create odd_size_pieces table for managing cut pieces
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

        // Create stock_alerts table for reorder level alerts
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

        // Insert default locations
        await pool.query(`
      INSERT INTO locations (name, type, address, is_active) VALUES 
      ('Main Warehouse', 'warehouse', 'Main warehouse address', true),
      ('Showroom', 'showroom', 'Showroom address', true),
      ('Godown A', 'godown', 'Godown A address', true),
      ('Retail Store', 'retail_store', 'Retail store address', true)
      ON CONFLICT DO NOTHING
    `);

        // Create indexes for better performance
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

        console.log('✅ Stock Management schema created successfully!');

    } catch (error) {
        console.error('❌ Error creating stock management schema:', error);
        throw error;
    } finally {
        await pool.end();
    }
};

// Run the creation
createStockManagementSchema()
    .then(() => {
        console.log('Stock Management schema creation completed!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Stock Management schema creation failed:', error);
        process.exit(1);
    });
