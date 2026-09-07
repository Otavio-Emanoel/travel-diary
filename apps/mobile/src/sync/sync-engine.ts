import { TripsRepository } from '../database/repositories/trips-repository';
import { EntriesRepository } from '../database/repositories/entries-repository';
import { SyncQueueRepository, SyncQueueItem } from '../database/repositories/sync-queue-repository';
import { MediaQueueRepository } from '../database/repositories/media-queue-repository';
import { MobileApiClient, mobileApiClient } from '../services/api-client';

export interface SyncEngineState {
  isSyncing: boolean;
  pendingCount: number;
  lastSyncAt: number | null;
  lastError: string | null;
}

export type SyncListener = (state: SyncEngineState) => void;

export class SyncEngine {
  private isSyncing = false;
  private lastSyncAt: number | null = null;
  private lastError: string | null = null;
  private listeners: Set<SyncListener> = new Set();
  private netInfoUnsubscribe: (() => void) | null = null;

  constructor(
    private tripsRepo: TripsRepository = new TripsRepository(),
    private entriesRepo: EntriesRepository = new EntriesRepository(),
    private queueRepo: SyncQueueRepository = new SyncQueueRepository(),
    private mediaRepo: MediaQueueRepository = new MediaQueueRepository(),
    private apiClient: MobileApiClient = mobileApiClient
  ) {}

  subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  private notify() {
    const state = this.getState();
    this.listeners.forEach((l) => l(state));
  }

  getState(): SyncEngineState {
    return {
      isSyncing: this.isSyncing,
      pendingCount: 0, // atualizado dinamicamente
      lastSyncAt: this.lastSyncAt,
      lastError: this.lastError,
    };
  }

  /**
   * Inicializa o listener de conectividade de rede com NetInfo
   */
  async startNetworkMonitoring(): Promise<void> {
    try {
      const NetInfo = await import('@react-native-community/netinfo');
      if (NetInfo && NetInfo.default && NetInfo.default.addEventListener) {
        this.netInfoUnsubscribe = NetInfo.default.addEventListener((state) => {
          if (state.isConnected && state.isInternetReachable) {
            this.sync().catch(() => {});
          }
        });
      }
    } catch (_e) {
      // Ignora se não estiver em ambiente React Native com NetInfo nativo
    }
  }

  stopNetworkMonitoring(): void {
    if (this.netInfoUnsubscribe) {
      this.netInfoUnsubscribe();
      this.netInfoUnsubscribe = null;
    }
  }

  /**
   * Ciclo completo de Sincronização:
   * 1. Processa fila de mutações pendentes (Push)
   * 2. Processa fila de upload de mídias pendentes
   * 3. Busca alterações do servidor para atualização local (Pull)
   */
  async sync(): Promise<{ success: boolean; error?: string }> {
    if (this.isSyncing) {
      return { success: true };
    }

    this.isSyncing = true;
    this.lastError = null;
    this.notify();

    try {
      // 1. Processar itens da sync_queue
      await this.processSyncQueue();

      // 2. Processar uploads de mídia pendentes
      await this.processMediaQueue();

      // 3. Buscar dados atualizados do servidor se autenticado
      if (this.apiClient.getAccessToken()) {
        await this.pullRemoteChanges();
      }

      this.lastSyncAt = Date.now();
      this.isSyncing = false;
      this.notify();
      return { success: true };
    } catch (err: any) {
      this.lastError = err?.message || 'Falha na sincronização';
      this.isSyncing = false;
      this.notify();
      return { success: false, error: this.lastError || undefined };
    }
  }

  /**
   * Processa itens na fila em ordem FIFO
   */
  async processSyncQueue(): Promise<void> {
    const items = await this.queueRepo.peek(20);

    for (const item of items) {
      try {
        const payload = JSON.parse(item.payload);
        const result = await this.executeQueueItem(item, payload);

        if (result.success) {
          await this.queueRepo.dequeue(item.id);
        } else if (result.networkError) {
          // Erro de rede: pausa a sincronização para tentar mais tarde
          await this.queueRepo.recordError(item.id, result.error || 'Network error');
          break;
        } else {
          // Erro de validação ou 4xx
          await this.queueRepo.recordError(item.id, result.error || 'Request failed');
          if (item.attempts >= 5) {
            // Desiste após 5 tentativas consecutivas de erro irrecuperável
            await this.queueRepo.dequeue(item.id);
          }
        }
      } catch (e: any) {
        await this.queueRepo.recordError(item.id, e?.message || 'Payload parse error');
      }
    }
  }

