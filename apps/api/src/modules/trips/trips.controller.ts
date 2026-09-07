import { FastifyRequest, FastifyReply } from 'fastify';
import { TripsService } from './trips.service';
import { CreateTripInput, UpdateTripInput } from '@travel-diary/contracts';

export class TripsController {
  constructor(private readonly service: TripsService = new TripsService()) {}

  async create(
    request: FastifyRequest<{ Body: CreateTripInput }>,
    reply: FastifyReply
  ) {
    const userId = (request.user as any).sub;
    const trip = await this.service.createTrip(userId, request.body);

    return reply.status(201).send({
      success: true,
      data: trip,
    });
  }

  async list(
    request: FastifyRequest<{
      Querystring: { status?: string; limit?: number; offset?: number };
    }>,
    reply: FastifyReply
  ) {
    const userId = (request.user as any).sub;
    const trips = await this.service.listTrips(userId, request.query);

    return reply.status(200).send({
      success: true,
      data: trips,
    });
  }

  async getById(
    request: FastifyRequest<{
      Params: { id: string };
      Querystring: { shareToken?: string };
    }>,
    reply: FastifyReply
  ) {
    const userId = (request.user as any)?.sub;
    const trip = await this.service.getTripById(
      request.params.id,
      userId,
      request.query.shareToken
    );

    return reply.status(200).send({
      success: true,
      data: trip,
    });
  }

  async update(
    request: FastifyRequest<{
      Params: { id: string };
      Body: UpdateTripInput;
    }>,
    reply: FastifyReply
  ) {
    const userId = (request.user as any).sub;
    const trip = await this.service.updateTrip(
      request.params.id,
      userId,
      request.body
    );

    return reply.status(200).send({
      success: true,
      data: trip,
    });
  }

  async delete(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    const userId = (request.user as any).sub;
    await this.service.deleteTrip(request.params.id, userId);

    return reply.status(204).send();
  }

  async share(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    const userId = (request.user as any).sub;
    const result = await this.service.generateShareLink(request.params.id, userId);

    return reply.status(200).send({
      success: true,
      data: result,
    });
  }

  async getPublic(
    request: FastifyRequest<{ Params: { shareToken: string } }>,
    reply: FastifyReply
  ) {
    const trip = await this.service.getPublicTrip(request.params.shareToken);

    return reply.status(200).send({
      success: true,
      data: trip,
    });
  }
}
