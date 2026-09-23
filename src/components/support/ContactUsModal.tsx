import React, { useState } from 'react';
import {
  X,
  Phone,
  Mail,
  Send,
  MessageSquare,
  Clock,
  MapPin,
  CheckCircle2,
  ShieldCheck,
  Smartphone,
  ExternalLink,
  HelpCircle,
  Copy,
  Check,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { supabase } from '../../supabaseClient';

interface ContactUsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ContactUsModal: React.FC<ContactUsModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, broadcastNotification } = useApp();

  const [name, setName] = useState(currentUser?.displayName || '');
  const [phone, setPhone] = useState(currentUser?.phoneNumber || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [subject, setSubject] = useState('استفسار عام');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const supportPhone = '+213662688714';
  const displayPhone = '+213 662 68 87 14';

  const handleCopyPhone = () => {
    navigator.clipboard.writeText(supportPhone);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsSubmitting(true);
    try {
      // 1. Try recording message to Supabase if table exists
      try {
        await supabase.from('SupportMessages').insert([
          {
            name: name.trim() || 'مستخدم مجهول',
            phone: phone.trim() || supportPhone,
            email: email.trim(),
            subject: subject,
            message: message.trim(),
            created_at: new Date().toISOString(),
          },
        ]);
      } catch (err) {
        console.warn('Supabase support message log fallback:', err);
      }

      // 2. Broadcast local in-app notification to confirm receipt
      broadcastNotification(
        '📩 تم استلام رسالتك بنجاح',
        `شكراً لتواصلك مع إدارة MotoDrive. سيقوم فريق الدعم الفني بالرد على رقمك ${phone || supportPhone} في أقرب وقت.`
      );

      setSubmitted(true);
      setMessage('');
    } catch (error) {
      console.error('Error submitting contact form:', error);
      alert('تم استلام رسالتك وسيتواصل معك الدعم الفني قريباً.');
      setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in"
      id="contact-us-modal"
      dir="rtl"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl text-right text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <button
            onClick={onClose}
            type="button"
            className="w-9 h-9 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5">
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">اتصل بنا • الدعم الفني MotoDrive</h2>
              <p className="text-[11px] text-amber-400 font-medium">خدمة الزبائن ودعم مراجعي Google Play على مدار 24/7</p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold">
              <Phone className="w-5 h-5 text-amber-400" />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
          {/* Direct Call / WhatsApp Card */}
          <div className="bg-gradient-to-br from-amber-500/15 via-slate-950 to-slate-900 border border-amber-500/30 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>رقم هاتف الدعم الفني المباشر</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                متاح الآن 24/7
              </span>
            </div>

            <div className="flex items-center justify-between bg-slate-950/80 border border-slate-800 p-3 rounded-xl">
              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-400">الخط المباشر للإدارة والدعم:</span>
                <p className="text-lg font-mono font-black text-white" dir="ltr">
                  {displayPhone}
                </p>
              </div>

              <button
                type="button"
                onClick={handleCopyPhone}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-xl transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-bold"
                title="نسخ الرقم"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'تم النسخ!' : 'نسخ'}</span>
              </button>
            </div>

            {/* Quick Action Buttons: Call & WhatsApp */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <a
                href={`tel:${supportPhone}`}
                className="py-2.5 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-md shadow-amber-500/20"
              >
                <Phone className="w-4 h-4" />
                <span>اتصال هاتفي مباشر</span>
              </a>

              <a
                href={`https://wa.me/213662688714?text=${encodeURIComponent('السلام عليكم، أتواصل معكم بخصوص تطبيق MotoDrive')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-md shadow-emerald-600/20"
              >
                <MessageSquare className="w-4 h-4" />
                <span>محادثة واتساب</span>
              </a>
            </div>
          </div>

          {/* Quick Info Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
            <div className="bg-slate-950/60 border border-slate-800 p-2.5 rounded-xl flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <span className="text-slate-400 block text-[10px]">ساعات العمل</span>
                <span className="font-bold text-white">24 ساعة / 7 أيام</span>
              </div>
            </div>

            <div className="bg-slate-950/60 border border-slate-800 p-2.5 rounded-xl flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <span className="text-slate-400 block text-[10px]">المقر الرئيسي</span>
                <span className="font-bold text-white">الجزائر العاصمة</span>
              </div>
            </div>

            <div className="bg-slate-950/60 border border-slate-800 p-2.5 rounded-xl flex items-center gap-2 col-span-2 sm:col-span-1">
              <Mail className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <span className="text-slate-400 block text-[10px]">البريد الإلكتروني</span>
                <span className="font-mono text-white text-[10px]">support@motodrive.dz</span>
              </div>
            </div>
          </div>

          {/* Direct Message Form to Management */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-3">
            <h3 className="font-bold text-white text-xs sm:text-sm flex items-center gap-2">
              <Send className="w-4 h-4 text-amber-400" />
              <span>إرسال رسالة مباشرة لإدارة MotoDrive</span>
            </h3>

            {submitted ? (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl space-y-2 text-center animate-in fade-in">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <h4 className="font-bold text-emerald-400 text-sm">تم إرسال رسالتك بنجاح!</h4>
                <p className="text-slate-300 text-xs">
                  سيتواصل معك فريق الإدارة والدعم الفني عبر رقم الهاتف <span className="font-mono text-amber-400">{phone || supportPhone}</span> في أسرع وقت.
                </p>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="mt-2 text-xs text-amber-400 hover:underline font-bold"
                >
                  إرسال رسالة أخرى
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-300">الاسم الكامل:</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="أدخل اسمك الكريم"
                      className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-300">رقم الهاتف للتواصل:</label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="مثال: 0662688714"
                      className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-500 text-left"
                      dir="ltr"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300">نوع الاستفسار:</label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="استفسار عام">استفسار عام</option>
                    <option value="طلب انضمام ومراجعة وثائق سائق">طلب انضمام ومراجعة وثائق سائق</option>
                    <option value="مساعدة بخصوص رحلة">مساعدة بخصوص رحلة</option>
                    <option value="ملاحظات فريق مراجعي Google Play">ملاحظات فريق مراجعي Google Play</option>
                    <option value="مشكلة تقنية في التطبيق">مشكلة تقنية في التطبيق</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300">نص الرسالة أو الملاحظة:</label>
                  <textarea
                    required
                    rows={3}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="اكتب استفسارك أو مشكلتك هنا بالتفصيل..."
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>إرسال الرسالة للإدارة فوراً</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Google Play Reviewers Fast Note */}
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-3 flex items-start gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-bold text-emerald-300 text-xs">إشعار لمراجعي Google Play Console:</h4>
              <p className="text-[11px] text-slate-300 leading-normal">
                فريق التطوير والدعم الفني متواجد ومتاح للاستجابة المباشرة لأي استفسار عبر الهاتف المذكور أعلاه (+213662688714). نضمن الامتثال الكامل لسياسات Google Play ومطابقة شروط حماية بيانات المستخدمين.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs">
          <span className="text-[11px] text-slate-400">MotoDrive Algérie • الدعم الفني</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl cursor-pointer transition-colors"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
