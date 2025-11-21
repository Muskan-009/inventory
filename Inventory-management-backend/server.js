const express = require('express');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const config = require('./config/app');

// Initialize express app
const app = express();

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  // Skip rate limiting for localhost in development
  skip: (req) => {
    if (config.nodeEnv === 'development') {
      const ip = req.ip || req.connection.remoteAddress;
      return ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1';
    }
    return false;
  }
});
app.use('/api/', limiter);

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] // Replace with your production domain
    : ['http://localhost:3000', 'http://127.0.0.1:3000', 'https://localhost:3000', 'https://127.0.0.1:3000'],
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Logging middleware
if (config.nodeEnv !== 'test') {
  app.use(morgan('combined'));
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv
  });
});

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/vendors', require('./routes/vendors'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/products', require('./routes/products'));
app.use('/api/purchases', require('./routes/purchases'));
app.use('/api/sales', require('./routes/sales'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/wastage', require('./routes/wastage'));
app.use('/api/sales-billing', require('./routes/salesBilling'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/pos', require('./routes/pos'));
app.use('/api/returns', require('./routes/returns'));

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  
  // Default error
  let statusCode = 500;
  let message = 'Internal server error';
  
  // Handle specific error types
  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation error';
  } else if (error.name === 'UnauthorizedError') {
    statusCode = 401;
    message = 'Unauthorized';
  } else if (error.code === 'ECONNREFUSED') {
    statusCode = 503;
    message = 'Database connection failed';
  }
  
  res.status(statusCode).json({
    success: false,
    message,
    ...(config.nodeEnv === 'development' && { stack: error.stack })
  });
});

// Get local IP address
const getLocalIP = () => {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip internal (loopback) and non-IPv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
};

// Start server
const PORT = process.env.PORT || 5000;
const HTTPS_PORT = config.httpsPort;
const NODE_ENV = process.env.NODE_ENV || "development";
const ENABLE_HTTPS = config.enableHttps;

// Conditionally choose host based on environment
const HOST = NODE_ENV === "development" ? "localhost" : "0.0.0.0";
const LOCAL_IP = getLocalIP();

// Start HTTP server
const httpServer = http.createServer(app);
httpServer.listen(PORT, HOST === "localhost" ? "0.0.0.0" : HOST, () => {
  console.log(`🚀 HTTP Server running in ${NODE_ENV} mode`);
  console.log(`📊 Health check:`);
  console.log(`   - http://localhost:${PORT}/health`);
  if (LOCAL_IP !== 'localhost') {
    console.log(`   - http://${LOCAL_IP}:${PORT}/health`);
  }
  console.log(`🔗 API Base URL:`);
  console.log(`   - http://localhost:${PORT}/api`);
  if (LOCAL_IP !== 'localhost') {
    console.log(`   - http://${LOCAL_IP}:${PORT}/api`);
  }
});

// Start HTTPS server if enabled
let httpsServer = null;
if (ENABLE_HTTPS) {
  const certPath = path.join(__dirname, 'certs', 'cert.pem');
  const keyPath = path.join(__dirname, 'certs', 'key.pem');
  
  if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
    const httpsOptions = {
      cert: fs.readFileSync(certPath),
      key: fs.readFileSync(keyPath)
    };
    
    httpsServer = https.createServer(httpsOptions, app);
    httpsServer.listen(HTTPS_PORT, HOST === "localhost" ? "0.0.0.0" : HOST, () => {
      console.log(`\n🔒 HTTPS Server running in ${NODE_ENV} mode`);
      console.log(`📊 Health check:`);
      console.log(`   - https://localhost:${HTTPS_PORT}/health`);
      if (LOCAL_IP !== 'localhost') {
        console.log(`   - https://${LOCAL_IP}:${HTTPS_PORT}/health`);
      }
      console.log(`🔗 API Base URL:`);
      console.log(`   - https://localhost:${HTTPS_PORT}/api`);
      if (LOCAL_IP !== 'localhost') {
        console.log(`   - https://${LOCAL_IP}:${HTTPS_PORT}/api`);
      }
      console.log(`\n✅ Share HTTPS URL with others:`);
      if (LOCAL_IP !== 'localhost') {
        console.log(`   https://${LOCAL_IP}:${HTTPS_PORT}`);
      } else {
        console.log(`   https://localhost:${HTTPS_PORT}`);
      }
    });
  } else {
    console.warn(`⚠️  HTTPS enabled but certificates not found!`);
    console.warn(`   Certificate path: ${certPath}`);
    console.warn(`   Key path: ${keyPath}`);
    console.warn(`   Run: npm run generate-ssl to create certificates`);
    console.warn(`   Or set ENABLE_HTTPS=false in .env to disable HTTPS`);
  }
} else {
  console.log(`ℹ️  HTTPS is disabled. Set ENABLE_HTTPS=true in .env to enable`);
}
// Graceful shutdown
const shutdown = () => {
  console.log('Shutting down gracefully...');
  httpServer.close(() => {
    console.log('HTTP server closed');
    if (httpsServer) {
      httpsServer.close(() => {
        console.log('HTTPS server closed');
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
  });
};

process.on('SIGTERM', () => {
  console.log('SIGTERM received.');
  shutdown();
});

process.on('SIGINT', () => {
  console.log('SIGINT received.');
  shutdown();
});

module.exports = app;
