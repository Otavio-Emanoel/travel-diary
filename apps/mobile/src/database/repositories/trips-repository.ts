import { getDatabase, ISqliteDatabase } from '../sqlite-client';

export type SyncStatus = 'SYNCED' | 'PENDING_CREATE' | 'PENDING_UPDATE' | 'PENDING_DELETE';

export interface LocalTrip {
  id: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string | null;
  status: 'PLANNED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
  sync_status: SyncStatus;
  updated_at: number; // Unix epoch ms
}

export class TripsRepository {
  constructor(private db: ISqliteDatabase = getDatabase()) {}

  async create(trip: LocalTrip): Promise<void> {
    const sql = `
      INSERT INTO local_trips (id, title, description, start_date, end_date, status, sync_status, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    await this.db.runAsync(sql, [
      trip.id,
      trip.title,
      trip.description,
      trip.start_date,
      trip.end_date,
      trip.status,
      trip.sync_status,
      trip.updated_at,
    ]);
  }

  async getById(id: string): Promise<LocalTrip | null> {
    const sql = `SELECT * FROM local_trips WHERE id = ?`;
    return this.db.getFirstAsync<LocalTrip>(sql, [id]);
  }

  async list(): Promise<LocalTrip[]> {
    const sql = `SELECT * FROM local_trips ORDER BY start_date DESC`;
    return this.db.getAllAsync<LocalTrip>(sql);
  }

  async update(id: string, updates: Partial<LocalTrip>): Promise<void> {
    const existing = await this.getById(id);
    if (!existing) return;

    const merged: LocalTrip = {
      ...existing,
      ...updates,
      updated_at: updates.updated_at ?? Date.now(),
    };

    const sql = `
      UPDATE local_trips
      SET title = ?, description = ?, start_date = ?, end_date = ?, status = ?, sync_status = ?, updated_at = ?
      WHERE id = ?
    `;
    await this.db.runAsync(sql, [
      merged.title,
      merged.description,
      merged.start_date,
      merged.end_date,
      merged.status,
      merged.sync_status,
      merged.updated_at,
      id,
    ]);
  }

  async updateSyncStatus(id: string, syncStatus: SyncStatus): Promise<void> {
    const sql = `UPDATE local_trips SET sync_status = ? WHERE id = ?`;
    await this.db.runAsync(sql, [syncStatus, id]);
  }

  async delete(id: string): Promise<void> {
    const sql = `DELETE FROM local_trips WHERE id = ?`;
    await this.db.runAsync(sql, [id]);
  }

  /**
   * Reconciliação do servidor (Last Write Wins)
   */
  async upsertFromServer(serverTrip: {
    id: string;
    title: string;
    description?: string | null;
    startDate: string;
    endDate?: string | null;
    status: string;
    updatedAt: string | number;
  }): Promise<void> {
    const serverUpdatedAt = typeof serverTrip.updatedAt === 'string'
      ? new Date(serverTrip.updatedAt).getTime()
      : serverTrip.updatedAt;

    const local = await this.getById(serverTrip.id);
    if (local && local.sync_status !== 'SYNCED' && local.updated_at > serverUpdatedAt) {
      // Local tem modificação mais recente pendente de envio; não sobrescreve
      return;
    }

    const sql = `
      INSERT OR REPLACE INTO local_trips (id, title, description, start_date, end_date, status, sync_status, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    await this.db.runAsync(sql, [
      serverTrip.id,
      serverTrip.title,
      serverTrip.description ?? null,
      serverTrip.startDate,
      serverTrip.endDate ?? null,
      serverTrip.status,
      'SYNCED',
      serverUpdatedAt,
    ]);
  }
}
