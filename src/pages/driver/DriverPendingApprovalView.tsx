import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { auth } from '../../lib/firebase';
import { resendFirebaseEmailVerification, reloadAndCheckEmailVerification } from '../../services/authService';
import {
  Clock,
  AlertCircle,
  CheckCircle2,
  FileText,
  Shield,
  RefreshCw,
  Edit3,
  Camera,
  Eye,
  X,
  PhoneCall,
  Mail,
  Send,
  Loader2,
} from 'lucide-react';
import { MotoIcon } from '../../components/shared/MotoIcon';
import { RegisterDriverModal } from '../../components/shared/RegisterDriverModal';

export const DriverPendingApprovalView: React.FC = () => {
  const { activeDriver, currentUser, logout } = useApp();
  const [showEditModal, setShowEditModal] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<{ url: string; title: string } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Email verification states - strictly require verified email for email accounts
  const [isEmailVerified, setIsEmailVerified] = useState<boolean>(() => {
    const u = auth.currentUser;
    if (u && u.email) {
      return u.emailVerified;
    }
    // If logged in via email in Context, default to false until auth reloads and confirms verification
    if (currentUser?.email || activeDriver.email) {
      return false;
    }
    return false;
  });
  const [isSendingResend, setIsSendingResend] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [emailNotice, setEmailNotice] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Reload firebase auth on mount to get latest emailVerified flag from server
  useEffect(() => {
    let isMounted = true;
    const checkEmailOnLoad = async () => {
      if (auth.currentUser) {
        try {
          await auth.currentUser.reload();
          if (isMounted) {
            setIsEmailVerified(auth.currentUser.emailVerified);
          }
        } catch (err) {
          console.warn('Notice reloading auth user state:', err);
        }
      }
    };
    checkEmailOnLoad();
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
        text: err?.message || 'تعذر إرسال رابط التحقق. يرجى محاولة تسجيل الدخول مرة أخرى.',
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
          text: '🎉 تم تأكيد بريدك الإلكتروني بنجاح! يمكنك الآن الانطلاق وإكمال رفع وثائق السائق.',
        });
      } else {
        setEmailNotice({
          type: 'error',
          text: 'لم يتم تأكيد البريد بعد. يرجى الضغط على الرابط المرسل إلى بريدك أولاً، ثم الضغط هنا مجدداً.',
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

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  const isRejected = activeDriver.status === 'rejected';
  const isSuspended = activeDriver.status === 'suspended';

  const docList = [
    {
      title: 'صورة شخصية (سيلفي واضحة)',
      url: activeDriver.documents?.selfieUrl || activeDriver.photoUrl,
      icon: '👤',
    },
    {
      title: 'رخصة السياقة (الوجه الأمامي)',
      url: activeDriver.documents?.licenseFrontUrl || activeDriver.documents?.licenseUrl,
      icon: '📜',
    },
    {
      title: 'رخصة السياقة (الوجه الخلفي)',
      url: activeDriver.documents?.licenseBackUrl,
      icon: '📜',
    },
    {
      title: 'وثيقة الدراجة (البطاقة الرمادية - أمامي)',
      url: activeDriver.documents?.vehicleDocFrontUrl || activeDriver.documents?.vehicleRegistrationUrl,
      icon: '📄',
    },
    {
      title: 'وثيقة الدراجة (البطاقة الرمادية - خلفي)',
      url: activeDriver.documents?.vehicleDocBackUrl,
      icon: '📄',
    },
    {
      title: 'صورة الدراجة النارية (من الأمام)',
      url: activeDriver.documents?.motorcycleFrontUrl || activeDriver.documents?.motorcyclePhotosUrls?.[0],
      icon: '🏍️',
    },
    {
      title: 'صورة الدراجة النارية (من الخلف)',
      url: activeDriver.documents?.motorcycleBackUrl || activeDriver.documents?.motorcyclePhotosUrls?.[1],
      icon: '🛵',
    },
  ];

  const hasSubmittedAllDocs = docList.filter(d => Boolean(d.url)).length >= 7;

  // Auto-open edit modal ONLY if email is verified, documents are incomplete, not rejected, and not auto-opened yet
  const [hasAutoOpened, setHasAutoOpened] = useState(false);
  useEffect(() => {
    if (isEmailVerified && !hasSubmittedAllDocs && !isRejected && !showEditModal && !hasAutoOpened) {
      setShowEditModal(true);
      setHasAutoOpened(true);
    }
  }, [isEmailVerified, hasSubmittedAllDocs, isRejected, showEditModal, hasAutoOpened]);

  const currentUserEmail = auth.currentUser?.email || activeDriver.email || currentUser?.email || '';
  const isEmailAuthUser = Boolean(currentUserEmail && currentUserEmail.includes('@'));

  return (
    <div className="max-w-md mx-auto px-4 py-6 text-right text-slate-100 space-y-5 pb-24" id="driver-pending-approval-view" dir="rtl">
      {/* 1. EMAIL VERIFICATION REQUIRED GATE */}
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
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl font-mono text-amber-400 text-xs font-bold text-center dir-ltr select-all">
              {currentUserEmail}
            </div>
          </div>

          <div className="space-y-2 text-xs text-slate-400 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80">
            <div className="font-bold text-slate-200">التعليمات:</div>
            <ul className="list-disc list-inside space-y-1 text-[11px] leading-relaxed">
              <li>افتح تطبيق البريد الإلكتروني الخاط بـ <strong className="text-white">{currentUserEmail}</strong>.</li>
              <li>تفقد صندوق الوارد (Inbox) أو رسائل غير المرغوب فيها (Spam).</li>
              <li>اضغط على رابط التأكيد المرفق بداخل الرسالة.</li>
              <li>عد إلى هذه الواجهة واضغط على زر <strong className="text-amber-400">"تحديث وتأكيد حالة البريد"</strong> بالأسفل.</li>
            </ul>
          </div>

          {emailNotice && (
            <div
              className={`p-3 rounded-2xl text-xs font-bold text-center border ${
                emailNotice.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : emailNotice.type === 'error'
                  ? 'bg-red-500/10 border-red-500/30 text-red-400'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              }`}
            >
              {emailNotice.text}
            </div>
          )}

          <div className="space-y-2.5 pt-2">
            <button
              type="button"
              onClick={handleCheckEmailStatus}
              disabled={isCheckingEmail}
              className="w-full py-3.5 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 active:scale-[0.99] text-slate-950 font-black text-xs flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer disabled:opacity-50"
            >
              {isCheckingEmail ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جاري التحقق من السيرفر...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>تحديث وتأكيد حالة البريد الإلكتروني</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleResendEmail}
              disabled={isSendingResend}
              className="w-full py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 active:scale-[0.99] text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer border border-slate-700 disabled:opacity-50"
            >
              {isSendingResend ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جاري الإرسال...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 text-amber-400" />
                  <span>إعادة إرسال رابط التحقق (Email SMS)</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={logout}
              className="w-full py-2.5 text-center text-xs font-semibold text-slate-500 hover:text-slate-300 transition-all cursor-pointer"
            >
              تسجيل الخروج أو تجربة بريد إلكتروني آخر
            </button>
          </div>
        </div>
      ) : !hasSubmittedAllDocs && !isRejected ? (
        /* 2. DOC UPLOAD PROMPT CARD (Unlocked only after email verification) */
        <div className="rounded-3xl p-5 border border-amber-500/30 bg-slate-900 shadow-2xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-2xl shrink-0">
              <Camera className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h2 className="text-base font-black text-white">إكمال ملف السائق والوثائق المطلوبة</h2>
              <span className="text-[11px] font-bold text-amber-400">نظام التسجيل • MotoDrive</span>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            مرحباً بك يا <strong className="text-white">{activeDriver.name || 'سائقنا الجديد'}</strong>. يرجى البدء بملء بيانات الدراجة النارية وإرفاق الوثائق الـ 7 المطلوبة لإرسال ملفك إلى مالك التطبيق لمراجعته وقبوله.
          </p>

          <button
            type="button"
            onClick={() => setShowEditModal(true)}
            className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-[0.99] text-slate-950 font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg"
          >
            <Camera className="w-4 h-4" />
            <span>فتح صفحة رفع الوثائق المطلوبة الآن</span>
          </button>
        </div>
      ) : (
        /* Top Banner / Status Card after submission */
        <div
          className={`rounded-3xl p-5 border shadow-2xl relative overflow-hidden space-y-3.5 ${
            isRejected
              ? 'bg-red-500/10 border-red-500/30 text-red-200'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 ${
                isRejected ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400 animate-pulse'
              }`}
            >
              {isRejected ? <AlertCircle className="w-6 h-6 text-red-400" /> : <Clock className="w-6 h-6 text-amber-400" />}
            </div>
            <div>
              <h2 className="text-base font-black text-white">
                {isRejected
                  ? 'تم رفض طلب التسجيل'
                  : isSuspended
                  ? 'تم إيقاف الحساب مؤقتاً'
                  : 'طلبك قيد المراجعة من طرف المالك'}
              </h2>
            </div>
          </div>

          {/* Rejection Details */}
          {isRejected ? (
            <div className="p-3.5 bg-red-950/70 border border-red-500/40 rounded-2xl space-y-1.5 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-red-300">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>سبب الرفض المسجل من طرف الإدارة:</span>
              </div>
              <p className="text-white font-medium pr-5 leading-relaxed">
                {activeDriver.rejectionReason || 'الوثائق المرفقة غير واضحة أو لا تطابق الشروط المطلوبة.'}
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(true)}
                  className="w-full py-2.5 px-4 rounded-xl bg-red-500 hover:bg-red-400 active:scale-[0.99] text-slate-950 font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>تحديث وإعادة إرسال الوثائق المطلوبة</span>
                </button>
              </div>
            </div>
          ) : (
            /* Clean Pending Details after 7 documents submission */
            <div className="space-y-2 text-xs leading-relaxed text-slate-300">
              <p>
                شكراً لتسجيلك في MotoDrive يا <strong className="text-white">{activeDriver.name || 'سائقنا الجديد'}</strong>. نرجو منك إكمال بيانات الدراجة النارية ورخصة السياقة.
              </p>
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px]">
            <span className="text-slate-400">تاريخ الإرسال: {new Date(activeDriver.documents?.submittedAt || activeDriver.createdAt).toLocaleDateString('ar-DZ')}</span>
            <button
              type="button"
              onClick={handleRefresh}
              className="flex items-center gap-1 text-amber-400 hover:text-amber-300 font-bold"
            >
              <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>تحديث الحالة</span>
            </button>
          </div>
        </div>
      )}

      {/* Uploaded Documents List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black text-white flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-amber-400" />
            <span>الوثائق المرسلة للتدقيق (7 صور مطلوبة)</span>
          </h3>
          <span className="text-[10px] text-slate-400 font-bold">
            {docList.filter(d => Boolean(d.url)).length} / 7 مكتملة
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {docList.map((doc, idx) => (
            <div
              key={idx}
              className="p-3 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between gap-2 text-xs"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-base shrink-0">{doc.icon}</span>
                <div className="truncate">
                  <div className="font-bold text-slate-200 text-[11px] truncate">{doc.title}</div>
                  <div className="text-[9px] text-slate-400 flex items-center gap-1 mt-0.5">
                    {doc.url ? (
                      <span className="text-emerald-400 flex items-center gap-0.5">
                        <CheckCircle2 className="w-2.5 h-2.5" /> تم الإرسال
                      </span>
                    ) : (
                      <span className="text-red-400">مفقودة</span>
                    )}
                  </div>
                </div>
              </div>

              {doc.url && (
                <button
                  type="button"
                  onClick={() => setZoomedImage({ url: doc.url!, title: doc.title })}
                  className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center shrink-0 transition-colors"
                  title="معاينة الصورة"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Driver & Motorcycle Details Card */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2 text-xs">
        <h4 className="font-bold text-white flex items-center gap-1.5">
          <MotoIcon className="w-4 h-4 text-amber-400" />
          <span>بيانات الدراجة النارية المسجلة:</span>
        </h4>
        <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
          <div><span className="text-slate-500">العلامة:</span> {activeDriver.motorcycle.brand}</div>
          <div><span className="text-slate-500">الموديل:</span> {activeDriver.motorcycle.model}</div>
          <div><span className="text-slate-500">سنة الصنع:</span> {activeDriver.motorcycle.year}</div>
          <div><span className="text-slate-500">رقم اللوحة:</span> <span className="font-mono text-amber-300">{activeDriver.motorcycle.plateNumber}</span></div>
          <div><span className="text-slate-500">الولاية:</span> {activeDriver.wilaya}</div>
          <div><span className="text-slate-500">البلدية:</span> {activeDriver.municipality}</div>
        </div>
      </div>

      {/* Action to Edit Documents */}
      <button
        type="button"
        onClick={() => setShowEditModal(true)}
        className="w-full py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
      >
        <Edit3 className="w-3.5 h-3.5 text-amber-400" />
        <span>تعديل بيانات الدراجة أو إعادة رفع الصور</span>
      </button>

      {/* Image Preview Modal */}
      {zoomedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in"
          onClick={() => setZoomedImage(null)}
        >
          <div
            className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-4 space-y-3 text-right"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setZoomedImage(null)}
                className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              <h5 className="text-xs font-bold text-white">{zoomedImage.title}</h5>
            </div>
            <div className="rounded-2xl overflow-hidden border border-slate-800 max-h-80 bg-slate-950 flex items-center justify-center">
              <img
                src={zoomedImage.url}
                alt={zoomedImage.title}
                className="w-full h-auto object-contain max-h-80"
              />
            </div>
          </div>
        </div>
      )}

      {/* Re-register / Edit Modal */}
      <RegisterDriverModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
      />
    </div>
  );
};
