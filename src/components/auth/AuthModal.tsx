import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import {
  signOutUser,
  registerOrRestoreUserByPhone,
  getCachedUserByPhone,
  findUserAndDriverByPhone,
} from '../../services/authService';
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
  AlertCircle,
  LogIn,
  UserPlus,
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

  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [selectedRole, setSelectedRole] = useState<UserRole>(defaultRole);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [normalName, setNormalName] = useState('مستخدم MotoDrive');
  const [normalPhone, setNormalPhone] = useState('0550123456');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setErrorMsg(null);
    } else {
      setSelectedRole(defaultRole || 'passenger');
      setAuthMode('login');
      try {
        const remembered =
          localStorage.getItem('motodrive_registered_phone') ||
          localStorage.getItem('motodrive_remembered_phone') ||
          localStorage.getItem('motodrive_last_phone');
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

  // Submit Login handler
  const handleLoginSubmit = async () => {
    const cleanPhone = normalPhone.trim().replace(/\s+/g, '');
    const cleanName = normalName.trim() || 'مستخدم MotoDrive';

    if (!cleanPhone || cleanPhone.length < 8) {
      setErrorMsg('يرجى كتابة رقم هاتف صحيح متكون من 10 أرقام.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const { profile, driver } = await findUserAndDriverByPhone(cleanPhone);

      if (selectedRole === 'driver') {
        if (!driver) {
          setErrorMsg(
            '⚠️ لم يتم العثور على حساب أو طلب سائق بهذا الرقم. يرجى التبديل لـ "إنشاء حساب جديد" لتقديم الطلب ورفع الوثائق الـ 4.'
          );
          setIsSubmitting(false);
          return;
        }

        // Store remembered phone
        try {
          localStorage.setItem('motodrive_registered_phone', cleanPhone);
          localStorage.setItem('motodrive_active_driver_phone', cleanPhone);
        } catch (e) {}

        setActiveDriver(driver);
        setCurrentRole('driver');

        if (driver.status === 'pending') {
          broadcastNotification(
            'طلبك قيد المراجعة',
            `أهلاً بك يا ${driver.name}. طلبك والوثائق الـ 4 قيد تدقيق الإدارة حالياً.`
          );
        } else if (driver.status === 'rejected') {
          broadcastNotification(
            'تم رفض طلبك',
            `سبب الرفض: ${driver.rejectionReason || 'الوثائق غير مطابقة للشروط'}`
          );
        } else {
          broadcastNotification(
            'مرحباً بعودتك!',
            `تم تسجيل دخولك بنجاح كـ سائق معتمد: ${driver.name}`
          );
        }

        if (onSuccess) onSuccess();
        onClose();
      } else {
        // Passenger login
        const res = await registerOrRestoreUserByPhone(cleanName, cleanPhone, 'passenger');
        setCurrentUser(res.user);
        setActivePassenger(res.profile);
        setCurrentRole('passenger');

        try {
          localStorage.setItem('motodrive_remembered_phone', cleanPhone);
        } catch (e) {}

        broadcastNotification(
          'مرحباً بعودتك!',
          `تم تسجيل الدخول بنجاح كراكب: ${res.profile.name}`
        );

        if (onSuccess) onSuccess();
        onClose();
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setErrorMsg('حدث خطأ أثناء فحص البيانات. التأكد من الاتصال بالإنترنت.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Register handler for Passenger
  const handleRegisterPassengerSubmit = async () => {
    const cleanPhone = normalPhone.trim().replace(/\s+/g, '');
    const cleanName = normalName.trim() || 'راكب MotoDrive';

    if (!cleanPhone || cleanPhone.length < 8) {
      setErrorMsg('يرجى كتابة رقم هاتف صحيح.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await registerOrRestoreUserByPhone(cleanName, cleanPhone, 'passenger');
      setCurrentUser(res.user);
      setActivePassenger(res.profile);
      setCurrentRole('passenger');

      if (res.isExisting) {
        broadcastNotification(
          'هذا الرقم مسجل بالفعل!',
          `تم الدخول تلقائياً إلى حسابك الراكب الحالي: ${res.profile.name}`
        );
      } else {
        broadcastNotification('مرحباً بك!', `تم إنشاء حساب راكب جديد بنجاح باسم: ${cleanName}`);
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setErrorMsg('تعذر إنشاء الحساب. يرجى المحاولة لاحقاً.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
      id="auth-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      dir="rtl"
    >
      <div
        className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-5 sm:p-6 text-right text-slate-100 shadow-2xl space-y-4 relative overflow-hidden max-h-[92vh] overflow-y-auto"
        id="auth-modal-container"
      >
        {/* Ambient Top Glow */}
        <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
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
              <span>{authMode === 'login' ? 'تسجيل الدخول' : 'إنشاء حساب جديد'}</span>
              <Sparkles className="w-4 h-4 text-amber-400" />
            </h3>
            <p className="text-[11px] text-slate-400">MotoDrive Algérie</p>
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
                  <span>{currentUser?.email || activePassenger.email || 'حساب متصل'}</span>
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
        ) : (
          <div className="space-y-4 animate-in fade-in duration-300">
            {/* Top Auth Mode Toggle: Login vs Register */}
            <div className="grid grid-cols-2 gap-1.5 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('login');
                  setErrorMsg(null);
                }}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  authMode === 'login'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>تسجيل الدخول</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAuthMode('register');
                  setErrorMsg(null);
                }}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  authMode === 'register'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>إنشاء حساب جديد</span>
              </button>
            </div>

            {/* Role Switcher: Passenger vs Driver */}
            <div className="bg-slate-950 border border-slate-800 p-1 rounded-xl flex items-center justify-between gap-1">
              <button
                type="button"
                onClick={() => {
                  setSelectedRole('passenger');
                  setErrorMsg(null);
                }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedRole === 'passenger'
                    ? 'bg-slate-800 text-amber-400 border border-amber-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>راكب</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedRole('driver');
                  setErrorMsg(null);
                }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedRole === 'driver'
                    ? 'bg-slate-800 text-amber-400 border border-amber-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <MotoIcon className="w-3.5 h-3.5" />
                <span>سائق</span>
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-xs leading-relaxed space-y-1">
                <div className="flex items-center gap-1 font-bold">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>تنبيه:</span>
                </div>
                <p>{errorMsg}</p>
              </div>
            )}

            {authMode === 'login' ? (
              /* LOGIN MODE FORM */
              <div className="space-y-3 bg-slate-950/90 border border-slate-800 p-4 rounded-2xl">
                <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5 pb-1 border-b border-slate-800">
                  <LogIn className="w-3.5 h-3.5" />
                  <span>
                    {selectedRole === 'driver'
                      ? 'تسجيل دخول سائق مسجل سابقاً'
                      : 'تسجيل دخول راكب برقم الهاتف'}
                  </span>
                </div>

                <div className="space-y-2.5">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">
                      رقم الهاتف المسجل:
                    </label>
                    <input
                      type="tel"
                      id="login-phone-input"
                      placeholder="0550123456"
                      value={normalPhone}
                      onChange={(e) => setNormalPhone(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500 font-mono text-left"
                      dir="ltr"
                    />
                  </div>

                  {selectedRole === 'passenger' && (
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">
                        الاسم الكامل (اختياري):
                      </label>
                      <input
                        type="text"
                        id="login-name-input"
                        placeholder="مثال: أحمد بلقاسم"
                        value={normalName}
                        onChange={(e) => setNormalName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  id="submit-login-btn"
                  onClick={handleLoginSubmit}
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-[0.99] text-slate-950 font-black text-xs transition-all shadow-md shadow-amber-500/20 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting
                    ? 'جاري فحص وتأكيد الحساب...'
                    : selectedRole === 'driver'
                    ? '🔑 تسجيل دخول السائق ومتابعة الطلب'
                    : '🔑 تسجيل الدخول الآن'}
                </button>
              </div>
            ) : (
              /* REGISTER MODE FORM */
              <div className="space-y-3 bg-slate-950/90 border border-slate-800 p-4 rounded-2xl">
                {selectedRole === 'driver' ? (
                  <div className="space-y-3">
                    <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5 pb-1 border-b border-slate-800">
                      <MotoIcon className="w-4 h-4" />
                      <span>تقديم طلب تسجيل سائق جديد (الوثائق الـ 4)</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      يتطلب تسجيل السائق إرفاق 4 صور (السيلفي، الدراجة، رخصة السياقة، والبطاقة الرمادية) وإدخال معلومات الدراجة لاعتمادها من المالك.
                    </p>
                    <button
                      type="button"
                      id="open-driver-register-modal-btn"
                      onClick={() => {
                        onClose();
                        window.dispatchEvent(new CustomEvent('open-driver-registration'));
                      }}
                      className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-[0.99] text-slate-950 font-black text-xs transition-all shadow-md shadow-amber-500/20 cursor-pointer"
                    >
                      📝 تعبئة نموذج السائق وإرفاق الوثائق الـ 4
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5 pb-1 border-b border-slate-800">
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>إنشاء حساب راكب جديد</span>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">الاسم الكامل:</label>
                        <input
                          type="text"
                          id="register-name-input"
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
                          id="register-phone-input"
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
                      id="submit-register-passenger-btn"
                      onClick={handleRegisterPassengerSubmit}
                      disabled={isSubmitting}
                      className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-[0.99] text-slate-950 font-black text-xs transition-all shadow-md shadow-amber-500/20 cursor-pointer disabled:opacity-50"
                    >
                      {isSubmitting ? 'جاري التسجيل...' : '🚀 إنشاء حساب راكب جديد'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Privacy & Security Note */}
            <p className="text-[10px] text-slate-500 text-center leading-normal pt-1">
              بالتسجيل فإنك توافق على شروط الخدمة وسياسة الخصوصية الخاصة بـ MotoDrive Algérie.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
