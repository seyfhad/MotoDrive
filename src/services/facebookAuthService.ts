import { UserRole } from '../types';

export const FACEBOOK_APP_ID = '1069098049280919';

/**
 * Facebook OAuth is deprecated in favor of Firebase Google Auth as requested by the user.
 */
export const signInWithFacebookOAuth = async (role: UserRole = 'passenger') => {
  throw new Error('تم تفعيل تسجيل الدخول الرسمي عبر Google. يرجى استخدام زر تسجيل الدخول بحساب Google.');
};
