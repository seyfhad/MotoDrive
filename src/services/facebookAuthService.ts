import { supabase } from '../supabaseClient';
import { UserRole } from '../types';
import { openFacebookOAuth } from './deepLinkService';

export const signInWithFacebookOAuth = async (role: UserRole = 'passenger') => {
  const redirectUrl = typeof window !== 'undefined' ? window.location.origin : 'com.motodrive.dz://auth/callback';
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
    throw new Error(error.message || 'تعذر الاتصال بـ فيسبوك. يرجى التحقق من إعدادات Supabase Facebook Provider.');
  }

  if (data?.url) {
    await openFacebookOAuth(data.url);
  }

  return data;
};
