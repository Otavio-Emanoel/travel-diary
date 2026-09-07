import { eq } from 'drizzle-orm';
import { db, Database } from '../../core/database';
import { locations } from '../../core/database/schema';

export class LocationsRepository {
  constructor(private readonly database: Database = db) {}

  async create(data: typeof locations.$inferInsert) {
    const result = await this.database.insert(locations).values(data).returning();
    return result[0];
  }

  async findByEntryId(entryId: string) {
    const result = await this.database
      .select()
      .from(locations)
      .where(eq(locations.entryId, entryId))
      .limit(1);
    return result[0] || null;
  }
}
