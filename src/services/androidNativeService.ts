import { Capacitor } from '@capacitor/core';

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

class AndroidNativeService {
  private deferredPrompt: BeforeInstallPromptEvent | null = null;
  private isInstalledState = false;
  private listeners: Array<() => void> = [];

  constructor() {
    this.init();
  }

  private init() {
    if (typeof window === 'undefined') return;

    // Check if running in standalone mode (installed as native Android app/PWA)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://');

    this.isInstalledState = isStandalone;

    // Listen for Android beforeinstallprompt
    window.addEventListener('beforeinstallprompt', (e: Event) => {
      e.preventDefault();
      this.deferredPrompt = e as BeforeInstallPromptEvent;
      this.notifyListeners();
    });

    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
      this.isInstalledState = true;
      this.deferredPrompt = null;
      this.notifyListeners();
      this.vibrateSuccess();
    });

    // Setup Android hardware back button handler
    this.setupHardwareBackButton();

    // Register Service Worker
    this.registerServiceWorker();
  }

  private setupHardwareBackButton() {
    if (typeof window === 'undefined') return;

    // Browser/Android back button hook
    window.addEventListener('popstate', () => {
      // Dispatches custom event so active modals or screens can close smoothly
      const handled = window.dispatchEvent(
        new CustomEvent('android-back-button', { cancelable: true })
      );
      if (!handled) {
        // Handled by modal
      }
    });
  }

  private registerServiceWorker() {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => {
            console.log('MotoDrive Android ServiceWorker active:', reg.scope);
          })
          .catch((err) => {
            console.warn('MotoDrive ServiceWorker error:', err);
          });
      });
    }
  }

  // Check if running on Android device
  public isAndroid(): boolean {
    if (typeof navigator === 'undefined') return false;
    return /Android/i.test(navigator.userAgent);
  }

  // Check if running as native Capacitor app
  public isCapacitorNative(): boolean {
    return Capacitor.isNativePlatform();
  }

  // Check if installed on phone home screen
  public isInstalled(): boolean {
    return this.isInstalledState || this.isCapacitorNative();
  }

  // Check if 1-tap installation is available
  public canInstallDirectly(): boolean {
    return !!this.deferredPrompt;
  }

  // Trigger 1-tap Android installation
  public async promptInstall(): Promise<boolean> {
    if (!this.deferredPrompt) {
      return false;
    }

    try {
      await this.deferredPrompt.prompt();
      const choice = await this.deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        this.isInstalledState = true;
        this.deferredPrompt = null;
        this.notifyListeners();
        this.vibrateSuccess();
        return true;
      }
    } catch (e) {
      console.error('Install prompt error:', e);
    }
    return false;
  }

  // Native Android Vibration / Haptics
  public vibrateTap() {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(15);
      } catch (e) {
        // ignore
      }
    }
  }

  public vibrateSuccess() {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([30, 50, 30]);
      } catch (e) {
        // ignore
      }
    }
  }

  public vibrateWarning() {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([100, 50, 100]);
      } catch (e) {
        // ignore
      }
    }
  }

  public vibrateEmergency() {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([300, 100, 300, 100, 500]);
      } catch (e) {
        // ignore
      }
    }
  }

  public subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((l) => l());
  }
}

export const androidNativeService = new AndroidNativeService();
