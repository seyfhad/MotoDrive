import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { signOutUser } from '../../services/authService';
import { GoogleSignInButton } from './GoogleSignInButton';
import { UserRole } from '../../types';
import {
  X,
  ShieldCheck,
  LogOut,
  User,
  CheckCircle2,
  Sparkles,
  Bike,
  Mail,
  Phone,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRole?: UserRole;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultRole = 'passenger',
}) => {
  const { activePassenger, currentUser, setCurrentUser, broadcastNotification, currentRole } = useApp();
  const [selectedRole, setSelectedRole] = useState<UserRole>(defaultRole);
  const [isSigningOut, setIsSigningOut] = useState(false);

  if (!isOpen) return null;

  const isGoogleUser = Boolean(currentUser && (currentUser.email || currentUser.photoURL));

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      await signOutUser();
      setCurrentUser(null);
      broadcastNotification('تم تسجيل الخروج', 'لقد قمت بتسجيل الخروج من حسابك بنجاح');
      onClose();
    } catch (err) {
      console.error('Sign-out error:', err);
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
      id="auth-modal-overlay"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-5 sm:p-6 text-right text-slate-100 shadow-2xl space-y-5 relative overflow-hidden"
        id="auth-modal-container"
      >
        {/* Ambient Top Glow */}
        <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <button
            onClick={onClose}
            id="auth-modal-close-btn"
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="text-center">
            <h3 className="text-base font-black text-white flex items-center gap-1.5 justify-center">
              <span>حسابك في MotoDrive</span>
              <Sparkles className="w-4 h-4 text-amber-400" />
            </h3>
            <p className="text-[11px] text-slate-400">سجّل دخولك لحفظ بياناتك ورحلاتك بأمان</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-sm">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>

        {/* Logged-In User State */}
        {isGoogleUser ? (
          <div className="space-y-4">
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-center space-y-3">
              <div className="relative w-16 h-16 mx-auto">
                <img
                  src={currentUser?.photoURL || activePassenger.photoUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                  alt={currentUser?.displayName || activePassenger.name}
                  className="w-full h-full rounded-full object-cover border-2 border-emerald-500 shadow-lg"
                />
                <span className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center text-slate-950 text-[10px] font-bold">
                  ✓
                </span>
              </div>

              <div>
                <h4 className="text-sm font-black text-white">{currentUser?.displayName || activePassenger.name}</h4>
                <p className="text-xs text-slate-400 flex items-center justify-center gap-1 mt-0.5" dir="ltr">
                  <Mail className="w-3 h-3 text-slate-500" />
                  <span>{currentUser?.email || activePassenger.email || 'حساب Google متصل'}</span>
                </p>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>تم تسجيل الدخول بحساب Google</span>
              </div>
            </div>

            <div className="space-y-2">
              <button
                id="auth-modal-signout-btn"
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-800 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30 border border-slate-700 text-slate-300 text-xs font-bold transition-all disabled:opacity-50"
              >
                <LogOut className="w-4 h-4" />
                <span>{isSigningOut ? 'جاري تسجيل الخروج...' : 'تسجيل الخروج من الحساب'}</span>
              </button>

              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition-colors"
              >
                متابعة استخدام التطبيق
              </button>
            </div>
          </div>
        ) : (
          /* Sign-In State */
          <div className="space-y-4">
            {/* Account Type Selector */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1.5">اختر صفتك في التطبيق:</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedRole('passenger')}
                  className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                    selectedRole === 'passenger'
                      ? 'bg-amber-500/15 border-amber-500/50 text-amber-400 shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>راكب (طلب رحلات)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRole('driver')}
                  className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                    selectedRole === 'driver'
                      ? 'bg-amber-500/15 border-amber-500/50 text-amber-400 shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Bike className="w-3.5 h-3.5" />
                  <span>سائق (تقديم عروض)</span>
                </button>
              </div>
            </div>

            {/* Google Sign-In Action */}
            <div className="space-y-2 pt-1">
              <GoogleSignInButton
                role={selectedRole}
                onSuccess={() => onClose()}
                label="المتابعة باستخدام Google"
                id="auth-modal-google-signin-btn"
              />
            </div>

            {/* Privacy & Instant Note */}
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3 text-[11px] text-slate-400 space-y-1">
              <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>حماية ومصادقة فورية:</span>
              </div>
              <p className="leading-relaxed">
                يتم التحقق من حسابك عبر Google Firebase Authentication بشكل مشفر. لن تتم مشاركة أي بيانات حساسة مع أطراف ثالثة.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
