import { create } from 'zustand';
import { LocalEntry, EntriesRepository } from '../../database/repositories/entries-repository';
import { SyncQueueRepository } from '../../database/repositories/sync-queue-repository';
import { MediaQueueRepository } from '../../database/repositories/media-queue-repository';
import { SyncEngine } from '../../sync/sync-engine';
import { PhotoAsset } from '../../services/camera-service';
import { LocationResult } from '../../services/location-service';

interface EntriesState {
  entries: LocalEntry[];
  isLoading: boolean;
  loadEntries: (tripId: string) => Promise<void>;
  createQuickEntry: (params: {
    tripId: string;
    title?: string;
    content: string;
    category?: LocalEntry['category'];
    location?: LocationResult | null;
    photo?: PhotoAsset | null;
  }) => Promise<LocalEntry>;
}

const entriesRepo = new EntriesRepository();
const queueRepo = new SyncQueueRepository();
const mediaRepo = new MediaQueueRepository();
const syncEngine = new SyncEngine(undefined, entriesRepo, queueRepo, mediaRepo);

export const useEntriesStore = create<EntriesState>((set, get) => ({
  entries: [],
  isLoading: false,

  loadEntries: async (tripId: string) => {
    set({ isLoading: true });
    const local = await entriesRepo.listByTrip(tripId);
    set({ entries: local, isLoading: false });
  },

  createQuickEntry: async ({ tripId, title, content, category = 'NOTE', location, photo }) => {
    const id = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `entry_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    const todayStr = new Date().toISOString().split('T')[0];

    const newEntry: LocalEntry = {
      id,
      trip_id: tripId,
      title: title || null,
      content,
      entry_date: todayStr,
      category,
      latitude: location?.latitude ?? null,
      longitude: location?.longitude ?? null,
      location_name: location?.locationName ?? null,
      sync_status: 'PENDING_CREATE',
      updated_at: Date.now(),
    };

    // 1. Salvar no SQLite local (milissegundos)
    await entriesRepo.create(newEntry);

    // 2. Se houver foto capturada pela câmera/galeria, enfileirar upload de mídia
    if (photo) {
      const mediaId = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `media_${Date.now()}`;

      await mediaRepo.enqueue({
        id: mediaId,
        entryId: id,
        localFileUri: photo.uri,
        mimeType: photo.mimeType,
        sizeBytes: photo.sizeBytes,
      });
    }

    // 3. Adicionar ação na fila de sincronização
    await queueRepo.enqueue('ENTRY', id, 'CREATE', {
      tripId,
      title: newEntry.title,
      content: newEntry.content,
      entryDate: newEntry.entry_date,
      category: newEntry.category,
      location: location
        ? {
            name: location.locationName || 'Localização Registrada',
            latitude: location.latitude,
            longitude: location.longitude,
          }
        : undefined,
    });

    // 4. Atualizar UI imediatamente
    const current = get().entries;
    set({ entries: [newEntry, ...current] });

    // 5. Acionar o motor de sincronização em segundo plano
    syncEngine.sync().then(() => {
      get().loadEntries(tripId);
    }).catch(() => {});

    return newEntry;
  },
}));
