import { supabase } from '../supabaseClient';
import { UserRole } from '../types';
import { FACEBOOK_REDIRECT_URI, openFacebookOAuth } from './deepLinkService';

export const signInWithFacebookOAuth = async (role: UserRole = 'passenger') => {
  const isNative = window.location.protocol === 'capacitor:' || window.location.protocol === 'ionic:' || window.location.protocol === 'http:' && window.location.hostname === 'localhost';
  const redirectTo = isNative ? FACEBOOK_REDIRECT_URI : window.location.origin;
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
    throw new Error(error.message || 'تعذر الاتصال بفيسبوك. تحقق من إعدادات Facebook Provider في Supabase.');
  }
  if (!data?.url) throw new Error('لم يُرجع Supabase رابط مصادقة صالحاً.');
  await openFacebookOAuth(data.url);
  return data;
};
