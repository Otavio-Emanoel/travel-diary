import { FastifyRequest, FastifyReply } from 'fastify';
import { MediaService } from './media.service';
import { RequestUploadUrlInput } from '@travel-diary/contracts';

export class MediaController {
  constructor(private readonly service: MediaService = new MediaService()) {}

  async requestUploadUrl(
    request: FastifyRequest<{ Body: RequestUploadUrlInput }>,
    reply: FastifyReply
  ) {
    const userId = (request.user as any).sub;
    const result = await this.service.requestUploadUrl(userId, request.body);

    return reply.status(201).send({
      success: true,
      data: result,
    });
  }

  async confirm(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    const userId = (request.user as any).sub;
    const media = await this.service.confirmUpload(request.params.id, userId);

    return reply.status(200).send({
      success: true,
      data: media,
    });
  }

  async delete(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    const userId = (request.user as any).sub;
    await this.service.deleteMedia(request.params.id, userId);

    return reply.status(204).send();
  }
}
