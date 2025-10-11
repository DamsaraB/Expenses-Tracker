import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_DATA: 'user_data',
  THEME: 'app_theme',
  CURRENCY: 'user_currency',
  LAST_SYNC: 'last_sync_timestamp',
  PENDING_SYNC: 'pending_sync_data',
} as const;

// Secure Storage (for sensitive data like tokens)
export const secureStorage = {
  async set(key: string, value: string): Promise<void> {
    await SecureStore.setItemAsync(key, value);
  },

  async get(key: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },

  async remove(key: string): Promise<void> {
    await SecureStore.deleteItemAsync(key);
  },

  async clear(): Promise<void> {
    await SecureStore.deleteItemAsync(STORAGE_KEYS.AUTH_TOKEN);
    await SecureStore.deleteItemAsync(STORAGE_KEYS.USER_DATA);
  },
};

// Regular Storage (for non-sensitive data)
export const storage = {
  async set(key: string, value: any): Promise<void> {
    const jsonValue = JSON.stringify(value);
    await AsyncStorage.setItem(key, jsonValue);
  },

  async get<T>(key: string): Promise<T | null> {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      return jsonValue ? JSON.parse(jsonValue) : null;
    } catch {
      return null;
    }
  },

  async remove(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
  },

  async clear(): Promise<void> {
    await AsyncStorage.clear();
  },

  async multiGet(keys: string[]): Promise<Record<string, any>> {
    const pairs = await AsyncStorage.multiGet(keys);
    return pairs.reduce((acc, [key, value]) => {
      acc[key] = value ? JSON.parse(value) : null;
      return acc;
    }, {} as Record<string, any>);
  },

  async multiSet(keyValuePairs: [string, any][]): Promise<void> {
    const stringifiedPairs = keyValuePairs.map(([key, value]) => [
      key,
      JSON.stringify(value),
    ]) as [string, string][];
    await AsyncStorage.multiSet(stringifiedPairs);
  },
};

// User Data Storage
export const userStorage = {
  async saveUser(user: any): Promise<void> {
    await secureStorage.set(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
  },

  async getUser<T>(): Promise<T | null> {
    const userData = await secureStorage.get(STORAGE_KEYS.USER_DATA);
    return userData ? JSON.parse(userData) : null;
  },

  async clearUser(): Promise<void> {
    await secureStorage.remove(STORAGE_KEYS.USER_DATA);
  },
};

// Auth Token Storage
export const tokenStorage = {
  async saveToken(token: string): Promise<void> {
    await secureStorage.set(STORAGE_KEYS.AUTH_TOKEN, token);
  },

  async getToken(): Promise<string | null> {
    return await secureStorage.get(STORAGE_KEYS.AUTH_TOKEN);
  },

  async clearToken(): Promise<void> {
    await secureStorage.remove(STORAGE_KEYS.AUTH_TOKEN);
  },
};

// Sync Data Storage (for offline-first approach)
export const syncStorage = {
  async savePendingSync(data: any[]): Promise<void> {
    await storage.set(STORAGE_KEYS.PENDING_SYNC, data);
  },

  async getPendingSync<T>(): Promise<T[]> {
    return (await storage.get<T[]>(STORAGE_KEYS.PENDING_SYNC)) || [];
  },

  async clearPendingSync(): Promise<void> {
    await storage.remove(STORAGE_KEYS.PENDING_SYNC);
  },

  async saveLastSync(timestamp: number): Promise<void> {
    await storage.set(STORAGE_KEYS.LAST_SYNC, timestamp);
  },

  async getLastSync(): Promise<number | null> {
    return await storage.get<number>(STORAGE_KEYS.LAST_SYNC);
  },
};