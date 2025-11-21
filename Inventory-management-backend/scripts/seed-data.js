const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'inventory_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
});

const seedData = async () => {
  try {
    console.log('Seeding database with sample data...');

    // Clear existing data
    await pool.query('TRUNCATE TABLE sales, purchases, inventory, products, customers, vendors, users, notifications RESTART IDENTITY CASCADE');

    // Seed Users
    const hashedPassword = await bcrypt.hash('admin123', 12);
    const managerPassword = await bcrypt.hash('manager123', 12);
    const staffPassword = await bcrypt.hash('staff123', 12);

    await pool.query(`
      INSERT INTO users (name, email, role, password_hash) VALUES
      ('Super Admin', 'admin@inventory.com', 'super_admin', $1),
      ('Store Manager', 'manager@inventory.com', 'admin', $2),
      ('Sales Staff', 'staff@inventory.com', 'user', $3)
    `, [hashedPassword, managerPassword, staffPassword]);

    // Seed Vendors
    await pool.query(`
      INSERT INTO vendors (name, contact, email, gst_no, address) VALUES
      ('Tech Supplies Ltd', '9876543210', 'contact@techsupplies.com', '27AABCT1332L1ZZ', '123 Tech Street, Mumbai'),
      ('Electronics Hub', '9876543211', 'sales@electronicshub.com', '27AABCT1332L2ZZ', '456 Electronics Ave, Delhi'),
      ('Global Traders', '9876543212', 'info@globaltraders.com', '27AABCT1332L3ZZ', '789 Trade Center, Bangalore'),
      ('Smart Devices Co', '9876543213', 'orders@smartdevices.com', '27AABCT1332L4ZZ', '321 Smart Plaza, Chennai'),
      ('Digital World', '9876543214', 'support@digitalworld.com', '27AABCT1332L5ZZ', '654 Digital Street, Pune')
    `);

    // Seed Customers
    await pool.query(`
      INSERT INTO customers (name, contact, email, gst_no, address) VALUES
      ('Rajesh Kumar', '9123456789', 'rajesh@email.com', '27AABCT1332L6ZZ', '12 MG Road, Mumbai'),
      ('Priya Sharma', '9123456790', 'priya@email.com', NULL, '34 Park Street, Delhi'),
      ('Amit Patel', '9123456791', 'amit@email.com', '27AABCT1332L7ZZ', '56 Commercial Street, Bangalore'),
      ('Sunita Singh', '9123456792', 'sunita@email.com', NULL, '78 Market Road, Chennai'),
      ('Vikram Gupta', '9123456793', 'vikram@email.com', '27AABCT1332L8ZZ', '90 Business District, Pune'),
      ('Neha Agarwal', '9123456794', 'neha@email.com', NULL, '11 Shopping Complex, Hyderabad'),
      ('Ravi Verma', '9123456795', 'ravi@email.com', '27AABCT1332L9ZZ', '22 Tech Park, Noida'),
      ('Kavita Joshi', '9123456796', 'kavita@email.com', NULL, '33 City Center, Jaipur')
    `);

    // Seed Products
    const products = [
      ['Plywood MR Grade 18mm', 'PLY001', '8901234567001', 'Plywood', 1800, 18, 0, 'Moisture Resistant Plywood 18mm thickness'],
      ['Plywood BWR Grade 12mm', 'PLY002', '8901234567002', 'Plywood', 1500, 18, 0, 'Boiling Water Resistant Plywood 12mm thickness'],
      ['Plywood Marine Grade 19mm', 'PLY003', '8901234567003', 'Plywood', 2500, 18, 0, 'Marine Grade Plywood 19mm thickness for water resistance'],
      ['Commercial Plywood 16mm', 'PLY004', '8901234567004', 'Plywood', 1200, 18, 0, 'Commercial Grade Plywood 16mm thickness'],
      ['Plywood Shuttering 25mm', 'PLY005', '8901234567005', 'Plywood', 3000, 18, 0, 'Shuttering Plywood 25mm for construction use'],
      ['Blockboard 19mm', 'PLY006', '8901234567006', 'Plywood', 2200, 18, 0, 'Plywood Blockboard 19mm thickness'],
      ['Laminated Plywood 18mm', 'PLY007', '8901234567007', 'Plywood', 2800, 18, 0, 'Decorative Laminated Plywood 18mm thickness'],
      ['Plywood BWP Grade 20mm', 'PLY008', '8901234567008', 'Plywood', 2600, 18, 0, 'Boiling Waterproof Plywood 20mm thickness'],
      ['Calibrated Plywood 16mm', 'PLY009', '8901234567009', 'Plywood', 2000, 18, 0, 'Calibrated Plywood 16mm smooth surface'],
      ['Gurjan Plywood 19mm', 'PLY010', '8901234567010', 'Plywood', 3500, 18, 0, 'High-quality Gurjan core Plywood 19mm thickness']
    ];
    
    for (const product of products) {
      const result = await pool.query(`
        INSERT INTO products (name, sku, barcode, category, price, gst_rate, warranty_months, description)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id
      `, product);
      
      // Initialize inventory for each product
      const productId = result.rows[0].id;
      const initialStock = Math.floor(Math.random() * 50) + 10; // Random stock between 10-60
      await pool.query(
        'INSERT INTO inventory (product_id, stock_qty) VALUES ($1, $2)',
        [productId, initialStock]
      );
    }

    // Seed some purchases
    const purchaseData = [
      [1, 1, 5, 42000, '2024-01-15'],
      [2, 2, 10, 62000, '2024-01-20'],
      [3, 3, 8, 52000, '2024-02-01'],
      [1, 4, 3, 14000, '2024-02-10'],
      [4, 5, 50, 750, '2024-02-15'],
      [5, 6, 100, 280, '2024-03-01'],
      [2, 7, 15, 2300, '2024-03-05'],
      [3, 8, 25, 1100, '2024-03-10'],
      [4, 9, 12, 3200, '2024-03-15'],
      [5, 10, 8, 4200, '2024-03-20']
    ];

    for (const purchase of purchaseData) {
      const [vendorId, productId, qty, price, date] = purchase;
      const total = qty * price;
      
      await pool.query(`
        INSERT INTO purchases (vendor_id, product_id, qty, price, total, purchase_date)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [vendorId, productId, qty, price, total, date]);
      
      // Update inventory
      await pool.query(
        'UPDATE inventory SET stock_qty = stock_qty + $1 WHERE product_id = $2',
        [qty, productId]
      );
    }

    // Seed some sales
    const salesData = [
      [1, 1, 1, 45000, true, '2024-01-25'],
      [2, 2, 1, 65000, true, '2024-02-05'],
      [null, 5, 2, 800, false, '2024-02-20'], // Walk-in customer
      [3, 6, 5, 300, false, '2024-03-01'],
      [4, 7, 1, 2500, true, '2024-03-08'],
      [5, 8, 2, 1200, false, '2024-03-12'],
      [null, 9, 1, 3500, true, '2024-03-18'], // Walk-in customer
      [6, 10, 1, 4500, true, '2024-03-22'],
      [7, 11, 1, 12000, true, '2024-03-25'],
      [8, 12, 1, 4000, false, '2024-03-28']
    ];

    for (const sale of salesData) {
      const [customerId, productId, qty, price, gstApplied, date] = sale;
      
      // Get product GST rate
      const productResult = await pool.query(
        'SELECT gst_rate, warranty_months FROM products WHERE id = $1',
        [productId]
      );
      const product = productResult.rows[0];
      
      let total = qty * price;
      if (gstApplied && product.gst_rate > 0) {
        total = total + (total * product.gst_rate / 100);
      }
      
      const warrantyEndDate = product.warranty_months > 0 
        ? new Date(new Date(date).getTime() + (product.warranty_months * 30 * 24 * 60 * 60 * 1000))
        : null;
      
      await pool.query(`
        INSERT INTO sales (customer_id, product_id, qty, price, gst_applied, total, sale_date, warranty_end_date)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [customerId, productId, qty, price, gstApplied, total, date, warrantyEndDate]);
      
      // Update inventory
      await pool.query(
        'UPDATE inventory SET stock_qty = stock_qty - $1 WHERE product_id = $2',
        [qty, productId]
      );
    }

    // Seed notifications
    await pool.query(`
      INSERT INTO notifications (message, type) VALUES
      ('Low stock alert: Wireless Mouse quantity is below threshold', 'warning'),
      ('New purchase order received from Tech Supplies Ltd', 'info'),
      ('Monthly sales report is ready for review', 'info'),
      ('System backup completed successfully', 'success'),
      ('USB Cable Type-C is out of stock', 'error')
    `);

    console.log('✅ Database seeded successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await pool.end();
  }
};

// Run the seeding
seedData()
  .then(() => {
    console.log('Database seeding completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Database seeding failed:', error);
    process.exit(1);
  });
