const options = {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'HR Navigator API',
        version: '1.0.0',
        description: 'Документация для API курсов, пользователей и авторизации'
      },
      servers: [
        {
          url: 'http://localhost:5000/api'
        }
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT'
          },
          ApiKeyAuth: {
            type: 'apiKey',
            in: 'header',
            name: 'x-api-key',
            description: 'API key for authentication'
          }
        },
        schemas: {
          Payment: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              user_id: { type: 'string' },
              course_id: { type: 'string' },
              amount: { type: 'number' },
              status: { type: 'string' },
              payment_method: { type: 'string' },
              created_at: { type: 'string', format: 'date-time' },
              updated_at: { type: 'string', format: 'date-time' },
              payment_expires_at: { type: 'string', format: 'date-time' },
              confirmed_at: { type: 'string', format: 'date-time' },
              phone: { type: 'string' },
              invoice_url: { type: 'string' },
              user_email: { type: 'string' },
              user_name: { type: 'string' },
              course_title: { type: 'string' },
              course_price: { type: 'number' }
            }
          }
        }
      },
      security: [
        { bearerAuth: [] },
        { ApiKeyAuth: [] }
      ]
    },
    apis: [
      './routes/*.js',
      './controllers/*.js'
    ]
  };
  
  module.exports = options;
  