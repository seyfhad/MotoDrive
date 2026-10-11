import React, { useState, useEffect } from 'react';
import { Download, Smartphone, Share, X, WifiOff } from 'lucide-react';
import { androidNativeService } from '../../services/androidNativeService';

export const PWAInstallButton: React.FC = () => {
  const [canInstall, setCanInstall] = useState(() => androidNativeService.canInstallDirectly());
  const [isInstalled, setIsInstalled] = useState(() => androidNativeService.isInstalled());
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent.toLowerCase() : '';
    setIsIOS(/iphone|ipad|ipod/.test(ua));

    const unsub = androidNativeService.subscribe(() => {
      setCanInstall(androidNativeService.canInstallDirectly());
      setIsInstalled(androidNativeService.isInstalled());
    });

    return () => unsub();
  }, []);

  if (isInstalled) {
    return null;
  }

  const handleInstall = async () => {
    androidNativeService.vibrateTap();
    if (canInstall) {
      await androidNativeService.promptInstall();
    } else if (isIOS) {
      setShowIOSGuide(true);
    } else {
      window.dispatchEvent(new CustomEvent('open-android-modal'));
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleInstall}
        className="h-7 sm:h-8 px-2 sm:px-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 flex items-center gap-1 text-emerald-300 hover:text-emerald-200 transition-all cursor-pointer shrink-0 active:scale-95"
        title="تثبيت تطبيق MotoDrive على الهاتف"
      >
        <Download className="w-3.5 h-3.5 text-emerald-400" />
        <span className="text-[10px] font-black hidden sm:inline">تثبيت التطبيق</span>
      </button>

      {showIOSGuide && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in"
          onClick={() => setShowIOSGuide(false)}
          dir="rtl"
        >
          <div
            className="w-full max-w-xs bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-3 text-right text-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-black text-white">تثبيت على iPhone / iPad</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="text-xs text-slate-300 space-y-2 leading-relaxed bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
              <p className="flex items-center gap-1.5">
                <span>1. اضغط على زر المشاركة</span>
                <Share className="w-3.5 h-3.5 text-amber-400 inline" />
                <span>في شريط متصفح Safari.</span>
              </p>
              <p>2. اختر <strong>إضافة إلى الشاشة الرئيسية (Add to Home Screen)</strong>.</p>
            </div>
            <button
              type="button"
              onClick={() => setShowIOSGuide(false)}
              className="w-full py-2.5 rounded-xl bg-amber-500 text-slate-950 font-black text-xs cursor-pointer"
            >
              حسناً، فهمت
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div
      className="fixed bottom-20 left-4 right-4 max-w-sm mx-auto z-50 flex items-center justify-center gap-2 rounded-2xl bg-amber-500/95 px-3.5 py-2 text-xs font-black text-slate-950 shadow-xl backdrop-blur-md animate-in fade-in"
      dir="rtl"
    >
      <WifiOff className="w-4 h-4 shrink-0" />
      <span>وضع عدم الاتصال — يتم استخدام البيانات المحفوظة محلياً وسيتم المزامنة تلقائياً فور عودة الإنترنت.</span>
    </div>
  );
};
