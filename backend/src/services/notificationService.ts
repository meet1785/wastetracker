/**
 * Notification Service — stub for push notification delivery.
 * In production, integrate with Expo Push Notifications API or FCM/APNs.
 */

export interface PushNotification {
  to: string; // Expo push token
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: 'default' | null;
  badge?: number;
}

export interface NotificationResult {
  success: boolean;
  id?: string;
  error?: string;
}

/**
 * Sends a push notification to a specific device token.
 * Stub: logs to console and returns success.
 */
export async function sendPushNotification(
  notification: PushNotification
): Promise<NotificationResult> {
  console.log('[NotificationService] Sending push notification:', {
    to: notification.to,
    title: notification.title,
    body: notification.body,
  });

  // In production: POST to https://exp.host/--/api/v2/push/send
  return { success: true, id: `stub-${Date.now()}` };
}

/**
 * Sends batch expiry alerts for multiple items.
 */
export async function sendExpiryAlerts(
  pushToken: string,
  itemNames: string[],
  daysUntilExpiry: number
): Promise<NotificationResult> {
  const count = itemNames.length;
  const itemList = count <= 3 ? itemNames.join(', ') : `${itemNames.slice(0, 2).join(', ')} and ${count - 2} more`;
  const body = daysUntilExpiry === 0
    ? `${itemList} expire today!`
    : `${itemList} expire in ${daysUntilExpiry} day${daysUntilExpiry > 1 ? 's' : ''}`;

  return sendPushNotification({
    to: pushToken,
    title: '🕐 Items Expiring Soon',
    body,
    data: { type: 'expiry_alert', item_names: itemNames },
    sound: 'default',
  });
}

/**
 * Sends a gamification achievement notification.
 */
export async function sendAchievementNotification(
  pushToken: string,
  badgeName: string,
  points: number
): Promise<NotificationResult> {
  return sendPushNotification({
    to: pushToken,
    title: '🏆 Achievement Unlocked!',
    body: `You earned the "${badgeName}" badge and ${points} points!`,
    data: { type: 'achievement', badge_name: badgeName, points },
    sound: 'default',
  });
}
