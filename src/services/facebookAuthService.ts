import { Capacitor } from '@capacitor/core';
import { FacebookLogin } from '@capacitor-community/facebook-login';
import { supabase } from '../supabaseClient';
import { UserRole } from '../types';
import { openFacebookOAuth } from './deepLinkService';

export const signInWithFacebookOAuth = async (role: UserRole = 'passenger') => {
  // If running on Native Android/iOS, use Native Facebook Login (opens Facebook app directly without browser)
  if (Capacitor.isNativePlatform()) {
    try {
      const result = await FacebookLogin.login({
        permissions: ['email', 'public_profile'],
      });

      if (result.accessToken?.token) {
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: 'facebook',
          token: result.accessToken.token,
        });

        if (error) throw error;
        return data;
      }
    } catch (nativeErr: any) {
      console.warn('Native Facebook login attempt fallback to OAuth:', nativeErr);
    }
  }

  // Fallback / Web OAuth Flow
  const redirectUrl =
    typeof window !== 'undefined' && !Capacitor.isNativePlatform()
      ? window.location.origin
      : 'com.motodrive.dz://auth/callback';

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'facebook',
    options: {
      redirectTo: redirectUrl,
      queryParams: {
        role,
      },
    },
  });

  if (error) {
    console.error('Facebook OAuth Error:', error.message);
    throw new Error(
      error.message ||
        'تعذر الاتصال بـ فيسبوك. يرجى التحقق من إعدادات Supabase Facebook Provider.'
    );
  }

  if (data?.url) {
    await openFacebookOAuth(data.url);
  }

  return data;
};
