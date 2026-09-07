import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { SyncQueueRepository, SyncQueueItem } from '../../../database/repositories/sync-queue-repository';
import { MediaQueueRepository, PendingMediaItem } from '../../../database/repositories/media-queue-repository';
import { SyncEngine } from '../../../sync/sync-engine';

export function SyncStatusScreen({ navigation }: any) {
  const [queueItems, setQueueItems] = useState<SyncQueueItem[]>([]);
  const [pendingMedia, setPendingMedia] = useState<PendingMediaItem[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncText, setLastSyncText] = useState('Nunca');

  const queueRepo = new SyncQueueRepository();
  const mediaRepo = new MediaQueueRepository();
  const syncEngine = new SyncEngine();

  const loadData = async () => {
    const q = await queueRepo.peek(50);
    const m = await mediaRepo.listPending();
    setQueueItems(q);
    setPendingMedia(m);
  };

  useEffect(() => {
    loadData();
    const unsubscribe = syncEngine.subscribe((state) => {
      setIsSyncing(state.isSyncing);
      if (state.lastSyncAt) {
        setLastSyncText(new Date(state.lastSyncAt).toLocaleTimeString());
      }
    });
    return () => unsubscribe();
  }, []);

  const handleManualSync = async () => {
    setIsSyncing(true);
    await syncEngine.sync();
    await loadData();
    setIsSyncing(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Fila de Sincronização</Text>
        <View style={{ width: 50 }} />
      </View>

      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Mutações pendentes:</Text>
          <Text style={styles.summaryValue}>{queueItems.length}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Fotos aguardando upload:</Text>
          <Text style={styles.summaryValue}>{pendingMedia.length}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Última sincronização:</Text>
          <Text style={styles.summaryValue}>{lastSyncText}</Text>
        </View>

        <TouchableOpacity
          style={[styles.syncButton, isSyncing && styles.syncButtonDisabled]}
          onPress={handleManualSync}
          disabled={isSyncing}
        >
          {isSyncing ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <Text style={styles.syncButtonText}>Sincronizar Agora 🔄</Text>
          )}
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Ações na Fila (FIFO)</Text>
      <FlatList
        data={queueItems}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.queueItem}>
            <View style={styles.queueHeader}>
              <Text style={styles.entityTag}>{item.entity_type}</Text>
              <Text style={styles.actionTag}>{item.action}</Text>
              <Text style={styles.attemptsTag}>Tentativas: {item.attempts}</Text>
            </View>
            <Text style={styles.payloadSnippet} numberOfLines={2}>
              {item.payload}
            </Text>
            {item.last_error ? (
              <Text style={styles.errorText}>Erro: {item.last_error}</Text>
            ) : null}
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>✓ Todas as alterações locais foram sincronizadas com o servidor!</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c0a09',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#292524',
  },
  backButton: {
    padding: 6,
  },
  backButtonText: {
    color: '#f59e0b',
    fontSize: 14,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  summaryCard: {
    backgroundColor: '#1c1917',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#292524',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    color: '#a8a29e',
    fontSize: 14,
  },
  summaryValue: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  syncButton: {
    backgroundColor: '#d97706',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  syncButtonDisabled: {
    opacity: 0.6,
  },
  syncButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#d6d3d1',
    marginHorizontal: 16,
    marginBottom: 8,
  },
  queueItem: {
    backgroundColor: '#1c1917',
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#292524',
  },
  queueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  entityTag: {
    backgroundColor: '#292524',
    color: '#f59e0b',
    fontSize: 11,
    fontWeight: 'bold',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  actionTag: {
    backgroundColor: '#0c0a09',
    color: '#34d399',
    fontSize: 11,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  attemptsTag: {
    color: '#78716c',
    fontSize: 11,
    marginLeft: 'auto',
  },
  payloadSnippet: {
    color: '#a8a29e',
    fontSize: 12,
    fontFamily: 'monospace',
  },
  errorText: {
    color: '#f87171',
    fontSize: 11,
    marginTop: 4,
  },
  emptyContainer: {
    padding: 30,
    alignItems: 'center',
  },
  emptyText: {
    color: '#34d399',
    textAlign: 'center',
    fontSize: 14,
  },
});
