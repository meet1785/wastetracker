import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function requestPermissions(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('[Notifications] Permission not granted');
    return false;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('expiry-alerts', {
      name: 'Expiry Alerts',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#22C55E',
    });
  }

  return true;
}

export async function getExpoPushToken(): Promise<string | null> {
  try {
    const token = await Notifications.getExpoPushTokenAsync();
    return token.data;
  } catch (err) {
    console.warn('[Notifications] Could not get push token:', err);
    return null;
  }
}

export async function scheduleExpiryAlert(
  itemName: string,
  expiryDate: Date,
  daysBeforeExpiry: number = 1
): Promise<string | null> {
  const triggerDate = new Date(expiryDate);
  triggerDate.setDate(triggerDate.getDate() - daysBeforeExpiry);
  triggerDate.setHours(9, 0, 0, 0); // 9 AM

  if (triggerDate <= new Date()) return null;

  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: '🕐 Item Expiring Soon',
        body: `${itemName} expires ${daysBeforeExpiry === 0 ? 'today' : `in ${daysBeforeExpiry} day${daysBeforeExpiry > 1 ? 's' : ''}`}!`,
        data: { type: 'expiry_alert', item_name: itemName },
        sound: 'default',
      },
      trigger: { date: triggerDate },
    });
    return id;
  } catch (err) {
    console.warn('[Notifications] Failed to schedule notification:', err);
    return null;
  }
}

export async function cancelNotification(notificationId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
