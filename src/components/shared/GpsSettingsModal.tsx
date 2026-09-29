import React from 'react';
import { Navigation, Settings, AlertTriangle, RefreshCw, CheckCircle2, X } from 'lucide-react';

interface GpsSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRetryGps: () => Promise<void>;
  isLoading?: boolean;
  errorMessage?: string | null;
}

export const GpsSettingsModal: React.FC<GpsSettingsModalProps> = ({
  isOpen,
  onClose,
  onRetryGps,
  isLoading = false,
  errorMessage,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in"
      id="gps-settings-modal"
      dir="rtl"
    >
      <div className="bg-slate-900 border-2 border-amber-500/60 rounded-3xl max-w-md w-full p-5 text-slate-100 shadow-2xl space-y-4 relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-500/20 rounded-full blur-2xl pointer-events-none"></div>

        {/* Modal Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0">
              <Navigation className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">تفعيل نظام الموقع الجغرافي (GPS)</h3>
              <p className="text-[11px] text-amber-400 font-semibold">مطلوب لتحديد مكانك بدقة على الخريطة 📍</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Explanation & Steps */}
        <div className="space-y-3 text-xs leading-relaxed">
          <p className="text-slate-300">
            يتطلب تطبيق <strong className="text-amber-400 font-bold">MotoDrive</strong> تفعيل خدمة تحديد المواقع الجغرافية (GPS) لضمان ربطك فوراً بالسائقين القريبين منك وتأكيد مكان انطلاقك بلمسة واحدة.
          </p>

          {/* Android Step-by-Step Guidance Box */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 space-y-2">
            <div className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5">
              <Settings className="w-3.5 h-3.5 text-amber-400" />
              <span>خطوات تشغيل GPS على أجهزة أندرويد (Android):</span>
            </div>
            <ul className="space-y-1.5 text-slate-400 text-[11px] pr-2 list-disc list-inside">
              <li>اسحب شريط الإشعارات من أعلى شاشة هاتفك إلى الأسفل.</li>
              <li>ابحث عن أيقونة <strong className="text-white font-bold font-sans">"الموقع / GPS / Location"</strong> وقم بتشغيلها.</li>
              <li>تأكد من منح التطبيق إذن الوصول المباشر للموقع.</li>
            </ul>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px] flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-2">
          <button
            type="button"
            onClick={onRetryGps}
            disabled={isLoading}
            className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-2xl shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 text-sm transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                <span>جاري الاتصال بالأقمار الصناعية (GPS)...</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                <span>إعادة المحاولة وتفعيل التتبع المباشر (GPS) 🔄</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer text-center"
          >
            متابعة بالتحديد اليدوي عبر الخريطة
          </button>
        </div>
      </div>
    </div>
  );
};
