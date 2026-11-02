import { Platform } from 'react-native';

let notificationsModule: any = null;
let isNotificationAvailable = false;

function getNotifications() {
  if (Platform.OS === 'web') return null;
  if (notificationsModule !== null) return notificationsModule;

  try {
    const mod = require('expo-notifications');
    if (mod && mod.setNotificationHandler) {
      mod.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });
      notificationsModule = mod;
      isNotificationAvailable = true;
      return notificationsModule;
    }
  } catch (e) {
    // Native module not linked (e.g. Expo Go standard runtime)
    isNotificationAvailable = false;
    notificationsModule = false;
  }
  return null;
}

export class NotificationService {
  static async requestPermissions(): Promise<boolean> {
    const Notifications = getNotifications();
    if (!Notifications) return false;

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      return finalStatus === 'granted';
    } catch {
      return false;
    }
  }

  static async scheduleStudyReminder(title: string, body: string, triggerDate: Date): Promise<string | null> {
    const Notifications = getNotifications();
    if (!Notifications) return null;

    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: 'default',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: triggerDate,
        },
      });
      return id;
    } catch (e) {
      console.warn('Failed to schedule study reminder notification:', e);
      return null;
    }
  }

  static async schedulePomodoroDone(minutes: number): Promise<string | null> {
    const Notifications = getNotifications();
    if (!Notifications) return null;

    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: '🍅 Focus Session Complete!',
          body: 'Great job! Time for a well-deserved short break.',
          sound: 'default',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: minutes * 60,
        },
      });
      return id;
    } catch {
      return null;
    }
  }

  static async cancelNotification(id: string): Promise<void> {
    const Notifications = getNotifications();
    if (!Notifications) return;

    try {
      await Notifications.cancelScheduledNotificationAsync(id);
    } catch {}
  }
}
