import { eq, and, isNull, asc } from 'drizzle-orm';
import { db, Database } from '../../core/database';
import { entries, locations, media, tripDays } from '../../core/database/schema';

export class EntriesRepository {
  constructor(private readonly database: Database = db) {}

  async create(data: typeof entries.$inferInsert) {
    const result = await this.database.insert(entries).values(data).returning();
    return result[0];
  }

  async findById(id: string) {
    const result = await this.database.query.entries.findFirst({
      where: and(eq(entries.id, id), isNull(entries.deletedAt)),
      with: {
        location: true,
        media: {
          where: eq(media.status, 'READY'),
        },
        day: true,
      },
    });
    return result || null;
  }

  async listByTrip(tripId: string) {
    return this.database.query.entries.findMany({
      where: and(eq(entries.tripId, tripId), isNull(entries.deletedAt)),
      orderBy: [asc(entries.entryTime)],
      with: {
        location: true,
        media: {
          where: eq(media.status, 'READY'),
        },
      },
    });
  }

  async update(id: string, data: Partial<typeof entries.$inferInsert>) {
    const result = await this.database
      .update(entries)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(entries.id, id))
      .returning();
    return result[0];
  }

  async softDelete(id: string) {
    await this.database
      .update(entries)
      .set({ deletedAt: new Date() })
      .where(eq(entries.id, id));
  }

  async attachMediaToEntry(mediaIds: string[], entryId: string, tripId: string) {
    if (!mediaIds.length) return;
    for (const mediaId of mediaIds) {
      await this.database
        .update(media)
        .set({ entryId, tripId })
        .where(eq(media.id, mediaId));
    }
  }
}
