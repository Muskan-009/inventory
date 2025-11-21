const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'inventory_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
});

const createMissingTables = async () => {
  try {
    console.log('🚀 Creating missing tables for complete system...\n');

    // Create wastage records table
    console.log('🗑️  Creating wastage records table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS wastage_records (
        id SERIAL PRIMARY KEY,
        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
        category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
        location_id INTEGER,
        wastage_type VARCHAR(50) NOT NULL,
        quantity INTEGER NOT NULL,
        unit VARCHAR(20) DEFAULT 'sheet',
        cost_per_unit DECIMAL(10,2) NOT NULL,
        total_cost DECIMAL(10,2) NOT NULL,
        reason TEXT,
        wastage_date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create wastage categories table
    console.log('📂 Creating wastage categories table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS wastage_categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Insert default wastage categories
    await pool.query(`
      INSERT INTO wastage_categories (name, description, is_active) VALUES 
      ('Cutting Wastage', 'Wastage during cutting operations', true),
      ('Damage', 'Damaged products and materials', true),
      ('Expired', 'Expired or outdated products', true),
      ('Quality Issues', 'Products with quality problems', true),
      ('Overstock', 'Excess inventory disposal', true),
      ('Other', 'Other types of wastage', true)
      ON CONFLICT DO NOTHING
    `);

    // Create POS sessions table
    console.log('💳 Creating POS sessions table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS pos_sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        location_id INTEGER,
        opening_cash DECIMAL(10,2) DEFAULT 0,
        closing_cash DECIMAL(10,2),
        total_sales DECIMAL(10,2) DEFAULT 0,
        total_transactions INTEGER DEFAULT 0,
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'closed')),
        opened_at TIMESTAMP DEFAULT NOW(),
        closed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create POS transactions table
    console.log('💰 Creating POS transactions table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS pos_transactions (
        id SERIAL PRIMARY KEY,
        session_id INTEGER REFERENCES pos_sessions(id) ON DELETE CASCADE,
        customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
        transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('sale', 'return', 'refund')),
        subtotal DECIMAL(10,2) NOT NULL,
        discount_amount DECIMAL(10,2) DEFAULT 0,
        tax_amount DECIMAL(10,2) DEFAULT 0,
        total_amount DECIMAL(10,2) NOT NULL,
        payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create POS transaction items table
    console.log('🛒 Creating POS transaction items table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS pos_transaction_items (
        id SERIAL PRIMARY KEY,
        transaction_id INTEGER REFERENCES pos_transactions(id) ON DELETE CASCADE,
        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
        quantity INTEGER NOT NULL,
        unit_type VARCHAR(20) DEFAULT 'sheet',
        unit_price DECIMAL(10,2) NOT NULL,
        discount_percentage DECIMAL(5,2) DEFAULT 0,
        total_price DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create payment modes table
    console.log('💳 Creating payment modes table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS payment_modes (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) NOT NULL,
        description TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Insert default payment modes
    await pool.query(`
      INSERT INTO payment_modes (name, description, is_active) VALUES 
      ('Cash', 'Cash payment', true),
      ('Card', 'Credit/Debit card payment', true),
      ('UPI', 'UPI payment', true),
      ('Net Banking', 'Online banking transfer', true),
      ('Cheque', 'Cheque payment', true),
      ('Other', 'Other payment methods', true)
      ON CONFLICT DO NOTHING
    `);

    // Create returns table
    console.log('↩️  Creating returns table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS returns (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
        original_sale_id INTEGER,
        return_reason TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        unit_price DECIMAL(10,2) NOT NULL,
        total_amount DECIMAL(10,2) NOT NULL,
        return_date DATE NOT NULL,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'processed')),
        approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        approved_at TIMESTAMP,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create sales billing table
    console.log('🧾 Creating sales billing table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sales_billing (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
        invoice_number VARCHAR(50) UNIQUE NOT NULL,
        invoice_date DATE NOT NULL,
        subtotal DECIMAL(10,2) NOT NULL,
        discount_amount DECIMAL(10,2) DEFAULT 0,
        tax_amount DECIMAL(10,2) DEFAULT 0,
        total_amount DECIMAL(10,2) NOT NULL,
        payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'partial', 'overdue')),
        payment_due_date DATE,
        notes TEXT,
        created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create sales billing items table
    console.log('📋 Creating sales billing items table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sales_billing_items (
        id SERIAL PRIMARY KEY,
        billing_id INTEGER REFERENCES sales_billing(id) ON DELETE CASCADE,
        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
        quantity INTEGER NOT NULL,
        unit_price DECIMAL(10,2) NOT NULL,
        total_price DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create indexes for better performance
    console.log('🔍 Creating indexes...');
    
    // Wastage indexes
    await pool.query('CREATE INDEX IF NOT EXISTS idx_wastage_records_product_id ON wastage_records(product_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_wastage_records_category_id ON wastage_records(category_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_wastage_records_date ON wastage_records(wastage_date)');
    
    // POS indexes
    await pool.query('CREATE INDEX IF NOT EXISTS idx_pos_sessions_user_id ON pos_sessions(user_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_pos_sessions_status ON pos_sessions(status)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_pos_transactions_session_id ON pos_transactions(session_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_pos_transactions_customer_id ON pos_transactions(customer_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_pos_transaction_items_transaction_id ON pos_transaction_items(transaction_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_pos_transaction_items_product_id ON pos_transaction_items(product_id)');
    
    // Returns indexes
    await pool.query('CREATE INDEX IF NOT EXISTS idx_returns_customer_id ON returns(customer_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_returns_product_id ON returns(product_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_returns_date ON returns(return_date)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_returns_status ON returns(status)');
    
    // Sales billing indexes
    await pool.query('CREATE INDEX IF NOT EXISTS idx_sales_billing_customer_id ON sales_billing(customer_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_sales_billing_invoice_number ON sales_billing(invoice_number)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_sales_billing_date ON sales_billing(invoice_date)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_sales_billing_items_billing_id ON sales_billing_items(billing_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_sales_billing_items_product_id ON sales_billing_items(product_id)');

    console.log('\n✅ Missing tables created successfully!');
    console.log('\n📋 Summary of tables created:');
    console.log('   • wastage_records - Track product wastage');
    console.log('   • wastage_categories - Categorize wastage types');
    console.log('   • pos_sessions - POS session management');
    console.log('   • pos_transactions - POS transaction records');
    console.log('   • pos_transaction_items - POS transaction line items');
    console.log('   • payment_modes - Payment method definitions');
    console.log('   • returns - Product return records');
    console.log('   • sales_billing - Sales billing and invoicing');
    console.log('   • sales_billing_items - Sales billing line items');
    console.log('   • All necessary indexes for performance');
    
  } catch (error) {
    console.error('❌ Error creating missing tables:', error);
    throw error;
  } finally {
    await pool.end();
  }
};

// Run the setup
createMissingTables()
  .then(() => {
    console.log('\n🎉 Missing tables setup completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Missing tables setup failed:', error);
    process.exit(1);
  });
