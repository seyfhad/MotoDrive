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

    // Check URL query parameter or permanent flag indicating this instance is an installed app (PWA / APK / TWA)
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('app_source') === 'pwa' || params.get('mode') === 'app') {
        localStorage.setItem('motodrive_installed_app_env', 'true');
      }
    } catch {}

    const hasPermanentAppFlag = (() => {
      try {
        return localStorage.getItem('motodrive_installed_app_env') === 'true';
      } catch {
        return false;
      }
    })();

    // Check if running as native Capacitor app
    const isNativeCapacitor = Capacitor.isNativePlatform();
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://');

    if (isStandalone || isNativeCapacitor) {
      document.documentElement.classList.add('is-capacitor');
      document.body.classList.add('is-capacitor');
    }

    this.isInstalledState = isStandalone || isNativeCapacitor;

    // Listen for display-mode changes dynamically
    try {
      const mql = window.matchMedia('(display-mode: standalone)');
      const onChange = (e: MediaQueryListEvent) => {
        if (e.matches) {
          this.isInstalledState = true;
          this.notifyListeners();
        }
      };
      if (mql.addEventListener) {
        mql.addEventListener('change', onChange);
      }
    } catch {}

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
    try {
      return Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'web';
    } catch {
      return false;
    }
  }

  // Check if installed on phone home screen
  public isInstalled(): boolean {
    return this.isInstalledState || this.isCapacitorNative();
  }

  /**
   * Returns true if running inside ANY mobile/installed application:
   * - Native Android APK / AAB (Capacitor / Cordova / Android Bridge)
   * - Android WebView (`wv`, `Version/X.X Chrome/... Mobile`)
   * - Trusted Web Activity (TWA: `android-app://` referrer)
   * - Installed PWA / Home Screen WebAPK (`display-mode: standalone/fullscreen/minimal-ui` or `?app_source=pwa`)
   * Admin access is strictly and permanently forbidden in this mode.
   */
  public isStandaloneOrNativeApp(): boolean {
    if (typeof window === 'undefined') return false;
    try {
      if (Capacitor.isNativePlatform() || (Capacitor.getPlatform && Capacitor.getPlatform() !== 'web')) {
        return true;
      }
    } catch {}

    const protocol = window.location?.protocol || '';
    if (protocol === 'capacitor:' || protocol === 'file:' || protocol === 'ionic:') {
      return true;
    }

    // Only strictly native wrapped android bridges
    const win = window as any;
    if (win.AndroidBridge || (win.Capacitor && typeof win.Capacitor.isNativePlatform === 'function' && win.Capacitor.isNativePlatform())) {
      return true;
    }

    return false;
  }

  /**
   * Returns true when opened as a web application (desktop, mobile web, preview iframe, etc.)
   */
  public isWebBrowserEnvironment(): boolean {
    return !this.isStandaloneOrNativeApp();
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
