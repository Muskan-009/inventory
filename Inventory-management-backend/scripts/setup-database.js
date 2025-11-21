const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'inventory_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
});

const createTables = async () => {
  try {
    console.log('Creating database tables...');

    // Users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        role VARCHAR(20) NOT NULL CHECK (role IN ('super_admin', 'admin', 'user')),
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Vendors table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS vendors (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        contact VARCHAR(15) NOT NULL,
        email VARCHAR(100),
        gst_no VARCHAR(15),
        address TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Customers table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        contact VARCHAR(15) NOT NULL,
        email VARCHAR(100),
        gst_no VARCHAR(15),
        address TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Products table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        sku VARCHAR(50) UNIQUE NOT NULL,
        barcode VARCHAR(50),
        category VARCHAR(100) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        gst_rate DECIMAL(5,2) DEFAULT 0,
        warranty_months INTEGER DEFAULT 0,
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Purchases table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS purchases (
        id SERIAL PRIMARY KEY,
        vendor_id INTEGER NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        qty INTEGER NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        total DECIMAL(10,2) NOT NULL,
        purchase_date TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Sales table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sales (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        qty INTEGER NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        gst_applied BOOLEAN DEFAULT FALSE,
        total DECIMAL(10,2) NOT NULL,
        sale_date TIMESTAMP NOT NULL,
        warranty_end_date TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Inventory table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS inventory (
        product_id INTEGER PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
        stock_qty INTEGER NOT NULL DEFAULT 0,
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Notifications table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        message TEXT NOT NULL,
        type VARCHAR(20) NOT NULL CHECK (type IN ('info', 'warning', 'error', 'success')),
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Inventory adjustments table (for audit trail)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS inventory_adjustments (
        id SERIAL PRIMARY KEY,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        adjustment INTEGER NOT NULL,
        reason TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create indexes for better performance
    await pool.query('CREATE INDEX IF NOT EXISTS idx_purchases_vendor_id ON purchases(vendor_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_purchases_product_id ON purchases(product_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_purchases_date ON purchases(purchase_date)');
    
    await pool.query('CREATE INDEX IF NOT EXISTS idx_sales_customer_id ON sales(customer_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_sales_product_id ON sales(product_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(sale_date)');
    
    await pool.query('CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_products_category ON products(category)');

    console.log('✅ Database tables created successfully!');
    
  } catch (error) {
    console.error('❌ Error creating tables:', error);
    throw error;
  } finally {
    await pool.end();
  }
};

// Run the setup
createTables()
  .then(() => {
    console.log('Database setup completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Database setup failed:', error);
    process.exit(1);
  });
