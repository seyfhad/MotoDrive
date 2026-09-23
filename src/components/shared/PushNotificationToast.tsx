import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { pushNotificationService, PushPermissionStatus } from '../../services/pushNotificationService';
import { Bell, BellOff, X, ChevronLeft, Navigation, ShieldCheck, Sparkles } from 'lucide-react';
import { MotoIcon } from './MotoIcon';

export const PushNotificationToast: React.FC = () => {
  const { notifications, currentRole } = useApp();
  const [permissionStatus, setPermissionStatus] = useState<PushPermissionStatus>(() =>
    pushNotificationService.getPermissionStatus()
  );
  const [showPermissionBanner, setShowPermissionBanner] = useState<boolean>(() => {
    return (
      pushNotificationService.getPermissionStatus() === 'default' &&
      localStorage.getItem('motodrive_dismissed_push_banner') !== 'true'
    );
  });

  const [activeToast, setActiveToast] = useState<{
    id: string;
    title: string;
    body: string;
    icon?: string;
    type?: string;
  } | null>(null);

  // Watch for latest unread notification to trigger top toast
  const latestNotif = notifications[0];
  const [lastSeenNotifId, setLastSeenNotifId] = useState<string | null>(null);

  useEffect(() => {
    if (latestNotif && latestNotif.id !== lastSeenNotifId && !latestNotif.isRead) {
      setLastSeenNotifId(latestNotif.id);
      setActiveToast({
        id: latestNotif.id,
        title: latestNotif.title,
        body: latestNotif.body,
        type: latestNotif.type,
      });

      // Auto-dismiss toast after 6 seconds
      const timer = setTimeout(() => {
        setActiveToast(null);
      }, 6000);

      return () => clearTimeout(timer);
    }
  }, [latestNotif, lastSeenNotifId]);

  const handleEnablePush = async () => {
    const res = await pushNotificationService.requestPermission();
    setPermissionStatus(res);
    setShowPermissionBanner(false);
  };

  const handleDismissBanner = () => {
    setShowPermissionBanner(false);
    localStorage.setItem('motodrive_dismissed_push_banner', 'true');
  };

  return (
    <div
      className="fixed inset-x-0 z-[100] max-w-md mx-auto px-3 pointer-events-none space-y-2 transition-all"
      style={{
        top: 'calc(var(--safe-area-top, env(safe-area-inset-top, 0px)) + 0.75rem)',
      }}
      dir="rtl"
    >
      {/* 1. Permission Prompt Banner (if not yet granted) */}
      {showPermissionBanner && permissionStatus === 'default' && (
        <div className="pointer-events-auto bg-slate-900/95 border border-amber-500/40 rounded-2xl p-3 shadow-2xl backdrop-blur-md flex items-center justify-between gap-3 text-right animate-in slide-in-from-top-4">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <Bell className="w-5 h-5 animate-bounce text-amber-400" />
          </div>
          <div className="flex-1">
            <h4 className="text-xs font-black text-white">تفعيل الإشعارات الفورية (Push)</h4>
            <p className="text-[10px] text-amber-300 font-medium">لتلقي تنبيهات الطلبات الفورية واقتراب السائق</p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleEnablePush}
              className="py-1.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[11px] shadow-md cursor-pointer transition-all active:scale-95"
            >
              تفعيل الآن
            </button>
            <button
              onClick={handleDismissBanner}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 2. Floating In-App Active Push Toast */}
      {activeToast && (
        <div className="pointer-events-auto bg-slate-900/95 border border-amber-500/50 rounded-2xl p-3.5 shadow-2xl backdrop-blur-lg flex items-start justify-between gap-3 text-right animate-in slide-in-from-top-4 border-l-4 border-l-amber-500">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 flex items-center justify-center shrink-0 font-black shadow-lg">
            {activeToast.title.includes('سائق') || activeToast.title.includes('رحلة') ? (
              <MotoIcon className="w-5 h-5" />
            ) : activeToast.title.includes('وصل') || activeToast.title.includes('أقترب') ? (
              <Navigation className="w-5 h-5 animate-pulse" />
            ) : (
              <Bell className="w-5 h-5" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-amber-400 truncate">{activeToast.title}</span>
              <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded font-mono font-bold">
                تنبيه فوري
              </span>
            </div>
            <p className="text-[11px] text-slate-200 mt-0.5 line-clamp-2 leading-tight">
              {activeToast.body}
            </p>
          </div>

          <button
            onClick={() => setActiveToast(null)}
            className="p-1 text-slate-400 hover:text-white rounded-lg shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
