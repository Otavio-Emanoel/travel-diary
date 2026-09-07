import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InMemorySqliteDatabase } from '../src/database/sqlite-client';
import { TripsRepository } from '../src/database/repositories/trips-repository';
import { EntriesRepository } from '../src/database/repositories/entries-repository';
import { SyncQueueRepository } from '../src/database/repositories/sync-queue-repository';
import { MediaQueueRepository } from '../src/database/repositories/media-queue-repository';
import { SyncEngine } from '../src/sync/sync-engine';
import { MobileApiClient } from '../src/services/api-client';

describe('SyncEngine (Offline-First Worker)', () => {
  let db: InMemorySqliteDatabase;
  let tripsRepo: TripsRepository;
  let entriesRepo: EntriesRepository;
  let queueRepo: SyncQueueRepository;
  let mediaRepo: MediaQueueRepository;
  let mockApiClient: MobileApiClient;
  let syncEngine: SyncEngine;

  beforeEach(() => {
    db = new InMemorySqliteDatabase();
    tripsRepo = new TripsRepository(db);
    entriesRepo = new EntriesRepository(db);
    queueRepo = new SyncQueueRepository(db);
    mediaRepo = new MediaQueueRepository(db);
    mockApiClient = new MobileApiClient('http://mock-api');

    syncEngine = new SyncEngine(
      tripsRepo,
      entriesRepo,
      queueRepo,
      mediaRepo,
      mockApiClient
    );
  });

  it('should process pending TRIP CREATE queue item and update local status to SYNCED', async () => {
    // 1. Criar viagem local em estado PENDING_CREATE
    await tripsRepo.create({
      id: 'trip-100',
      title: 'Mochilão Peru',
      description: 'Machu Picchu e Cusco',
      start_date: '2026-09-01',
      end_date: '2026-09-15',
      status: 'PLANNED',
      sync_status: 'PENDING_CREATE',
      updated_at: Date.now(),
    });

    await queueRepo.enqueue('TRIP', 'trip-100', 'CREATE', {
      title: 'Mochilão Peru',
      description: 'Machu Picchu e Cusco',
      startDate: '2026-09-01',
      endDate: '2026-09-15',
      status: 'PLANNED',
    });

    // 2. Mockar resposta da API de sucesso
    vi.spyOn(mockApiClient, 'createTrip').mockResolvedValueOnce({
      data: { id: 'trip-100', title: 'Mochilão Peru' },
    });

    // 3. Executar o processador de fila
    await syncEngine.processSyncQueue();

    // 4. Verificar que a viagem no SQLite local agora está SYNCED
    const trip = await tripsRepo.getById('trip-100');
    expect(trip?.sync_status).toBe('SYNCED');

    // 5. Verificar que o item foi removido da fila de sincronização
    const remainingQueue = await queueRepo.peek();
    expect(remainingQueue.length).toBe(0);
    expect(mockApiClient.createTrip).toHaveBeenCalledTimes(1);
  });

  it('should retain queue item and record error when network fails', async () => {
    await queueRepo.enqueue('TRIP', 'trip-200', 'CREATE', {
      title: 'Viagem Sem Internet',
    });

    // Mock de erro de rede (offline)
    vi.spyOn(mockApiClient, 'createTrip').mockResolvedValueOnce({
      error: { code: 'NETWORK_ERROR', message: 'Offline connection refused' },
    });

    await syncEngine.processSyncQueue();

    // Item continua na fila para retry quando a conexão voltar
    const remaining = await queueRepo.peek();
    expect(remaining.length).toBe(1);
    expect(remaining[0].last_error).toContain('Network error');
  });

  it('should process pending ENTRY CREATE queue item and update local status to SYNCED', async () => {
    await entriesRepo.create({
      id: 'entry-50',
      trip_id: 'trip-100',
      title: 'Trilha Inca',
      content: 'Iniciando caminhada às 6h da manhã.',
      entry_date: '2026-09-02',
      category: 'ACTIVITY',
      latitude: -13.1631,
      longitude: -72.545,
      location_name: 'Cusco, Peru',
      sync_status: 'PENDING_CREATE',
      updated_at: Date.now(),
    });

    await queueRepo.enqueue('ENTRY', 'entry-50', 'CREATE', {
      tripId: 'trip-100',
      title: 'Trilha Inca',
      content: 'Iniciando caminhada às 6h da manhã.',
      entryDate: '2026-09-02',
      category: 'ACTIVITY',
    });

    vi.spyOn(mockApiClient, 'createEntry').mockResolvedValueOnce({
      data: { id: 'entry-50', content: 'Iniciando caminhada' },
    });

    await syncEngine.processSyncQueue();

    const entry = await entriesRepo.getById('entry-50');
    expect(entry?.sync_status).toBe('SYNCED');

    const remaining = await queueRepo.peek();
    expect(remaining.length).toBe(0);
  });
});
