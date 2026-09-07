import { create } from 'zustand';
import { LocalTrip, TripsRepository } from '../../database/repositories/trips-repository';
import { SyncQueueRepository } from '../../database/repositories/sync-queue-repository';
import { SyncEngine } from '../../sync/sync-engine';

interface TripsState {
  trips: LocalTrip[];
  isLoading: boolean;
  loadTrips: () => Promise<void>;
  createTrip: (data: {
    title: string;
    description?: string;
    startDate: string;
    endDate?: string;
  }) => Promise<LocalTrip>;
  updateTrip: (id: string, updates: Partial<LocalTrip>) => Promise<void>;
  deleteTrip: (id: string) => Promise<void>;
  syncWithServer: () => Promise<void>;
}

const tripsRepo = new TripsRepository();
const queueRepo = new SyncQueueRepository();
const syncEngine = new SyncEngine(tripsRepo);

export const useTripsStore = create<TripsState>((set, get) => ({
  trips: [],
  isLoading: false,

  loadTrips: async () => {
    set({ isLoading: true });
    const local = await tripsRepo.list();
    set({ trips: local, isLoading: false });
  },

  createTrip: async (data) => {
    const id = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `trip_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    const newTrip: LocalTrip = {
      id,
      title: data.title,
      description: data.description || null,
      start_date: data.startDate,
      end_date: data.endDate || null,
      status: 'PLANNED',
      sync_status: 'PENDING_CREATE',
      updated_at: Date.now(),
    };

    // 1. Salvar no SQLite local
    await tripsRepo.create(newTrip);

    // 2. Adicionar na fila de sincronização
    await queueRepo.enqueue('TRIP', id, 'CREATE', {
      title: newTrip.title,
      description: newTrip.description,
      startDate: newTrip.start_date,
      endDate: newTrip.end_date,
      status: newTrip.status,
    });

    // 3. Atualizar UI instantaneamente
    const current = get().trips;
    set({ trips: [newTrip, ...current] });

    // 4. Disparar sincronização em background sem bloquear
    syncEngine.sync().then(() => {
      get().loadTrips();
    }).catch(() => {});

    return newTrip;
  },

  updateTrip: async (id, updates) => {
    await tripsRepo.update(id, { ...updates, sync_status: 'PENDING_UPDATE' });
    await queueRepo.enqueue('TRIP', id, 'UPDATE', updates);

    const updated = await tripsRepo.list();
    set({ trips: updated });

    syncEngine.sync().then(() => {
      get().loadTrips();
    }).catch(() => {});
  },

  deleteTrip: async (id) => {
    await tripsRepo.delete(id);
    await queueRepo.enqueue('TRIP', id, 'DELETE', {});

    const updated = await tripsRepo.list();
    set({ trips: updated });

    syncEngine.sync().catch(() => {});
  },

  syncWithServer: async () => {
    await syncEngine.sync();
    await get().loadTrips();
  },
}));
