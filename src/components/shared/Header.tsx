import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Shield, Bell, PhoneCall, AlertTriangle, Sparkles, User, Bike, UserCheck, PlusCircle, LogIn } from 'lucide-react';
import { SOSModal } from './SOSModal';
import { RegisterDriverModal } from './RegisterDriverModal';
import { UserProfileModal } from './UserProfileModal';
import { AuthModal } from '../auth/AuthModal';

export const Header: React.FC = () => {
  const {
    currentRole,
    setCurrentRole,
    activePassenger,
    activeDriver,
    currentUser,
    drivers,
    passengers,
    notifications,
    currentPassengerRide,
    currentDriverRide,
  } = useApp();

  const [showSos, setShowSos] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showRegisterDriver, setShowRegisterDriver] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const unreadNotifs = notifications.filter(n => !n.isRead);
  const isTripActive = Boolean(currentPassengerRide || currentDriverRide);

  return (
    <>
      <header className="bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 sticky top-0 z-40 px-4 py-3" id="app-main-header">
        <div className="w-full flex items-center justify-between gap-2">
          {/* Brand Identity */}
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 font-black text-lg shadow-md shadow-amber-500/20 shrink-0">
              🏍️
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base sm:text-lg font-black tracking-tight text-white font-sans">Moto<span className="text-amber-400">Drive</span></span>
                <span className="text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1 py-0.2 rounded">
                  موتو درايف
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium hidden xs:block">نقل وتفاوض حر بالدراجات النارية</p>
            </div>
          </div>

          {/* Role Switching & Quick Tools */}
          <div className="flex items-center gap-1 sm:gap-1.5">
            {/* Google Account / Auth Button */}
            <button
              id="header-auth-btn"
              onClick={() => setShowAuthModal(true)}
              className={`flex items-center gap-1.5 px-2 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                currentUser && (currentUser.email || currentUser.photoURL)
                  ? 'bg-slate-900 hover:bg-slate-800 border-emerald-500/40 text-emerald-400'
                  : 'bg-white hover:bg-slate-100 text-slate-950 border-slate-200 shadow-sm'
              }`}
              title={currentUser?.email ? `حساب: ${currentUser.email}` : 'تسجيل الدخول عبر Google'}
            >
              {currentUser && (currentUser.email || currentUser.photoURL) ? (
                <>
                  <div className="relative w-4 h-4 rounded-full overflow-hidden shrink-0">
                    <img
                      src={currentUser?.photoURL || activePassenger.photoUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                      alt="Google User"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-[10px] hidden xs:inline text-white truncate max-w-[65px]">
                    {(currentUser.displayName || activePassenger.name).split(' ')[0]}
                  </span>
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.29 21.36 7.37 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.96 0 12s.46 3.84 1.26 5.42l4.02-3.15z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.37 0 3.29 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                    />
                  </svg>
                  <span className="text-[10px] font-black">دخول</span>
                </>
              )}
            </button>

            {/* Quick Profile Edit Button */}
            <button
              id="header-user-profile-btn"
              onClick={() => setShowUserProfile(true)}
              className="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold transition-all max-w-[85px] sm:max-w-[120px]"
              title="تعديل بيانات الحساب"
            >
              <User className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="truncate text-[10px] sm:text-xs">{activePassenger.name.split(' ')[0]}</span>
            </button>

            {/* Quick Role Toggle Bar */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-0.5 flex items-center">
              <button
                id="role-btn-passenger"
                onClick={() => setCurrentRole('passenger')}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold transition-all ${
                  currentRole === 'passenger'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="وضع الراكب"
              >
                <User className="w-3.5 h-3.5" />
                <span className="text-[10px] sm:text-xs">الراكب</span>
              </button>

              <button
                id="role-btn-driver"
                onClick={() => setCurrentRole('driver')}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold transition-all relative ${
                  currentRole === 'driver'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="وضع السائق"
              >
                <Bike className="w-3.5 h-3.5" />
                <span className="text-[10px] sm:text-xs">السائق</span>
                {activeDriver.isOnline && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                )}
              </button>

              <button
                id="role-btn-admin"
                onClick={() => setCurrentRole('admin')}
                className={`flex items-center gap-1 px-1.5 sm:px-2 py-1 rounded-lg text-xs font-bold transition-all ${
                  currentRole === 'admin'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="لوحة الإدارة"
              >
                <Shield className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Emergency SOS button */}
            <button
              id="sos-header-btn"
              onClick={() => setShowSos(true)}
              className={`flex items-center gap-1 px-2 py-1.5 rounded-xl text-xs font-bold transition-all ${
                isTripActive
                  ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse shadow-md shadow-red-500/30'
                  : 'bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20'
              }`}
              title="طوارئ SOS"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span className="text-[10px] font-black hidden sm:inline">SOS</span>
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button
                id="notifications-bell-btn"
                onClick={() => setShowNotifications(!showNotifications)}
                className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300 hover:text-amber-400 hover:border-amber-500/30 transition-colors relative"
                title="التنبيهات والإشعارات"
              >
                <Bell className="w-3.5 h-3.5" />
                {unreadNotifs.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-slate-950 font-black text-[9px] rounded-full flex items-center justify-center">
                    {unreadNotifs.length}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute left-0 mt-2 w-80 max-w-[85vw] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2">
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

      {/* Modals */}
      {showSos && (
        <SOSModal
          onClose={() => setShowSos(false)}
          activeRide={currentPassengerRide || currentDriverRide}
        />
      )}
      <RegisterDriverModal
        isOpen={showRegisterDriver}
        onClose={() => setShowRegisterDriver(false)}
      />
      <UserProfileModal
        isOpen={showUserProfile}
        onClose={() => setShowUserProfile(false)}
      />
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </>
  );
};
