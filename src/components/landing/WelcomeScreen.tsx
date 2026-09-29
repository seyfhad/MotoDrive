import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import {
  signInQuickGuest,
  registerOrRestoreUserByPhone,
  getCachedUserByPhone,
} from '../../services/authService';
import { syncDriverProfile } from '../../services/firestoreService';
import { UserRole, DriverProfile } from '../../types';
import { MotoIcon } from '../shared/MotoIcon';
import { AdminPasscodeModal } from '../admin/AdminPasscodeModal';
import {
  User,
  Zap,
  ShieldCheck,
  FileText,
  CheckCircle2,
  Sparkles,
  MapPin,
  KeyRound,
  Phone,
  FileCheck,
  Building2,
  AlertCircle,
  Loader2,
} from 'lucide-react';

interface WelcomeScreenProps {
  onOpenLegal: (tab: 'privacy' | 'terms' | 'gcp-guide') => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onOpenLegal }) => {
  const { setCurrentUser, setActivePassenger, setActiveDriver, setCurrentRole, broadcastNotification } = useApp();

  const [activeFormTab, setActiveFormTab] = useState<'passenger' | 'driver'>('passenger');
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

  // Remembered user message
  const [savedUserHint, setSavedUserHint] = useState<string | null>(null);

  // Passenger Form State
  const [passengerName, setPassengerName] = useState('');
  const [passengerPhone, setPassengerPhone] = useState('');
  const [isPassengerSubmitting, setIsPassengerSubmitting] = useState(false);

  // Driver Form State
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [motorcycleModel, setMotorcycleModel] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [wilaya, setWilaya] = useState('16 - الجزائر العاصمة');
  const [isDriverSubmitting, setIsDriverSubmitting] = useState(false);

  const [formError, setFormError] = useState<string | null>(null);

  // Auto-restore remembered phone number on mount
  useEffect(() => {
    try {
      const remembered = localStorage.getItem('motodrive_remembered_phone') || localStorage.getItem('motodrive_last_phone');
      if (remembered) {
        setPassengerPhone(remembered);
        setDriverPhone(remembered);

        const cached = getCachedUserByPhone(remembered);
        if (cached?.profile) {
          setPassengerName(cached.profile.name);
          setSavedUserHint(`مرحباً بعودتك: ${cached.profile.name}`);
        }
        if (cached?.driver) {
          setDriverName(cached.driver.name);
          if (cached.driver.motorcycle) {
            setMotorcycleModel(`${cached.driver.motorcycle.brand} ${cached.driver.motorcycle.model}`);
            setPlateNumber(cached.driver.motorcycle.plateNumber);
          }
        }
      }
    } catch (e) {}
  }, []);

  // Check phone as user types to restore existing name
  const handlePassengerPhoneChange = (val: string) => {
    setPassengerPhone(val);
    const cached = getCachedUserByPhone(val);
    if (cached?.profile) {
      setPassengerName(cached.profile.name);
      setSavedUserHint(`تم التعرف على حسابك: ${cached.profile.name}`);
    } else {
      setSavedUserHint(null);
    }
  };

  const handleDriverPhoneChange = (val: string) => {
    setDriverPhone(val);
    const cached = getCachedUserByPhone(val);
    if (cached?.driver) {
      setDriverName(cached.driver.name);
      if (cached.driver.motorcycle) {
        setMotorcycleModel(`${cached.driver.motorcycle.brand} ${cached.driver.motorcycle.model}`);
        setPlateNumber(cached.driver.motorcycle.plateNumber);
      }
      setSavedUserHint(`تم العثور على حساب السائق: ${cached.driver.name}`);
    } else if (cached?.profile) {
      setDriverName(cached.profile.name);
      setSavedUserHint(`تم العثور على حسابك: ${cached.profile.name}`);
    } else {
      setSavedUserHint(null);
    }
  };

  // Handle Passenger Submission with Phone Memory
  const handlePassengerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanName = passengerName.trim() || 'راكب MotoDrive';
    const cleanPhone = passengerPhone.trim() || '0550000000';

    try {
      setIsPassengerSubmitting(true);
      const res = await registerOrRestoreUserByPhone(cleanName, cleanPhone, 'passenger');
      
      setCurrentUser(res.user);
      setActivePassenger(res.profile);
      setCurrentRole('passenger');

      if (res.isExisting) {
        broadcastNotification('مرحباً بعودتك!', `أهلاً بك مجدداً يا ${res.profile.name}`);
      } else {
        broadcastNotification('مرحباً بك!', `تم تسجيل حسابك كراكب بنجاح باسم: ${cleanName}`);
      }
    } catch (err: any) {
      console.error('Passenger submit error:', err);
      setFormError('حدث خطأ أثناء إرسال البيانات. يرجى المحاولة ثانية.');
    } finally {
      setIsPassengerSubmitting(false);
    }
  };

  // Handle Driver Submission with Phone Memory
  const handleDriverSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanName = driverName.trim();
    const cleanPhone = driverPhone.trim();
    const cleanModel = motorcycleModel.trim();
    const cleanPlate = plateNumber.trim();

    if (!cleanName || cleanName.length < 3) {
      setFormError('يرجى إدخال اسم السائق الكامل');
      return;
    }
    if (!cleanPhone || cleanPhone.length < 8) {
      setFormError('يرجى إدخال رقم هاتف صحيح للاتصال');
      return;
    }
    if (!cleanModel) {
      setFormError('يرجى إدخال نوع واسم الدراجة النارية والموديل');
      return;
    }
    if (!cleanPlate) {
      setFormError('يرجى إدخال رقم لوحة الترقيم للدراجة');
      return;
    }

    try {
      setIsDriverSubmitting(true);
      const res = await registerOrRestoreUserByPhone(cleanName, cleanPhone, 'driver', {
        brand: cleanModel.split(' ')[0] || 'دراجة نارية',
        model: cleanModel.split(' ').slice(1).join(' ') || 'الموديل',
        plateNumber: cleanPlate,
        wilaya: wilaya,
      });

      if (res.driver) {
        setActiveDriver(res.driver);
      }
      setCurrentUser(res.user);
      setActivePassenger(res.profile);
      setCurrentRole('driver');

      if (res.isExisting && res.driver?.status === 'approved') {
        broadcastNotification('مرحباً بعودتك يا كابتن!', 'حسابك معتمد ونشط. يمكنك بدء استقبال المشاوير مباشرة.');
      } else {
        broadcastNotification('تم حفظ بيانات السائق!', 'بياناتك قيد المراجعة لدى المالك. سيتم تفعيل حسابك فور الموافقة.');
      }
    } catch (err: any) {
      console.error('Driver registration error:', err);
      setFormError('حدث خطأ أثناء إرسال بيانات السائق. يرجى إعادة المحاولة.');
    } finally {
      setIsDriverSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full flex flex-col justify-between p-4 sm:p-6 bg-slate-950 text-slate-100 relative overflow-hidden text-right"
      style={{
        paddingTop: 'max(var(--safe-area-top, 0px), 1rem)',
        paddingBottom: 'max(var(--safe-area-bottom, 0px), 1rem)',
      }}
      id="motodrive-welcome-screen"
      dir="rtl"
    >
      {/* Subtle Ambient Background Lighting */}
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header / Brand Badge with Hidden Motorcycle Trigger */}
      <div className="relative z-10 flex items-center justify-between pt-1">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsAdminModalOpen(true)}
            className="w-10 h-10 rounded-2xl overflow-hidden shadow-lg shadow-amber-500/20 border border-amber-500/30 shrink-0 cursor-pointer active:scale-95 transition-transform hover:border-amber-400"
            title="MotoDrive"
            aria-label="أيقونة الدراجة"
          >
            <img src="/icon.jpg" alt="MotoDrive" className="w-full h-full object-cover" />
          </button>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-black tracking-tight text-white font-sans">
                Moto<span className="text-amber-400">Drive</span>
              </span>
            </div>
            <p className="text-[10px] text-slate-400">منصة النقل بالدراجات النارية في الجزائر</p>
          </div>
        </div>
      </div>

      {/* Main Interactive Form Body */}
      <div className="relative z-10 my-auto py-4 space-y-4 max-w-sm mx-auto w-full">
        <div className="text-center space-y-1">
          <h1 className="text-xl sm:text-2xl font-black text-white leading-tight">
            أدخل معلوماتك للانطلاق مباشرة 🚀
          </h1>
          <p className="text-xs text-slate-400">
            ملء المعلومات فورياً دون الحاجة لتسجيل بحساب Google
          </p>
        </div>

        {/* Tab Switcher: Passenger vs Driver */}
        <div className="bg-slate-900 border border-slate-800 p-1.5 rounded-2xl flex items-center gap-1 shadow-lg">
          <button
            type="button"
            onClick={() => {
              setActiveFormTab('passenger');
              setFormError(null);
            }}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeFormTab === 'passenger'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <User className="w-4 h-4" />
            <span>أنا راكب (طلب رحلة)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveFormTab('driver');
              setFormError(null);
            }}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeFormTab === 'driver'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <MotoIcon className="w-4 h-4" />
            <span>أنا سائق (تسجيل العمل)</span>
          </button>
        </div>

        {/* Saved User Greeting Banner */}
        {savedUserHint && (
          <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300 flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="font-bold">{savedUserHint}</span>
            </div>
            <span className="text-[10px] text-slate-400">حسابك محفوظ</span>
          </div>
        )}

        {/* Form Error Banner */}
        {formError && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-300 flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        {/* PASSENGER DIRECT FORM */}
        {activeFormTab === 'passenger' && (
          <form onSubmit={handlePassengerSubmit} className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-5 space-y-3.5 shadow-2xl backdrop-blur-md animate-in fade-in duration-200">
            <div className="text-right">
              <h3 className="text-xs font-black text-amber-400 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span>دخول الراكب المباشر</span>
              </h3>
            </div>

            <div className="space-y-2.5">
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">الاسم الكامل:</label>
                <div className="relative">
                  <input
                    type="text"
                    value={passengerName}
                    onChange={(e) => setPassengerName(e.target.value)}
                    placeholder="مثال: أحمد العالي"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
                  />
                  <User className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">رقم الهاتف (للتواصل عند الانطلاق):</label>
                <div className="relative">
                  <input
                    type="tel"
                    value={passengerPhone}
                    onChange={(e) => handlePassengerPhoneChange(e.target.value)}
                    placeholder="0550123456"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500 font-mono text-left"
                    dir="ltr"
                  />
                  <Phone className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isPassengerSubmitting}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 active:scale-[0.99] text-slate-950 font-black text-xs transition-all shadow-xl shadow-amber-500/20 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isPassengerSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جاري الدخول...</span>
                </>
              ) : (
                <>
                  <span>🚀 الانطلاق وتصفح الرحلات كراكب</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* DRIVER REGISTRATION FORM */}
        {activeFormTab === 'driver' && (
          <form onSubmit={handleDriverSubmit} className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-5 space-y-3 shadow-2xl backdrop-blur-md animate-in fade-in duration-200">
            <div className="text-right">
              <h3 className="text-xs font-black text-amber-400 flex items-center gap-1.5">
                <MotoIcon className="w-4 h-4 text-amber-400" />
                <span>إرسال بيانات السائق للمالك بانتظار التفعيل</span>
              </h3>
            </div>

            <div className="space-y-2 text-right">
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">اسم السائق الثلاثي:</label>
                <input
                  type="text"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  placeholder="مثال: أسامة بن عبد الله"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">رقم الهاتف:</label>
                <input
                  type="tel"
                  value={driverPhone}
                  onChange={(e) => handleDriverPhoneChange(e.target.value)}
                  placeholder="0661234567"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500 font-mono text-left"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">نوع واسم الدراجة النارية والموديل:</label>
                <input
                  type="text"
                  value={motorcycleModel}
                  onChange={(e) => setMotorcycleModel(e.target.value)}
                  placeholder="مثال: SYM Symphony ST 150"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
                />
                <span className="text-[9px] text-amber-400 mt-0.5 block">
                  * يبقى اسم الدراجة والاسم ثابتاً للركاب ولا يمكن السائق تغييره لاحقاً
                </span>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">رقم لوحة الترقيم (Matricule):</label>
                <input
                  type="text"
                  value={plateNumber}
                  onChange={(e) => setPlateNumber(e.target.value)}
                  placeholder="مثال: 12345-116-16"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isDriverSubmitting}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 active:scale-[0.99] text-slate-950 font-black text-xs transition-all shadow-xl shadow-amber-500/20 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isDriverSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جاري حفظ البيانات...</span>
                </>
              ) : (
                <>
                  <span>📝 إرسال بيانات السائق بانتظار موافقة المالك</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>

      {/* Footer with Terms of Service & Admin Passcode Entry */}
      <div className="relative z-10 pt-3 border-t border-slate-900 space-y-2">
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-medium">
          <button
            type="button"
            onClick={() => onOpenLegal('terms')}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-amber-300 text-[11px] font-bold"
          >
            شروط الاستخدام 📄
          </button>

          <button
            type="button"
            onClick={() => onOpenLegal('privacy')}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-amber-300 text-[11px] font-bold"
          >
            سياسة الخصوصية 🛡️
          </button>
        </div>

        <div className="text-center text-[10px] text-slate-500">
          MotoDrive Algérie © 2026 • جميع الحقوق محفوظة
        </div>
      </div>

      {/* Admin Passcode Modal */}
      <AdminPasscodeModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
      />
    </div>
  );
};
