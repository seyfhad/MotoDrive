import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { supabase } from '../supabaseClient';

export const FACEBOOK_REDIRECT_URI = 'com.motodrive.dz://auth/callback';

let initialized = false;

async function consumeCallback(url: string): Promise<void> {
  const callback = new URL(url);

  if (
    callback.protocol !== 'com.motodrive.dz:' ||
    callback.hostname !== 'auth' ||
    callback.pathname !== '/callback'
  ) {
    return;
  }

  const hash = new URLSearchParams(callback.hash.replace(/^#/, ''));
  const code = callback.searchParams.get('code');
  const error =
    callback.searchParams.get('error_description') || callback.searchParams.get('error');

  if (error) {
    throw new Error(decodeURIComponent(error));
  }

  if (code) {
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (exchangeError) throw exchangeError;
  } else {
    const accessToken = hash.get('access_token');
    const refreshToken = hash.get('refresh_token');

    if (accessToken && refreshToken) {
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (sessionError) throw sessionError;
    }
  }

  await Browser.close().catch(() => undefined);
  window.history.replaceState({}, document.title, '/');
}

export async function initializeDeepLinks(): Promise<void> {
  if (initialized || !Capacitor.isNativePlatform()) return;
  initialized = true;

  await App.addListener('appUrlOpen', ({ url }) => {
    void consumeCallback(url).catch((error) => {
      console.error('OAuth deep-link error:', error);
    });
  });

  const launch = await App.getLaunchUrl();
  if (launch?.url) {
    await consumeCallback(launch.url);
  }
}

export async function openFacebookOAuth(url: string): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    await Browser.open({ url, presentationStyle: 'popover' });
  } else {
    window.location.assign(url);
  }
}
