import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';

let initialized = false;

export const initDeepLinkListener = () => {
  if (initialized || !Capacitor.isNativePlatform()) return;
  initialized = true;

  try {
    App.addListener('appUrlOpen', async (data: { url: string }) => {
      console.log('App URL Opened:', data.url);
      if (Capacitor.isNativePlatform()) {
        await Browser.close().catch(() => undefined);
      }
    });
  } catch (err) {
    console.warn('Error setting up deep link listener:', err);
  }
};

export const initializeDeepLinks = async () => {
  initDeepLinkListener();
};

export const openFacebookOAuth = async () => {};
