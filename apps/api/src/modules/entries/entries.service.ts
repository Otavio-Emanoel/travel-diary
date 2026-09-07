import crypto from 'crypto';
import { EntriesRepository } from './entries.repository';
import { TripsRepository } from '../trips/trips.repository';
import { LocationsService } from '../locations/locations.service';
import { CreateEntryInput, UpdateEntryInput } from '@travel-diary/contracts';
import { NotFoundError, ForbiddenError } from '../../core/errors/app-error';

export class EntriesService {
  constructor(
    private readonly repository: EntriesRepository = new EntriesRepository(),
    private readonly tripsRepository: TripsRepository = new TripsRepository(),
    private readonly locationsService: LocationsService = new LocationsService()
  ) {}

  async createEntry(tripId: string, userId: string, input: CreateEntryInput) {
    const trip = await this.tripsRepository.findById(tripId);
    if (!trip) {
      throw new NotFoundError('Viagem não encontrada');
    }

    if (trip.userId !== userId) {
      throw new ForbiddenError('Apenas o criador da viagem pode adicionar relatos');
    }

    const entryId = crypto.randomUUID();
    const entry = await this.repository.create({
      id: entryId,
      tripId,
      tripDayId: input.tripDayId,
      title: input.title,
      content: input.content,
      entryTime: input.entryTime ? new Date(input.entryTime) : new Date(),
      category: input.category,
    });

    if (input.location) {
      await this.locationsService.createEntryLocation(entryId, input.location);
    }

    if (input.mediaIds && input.mediaIds.length > 0) {
      await this.repository.attachMediaToEntry(input.mediaIds, entryId, tripId);
    }

    return this.repository.findById(entryId);
  }

  async getEntryById(entryId: string, userId?: string) {
    const entry = await this.repository.findById(entryId);
    if (!entry) {
      throw new NotFoundError('Entrada de diário não encontrada');
    }

    return entry;
  }

  async listEntriesByTrip(tripId: string, userId?: string) {
    const trip = await this.tripsRepository.findById(tripId);
    if (!trip) {
      throw new NotFoundError('Viagem não encontrada');
    }

    return this.repository.listByTrip(tripId);
  }

  async getTimeline(tripId: string, userId?: string, shareToken?: string) {
    const trip = await this.tripsRepository.findById(tripId);
    if (!trip) {
      throw new NotFoundError('Viagem não encontrada');
    }

    const isOwner = userId && trip.userId === userId;
    const isPublic = trip.visibility === 'PUBLIC';
    const hasValidShare = shareToken && trip.shareToken === shareToken;

    if (!isOwner && !isPublic && !hasValidShare) {
      throw new ForbiddenError('Acesso não autorizado à linha do tempo desta viagem');
    }

    const allEntries = await this.repository.listByTrip(tripId);

    // Agrupa entradas por dia
    const daysMap = new Map<string, any[]>();
    const unassignedEntries: any[] = [];

    for (const entry of allEntries) {
      if (entry.tripDayId) {
        const list = daysMap.get(entry.tripDayId) || [];
        list.push(entry);
        daysMap.set(entry.tripDayId, list);
      } else {
        unassignedEntries.push(entry);
      }
    }

    const daysWithEntries = (trip.days || []).map((day: any) => ({
      ...day,
      entries: daysMap.get(day.id) || [],
    }));

    return {
      trip: {
        id: trip.id,
        title: trip.title,
        description: trip.description,
        startDate: trip.startDate,
        endDate: trip.endDate,
        status: trip.status,
        visibility: trip.visibility,
        destinations: trip.destinations || [],
      },
      days: daysWithEntries,
      unassignedEntries,
    };
  }

  async updateEntry(entryId: string, userId: string, input: UpdateEntryInput) {
    const entry = await this.repository.findById(entryId);
    if (!entry) {
      throw new NotFoundError('Entrada de diário não encontrada');
    }

    const trip = await this.tripsRepository.findById(entry.tripId);
    if (!trip || trip.userId !== userId) {
      throw new ForbiddenError('Apenas o dono da viagem pode editar esta entrada');
    }

    await this.repository.update(entryId, {
      title: input.title,
      content: input.content,
      tripDayId: input.tripDayId,
      category: input.category,
      entryTime: input.entryTime ? new Date(input.entryTime) : undefined,
    });

    if (input.location) {
      await this.locationsService.createEntryLocation(entryId, input.location);
    }

    return this.repository.findById(entryId);
  }

  async deleteEntry(entryId: string, userId: string): Promise<void> {
    const entry = await this.repository.findById(entryId);
    if (!entry) {
      throw new NotFoundError('Entrada de diário não encontrada');
    }

    const trip = await this.tripsRepository.findById(entry.tripId);
    if (!trip || trip.userId !== userId) {
      throw new ForbiddenError('Não autorizado a excluir esta entrada');
    }

    await this.repository.softDelete(entryId);
  }
}
