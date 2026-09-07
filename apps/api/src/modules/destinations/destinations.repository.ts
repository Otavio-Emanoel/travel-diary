import { eq, and, asc } from 'drizzle-orm';
import { db, Database } from '../../core/database';
import { destinations } from '../../core/database/schema';

export class DestinationsRepository {
  constructor(private readonly database: Database = db) {}

  async create(data: typeof destinations.$inferInsert) {
    const result = await this.database.insert(destinations).values(data).returning();
    return result[0];
  }

  async listByTrip(tripId: string) {
    return this.database
      .select()
      .from(destinations)
      .where(eq(destinations.tripId, tripId))
      .orderBy(asc(destinations.orderIndex));
  }

  async findById(id: string) {
    const result = await this.database
      .select()
      .from(destinations)
      .where(eq(destinations.id, id))
      .limit(1);
    return result[0] || null;
  }

  async delete(id: string) {
    await this.database.delete(destinations).where(eq(destinations.id, id));
  }
}
