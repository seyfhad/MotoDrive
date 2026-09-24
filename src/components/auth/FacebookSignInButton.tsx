import React, { useState } from 'react';
import { signInWithFacebookOAuth } from '../../services/facebookAuthService';
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
  role = 'passenger', onSuccess, onError, className = '', variant = 'default',
  fullWidth = true, label = 'تسجيل الدخول باستخدام فيسبوك (Facebook)', id = 'facebook-signin-btn',
}) => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { broadcastNotification } = useApp();
  const handleFacebookSignIn = async () => {
    try {
      setLoading(true); setErrorMsg(null);
      await signInWithFacebookOAuth(role as UserRole);
      broadcastNotification('جاري التوجيه إلى Facebook', 'سيتم فتح صفحة المصادقة في المتصفح الآمن.');
      onSuccess?.();
    } catch (err: any) {
      const message = err?.message || 'فشل الاتصال بفيسبوك. تحقق من إعدادات Supabase Facebook Provider.';
      console.error('Facebook Sign-In Error:', err); setErrorMsg(message); onError?.(message);
    } finally { setLoading(false); }
  };
  const styles = variant === 'outline'
    ? 'bg-transparent hover:bg-blue-600/20 text-blue-400 border border-blue-500 shadow-sm'
    : 'bg-[#1877F2] hover:bg-[#166fe5] text-white border border-blue-600 shadow-lg shadow-blue-500/20';
  return <div className={`space-y-1.5 ${fullWidth ? 'w-full' : ''}`}>
    <button id={id} type="button" onClick={handleFacebookSignIn} disabled={loading}
      className={`flex items-center justify-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all disabled:opacity-60 ${fullWidth ? 'w-full' : ''} ${styles} ${className}`}>
      {loading ? <Loader2 className="w-5 h-5 animate-spin text-white" /> : <span className="text-lg font-black">f</span>}
      <span>{label}</span>
    </button>
    {errorMsg && <p className="text-xs text-red-400 text-center" role="alert">{errorMsg}</p>}
  </div>;
};
