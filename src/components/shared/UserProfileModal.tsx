import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { syncUserProfile } from '../../services/firestoreService';
import { X, User, Phone, Check, Loader2, ShieldCheck, Sparkles } from 'lucide-react';
import { GoogleSignInButton } from '../auth/GoogleSignInButton';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose }) => {
  const { activePassenger, setActivePassenger, currentUser } = useApp();

  const [name, setName] = useState(activePassenger.name || '');
  const [phone, setPhone] = useState(activePassenger.phone || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const isGoogleConnected = Boolean(currentUser && (currentUser.email || currentUser.photoURL));

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
    };

    try {
      await syncUserProfile(updatedUser);
      setActivePassenger(updatedUser);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in" id="user-profile-modal">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-5 text-right text-slate-100 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="text-center">
            <h3 className="text-base font-black text-white flex items-center gap-1.5 justify-center">
              <span>ملف المستخدم والزبون</span>
              <User className="w-4 h-4 text-amber-400" />
            </h3>
            <p className="text-[11px] text-slate-400">بياناتك الحقيقية للتواصل مع السائقين</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-sm">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-300">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 font-bold text-center">
            ✓ تم حفظ وتحديث بياناتك بنجاح!
          </div>
        )}

        {!isGoogleConnected && (
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>ربط الحساب بحساب Google</span>
            </div>
            <p className="text-[11px] text-slate-400">
              سجّل دخولك بحساب Google لتعبئة اسمك وصورتك تلقائياً وحفظ مشاويرك بأمان.
            </p>
            <GoogleSignInButton
              role="passenger"
              onSuccess={() => {
                setName(activePassenger.name);
                onClose();
              }}
              label="تسجيل الدخول باستخدام Google"
              id="user-modal-google-signin-btn"
            />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">الاسم الكامل:</label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="مثال: يوسف العربي"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">رقم الهاتف الحقيقي (للاتصال):</label>
            <input
              type="tel"
              required
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="مثال: 0770123456 أو 0550123456"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500 text-left font-mono"
              dir="ltr"
            />
          </div>

          <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-[11px] text-slate-400">
            💡 سيظهر اسمك ورقم هاتفك فقط للسائق عند قبول الرحلة للتمكن من الاتصال بك وتنسيق مكان اللقاء.
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-2xl text-xs shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
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
        </form>
      </div>
    </div>
  );
};
