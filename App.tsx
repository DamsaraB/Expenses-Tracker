import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { UserProvider } from './context/UserContext';
import { initDatabase, resetDatabase } from './services/database';

export default function RootLayout() {
  useEffect(() => {
    const setupDatabase = async () => {
      try {
        // For development: reset database to apply new schema
        if (__DEV__) {
          console.log('Development mode: resetting database...');
          resetDatabase(); // This will drop and recreate all tables
        } else {
          // For production: just initialize
          initDatabase();
        }
      } catch (error) {
        console.error('Database setup error:', error);
      }
    };

    setupDatabase();
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