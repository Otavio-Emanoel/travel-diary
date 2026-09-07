import { eq, and } from 'drizzle-orm';
import { db, Database } from '../../core/database';
import { media } from '../../core/database/schema';

export class MediaRepository {
  constructor(private readonly database: Database = db) {}

  async create(data: typeof media.$inferInsert) {
    const result = await this.database.insert(media).values(data).returning();
    return result[0];
  }

  async findById(id: string) {
    const result = await this.database
      .select()
      .from(media)
      .where(eq(media.id, id))
      .limit(1);
    return result[0] || null;
  }

  async updateStatus(id: string, status: 'READY' | 'FAILED', extra?: { width?: number; height?: number }) {
    const result = await this.database
      .update(media)
      .set({ status, ...extra })
      .where(eq(media.id, id))
      .returning();
    return result[0];
  }

  async delete(id: string) {
    await this.database.delete(media).where(eq(media.id, id));
  }
}
