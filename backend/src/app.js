const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const swaggerUi = require('swagger-ui-express');
const path = require('path');
require('dotenv').config();

const swaggerSpec = require('./config/swagger');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');

// Import routes
const authRoutes = require('./routes/authRoutes');
const customerRoutes = require('./routes/customerRoutes');
const jobRoutes = require('./routes/jobRoutes');
const trackingRoutes = require('./routes/trackingRoutes');
const batchRoutes = require('./routes/batchRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

// Import swagger annotations
require('./docs/swagger-annotations');

// Create Express app
const app = express();

// ==================== Middleware ====================

// Security with Swagger exceptions
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "http:", "https:"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "http:", "https:"],
        imgSrc: ["'self'", "data:", "http:", "https:", "blob:"],
        fontSrc: ["'self'", "data:", "http:", "https:"],
        connectSrc: ["'self'", "http:", "https:", "wss:"],
      },
    },
  })
);

// CORS - Read allowed origins from environment variable
const getAllowedOrigins = () => {
  // Get CORS origins from environment variable
  const corsOrigins = process.env.CORS_ORIGINS ? 
    process.env.CORS_ORIGINS : 
    'http://localhost:3000';
  
  // Split by comma and trim whitespace
  return corsOrigins.split(',').map(origin => origin.trim());
};

const allowedOrigins = getAllowedOrigins();

// Helper to check if origin is a Vercel preview URL
const isVercelPreview = (origin) => {
  return origin && origin.includes('.vercel.app');
};

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed list
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    
    // Check if it's a Vercel deployment
    if (isVercelPreview(origin)) {
      return callback(null, true);
    }
    
    // Log rejected origins in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`⚠️  CORS rejected origin: ${origin}`);
    }
    
    callback(new Error(`CORS policy: Origin ${origin} is not allowed`));
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));

// Log CORS configuration on startup
console.log('✅ CORS configured for origins:', allowedOrigins);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Rate limiting
app.use('/api/', apiLimiter);

// ==================== Routes ====================

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'ShipEASE API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/tracking', trackingRoutes);
app.use('/api/batches', batchRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationRoutes);

// Swagger Documentation (Multiple paths for convenience)
const swaggerOptions = {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'ShipEASE API Documentation',
  swaggerOptions: {
    persistAuthorization: true,
  },
};

// Swagger UI - Enhanced setup for Vercel serverless
const swaggerUiAssetPath = require('swagger-ui-dist').getAbsoluteFSPath();

// Enhanced swagger options with custom URLs
const enhancedSwaggerOptions = {
  ...swaggerOptions,
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; }
  `,
  customSiteTitle: 'ShipEASE API Documentation',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    deepLinking: true,
    displayOperationId: false,
    defaultModelsExpandDepth: 1,
    defaultModelExpandDepth: 1,
    // Fix API URL to use current domain instead of localhost
    url: '/api/docs.json',
    validatorUrl: null,
  },
  customJs: '/swagger-static/swagger-ui-bundle.js',
  customCssUrl: '/swagger-static/swagger-ui.css',
};

// Setup Swagger UI with proper asset serving
app.use('/swagger-static', express.static(swaggerUiAssetPath));
app.use('/api/docs', swaggerUi.serve);
app.get('/api/docs', swaggerUi.setup(swaggerSpec, enhancedSwaggerOptions));

// Alternative routes
app.get('/api-docs', (req, res) => {
  res.redirect('/api/docs');
});

app.get('/docs', (req, res) => {
  res.redirect('/api/docs');
});

console.log('✅ Swagger UI configured for serverless with asset path:', swaggerUiAssetPath);

// Swagger JSON endpoint (always available)
app.get('/api/docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

app.get('/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Root route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to ShipEASE API',
    version: '1.0.0',
    documentation: '/api/docs',
    endpoints: {
      docs: '/api/docs',
      apiDocs: '/api-docs (redirects to /api/docs)',
      docs2: '/docs (redirects to /api/docs)',
      swaggerJson: '/api/docs.json',
      health: '/health',
    },
    links: {
      documentation: `${req.protocol}://${req.get('host')}/api/docs`,
      health: `${req.protocol}://${req.get('host')}/health`,
    },
  });
});

// ==================== Error Handling ====================

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

module.exports = app;

