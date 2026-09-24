import { FacebookLogin } from '@capacitor-community/facebook-login';
import { supabase } from '../supabaseClient';
import { UserRole } from '../types';

export const signInWithFacebookOAuth = async (role: UserRole = 'passenger') => {
  try {
    const result = await FacebookLogin.login({
      permissions: ['email', 'public_profile'],
    });

    const token = result.accessToken?.token;
    if (!token) {
      throw new Error('فشل الحصول على رمز الوصول من فيسبوك.');
    }

    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'facebook',
      token,
      options: {
        data: { role },
      },
    });

    if (error) {
      throw error;
    }

    return data;
  } catch (error: unknown) {
    console.error('Facebook Native Login Error:', error);
    const message = error instanceof Error ? error.message : 'تعذر تسجيل الدخول بفيسبوك.';
    throw new Error(message);
  }
};
