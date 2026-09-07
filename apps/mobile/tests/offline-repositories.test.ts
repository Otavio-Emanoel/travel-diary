import { describe, it, expect, beforeEach } from 'vitest';
import { InMemorySqliteDatabase } from '../src/database/sqlite-client';
import { TripsRepository, LocalTrip } from '../src/database/repositories/trips-repository';
import { EntriesRepository, LocalEntry } from '../src/database/repositories/entries-repository';
import { SyncQueueRepository } from '../src/database/repositories/sync-queue-repository';
import { MediaQueueRepository } from '../src/database/repositories/media-queue-repository';

describe('Offline Repositories (SQLite)', () => {
  let db: InMemorySqliteDatabase;
  let tripsRepo: TripsRepository;
  let entriesRepo: EntriesRepository;
  let queueRepo: SyncQueueRepository;
  let mediaRepo: MediaQueueRepository;

  beforeEach(() => {
    db = new InMemorySqliteDatabase();
    tripsRepo = new TripsRepository(db);
    entriesRepo = new EntriesRepository(db);
    queueRepo = new SyncQueueRepository(db);
    mediaRepo = new MediaQueueRepository(db);
  });

  describe('TripsRepository', () => {
    it('should save and list local trips', async () => {
      const trip: LocalTrip = {
        id: 'trip-1',
        title: 'Viagem para Lisboa',
        description: 'Férias de verão em Portugal',
        start_date: '2026-07-01',
        end_date: '2026-07-15',
        status: 'PLANNED',
        sync_status: 'PENDING_CREATE',
        updated_at: Date.now(),
      };

      await tripsRepo.create(trip);
      const retrieved = await tripsRepo.getById('trip-1');
      expect(retrieved).not.toBeNull();
      expect(retrieved?.title).toBe('Viagem para Lisboa');
      expect(retrieved?.sync_status).toBe('PENDING_CREATE');

      const all = await tripsRepo.list();
      expect(all.length).toBe(1);
    });

    it('should reconcile with server trip using Last Write Wins', async () => {
      const oldTime = 100000;
      const newTime = 200000;

      await tripsRepo.create({
        id: 'trip-2',
        title: 'Versão Local Antiga',
        description: null,
        start_date: '2026-08-01',
        end_date: null,
        status: 'PLANNED',
        sync_status: 'PENDING_UPDATE',
        updated_at: oldTime,
      });

      // Servidor tem versão mais recente
      await tripsRepo.upsertFromServer({
        id: 'trip-2',
        title: 'Versão Servidor Mais Recente',
        startDate: '2026-08-01',
        status: 'ONGOING',
        updatedAt: newTime,
      });

      const updated = await tripsRepo.getById('trip-2');
      expect(updated?.title).toBe('Versão Servidor Mais Recente');
      expect(updated?.sync_status).toBe('SYNCED');
    });

    it('should preserve local modifications if local timestamp is newer than server', async () => {
      const newerLocalTime = 500000;
      const olderServerTime = 300000;

      await tripsRepo.create({
        id: 'trip-3',
        title: 'Edição Offline Recente',
        description: 'Modificado sem sinal 3G',
        start_date: '2026-08-01',
        end_date: null,
        status: 'PLANNED',
        sync_status: 'PENDING_UPDATE',
        updated_at: newerLocalTime,
      });

      // Servidor tenta enviar versão mais antiga
      await tripsRepo.upsertFromServer({
        id: 'trip-3',
        title: 'Versão Antiga no Servidor',
        startDate: '2026-08-01',
        status: 'PLANNED',
        updatedAt: olderServerTime,
      });

      const preserved = await tripsRepo.getById('trip-3');
      expect(preserved?.title).toBe('Edição Offline Recente');
      expect(preserved?.sync_status).toBe('PENDING_UPDATE');
    });
  });

  describe('EntriesRepository', () => {
    it('should save local entry and list by trip id', async () => {
      const entry: LocalEntry = {
        id: 'entry-1',
        trip_id: 'trip-1',
        title: 'Jantar em Alfama',
        content: 'Bacalhau à Brás maravilhoso!',
        entry_date: '2026-07-02',
        category: 'FOOD',
        latitude: 38.7118,
        longitude: -9.1306,
        location_name: 'Alfama, Lisboa',
        sync_status: 'PENDING_CREATE',
        updated_at: Date.now(),
      };

      await entriesRepo.create(entry);
      const list = await entriesRepo.listByTrip('trip-1');
      expect(list.length).toBe(1);
      expect(list[0].title).toBe('Jantar em Alfama');
      expect(list[0].category).toBe('FOOD');
    });
  });

  describe('SyncQueueRepository', () => {
    it('should enqueue and dequeue operations in FIFO order', async () => {
      await queueRepo.enqueue('TRIP', 'trip-10', 'CREATE', { title: 'Tóquio' });
      await queueRepo.enqueue('ENTRY', 'entry-20', 'CREATE', { content: 'Chegando em Shinjuku' });

      const items = await queueRepo.peek(10);
      expect(items.length).toBe(2);
      expect(items[0].entity_id).toBe('trip-10');
      expect(items[1].entity_id).toBe('entry-20');

      await queueRepo.dequeue(items[0].id);
      const remaining = await queueRepo.peek(10);
      expect(remaining.length).toBe(1);
      expect(remaining[0].entity_id).toBe('entry-20');
    });
  });

  describe('MediaQueueRepository', () => {
    it('should track pending media uploads', async () => {
      await mediaRepo.enqueue({
        id: 'media-1',
        entryId: 'entry-1',
        localFileUri: 'file:///path/to/photo.jpg',
        mimeType: 'image/jpeg',
        sizeBytes: 102400,
      });

      const pending = await mediaRepo.listPending();
      expect(pending.length).toBe(1);
      expect(pending[0].status).toBe('PENDING_UPLOAD');

      await mediaRepo.updateStatus('media-1', 'UPLOADING');
      await mediaRepo.delete('media-1');

      const afterDelete = await mediaRepo.listPending();
      expect(afterDelete.length).toBe(0);
    });
  });
});
