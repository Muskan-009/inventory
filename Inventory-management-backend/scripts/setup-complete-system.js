const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'inventory_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
});

const setupCompleteSystem = async () => {
  try {
    console.log('🚀 Setting up Complete Inventory Management System...\n');

    // 1. Enhanced Product Schema
    console.log('📦 Setting up Enhanced Product Schema...');
    await pool.query(`
      -- Add new columns to products table if they don't exist
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'brand') THEN
          ALTER TABLE products ADD COLUMN brand VARCHAR(100);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'series') THEN
          ALTER TABLE products ADD COLUMN series VARCHAR(100);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'size') THEN
          ALTER TABLE products ADD COLUMN size VARCHAR(50);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'thickness') THEN
          ALTER TABLE products ADD COLUMN thickness VARCHAR(20);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'grade') THEN
          ALTER TABLE products ADD COLUMN grade VARCHAR(20);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'finish') THEN
          ALTER TABLE products ADD COLUMN finish VARCHAR(50);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'unit_type') THEN
          ALTER TABLE products ADD COLUMN unit_type VARCHAR(20) DEFAULT 'sheet';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'price_per_sqft') THEN
          ALTER TABLE products ADD COLUMN price_per_sqft DECIMAL(10,2);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'price_per_cuft') THEN
          ALTER TABLE products ADD COLUMN price_per_cuft DECIMAL(10,2);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'cutting_option') THEN
          ALTER TABLE products ADD COLUMN cutting_option VARCHAR(20) DEFAULT 'per_sheet';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'wastage_percentage') THEN
          ALTER TABLE products ADD COLUMN wastage_percentage DECIMAL(5,2) DEFAULT 0;
        END IF;
      END $$;
    `);

    // Create brands table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS brands (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        is_active BOOLEAN DEFAULT TRUE,
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
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(brand_id, name)
      )
    `);

    // Create product_wastage table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS product_wastage (
        id SERIAL PRIMARY KEY,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        wastage_type VARCHAR(50) NOT NULL,
        quantity DECIMAL(10,2) NOT NULL,
        unit VARCHAR(20) NOT NULL,
        reason TEXT,
        recorded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        recorded_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create product_units table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS product_units (
        id SERIAL PRIMARY KEY,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        unit_type VARCHAR(20) NOT NULL,
        conversion_factor DECIMAL(10,4) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    console.log('✅ Enhanced Product Schema completed\n');

    // 2. Stock Management Schema
    console.log('📊 Setting up Stock Management Schema...');
    
    // Create locations table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS locations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        type VARCHAR(20) NOT NULL CHECK (type IN ('warehouse', 'showroom', 'godown', 'retail')),
        address TEXT,
        contact_person VARCHAR(100),
        contact_phone VARCHAR(20),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create batches table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS batches (
        id SERIAL PRIMARY KEY,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        batch_number VARCHAR(50) NOT NULL,
        supplier_batch VARCHAR(50),
        manufacturing_date DATE,
        expiry_date DATE,
        quality_grade VARCHAR(20),
        location_id INTEGER NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
        quantity DECIMAL(10,2) NOT NULL,
        unit VARCHAR(20) NOT NULL,
        cost_price DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(product_id, batch_number, location_id)
      )
    `);

    // Create stock_movements table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS stock_movements (
        id SERIAL PRIMARY KEY,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        batch_id INTEGER REFERENCES batches(id) ON DELETE SET NULL,
        location_id INTEGER NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
        movement_type VARCHAR(20) NOT NULL CHECK (movement_type IN ('in', 'out', 'transfer', 'adjustment')),
        quantity DECIMAL(10,2) NOT NULL,
        unit VARCHAR(20) NOT NULL,
        reference_type VARCHAR(50),
        reference_id INTEGER,
        reason TEXT,
        created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create stock_transfers table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS stock_transfers (
        id SERIAL PRIMARY KEY,
        transfer_number VARCHAR(50) UNIQUE NOT NULL,
        from_location_id INTEGER NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
        to_location_id INTEGER NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
        transfer_date DATE NOT NULL,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_transit', 'completed', 'cancelled')),
        notes TEXT,
        created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
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
        batch_id INTEGER REFERENCES batches(id) ON DELETE SET NULL,
        quantity DECIMAL(10,2) NOT NULL,
        unit VARCHAR(20) NOT NULL,
        notes TEXT
      )
    `);

    // Create damaged_stock table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS damaged_stock (
        id SERIAL PRIMARY KEY,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        batch_id INTEGER REFERENCES batches(id) ON DELETE SET NULL,
        location_id INTEGER NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
        damage_type VARCHAR(50) NOT NULL,
        quantity DECIMAL(10,2) NOT NULL,
        unit VARCHAR(20) NOT NULL,
        damage_reason TEXT,
        estimated_loss DECIMAL(10,2),
        status VARCHAR(20) DEFAULT 'recorded' CHECK (status IN ('recorded', 'investigating', 'disposed', 'repaired')),
        recorded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        recorded_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create stock_valuation table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS stock_valuation (
        id SERIAL PRIMARY KEY,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        location_id INTEGER NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
        valuation_method VARCHAR(20) NOT NULL CHECK (valuation_method IN ('FIFO', 'LIFO', 'Weighted_Average')),
        total_quantity DECIMAL(10,2) NOT NULL,
        unit VARCHAR(20) NOT NULL,
        average_cost DECIMAL(10,2) NOT NULL,
        total_value DECIMAL(15,2) NOT NULL,
        last_updated TIMESTAMP DEFAULT NOW(),
        UNIQUE(product_id, location_id, valuation_method)
      )
    `);

    // Create odd_size_pieces table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS odd_size_pieces (
        id SERIAL PRIMARY KEY,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        location_id INTEGER NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
        dimensions VARCHAR(50) NOT NULL,
        quantity INTEGER NOT NULL,
        unit VARCHAR(20) NOT NULL,
        condition_status VARCHAR(20) DEFAULT 'good' CHECK (condition_status IN ('good', 'damaged', 'defective')),
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    console.log('✅ Stock Management Schema completed\n');

    // 3. Wastage Management Schema
    console.log('🗑️ Setting up Wastage Management Schema...');
    
    // Create wastage_categories table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS wastage_categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        disposal_method VARCHAR(100),
        environmental_impact VARCHAR(20) CHECK (environmental_impact IN ('low', 'medium', 'high')),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create wastage_records table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS wastage_records (
        id SERIAL PRIMARY KEY,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        category_id INTEGER NOT NULL REFERENCES wastage_categories(id) ON DELETE CASCADE,
        location_id INTEGER NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
        wastage_type VARCHAR(50) NOT NULL,
        quantity DECIMAL(10,2) NOT NULL,
        unit VARCHAR(20) NOT NULL,
        cost_per_unit DECIMAL(10,2) NOT NULL,
        total_cost DECIMAL(10,2) NOT NULL,
        reason TEXT NOT NULL,
        wastage_date DATE NOT NULL,
        recorded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create wastage_disposal table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS wastage_disposal (
        id SERIAL PRIMARY KEY,
        wastage_record_id INTEGER NOT NULL REFERENCES wastage_records(id) ON DELETE CASCADE,
        disposal_method VARCHAR(100) NOT NULL,
        disposal_date DATE NOT NULL,
        disposal_cost DECIMAL(10,2) DEFAULT 0,
        disposal_company VARCHAR(200),
        disposal_certificate VARCHAR(200),
        notes TEXT,
        disposed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    console.log('✅ Wastage Management Schema completed\n');

    // 4. Sales & Billing Management Schema
    console.log('💰 Setting up Sales & Billing Management Schema...');
    
    // Create customer_types table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS customer_types (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) NOT NULL UNIQUE,
        description TEXT,
        discount_percentage DECIMAL(5,2) DEFAULT 0,
        credit_limit DECIMAL(15,2) DEFAULT 0,
        credit_days INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create pricing_tiers table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS pricing_tiers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) NOT NULL UNIQUE,
        description TEXT,
        markup_percentage DECIMAL(5,2) DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create product_pricing table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS product_pricing (
        id SERIAL PRIMARY KEY,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        pricing_tier_id INTEGER NOT NULL REFERENCES pricing_tiers(id) ON DELETE CASCADE,
        price DECIMAL(10,2) NOT NULL,
        min_quantity INTEGER DEFAULT 1,
        max_quantity INTEGER,
        effective_from DATE NOT NULL,
        effective_to DATE,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(product_id, pricing_tier_id, effective_from)
      )
    `);

    // Create hsn_codes table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS hsn_codes (
        id SERIAL PRIMARY KEY,
        code VARCHAR(10) NOT NULL UNIQUE,
        description TEXT NOT NULL,
        gst_rate DECIMAL(5,2) NOT NULL,
        cgst_rate DECIMAL(5,2) NOT NULL,
        sgst_rate DECIMAL(5,2) NOT NULL,
        igst_rate DECIMAL(5,2) NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create product_bundles table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS product_bundles (
        id SERIAL PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        description TEXT,
        bundle_code VARCHAR(50) UNIQUE NOT NULL,
        total_price DECIMAL(10,2) NOT NULL,
        discount_percentage DECIMAL(5,2) DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create product_bundle_items table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS product_bundle_items (
        id SERIAL PRIMARY KEY,
        bundle_id INTEGER NOT NULL REFERENCES product_bundles(id) ON DELETE CASCADE,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        quantity INTEGER NOT NULL,
        unit_price DECIMAL(10,2) NOT NULL,
        total_price DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create sales_orders table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sales_orders (
        id SERIAL PRIMARY KEY,
        order_number VARCHAR(50) UNIQUE NOT NULL,
        customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
        customer_type_id INTEGER REFERENCES customer_types(id) ON DELETE SET NULL,
        order_date DATE NOT NULL,
        delivery_date DATE,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'ready', 'delivered', 'cancelled')),
        order_type VARCHAR(20) DEFAULT 'retail' CHECK (order_type IN ('retail', 'wholesale', 'contractor', 'bulk')),
        subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
        discount_amount DECIMAL(10,2) DEFAULT 0,
        discount_percentage DECIMAL(5,2) DEFAULT 0,
        tax_amount DECIMAL(10,2) DEFAULT 0,
        total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
        notes TEXT,
        created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create sales_order_items table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sales_order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        bundle_id INTEGER REFERENCES product_bundles(id) ON DELETE SET NULL,
        quantity INTEGER NOT NULL,
        unit_type VARCHAR(20) DEFAULT 'sheet',
        unit_price DECIMAL(10,2) NOT NULL,
        discount_percentage DECIMAL(5,2) DEFAULT 0,
        discount_amount DECIMAL(10,2) DEFAULT 0,
        total_price DECIMAL(10,2) NOT NULL,
        notes TEXT
      )
    `);

    // Create sales_invoices table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sales_invoices (
        id SERIAL PRIMARY KEY,
        invoice_number VARCHAR(50) UNIQUE NOT NULL,
        order_id INTEGER REFERENCES sales_orders(id) ON DELETE SET NULL,
        customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
        customer_type_id INTEGER REFERENCES customer_types(id) ON DELETE SET NULL,
        invoice_date DATE NOT NULL,
        due_date DATE,
        billing_address TEXT,
        shipping_address TEXT,
        subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
        discount_amount DECIMAL(10,2) DEFAULT 0,
        tax_amount DECIMAL(10,2) DEFAULT 0,
        total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
        paid_amount DECIMAL(10,2) DEFAULT 0,
        balance_amount DECIMAL(10,2) GENERATED ALWAYS AS (total_amount - paid_amount) STORED,
        payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'paid', 'overdue')),
        invoice_status VARCHAR(20) DEFAULT 'draft' CHECK (invoice_status IN ('draft', 'sent', 'paid', 'cancelled')),
        notes TEXT,
        terms_conditions TEXT,
        created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create sales_invoice_items table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sales_invoice_items (
        id SERIAL PRIMARY KEY,
        invoice_id INTEGER NOT NULL REFERENCES sales_invoices(id) ON DELETE CASCADE,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        bundle_id INTEGER REFERENCES product_bundles(id) ON DELETE SET NULL,
        hsn_code VARCHAR(10),
        quantity INTEGER NOT NULL,
        unit_type VARCHAR(20) DEFAULT 'sheet',
        unit_price DECIMAL(10,2) NOT NULL,
        discount_percentage DECIMAL(5,2) DEFAULT 0,
        discount_amount DECIMAL(10,2) DEFAULT 0,
        taxable_amount DECIMAL(10,2) NOT NULL,
        gst_rate DECIMAL(5,2) DEFAULT 0,
        cgst_amount DECIMAL(10,2) DEFAULT 0,
        sgst_amount DECIMAL(10,2) DEFAULT 0,
        igst_amount DECIMAL(10,2) DEFAULT 0,
        total_amount DECIMAL(10,2) NOT NULL
      )
    `);

    // Create payment_modes table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS payment_modes (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) NOT NULL UNIQUE,
        description TEXT,
        is_online BOOLEAN DEFAULT FALSE,
        processing_fee_percentage DECIMAL(5,2) DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create sales_payments table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sales_payments (
        id SERIAL PRIMARY KEY,
        invoice_id INTEGER NOT NULL REFERENCES sales_invoices(id) ON DELETE CASCADE,
        payment_mode_id INTEGER NOT NULL REFERENCES payment_modes(id) ON DELETE CASCADE,
        amount DECIMAL(10,2) NOT NULL,
        payment_date TIMESTAMP NOT NULL,
        transaction_id VARCHAR(100),
        reference_number VARCHAR(100),
        notes TEXT,
        processed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create sales_returns table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sales_returns (
        id SERIAL PRIMARY KEY,
        return_number VARCHAR(50) UNIQUE NOT NULL,
        invoice_id INTEGER NOT NULL REFERENCES sales_invoices(id) ON DELETE CASCADE,
        customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
        return_date DATE NOT NULL,
        return_reason VARCHAR(100) NOT NULL,
        return_type VARCHAR(20) DEFAULT 'return' CHECK (return_type IN ('return', 'replacement', 'exchange')),
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'processed', 'completed', 'rejected')),
        subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
        tax_amount DECIMAL(10,2) DEFAULT 0,
        total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
        refund_amount DECIMAL(10,2) DEFAULT 0,
        notes TEXT,
        created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create sales_return_items table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sales_return_items (
        id SERIAL PRIMARY KEY,
        return_id INTEGER NOT NULL REFERENCES sales_returns(id) ON DELETE CASCADE,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        original_invoice_item_id INTEGER NOT NULL REFERENCES sales_invoice_items(id) ON DELETE CASCADE,
        quantity INTEGER NOT NULL,
        unit_price DECIMAL(10,2) NOT NULL,
        total_price DECIMAL(10,2) NOT NULL,
        reason TEXT,
        condition_status VARCHAR(20) DEFAULT 'good' CHECK (condition_status IN ('good', 'damaged', 'defective'))
      )
    `);

    // Create measurement_units table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS measurement_units (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) NOT NULL UNIQUE,
        symbol VARCHAR(10) NOT NULL,
        type VARCHAR(20) NOT NULL CHECK (type IN ('area', 'volume', 'length', 'weight', 'count')),
        conversion_factor DECIMAL(10,4) DEFAULT 1.0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create pos_sessions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS pos_sessions (
        id SERIAL PRIMARY KEY,
        session_number VARCHAR(50) UNIQUE NOT NULL,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        location_id INTEGER NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
        start_time TIMESTAMP NOT NULL,
        end_time TIMESTAMP,
        opening_cash DECIMAL(10,2) DEFAULT 0,
        closing_cash DECIMAL(10,2),
        total_sales DECIMAL(10,2) DEFAULT 0,
        total_transactions INTEGER DEFAULT 0,
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'closed', 'suspended')),
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create pos_transactions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS pos_transactions (
        id SERIAL PRIMARY KEY,
        transaction_number VARCHAR(50) UNIQUE NOT NULL,
        session_id INTEGER NOT NULL REFERENCES pos_sessions(id) ON DELETE CASCADE,
        customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
        transaction_type VARCHAR(20) DEFAULT 'sale' CHECK (transaction_type IN ('sale', 'return', 'exchange')),
        subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
        discount_amount DECIMAL(10,2) DEFAULT 0,
        tax_amount DECIMAL(10,2) DEFAULT 0,
        total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
        payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'partial', 'cancelled')),
        transaction_date TIMESTAMP DEFAULT NOW(),
        notes TEXT,
        created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create pos_transaction_items table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS pos_transaction_items (
        id SERIAL PRIMARY KEY,
        transaction_id INTEGER NOT NULL REFERENCES pos_transactions(id) ON DELETE CASCADE,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        quantity INTEGER NOT NULL,
        unit_type VARCHAR(20) DEFAULT 'sheet',
        unit_price DECIMAL(10,2) NOT NULL,
        discount_percentage DECIMAL(5,2) DEFAULT 0,
        total_price DECIMAL(10,2) NOT NULL
      )
    `);

    console.log('✅ Sales & Billing Management Schema completed\n');

    // 5. Insert Default Data
    console.log('📝 Inserting default data...');
    
    // Insert default locations
    await pool.query(`
      INSERT INTO locations (name, type, address, contact_person, contact_phone) VALUES 
      ('Main Warehouse', 'warehouse', 'Industrial Area, City', 'Warehouse Manager', '+91-9876543210'),
      ('Showroom 1', 'showroom', 'Main Street, City', 'Showroom Manager', '+91-9876543211'),
      ('Godown A', 'godown', 'Storage Area, City', 'Godown Keeper', '+91-9876543212')
      ON CONFLICT DO NOTHING
    `);

    // Insert default customer types
    await pool.query(`
      INSERT INTO customer_types (name, description, discount_percentage, credit_limit, credit_days) VALUES 
      ('Retail', 'Individual retail customers', 0, 0, 0),
      ('Wholesale', 'Wholesale buyers', 5, 100000, 15),
      ('Contractor', 'Construction contractors', 10, 500000, 30),
      ('Bulk Buyer', 'Large volume buyers', 15, 1000000, 45)
      ON CONFLICT (name) DO NOTHING
    `);

    // Insert default pricing tiers
    await pool.query(`
      INSERT INTO pricing_tiers (name, description, markup_percentage) VALUES 
      ('Retail', 'Retail pricing', 0),
      ('Wholesale', 'Wholesale pricing', -5),
      ('Contractor', 'Contractor pricing', -10),
      ('Bulk', 'Bulk pricing', -15)
      ON CONFLICT (name) DO NOTHING
    `);

    // Insert default HSN codes
    await pool.query(`
      INSERT INTO hsn_codes (code, description, gst_rate, cgst_rate, sgst_rate, igst_rate) VALUES 
      ('4410', 'Plywood, veneered panels and similar laminated wood', 12, 6, 6, 12),
      ('4411', 'Fibreboard of wood or other ligneous materials', 12, 6, 6, 12),
      ('4412', 'Plywood, veneered panels and similar laminated wood', 12, 6, 6, 12),
      ('4418', 'Builders'' joinery and carpentry of wood', 12, 6, 6, 12),
      ('3920', 'Other plates, sheets, film, foil and strip, of plastics', 18, 9, 9, 18),
      ('3208', 'Paints and varnishes', 18, 9, 9, 18)
      ON CONFLICT (code) DO NOTHING
    `);

    // Insert default payment modes
    await pool.query(`
      INSERT INTO payment_modes (name, description, is_online, processing_fee_percentage) VALUES 
      ('Cash', 'Cash payment', false, 0),
      ('UPI', 'UPI payment', true, 0.5),
      ('Card', 'Credit/Debit card', true, 1.5),
      ('Net Banking', 'Internet banking', true, 1.0),
      ('Cheque', 'Cheque payment', false, 0),
      ('Bank Transfer', 'Bank transfer', true, 0.5),
      ('Credit', 'Credit sales', false, 0)
      ON CONFLICT (name) DO NOTHING
    `);

    // Insert default measurement units
    await pool.query(`
      INSERT INTO measurement_units (name, symbol, type, conversion_factor) VALUES 
      ('Sheet', 'sheet', 'count', 1.0),
      ('Square Feet', 'sq.ft', 'area', 1.0),
      ('Square Meter', 'sq.m', 'area', 10.764),
      ('Cubic Feet', 'cu.ft', 'volume', 1.0),
      ('Cubic Meter', 'cu.m', 'volume', 35.315),
      ('Linear Feet', 'ft', 'length', 1.0),
      ('Linear Meter', 'm', 'length', 3.281),
      ('Kilogram', 'kg', 'weight', 1.0),
      ('Pound', 'lb', 'weight', 0.454)
      ON CONFLICT (name) DO NOTHING
    `);

    // Insert default wastage categories
    await pool.query(`
      INSERT INTO wastage_categories (name, description, disposal_method, environmental_impact) VALUES 
      ('Cutting Waste', 'Waste from cutting operations', 'Recycling', 'low'),
      ('Damaged Goods', 'Damaged or defective products', 'Disposal', 'medium'),
      ('Expired Stock', 'Expired or obsolete inventory', 'Disposal', 'medium'),
      ('Packaging Waste', 'Packaging materials', 'Recycling', 'low'),
      ('Production Waste', 'Waste from production process', 'Recycling', 'low')
      ON CONFLICT (name) DO NOTHING
    `);

    // Insert default brands
    await pool.query(`
      INSERT INTO brands (name, description) VALUES 
      ('Greenply', 'Premium plywood brand'),
      ('Century', 'Quality plywood manufacturer'),
      ('Local Brand', 'Local manufacturer'),
      ('Kitply', 'Kitply Industries'),
      ('Sainik', 'Sainik Plywood')
      ON CONFLICT (name) DO NOTHING
    `);

    console.log('✅ Default data inserted successfully\n');

    // 6. Create Indexes
    console.log('🔍 Creating indexes for better performance...');
    
    // Product indexes
    await pool.query('CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_products_grade ON products(grade)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_products_thickness ON products(thickness)');
    
    // Stock management indexes
    await pool.query('CREATE INDEX IF NOT EXISTS idx_batches_product_id ON batches(product_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_batches_location_id ON batches(location_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_stock_movements_product_id ON stock_movements(product_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_stock_movements_location_id ON stock_movements(location_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_stock_movements_created_at ON stock_movements(created_at)');
    
    // Sales billing indexes
    await pool.query('CREATE INDEX IF NOT EXISTS idx_sales_orders_customer_id ON sales_orders(customer_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_sales_orders_order_date ON sales_orders(order_date)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_sales_orders_status ON sales_orders(status)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_sales_invoices_customer_id ON sales_invoices(customer_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_sales_invoices_invoice_date ON sales_invoices(invoice_date)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_sales_invoices_payment_status ON sales_invoices(payment_status)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_sales_payments_invoice_id ON sales_payments(invoice_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_sales_payments_payment_date ON sales_payments(payment_date)');
    
    // Wastage indexes
    await pool.query('CREATE INDEX IF NOT EXISTS idx_wastage_records_product_id ON wastage_records(product_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_wastage_records_category_id ON wastage_records(category_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_wastage_records_wastage_date ON wastage_records(wastage_date)');

    console.log('✅ Indexes created successfully\n');

    console.log('\n🎉 Complete Inventory Management System setup completed successfully!');
    console.log('\n📋 System Features:');
    console.log('   ✅ Enhanced Product Management (Wood Products)');
    console.log('   ✅ Advanced Stock Management');
    console.log('   ✅ Comprehensive Wastage Management');
    console.log('   ✅ Complete Sales & Billing System');
    console.log('   ✅ POS System for Retail');
    console.log('   ✅ Multiple Pricing Tiers');
    console.log('   ✅ GST-Compliant Invoicing');
    console.log('   ✅ Sales Orders & Returns');
    console.log('   ✅ Multiple Payment Modes');
    console.log('   ✅ Measurement-Based Billing');
    console.log('   ✅ Product Bundles & Packages');
    console.log('   ✅ Customer Type Management');
    console.log('   ✅ HSN Code Management');
    console.log('   ✅ Batch & Lot Tracking');
    console.log('   ✅ Multi-Location Stock');
    console.log('   ✅ Stock Transfers');
    console.log('   ✅ Damaged Stock Tracking');
    console.log('   ✅ Stock Valuation (FIFO/Weighted Avg)');
    console.log('   ✅ Odd-Size Pieces Management');
    
  } catch (error) {
    console.error('❌ Error setting up complete system:', error);
    throw error;
  } finally {
    await pool.end();
  }
};

// Run the setup
setupCompleteSystem()
  .then(() => {
    console.log('\n🚀 System is ready for use!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 System setup failed:', error);
    process.exit(1);
  });
