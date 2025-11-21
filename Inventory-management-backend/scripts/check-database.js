const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'inventory_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
});

const checkDatabase = async () => {
  try {
    console.log('🔍 Checking database connection...');
    
    // Test connection
    const client = await pool.connect();
    console.log('✅ Database connection successful');
    
    // Check if tables exist
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log('\n📋 Tables in database:');
    if (tablesResult.rows.length === 0) {
      console.log('❌ No tables found! Database is empty.');
      console.log('💡 Please run the database setup script.');
    } else {
      tablesResult.rows.forEach(row => {
        console.log(`  - ${row.table_name}`);
      });
    }
    
    // Check users table
    try {
      const usersResult = await client.query('SELECT COUNT(*) FROM users');
      console.log(`\n👥 Users in database: ${usersResult.rows[0].count}`);
      
      if (usersResult.rows[0].count > 0) {
        const usersList = await client.query('SELECT id, name, email, role FROM users');
        console.log('\n📝 User accounts:');
        usersList.rows.forEach(user => {
          console.log(`  - ${user.name} (${user.email}) - Role: ${user.role}`);
        });
      }
    } catch (error) {
      console.log('❌ Users table does not exist or is empty');
    }
    
    // Check products table
    try {
      const productsResult = await client.query('SELECT COUNT(*) FROM products');
      console.log(`\n📦 Products in database: ${productsResult.rows[0].count}`);
    } catch (error) {
      console.log('❌ Products table does not exist');
    }
    
    // Check inventory table
    try {
      const inventoryResult = await client.query('SELECT COUNT(*) FROM inventory');
      console.log(`📊 Inventory records: ${inventoryResult.rows[0].count}`);
    } catch (error) {
      console.log('❌ Inventory table does not exist');
    }
    
    client.release();
    
  } catch (error) {
    console.error('❌ Database check failed:', error.message);
    
    if (error.code === '3D000') {
      console.log('\n💡 Database "inventory_db" does not exist!');
      console.log('Please create the database first:');
      console.log('1. Open pgAdmin');
      console.log('2. Create database named "inventory_db"');
      console.log('3. Run the database_backup.sql script');
    }
  } finally {
    await pool.end();
  }
};

checkDatabase();
