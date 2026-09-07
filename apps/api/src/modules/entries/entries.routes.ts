import { FastifyInstance } from 'fastify';
import { EntriesController } from './entries.controller';
import { createEntrySchema, updateEntrySchema } from '@travel-diary/contracts';

export async function entriesRoutes(fastify: FastifyInstance) {
  const controller = new EntriesController();

  // Rotas autenticadas
  fastify.register(async (protectedRoutes) => {
    protectedRoutes.addHook('preHandler', fastify.authenticate);

    protectedRoutes.post('/trips/:tripId/entries', {
      preValidation: async (request) => {
        request.body = createEntrySchema.parse(request.body);
      },
      handler: controller.create.bind(controller),
    });

    protectedRoutes.get('/entries/:id', {
      handler: controller.getById.bind(controller),
    });

    protectedRoutes.get('/trips/:tripId/entries', {
      handler: controller.listByTrip.bind(controller),
    });

    protectedRoutes.patch('/entries/:id', {
      preValidation: async (request) => {
        request.body = updateEntrySchema.parse(request.body);
      },
      handler: controller.update.bind(controller),
    });

    protectedRoutes.delete('/entries/:id', {
      handler: controller.delete.bind(controller),
    });
  });

  // Timeline com suporte a dono autenticado, visualização pública ou link compartilhado
  fastify.get('/trips/:tripId/timeline', {
    preHandler: async (request) => {
      if (request.headers.authorization) {
        try {
          await request.jwtVerify();
        } catch {
          // Segue como não autenticado para checagem de shareToken ou visibilidade pública
        }
      }
    },
    handler: controller.getTimeline.bind(controller),
  });
}
