import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import {
  Phone,
  Shield,
  AlertTriangle,
  LogOut,
  Lock,
  PhoneCall,
  MessageCircle,
  Trash2,
  BadgeCheck,
  Star,
  HelpCircle,
  ShieldCheck,
  Upload,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { submitVerificationRequestToFirestore } from '../../services/firestoreService';
import { compressImageToBase64 } from '../../utils/imageCompressor';
import { signOutUser } from '../../services/authService';
import { ProfileSkeleton } from '../../components/shared/Skeleton';

export const PassengerProfile: React.FC = () => {
  const { activePassenger, setCurrentUser, deleteMyAccount, rides } = useApp();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isLoadingProfile] = useState(false);
  const [showCallSupervisor, setShowCallSupervisor] = useState(false);
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
        userId: activePassenger.id,
        userName: activePassenger.name,
        userPhone: activePassenger.phone,
        userPhoto: activePassenger.photoUrl,
        role: 'passenger',
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
      await signOutUser();
      setCurrentUser(null);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSigningOut(false);
    }
  };

  const handleConfirmDeleteAccount = async () => {
    try {
      setIsDeletingAccount(true);
      await deleteMyAccount();
      setShowDeleteConfirm(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsDeletingAccount(false);
    }
  };

  if (isLoadingProfile) {
    return (
      <div className="max-w-md mx-auto px-4 py-6 text-right text-slate-100 space-y-4 pb-24" id="passenger-profile-screen">
        <ProfileSkeleton />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-6 text-right text-slate-100 space-y-4 pb-24" id="passenger-profile-screen">
      {/* Header Profile Card (Read-Only: No editing name, phone, photo, or ID document) */}
      <div className="bg-slate-900 border border-slate-800/90 rounded-3xl p-5 shadow-xl text-center space-y-3">
        <div className="relative w-20 h-20 mx-auto">
          <img
            src={activePassenger.photoUrl || '/icon.jpg'}
            alt={activePassenger.name}
            className="w-full h-full rounded-full object-cover border-3 border-amber-500 shadow-xl"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/icon.jpg';
            }}
          />
          <span
            className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-slate-800 text-amber-400 border-2 border-slate-900 flex items-center justify-center text-[10px] font-bold shadow-md"
            title="بيانات الحساب مقفولة وثابتة"
          >
            <Lock className="w-3.5 h-3.5" />
          </span>
        </div>

        <div>
          <div className="flex items-center justify-center gap-1.5">
            <h3 className="text-lg font-black text-white">{activePassenger.name}</h3>
            {activePassenger.isVerified && <BadgeCheck className="w-4 h-4 text-emerald-400 shrink-0" />}
          </div>
          <p className="text-xs text-slate-400 mt-0.5 font-mono" dir="ltr">{activePassenger.phone}</p>
          
          {(() => {
            const passengerRides = rides.filter(r => r.passengerId === activePassenger.id && r.status === 'completed');
            const ratedRides = passengerRides.filter(r => r.ratingStars !== undefined && r.ratingStars !== null);
            const avgRating = ratedRides.length > 0 
              ? (ratedRides.reduce((sum, r) => sum + (r.ratingStars || 0), 0) / ratedRides.length) 
              : 5.0;
            const totalTrips = passengerRides.length;
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

          <span className="inline-flex items-center gap-1 mt-2 text-[10px] text-slate-400 bg-slate-950/80 border border-slate-800 px-2.5 py-1 rounded-full">
            <Lock className="w-3 h-3 text-amber-400" />
            <span>الاسم ورقم الهاتف والصورة الشخصية ثابتة وغير قابلة للتعديل</span>
          </span>
        </div>
      </div>

      {/* Phone Account Status & Actions Card */}
      <div className="bg-slate-900 border border-slate-800/90 rounded-3xl p-5 space-y-3" id="phone-auth-profile-card">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            <h4 className="text-sm font-bold text-white">معلومات الحساب والإجراءات</h4>
          </div>
          <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full font-bold">
            🔒 مقفول
          </span>
        </div>

        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs border border-amber-500/30">
                <Phone className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-white text-xs">{activePassenger.name}</div>
                <div className="text-[11px] text-slate-400 font-mono" dir="ltr">{activePassenger.phone || '0550123456'}</div>
              </div>
            </div>
            <span className="text-[10px] text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded-md font-bold">
              راكب
            </span>
          </div>

          {/* Help & Support Toggle Button */}
          <div className="space-y-2 pt-1" id="passenger-support-actions">
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
            {!activePassenger.isVerified && (
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
            <span>حذف الحساب والبيانات نهائياً</span>
          </button>
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in" dir="rtl">
          <div className="bg-slate-900 border border-red-500/40 rounded-3xl p-5 max-w-xs w-full text-right space-y-3 shadow-2xl">
            <div className="w-11 h-11 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 mx-auto">
              <Trash2 className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-black text-white text-center">تأكيد حذف الحساب نهائياً</h4>
            <p className="text-xs text-slate-300 text-center leading-relaxed">
              هل أنت متأكد من رغبتك في حذف حسابك وجميع بياناتك وسجل رحلاتك نهائياً من منصة MotoDrive؟ لا يمكن التراجع عن هذا الإجراء.
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
                disabled={isDeletingAccount}
                className="py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-black cursor-pointer disabled:opacity-50"
              >
                {isDeletingAccount ? 'جاري الحذف...' : 'نعم، احذف حسابي'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Safety & App Guidelines */}
      <div className="bg-slate-900 border border-slate-800/90 rounded-3xl p-4 space-y-2 text-xs">
        <h4 className="font-bold text-slate-200 mb-2">تعليمات السلامة لركاب MotoDrive:</h4>
        <div className="space-y-1.5 text-slate-400 text-[11px] leading-relaxed">
          <p>• ارتداء الخوذة الواقية إلزامي طوال مسار الرحلة.</p>
          <p>• التمسك بالمقابض الجانبية أو خصر السائق لتوازن أفضل عند المنعطفات.</p>
          <p>• أقصى مسافة مسموحة للرحلة هي 70 كم كحد أقصى للحفاظ على سلامتك.</p>
          <p>• السعر المعتمد يبدأ من 110 د.ج وهو سعر رسمي ثابت حسب شريحة المسافة.</p>
        </div>
      </div>

      {/* Legal, Privacy & Compliance */}
      <div className="bg-slate-900 border border-slate-800/90 rounded-3xl p-4 space-y-2.5 text-xs">
        <div className="flex items-center justify-between">
          <div className="font-bold text-white flex items-center gap-1.5">
            <span>⚖️</span>
            <span>الامتثال القانوني والخصوصية</span>
          </div>
          <span className="text-[10px] text-amber-400 font-mono">v1.2.0 Production</span>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={() =>
              window.dispatchEvent(
                new CustomEvent('open-legal', {
                  detail: { tab: 'terms' },
                }),
              )
            }
            className="p-2.5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 rounded-xl text-amber-300 font-bold text-center transition-colors cursor-pointer"
          >
            شروط الاستخدام 📄
          </button>

          <button
            type="button"
            onClick={() =>
              window.dispatchEvent(
                new CustomEvent('open-legal', {
                  detail: { tab: 'privacy' },
                }),
              )
            }
            className="p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-300 hover:text-white font-semibold text-center transition-colors cursor-pointer"
          >
            سياسة الخصوصية
          </button>
        </div>
      </div>

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

