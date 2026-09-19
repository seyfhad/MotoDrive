import React, { useState } from 'react';
import { Ride } from '../../types';
import { sendRideReceiptEmail, sendGmailMessage, getGmailProfile } from '../../services/gmailService';
import { getGmailAccessToken, signInWithGoogle } from '../../services/authService';
import { Mail, CheckCircle, AlertCircle, Loader2, X, Send, ShieldCheck, FileText } from 'lucide-react';

interface GmailReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  ride?: Ride | null;
  defaultRecipient?: string;
  defaultSubject?: string;
}

export const GmailReceiptModal: React.FC<GmailReceiptModalProps> = ({
  isOpen,
  onClose,
  ride,
  defaultRecipient = '',
  defaultSubject = '',
}) => {
  const [recipient, setRecipient] = useState(defaultRecipient || ride?.passengerPhone ? '' : '');
  const [customSubject, setCustomSubject] = useState(defaultSubject || (ride ? `إيصال رحلة MotoDrive #${ride.id.slice(-6).toUpperCase()}` : 'رسالة من تطبيق MotoDrive'));
  const [customMessage, setCustomMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmStep, setConfirmStep] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentToken = getGmailAccessToken();

  const handleConnectGmail = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      await signInWithGoogle('passenger');
      const token = getGmailAccessToken();
      if (token) {
        const profile = await getGmailProfile(token);
        setUserEmail(profile.emailAddress);
      }
    } catch (err: any) {
      console.error('Gmail Connect Error:', err);
      setErrorMsg(err?.message || 'تعذر الربط بـ Gmail. يرجى التأكد من اختيار حساب Google وتأكيد الصلاحية.');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!recipient.trim() || !recipient.includes('@')) {
      setErrorMsg('يرجى إدخال بريد إلكتروني صحيح للمستلم (مثل: user@gmail.com)');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg(null);

      if (ride) {
        // Send Ride Receipt
        await sendRideReceiptEmail(ride, recipient);
        setSuccessMsg(`تم إرسال إيصال الرحلة #${ride.id.slice(-6).toUpperCase()} بنجاح عبر Gmail إلى: ${recipient}`);
      } else {
        // Send Custom Email
        await sendGmailMessage({
          to: recipient,
          subject: customSubject,
          htmlBody: `
            <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #f8fafc; padding: 24px; border-radius: 16px;">
              <h2 style="color: #f59e0b;">MotoDrive - موتو درايف</h2>
              <div style="background: #1e293b; padding: 16px; border-radius: 12px; font-size: 14px; line-height: 1.6;">
                ${customMessage.replace(/\n/g, '<br/>')}
              </div>
              <p style="font-size: 11px; color: #64748b; margin-top: 16px;">تم إرسال هذه الرسالة رسمياً عبر تطبيق MotoDrive باستخدام Gmail API.</p>
            </div>
          `,
        });
        setSuccessMsg(`تم إرسال الرسالة بنجاح عبر Gmail إلى: ${recipient}`);
      }

      setConfirmStep(false);
    } catch (err: any) {
      console.error('Gmail Send Error:', err);
      if (err?.message === 'GMAIL_TOKEN_REQUIRED' || err?.message?.includes('401')) {
        setErrorMsg('يتطلب إرسال البريد تسجيل الدخول بحساب Google أولاً وتوفير صلاحية Gmail.');
      } else {
        setErrorMsg(err?.message || 'حدث خطأ أثناء إرسال البريد عبر Gmail.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 w-full max-w-md shadow-2xl space-y-4 text-right relative" dir="rtl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 font-black shadow-md shadow-amber-500/20">
              <Mail className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">إرسال إيصال عبر Gmail</h3>
              <p className="text-[11px] text-slate-400">خدمة إرسال الفواتير والإشعارات الرسمية</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Gmail Auth Status Banner */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className={`w-4 h-4 ${currentToken ? 'text-emerald-400' : 'text-amber-400'}`} />
            <span className="text-slate-300 font-medium text-[11px]">
              {currentToken ? `متصل بـ Gmail ${userEmail ? `(${userEmail})` : ''}` : 'يتطلب ربط حساب Google'}
            </span>
          </div>
          {!currentToken && (
            <button
              onClick={handleConnectGmail}
              disabled={loading}
              className="px-2.5 py-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] transition-all flex items-center gap-1"
            >
              {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'ربط Google'}
            </button>
          )}
        </div>

        {successMsg ? (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 text-center space-y-3">
            <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto" />
            <p className="text-xs font-bold text-emerald-300 leading-relaxed">{successMsg}</p>
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs hover:bg-emerald-400 transition-colors"
            >
              إغلاق
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Recipient Email */}
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">البريد الإلكتروني للمستلم:</label>
              <input
                type="email"
                value={recipient}
                onChange={e => setRecipient(e.target.value)}
                placeholder="مثال: passenger@gmail.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-xs font-medium text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors text-left"
                dir="ltr"
              />
            </div>

            {/* Ride Details Card if sending a Ride Receipt */}
            {ride ? (
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3 space-y-2 text-xs">
                <div className="flex items-center justify-between font-bold text-amber-400">
                  <span className="flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5" />
                    معاينة إيصال الرحلة
                  </span>
                  <span>#{ride.id.slice(-6).toUpperCase()}</span>
                </div>
                <div className="space-y-1 text-[11px] text-slate-300">
                  <p>💰 **المبلغ الإجمالي:** <span className="text-emerald-400 font-bold">{ride.finalPrice} دج</span></p>
                  <p className="truncate">📍 **الانطلاق:** {ride.pickupLocation.address || 'موقع الانطلاق'}</p>
                  <p className="truncate">🏁 **الوصول:** {ride.dropoffLocation.address || 'موقع الوصول'}</p>
                  {ride.driverName && <p>👤 **السائق:** {ride.driverName}</p>}
                </div>
              </div>
            ) : (
              /* Custom Email Subject & Message */
              <>
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">عنوان الرسالة (Subject):</label>
                  <input
                    type="text"
                    value={customSubject}
                    onChange={e => setCustomSubject(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-xs font-medium text-white focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">نص الرسالة:</label>
                  <textarea
                    rows={3}
                    value={customMessage}
                    onChange={e => setCustomMessage(e.target.value)}
                    placeholder="اكتب تفاصيل الرسالة هنا..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-medium text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>
              </>
            )}

            {errorMsg && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-3 flex items-center gap-2 text-[11px] text-red-400">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Confirmation step requirement for data mutation/sending emails */}
            {!confirmStep ? (
              <button
                type="button"
                onClick={() => setConfirmStep(true)}
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>إعداد وإرسال البريد</span>
              </button>
            ) : (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3 space-y-2 text-[11px] text-amber-300 text-center">
                <p className="font-bold">تأكيد الإرسال النهائي عبر Gmail:</p>
                <p>هل أنت متأكد من إرسال البريد الإلكتروني رسمياً إلى <strong className="text-white">{recipient}</strong>؟</p>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={handleSend}
                    disabled={loading}
                    className="flex-1 py-2 rounded-xl bg-amber-500 text-slate-950 font-black text-xs hover:bg-amber-400 transition-all flex items-center justify-center gap-1 disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'تأكيد وإرسال الآن'}
                  </button>
                  <button
                    onClick={() => setConfirmStep(false)}
                    className="py-2 px-3 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-700 transition-all"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
