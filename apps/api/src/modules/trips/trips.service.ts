import crypto from 'crypto';
import { TripsRepository } from './trips.repository';
import { CreateTripInput, UpdateTripInput, TripSummary } from '@travel-diary/contracts';
import { NotFoundError, ForbiddenError } from '../../core/errors/app-error';

export class TripsService {
  constructor(private readonly repository: TripsRepository = new TripsRepository()) {}

  async createTrip(userId: string, input: CreateTripInput) {
    const tripId = crypto.randomUUID();
    const trip = await this.repository.create({
      id: tripId,
      userId,
      title: input.title,
      description: input.description,
      startDate: input.startDate,
      endDate: input.endDate,
      status: input.status,
      visibility: input.visibility,
      coverMediaId: input.coverMediaId,
    });

    return trip;
  }

  async listTrips(
    userId: string,
    query: { status?: string; limit?: number; offset?: number }
  ) {
    return this.repository.listByUser(userId, query);
  }

  async getTripById(tripId: string, userId?: string, shareToken?: string) {
    const trip = await this.repository.findById(tripId);
    if (!trip) {
      throw new NotFoundError('Viagem não encontrada');
    }

    // Valida autorização: dono, link público ou viagem pública
    const isOwner = userId && trip.userId === userId;
    const isPublic = trip.visibility === 'PUBLIC';
    const hasValidShare = shareToken && trip.shareToken === shareToken;

    if (!isOwner && !isPublic && !hasValidShare) {
      throw new ForbiddenError('Você não tem permissão para visualizar esta viagem');
    }

    return trip;
  }

  async updateTrip(tripId: string, userId: string, input: UpdateTripInput) {
    const trip = await this.repository.findById(tripId);
    if (!trip) {
      throw new NotFoundError('Viagem não encontrada');
    }

    if (trip.userId !== userId) {
      throw new ForbiddenError('Apenas o criador da viagem pode editá-la');
    }

    const updated = await this.repository.update(tripId, {
      title: input.title,
      description: input.description,
      startDate: input.startDate,
      endDate: input.endDate,
      status: input.status,
      visibility: input.visibility,
      coverMediaId: input.coverMediaId,
    });

    return updated;
  }

  async deleteTrip(tripId: string, userId: string): Promise<void> {
    const trip = await this.repository.findById(tripId);
    if (!trip) {
      throw new NotFoundError('Viagem não encontrada');
    }

    if (trip.userId !== userId) {
      throw new ForbiddenError('Apenas o criador da viagem pode excluí-la');
    }

    await this.repository.softDelete(tripId);
  }

  async generateShareLink(tripId: string, userId: string) {
    const trip = await this.repository.findById(tripId);
    if (!trip || trip.userId !== userId) {
      throw new ForbiddenError('Não autorizado a compartilhar esta viagem');
    }

    const shareToken = crypto.randomBytes(16).toString('hex');
    await this.repository.update(tripId, {
      shareToken,
      visibility: 'UNLISTED',
    });

    return { shareToken };
  }

  async getPublicTrip(shareToken: string) {
    const trip = await this.repository.findByShareToken(shareToken);
    if (!trip) {
      throw new NotFoundError('Viagem compartilhada não encontrada ou expirada');
    }
    return trip;
  }
}
