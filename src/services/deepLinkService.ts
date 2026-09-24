import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { supabase } from '../supabaseClient';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { signInAnonymously } from 'firebase/auth';
import { UserProfile } from '../types';

export const FACEBOOK_REDIRECT_URI = 'com.motodrive.dz://auth/callback';

let initialized = false;

function isOAuthCallbackUrl(urlStr: string): boolean {
  if (!urlStr) return false;
  return (
    urlStr.startsWith('com.motodrive.dz') ||
    urlStr.includes('auth/callback') ||
    urlStr.includes('code=') ||
    urlStr.includes('access_token=')
  );
}

function parseOAuthUrlParams(urlStr: string): {
  code: string | null;
  accessToken: string | null;
  refreshToken: string | null;
  error: string | null;
} {
  let code: string | null = null;
  let accessToken: string | null = null;
  let refreshToken: string | null = null;
  let error: string | null = null;

  try {
    // 1. Extract query params ?code=...
    const queryIdx = urlStr.indexOf('?');
    if (queryIdx !== -1) {
      const queryStr = urlStr.substring(queryIdx + 1).split('#')[0];
      const qParams = new URLSearchParams(queryStr);
      code = qParams.get('code');
      error = qParams.get('error_description') || qParams.get('error');
    }

    // 2. Extract hash params #access_token=...
    const hashIdx = urlStr.indexOf('#');
    if (hashIdx !== -1) {
      const hashStr = urlStr.substring(hashIdx + 1);
      const hParams = new URLSearchParams(hashStr);
      if (!accessToken) accessToken = hParams.get('access_token');
      if (!refreshToken) refreshToken = hParams.get('refresh_token');
      if (!error) error = hParams.get('error_description') || hParams.get('error');
    }
  } catch (e) {
    console.warn('Error parsing deep link parameters:', e);
  }

  return { code, accessToken, refreshToken, error };
}

async function consumeCallback(urlStr: string): Promise<void> {
  console.log('Consuming OAuth callback URL:', urlStr);
  if (!isOAuthCallbackUrl(urlStr)) return;

  try {
    const { code, accessToken, refreshToken, error } = parseOAuthUrlParams(urlStr);

    if (error) {
      console.error('OAuth Callback Error from Provider:', error);
      await Browser.close().catch(() => undefined);
      return;
    }

    if (code) {
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      if (exchangeError) console.warn('Supabase code exchange notice:', exchangeError.message);
    } else if (accessToken && refreshToken) {
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (sessionError) console.warn('Supabase setSession notice:', sessionError.message);
    }

    // Retrieve active Supabase OAuth user profile
    const { data: userData } = await supabase.auth.getUser();
    if (userData?.user) {
      const sbUser = userData.user;
      const displayName =
        sbUser.user_metadata?.full_name ||
        sbUser.user_metadata?.name ||
        sbUser.email?.split('@')[0] ||
        'مستخدم فيسبوك';
      const photoUrl = sbUser.user_metadata?.avatar_url || sbUser.user_metadata?.picture;

      const profile: UserProfile = {
        id: sbUser.id,
        name: displayName,
        email: sbUser.email || undefined,
        photoUrl: photoUrl || undefined,
        phone: sbUser.user_metadata?.phone || '0550123456',
        role: sbUser.email === 'seyfhad@gmail.com' ? 'admin' : 'passenger',
        status: 'active',
        cancellationCount: 0,
        createdAt: sbUser.created_at || new Date().toISOString(),
      };

      // Sync user profile in Firestore
      try {
        await setDoc(
          doc(db, 'users', sbUser.id),
          { ...profile, updatedAt: serverTimestamp() },
          { merge: true }
        );
      } catch (fsErr) {
        console.warn('Firestore profile sync error on deep link callback:', fsErr);
      }

      // Save user session in localStorage for instant boot
      localStorage.setItem('motodrive_user_session', JSON.stringify({ user: profile, timestamp: Date.now() }));

      // Authenticate with Firebase if needed
      if (!auth.currentUser) {
        await signInAnonymously(auth).catch(() => {});
      }
    }
  } catch (err) {
    console.error('Error during consumeCallback execution:', err);
  } finally {
    // ALWAYS close the In-App Browser popover so app returns to native interface instantly
    await Browser.close().catch(() => undefined);
    if (typeof window !== 'undefined' && window.history) {
      window.history.replaceState({}, document.title, '/');
    }
  }
}

export async function initializeDeepLinks(): Promise<void> {
  if (initialized || !Capacitor.isNativePlatform()) return;
  initialized = true;

  await App.addListener('appUrlOpen', ({ url }) => {
    void consumeCallback(url).catch((error) => console.error('OAuth deep-link error:', error));
  });

  const launch = await App.getLaunchUrl();
  if (launch?.url) await consumeCallback(launch.url);
}

export async function openFacebookOAuth(url: string): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    await Browser.open({ url, presentationStyle: 'popover' });
    return;
  }
  window.location.assign(url);
}

