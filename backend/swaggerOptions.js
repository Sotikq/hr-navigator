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
        {
          bearerAuth: [],
          ApiKeyAuth: []
        }
      ],
      tags: [
        {
          name: 'Auth',
          description: 'Аутентификация пользователей (регистрация, вход, профиль)'
        },
        {
          name: 'Courses',
          description: 'Управление курсами, модулями и уроками'
        },
        {
          name: 'Users',
          description: 'Управление данными профиля пользователей'
        }
      ],
      externalDocs: {
        description: 'GitHub Repository',
        url: 'https://github.com/your-repo/hr-navigator'
      }  
    },
    apis: ['./routes/*.js']
  };
  
  module.exports = options;
  