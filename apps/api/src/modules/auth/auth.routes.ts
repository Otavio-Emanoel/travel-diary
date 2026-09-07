import { FastifyInstance } from 'fastify';
import { AuthController } from './auth.controller';
import { registerSchema, loginSchema } from '@travel-diary/contracts';

export async function authRoutes(fastify: FastifyInstance) {
  const controller = new AuthController();

  fastify.post('/register', {
    preValidation: async (request) => {
      request.body = registerSchema.parse(request.body);
    },
    handler: controller.register.bind(controller),
  });

  fastify.post('/login', {
    preValidation: async (request) => {
      request.body = loginSchema.parse(request.body);
    },
    handler: controller.login.bind(controller),
  });

  fastify.post('/refresh', {
    handler: controller.refresh.bind(controller),
  });

  fastify.post('/logout', {
    handler: controller.logout.bind(controller),
  });

  fastify.get('/me', {
    preHandler: [fastify.authenticate],
    handler: controller.me.bind(controller),
  });
}
