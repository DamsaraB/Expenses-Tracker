import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { UserProvider } from './context/UserContext';
import { apiClient } from './services/api/api'; // Import your API client
import { initDatabase, resetDatabase } from './services/database';

export default function RootLayout() {
  useEffect(() => {
    const setupDatabase = async () => {
      try {
        // For development: reset database to apply new schema
        if (__DEV__) {
          resetDatabase(); // This will drop and recreate all tables
        } else {
          // For production: just initialize
          initDatabase();
        }
      } catch (error) {
      }
    };

    setupDatabase();

    // Load API token at startup
    apiClient.initToken();
  }, []);

  return (
    <UserProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="Login" options={{ headerShown: false }} />
        <Stack.Screen name="Signup" options={{ headerShown: false }} />
      </Stack>
    </UserProvider>
  );
}