import { eq, and, isNull, gt } from 'drizzle-orm';
import { db, Database } from '../../core/database';
import { users, sessions } from '../../core/database/schema';

export class AuthRepository {
  constructor(private readonly database: Database = db) {}

  async findUserByEmail(email: string) {
    const result = await this.database
      .select()
      .from(users)
      .where(and(eq(users.email, email), isNull(users.deletedAt)))
      .limit(1);
    return result[0] || null;
  }

  async findUserById(id: string) {
    const result = await this.database
      .select()
      .from(users)
      .where(and(eq(users.id, id), isNull(users.deletedAt)))
      .limit(1);
    return result[0] || null;
  }

  async createUser(data: typeof users.$inferInsert) {
    const result = await this.database.insert(users).values(data).returning();
    return result[0];
  }

  async createSession(data: typeof sessions.$inferInsert) {
    const result = await this.database.insert(sessions).values(data).returning();
    return result[0];
  }

  async findSessionByTokenHash(tokenHash: string) {
    const result = await this.database
      .select()
      .from(sessions)
      .where(eq(sessions.tokenHash, tokenHash))
      .limit(1);
    return result[0] || null;
  }

  async revokeSession(sessionId: string) {
    await this.database
      .update(sessions)
      .set({ revokedAt: new Date() })
      .where(eq(sessions.id, sessionId));
  }

  async revokeAllUserSessions(userId: string) {
    await this.database
      .update(sessions)
      .set({ revokedAt: new Date() })
      .where(and(eq(sessions.userId, userId), isNull(sessions.revokedAt)));
  }
}
