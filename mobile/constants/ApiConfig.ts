import { Platform } from 'react-native';

// Uses EXPO_PUBLIC_API_URL from .env if defined, otherwise falls back to platform defaults
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  Platform.select({
    android: 'http://10.0.2.2:5000/api',
    ios: 'http://localhost:5000/api',
    web: 'http://localhost:5000/api',
    default: 'http://localhost:5000/api',
  });
