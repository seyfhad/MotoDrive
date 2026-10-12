import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { 
  Star, 
  BadgeCheck, 
  Lock, 
  AlertTriangle, 
  PhoneCall, 
  MessageCircle, 
  Trash2, 
  LogOut,
  HelpCircle,
  ShieldCheck,
  Upload,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { submitVerificationRequestToFirestore } from '../../services/firestoreService';
import { compressImageToBase64 } from '../../utils/imageCompressor';
import { MotoIcon } from '../../components/shared/MotoIcon';
import { ProfileSkeleton } from '../../components/shared/Skeleton';

export const DriverProfile: React.FC = () => {
  const { activeDriver, deleteMyAccount, logout, rides } = useApp();
  const [isLoadingProfile] = useState<boolean>(false);
  const [showCallSupervisor, setShowCallSupervisor] = useState<boolean>(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [isSigningOut, setIsSigningOut] = useState<boolean>(false);

  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [idCardBase64, setIdCardBase64] = useState<string>('');
  const [isSubmittingVerification, setIsSubmittingVerification] = useState(false);
  const [verificationSubmitted, setVerificationSubmitted] = useState(false);

  const handleIdCardUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageToBase64(file, 40, 800);
      setIdCardBase64(compressed);
    } catch (err) {
      console.warn('Error compressing ID card:', err);
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idCardBase64) return;
    setIsSubmittingVerification(true);
    try {
      await submitVerificationRequestToFirestore({
        userId: activeDriver.id,
        userName: activeDriver.name,
        userPhone: activeDriver.phone,
        userPhoto: activeDriver.photoUrl,
        role: 'driver',
        idCardUrl: idCardBase64,
      });
      setVerificationSubmitted(true);
    } catch (err) {
      console.warn('Error submitting verification request:', err);
    } finally {
      setIsSubmittingVerification(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      await logout();
    } finally {
      setIsSigningOut(false);
    }
  };

  const handleConfirmDeleteAccount = async () => {
    try {
      setIsDeleting(true);
      await deleteMyAccount();
      setShowDeleteConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoadingProfile) {
    return (
      <div className="max-w-md mx-auto px-4 py-6 text-right text-slate-100 space-y-4 pb-24" id="driver-profile-screen">
        <ProfileSkeleton />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-6 text-right text-slate-100 space-y-4 pb-24" id="driver-profile-screen">
      {/* Header Profile Card (Read-Only: Locked Name, Phone, Photo) */}
      <div className="bg-slate-900 border border-slate-800/90 rounded-3xl p-5 shadow-xl text-center space-y-3">
        <div className="relative w-20 h-20 mx-auto">
          <img
            src={activeDriver.photoUrl || '/icon.jpg'}
            alt={activeDriver.name}
            className="w-full h-full rounded-full object-cover border-3 border-amber-500 shadow-xl"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/icon.jpg';
            }}
          />
          {activeDriver.status !== 'approved' && (
            <button
              onClick={() => alert('لتأكيد حسابك يرجى إرسال بطاقة الهوية إلى المسؤول.')}
              className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full border-2 border-slate-900 bg-amber-500 text-slate-950 flex items-center justify-center text-xs font-bold cursor-pointer hover:bg-amber-400"
              title="تأكيد الحساب"
            >
              !
            </button>
          )}
        </div>

        <div>
          <div className="flex items-center justify-center gap-1.5 text-sm font-black text-white">
            <span>{activeDriver.name}</span>
            {activeDriver.isVerified && <BadgeCheck className="w-4 h-4 text-emerald-400 shrink-0" />}
          </div>
          <p className="text-xs text-slate-400 mt-0.5 font-mono" dir="ltr">{activeDriver.phone}</p>
          
          {(() => {
            const driverRides = rides.filter(r => r.driverId === activeDriver.id && r.status === 'completed');
            const ratedRides = driverRides.filter(r => r.driverRating !== undefined && r.driverRating !== null);
            const avgRating = ratedRides.length > 0 
              ? (ratedRides.reduce((sum, r) => sum + (r.driverRating || 0), 0) / ratedRides.length) 
              : 5.0;
            const totalTrips = driverRides.length;
            const totalRatings = ratedRides.length;
            
            return (
              <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
                <div className="inline-flex items-center gap-1 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full text-xs font-bold text-amber-400">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <span>{avgRating.toFixed(1)} ({totalRatings} تقييم)</span>
                </div>
                <div className="inline-flex items-center gap-1 bg-blue-500/10 border border-blue-500/30 px-3 py-1 rounded-full text-xs font-bold text-blue-400">
                  <span>{totalTrips} رحلة مكتملة</span>
                </div>
              </div>
            );
          })()}

          <div className="mt-2">
            <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 bg-slate-950/80 border border-slate-800 px-2.5 py-1 rounded-full">
              <Lock className="w-3 h-3 text-amber-400" />
              <span>الاسم ورقم الهاتف والصورة الشخصية ثابتة وغير قابلة للتعديل</span>
            </span>
          </div>
        </div>
      </div>

      {/* Motorcycle Specs */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <MotoIcon className="w-5 h-5 text-amber-400" />
            <h4 className="text-sm font-bold text-white">دراجتي النارية</h4>
          </div>
          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
            <span>🔒 موثقة ومقفولة</span>
          </span>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between text-slate-300">
            <span className="text-slate-500">اسم السائق الثابت:</span>
            <span className="font-bold text-white">{activeDriver.name}</span>
          </div>
          <div className="flex items-center justify-between text-slate-300">
            <span className="text-slate-500">نوع واسم الدراجة:</span>
            <span className="font-bold text-amber-300">{activeDriver.motorcycle.brand} {activeDriver.motorcycle.model} ({activeDriver.motorcycle.year})</span>
          </div>
          <div className="flex items-center justify-between text-slate-300">
            <span className="text-slate-500">اللون:</span>
            <span>{activeDriver.motorcycle.color}</span>
          </div>
          <div className="flex items-center justify-between text-slate-300">
            <span className="text-slate-500">رقم لوحة الترقيم:</span>
            <span className="font-mono font-bold text-amber-400">{activeDriver.motorcycle.plateNumber}</span>
          </div>
          <div className="flex items-center justify-between text-slate-300">
            <span className="text-slate-500">الولاية والبلدية:</span>
            <span>{activeDriver.wilaya} - {activeDriver.municipality}</span>
          </div>
        </div>


      </div>

      {/* Driver Legal, Support & Account Actions */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 space-y-2.5 text-xs">
        <div className="flex items-center justify-between">
          <div className="font-bold text-white flex items-center gap-1.5">
            <span>⚖️</span>
            <span>الدعم والحساب والميثاق القانوني</span>
          </div>
          <span className="text-[10px] text-amber-400 font-mono">MotoDrive Algérie</span>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('open-legal', { detail: { tab: 'terms' } }))}
            className="p-2.5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 rounded-xl text-amber-300 font-bold text-center transition-colors cursor-pointer"
          >
            شروط الاستخدام 📄
          </button>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('open-legal', { detail: { tab: 'privacy' } }))}
            className="p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-300 hover:text-white font-semibold text-center transition-colors cursor-pointer"
          >
            سياسة الخصوصية
          </button>
        </div>

        {/* Help & Support Toggle Button */}
        <div className="space-y-2 pt-1" id="driver-support-actions">
          <button
            type="button"
            onClick={() => setShowCallSupervisor(!showCallSupervisor)}
            className="w-full py-2.5 px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
          >
            <HelpCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>مساعدة</span>
          </button>

          {showCallSupervisor && (
            <div className="p-3 bg-slate-950 border border-amber-500/30 rounded-2xl space-y-2 animate-in fade-in">
              <p className="text-[11px] text-slate-300 text-center font-bold">
                تواصل معنا عبر إحدى الوسائل التالية:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <a
                  href="tel:0542524728"
                  className="py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>اتصال بالمسؤول</span>
                </a>
                <a
                  href="https://www.facebook.com/share/1DnSTUk7WL/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transition-all"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>تواصل عبر الفيسبوك</span>
                </a>
              </div>
            </div>
          )}

          {/* Request Account Verification */}
          {!activeDriver.isVerified && (
            <button
              type="button"
              onClick={() => setShowVerificationModal(true)}
              className="w-full py-2.5 px-3 rounded-xl bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 text-blue-300 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
            >
              <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" />
              <span>طلب توثيق الحساب (إرسال بطاقة الهوية)</span>
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-800 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30 border border-slate-700 text-slate-200 font-semibold text-xs transition-all disabled:opacity-60 cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>{isSigningOut ? 'جاري تسجيل الخروج...' : 'تسجيل الخروج من الحساب'}</span>
        </button>

        {/* Google Play Account Deletion Policy Button */}
        <button
          type="button"
          onClick={() => setShowDeleteConfirm(true)}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 font-bold text-xs transition-all cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>حذف حساب السائق والبيانات نهائياً</span>
        </button>
      </div>

      {/* Delete Account Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in" dir="rtl">
          <div className="bg-slate-900 border border-red-500/40 rounded-3xl p-5 max-w-xs w-full text-right space-y-3 shadow-2xl">
            <div className="w-11 h-11 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 mx-auto">
              <Trash2 className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-black text-white text-center">تأكيد حذف حساب السائق نهائياً</h4>
            <p className="text-xs text-slate-300 text-center leading-relaxed">
              هل أنت متأكد من رغبتك في حذف حساب السائق وجميع بياناتك نهائياً من منصة MotoDrive؟ لا يمكن التراجع عن هذا الإجراء.
            </p>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteAccount}
                disabled={isDeleting}
                className="py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-black cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? 'جاري الحذف...' : 'نعم، احذف حسابي'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Verification Request Modal */}
      {showVerificationModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in"
          onClick={() => setShowVerificationModal(false)}
        >
          <div
            className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4 text-right"
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>طلب توثيق الحساب بالهوية</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowVerificationModal(false)}
                className="w-7 h-7 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            {verificationSubmitted ? (
              <div className="py-6 flex flex-col items-center justify-center space-y-2 text-center animate-in fade-in">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-white">تم إرسال طلب التوثيق بنجاح!</h4>
                <p className="text-xs text-slate-400">سيقوم المسؤول بمراجعة بطاقة الهوية وتوثيق حسابك قريباً.</p>
                <button
                  type="button"
                  onClick={() => setShowVerificationModal(false)}
                  className="mt-2 py-2 px-4 bg-amber-500 text-slate-950 font-black rounded-xl text-xs cursor-pointer"
                >
                  حسناً
                </button>
              </div>
            ) : (
              <form onSubmit={handleVerifySubmit} className="space-y-3">
                <p className="text-xs text-slate-300 leading-relaxed">
                  يرجى إرفاق صورة واضحة لبطاقة الهوية الوطنية أو رخصة السياقة ليتمكن المسؤول من التحقق وتوثيق حسابك وإظهار شارة التوثيق.
                </p>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-300 block">صورة بطاقة الهوية:</label>
                  <label className="border-2 border-dashed border-slate-700 hover:border-amber-500 bg-slate-950/60 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors block">
                    {idCardBase64 ? (
                      <div className="relative w-full h-32 rounded-xl overflow-hidden bg-black">
                        <img src={idCardBase64} alt="ID Preview" className="w-full h-full object-contain" />
                        <span className="absolute bottom-1 right-1 px-2 py-0.5 bg-emerald-500 text-slate-950 font-bold text-[10px] rounded">تم الرفع ✓</span>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-6 h-6 text-amber-400" />
                        <span className="text-xs font-bold text-white">اضغط لاختيار صورة الهوية</span>
                        <span className="text-[10px] text-slate-500">PNG, JPG بحد أقصى</span>
                      </>
                    )}
                    <input type="file" accept="image/*" onChange={handleIdCardUpload} className="hidden" />
                  </label>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={!idCardBase64 || isSubmittingVerification}
                    className="flex-1 py-2.5 px-4 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-black rounded-xl text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20 disabled:opacity-40"
                  >
                    {isSubmittingVerification ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>جاري الإرسال...</span>
                      </>
                    ) : (
                      <span>إرسال طلب التوثيق للمسؤول</span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowVerificationModal(false)}
                    className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
