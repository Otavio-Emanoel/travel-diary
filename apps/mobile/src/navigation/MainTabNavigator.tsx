import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TripsListScreen } from '../features/trips/screens/TripsListScreen';
import { TripDetailScreen } from '../features/trips/screens/TripDetailScreen';
import { QuickEntryModal } from '../features/entries/screens/QuickEntryModal';
import { SyncStatusScreen } from '../features/sync/screens/SyncStatusScreen';

const Tab = createBottomTabNavigator();
const TripsStack = createNativeStackNavigator();

function TripsStackNavigator() {
  return (
    <TripsStack.Navigator screenOptions={{ headerShown: false }}>
      <TripsStack.Screen name="TripsList" component={TripsListScreen} />
      <TripsStack.Screen name="TripDetail" component={TripDetailScreen} />
    </TripsStack.Navigator>
  );
}

// Componente placeholder para o botão central Quick Entry
function EmptyComponent() {
  return null;
}

export function MainTabNavigator({ navigation }: any) {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#1c1917',
          borderTopColor: '#292524',
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#f59e0b',
        tabBarInactiveTintColor: '#78716c',
      }}
    >
      <Tab.Screen
        name="TripsTab"
        component={TripsStackNavigator}
        options={{
          tabBarLabel: 'Viagens',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>✈️</Text>,
        }}
      />

      <Tab.Screen
        name="QuickEntryTab"
        component={EmptyComponent}
        options={{
          tabBarLabel: '',
          tabBarButton: () => (
            <TouchableOpacity
              style={styles.quickButtonContainer}
              onPress={() => navigation.navigate('QuickEntry')}
            >
              <View style={styles.quickButton}>
                <Text style={styles.quickButtonIcon}>+</Text>
              </View>
            </TouchableOpacity>
          ),
        }}
      />

      <Tab.Screen
        name="SyncTab"
        component={SyncStatusScreen}
        options={{
          tabBarLabel: 'Sincronização',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🔄</Text>,
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  quickButtonContainer: {
    top: -16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#d97706',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 3,
    borderColor: '#0c0a09',
  },
  quickButtonIcon: {
    fontSize: 32,
    color: '#ffffff',
    fontWeight: 'bold',
    marginTop: -2,
  },
});
