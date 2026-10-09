import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { syncUserProfile } from '../../services/firestoreService';
import { db } from '../../services/firebase';
import { compressImageToBase64 } from '../../utils/imageCompressor';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import {
  X,
  User,
  Phone,
  Check,
  Loader2,
  ShieldCheck,
  Sparkles,
  LogOut,
  Camera,
  UploadCloud,
  FileText,
  AlertCircle,
  Eye,
  CheckCircle2,
} from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose }) => {
  const { activePassenger, setActivePassenger, currentUser, setCurrentUser, logout } = useApp();

  const isOwnerAccount =
    activePassenger.role === 'admin' ||
    activePassenger.email?.toLowerCase() === 'seyfhad@gmail.com' ||
    currentUser?.email?.toLowerCase() === 'seyfhad@gmail.com';

  const resolvedInitialPhone =
    isOwnerAccount && (!activePassenger.phone || activePassenger.phone === '0550000000' || activePassenger.phone === '0550123456')
      ? '0662688714'
      : activePassenger.phone || '';

  const [name, setName] = useState(activePassenger.name || '');
  const [phone, setPhone] = useState(resolvedInitialPhone);
  const [photoUrl, setPhotoUrl] = useState(activePassenger.photoUrl || currentUser?.photoURL || '');
  const [idDocUrl, setIdDocUrl] = useState<string | undefined>(
    (activePassenger as any).idDocumentUrl || undefined
  );

  useEffect(() => {
    if (isOpen) {
      setName(activePassenger.name || '');
      const cleanOwnerPhone =
        isOwnerAccount && (!activePassenger.phone || activePassenger.phone === '0550000000' || activePassenger.phone === '0550123456')
          ? '0662688714'
          : activePassenger.phone || '';
      setPhone(cleanOwnerPhone);
      setPhotoUrl(activePassenger.photoUrl || currentUser?.photoURL || '');
      setIdDocUrl((activePassenger as any).idDocumentUrl || undefined);
    }
  }, [isOpen, activePassenger, isOwnerAccount, currentUser]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [warningMsg, setWarningMsg] = useState<string | null>(null);
  const [previewZoomUrl, setPreviewZoomUrl] = useState<string | null>(null);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const userId = currentUser?.uid || activePassenger.id;

  // Validate image quality and dimensions
  const validateImage = (file: File): Promise<{ valid: boolean; warning?: string }> => {
    return new Promise((resolve) => {
      // Size check
      if (file.size > 12 * 1024 * 1024) {
        return resolve({ valid: false, warning: 'حجم الصورة كبير جداً (أكبر من 12 ميغابايت).' });
      }
      if (file.size < 15 * 1024) {
        return resolve({
          valid: true,
          warning: '⚠️ تنبيه: حجم الصورة صغير جداً (أقل من 15KB) وقد تكون غير واضحة المعالم.',
        });
      }

      // Format check
      if (!file.type.match(/^image\/(jpeg|png|webp|jpg)/i)) {
        return resolve({
          valid: false,
          warning: 'صيغة الملف غير مدعومة. يرجى اختيار صورة بصيغة JPG أو PNG أو WebP.',
        });
      }

      // Resolution check
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          if (img.width < 200 || img.height < 200) {
            resolve({
              valid: true,
              warning: '⚠️ تنبيه: أبعاد الصورة صغيرة (أقل من 200×200 بكسل) وقد تظهر مشوشة.',
            });
          } else {
            resolve({ valid: true });
          }
        };
        img.onerror = () => resolve({ valid: true });
        img.src = e.target?.result as string;
      };
      reader.onerror = () => resolve({ valid: true });
      reader.readAsDataURL(file);
    });
  };

  // Upload user avatar photo
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    setWarningMsg(null);

    const validation = await validateImage(file);
    if (!validation.valid) {
      setErrorMsg(validation.warning || 'الملف المختار غير صالح.');
      return;
    }
    if (validation.warning) {
      setWarningMsg(validation.warning);
    }

    try {
      setIsUploadingPhoto(true);
      const downloadUrl = await compressImageToBase64(file, 30, 400);

      setPhotoUrl(downloadUrl);

      // Save immediately to Firestore
      const userDocRef = doc(db, 'users', userId);
      await setDoc(userDocRef, { photoUrl: downloadUrl, updatedAt: serverTimestamp() }, { merge: true });

      // Update local state
      setActivePassenger({ ...activePassenger, photoUrl: downloadUrl });
      if (currentUser) {
        updateProfile(currentUser, { photoURL: downloadUrl }).catch(() => {});
        setCurrentUser({ ...currentUser, photoURL: downloadUrl } as any);
      }
    } catch (err: any) {
      console.error('Error uploading avatar:', err);
      setErrorMsg('تعذر حفظ الصورة الشخصية: ' + (err?.message || ''));
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // Upload user document / file (ID card, student card, etc.)
  const handleDocChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    setWarningMsg(null);

    const validation = await validateImage(file);
    if (!validation.valid) {
      setErrorMsg(validation.warning || 'الملف المختار غير صالح.');
      return;
    }
    if (validation.warning) {
      setWarningMsg(validation.warning);
    }

    try {
      setIsUploadingDoc(true);
      const downloadUrl = await compressImageToBase64(file, 40, 640);

      setIdDocUrl(downloadUrl);

      // Save to Firestore
      const userDocRef = doc(db, 'users', userId);
      await setDoc(
        userDocRef,
        {
          idDocumentUrl: downloadUrl,
          'documents.idCardUrl': downloadUrl,
          'documents.updatedAt': new Date().toISOString(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setActivePassenger({
        ...activePassenger,
        idDocumentUrl: downloadUrl,
      } as any);
    } catch (err: any) {
      console.error('Error uploading user document:', err);
      setErrorMsg('تعذر رفع الوثيقة: ' + (err?.message || ''));
    } finally {
      setIsUploadingDoc(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      setErrorMsg('يرجى كتابة الاسم ورقم الهاتف.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const updatedUser = {
      ...activePassenger,
      name: name.trim(),
      phone: phone.trim(),
      photoUrl: photoUrl || activePassenger.photoUrl,
      idDocumentUrl: idDocUrl,
    };

    try {
      await syncUserProfile(updatedUser);
      setActivePassenger(updatedUser);
      try {
        localStorage.setItem(
          'motodrive_user_session',
          JSON.stringify({ user: updatedUser, timestamp: Date.now() })
        );
        localStorage.setItem('motodrive_remembered_phone', phone.trim());
      } catch (e) {}
      setIsSubmitting(false);
      setSuccessMsg(true);
      setTimeout(() => {
        setSuccessMsg(false);
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error('Error updating user profile:', err);
      setErrorMsg(err.message || 'تعذر تحديث البيانات.');
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in"
      id="user-profile-modal"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-5 text-right text-slate-100 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="text-center">
            <h3 className="text-base font-black text-white flex items-center gap-1.5 justify-center">
              <span>ملف وبيانات الحساب</span>
              <User className="w-4 h-4 text-amber-400" />
            </h3>
            <p className="text-[11px] text-slate-400">حفظ صورك وملفاتك في حسابك السحابي</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-sm">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {warningMsg && (
          <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-[11px] text-amber-300 flex items-start gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
            <span>{warningMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 font-bold text-center">
            ✓ تم حفظ وتحديث بياناتك بنجاح!
          </div>
        )}

        {/* Avatar Photo Section with Upload */}
        <div className="text-center space-y-2">
          <div className="relative w-20 h-20 mx-auto">
            <img
              src={
                photoUrl ||
                currentUser?.photoURL ||
                'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'
              }
              alt={name}
              className="w-full h-full rounded-full object-cover border-3 border-amber-500 shadow-xl"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150';
              }}
            />
            {isUploadingPhoto ? (
              <div className="absolute inset-0 bg-slate-950/70 rounded-full flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-amber-500 text-slate-950 hover:bg-amber-400 border-2 border-slate-900 flex items-center justify-center transition-all shadow-md cursor-pointer"
                title="تغيير أو رفع الصورة الشخصية"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleAvatarChange}
          />
          <button
            type="button"
            onClick={() => avatarInputRef.current?.click()}
            className="text-[11px] text-amber-400 hover:text-amber-300 font-bold cursor-pointer"
          >
            {isUploadingPhoto ? 'جاري رفع الصورة إلى Firebase Storage...' : 'تغيير الصورة الشخصية (Camera / Gallery)'}
          </button>
        </div>

        {/* Account Status Badge */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="text-right">
              <span className="text-[10px] text-emerald-400 font-bold block">حساب مفعل برقم الهاتف</span>
              <span className="text-slate-300 font-mono text-[11px]" dir="ltr">
                {phone || (isOwnerAccount ? '0662688714' : activePassenger.phone) || '0662688714'}
              </span>
            </div>
          </div>
          <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20 font-bold">
            {activePassenger.role === 'admin' ? 'الإدارة' : activePassenger.role === 'driver' ? 'سائق' : 'راكب'}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">الاسم الكامل:</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: يوسف العربي"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">رقم الهاتف (للاتصال):</label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="مثال: 0770123456 أو 0550123456"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500 text-left font-mono"
              dir="ltr"
            />
          </div>

          {/* User Verification Document Attachment */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                <span>وثيقة إثبات الهوية أو ملف الحساب</span>
              </div>
              <span className="text-[10px] text-slate-500">اختياري</span>
            </div>

            {idDocUrl ? (
              <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-2 rounded-xl text-xs">
                <div className="flex items-center gap-2 truncate">
                  <div
                    onClick={() => setPreviewZoomUrl(idDocUrl)}
                    className="w-10 h-10 rounded-lg overflow-hidden border border-slate-700 cursor-pointer shrink-0"
                  >
                    <img src={idDocUrl} alt="وثيقة" className="w-full h-full object-cover" />
                  </div>
                  <div className="truncate">
                    <span className="font-bold text-emerald-400 block text-[11px]">✓ تم حفظ الوثيقة</span>
                    <span className="text-[10px] text-slate-400">محفوظة في Firebase Storage</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setPreviewZoomUrl(idDocUrl)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                    title="معاينة"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => docInputRef.current?.click()}
                    className="px-2 py-1 rounded-lg bg-amber-500/20 text-amber-400 text-[10px] font-bold"
                  >
                    تغيير
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => docInputRef.current?.click()}
                disabled={isUploadingDoc}
                className="w-full py-2 px-3 border border-dashed border-slate-700 hover:border-amber-500/60 rounded-xl text-xs text-slate-400 hover:text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                {isUploadingDoc ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                    <span>جاري رفع الملف...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4 text-amber-400" />
                    <span>إرفاق صورة بطاقة الهوية / رخصة / ملف</span>
                  </>
                )}
              </button>
            )}
            <input
              ref={docInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleDocChange}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-2xl text-xs shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                <span>جاري الحفظ في Firestore...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>حفظ التعديلات في الحساب</span>
              </>
            )}
          </button>

          {currentUser && (
            <button
              type="button"
              onClick={async () => {
                await logout();
                onClose();
              }}
              className="w-full py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 font-bold rounded-2xl text-xs flex items-center justify-center gap-2 transition-colors mt-2 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>تسجيل الخروج من الحساب</span>
            </button>
          )}
        </form>
      </div>

      {/* Image Zoom Modal */}
      {previewZoomUrl && (
        <div
          className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setPreviewZoomUrl(null)}
        >
          <div className="relative max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setPreviewZoomUrl(null)}
              className="absolute -top-10 left-0 text-white bg-slate-800 p-2 rounded-full hover:bg-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={previewZoomUrl}
              alt="معاينة الملف"
              className="w-full max-h-[80vh] object-contain rounded-2xl border border-slate-700"
            />
          </div>
        </div>
      )}
    </div>
  );
};
