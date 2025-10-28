import NetInfo from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';

// Network status types
export interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: string | null;
}

// Check current network status
export const getNetworkState = async (): Promise<NetworkState> => {
  const state = await NetInfo.fetch();
  return {
    isConnected: state.isConnected ?? false,
    isInternetReachable: state.isInternetReachable,
    type: state.type,
  };
};

// Hook to monitor network status
export const useNetworkStatus = () => {
  const [networkState, setNetworkState] = useState<NetworkState>({
    isConnected: true,
    isInternetReachable: null,
    type: null,
  });

  useEffect(() => {
    // Get initial state
    getNetworkState().then(setNetworkState);

    // Subscribe to network state changes
    const unsubscribe = NetInfo.addEventListener(state => {
      setNetworkState({
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable,
        type: state.type,
      });
    });

    return () => unsubscribe();
  }, []);

  return networkState;
};

// Check if device is online
export const isOnline = async (): Promise<boolean> => {
  const state = await NetInfo.fetch();
  return state.isConnected ?? false;
};

// Wait for network connection
export const waitForConnection = (timeout: number = 30000): Promise<boolean> => {
  return new Promise((resolve) => {
    const timeoutId = setTimeout(() => {
      unsubscribe();
      resolve(false);
    }, timeout);

    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected) {
        clearTimeout(timeoutId);
        unsubscribe();
        resolve(true);
      }
    });
  });
};

// Retry function with exponential backoff
export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: Error;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (i < maxRetries - 1) {
        // Exponential backoff: 1s, 2s, 4s, etc.
        const waitTime = delay * Math.pow(2, i);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        
        // Check if we're back online before retrying
        const online = await isOnline();
        if (!online) {
          // Wait for connection
          const connected = await waitForConnection(10000);
          if (!connected) {
            throw new Error('No internet connection');
          }
        }
      }
    }
  }

  throw lastError!;
};

// Queue for offline requests
export class OfflineQueue {
  private queue: Array<{
    id: string;
    request: () => Promise<any>;
    timestamp: number;
  }> = [];

  add(id: string, request: () => Promise<any>) {
    this.queue.push({
      id,
      request,
      timestamp: Date.now(),
    });
  }

  async processQueue(): Promise<void> {
    while (this.queue.length > 0) {
      const item = this.queue[0];
      
      try {
        await item.request();
        this.queue.shift(); // Remove from queue on success
      } catch (error) {
        // Keep in queue to retry later
        throw error;
      }
    }
  }

  clear() {
    this.queue = [];
  }

  getSize() {
    return this.queue.length;
  }

  getItems() {
    return [...this.queue];
  }
}

// Singleton instance of offline queue
export const offlineQueue = new OfflineQueue();

// Network error handler
export const handleNetworkError = (error: any): string => {
  if (error.message?.includes('Network request failed')) {
    return 'No internet connection. Please check your network.';
  }
  if (error.message?.includes('timeout')) {
    return 'Request timed out. Please try again.';
  }
  return error.message || 'An error occurred';
};

// React Query network mode configuration
export const getQueryClientConfig = () => ({
  defaultOptions: {
    queries: {
      networkMode: 'offlineFirst' as const,
      retry: (failureCount: number, error: any) => {
        // Don't retry on 4xx errors
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        // Retry up to 2 times for network errors
        return failureCount < 2;
      },
      retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      networkMode: 'offlineFirst' as const,
      retry: 1,
    },
  },
});

// Example usage with React Query
export const createOfflineFirstQueryClient = () => {
  const { QueryClient } = require('@tanstack/react-query');
  return new QueryClient(getQueryClientConfig());
};