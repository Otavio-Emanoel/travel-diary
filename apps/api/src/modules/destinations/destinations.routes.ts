import { FastifyInstance } from 'fastify';
import { DestinationsController } from './destinations.controller';
import { addDestinationSchema } from '@travel-diary/contracts';

export async function destinationsRoutes(fastify: FastifyInstance) {
  const controller = new DestinationsController();

  fastify.register(async (protectedRoutes) => {
    protectedRoutes.addHook('preHandler', fastify.authenticate);

    protectedRoutes.post('/trips/:tripId/destinations', {
      preValidation: async (request) => {
        request.body = addDestinationSchema.parse(request.body);
      },
      handler: controller.add.bind(controller),
    });

    protectedRoutes.get('/trips/:tripId/destinations', {
      handler: controller.list.bind(controller),
    });

    protectedRoutes.delete('/destinations/:id', {
      handler: controller.delete.bind(controller),
    });
  });
}
