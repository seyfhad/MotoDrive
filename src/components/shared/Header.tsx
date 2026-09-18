import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Shield, Bell, PhoneCall, AlertTriangle, Sparkles, User, Bike, UserCheck } from 'lucide-react';
import { SOSModal } from './SOSModal';

export const Header: React.FC = () => {
  const {
    currentRole,
    setCurrentRole,
    activePassenger,
    activeDriver,
    drivers,
    passengers,
    notifications,
    currentPassengerRide,
    currentDriverRide,
  } = useApp();

  const [showSos, setShowSos] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const unreadNotifs = notifications.filter(n => !n.isRead);
  const isTripActive = Boolean(currentPassengerRide || currentDriverRide);

  return (
    <>
      <header className="bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 sticky top-0 z-40 px-4 py-3" id="app-main-header">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Brand Identity */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 font-black text-xl shadow-lg shadow-amber-500/20">
              🏍️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight text-white font-sans">Moto<span className="text-amber-400">DZ</span></span>
                <span className="text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded">
                  موطو ديزاد
                </span>
                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>متصل سحابياً (Firebase)</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">رحلتك أسرع وأسهل بالدراجة</p>
            </div>
          </div>

          {/* Role Switching & Quick Tools */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Role Toggle Bar */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-1 flex items-center">
              <button
                id="role-btn-passenger"
                onClick={() => setCurrentRole('passenger')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  currentRole === 'passenger'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">الراكب</span>
              </button>

              <button
                id="role-btn-driver"
                onClick={() => setCurrentRole('driver')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all relative ${
                  currentRole === 'driver'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Bike className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">السائق</span>
                {activeDriver.isOnline && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                )}
              </button>

              <button
                id="role-btn-admin"
                onClick={() => setCurrentRole('admin')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  currentRole === 'admin'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">الإدارة</span>
              </button>
            </div>

            {/* Emergency SOS button - always accessible during rides or app */}
            <button
              id="sos-header-btn"
              onClick={() => setShowSos(true)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                isTripActive
                  ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse shadow-lg shadow-red-500/30'
                  : 'bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>SOS</span>
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button
                id="notifications-bell-btn"
                onClick={() => setShowNotifications(!showNotifications)}
                className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300 hover:text-amber-400 hover:border-amber-500/30 transition-colors relative"
              >
                <Bell className="w-4 h-4" />
                {unreadNotifs.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-slate-950 font-black text-[10px] rounded-full flex items-center justify-center">
                    {unreadNotifs.length}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute left-0 mt-2 w-80 max-w-[90vw] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2">
                    <h4 className="text-xs font-bold text-white">التنبيهات والإشعارات</h4>
                    <span className="text-[10px] text-amber-400 font-semibold">{notifications.length} إشعار</span>
                  </div>
                  <div className="max-h-72 overflow-y-auto space-y-2">
                    {notifications.length === 0 ? (
                      <div className="text-center py-6 text-xs text-slate-500">
                        لا توجد إشعارات جديدة حالياً
                      </div>
                    ) : (
                      notifications.slice(0, 8).map(n => (
                        <div
                          key={n.id}
                          className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/60 text-right text-xs"
                        >
                          <div className="font-bold text-amber-400 mb-0.5">{n.title}</div>
                          <div className="text-slate-300 text-[11px] leading-relaxed">{n.body}</div>
                          <div className="text-[9px] text-slate-500 mt-1">
                            {new Date(n.createdAt).toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* SOS Modal */}
      {showSos && (
        <SOSModal
          onClose={() => setShowSos(false)}
          activeRide={currentPassengerRide || currentDriverRide}
        />
      )}
    </>
  );
};
