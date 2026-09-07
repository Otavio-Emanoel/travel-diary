import { CREATE_TABLES_SQL } from './schema';

export interface ISqliteDatabase {
  execAsync(sql: string): Promise<void>;
  runAsync(sql: string, params?: any[]): Promise<{ lastInsertRowId: number; changes: number }>;
  getAllAsync<T = any>(sql: string, params?: any[]): Promise<T[]>;
  getFirstAsync<T = any>(sql: string, params?: any[]): Promise<T | null>;
}

// In-Memory SQLite Mock para testes unitários ou ambientes headless/Node.js
export class InMemorySqliteDatabase implements ISqliteDatabase {
  private trips = new Map<string, any>();
  private entries = new Map<string, any>();
  private queue: any[] = [];
  private media = new Map<string, any>();
  private autoIncrementId = 1;

  async execAsync(_sql: string): Promise<void> {
    // DDL executado
  }

  async runAsync(sql: string, params: any[] = []): Promise<{ lastInsertRowId: number; changes: number }> {
    const trimmed = sql.trim();
    const upper = trimmed.toUpperCase();

    // INSERT INTO local_trips
    if (upper.startsWith('INSERT INTO LOCAL_TRIPS') || upper.startsWith('INSERT OR REPLACE INTO LOCAL_TRIPS')) {
      const trip = {
        id: params[0],
        title: params[1],
        description: params[2],
        start_date: params[3],
        end_date: params[4],
        status: params[5],
        sync_status: params[6],
        updated_at: params[7],
      };
      this.trips.set(trip.id, trip);
      return { lastInsertRowId: 1, changes: 1 };
    }

    // UPDATE local_trips
    if (upper.startsWith('UPDATE LOCAL_TRIPS')) {
      const id = params[params.length - 1];
      const existing = this.trips.get(id);
      if (existing) {
        // Simple heuristic for dynamic updates
        if (params.length === 8) {
          // full update
          this.trips.set(id, {
            ...existing,
            title: params[0],
            description: params[1],
            start_date: params[2],
            end_date: params[3],
            status: params[4],
            sync_status: params[5],
            updated_at: params[6],
          });
        } else if (upper.includes('SYNC_STATUS = ?')) {
          existing.sync_status = params[0];
          if (params.length > 2) existing.updated_at = params[1];
        }
        return { lastInsertRowId: 1, changes: 1 };
      }
      return { lastInsertRowId: 0, changes: 0 };
    }

    // DELETE FROM local_trips
    if (upper.startsWith('DELETE FROM LOCAL_TRIPS')) {
      const id = params[0];
      const deleted = this.trips.delete(id);
      return { lastInsertRowId: 0, changes: deleted ? 1 : 0 };
    }

    // INSERT INTO local_entries
    if (upper.startsWith('INSERT INTO LOCAL_ENTRIES') || upper.startsWith('INSERT OR REPLACE INTO LOCAL_ENTRIES')) {
      const entry = {
        id: params[0],
        trip_id: params[1],
        title: params[2],
        content: params[3],
        entry_date: params[4],
        category: params[5],
        latitude: params[6],
        longitude: params[7],
        location_name: params[8],
        sync_status: params[9],
        updated_at: params[10],
      };
      this.entries.set(entry.id, entry);
      return { lastInsertRowId: 1, changes: 1 };
    }

    // UPDATE local_entries
    if (upper.startsWith('UPDATE LOCAL_ENTRIES')) {
      const id = params[params.length - 1];
      const existing = this.entries.get(id);
      if (existing) {
        if (upper.includes('SYNC_STATUS = ?') && params.length === 2) {
          existing.sync_status = params[0];
        } else if (upper.includes('CONTENT = ?')) {
          existing.title = params[0];
          existing.content = params[1];
          existing.category = params[2];
          existing.sync_status = params[3];
          existing.updated_at = params[4];
        }
        return { lastInsertRowId: 1, changes: 1 };
      }
      return { lastInsertRowId: 0, changes: 0 };
    }

    // DELETE FROM local_entries
    if (upper.startsWith('DELETE FROM LOCAL_ENTRIES')) {
      const id = params[0];
      const deleted = this.entries.delete(id);
      return { lastInsertRowId: 0, changes: deleted ? 1 : 0 };
    }

    // INSERT INTO sync_queue
    if (upper.startsWith('INSERT INTO SYNC_QUEUE')) {
      const newId = this.autoIncrementId++;
      const item = {
        id: newId,
        entity_type: params[0],
        entity_id: params[1],
        action: params[2],
        payload: params[3],
        attempts: 0,
        last_error: null,
        created_at: params[4] || Date.now(),
      };
      this.queue.push(item);
      return { lastInsertRowId: newId, changes: 1 };
    }

    // DELETE FROM sync_queue
    if (upper.startsWith('DELETE FROM SYNC_QUEUE')) {
      const id = params[0];
      const initialLen = this.queue.length;
      this.queue = this.queue.filter((q) => q.id !== id);
      return { lastInsertRowId: 0, changes: initialLen - this.queue.length };
    }

    // UPDATE sync_queue (attempts increment & error)
    if (upper.startsWith('UPDATE SYNC_QUEUE')) {
      const id = params[params.length - 1];
      const item = this.queue.find((q) => q.id === id);
      if (item) {
        item.attempts += 1;
        item.last_error = params[0];
        return { lastInsertRowId: 0, changes: 1 };
      }
      return { lastInsertRowId: 0, changes: 0 };
    }

    // INSERT INTO pending_media
    if (upper.startsWith('INSERT INTO PENDING_MEDIA')) {
      const mediaItem = {
        id: params[0],
        entry_id: params[1],
        local_file_uri: params[2],
        mime_type: params[3],
        size_bytes: params[4],
        status: params[5],
        created_at: params[6] || Date.now(),
      };
      this.media.set(mediaItem.id, mediaItem);
      return { lastInsertRowId: 1, changes: 1 };
    }

    // UPDATE pending_media
    if (upper.startsWith('UPDATE PENDING_MEDIA')) {
      const id = params[params.length - 1];
      const item = this.media.get(id);
      if (item) {
        item.status = params[0];
        return { lastInsertRowId: 0, changes: 1 };
      }
      return { lastInsertRowId: 0, changes: 0 };
    }

    // DELETE FROM pending_media
    if (upper.startsWith('DELETE FROM PENDING_MEDIA')) {
      const id = params[0];
      const deleted = this.media.delete(id);
      return { lastInsertRowId: 0, changes: deleted ? 1 : 0 };
    }

    return { lastInsertRowId: 1, changes: 1 };
  }

