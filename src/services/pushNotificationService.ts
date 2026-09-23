// Push Notification Service for MotoDrive (Web Push / Browser Notifications API)
import { notificationSound } from '../utils/notificationSound';

export type PushPermissionStatus = 'granted' | 'denied' | 'default' | 'unsupported';

class PushNotificationService {
  private permission: PushPermissionStatus = 'default';

  constructor() {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      this.permission = Notification.permission as PushPermissionStatus;
    } else {
      this.permission = 'unsupported';
    }
  }

  getPermissionStatus(): PushPermissionStatus {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission as PushPermissionStatus;
    }
    return 'unsupported';
  }

  async requestPermission(): Promise<PushPermissionStatus> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported';
    }

    try {
      const result = await Notification.requestPermission();
      this.permission = result as PushPermissionStatus;
      localStorage.setItem('motodrive_push_permission', result);
      return this.permission;
    } catch (e) {
      console.warn('Error requesting Push notification permission:', e);
      return 'denied';
    }
  }

  sendPushNotification(
    title: string,
    body: string,
    options?: {
      tag?: string;
      icon?: string;
      soundType?: 'new_ride' | 'driver_arriving' | 'admin_update' | 'general';
      data?: any;
      onClickUrl?: string;
    }
  ) {
    const soundType = options?.soundType || 'general';

    // 1. Always play chime and vibration
    notificationSound.playChime(soundType);
    notificationSound.vibrate(
      soundType === 'new_ride' ? [300, 150, 300, 150, 400] : [200, 100, 200]
    );

    // 2. Trigger System Native Push Notification if permitted
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        try {
          const notif = new Notification(title, {
            body,
            icon: options?.icon || '/favicon.ico',
            badge: '/favicon.ico',
            tag: options?.tag || 'motodrive-alert',
            dir: 'rtl',
            lang: 'ar',
            data: options?.data,
          } as NotificationOptions);

          notif.onclick = () => {
            window.focus();
            notif.close();
          };
        } catch (err) {
          console.warn('System push notice:', err);
        }
      }
    }
  }
}

export const pushNotificationService = new PushNotificationService();
