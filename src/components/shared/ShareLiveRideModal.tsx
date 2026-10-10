import React, { useState } from 'react';
import { X, Share2, MessageCircle, Copy, Check, ExternalLink } from 'lucide-react';

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

  const shareUrl = `${window.location.origin}/#ride=${rideDetails.id}`;
  const whatsappMessage = `🚨 مسار رحلتي الحي على MotoDrive:\n👤 الراكب: ${rideDetails.passengerName}\n🏍️ السائق: ${rideDetails.driverName || 'جاري البحث'} (${rideDetails.motorcycle || 'دراجة نارية'})\n📍 من: ${rideDetails.pickupName || 'موقعي'} إلى: ${rideDetails.destName || 'الوجهة'}\n🔗 تابع الرحلة لحظة بلحظة:\n${shareUrl}`;

  const handleWhatsAppShare = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(whatsappMessage)}`;
    window.open(url, '_blank');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/85 backdrop-blur-md" dir="rtl">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl text-right text-slate-100 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">مشاركة مسار الرحلة الحي</h3>
              <p className="text-[10px] text-slate-400">شارك تفاصيل الرحلة مع أهلك وأصدقائك</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 flex items-center justify-center transition-colors text-xs font-bold"
          >
            ✕
          </button>
        </div>

        <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-400">السائق:</span>
            <span className="font-bold text-white">{rideDetails.driverName || 'قيد الانتظار'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">نوع الدراجة:</span>
            <span className="font-bold text-amber-400">{rideDetails.motorcycle || 'MotoDrive'}</span>
          </div>
        </div>

        <div className="space-y-2 pt-2">
          <button
            onClick={handleWhatsAppShare}
            className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-900/30 cursor-pointer text-xs"
          >
            <MessageCircle className="w-4 h-4" />
            <span>إرسال عبر واتساب (WhatsApp)</span>
          </button>

          <button
            onClick={handleCopyLink}
            className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-2xl flex items-center justify-center gap-2 transition-all border border-slate-700 cursor-pointer text-xs"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
            <span>{copied ? 'تم نسخ الرابط بنجاح!' : 'نسخ رابط التتبع'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
