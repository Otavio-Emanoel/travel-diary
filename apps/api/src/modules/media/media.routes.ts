import { FastifyInstance } from 'fastify';
import { MediaController } from './media.controller';
import { requestUploadUrlSchema } from '@travel-diary/contracts';

export async function mediaRoutes(fastify: FastifyInstance) {
  const controller = new MediaController();

  fastify.register(async (protectedRoutes) => {
    protectedRoutes.addHook('preHandler', fastify.authenticate);

    protectedRoutes.post('/upload-url', {
      preValidation: async (request) => {
        request.body = requestUploadUrlSchema.parse(request.body);
      },
      handler: controller.requestUploadUrl.bind(controller),
    });

    protectedRoutes.post('/:id/confirm', {
      handler: controller.confirm.bind(controller),
    });

    protectedRoutes.delete('/:id', {
      handler: controller.delete.bind(controller),
    });
  });
}
