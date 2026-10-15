import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { X, ShieldCheck, LogIn, Loader2, AlertCircle } from 'lucide-react';
import { signInWithGoogle } from '../../services/authService';
import { auth } from '../../lib/firebase';

interface AdminPasscodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ADMIN_OWNER_EMAIL = 'seyfhad@gmail.com';

export const AdminPasscodeModal: React.FC<AdminPasscodeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { currentUser, activePassenger, setCurrentRole } = useApp();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const currentAuthUser = auth.currentUser || currentUser;
  const isAlreadyAdmin =
    currentAuthUser != null &&
    (currentAuthUser.email?.toLowerCase() === ADMIN_OWNER_EMAIL ||
     activePassenger?.email?.toLowerCase() === ADMIN_OWNER_EMAIL ||
     activePassenger?.role === 'admin' ||
     currentUser?.role === 'admin');

  const handleEnterAdmin = () => {
    if (isAlreadyAdmin) {
      setCurrentRole('admin');
      if (onSuccess) onSuccess();
      onClose();
    } else {
      setErrorMessage('الحساب الحالي غير مصرح له كمسؤول. يرجى تسجيل الدخول بحساب المسؤول.');
    }
  };

  const handleGoogleAdminLogin = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const result = await signInWithGoogle('admin');
      const user = result.user || auth.currentUser;
      if (user && (user.email?.toLowerCase() === ADMIN_OWNER_EMAIL || result.profile?.role === 'admin')) {
        setCurrentRole('admin');
        if (onSuccess) onSuccess();
        onClose();
      } else {
        setErrorMessage(
          `الحساب (${user?.email || 'غير معروف'}) غير مصرح له كمسؤول. الحساب المصرح له هو ${ADMIN_OWNER_EMAIL}`
        );
      }
    } catch (err: any) {
      console.warn('Admin Google login failed:', err);
      setErrorMessage(err?.message || 'فشل تسجيل الدخول كمسؤول عبر Firebase.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200"
      id="admin-auth-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-5 text-right text-slate-100 shadow-2xl relative overflow-hidden space-y-4"
        dir="rtl"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          className="absolute top-4 left-4 w-7 h-7 rounded-full bg-slate-800/80 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 pt-1">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">بوابة إدارة MotoDrive</h3>
            <p className="text-xs text-slate-400">مصادقة المسؤول عبر Firebase Auth</p>
          </div>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start gap-2 leading-relaxed">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {isAlreadyAdmin ? (
          <div className="space-y-3 pt-2">
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
              <span className="font-bold">أهلاً بك، {currentAuthUser?.displayName || 'المسؤول'}!</span>
              <p className="text-[11px] text-emerald-400/80 mt-1">
                حسابك الحالي ({currentAuthUser?.email}) مصرح له كمسؤول في قاعدة بيانات MotoDrive.
              </p>
            </div>
            <button
              type="button"
              onClick={handleEnterAdmin}
              className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-amber-500/20"
            >
              <LogIn className="w-4 h-4" />
              <span>الدخول إلى لوحة التحكم</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3 pt-2">
            <p className="text-xs text-slate-400 leading-relaxed">
              تتطلب لوحة الإدارة مصادقة Firebase بحساب المسؤول المعتمد (<span className="text-amber-400 font-mono text-[11px]">{ADMIN_OWNER_EMAIL}</span>).
            </p>
            <button
              type="button"
              disabled={loading}
              onClick={handleGoogleAdminLogin}
              className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-amber-500/20"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جاري التحقق من الصلاحيات...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>تسجيل الدخول كمسؤول عبر Google</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
