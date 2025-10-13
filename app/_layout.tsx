import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import 'react-native-reanimated';

import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { UserProvider } from '../context/UserContext';
import { initDatabase } from '../services/database';

export const unstable_settings = {
  initialRouteName: 'Login',
};

function RootLayoutContent() {
  const { isDarkMode } = useTheme();

  useEffect(() => {
    initDatabase();
  }, []);

  return (
    <UserProvider>
      <NavigationThemeProvider value={isDarkMode ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="Login" options={{ headerShown: false }} />
          <Stack.Screen name="Signup" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="profile/edit" options={{ headerShown: false }} />
          <Stack.Screen name="profile/privacy" options={{ headerShown: false }} />
          <Stack.Screen name="profile/contact" options={{ headerShown: false }} />
        </Stack>
        <StatusBar style={isDarkMode ? "light" : "dark"} />
      </NavigationThemeProvider>
    </UserProvider>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
    <ThemeProvider>
      <RootLayoutContent />
    </ThemeProvider>
    </SafeAreaProvider>
  );
}
