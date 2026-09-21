import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Bell, AlertTriangle, User, Bike, Mail, Shield, LogOut } from 'lucide-react';
import { SOSModal } from './SOSModal';
import { RegisterDriverModal } from './RegisterDriverModal';
import { UserProfileModal } from './UserProfileModal';
import { AuthModal } from '../auth/AuthModal';
import { GmailReceiptModal } from './GmailReceiptModal';

export const Header: React.FC = () => {
  const {
    currentRole,
    setCurrentRole,
    activePassenger,
    activeDriver,
    currentUser,
    logout,
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
  const [showGmailModal, setShowGmailModal] = useState(false);

  const unreadNotifs = notifications.filter(n => !n.isRead);
  const isTripActive = Boolean(currentPassengerRide || currentDriverRide);

  return (
    <>
      <header className="bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 sticky top-0 z-40 px-3.5 py-2 sm:px-4 sm:py-2.5" id="app-main-header">
        <div className="w-full flex items-center justify-between gap-2">
          {/* Brand Icon & Name */}
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('open-welcome'))}
            className="flex items-center gap-1.5 sm:gap-2 text-right hover:opacity-90 transition-opacity cursor-pointer"
            title="الواجهة الأولية وشروط الاستخدام"
          >
            <div className="w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 font-black text-sm shadow-sm shadow-amber-500/20 shrink-0">
              🏍️
            </div>
            <div>
              <span className="text-sm sm:text-base font-black tracking-tight text-white font-sans">Moto<span className="text-amber-400">Drive</span></span>
            </div>
          </button>

          {/* User Account & Quick Tools */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Account & Login Button */}
            <button
              id="header-user-profile-btn"
              onClick={() => {
                if (!currentUser) {
                  setShowAuthModal(true);
                } else {
                  setShowUserProfile(true);
                }
              }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-bold transition-all ${
                !currentUser
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 border-amber-400 shadow-sm shadow-amber-500/20'
                  : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300'
              }`}
              title={!currentUser ? 'تسجيل الدخول' : 'حسابي والصفة في التطبيق'}
            >
              {!currentUser ? (
                <>
                  <User className="w-3 h-3 shrink-0" />
                  <span className="text-[11px] font-black">تسجيل الدخول</span>
                </>
              ) : (
                <>
                  {currentRole === 'driver' ? (
                    <Bike className="w-3 h-3 text-amber-400 shrink-0" />
                  ) : (
                    <User className="w-3 h-3 text-amber-400 shrink-0" />
                  )}
                  <span className="truncate text-[10px] sm:text-xs font-bold max-w-[80px] sm:max-w-none">
                    {currentUser.displayName || activePassenger?.name?.split(' ')[0] || 'حسابي'}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-bold">
                    {currentRole === 'admin' ? 'الإدارة' : currentRole === 'driver' ? 'سائق' : 'راكب'}
                  </span>
                </>
              )}
            </button>

            {/* Quick Logout Button */}
            {currentUser && (
              <button
                id="header-logout-btn"
                onClick={async () => {
                  sessionStorage.removeItem('motodrive_has_entered');
                  await logout();
                  window.dispatchEvent(new CustomEvent('open-welcome'));
                }}
                className="w-8 h-8 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 hover:bg-red-500 hover:text-white transition-all"
                title="تسجيل الخروج"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}

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

            {/* Gmail Action Button */}
            <button
              id="header-gmail-btn"
              onClick={() => setShowGmailModal(true)}
              className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300 hover:text-amber-400 hover:border-amber-500/30 transition-colors"
              title="إرسال عبر Gmail"
            >
              <Mail className="w-3.5 h-3.5 text-amber-400" />
            </button>

            {/* Google Cloud & Verification Guide Button */}
            <button
              id="header-gcp-guide-btn"
              onClick={() => {
                window.dispatchEvent(new CustomEvent('open-legal', { detail: { tab: 'gcp-guide' } }));
              }}
              className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300 hover:text-amber-400 hover:border-amber-500/30 transition-colors"
              title="دليل نشر التطبيق وإعدادات Google Cloud"
            >
              <Shield className="w-3.5 h-3.5 text-amber-400" />
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
      <GmailReceiptModal
        isOpen={showGmailModal}
        onClose={() => setShowGmailModal(false)}
        defaultRecipient={activePassenger.email || ''}
      />
    </>
  );
};
