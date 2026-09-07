import { FastifyInstance } from 'fastify';
import { TripsController } from './trips.controller';
import { createTripSchema, updateTripSchema } from '@travel-diary/contracts';

export async function tripsRoutes(fastify: FastifyInstance) {
  const controller = new TripsController();

  // Rotas protegidas
  fastify.register(async (protectedRoutes) => {
    protectedRoutes.addHook('preHandler', fastify.authenticate);

    protectedRoutes.post('/', {
      preValidation: async (request) => {
        request.body = createTripSchema.parse(request.body);
      },
      handler: controller.create.bind(controller),
    });

    protectedRoutes.get('/', {
      handler: controller.list.bind(controller),
    });

    protectedRoutes.get('/:id', {
      handler: controller.getById.bind(controller),
    });

    protectedRoutes.patch('/:id', {
      preValidation: async (request) => {
        request.body = updateTripSchema.parse(request.body);
      },
      handler: controller.update.bind(controller),
    });

    protectedRoutes.delete('/:id', {
      handler: controller.delete.bind(controller),
    });

    protectedRoutes.post('/:id/share', {
      handler: controller.share.bind(controller),
    });
  });

  // Rota pública de visualização compartilhada
  fastify.get('/public/:shareToken', {
    handler: controller.getPublic.bind(controller),
  });
}
