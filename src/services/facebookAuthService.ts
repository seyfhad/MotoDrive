import { FacebookLogin } from '@capacitor-community/facebook-login';
import { supabase } from '../supabaseClient';
import { UserRole } from '../types';

export const signInWithFacebookOAuth = async (role: UserRole = 'passenger') => {
  try {
    const FACEBOOK_PERMISSIONS = ['email', 'public_profile'];
    
    // فتح نافذة فيسبوك الأصلية (Native) مباشرة
    const result = await FacebookLogin.login({ permissions: FACEBOOK_PERMISSIONS });

    if (result && result.accessToken) {
      const token = result.accessToken.token;
      
      // إرسال الـ Token مباشرة إلى Supabase مع الـ role في الـ data أو الـ options
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'facebook',
        token: token,
        options: {
          data: { role }
        }
      });

      if (error) throw error;
      return data;
    } else {
      throw new Error('فشل الحصول على رمز الوصول من فيسبوك.');
    }
  } catch (error: any) {
    console.error('Facebook Native Login Error:', error);
    throw new Error(error.message || 'تعذر تسجيل الدخول بفيسبوك.');
  }
};
