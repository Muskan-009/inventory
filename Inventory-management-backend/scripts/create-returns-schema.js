const db = require('../config/database');

async function createReturnsSchema() {
  try {
    console.log('Creating returns schema...');

    // Create returns table
    await db.query(`
      CREATE TABLE IF NOT EXISTS returns (
        id SERIAL PRIMARY KEY,
        original_transaction_id INTEGER REFERENCES pos_transactions(id),
        customer_id INTEGER REFERENCES customers(id),
        return_type VARCHAR(20) NOT NULL CHECK (return_type IN ('refund', 'exchange')),
        return_reason VARCHAR(255) NOT NULL,
        return_date DATE NOT NULL,
        total_amount DECIMAL(10,2) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
        notes TEXT,
        created_by INTEGER REFERENCES users(id) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create return_items table
    await db.query(`
      CREATE TABLE IF NOT EXISTS return_items (
        id SERIAL PRIMARY KEY,
        return_id INTEGER REFERENCES returns(id) ON DELETE CASCADE,
        product_id INTEGER REFERENCES products(id) NOT NULL,
        original_quantity INTEGER NOT NULL,
        returned_quantity INTEGER NOT NULL,
        unit_price DECIMAL(10,2) NOT NULL,
        reason VARCHAR(255),
        condition VARCHAR(20) DEFAULT 'good' CHECK (condition IN ('good', 'damaged', 'defective')),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create indexes for better performance
    await db.query('CREATE INDEX IF NOT EXISTS idx_returns_customer_id ON returns(customer_id)');
    await db.query('CREATE INDEX IF NOT EXISTS idx_returns_date ON returns(return_date)');
    await db.query('CREATE INDEX IF NOT EXISTS idx_returns_status ON returns(status)');
    await db.query('CREATE INDEX IF NOT EXISTS idx_return_items_return_id ON return_items(return_id)');
    await db.query('CREATE INDEX IF NOT EXISTS idx_return_items_product_id ON return_items(product_id)');

    console.log('Returns schema created successfully!');
  } catch (error) {
    console.error('Error creating returns schema:', error);
    throw error;
  }
}

// Run the script
if (require.main === module) {
  createReturnsSchema()
    .then(() => {
      console.log('Returns schema setup completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Returns schema setup failed:', error);
      process.exit(1);
    });
}

module.exports = createReturnsSchema;
