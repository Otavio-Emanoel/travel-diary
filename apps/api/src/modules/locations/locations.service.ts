import crypto from 'crypto';
import { LocationsRepository } from './locations.repository';
import { CreateLocationInput } from '@travel-diary/contracts';

export class LocationsService {
  constructor(private readonly repository: LocationsRepository = new LocationsRepository()) {}

  async createEntryLocation(entryId: string, input: CreateLocationInput) {
    return this.repository.create({
      id: crypto.randomUUID(),
      entryId,
      name: input.name,
      address: input.address,
      city: input.city,
      country: input.country,
      latitude: input.latitude,
      longitude: input.longitude,
    });
  }

  async getLocationByEntryId(entryId: string) {
    return this.repository.findByEntryId(entryId);
  }
}
