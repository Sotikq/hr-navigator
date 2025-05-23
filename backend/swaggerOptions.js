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
  