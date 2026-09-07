import { eq, and, isNull, desc, SQL } from 'drizzle-orm';
import { db, Database } from '../../core/database';
import { trips, destinations, tripDays, entries } from '../../core/database/schema';

export class TripsRepository {
  constructor(private readonly database: Database = db) {}

  async create(data: typeof trips.$inferInsert) {
    const result = await this.database.insert(trips).values(data).returning();
    return result[0];
  }

  async findById(id: string) {
    const result = await this.database.query.trips.findFirst({
      where: and(eq(trips.id, id), isNull(trips.deletedAt)),
      with: {
        destinations: {
          orderBy: (dest, { asc }) => [asc(dest.orderIndex)],
        },
        days: {
          orderBy: (d, { asc }) => [asc(d.dayNumber)],
        },
      },
    });
    return result || null;
  }

  async findByShareToken(shareToken: string) {
    const result = await this.database.query.trips.findFirst({
      where: and(eq(trips.shareToken, shareToken), isNull(trips.deletedAt)),
      with: {
        destinations: true,
        days: true,
      },
    });
    return result || null;
  }

  async listByUser(userId: string, options: { status?: string; limit?: number; offset?: number }) {
    const conditions: SQL[] = [eq(trips.userId, userId), isNull(trips.deletedAt)];

    if (options.status) {
      conditions.push(eq(trips.status, options.status));
    }

    const items = await this.database.query.trips.findMany({
      where: and(...conditions),
      orderBy: [desc(trips.startDate), desc(trips.createdAt)],
      limit: options.limit || 20,
      offset: options.offset || 0,
      with: {
        destinations: true,
      },
    });

    return items;
  }

  async update(id: string, data: Partial<typeof trips.$inferInsert>) {
    const result = await this.database
      .update(trips)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(trips.id, id))
      .returning();
    return result[0];
  }

  async softDelete(id: string) {
    await this.database
      .update(trips)
      .set({ deletedAt: new Date() })
      .where(eq(trips.id, id));
  }
}
