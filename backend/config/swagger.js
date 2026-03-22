const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Junkio Expense Tracker API',
            version: '1.0.0',
            description: 'API documentation for Junkio Expense Tracker. Tip: login first, then use the token in Authorize (BearerAuth).'
        },
        // Use relative server so Swagger works with both localhost and 127.0.0.1 (avoid CORS host mismatch).
        servers: [{ url: '/' }],
        components: {
            securitySchemes: {
                bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }
            }
        },
        security: [{ bearerAuth: [] }]
    },
    apis: ['./routes/*.js']
};

module.exports = swaggerJsdoc(options);
