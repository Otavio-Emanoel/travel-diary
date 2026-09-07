import { getDatabase, ISqliteDatabase } from '../sqlite-client';
import { SyncStatus } from './trips-repository';

export interface LocalEntry {
  id: string;
  trip_id: string;
  title: string | null;
  content: string;
  entry_date: string;
  category: 'NOTE' | 'FOOD' | 'ACTIVITY' | 'LODGING' | 'TRANSPORT' | 'HIGHLIGHT';
  latitude: number | null;
  longitude: number | null;
  location_name: string | null;
  sync_status: SyncStatus;
  updated_at: number; // Unix epoch ms
}

export class EntriesRepository {
  constructor(private db: ISqliteDatabase = getDatabase()) {}

  async create(entry: LocalEntry): Promise<void> {
    const sql = `
      INSERT INTO local_entries (id, trip_id, title, content, entry_date, category, latitude, longitude, location_name, sync_status, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    await this.db.runAsync(sql, [
      entry.id,
      entry.trip_id,
      entry.title,
      entry.content,
      entry.entry_date,
      entry.category,
      entry.latitude,
      entry.longitude,
      entry.location_name,
      entry.sync_status,
      entry.updated_at,
    ]);
  }

  async getById(id: string): Promise<LocalEntry | null> {
    const sql = `SELECT * FROM local_entries WHERE id = ?`;
    return this.db.getFirstAsync<LocalEntry>(sql, [id]);
  }

  async listByTrip(tripId: string): Promise<LocalEntry[]> {
    const sql = `SELECT * FROM local_entries WHERE trip_id = ? ORDER BY entry_date DESC`;
    return this.db.getAllAsync<LocalEntry>(sql, [tripId]);
  }

  async update(id: string, updates: Partial<LocalEntry>): Promise<void> {
    const existing = await this.getById(id);
    if (!existing) return;

    const merged: LocalEntry = {
      ...existing,
      ...updates,
      updated_at: updates.updated_at ?? Date.now(),
    };

    const sql = `
      UPDATE local_entries
      SET title = ?, content = ?, category = ?, sync_status = ?, updated_at = ?
      WHERE id = ?
    `;
    await this.db.runAsync(sql, [
      merged.title,
      merged.content,
      merged.category,
      merged.sync_status,
      merged.updated_at,
      id,
    ]);
  }

  async updateSyncStatus(id: string, syncStatus: SyncStatus): Promise<void> {
    const sql = `UPDATE local_entries SET sync_status = ? WHERE id = ?`;
    await this.db.runAsync(sql, [syncStatus, id]);
  }

  async delete(id: string): Promise<void> {
    const sql = `DELETE FROM local_entries WHERE id = ?`;
    await this.db.runAsync(sql, [id]);
  }

  /**
   * Reconciliação do servidor (Last Write Wins)
   */
  async upsertFromServer(serverEntry: {
    id: string;
    tripId: string;
    title?: string | null;
    content: string;
    entryDate: string;
    category: string;
    latitude?: number | null;
    longitude?: number | null;
    locationName?: string | null;
    updatedAt: string | number;
  }): Promise<void> {
    const serverUpdatedAt = typeof serverEntry.updatedAt === 'string'
      ? new Date(serverEntry.updatedAt).getTime()
      : serverEntry.updatedAt;

    const local = await this.getById(serverEntry.id);
    if (local && local.sync_status !== 'SYNCED' && local.updated_at > serverUpdatedAt) {
      return;
    }

    const sql = `
      INSERT OR REPLACE INTO local_entries (id, trip_id, title, content, entry_date, category, latitude, longitude, location_name, sync_status, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    await this.db.runAsync(sql, [
      serverEntry.id,
      serverEntry.tripId,
      serverEntry.title ?? null,
      serverEntry.content,
      serverEntry.entryDate,
      serverEntry.category,
      serverEntry.latitude ?? null,
      serverEntry.longitude ?? null,
      serverEntry.locationName ?? null,
      'SYNCED',
      serverUpdatedAt,
    ]);
  }
}
