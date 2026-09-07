import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../features/auth/auth-store';
import { AuthNavigator } from './AuthNavigator';
import { MainTabNavigator } from './MainTabNavigator';
import { QuickEntryModal } from '../features/entries/screens/QuickEntryModal';
import { initDatabase } from '../database/sqlite-client';

const RootStack = createNativeStackNavigator();

export function RootNavigator() {
  const { isAuthenticated, isLoading, initializeAuth } = useAuthStore();

  useEffect(() => {
    initDatabase().then(() => {
      initializeAuth();
    });
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#f59e0b" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <RootStack.Group>
            <RootStack.Screen name="MainTabs" component={MainTabNavigator} />
            <RootStack.Screen
              name="QuickEntry"
              component={QuickEntryModal}
              options={{
                presentation: 'modal',
                animation: 'slide_from_bottom',
              }}
            />
          </RootStack.Group>
        ) : (
          <RootStack.Screen name="Auth" component={AuthNavigator} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0c0a09',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
