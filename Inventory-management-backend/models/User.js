const db = require('../config/database');
const bcrypt = require('bcryptjs');
const config = require('../config/app');

class User {
  // Create new user
  static async create(userData) {
    const { name, email, role, password } = userData;
    const hashedPassword = await bcrypt.hash(password, config.bcrypt.rounds);

    const result = await db.query(
      `INSERT INTO users (name, email, role, password_hash, created_at) 
       VALUES ($1, $2, $3, $4, NOW()) 
       RETURNING id, name, email, role, created_at`,
      [name, email, role, hashedPassword]
    );

    return result.rows[0];
  }

  // Find user by email
  static async findByEmail(email) {
    const result = await db.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0];
  }

  // Find user by ID
  static async findById(id) {
    const result = await db.query(
      'SELECT id, name, email, role, created_at FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  // Get all users
  static async findAll() {
    const result = await db.query(
      'SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC'
    );
    return result.rows;
  }

  // Update user
  static async update(id, userData) {
    const { name, email, role } = userData;
    const result = await db.query(
      `UPDATE users SET name = $1, email = $2, role = $3, updated_at = NOW() 
       WHERE id = $4 
       RETURNING id, name, email, role, created_at`,
      [name, email, role, id]
    );
    return result.rows[0];
  }

  // Delete user
  static async delete(id) {
    const result = await db.query('DELETE FROM users WHERE id = $1', [id]);
    return result.rowCount > 0;
  }

  // Verify password
  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }
}

module.exports = User;
