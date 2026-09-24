import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import {
  signOutUser,
  signInWithEmailPass,
  signUpWithEmailPass,
} from '../../services/authService';
import { UserRole } from '../../types';
import { MotoIcon } from '../shared/MotoIcon';
import { FacebookSignInButton } from './FacebookSignInButton';
import { GoogleSignInButton } from './GoogleSignInButton';
import {
  X,
  ShieldCheck,
  LogOut,
  User,
  CheckCircle2,
  Sparkles,
  Mail,
  Phone,
  ArrowRight,
  Loader2,
  Lock,
  UserPlus,
  LogIn,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRole?: UserRole;
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultRole = 'passenger',
  onSuccess,
}) => {
  const {
    activePassenger,
    currentUser,
    setCurrentUser,
    setActivePassenger,
    setActiveDriver,
    setCurrentRole,
    broadcastNotification,
  } = useApp();

  const [selectedRole, setSelectedRole] = useState<UserRole>(defaultRole);
  const [step, setStep] = useState<'role_selection' | 'auth_form'>('role_selection');
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Email Auth State
  const [emailTab, setEmailTab] = useState<'signin' | 'signup'>('signup');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [emailNameInput, setEmailNameInput] = useState('');
  const [emailPhoneInput, setEmailPhoneInput] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [supabaseNotice, setSupabaseNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setErrorMsg(null);
      setSupabaseNotice(null);
      setStep('role_selection');
    }
  }, [isOpen]);

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

  // Direct Email Auth
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSupabaseNotice(null);

    const cleanEmail = emailInput.trim().toLowerCase();
    const cleanPass = passwordInput.trim();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMsg('يرجى إدخال بريد إلكتروني صحيح (مثال: user@gmail.com)');
      return;
    }
    if (!cleanPass || cleanPass.length < 6) {
      setErrorMsg('كلمة المرور يجب أن تتكون من 6 أحرف على الأقل');
      return;
    }

    try {
      setLoading(true);
      let res: any;

      if (emailTab === 'signin') {
        res = await signInWithEmailPass(cleanEmail, cleanPass);
      } else {
        if (!emailNameInput.trim()) {
          setErrorMsg('يرجى إدخال الاسم الكامل');
          setLoading(false);
          return;
        }
        if (!emailPhoneInput.trim() || emailPhoneInput.trim().length < 8) {
          setErrorMsg('يرجى إدخال رقم هاتف صحيح (مثال: 0550123456)');
          setLoading(false);
          return;
        }
        res = await signUpWithEmailPass(
          cleanEmail,
          cleanPass,
          emailNameInput.trim(),
          emailPhoneInput.trim(),
          selectedRole
        );
      }

      const { user, profile, driver } = res;

      setCurrentUser(user);
      setActivePassenger(profile);
      if (driver) {
        setActiveDriver(driver);
      }

      if (profile.role === 'admin' || user.email === 'seyfhad@gmail.com') {
        setCurrentRole('admin');
      } else if (driver || profile.role === 'driver') {
        setCurrentRole('driver');
      } else {
        setCurrentRole(selectedRole);
      }

      if (emailTab === 'signup') {
        setSupabaseNotice(res.supabaseNotice || null);
        setStep('verification_status');
        broadcastNotification(
          'تم إنشاء الحساب بنجاح 📧',
          `أهلاً بك ${profile.name}! لقد تم تجهيز حسابك. تفقّد بريدك والرسائل غير المرغوب فيها (Spam) للتحقق.`
        );
      } else {
        broadcastNotification(
          'تم تسجيل الدخول بنجاح',
          `أهلاً بك مجدداً ${profile.name}!`
        );
        if (onSuccess) onSuccess();
        onClose();
      }
    } catch (err: any) {
      console.error('Email Auth Error:', err);
      setErrorMsg(err?.message || 'حدث خطأ أثناء الاتصال. يرجى مراجعة البيانات.');
    } finally {
      setLoading(false);
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
        className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-5 sm:p-6 text-right text-slate-100 shadow-2xl space-y-4 relative overflow-hidden max-h-[92vh] overflow-y-auto"
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
              <span>تسجيل الدخول / حساب جديد</span>
              <Sparkles className="w-4 h-4 text-amber-400" />
            </h3>
            <p className="text-[11px] text-slate-400">اختر نوع الحساب للمتابعة</p>
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
                  src={
                    currentUser?.photoURL ||
                    activePassenger.photoUrl ||
                    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'
                  }
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
                <span>تم تسجيل الدخول بنجاح</span>
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
        ) : step === 'role_selection' ? (
          /* Step 1: Medium-Sized Icon Cards for Role Selection (راكب / سائق) */
          <div className="space-y-4 py-2 animate-in fade-in duration-300">
            <p className="text-xs text-slate-300 text-center font-semibold">
              اختر نوع صفة الحساب للانتقال إلى التسجيل:
            </p>

            <div className="grid grid-cols-2 gap-3">
              {/* Passenger Card (راكب) */}
              <button
                type="button"
                onClick={() => {
                  setSelectedRole('passenger');
                  setStep('auth_form');
                  setErrorMsg(null);
                }}
                className="flex flex-col items-center justify-center p-5 rounded-2xl bg-slate-950 hover:bg-slate-800 border-2 border-slate-800 hover:border-amber-500/80 text-white transition-all transform hover:-translate-y-1 shadow-lg group cursor-pointer"
              >
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-3 group-hover:scale-110 group-hover:bg-amber-500 group-hover:text-slate-950 transition-all shadow-md">
                  <User className="w-7 h-7" />
                </div>
                <span className="text-sm font-black text-white group-hover:text-amber-400 transition-colors">راكب</span>
              </button>

              {/* Driver Card (سائق) */}
              <button
                type="button"
                onClick={() => {
                  setSelectedRole('driver');
                  setStep('auth_form');
                  setErrorMsg(null);
                }}
                className="flex flex-col items-center justify-center p-5 rounded-2xl bg-slate-950 hover:bg-slate-800 border-2 border-slate-800 hover:border-amber-500/80 text-white transition-all transform hover:-translate-y-1 shadow-lg group cursor-pointer"
              >
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 overflow-hidden flex items-center justify-center p-1.5 mb-3 group-hover:scale-110 transition-all shadow-md">
                  <img src="/icon.jpg" alt="سائق" className="w-full h-full object-cover rounded-xl" />
                </div>
                <span className="text-sm font-black text-white group-hover:text-amber-400 transition-colors">سائق</span>
              </button>
            </div>
          </div>
        ) : (
          /* Step 2: Sign-In / Sign-Up Form for Selected Role */
          <div className="space-y-3 animate-in fade-in duration-300">
            {/* Top Bar showing current role & back button */}
            <div className="flex items-center justify-between bg-slate-950 border border-slate-800 p-2 rounded-2xl">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-black">
                  {selectedRole === 'driver' ? <MotoIcon className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>
                <span className="text-xs font-black text-amber-400">
                  {selectedRole === 'driver' ? 'حساب سائق' : 'حساب راكب'}
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setStep('role_selection');
                  setErrorMsg(null);
                }}
                className="text-[11px] font-bold text-slate-400 hover:text-amber-400 transition-colors flex items-center gap-1"
              >
                <span>تغييرالصفة</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* Facebook OAuth Registration & Login as Primary Option */}
            <div className="space-y-3 pt-1">
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-right space-y-1">
                <span className="text-xs font-bold text-blue-400 block">تسجيل الحساب عبر فيسبوك (Facebook)</span>
                <p className="text-[11px] text-slate-300 leading-snug">
                  سجّل حسابك فوراً بضغطة زر دون الحاجة للانتظار أو تأكيد رابط الإيميل.
                </p>
              </div>

              {/* Facebook OAuth Button */}
              <FacebookSignInButton
                role={selectedRole}
                onSuccess={() => {
                  if (onSuccess) onSuccess();
                  onClose();
                }}
              />

              {/* Google OAuth Button */}
              <GoogleSignInButton
                role={selectedRole}
                variant="dark"
                onSuccess={() => {
                  if (onSuccess) onSuccess();
                  onClose();
                }}
              />

              <div className="relative py-2 flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-800" />
                </div>
                <span className="relative px-3 bg-slate-900 text-[11px] text-slate-500 font-bold">
                  أو الدخول بكلمة المرور مباشرة
                </span>
              </div>

              {/* Direct Password Login without email confirmation flow */}
              <form onSubmit={handleEmailSubmit} className="space-y-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">البريد الإلكتروني / الحساب:</label>
                  <div className="relative">
                    <input
                      type="email"
                      value={emailInput}
                      onChange={e => setEmailInput(e.target.value)}
                      placeholder="user@example.com"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 pl-9 text-xs font-medium text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/80 transition-colors"
                      required
                    />
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">كلمة المرور:</label>
                  <div className="relative">
                    <input
                      type="password"
                      value={passwordInput}
                      onChange={e => setPasswordInput(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 pl-9 text-xs font-medium text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/80 transition-colors"
                      required
                      minLength={6}
                    />
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  </div>
                </div>

                {errorMsg && (
                  <p className="text-[11px] text-red-400 text-center font-medium bg-red-500/10 py-1.5 px-3 rounded-xl border border-red-500/20">
                    {errorMsg}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  ) : (
                    <>
                      <span>تسجيل الدخول المباشر</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
