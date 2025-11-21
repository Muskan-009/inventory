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

const fixPasswords = async () => {
  try {
    console.log('🔧 Fixing user passwords...');
    
    const client = await pool.connect();
    
    // Hash the passwords properly
    const adminHash = await bcrypt.hash('admin123', 12);
    const managerHash = await bcrypt.hash('manager123', 12);
    const staffHash = await bcrypt.hash('staff123', 12);
    
    // Update passwords
    await client.query(
      'UPDATE users SET password_hash = $1 WHERE email = $2',
      [adminHash, 'admin@inventory.com']
    );
    
    await client.query(
      'UPDATE users SET password_hash = $1 WHERE email = $2',
      [managerHash, 'manager@inventory.com']
    );
    
    await client.query(
      'UPDATE users SET password_hash = $1 WHERE email = $2',
      [staffHash, 'staff@inventory.com']
    );
    
    console.log('✅ Passwords updated successfully!');
    console.log('\n🔑 Login Credentials:');
    console.log('Super Admin: admin@inventory.com / admin123');
    console.log('Manager: manager@inventory.com / manager123');
    console.log('Staff: staff@inventory.com / staff123');
    
    // Test password verification
    const testUser = await client.query(
      'SELECT password_hash FROM users WHERE email = $1',
      ['admin@inventory.com']
    );
    
    const isValid = await bcrypt.compare('admin123', testUser.rows[0].password_hash);
    console.log(`\n🧪 Password verification test: ${isValid ? '✅ PASS' : '❌ FAIL'}`);
    
    client.release();
    
  } catch (error) {
    console.error('❌ Password fix failed:', error.message);
  } finally {
    await pool.end();
  }
};

fixPasswords();
