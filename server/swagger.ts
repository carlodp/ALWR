import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ALWR API Documentation',
      version: '1.0.0',
      description: 'America Living Will Registry - Secure 24/7 online service for storing living wills and advance healthcare directives',
      contact: {
        name: 'ALWR Support',
        url: 'https://www.alwr.org',
      },
    },
    servers: [
      {
        url: '/api',
        description: 'API Base URL',
      },
    ],
    components: {
      securitySchemes: {
        sessionAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'connect.sid',
          description: 'Session cookie for authentication',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'User ID' },
            email: { type: 'string', format: 'email' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            role: {
              type: 'string',
              enum: ['customer', 'admin', 'agent', 'reseller', 'super_admin'],
            },
            accountStatus: {
              type: 'string',
              enum: ['active', 'expired'],
              description: 'User account status',
            },
            emailVerified: { type: 'boolean' },
            twoFactorEnabled: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            lastLogin: { type: 'string', format: 'date-time', nullable: true },
          },
          required: ['id', 'email', 'role', 'accountStatus'],
        },
        Customer: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            userId: { type: 'string' },
            dateOfBirth: { type: 'string', format: 'date' },
            address: { type: 'string' },
            city: { type: 'string' },
            state: { type: 'string' },
            zipCode: { type: 'string' },
            country: { type: 'string' },
            primaryContact: { type: 'string' },
            emergencyContacts: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  relationship: { type: 'string' },
                  phone: { type: 'string' },
                },
              },
            },
            profileImage: { type: 'string', nullable: true },
          },
        },
        Document: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            customerId: { type: 'string' },
            fileName: { type: 'string' },
            fileType: { type: 'string' },
            fileSize: { type: 'integer' },
            uploadedAt: { type: 'string', format: 'date-time' },
            versions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  versionNumber: { type: 'integer' },
                  uploadedAt: { type: 'string', format: 'date-time' },
                  fileSize: { type: 'integer' },
                },
              },
            },
          },
        },
        Subscription: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            customerId: { type: 'string' },
            planName: { type: 'string' },
            status: {
              type: 'string',
              enum: ['active', 'inactive', 'cancelled', 'pending', 'trial'],
            },
            startDate: { type: 'string', format: 'date' },
            renewalDate: { type: 'string', format: 'date' },
            price: { type: 'number', format: 'decimal' },
            stripeSubscriptionId: { type: 'string' },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            error: { type: 'string', nullable: true },
          },
          required: ['message'],
        },
      },
    },
    security: [
      {
        sessionAuth: [],
      },
    ],
  },
  apis: ['./server/routes.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
