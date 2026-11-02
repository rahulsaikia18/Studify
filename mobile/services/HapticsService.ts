import { Platform } from 'react-native';

function getHaptics() {
  if (Platform.OS === 'web') return null;
  try {
    return require('expo-haptics');
  } catch {
    return null;
  }
}

export class HapticsService {
  static light() {
    const Haptics = getHaptics();
    if (Haptics) {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle?.Light);
      } catch {}
    }
  }

  static medium() {
    const Haptics = getHaptics();
    if (Haptics) {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle?.Medium);
      } catch {}
    }
  }

  static heavy() {
    const Haptics = getHaptics();
    if (Haptics) {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle?.Heavy);
      } catch {}
    }
  }

  static success() {
    const Haptics = getHaptics();
    if (Haptics) {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType?.Success);
      } catch {}
    }
  }

  static warning() {
    const Haptics = getHaptics();
    if (Haptics) {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType?.Warning);
      } catch {}
    }
  }
}
