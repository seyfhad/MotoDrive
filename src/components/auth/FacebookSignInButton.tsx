import React, { useState } from 'react';
import { signInWithFacebookOAuth } from '../../services/authService';
import { useApp } from '../../contexts/AppContext';
import { UserRole } from '../../types';
import { Loader2 } from 'lucide-react';

interface FacebookSignInButtonProps {
  role?: UserRole;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  className?: string;
  variant?: 'default' | 'dark' | 'outline';
  fullWidth?: boolean;
  label?: string;
  id?: string;
}

export const FacebookSignInButton: React.FC<FacebookSignInButtonProps> = ({
  role = 'passenger',
  onSuccess,
  onError,
  className = '',
  variant = 'default',
  fullWidth = true,
  label = 'تسجيل الدخول باستخدام فيسبوك (Facebook)',
  id = 'facebook-signin-btn',
}) => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { broadcastNotification } = useApp();

  const handleFacebookSignIn = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      await signInWithFacebookOAuth((role || 'passenger') as UserRole);

      broadcastNotification(
        'جاري التوجيه إلى Facebook',
        'سيتم تحويلك إلى صفحة المصادقة الرسمية في فيسبوك لإكمال الدخول.'
      );

      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      console.error('Facebook Sign-In Error:', err);
      let message = err?.message || 'فشل الاتصال بفيسبوك. يرجى التأكد من إعدادات Supabase Facebook Provider.';
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
        return 'bg-[#1877F2] hover:bg-[#166fe5] text-white border border-blue-600 shadow-md';
      case 'outline':
        return 'bg-transparent hover:bg-blue-600/20 text-blue-400 border border-blue-500 shadow-sm';
      case 'default':
      default:
        return 'bg-[#1877F2] hover:bg-[#166fe5] text-white border border-blue-600 shadow-lg shadow-blue-500/20';
    }
  };

  return (
    <div className={`space-y-1.5 ${fullWidth ? 'w-full' : ''}`}>
      <button
        id={id}
        type="button"
        onClick={handleFacebookSignIn}
        disabled={loading}
        className={`flex items-center justify-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all duration-200 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed ${
          fullWidth ? 'w-full' : ''
        } ${getVariantStyles()} ${className}`}
        aria-label="تسجيل الدخول عبر فيسبوك"
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin text-white" />
        ) : (
          <svg className="w-5 h-5 shrink-0 fill-current text-white" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
        )}
        <span className="truncate">{loading ? 'جاري الاتصال بـ Facebook...' : label}</span>
      </button>

      {errorMsg && (
        <p className="text-[11px] text-red-400 text-center font-medium bg-red-500/10 py-1.5 px-3 rounded-xl border border-red-500/20">
          {errorMsg}
        </p>
      )}
    </div>
  );
};
