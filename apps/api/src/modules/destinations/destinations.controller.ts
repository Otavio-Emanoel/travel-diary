import { FastifyRequest, FastifyReply } from 'fastify';
import { DestinationsService } from './destinations.service';
import { AddDestinationInput } from '@travel-diary/contracts';

export class DestinationsController {
  constructor(private readonly service: DestinationsService = new DestinationsService()) {}

  async add(
    request: FastifyRequest<{
      Params: { tripId: string };
      Body: AddDestinationInput;
    }>,
    reply: FastifyReply
  ) {
    const userId = (request.user as any).sub;
    const dest = await this.service.addDestination(
      request.params.tripId,
      userId,
      request.body
    );

    return reply.status(201).send({
      success: true,
      data: dest,
    });
  }

  async list(
    request: FastifyRequest<{ Params: { tripId: string } }>,
    reply: FastifyReply
  ) {
    const list = await this.service.listDestinations(request.params.tripId);

    return reply.status(200).send({
      success: true,
      data: list,
    });
  }

  async delete(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    const userId = (request.user as any).sub;
    await this.service.deleteDestination(request.params.id, userId);

    return reply.status(204).send();
  }
}
