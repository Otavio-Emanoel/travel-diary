import crypto from 'crypto';
import { DestinationsRepository } from './destinations.repository';
import { TripsRepository } from '../trips/trips.repository';
import { AddDestinationInput } from '@travel-diary/contracts';
import { NotFoundError, ForbiddenError } from '../../core/errors/app-error';

export class DestinationsService {
  constructor(
    private readonly repository: DestinationsRepository = new DestinationsRepository(),
    private readonly tripsRepository: TripsRepository = new TripsRepository()
  ) {}

  async addDestination(tripId: string, userId: string, input: AddDestinationInput) {
    const trip = await this.tripsRepository.findById(tripId);
    if (!trip) {
      throw new NotFoundError('Viagem não encontrada');
    }

    if (trip.userId !== userId) {
      throw new ForbiddenError('Apenas o dono da viagem pode adicionar destinos');
    }

    return this.repository.create({
      id: crypto.randomUUID(),
      tripId,
      name: input.name,
      country: input.country,
      countryCode: input.countryCode,
      latitude: input.latitude,
      longitude: input.longitude,
      arrivalDate: input.arrivalDate,
      departureDate: input.departureDate,
      orderIndex: input.orderIndex,
    });
  }

  async listDestinations(tripId: string) {
    return this.repository.listByTrip(tripId);
  }

  async deleteDestination(destinationId: string, userId: string): Promise<void> {
    const dest = await this.repository.findById(destinationId);
    if (!dest) {
      throw new NotFoundError('Destino não encontrado');
    }

    const trip = await this.tripsRepository.findById(dest.tripId);
    if (!trip || trip.userId !== userId) {
      throw new ForbiddenError('Não autorizado a remover este destino');
    }

    await this.repository.delete(destinationId);
  }
}