  async getAllAsync<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    const upper = sql.trim().toUpperCase();

    if (upper.includes('FROM LOCAL_TRIPS')) {
      let results = Array.from(this.trips.values());
      if (upper.includes('WHERE ID = ?')) {
        results = results.filter((t) => t.id === params[0]);
      } else if (upper.includes('WHERE STATUS = ?')) {
        results = results.filter((t) => t.status === params[0]);
      }
      return results as T[];
    }

    if (upper.includes('FROM LOCAL_ENTRIES')) {
      let results = Array.from(this.entries.values());
      if (upper.includes('WHERE TRIP_ID = ?')) {
        results = results.filter((e) => e.trip_id === params[0]);
      }
      if (upper.includes('WHERE ID = ?')) {
        results = results.filter((e) => e.id === params[0]);
      }
      // Sort by entry_date descending
      if (upper.includes('ORDER BY ENTRY_DATE DESC')) {
        results.sort((a, b) => b.entry_date.localeCompare(a.entry_date));
      }
      return results as T[];
    }

    if (upper.includes('FROM SYNC_QUEUE')) {
      let results = [...this.queue];
      if (upper.includes('ORDER BY ID ASC')) {
        results.sort((a, b) => a.id - b.id);
      }
      if (upper.includes('LIMIT ?')) {
        const limit = params[params.length - 1];
        results = results.slice(0, limit);
      }
      return results as T[];
    }

    if (upper.includes('FROM PENDING_MEDIA')) {
      let results = Array.from(this.media.values());
      if (upper.includes('WHERE STATUS = ?')) {
        results = results.filter((m) => m.status === params[0]);
      }
      return results as T[];
    }

    return [];
  }

  async getFirstAsync<T = any>(sql: string, params: any[] = []): Promise<T | null> {
    const rows = await this.getAllAsync<T>(sql, params);
    return rows[0] || null;
  }
}

let dbInstance: ISqliteDatabase | null = null;

export async function initDatabase(customDb?: ISqliteDatabase): Promise<ISqliteDatabase> {
  if (customDb) {
    dbInstance = customDb;
    await dbInstance.execAsync(CREATE_TABLES_SQL);
    return dbInstance;
  }

  if (dbInstance) {
    return dbInstance;
  }

  try {
    // Tentativa de carregar expo-sqlite dinamicamente em runtime React Native
    const SQLite = await import('expo-sqlite');
    if (SQLite && SQLite.openDatabaseAsync) {
      const nativeDb = await SQLite.openDatabaseAsync('travel_diary.db');
      await nativeDb.execAsync(CREATE_TABLES_SQL);
      dbInstance = nativeDb as unknown as ISqliteDatabase;
      return dbInstance;
    }
  } catch (_e) {
    // Ambiente sem suporte a driver nativo (ex: testes node/vitest)
  }

  dbInstance = new InMemorySqliteDatabase();
  await dbInstance.execAsync(CREATE_TABLES_SQL);
  return dbInstance;
}

export function getDatabase(): ISqliteDatabase {
  if (!dbInstance) {
    dbInstance = new InMemorySqliteDatabase();
  }
  return dbInstance;
}
