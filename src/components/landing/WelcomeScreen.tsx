import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import {
  registerOrRestoreUserByPhone,
  getCachedUserByPhone,
  findUserAndDriverByPhone,
} from '../../services/authService';
import { fileToCompressedDataUrl } from '../../services/firestoreService';
import { submitDriverApplication } from '../../services/driverApplicationsService';
import { MotoIcon } from '../shared/MotoIcon';
import { AdminPasscodeModal } from '../admin/AdminPasscodeModal';
import {
  User,
  Zap,
  FileText,
  CheckCircle2,
  Phone,
  FileCheck,
  AlertCircle,
  Loader2,
  Camera,
  Image as ImageIcon,
  LogIn,
  UserPlus,
} from 'lucide-react';

interface WelcomeScreenProps {
  onOpenLegal: (tab: 'privacy' | 'terms' | 'gcp-guide') => void;
  onOpenLogin?: () => void;
  onContinueAsGuest?: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onOpenLegal }) => {
  const { setCurrentUser, setActivePassenger, setActiveDriver, setCurrentRole, broadcastNotification } = useApp();

  const [activeFormTab, setActiveFormTab] = useState<'passenger' | 'driver'>('passenger');
  const [passengerMode, setPassengerMode] = useState<'register' | 'login'>('register');
  const [driverMode, setDriverMode] = useState<'register' | 'login'>('register');
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

  // Driver Photo & Document Upload States (ALL 4 REQUIRED)
  const [selfieDataUrl, setSelfieDataUrl] = useState<string>('');
  const [licenseDataUrl, setLicenseDataUrl] = useState<string>('');
  const [vehicleDocDataUrl, setVehicleDocDataUrl] = useState<string>('');
  const [motoPhotoDataUrl, setMotoPhotoDataUrl] = useState<string>('');
  const [isCompressingPhotos, setIsCompressingPhotos] = useState<boolean>(false);

  const [formError, setFormError] = useState<string | null>(null);

  const uploadedPhotosCount = [
    selfieDataUrl,
    licenseDataUrl,
    vehicleDocDataUrl,
    motoPhotoDataUrl,
  ].filter(Boolean).length;

  // File upload handler converting image to compressed Base64 Data URL directly
  const handlePhotoSelect = async (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsCompressingPhotos(true);
      setFormError(null);
      const dataUrl = await fileToCompressedDataUrl(file, 500, 0.55);
      setter(dataUrl);
    } catch (err) {
      console.warn('Error processing photo:', err);
      setFormError('تعذر معالجة الصورة المختارة. يرجى اختيار صورة أخرى.');
    } finally {
      setIsCompressingPhotos(false);
    }
  };

  // Auto-restore remembered phone number on mount
  useEffect(() => {
    try {
      const remembered =
        localStorage.getItem('motodrive_registered_phone') ||
        localStorage.getItem('motodrive_remembered_phone') ||
        localStorage.getItem('motodrive_last_phone');
      if (remembered && remembered !== '0550000000') {
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
    setFormError(null);
    const cached = getCachedUserByPhone(val);
    if (cached?.profile) {
      setPassengerName(cached.profile.name);
      setSavedUserHint(`تم التعرف على حسابك المسجل: ${cached.profile.name}`);
    } else {
      setSavedUserHint(null);
    }
  };

  const handleDriverPhoneChange = (val: string) => {
    setDriverPhone(val);
    setFormError(null);
    const cached = getCachedUserByPhone(val);
    if (cached?.driver) {
      setDriverName(cached.driver.name);
      if (cached.driver.motorcycle) {
        setMotorcycleModel(`${cached.driver.motorcycle.brand} ${cached.driver.motorcycle.model}`);
        setPlateNumber(cached.driver.motorcycle.plateNumber);
      }
      setSavedUserHint(`رقم مسجل كسائق: ${cached.driver.name}`);
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
    const cleanPhone = passengerPhone.trim().replace(/\s+/g, '');

    if (!cleanPhone || cleanPhone.length < 8) {
      setFormError('يرجى إدخال رقم هاتف صحيح للتواصل عند طلب الرحلة.');
      return;
    }

    try {
      setIsPassengerSubmitting(true);
      const res = await registerOrRestoreUserByPhone(cleanName, cleanPhone, 'passenger');

      setCurrentUser(res.user);
      setActivePassenger(res.profile);
      setCurrentRole('passenger');

      if (res.isExisting) {
        broadcastNotification('الرقم مسجل مسبقاً - مرحباً بعودتك!', `تم استرجاع حسابك كراكب: ${res.profile.name}`);
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

  // Handle Driver Login (for already registered drivers)
  const handleDriverLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanPhone = driverPhone.trim().replace(/\s+/g, '');
    if (!cleanPhone || cleanPhone.length < 8) {
      setFormError('يرجى إدخال رقم الهاتف الذي قمت بالتسجيل به.');
      return;
    }

    try {
      setIsDriverSubmitting(true);
      const { profile, driver } = await findUserAndDriverByPhone(cleanPhone);

      if (!driver) {
        setFormError(
          '⚠️ هذا الرقم غير مسجل كسائق بعد. يرجى التبديل إلى "إنشاء حساب سائق جديد" وإرفاق الصور الـ 4 الإجبارية.'
        );
        return;
      }

      try {
        localStorage.setItem('motodrive_registered_phone', cleanPhone);
        localStorage.setItem('motodrive_active_driver_phone', cleanPhone);
        localStorage.setItem('motodrive_remembered_phone', cleanPhone);
        localStorage.setItem(
          'motodrive_user_session',
          JSON.stringify({
            user: profile || {
              id: driver.userId || driver.id,
              name: driver.name,
              phone: cleanPhone,
              role: 'driver',
              status: 'active',
              createdAt: driver.createdAt || new Date().toISOString(),
            },
            driver,
            timestamp: Date.now(),
          })
        );
      } catch (e) {}

      setCurrentUser({
        uid: driver.userId || driver.id,
        displayName: driver.name,
        phoneNumber: cleanPhone,
      } as any);
      if (profile) setActivePassenger(profile);
      setActiveDriver(driver);
      setCurrentRole('driver');

      if (driver.status === 'pending') {
        broadcastNotification(
          'حسابك قيد المراجعة ⏳',
          `مرحباً ${driver.name}، طلبك قيد المراجعة لدى المالك حالياً.`
        );
      } else if (driver.status === 'rejected') {
        broadcastNotification(
          'تم رفض طلبك ❌',
          `سبب الرفض من المالك: ${driver.rejectionReason || 'الوثائق غير مطابقة للشروط'}`
        );
      } else {
        broadcastNotification(
          'مرحباً بعودتك يا كابتن! ✅',
          `تم تسجيل دخولك بنجاح كسائق معتمد: ${driver.name}`
        );
      }
    } catch (err) {
      console.error('Driver login error:', err);
      setFormError('حدث خطأ أثناء التحقق من الرقم. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsDriverSubmitting(false);
    }
  };

  // Handle Driver Registration Submission (STRICT 4 PHOTOS VALIDATION)
  const handleDriverSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (driverMode === 'login') {
      return handleDriverLoginSubmit(e);
    }

    const cleanName = driverName.trim();
    const cleanPhone = driverPhone.trim().replace(/\s+/g, '');
    const cleanModel = motorcycleModel.trim();
    const cleanPlate = plateNumber.trim();

    if (!cleanName || cleanName.length < 3) {
      setFormError('يرجى إدخال اسم السائق الثلاثي الكامل.');
      return;
    }
    if (!cleanPhone || cleanPhone.length < 8) {
      setFormError('يرجى إدخال رقم هاتف صحيح للاتصال.');
      return;
    }

    // Check if phone number is already registered in Firestore
    try {
      setIsDriverSubmitting(true);
      const existing = await findUserAndDriverByPhone(cleanPhone);
      if (existing.driver && existing.driver.status !== 'rejected') {
        const docs = (existing.driver.documents || {}) as any;
        const hasAllDocs = Boolean(
          (docs.selfieUrl || docs.personalPhotoUrl) &&
          (docs.licenseUrl || docs.licenseFrontUrl) &&
          (docs.vehicleRegistrationUrl || docs.vehicleDocFrontUrl) &&
          (docs.motorcyclePhotoUrl || docs.motorcycleFrontUrl)
        );
        if (hasAllDocs || existing.driver.status === 'approved') {
          setIsDriverSubmitting(false);
          try {
            localStorage.setItem('motodrive_registered_phone', cleanPhone);
            localStorage.setItem('motodrive_active_driver_phone', cleanPhone);
            localStorage.setItem(
              'motodrive_user_session',
              JSON.stringify({
                user: existing.profile || {
                  id: existing.driver.userId || existing.driver.id,
                  name: existing.driver.name,
                  phone: cleanPhone,
                  role: 'driver',
                  status: 'active',
                  createdAt: new Date().toISOString(),
                },
                driver: existing.driver,
                timestamp: Date.now(),
              })
            );
          } catch (e) {}
          setCurrentUser({
            uid: existing.driver.userId || existing.driver.id,
            displayName: existing.driver.name,
            phoneNumber: cleanPhone,
          } as any);
          if (existing.profile) setActivePassenger(existing.profile);
          setActiveDriver(existing.driver);
          setCurrentRole('driver');
          broadcastNotification(
            'هذا الرقم مسجل بالفعل!',
            existing.driver.status === 'approved'
              ? `مرحباً بعودتك ${existing.driver.name}، حسابك معتمد ونشط.`
              : `مرحباً ${existing.driver.name}، هذا الرقم مسجل بالفعل وطلبك قيد المراجعة لدى المالك.`
          );
          return;
        }
      }
    } catch (e) {}

    if (!cleanModel) {
      setIsDriverSubmitting(false);
      setFormError('يرجى إدخال نوع واسم الدراجة النارية والموديل.');
      return;
    }
    if (!cleanPlate) {
      setIsDriverSubmitting(false);
      setFormError('يرجى إدخال رقم لوحة الترقيم (Matricule) للدراجة.');
      return;
    }

    // STRICT CHECK: All 4 photos MUST be uploaded before registration can proceed
    const missingPhotos: string[] = [];
    if (!selfieDataUrl) missingPhotos.push('الصورة الشخصية');
    if (!licenseDataUrl) missingPhotos.push('رخصة السياقة');
    if (!vehicleDocDataUrl) missingPhotos.push('البطاقة الرمادية');
    if (!motoPhotoDataUrl) missingPhotos.push('صورة الدراجة النارية');

    if (missingPhotos.length > 0) {
      setIsDriverSubmitting(false);
      setFormError(
        `⚠️ لا يمكن تسجيل السائق بدون إرفاق الصور الـ 4 الإجبارية! الوثائق الناقصة (${missingPhotos.length}): ${missingPhotos.join('، ')}`
      );
      return;
    }

    try {
      setIsDriverSubmitting(true);
      const brandPart = cleanModel.split(' ')[0] || 'SYM';
      const modelPart = cleanModel.split(' ').slice(1).join(' ') || cleanModel;

      const res = await registerOrRestoreUserByPhone(cleanName, cleanPhone, 'driver', {
        brand: brandPart,
        model: modelPart,
        plateNumber: cleanPlate,
        wilaya: wilaya,
        documents: {
          selfieUrl: selfieDataUrl,
          personalPhotoUrl: selfieDataUrl,
          licenseUrl: licenseDataUrl,
          licenseFrontUrl: licenseDataUrl,
          vehicleRegistrationUrl: vehicleDocDataUrl,
          vehicleDocFrontUrl: vehicleDocDataUrl,
          motorcycleFrontUrl: motoPhotoDataUrl,
        },
      });

      const finalDriverId = res.driver?.id || `driver-${res.profile.id}`;
      const finalUserId = res.profile.id;

      // Also submit to driver_applications collection so Owner sees it in all Admin panels
      await submitDriverApplication({
        id: `app_${finalDriverId}`,
        userId: finalUserId,
        driverId: finalDriverId,
        fullName: cleanName,
        phone: cleanPhone,
        wilaya: wilaya,
        municipality: 'وسط المدينة',
        motorcycle: {
          brand: brandPart,
          model: modelPart,
          year: 2023,
          plateNumber: cleanPlate,
          color: 'أسود',
        },
        documents: {
          selfieUrl: selfieDataUrl,
          motorcyclePhotoUrl: motoPhotoDataUrl,
          licenseUrl: licenseDataUrl,
          vehicleRegistrationUrl: vehicleDocDataUrl,
        },
      });

      try {
        localStorage.setItem('motodrive_registered_phone', cleanPhone);
        localStorage.setItem('motodrive_active_driver_phone', cleanPhone);
        localStorage.setItem('motodrive_remembered_phone', cleanPhone);
      } catch (e) {}

      if (res.driver) {
        setActiveDriver({
          ...res.driver,
          status: 'pending',
          documents: {
            status: 'pending',
            submittedAt: new Date().toISOString(),
            selfieUrl: selfieDataUrl,
            personalPhotoUrl: selfieDataUrl,
            motorcyclePhotoUrl: motoPhotoDataUrl,
            motorcycleFrontUrl: motoPhotoDataUrl,
            licenseUrl: licenseDataUrl,
            licenseFrontUrl: licenseDataUrl,
            vehicleRegistrationUrl: vehicleDocDataUrl,
            vehicleDocFrontUrl: vehicleDocDataUrl,
          },
        });
      }
      setCurrentUser(res.user);
      setActivePassenger(res.profile);
      setCurrentRole('driver');

      broadcastNotification(
        'تم إرسال طلبك والوثائق الـ 4 للمالك!',
        'بياناتك وصورك الـ 4 وصلت للمالك وهي قيد المراجعة حالياً.'
      );
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
            تسجيل الحساب أو الدخول المباشر برقم الهاتف
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
          <div className="p-3 bg-red-500/15 border border-red-500/40 rounded-2xl text-xs text-red-300 flex items-start gap-2 animate-in fade-in leading-relaxed">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span className="font-bold">{formError}</span>
          </div>
        )}

        {/* PASSENGER DIRECT FORM */}
        {activeFormTab === 'passenger' && (
          <form onSubmit={handlePassengerSubmit} className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-5 space-y-3.5 shadow-2xl backdrop-blur-md animate-in fade-in duration-200">
            {/* Passenger Sub-Mode Switcher: Create Account vs Login */}
            <div className="grid grid-cols-2 gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setPassengerMode('register');
                  setFormError(null);
                }}
                className={`py-2 px-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                  passengerMode === 'register'
                    ? 'bg-amber-500 text-slate-950 font-black shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>إنشاء حساب راكب جديد</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPassengerMode('login');
                  setFormError(null);
                }}
                className={`py-2 px-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                  passengerMode === 'login'
                    ? 'bg-amber-500 text-slate-950 font-black shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>تسجيل دخول راكب</span>
              </button>
            </div>

            <div className="text-right">
              <h3 className="text-xs font-black text-amber-400 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span>
                  {passengerMode === 'register' ? 'إنشاء حساب راكب جديد' : 'تسجيل دخول راكب برقم الهاتف'}
                </span>
              </h3>
            </div>

            <div className="space-y-2.5">
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  {passengerMode === 'register' ? 'الاسم الكامل:' : 'الاسم الكامل (اختياري عند وجود حساب سابق):'}
                </label>
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
                <label className="text-[11px] font-bold text-slate-300 block mb-1">رقم الهاتف (للتواصل وحفظ الحساب):</label>
                <div className="relative">
                  <input
                    type="tel"
                    value={passengerPhone}
                    onChange={(e) => handlePassengerPhoneChange(e.target.value)}
                    placeholder="0661234567"
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
                  <span>جاري المتابعة...</span>
                </>
              ) : (
                <>
                  <span>
                    {passengerMode === 'register'
                      ? '🚀 إنشاء الحساب والانطلاق كراكب'
                      : '🔑 تسجيل الدخول ومتابعة الرحلات'}
                  </span>
                </>
              )}
            </button>
          </form>
        )}

        {/* DRIVER REGISTRATION / LOGIN FORM */}
        {activeFormTab === 'driver' && (
          <form onSubmit={handleDriverSubmit} className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-5 space-y-3 shadow-2xl backdrop-blur-md animate-in fade-in duration-200">
            {/* Driver Sub-Mode Switcher: Create Account vs Login */}
            <div className="grid grid-cols-2 gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setDriverMode('register');
                  setFormError(null);
                }}
                className={`py-2 px-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                  driverMode === 'register'
                    ? 'bg-amber-500 text-slate-950 font-black shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>حساب سائق جديد</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setDriverMode('login');
                  setFormError(null);
                }}
                className={`py-2 px-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                  driverMode === 'login'
                    ? 'bg-amber-500 text-slate-950 font-black shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>تسجيل دخول سائق</span>
              </button>
            </div>

            {driverMode === 'login' ? (
              <div className="space-y-3 text-right pt-1">
                <div className="text-xs font-black text-amber-400 flex items-center gap-1.5">
                  <LogIn className="w-4 h-4 text-amber-400" />
                  <span>تسجيل دخول سائق مسجل سابقاً برقم الهاتف</span>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">رقم الهاتف المسجل:</label>
                  <input
                    type="tel"
                    value={driverPhone}
                    onChange={(e) => handleDriverPhoneChange(e.target.value)}
                    placeholder="0661234567"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500 font-mono text-left"
                    dir="ltr"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isDriverSubmitting}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 active:scale-[0.99] text-slate-950 font-black text-xs transition-all shadow-xl shadow-amber-500/20 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isDriverSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>جاري فحص حالة الحساب...</span>
                    </>
                  ) : (
                    <span>🔑 دخول السائق ومتابعة حالة الطلب</span>
                  )}
                </button>
              </div>
            ) : (
              <>
                <div className="text-right">
                  <h3 className="text-xs font-black text-amber-400 flex items-center gap-1.5">
                    <MotoIcon className="w-4 h-4 text-amber-400" />
                    <span>إرسال بيانات السائق والوثائق الـ 4 للمالك بانتظار التفعيل</span>
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
                      * يبقى اسم الدراجة والاسم ثابتاً للركاب ولا يمكن للسائق تغييره لاحقاً
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

                  {/* Photo & Document Attachments Section on the Same Page */}
                  <div className="pt-2 border-t border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-black text-amber-400 flex items-center gap-1">
                        <Camera className="w-3.5 h-3.5" />
                        <span>إرفاق الصور الـ 4 الإجبارية:</span>
                      </label>
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-lg border ${
                          uploadedPhotosCount === 4
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : 'bg-red-500/15 text-red-300 border-red-500/30'
                        }`}
                      >
                        {isCompressingPhotos
                          ? 'جاري ضغط الصورة...'
                          : `${uploadedPhotosCount} من 4 صور مرفقة`}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-right">
                      {/* Selfie Photo */}
                      <label className={`p-2.5 rounded-2xl border text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1 relative overflow-hidden ${
                        selfieDataUrl ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300' : 'bg-slate-950 border-slate-800 hover:border-amber-500/40 text-slate-400'
                      }`}>
                        {selfieDataUrl ? (
                          <div className="w-full flex items-center gap-1.5 justify-center">
                            <img src={selfieDataUrl} alt="صورة السائق" className="w-6 h-6 rounded-full object-cover border border-emerald-400" />
                            <span className="text-[10px] font-bold text-emerald-300 truncate">السيلفي ✓</span>
                          </div>
                        ) : (
                          <>
                            <Camera className="w-4 h-4 text-amber-400" />
                            <span className="text-[10px] font-bold block">1. الصورة الشخصية *</span>
                          </>
                        )}
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handlePhotoSelect(e, setSelfieDataUrl)} />
                      </label>

                      {/* Driver License Photo */}
                      <label className={`p-2.5 rounded-2xl border text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1 relative overflow-hidden ${
                        licenseDataUrl ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300' : 'bg-slate-950 border-slate-800 hover:border-amber-500/40 text-slate-400'
                      }`}>
                        {licenseDataUrl ? (
                          <div className="w-full flex items-center gap-1.5 justify-center">
                            <img src={licenseDataUrl} alt="رخصة السياقة" className="w-6 h-6 rounded-lg object-cover border border-emerald-400" />
                            <span className="text-[10px] font-bold text-emerald-300 truncate">رخصة السياقة ✓</span>
                          </div>
                        ) : (
                          <>
                            <FileCheck className="w-4 h-4 text-amber-400" />
                            <span className="text-[10px] font-bold block">2. رخصة السياقة *</span>
                          </>
                        )}
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handlePhotoSelect(e, setLicenseDataUrl)} />
                      </label>

                      {/* Vehicle Registration Photo */}
                      <label className={`p-2.5 rounded-2xl border text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1 relative overflow-hidden ${
                        vehicleDocDataUrl ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300' : 'bg-slate-950 border-slate-800 hover:border-amber-500/40 text-slate-400'
                      }`}>
                        {vehicleDocDataUrl ? (
                          <div className="w-full flex items-center gap-1.5 justify-center">
                            <img src={vehicleDocDataUrl} alt="البطاقة الرمادية" className="w-6 h-6 rounded-lg object-cover border border-emerald-400" />
                            <span className="text-[10px] font-bold text-emerald-300 truncate">البطاقة الرمادية ✓</span>
                          </div>
                        ) : (
                          <>
                            <FileText className="w-4 h-4 text-amber-400" />
                            <span className="text-[10px] font-bold block">3. البطاقة الرمادية *</span>
                          </>
                        )}
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handlePhotoSelect(e, setVehicleDocDataUrl)} />
                      </label>

                      {/* Motorcycle Photo */}
                      <label className={`p-2.5 rounded-2xl border text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1 relative overflow-hidden ${
                        motoPhotoDataUrl ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300' : 'bg-slate-950 border-slate-800 hover:border-amber-500/40 text-slate-400'
                      }`}>
                        {motoPhotoDataUrl ? (
                          <div className="w-full flex items-center gap-1.5 justify-center">
                            <img src={motoPhotoDataUrl} alt="صورة الدراجة" className="w-6 h-6 rounded-lg object-cover border border-emerald-400" />
                            <span className="text-[10px] font-bold text-emerald-300 truncate">صورة الدراجة ✓</span>
                          </div>
                        ) : (
                          <>
                            <ImageIcon className="w-4 h-4 text-amber-400" />
                            <span className="text-[10px] font-bold block">4. صورة الدراجة *</span>
                          </>
                        )}
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handlePhotoSelect(e, setMotoPhotoDataUrl)} />
                      </label>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isDriverSubmitting || isCompressingPhotos}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 active:scale-[0.99] text-slate-950 font-black text-xs transition-all shadow-xl shadow-amber-500/20 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isDriverSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>جاري إرسال الوثائق الـ 4 للمالك...</span>
                    </>
                  ) : (
                    <span>📝 إرسال بيانات السائق والصور الـ 4 للمالك ({uploadedPhotosCount}/4)</span>
                  )}
                </button>
              </>
            )}
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
