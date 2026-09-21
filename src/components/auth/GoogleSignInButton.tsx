import React, { useState } from 'react';
import { signInWithGoogle } from '../../services/authService';
import { useApp } from '../../contexts/AppContext';
import { UserRole } from '../../types';
import { Loader2 } from 'lucide-react';

interface GoogleSignInButtonProps {
  role?: UserRole;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  className?: string;
  variant?: 'default' | 'dark' | 'outline';
  fullWidth?: boolean;
  label?: string;
  id?: string;
}

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  role = 'passenger',
  onSuccess,
  onError,
  className = '',
  variant = 'default',
  fullWidth = true,
  label = 'تسجيل الدخول بحساب Google',
  id = 'google-signin-btn',
}) => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { setActivePassenger, setCurrentRole, setCurrentUser, broadcastNotification } = useApp();

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const { user, profile } = await signInWithGoogle((role || 'passenger') as UserRole);

      setCurrentUser(user);
      setActivePassenger(profile);
      if (profile.role === 'admin' || user.email === 'seyfhad@gmail.com') {
        setCurrentRole('admin');
      } else {
        setCurrentRole(role);
      }

      broadcastNotification(
        'مرحباً بك في موتو درايف',
        `تم تسجيل دخولك بنجاح كـ ${user.displayName || user.email || 'مستخدم'}`
      );

      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      let message = 'فشل تسجيل الدخول بواسطة جوجل';
      if (err.code === 'auth/unauthorized-domain') {
        message = '⚠️ نطاق هذا الموقع غير مصرح به في Firebase Auth! يرجى إضافة رابط موقعك (مثل username.github.io) في Firebase Console ⬅️ Authentication ⬅️ Authorized Domains.';
      } else if (err.code === 'auth/popup-closed-by-user') {
        message = 'تم إغلاق نافذة تسجيل الدخول قبل إتمام العملية.';
      } else if (err.code === 'auth/popup-blocked') {
        message = 'تم حظر النافذة المنبثقة من قِبل المتصفح. يرجى السماح بالنوافذ المنبثقة Pop-ups أو استخدام إدخال بريد Gmail مباشرة.';
      } else if (err.code === 'auth/cancelled-popup-request') {
        message = 'تم إلغاء الطلب المتكرر.';
      } else if (err.message) {
        message = err.message;
      }
      setErrorMsg(message);
      if (onError) {
        onError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'dark':
        return 'bg-slate-900 hover:bg-slate-800 text-white border border-slate-700/80 shadow-md';
      case 'outline':
        return 'bg-transparent hover:bg-slate-800/60 text-slate-100 border border-slate-700 shadow-sm';
      case 'default':
      default:
        return 'bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 shadow-lg shadow-black/10';
    }
  };

  return (
    <div className={`space-y-1.5 ${fullWidth ? 'w-full' : ''}`}>
      <button
        id={id}
        type="button"
        onClick={handleGoogleSignIn}
        disabled={loading}
        className={`flex items-center justify-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all duration-200 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed ${
          fullWidth ? 'w-full' : ''
        } ${getVariantStyles()} ${className}`}
        aria-label="تسجيل الدخول عبر جوجل"
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
        ) : (
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.29 21.36 7.37 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.96 0 12s.46 3.84 1.26 5.42l4.02-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.37 0 3.29 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
            />
          </svg>
        )}
        <span className="truncate">{loading ? 'جاري فتح حساب Google...' : label}</span>
      </button>

      {errorMsg && (
        <p className="text-[11px] text-red-400 text-center font-medium bg-red-500/10 py-1.5 px-3 rounded-xl border border-red-500/20">
          {errorMsg}
        </p>
      )}
    </div>
  );
};
