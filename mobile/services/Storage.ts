import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const ACCESS_TOKEN_KEY = 'sb_access_token';
const REFRESH_TOKEN_KEY = 'sb_refresh_token';

function getSecureStore() {
  if (Platform.OS === 'web') return null;
  try {
    return require('expo-secure-store');
  } catch {
    return null;
  }
}

export const Storage = {
  async saveTokens(accessToken: string, refreshToken: string): Promise<void> {
    const SecureStore = getSecureStore();
    try {
      if (SecureStore && Platform.OS !== 'web') {
        await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
        await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
      } else {
        await AsyncStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
        await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      }
    } catch {
      await AsyncStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
      await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
  },

  async getAccessToken(): Promise<string | null> {
    const SecureStore = getSecureStore();
    try {
      if (SecureStore && Platform.OS !== 'web') {
        return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
      }
      return await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
    } catch {
      return await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
    }
  },

  async getRefreshToken(): Promise<string | null> {
    const SecureStore = getSecureStore();
    try {
      if (SecureStore && Platform.OS !== 'web') {
        return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
      }
      return await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
    } catch {
      return await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
    }
  },

  async clearTokens(): Promise<void> {
    const SecureStore = getSecureStore();
    try {
      if (SecureStore && Platform.OS !== 'web') {
        await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
        await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
      }
    } catch {}
    try {
      await AsyncStorage.removeItem(ACCESS_TOKEN_KEY);
      await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
    } catch {}
  },

  // Generic JSON caching for offline-first support
  async setItem<T>(key: string, value: T): Promise<void> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn('AsyncStorage set error:', e);
    }
  },

  async getItem<T>(key: string): Promise<T | null> {
    try {
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch {}
  },
};
