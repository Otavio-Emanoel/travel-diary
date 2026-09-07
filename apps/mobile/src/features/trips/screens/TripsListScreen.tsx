import React, { useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { useTripsStore } from '../trips-store';
import { LocalTrip } from '../../../database/repositories/trips-repository';

export function TripsListScreen({ navigation }: any) {
  const { trips, isLoading, loadTrips, syncWithServer } = useTripsStore();

  useEffect(() => {
    loadTrips();
  }, []);

  const renderTripCard = ({ item }: { item: LocalTrip }) => {
    const isPending = item.sync_status !== 'SYNCED';

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('TripDetail', { tripId: item.id, title: item.title })}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.tripTitle}>{item.title}</Text>
          {isPending ? (
            <View style={styles.badgePending}>
              <Text style={styles.badgeText}>Offline ⏳</Text>
            </View>
          ) : (
            <View style={styles.badgeSynced}>
              <Text style={styles.badgeText}>Sincronizado ✓</Text>
            </View>
          )}
        </View>

        {item.description ? (
          <Text style={styles.tripDescription} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}

        <View style={styles.cardFooter}>
          <Text style={styles.dateText}>
            📅 {item.start_date} {item.end_date ? `até ${item.end_date}` : ''}
          </Text>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Minhas Viagens</Text>
        <TouchableOpacity
          style={styles.syncButton}
          onPress={() => navigation.navigate('SyncStatus')}
        >
          <Text style={styles.syncButtonText}>Fila 🔄</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={trips}
        keyExtractor={(item) => item.id}
        renderItem={renderTripCard}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={syncWithServer}
            tintColor="#f59e0b"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🌍</Text>
            <Text style={styles.emptyTitle}>Nenhuma viagem registrada</Text>
            <Text style={styles.emptyText}>
              Toque no botão central "+" para criar uma nota rápida ou comece planejando sua próxima aventura!
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#292524',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  syncButton: {
    backgroundColor: '#292524',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#44403c',
  },
  syncButtonText: {
    color: '#f59e0b',
    fontSize: 12,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  card: {
    backgroundColor: '#1c1917',
    borderRadius: 14,
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
  tripTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f5f5f4',
    flex: 1,
  },
  badgePending: {
    backgroundColor: '#78350f',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeSynced: {
    backgroundColor: '#064e3b',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ffffff',
  },
  tripDescription: {
    fontSize: 14,
    color: '#a8a29e',
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
  statusText: {
    fontSize: 12,
    color: '#f59e0b',
    fontWeight: '500',
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
