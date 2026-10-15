import React, { useState } from 'react';
import { X, Share2, MessageCircle, Copy, Check, Smartphone } from 'lucide-react';

interface ShareLiveRideModalProps {
  isOpen: boolean;
  onClose: () => void;
  rideDetails: {
    id: string;
    passengerName: string;
    driverName?: string;
    driverPhone?: string;
    motorcycle?: string;
    pickupName?: string;
    destName?: string;
  };
}

export const ShareLiveRideModal: React.FC<ShareLiveRideModalProps> = ({
  isOpen,
  onClose,
  rideDetails,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const shareUrl = `${window.location.origin}/?track=${rideDetails.id}#ride=${rideDetails.id}`;
  const messageBody = `🚨 مسار رحلتي الحي على تطبيق MotoDrive:\n👤 الراكب: ${rideDetails.passengerName}\n🏍️ السائق: ${rideDetails.driverName || 'جاري البحث'} (${rideDetails.motorcycle || 'دراجة نارية'})\n📍 من: ${rideDetails.pickupName || 'موقعي'}\n🏁 إلى: ${rideDetails.destName || 'الوجهة'}\n🔗 تابع الرحلة لحظة بلحظة على الخريطة:\n${shareUrl}`;

  const handleWhatsAppShare = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(messageBody)}`;
    window.open(url, '_blank');
  };

  const handleSmsShare = () => {
    const url = `sms:?body=${encodeURIComponent(messageBody)}`;
    window.location.href = url;
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'مسار رحلتي الحي على MotoDrive',
          text: messageBody,
          url: shareUrl,
        });
      } catch (e) {
        // User cancelled or unsupported
      }
    } else {
      handleCopyLink();
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-150"
      dir="rtl"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl text-right text-slate-100 space-y-4 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">مشاركة مسار الرحلة الحي</h3>
              <p className="text-[10px] text-slate-400">شارك تفاصيل وموقع رحلتك مع أهلك وأصدقائك</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors text-xs font-bold cursor-pointer"
            title="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live Trip Summary */}
        <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-400">السائق:</span>
            <span className="font-bold text-white">{rideDetails.driverName || 'قيد الانتظار'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">الدراجة:</span>
            <span className="font-bold text-amber-400">{rideDetails.motorcycle || 'MotoDrive'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">نقطة الانطلاق:</span>
            <span className="font-medium text-slate-200 truncate max-w-[170px]">{rideDetails.pickupName || 'موقعي'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">الوجهة:</span>
            <span className="font-medium text-slate-200 truncate max-w-[170px]">{rideDetails.destName || 'الوجهة'}</span>
          </div>
        </div>

        {/* Action Share Buttons */}
        <div className="space-y-2 pt-1">
          <button
            type="button"
            onClick={handleWhatsAppShare}
            className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-950/40 cursor-pointer text-xs active:scale-[0.98]"
          >
            <MessageCircle className="w-4 h-4" />
            <span>إرسال عبر واتساب (WhatsApp)</span>
          </button>

          <button
            type="button"
            onClick={handleSmsShare}
            className="w-full py-3 px-4 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-sky-950/40 cursor-pointer text-xs active:scale-[0.98]"
          >
            <Smartphone className="w-4 h-4" />
            <span>إرسال عبر رسالة نصية قصيرة (SMS)</span>
          </button>

          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <button
              type="button"
              onClick={handleNativeShare}
              className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold rounded-2xl flex items-center justify-center gap-2 transition-all border border-slate-700 cursor-pointer text-xs active:scale-[0.98]"
            >
              <Share2 className="w-4 h-4" />
              <span>مشاركة عبر تطبيقات أخرى...</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleCopyLink}
            className="w-full py-3 px-4 bg-slate-950 hover:bg-slate-800 text-slate-300 font-bold rounded-2xl flex items-center justify-center gap-2 transition-all border border-slate-800 cursor-pointer text-xs active:scale-[0.98]"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
            <span>{copied ? 'تم نسخ الرابط بنجاح!' : 'نسخ رابط التتبع المباشر'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
