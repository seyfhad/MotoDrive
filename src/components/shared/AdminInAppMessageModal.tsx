import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { UserRole } from '../../types';
import { Send, Bell, X, CheckCircle2, AlertCircle, Users, User, ShieldCheck } from 'lucide-react';

interface AdminInAppMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminInAppMessageModal: React.FC<AdminInAppMessageModalProps> = ({ isOpen, onClose }) => {
  const { drivers, broadcastNotification, sendInAppNotification, currentUser } = useApp();

  const [targetType, setTargetType] = useState<'all' | 'specific'>('specific');
  const [targetRole, setTargetRole] = useState<UserRole>('driver');
  const [selectedRecipientId, setSelectedRecipientId] = useState<string>('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      setErrorMsg('يرجى كتابة عنوان الرسالة ونص الإشعار.');
      return;
    }

    setIsSending(true);
    setErrorMsg(null);

    try {
      if (targetType === 'all') {
        broadcastNotification(title.trim(), body.trim(), targetRole);
      } else {
        const recipient = selectedRecipientId || (targetRole === 'driver' && drivers[0] ? drivers[0].id : 'passenger_guest');
        if (sendInAppNotification) {
          sendInAppNotification(recipient, targetRole, title.trim(), body.trim());
        } else {
          broadcastNotification(title.trim(), body.trim(), targetRole);
        }
      }

      setSuccessMsg('تم إرسال الإشعار بنجاح إلى حساب المستخدم داخل التطبيق!');
      setTitle('');
      setBody('');
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 2000);
    } catch (err: any) {
      setErrorMsg(err.message || 'حدث خطأ أثناء إرسال الرسالة.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in"
      id="admin-inapp-message-modal"
      dir="rtl"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-5 sm:p-6 text-right text-slate-100 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-1.5 justify-end">
                <span>إرسال إشعار لحساب مستخدم (داخل التطبيق)</span>
                <Bell className="w-4 h-4 text-amber-400" />
              </h3>
              <p className="text-[11px] text-amber-400 font-medium">لوحة تحكم المالك • تصل الرسالة مباشرة إلى جرس التنبيهات في حساب المستخدم</p>
            </div>
            <div className="w-9 h-9 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center text-sm font-bold">
              👑
            </div>
          </div>
        </div>

        {successMsg ? (
          <div className="p-6 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-center space-y-2">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
            <h4 className="text-sm font-bold text-white">تم الإرسال بنجاح!</h4>
            <p className="text-xs text-emerald-300">{successMsg}</p>
          </div>
        ) : (
          <form onSubmit={handleSend} className="space-y-4 text-xs">
            {errorMsg && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Target Audience Switch */}
            <div className="space-y-1.5">
              <label className="text-slate-400 text-[11px] font-bold block">نوع المستلم:</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTargetType('specific')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    targetType === 'specific'
                      ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>مستخدم / سائق محدد</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTargetType('all')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    targetType === 'all'
                      ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>بث لجميع المستخدمين</span>
                </button>
              </div>
            </div>

            {/* Role Selection */}
            <div className="space-y-1.5">
              <label className="text-slate-400 text-[11px] font-bold block">فئة الحساب:</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTargetRole('driver')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                    targetRole === 'driver'
                      ? 'bg-slate-800 text-amber-400 border-amber-500/50'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  سائقو الدراجات النارية 🛵
                </button>
                <button
                  type="button"
                  onClick={() => setTargetRole('passenger')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                    targetRole === 'passenger'
                      ? 'bg-slate-800 text-amber-400 border-amber-500/50'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  الركاب 🚶‍♂️
                </button>
              </div>
            </div>

            {/* If Specific -> Driver/User Dropdown */}
            {targetType === 'specific' && targetRole === 'driver' && (
              <div className="space-y-1.5">
                <label className="text-slate-400 text-[11px] font-bold block">اختر السائق المستلم:</label>
                <select
                  value={selectedRecipientId}
                  onChange={e => setSelectedRecipientId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="">-- اختر سائقاً من القائمة --</option>
                  {drivers.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.motorcycle.brand} {d.motorcycle.model} - {d.wilaya})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Notification Title */}
            <div className="space-y-1.5">
              <label className="text-slate-400 text-[11px] font-bold block">عنوان الإشعار:</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="مثال: تنبيه إداري بشأن وثائق الحساب"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Quick Templates */}
            <div className="space-y-1">
              <span className="text-[10px] text-slate-500 block">قوالب سريعة:</span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setTitle('🎉 تم قبول حسابك كسائق معتمد');
                    setBody('تهانينا! تمت مراجعة وثائقك ورخصة القيادة بنجاح. يمكنك الآن تفعيل وضع Online واستقبال الرحلات.');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] text-amber-300 transition-colors"
                >
                  قبول حساب سائق
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTitle('⚠️ تنبيه هام بخصوص وثائق الحساب');
                    setBody('يرجى تحديث صورة رخصة السياقة أو البطاقة الرمادية لأن الصورة غير واضحة.');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 transition-colors"
                >
                  طلب وثائق أوضح
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTitle('🎁 عرض ترويجي ورصيد إضافي');
                    setBody('تمت إضافة خصم ترويجي على رحلاتك القادمة في MotoDrive!');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 transition-colors"
                >
                  عرض ترويجي
                </button>
              </div>
            </div>

            {/* Notification Body */}
            <div className="space-y-1.5">
              <label className="text-slate-400 text-[11px] font-bold block">نص الرسالة:</label>
              <textarea
                rows={4}
                value={body}
                onChange={e => setBody(e.target.value)}
                placeholder="اكتب الرسالة التي ستصل للمستخدم في جرس التنبيهات داخل التطبيق..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500 resize-none leading-relaxed"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSending}
              className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 active:scale-[0.99] text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSending ? 'جاري إرسال الإشعار...' : 'إرسال الإشعار للحساب في التطبيق'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
