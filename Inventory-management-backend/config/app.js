require('dotenv').config();

// Validate critical environment variables
const jwtSecret = process.env.JWT_SECRET || 'fallback_secret_key_change_in_production';
if (!process.env.JWT_SECRET) {
  console.warn('⚠️  WARNING: JWT_SECRET not set in environment variables. Using fallback secret.');
  console.warn('⚠️  This will cause authentication issues if tokens were created with a different secret.');
  console.warn('⚠️  Please set JWT_SECRET in your .env file.');
}

if (!process.env.DB_PASSWORD && process.env.NODE_ENV !== 'test') {
  console.warn('⚠️  WARNING: DB_PASSWORD not set. Using empty string. This may cause connection issues.');
}

module.exports = {
  port: process.env.PORT || 5000,
  httpsPort: process.env.HTTPS_PORT || 5443,
  nodeEnv: process.env.NODE_ENV || 'development',
  enableHttps: process.env.ENABLE_HTTPS === 'true' || false,
  jwt: {
    secret: jwtSecret,
    expiresIn: process.env.JWT_EXPIRE || '7d'
  },
  bcrypt: {
    rounds: parseInt(process.env.BCRYPT_ROUNDS) || 12
  },
  rateLimit: {
    windowMs: (parseInt(process.env.RATE_LIMIT_WINDOW) || 15) * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX) || (process.env.NODE_ENV === 'development' ? 1000 : 100) // 1000 for dev, 100 for production
  }
};
