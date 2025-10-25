const swaggerJsdoc = require('swagger-jsdoc');
const path = require('path');

// Dynamic server URLs based on environment
const getServers = () => {
  const servers = [];
  
  // Add production URL from environment variable (Vercel deployment)
  if (process.env.VERCEL_URL) {
    servers.push({
      url: `https://${process.env.VERCEL_URL}`,
      description: 'Production server (Current Deployment)',
    });
  }
  
  // Add custom production URL if set
  if (process.env.PRODUCTION_URL) {
    servers.push({
      url: process.env.PRODUCTION_URL,
      description: 'Production server',
    });
  }
  
  // Always add localhost for development
  servers.push({
    url: process.env.API_URL || 'http://localhost:5000',
    description: 'Development server',
  });
  
  return servers;
};

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ShipEASE API Documentation',
      version: '1.0.0',
      description: 'Comprehensive API documentation for the ShipEASE shipping management system. This API powers the ShipEASE delivery management platform.',
      contact: {
        name: 'ShipEASE Support',
        email: 'support@shipease.com',
      },
      license: {
        name: 'Proprietary',
      },
    },
    servers: getServers(),
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            message: {
              type: 'string',
              example: 'Error message',
            },
            errors: {
              type: 'array',
              items: {
                type: 'object',
              },
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            email: {
              type: 'string',
              format: 'email',
            },
            name: {
              type: 'string',
            },
            role: {
              type: 'string',
              enum: ['superadmin', 'admin', 'warehouse', 'driver', 'delivery_agent', 'user'],
            },
            avatarUrl: {
              type: 'string',
              nullable: true,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Customer: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            name: {
              type: 'string',
            },
            email: {
              type: 'string',
              format: 'email',
              nullable: true,
            },
            phone: {
              type: 'string',
              nullable: true,
            },
            address: {
              type: 'string',
              nullable: true,
            },
            customerType: {
              type: 'string',
              enum: ['Individual', 'Company'],
            },
            notes: {
              type: 'string',
              nullable: true,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Job: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            trackingId: {
              type: 'string',
              example: 'SHIP-20241010-A3B9F',
            },
            customerId: {
              type: 'string',
              format: 'uuid',
            },
            pickupAddress: {
              type: 'string',
            },
            deliveryAddress: {
              type: 'string',
            },
            status: {
              type: 'string',
              enum: [
                'Pending Collection',
                'Assigned',
                'En Route to Customer',
                'Collected',
                'Returning to Warehouse',
                'At Warehouse',
                'Batched',
                'Shipped',
                'In Transit',
                'Arrived at Destination',
                'Out for Delivery',
                'Delivered',
              ],
            },
            priority: {
              type: 'string',
              enum: ['Standard', 'Express', 'Urgent'],
            },
            weight: {
              type: 'number',
              format: 'float',
              nullable: true,
            },
            value: {
              type: 'number',
              format: 'float',
              nullable: true,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Pagination: {
          type: 'object',
          properties: {
            page: {
              type: 'integer',
              example: 1,
            },
            limit: {
              type: 'integer',
              example: 20,
            },
            total: {
              type: 'integer',
              example: 100,
            },
            totalPages: {
              type: 'integer',
              example: 5,
            },
            hasNext: {
              type: 'boolean',
              example: true,
            },
            hasPrev: {
              type: 'boolean',
              example: false,
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'Authentication and authorization endpoints',
      },
      {
        name: 'Customers',
        description: 'Customer management endpoints',
      },
      {
        name: 'Jobs',
        description: 'Job management endpoints',
      },
      {
        name: 'Tracking',
        description: 'Public shipment tracking',
      },
    ],
  },
  // Use absolute paths for Vercel serverless compatibility
  apis: [
    path.join(__dirname, '../routes/*.js'),
    path.join(__dirname, '../controllers/*.js'),
  ],
};

// Generate swagger spec with error handling
let swaggerSpec;
try {
  swaggerSpec = swaggerJsdoc(options);
} catch (error) {
  console.error('❌ Error generating Swagger spec:', error.message);
  // Fallback to basic spec without route annotations
  swaggerSpec = {
    openapi: '3.0.0',
    info: options.definition.info,
    servers: options.definition.servers || getServers(),
    components: options.definition.components,
    tags: options.definition.tags,
    paths: {}, // Empty paths - routes won't be documented but won't crash
  };
}

module.exports = swaggerSpec;


