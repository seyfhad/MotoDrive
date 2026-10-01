import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { auth, db } from '../../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { resendFirebaseEmailVerification, reloadAndCheckEmailVerification } from '../../services/authService';
import {
  Clock,
  AlertCircle,
  CheckCircle2,
  FileText,
  Shield,
  RefreshCw,
  Eye,
  X,
  PhoneCall,
  Mail,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { MotoIcon } from '../../components/shared/MotoIcon';

interface DriverPendingApprovalViewProps {
  onReapply?: () => void;
}

export const DriverPendingApprovalView: React.FC<DriverPendingApprovalViewProps> = ({ onReapply }) => {
  const { activeDriver, setActiveDriver, currentUser, logout } = useApp();
  const [zoomedImage, setZoomedImage] = useState<{ url: string; title: string } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Email verification check for email accounts
  const [isEmailVerified, setIsEmailVerified] = useState<boolean>(() => {
    const u = auth.currentUser;
    if (u && u.email) {
      return u.emailVerified;
    }
    return true; // Phone or guest accounts don't require email verification
  });
  const [isSendingResend, setIsSendingResend] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [emailNotice, setEmailNotice] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // REAL-TIME FIRESTORE LISTENER (onSnapshot) FOR INSTANT APPROVAL UNLOCK
  // Automatically unlock/activate full driver dashboard when Admin approves
  useEffect(() => {
    const driverId = activeDriver?.id;
    if (!driverId) return;

    const driverRef = doc(db, 'drivers', driverId);

    // Live onSnapshot listener with clean unsubscribe
    const unsubscribe = onSnapshot(
      driverRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const updatedData = docSnap.data();
          if (updatedData.status === 'approved') {
            setActiveDriver((prev) => ({
              ...prev,
              ...updatedData,
              status: 'approved',
            }));
          } else if (updatedData.status !== activeDriver.status) {
            setActiveDriver((prev) => ({
              ...prev,
              ...updatedData,
            }));
          }
        }
      },
      (error) => {
        console.warn('Real-time driver status onSnapshot notice:', error.message);
      }
    );

    // Clean memory management: always unsubscribe on unmount
    return () => {
      unsubscribe();
    };
  }, [activeDriver?.id, activeDriver?.status, setActiveDriver]);

  // Reload emailVerified flag from Firebase Auth on mount
  useEffect(() => {
    let isMounted = true;
    if (auth.currentUser && auth.currentUser.email) {
      auth.currentUser.reload().then(() => {
        if (isMounted && auth.currentUser) {
          setIsEmailVerified(auth.currentUser.emailVerified);
        }
      }).catch(() => {});
    }
    return () => {
      isMounted = false;
    };
  }, []);

  const handleResendEmail = async () => {
    setIsSendingResend(true);
    setEmailNotice(null);
    try {
      await resendFirebaseEmailVerification();
      setEmailNotice({
        type: 'success',
        text: 'تم إرسال رابط تأكيد جديد إلى بريدك الإلكتروني بنجاح! تفقد بريدك واضغط على الرابط.',
      });
    } catch (err: any) {
      setEmailNotice({
        type: 'error',
        text: err?.message || 'تعذر إرسال رابط التحقق.',
      });
    } finally {
      setIsSendingResend(false);
    }
  };

  const handleCheckEmailStatus = async () => {
    setIsCheckingEmail(true);
    setEmailNotice(null);
    try {
      const verified = await reloadAndCheckEmailVerification();
      if (verified) {
        setIsEmailVerified(true);
        setEmailNotice({
          type: 'success',
          text: '🎉 تم تأكيد بريدك الإلكتروني بنجاح!',
        });
      } else {
        setEmailNotice({
          type: 'error',
          text: 'لم يتم تأكيد البريد بعد. اضغط على الرابط في الرسالة أولاً، ثم اضغط هنا مجدداً.',
        });
      }
    } catch (err: any) {
      setEmailNotice({
        type: 'error',
        text: 'حدث خطأ أثناء فحص حالة البريد: ' + (err?.message || err),
      });
    } finally {
      setIsCheckingEmail(false);
    }
  };

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  const isRejected = activeDriver.status === 'rejected';

  // EXACTLY FOUR (4) VERIFICATION DOCUMENTS
  const fourDocuments = [
    {
      title: '1. صورة شخصية (سيلفي)',
      url: activeDriver.documents?.selfieUrl || activeDriver.photoUrl,
      icon: '👤',
    },
    {
      title: '2. صورة الدراجة النارية',
      url: activeDriver.documents?.motorcyclePhotoUrl || activeDriver.documents?.motorcycleFrontUrl,
      icon: '🏍️',
    },
    {
      title: '3. رخصة السياقة (Permis)',
      url: activeDriver.documents?.licenseUrl || activeDriver.documents?.licenseFrontUrl,
      icon: '📜',
    },
    {
      title: '4. البطاقة الرمادية (Carte Grise)',
      url: activeDriver.documents?.vehicleRegistrationUrl || activeDriver.documents?.vehicleDocFrontUrl,
      icon: '📄',
    },
  ];

  const currentUserEmail = auth.currentUser?.email || activeDriver.email || currentUser?.email || '';
  const isEmailAuthUser = Boolean(currentUserEmail && currentUserEmail.includes('@'));

  return (
    <div
      className="max-w-md mx-auto px-4 py-6 text-right text-slate-100 space-y-5 pb-24"
      id="driver-pending-approval-view"
      dir="rtl"
    >
      {/* 1. EMAIL VERIFICATION REQUIRED GATE (IF REGISTERED WITH EMAIL) */}
      {isEmailAuthUser && !isEmailVerified ? (
        <div className="rounded-3xl p-6 border border-amber-500/40 bg-slate-900/95 shadow-2xl space-y-5 relative overflow-hidden">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-3xl shadow-lg border border-amber-500/30">
            <Mail className="w-7 h-7 text-amber-400" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <span>تأكيد البريد الإلكتروني مطلوب أولاً</span>
              <span className="text-[10px] font-extrabold bg-amber-500 text-slate-950 px-2 py-0.5 rounded-md">
                خطوة إجبارية
              </span>
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              لقد قمنا بإرسال رابط تأكيد الحساب إلى البريد الإلكتروني التالي:
            </p>
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl font-mono text-amber-400 text-xs font-bold text-center select-all" dir="ltr">
              {currentUserEmail}
            </div>
          </div>

          <div className="space-y-2 text-xs text-slate-400 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80">
            <div className="font-bold text-slate-200">التعليمات:</div>
            <ul className="list-disc list-inside space-y-1 text-[11px] leading-relaxed">
              <li>افتح صندوق الوارد في بريدك الإلكتروني.</li>
              <li>اضغط على رابط التأكيد المرفق بداخل الرسالة.</li>
              <li>اضغط على زر <strong className="text-amber-400">"تحديث وفحص حالة البريد"</strong> أدناه فور الانتهاء.</li>
            </ul>
          </div>

          {emailNotice && (
            <div
              className={`p-3 rounded-2xl text-xs font-bold text-center border ${
                emailNotice.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-red-500/10 border-red-500/30 text-red-400'
              }`}
            >
              {emailNotice.text}
            </div>
          )}

          <div className="space-y-2 pt-1">
            <button
              onClick={handleCheckEmailStatus}
              disabled={isCheckingEmail}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-2xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg"
            >
              {isCheckingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              <span>تحديث وفحص حالة البريد الآن</span>
            </button>

            <button
              onClick={handleResendEmail}
              disabled={isSendingResend}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-2xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer border border-slate-700"
            >
              {isSendingResend ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
              <span>إعادة إرسال رابط التأكيد</span>
            </button>
          </div>
        </div>
      ) : (
        /* 2. DEDICATED PENDING / REJECTED STATUS VIEW */
        <div className="space-y-4">
          {/* Main Status Hero Card */}
          <div
            className={`border rounded-3xl p-5 shadow-2xl space-y-4 relative overflow-hidden ${
              isRejected
                ? 'bg-red-500/10 border-red-500/40 text-red-300'
                : 'bg-amber-500/10 border-amber-500/40 text-amber-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-2xl shadow-inner">
                {isRejected ? '❌' : '⏳'}
              </div>
              <div>
                <div className="text-[11px] font-semibold opacity-80">
                  {isRejected ? 'حالة الحساب في النظام:' : 'حالة مراجعة الوثائق:'}
                </div>
                <div className="text-base font-black text-white">
                  {isRejected
                    ? 'تم رفض طلب التسجيل'
                    : 'طلب السائق قيد المراجعة والتدقيق من طرف الإدارة'}
                </div>
              </div>
            </div>

            {isRejected ? (
              <div className="p-3.5 bg-red-950/80 border border-red-500/40 rounded-2xl space-y-1.5 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-red-300">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>سبب الرفض من الإدارة:</span>
                </div>
                <p className="text-white font-medium pr-5 leading-relaxed">
                  {activeDriver.rejectionReason || 'الوثائق المرفقة غير واضحة أو لا تطابق الشروط المطلوبة.'}
                </p>
                {onReapply && (
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={onReapply}
                      className="w-full py-2.5 px-4 rounded-xl bg-red-500 hover:bg-red-400 active:scale-[0.99] text-slate-950 font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg"
                    >
                      <span>إعادة تقديم الطلب ورفع الوثائق مجدداً</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2 text-xs leading-relaxed text-slate-300">
                <p>
                  شكراً لتسجيلك يا <strong className="text-white">{activeDriver.name || 'سائقنا العزيز'}</strong>. تم إرسال ملفك والوثائق الـ 4 بنجاح إلى مسؤول المنصة.
                </p>
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-[11px]">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>تحديث لحظي نشط: سيتم فتح التطبيق تلقائياً بمجرد الموافقة دون الحاجة لتحديث الصفحة.</span>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px]">
              <span className="text-slate-400">
                تاريخ الطلب: {new Date(activeDriver.documents?.submittedAt || activeDriver.createdAt).toLocaleDateString('ar-DZ')}
              </span>
              <button
                type="button"
                onClick={handleManualRefresh}
                className="flex items-center gap-1 text-amber-400 hover:text-amber-300 font-bold cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>فحص الحالة</span>
              </button>
            </div>
          </div>

          {/* Verification Documents Status: EXACTLY 4 Cards */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-white flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-amber-400" />
                <span>الوثائق الـ 4 المرفوعة للمراجعة:</span>
              </h3>
              <span className="text-[10px] text-amber-300 font-mono bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                4 من 4
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {fourDocuments.map((doc, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between gap-2 text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-base shrink-0">{doc.icon}</span>
                    <div className="truncate">
                      <div className="font-bold text-slate-200 text-[11px] truncate">{doc.title}</div>
                      <div className="text-[9px] text-emerald-400 flex items-center gap-0.5 mt-0.5">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        <span>تم الرفع</span>
                      </div>
                    </div>
                  </div>

                  {doc.url && (
                    <button
                      type="button"
                      onClick={() => setZoomedImage({ url: doc.url!, title: doc.title })}
                      className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center shrink-0 transition-colors cursor-pointer"
                      title="معاينة الوثيقة"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Motorcycle Details Card */}
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2 text-xs">
            <h4 className="font-bold text-white flex items-center gap-1.5">
              <MotoIcon className="w-4 h-4 text-amber-400" />
              <span>معلومات الدراجة النارية المسجلة:</span>
            </h4>
            <div className="grid grid-cols-2 gap-2 text-slate-300 text-[11px]">
              <div>
                <span className="text-slate-500 block">العلامة والموديل:</span>
                <span className="font-bold text-white">{activeDriver.motorcycle?.brand} {activeDriver.motorcycle?.model}</span>
              </div>
              <div>
                <span className="text-slate-500 block">رقم اللوحة:</span>
                <span className="font-mono font-bold text-amber-400">{activeDriver.motorcycle?.plateNumber || 'غير مدخل'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">الولاية والبلدية:</span>
                <span className="font-medium text-white">{activeDriver.wilaya} • {activeDriver.municipality}</span>
              </div>
              <div>
                <span className="text-slate-500 block">سنة الصنع:</span>
                <span className="font-medium text-white">{activeDriver.motorcycle?.year || 2023}</span>
              </div>
            </div>
          </div>

          {/* Support / Help */}
          <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <PhoneCall className="w-4 h-4 text-emerald-400" />
              <span>هل لديك استفسار حول ملفك؟</span>
            </div>
            <a
              href="tel:0550000000"
              className="py-1 px-3 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-400 font-bold rounded-xl text-xs transition-colors"
            >
              اتصل بالإدارة
            </a>
          </div>

          <div className="text-center pt-2">
            <button
              onClick={logout}
              className="text-xs text-slate-500 hover:text-red-400 transition-colors font-medium cursor-pointer"
            >
              تسجيل الخروج من الحساب
            </button>
          </div>
        </div>
      )}

      {/* Image Preview & Zoom Modal */}
      {zoomedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in"
          onClick={() => setZoomedImage(null)}
        >
          <div
            className="relative max-w-lg w-full bg-slate-900 border border-slate-700 rounded-3xl p-4 shadow-2xl space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold text-amber-400">{zoomedImage.title}</span>
              <button
                onClick={() => setZoomedImage(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-auto flex items-center justify-center bg-black/60 rounded-2xl p-2">
              <img
                src={zoomedImage.url}
                alt={zoomedImage.title}
                className="max-h-[65vh] w-auto max-w-full object-contain rounded-xl shadow-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverPendingApprovalView;
