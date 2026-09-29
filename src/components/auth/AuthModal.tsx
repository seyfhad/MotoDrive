import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { signOutUser, registerOrRestoreUserByPhone, getCachedUserByPhone } from '../../services/authService';
import { UserRole } from '../../types';
import { MotoIcon } from '../shared/MotoIcon';
import {
  X,
  ShieldCheck,
  LogOut,
  User,
  CheckCircle2,
  Sparkles,
  Mail,
  ArrowRight,
  ShieldAlert,
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
    setCurrentRole,
    broadcastNotification,
  } = useApp();

  const [selectedRole, setSelectedRole] = useState<UserRole>(defaultRole);
  const [step, setStep] = useState<'role_selection' | 'google_auth'>('google_auth');
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [normalName, setNormalName] = useState('راكب MotoDrive');
  const [normalPhone, setNormalPhone] = useState('0550123456');
  const [isSubmittingNormal, setIsSubmittingNormal] = useState(false);

  const handleNormalQuickLogin = async () => {
    try {
      setIsSubmittingNormal(true);
      setErrorMsg(null);
      const cleanName = normalName.trim() || 'راكب MotoDrive';
      const cleanPhone = normalPhone.trim() || '0550123456';

      const res = await registerOrRestoreUserByPhone(cleanName, cleanPhone, 'passenger');
      setCurrentUser(res.user);
      setActivePassenger(res.profile);
      setCurrentRole('passenger');

      if (res.isExisting) {
        broadcastNotification('مرحباً بعودتك!', `تم الدخول بنجاح بحسابك: ${res.profile.name}`);
      } else {
        broadcastNotification('مرحباً بك!', `تم الدخول بنجاح كراكب باسم: ${cleanName}`);
      }
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Normal quick login error:', err);
      setErrorMsg('حدث خطأ أثناء الدخول المباشر. يرجى إعادة المحاولة.');
    } finally {
      setIsSubmittingNormal(false);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      setErrorMsg(null);
    } else {
      setSelectedRole(defaultRole || 'passenger');
      setStep('google_auth');
      try {
        const remembered = localStorage.getItem('motodrive_remembered_phone') || localStorage.getItem('motodrive_last_phone');
        if (remembered) {
          setNormalPhone(remembered);
          const cached = getCachedUserByPhone(remembered);
          if (cached?.profile) {
            setNormalName(cached.profile.name);
          }
        }
      } catch (e) {}
    }
  }, [isOpen, defaultRole]);

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
      onClick={(e) => {
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
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="text-center">
            <h3 className="text-base font-black text-white flex items-center gap-1.5 justify-center">
              <span>تسجيل الدخول برقم الهاتف</span>
              <Sparkles className="w-4 h-4 text-amber-400" />
            </h3>
            <p className="text-[11px] text-slate-400">دخول مباشر دون الحاجة لحساب Google</p>
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
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-800 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30 border border-slate-700 text-slate-300 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>{isSigningOut ? 'جاري تسجيل الخروج...' : 'تسجيل الخروج من الحساب'}</span>
              </button>

              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition-colors cursor-pointer"
              >
                متابعة استخدام التطبيق
              </button>
            </div>
          </div>
        ) : step === 'role_selection' ? (
          /* Step 1: Role Selection Cards */
          <div className="space-y-4 py-2 animate-in fade-in duration-300">
            <p className="text-xs text-slate-300 text-center font-semibold">
              اختر نوع الحساب للمتابعة بالتسجيل عبر Google:
            </p>

            <div className="grid grid-cols-2 gap-3">
              {/* Passenger Card */}
              <button
                type="button"
                onClick={() => {
                  setSelectedRole('passenger');
                  setStep('google_auth');
                  setErrorMsg(null);
                }}
                className={`flex flex-col items-center justify-center p-5 rounded-2xl bg-slate-950 hover:bg-slate-800 border-2 ${
                  selectedRole === 'passenger' ? 'border-amber-500 shadow-amber-500/20' : 'border-slate-800'
                } text-white transition-all transform hover:-translate-y-1 shadow-lg group cursor-pointer`}
              >
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-3 group-hover:scale-110 group-hover:bg-amber-500 group-hover:text-slate-950 transition-all shadow-md">
                  <User className="w-7 h-7" />
                </div>
                <span className="text-sm font-black text-white group-hover:text-amber-400 transition-colors">
                  حساب راكب
                </span>
                <span className="text-[10px] text-slate-400 mt-1">طلب الرحلات والتنقل</span>
              </button>

              {/* Driver Card */}
              <button
                type="button"
                onClick={() => {
                  setSelectedRole('driver');
                  setStep('google_auth');
                  setErrorMsg(null);
                }}
                className={`flex flex-col items-center justify-center p-5 rounded-2xl bg-slate-950 hover:bg-slate-800 border-2 ${
                  selectedRole === 'driver' ? 'border-amber-500 shadow-amber-500/20' : 'border-slate-800'
                } text-white transition-all transform hover:-translate-y-1 shadow-lg group cursor-pointer`}
              >
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-3 group-hover:scale-110 group-hover:bg-amber-500 group-hover:text-slate-950 transition-all shadow-md">
                  <MotoIcon className="w-7 h-7" />
                </div>
                <span className="text-sm font-black text-white group-hover:text-amber-400 transition-colors">
                  حساب سائق
                </span>
                <span className="text-[10px] text-slate-400 mt-1">قبول الرحلات والأرباح</span>
              </button>
            </div>
          </div>
        ) : (
          /* Step 2: Authentication & Quick Normal Entry Options */
          <div className="space-y-4 animate-in fade-in duration-300">
            {/* Mode Switcher Tab */}
            <div className="bg-slate-950 border border-slate-800 p-1.5 rounded-2xl flex items-center justify-between gap-1">
              <button
                type="button"
                onClick={() => {
                  setSelectedRole('passenger');
                  setErrorMsg(null);
                }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedRole === 'passenger'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>دخول كراكب</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedRole('driver');
                  setErrorMsg(null);
                }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedRole === 'driver'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <MotoIcon className="w-3.5 h-3.5" />
                <span>دخول كسائق</span>
              </button>
            </div>

            {selectedRole === 'passenger' ? (
              /* Passenger Quick Normal Entry Form */
              <div className="space-y-3 bg-slate-950/90 border border-slate-800 p-4 rounded-2xl">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-xs pb-1 border-b border-slate-800">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>الدخول العادي السريع كراكب (بدون Google)</span>
                </div>

                <div className="space-y-2">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">الاسم الكامل:</label>
                    <input
                      type="text"
                      id="normal-login-name-input"
                      placeholder="مثال: أحمد بلقاسم"
                      value={normalName}
                      onChange={(e) => setNormalName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">رقم الهاتف:</label>
                    <input
                      type="tel"
                      id="normal-login-phone-input"
                      placeholder="0550123456"
                      value={normalPhone}
                      onChange={(e) => setNormalPhone(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500 font-mono text-left"
                      dir="ltr"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  id="submit-normal-login-btn"
                  onClick={handleNormalQuickLogin}
                  disabled={isSubmittingNormal}
                  className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-[0.99] text-slate-950 font-black text-xs transition-all shadow-md shadow-amber-500/20 cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingNormal ? 'جاري الدخول...' : '🚀 الدخول المباشر كراكب الآن'}
                </button>
              </div>
            ) : (
              /* Driver Submission Info Card */
              <div className="space-y-3 bg-slate-950/90 border border-slate-800 p-4 rounded-2xl">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-xs pb-1 border-b border-slate-800">
                  <MotoIcon className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>تسجيل سائق جديد بطلب المالك</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  يقوم السائق بإرسال اسمه ورقم هاتفه ومعلومات دراجته وصور الوثائق. تبقى الدراجة والاسم ثابتة ومقفلة للراكب فور اعتماد المالك.
                </p>
                <button
                  type="button"
                  id="open-driver-register-from-modal-btn"
                  onClick={() => {
                    onClose();
                    window.dispatchEvent(new CustomEvent('open-driver-registration'));
                  }}
                  className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-[0.99] text-slate-950 font-black text-xs transition-all shadow-md shadow-amber-500/20 cursor-pointer"
                >
                  📝 إرسال بيانات السائق والوثائق للمالك
                </button>
              </div>
            )}

            {/* Privacy & Security Note */}
            <p className="text-[10px] text-slate-500 text-center leading-normal pt-2">
              بالتسجيل فإنك توافق على شروط الخدمة وسياسة الخصوصية الخاصة بـ MotoDrive.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