  private async executeQueueItem(
    item: SyncQueueItem,
    payload: any
  ): Promise<{ success: boolean; networkError?: boolean; error?: string }> {
    if (item.entity_type === 'TRIP') {
      if (item.action === 'CREATE') {
        const res = await this.apiClient.createTrip(payload);
        if (res.error?.code === 'NETWORK_ERROR') return { success: false, networkError: true };
        if (res.error) return { success: false, error: res.error.message };

        await this.tripsRepo.updateSyncStatus(item.entity_id, 'SYNCED');
        return { success: true };
      }

      if (item.action === 'UPDATE') {
        const res = await this.apiClient.updateTrip(item.entity_id, payload);
        if (res.error?.code === 'NETWORK_ERROR') return { success: false, networkError: true };
        if (res.error) return { success: false, error: res.error.message };

        await this.tripsRepo.updateSyncStatus(item.entity_id, 'SYNCED');
        return { success: true };
      }

      if (item.action === 'DELETE') {
        const res = await this.apiClient.deleteTrip(item.entity_id);
        if (res.error?.code === 'NETWORK_ERROR') return { success: false, networkError: true };
        if (res.error) return { success: false, error: res.error.message };

        return { success: true };
      }
    }

    if (item.entity_type === 'ENTRY') {
      const tripId = payload.tripId || payload.trip_id;

      if (item.action === 'CREATE') {
        const res = await this.apiClient.createEntry(tripId, payload);
        if (res.error?.code === 'NETWORK_ERROR') return { success: false, networkError: true };
        if (res.error) return { success: false, error: res.error.message };

        await this.entriesRepo.updateSyncStatus(item.entity_id, 'SYNCED');
        return { success: true };
      }

      if (item.action === 'UPDATE') {
        const res = await this.apiClient.updateEntry(tripId, item.entity_id, payload);
        if (res.error?.code === 'NETWORK_ERROR') return { success: false, networkError: true };
        if (res.error) return { success: false, error: res.error.message };

        await this.entriesRepo.updateSyncStatus(item.entity_id, 'SYNCED');
        return { success: true };
      }

      if (item.action === 'DELETE') {
        const res = await this.apiClient.deleteEntry(tripId, item.entity_id);
        if (res.error?.code === 'NETWORK_ERROR') return { success: false, networkError: true };
        if (res.error) return { success: false, error: res.error.message };

        return { success: true };
      }
    }

    return { success: true };
  }

  /**
   * Processa fotos na fila de upload
   */
  async processMediaQueue(): Promise<void> {
    const pending = await this.mediaRepo.listPending();

    for (const item of pending) {
      try {
        await this.mediaRepo.updateStatus(item.id, 'UPLOADING');

        // 1. Obter URL pré-assinada
        const presignedRes = await this.apiClient.getPresignedUploadUrl(
          `entry_${item.entry_id}_${item.id}.jpg`,
          item.mime_type,
          item.size_bytes
        );

        if (presignedRes.error || !presignedRes.data) {
          await this.mediaRepo.updateStatus(item.id, 'FAILED');
          continue;
        }

        const { uploadUrl, storageKey } = presignedRes.data;

        // 2. Upload binário direto para MinIO/S3
        try {
          // Em React Native real: fetch(uploadUrl, { method: 'PUT', body: blob/uri })
          const uploadRes = await fetch(uploadUrl, {
            method: 'PUT',
            headers: { 'Content-Type': item.mime_type },
            body: item.local_file_uri,
          });

          if (!uploadRes.ok && uploadRes.status !== 200) {
            await this.mediaRepo.updateStatus(item.id, 'FAILED');
            continue;
          }
        } catch (_uploadErr) {
          await this.mediaRepo.updateStatus(item.id, 'FAILED');
          continue;
        }

        // 3. Confirmar mídia na API
        const confirmRes = await this.apiClient.confirmMedia({
          entryId: item.entry_id,
          storageKey,
          filename: `photo_${item.id}.jpg`,
          mimeType: item.mime_type,
          sizeBytes: item.size_bytes,
        });

        if (confirmRes.data) {
          await this.mediaRepo.delete(item.id);
        } else {
          await this.mediaRepo.updateStatus(item.id, 'FAILED');
        }
      } catch (_e) {
        await this.mediaRepo.updateStatus(item.id, 'FAILED');
      }
    }
  }

  /**
   * Puxa atualizações do servidor e reconcilia via Last Write Wins
   */
  async pullRemoteChanges(): Promise<void> {
    const res = await this.apiClient.getTrips();
    if (!res.data || !Array.isArray(res.data)) return;

    for (const trip of res.data) {
      await this.tripsRepo.upsertFromServer(trip);

      // Baixar entradas da viagem
      const timelineRes = await this.apiClient.getTimeline(trip.id);
      if (timelineRes.data?.days && Array.isArray(timelineRes.data.days)) {
        for (const day of timelineRes.data.days) {
          if (day.entries && Array.isArray(day.entries)) {
            for (const entry of day.entries) {
              await this.entriesRepo.upsertFromServer({
                id: entry.id,
                tripId: trip.id,
                title: entry.title,
                content: entry.content,
                entryDate: day.date,
                category: entry.category,
                latitude: entry.location?.latitude,
                longitude: entry.location?.longitude,
                locationName: entry.location?.name,
                updatedAt: entry.createdAt,
              });
            }
          }
        }
      }
    }
  }
}
