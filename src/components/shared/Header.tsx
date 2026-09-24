import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Bell, AlertTriangle, User, LogOut, Send, FileText, ShieldCheck } from 'lucide-react';
import { MotoIcon } from './MotoIcon';
import { SOSModal } from './SOSModal';
import { RegisterDriverModal } from './RegisterDriverModal';
import { UserProfileModal } from './UserProfileModal';
import { AuthModal } from '../auth/AuthModal';
import { AdminInAppMessageModal } from './AdminInAppMessageModal';
import { pushNotificationService } from '../../services/pushNotificationService';

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
    markAllNotificationsAsRead,
    currentPassengerRide,
    currentDriverRide,
  } = useApp();

  const [showSos, setShowSos] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showRegisterDriver, setShowRegisterDriver] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAdminMessageModal, setShowAdminMessageModal] = useState(false);

  const unreadNotifs = notifications.filter(n => !n.isRead);
  const isTripActive = Boolean(currentPassengerRide || currentDriverRide);
  const isOwner = currentUser?.email === 'seyfhad@gmail.com' || currentRole === 'admin';

  return (
    <>
      <header
        className="bg-slate-950/95 backdrop-blur-md border-b border-slate-800/80 sticky top-0 z-40 px-3.5 pb-2 sm:px-4 sm:pb-2.5"
        style={{
          paddingTop: 'calc(var(--safe-area-top, env(safe-area-inset-top, 0px)) + 0.5rem)',
        }}
        id="app-main-header"
      >
        <div className="w-full flex items-center justify-between gap-2">
          {/* Brand Icon & Name */}
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('open-welcome'))}
            className="flex items-center gap-1.5 sm:gap-2 text-right hover:opacity-90 transition-opacity cursor-pointer"
            title="الواجهة الأولية وشروط الاستخدام"
          >
            <div className="w-8 h-8 rounded-xl overflow-hidden shadow-sm shadow-amber-500/20 shrink-0 border border-amber-500/30">
              <img src="/icon.jpg" alt="MotoDrive" className="w-full h-full object-cover" />
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
                    <MotoIcon className="w-3.5 h-3.5 shrink-0" />
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

            {/* Terms of Service Button */}
            <button
              id="terms-header-btn"
              onClick={() => {
                window.dispatchEvent(
                  new CustomEvent('open-legal', { detail: { tab: 'terms' } })
                );
              }}
              className="h-8 px-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="شروط الاستخدام والسياسات القانونية"
            >
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[10px] font-bold hidden sm:inline">شروط الاستخدام</span>
            </button>

            {/* Owner/Admin In-App Message Action Button */}
            {isOwner && (
              <>
                <button
                  id="header-admin-panel-btn"
                  onClick={() => {
                    setCurrentRole(currentRole === 'admin' ? 'passenger' : 'admin');
                  }}
                  className={`h-8 px-2.5 rounded-xl border flex items-center gap-1.5 transition-all font-bold text-xs ${
                    currentRole === 'admin'
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                      : 'bg-amber-500/15 hover:bg-amber-500/25 border-amber-500/30 text-amber-300'
                  }`}
                  title="لوحة تحكم الإدارة"
                >
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>{currentRole === 'admin' ? 'وضع المستخدم' : 'لوحة الإدارة'}</span>
                </button>

                <button
                  id="header-admin-inapp-message-btn"
                  onClick={() => setShowAdminMessageModal(true)}
                  className="h-8 px-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 flex items-center gap-1.5 text-amber-300 transition-colors"
                  title="إرسال رسالة لحساب مستخدم (داخل التطبيق)"
                >
                  <Send className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-[10px] font-bold hidden sm:inline">إرسال إشعار</span>
                </button>
              </>
            )}

            {/* Notification Bell */}
            <div className="relative">
              <button
                id="notifications-bell-btn"
                onClick={() => {
                  if (!showNotifications) {
                    markAllNotificationsAsRead();
                  }
                  setShowNotifications(!showNotifications);
                }}
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
                    <h4 className="text-xs font-bold text-white">التنبيهات والإشعارات الفورية</h4>
                    <span className="text-[10px] text-amber-400 font-semibold">{notifications.length} إشعار</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      pushNotificationService.sendPushNotification(
                        '🔔 إشعار تجريبي من MotoDrive',
                        'نظام الإشعارات الفورية والصوتية يعمل بنجاح!',
                        { soundType: 'new_ride' }
                      );
                    }}
                    className="w-full mb-2 py-1.5 px-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-xl text-amber-300 text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                  >
                    <span>🔔 تجربة الإشعار والنغمة الفورية</span>
                  </button>
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
      <AdminInAppMessageModal
        isOpen={showAdminMessageModal}
        onClose={() => setShowAdminMessageModal(false)}
      />
    </>
  );
};
