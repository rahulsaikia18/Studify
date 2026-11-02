import { Platform } from 'react-native';

// For Android Emulator, localhost is 10.0.2.2. For physical devices/iOS, replace with your local IP or host.
export const API_BASE_URL = Platform.select({
  android: 'http://10.0.2.2:5000/api',
  ios: 'http://localhost:5000/api',
  web: 'http://localhost:5000/api',
  default: 'http://localhost:5000/api',
});
