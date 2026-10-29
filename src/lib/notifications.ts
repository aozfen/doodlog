import * as Notifications from 'expo-notifications';
import { Alert, Linking } from 'react-native';

import { EVENTS, GOALS, REMINDER_COPY } from '@/constants';
import type { Goal } from '@/types';

import { track } from './analytics';

// Reminders are local notifications: scheduled on the phone, no server.

// Also show the banner when the app is open.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Asks for permission if it was never asked. True when notifications may be sent.
 * iOS shows the system prompt only once; after a "no" only the Settings app can change it.
 */
export async function ensureNotificationPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const asked = await Notifications.requestPermissionsAsync();
  track(EVENTS.notificationPermission, { granted: asked.granted });
  return asked.granted;
}

/** After a "no": explain and offer the Settings app. */
export function showNotificationsOff() {
  Alert.alert('Bildirimler kapalı', 'Hatırlatma için Ayarlar’dan bildirimlere izin ver.', [
    { text: 'Vazgeç', style: 'cancel' },
    { text: 'Ayarları aç', onPress: () => Linking.openSettings() },
  ]);
}

/** Replaces all reminders with the goal's weekdays at the given time ("21:00"). */
export async function scheduleReminders(goal: Goal, time: string) {
  await cancelReminders();
  const [hour, minute] = time.split(':').map(Number);
  await Promise.all(
    GOALS[goal].weekdays.map((weekday) =>
      Notifications.scheduleNotificationAsync({
        content: { title: REMINDER_COPY.title, body: REMINDER_COPY.body },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.WEEKLY, weekday, hour, minute },
      }),
    ),
  );
}

export function cancelReminders() {
  return Notifications.cancelAllScheduledNotificationsAsync();
}
