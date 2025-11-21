const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'inventory_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
});

const createSalesBillingSchema = async () => {
  try {
    console.log('💰 Creating Sales & Billing Management Schema...\n');

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

    // Insert default data
    console.log('📝 Inserting default data...');
    
    // Insert customer types
    await pool.query(`
      INSERT INTO customer_types (name, description, discount_percentage, credit_limit, credit_days) VALUES 
      ('Retail', 'Individual retail customers', 0, 0, 0),
      ('Wholesale', 'Wholesale buyers', 5, 100000, 15),
      ('Contractor', 'Construction contractors', 10, 500000, 30),
      ('Bulk Buyer', 'Large volume buyers', 15, 1000000, 45)
      ON CONFLICT (name) DO NOTHING
    `);

    // Insert pricing tiers
    await pool.query(`
      INSERT INTO pricing_tiers (name, description, markup_percentage) VALUES 
      ('Retail', 'Retail pricing', 0),
      ('Wholesale', 'Wholesale pricing', -5),
      ('Contractor', 'Contractor pricing', -10),
      ('Bulk', 'Bulk pricing', -15)
      ON CONFLICT (name) DO NOTHING
    `);

    // Insert HSN codes
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

    // Insert payment modes
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

    // Insert measurement units
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

    // Create indexes for better performance
    console.log('🔍 Creating indexes...');
    
    await pool.query('CREATE INDEX IF NOT EXISTS idx_product_pricing_product_id ON product_pricing(product_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_product_pricing_tier_id ON product_pricing(pricing_tier_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_sales_orders_customer_id ON sales_orders(customer_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_sales_orders_order_date ON sales_orders(order_date)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_sales_orders_status ON sales_orders(status)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_sales_invoices_customer_id ON sales_invoices(customer_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_sales_invoices_invoice_date ON sales_invoices(invoice_date)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_sales_invoices_payment_status ON sales_invoices(payment_status)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_sales_payments_invoice_id ON sales_payments(invoice_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_sales_payments_payment_date ON sales_payments(payment_date)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_sales_returns_invoice_id ON sales_returns(invoice_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_sales_returns_return_date ON sales_returns(return_date)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_pos_sessions_user_id ON pos_sessions(user_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_pos_sessions_location_id ON pos_sessions(location_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_pos_transactions_session_id ON pos_transactions(session_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_pos_transactions_transaction_date ON pos_transactions(transaction_date)');

    console.log('\n✅ Sales & Billing Management Schema created successfully!');
    console.log('\n📋 Sales & Billing Features:');
    console.log('   • POS system for retail billing');
    console.log('   • Sales order management');
    console.log('   • Multiple pricing tiers');
    console.log('   • GST-compliant invoicing');
    console.log('   • Measurement-based billing');
    console.log('   • Bundled product billing');
    console.log('   • Sales return/replacement handling');
    console.log('   • Multiple payment modes');
    console.log('   • Customer type management');
    console.log('   • HSN code management');
    
  } catch (error) {
    console.error('❌ Error creating sales billing schema:', error);
    throw error;
  } finally {
    await pool.end();
  }
};

// Run the creation
createSalesBillingSchema()
  .then(() => {
    console.log('\n🎉 Sales & Billing Management schema creation completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Sales & Billing Management schema creation failed:', error);
    process.exit(1);
  });
