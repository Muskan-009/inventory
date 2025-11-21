const jwt = require('jsonwebtoken');
const config = require('../config/app');
const db = require('../config/database');

// Verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access token required' 
      });
    }

    const decoded = jwt.verify(token, config.jwt.secret);
    
    // Get user from database
    const result = await db.query(
      'SELECT id, name, email, role FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token' 
      });
    }

    req.user = result.rows[0];
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Invalid or expired token';
    if (error.name === 'JsonWebTokenError') {
      if (error.message === 'invalid signature') {
        errorMessage = 'Token signature is invalid. Please log in again.';
      } else if (error.message === 'jwt malformed') {
        errorMessage = 'Token format is invalid. Please log in again.';
      }
    } else if (error.name === 'TokenExpiredError') {
      errorMessage = 'Token has expired. Please log in again.';
    }
    
    return res.status(403).json({ 
      success: false, 
      message: errorMessage 
    });
  }
};

// Check user roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Insufficient permissions' 
      });
    }

    next();
  };
};

module.exports = {
  authenticateToken,
  authorize
};
