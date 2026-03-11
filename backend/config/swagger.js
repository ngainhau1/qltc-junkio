const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Junkio Expense Tracker API',
            version: '1.0.0',
            description: 'API documentation for Junkio Expense Tracker'
        },
        servers: [{ url: 'http://localhost:5000' }],
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
