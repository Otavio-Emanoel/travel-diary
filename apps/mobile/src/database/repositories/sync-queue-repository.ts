import { getDatabase, ISqliteDatabase } from '../sqlite-client';

export interface SyncQueueItem {
  id: number;
  entity_type: 'TRIP' | 'ENTRY' | 'MEDIA';
  entity_id: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  payload: string; // JSON
  attempts: number;
  last_error: string | null;
  created_at: number;
}

export class SyncQueueRepository {
  constructor(private db: ISqliteDatabase = getDatabase()) {}

  async enqueue(
    entityType: 'TRIP' | 'ENTRY' | 'MEDIA',
    entityId: string,
    action: 'CREATE' | 'UPDATE' | 'DELETE',
    payload: any
  ): Promise<number> {
    const serializedPayload = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const sql = `
      INSERT INTO sync_queue (entity_type, entity_id, action, payload, attempts, created_at)
      VALUES (?, ?, ?, ?, 0, ?)
    `;
    const res = await this.db.runAsync(sql, [
      entityType,
      entityId,
      action,
      serializedPayload,
      Date.now(),
    ]);
    return res.lastInsertRowId;
  }

  async peek(limit: number = 10): Promise<SyncQueueItem[]> {
    const sql = `SELECT * FROM sync_queue ORDER BY id ASC LIMIT ?`;
    return this.db.getAllAsync<SyncQueueItem>(sql, [limit]);
  }

  async dequeue(id: number): Promise<void> {
    const sql = `DELETE FROM sync_queue WHERE id = ?`;
    await this.db.runAsync(sql, [id]);
  }

  async recordError(id: number, errorMessage: string): Promise<void> {
    const sql = `UPDATE sync_queue SET last_error = ? WHERE id = ?`;
    await this.db.runAsync(sql, [errorMessage, id]);
  }

  async getPendingCount(): Promise<number> {
    const items = await this.peek(1000);
    return items.length;
  }
}
