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
    _body: string,
    options?: {
      tag?: string;
      icon?: string;
      soundType?: 'new_ride' | 'driver_arriving' | 'admin_update' | 'general';
      vibrateDevice?: boolean;
      data?: any;
      onClickUrl?: string;
    }
  ) {
    const soundType = options?.soundType || 'general';

    // 1. Always play notification sound chime when any notification arrives (keeps notification pending in the header bell icon)
    notificationSound.playChime(soundType);

    // 2. Vibrate phone on driver acceptance of passenger ride or passenger ride request to driver
    const shouldVibrate =
      options?.vibrateDevice === true ||
      soundType === 'new_ride' ||
      title.includes('طلب') ||
      title.includes('قبول') ||
      title.includes('عرض') ||
      title.includes('وافق');

    if (shouldVibrate) {
      notificationSound.vibrate([350, 150, 350, 150, 450]);
    }
  }
}

export const pushNotificationService = new PushNotificationService();

