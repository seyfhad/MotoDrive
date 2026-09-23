import { Capacitor } from '@capacitor/core';
import { FacebookLogin } from '@capacitor-community/facebook-login';
import { supabase } from '../supabaseClient';
import { UserRole } from '../types';
import { FACEBOOK_REDIRECT_URI, openFacebookOAuth } from './deepLinkService';

const isNativeFacebookAvailable = () =>
  Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';

/**
 * Uses the native Facebook SDK in the Android app. The web fallback deliberately
 * remains Supabase OAuth so the hosted/PWA version continues to work.
 */
export const signInWithFacebookOAuth = async (role: UserRole = 'passenger') => {
  if (isNativeFacebookAvailable()) {
    const result = await FacebookLogin.login({
      permissions: ['public_profile', 'email'],
    });
    const accessToken = result.accessToken?.token;

    if (!accessToken) {
      throw new Error('تم إلغاء تسجيل الدخول عبر Facebook أو لم يتم الحصول على رمز الوصول.');
    }

    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'facebook',
      token: accessToken,
    });

    if (error) {
      console.error('Supabase Facebook native sign-in error:', error.message);
      throw new Error(error.message || 'تعذر إنشاء جلسة Facebook داخل التطبيق.');
    }

    return data;
  }

  const isCapacitorWebView =
    window.location.protocol === 'capacitor:' ||
    window.location.protocol === 'ionic:' ||
    (window.location.protocol === 'http:' && window.location.hostname === 'localhost');
  const redirectTo = isCapacitorWebView ? FACEBOOK_REDIRECT_URI : window.location.origin;
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'facebook',
    options: {
      redirectTo,
      skipBrowserRedirect: true,
      queryParams: { role },
    },
  });

  if (error) {
    console.error('Facebook OAuth Error:', error.message);
    throw new Error(error.message || 'تعذر الاتصال بفيسبوك.');
  }
  if (!data?.url) throw new Error('لم يُرجع Supabase رابط مصادقة صالحاً.');
  await openFacebookOAuth(data.url);
  return data;
};

export const signOutFromFacebook = async () => {
  if (isNativeFacebookAvailable()) {
    await FacebookLogin.logout().catch(() => undefined);
  }
  await supabase.auth.signOut().catch(() => undefined);
};
