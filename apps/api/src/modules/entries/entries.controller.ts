import { FastifyRequest, FastifyReply } from 'fastify';
import { EntriesService } from './entries.service';
import { CreateEntryInput, UpdateEntryInput } from '@travel-diary/contracts';

export class EntriesController {
  constructor(private readonly service: EntriesService = new EntriesService()) {}

  async create(
    request: FastifyRequest<{
      Params: { tripId: string };
      Body: CreateEntryInput;
    }>,
    reply: FastifyReply
  ) {
    const userId = (request.user as any).sub;
    const entry = await this.service.createEntry(
      request.params.tripId,
      userId,
      request.body
    );

    return reply.status(201).send({
      success: true,
      data: entry,
    });
  }

  async getById(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    const userId = (request.user as any)?.sub;
    const entry = await this.service.getEntryById(request.params.id, userId);

    return reply.status(200).send({
      success: true,
      data: entry,
    });
  }

  async listByTrip(
    request: FastifyRequest<{ Params: { tripId: string } }>,
    reply: FastifyReply
  ) {
    const userId = (request.user as any)?.sub;
    const list = await this.service.listEntriesByTrip(request.params.tripId, userId);

    return reply.status(200).send({
      success: true,
      data: list,
    });
  }

  async getTimeline(
    request: FastifyRequest<{
      Params: { tripId: string };
      Querystring: { shareToken?: string };
    }>,
    reply: FastifyReply
  ) {
    const userId = (request.user as any)?.sub;
    const timeline = await this.service.getTimeline(
      request.params.tripId,
      userId,
      request.query.shareToken
    );

    return reply.status(200).send({
      success: true,
      data: timeline,
    });
  }

  async update(
    request: FastifyRequest<{
      Params: { id: string };
      Body: UpdateEntryInput;
    }>,
    reply: FastifyReply
  ) {
    const userId = (request.user as any).sub;
    const entry = await this.service.updateEntry(
      request.params.id,
      userId,
      request.body
    );

    return reply.status(200).send({
      success: true,
      data: entry,
    });
  }

  async delete(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    const userId = (request.user as any).sub;
    await this.service.deleteEntry(request.params.id, userId);

    return reply.status(204).send();
  }
}
