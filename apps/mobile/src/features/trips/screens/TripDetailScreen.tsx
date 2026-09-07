import React, { useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useEntriesStore } from '../../entries/entries-store';
import { LocalEntry } from '../../../database/repositories/entries-repository';

export function TripDetailScreen({ route, navigation }: any) {
  const { tripId, title } = route.params || {};
  const { entries, isLoading, loadEntries } = useEntriesStore();

  useEffect(() => {
    if (tripId) {
      loadEntries(tripId);
    }
  }, [tripId]);

  const renderEntryCard = ({ item }: { item: LocalEntry }) => {
    const isPending = item.sync_status !== 'SYNCED';

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.badgeCategory}>
            <Text style={styles.badgeCategoryText}>{item.category}</Text>
          </View>
          {isPending ? (
            <Text style={styles.offlineIndicator}>⏳ Pendente</Text>
          ) : (
            <Text style={styles.syncedIndicator}>✓ Salvo</Text>
          )}
        </View>

        {item.title ? <Text style={styles.entryTitle}>{item.title}</Text> : null}
        <Text style={styles.entryContent}>{item.content}</Text>

        <View style={styles.cardFooter}>
          <Text style={styles.dateText}>📅 {item.entry_date}</Text>
          {item.location_name ? (
            <Text style={styles.locationText} numberOfLines={1}>
              📍 {item.location_name}
            </Text>
          ) : null}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {title || 'Diário da Viagem'}
        </Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('QuickEntry', { tripId })}
          style={styles.addButton}
        >
          <Text style={styles.addButtonText}>+ Nota</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={entries}
        keyExtractor={(item) => item.id}
        renderItem={renderEntryCard}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={() => loadEntries(tripId)}
            tintColor="#f59e0b"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>✍️</Text>
            <Text style={styles.emptyTitle}>Nenhuma anotação nesta viagem</Text>
            <Text style={styles.emptyText}>
              Toque no botão "+ Nota" acima para registrar sua primeira memória de viagem!
            </Text>
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
    padding: 8,
  },
  backButtonText: {
    color: '#f59e0b',
    fontSize: 14,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  addButton: {
    backgroundColor: '#d97706',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  listContent: {
    padding: 16,
  },
  card: {
    backgroundColor: '#1c1917',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#292524',
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgeCategory: {
    backgroundColor: '#292524',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#44403c',
  },
  badgeCategoryText: {
    color: '#f59e0b',
    fontSize: 11,
    fontWeight: 'bold',
  },
  offlineIndicator: {
    color: '#fbbf24',
    fontSize: 11,
  },
  syncedIndicator: {
    color: '#34d399',
    fontSize: 11,
  },
  entryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f5f5f4',
    marginBottom: 4,
  },
  entryContent: {
    fontSize: 14,
    color: '#d6d3d1',
    lineHeight: 20,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#292524',
    paddingTop: 8,
  },
  dateText: {
    fontSize: 12,
    color: '#78716c',
  },
  locationText: {
    fontSize: 12,
    color: '#a8a29e',
    maxWidth: '60%',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#d6d3d1',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#78716c',
    textAlign: 'center',
    lineHeight: 20,
  },
});
