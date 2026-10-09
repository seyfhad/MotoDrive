import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { AdminDriversPanel } from '../../components/admin/AdminDriversPanel';
import { AdminDashboard } from './AdminDashboard';
import { AdminRides } from './AdminRides';
import { AdminLiveMap } from './AdminLiveMap';
import { AdminPricing } from './AdminPricing';
import { AdminServiceAreas } from './AdminServiceAreas';
import { AdminComplaints } from './AdminComplaints';
import { AdminUsers } from './AdminUsers';
import { MotoIcon } from '../../components/shared/MotoIcon';
import {
  ShieldCheck,
  Users,
  BarChart3,
  LogOut,
  Bell,
  Settings,
  MapPin,
  Map,
  DollarSign,
  AlertTriangle,
  Send,
  Navigation,
  RefreshCw,
  UserCheck,
  ChevronDown,
  Layers,
  X,
  Loader2,
  CheckCircle2,
} from 'lucide-react';

export const AdminPanel: React.FC = () => {
  const { setCurrentRole, broadcastNotification, logout, drivers, rides, complaints, passengers, currentUser, activePassenger } = useApp();
  const [activeTab, setActiveTab] = useState<
    'drivers' | 'dashboard' | 'rides' | 'map' | 'pricing' | 'service_areas' | 'complaints' | 'users'
  >('drivers');
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  // Strict Owner Access Control
  const isOwner =
    currentUser?.email?.toLowerCase() === 'seyfhad@gmail.com' ||
    activePassenger?.email?.toLowerCase() === 'seyfhad@gmail.com';

  // In-app modals replacing blocked window.confirm / window.prompt in iframes
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastTitle, setBroadcastTitle] = useState('إشعار من إدارة MotoDrive');
  const [broadcastBody, setBroadcastBody] = useState('مرحباً بكم، تم تحديث أسعار وتغطية الرحلات!');
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);

  if (!isOwner) {
    return (
      <div className="max-w-md mx-auto p-6 my-12 bg-slate-900 border border-red-500/30 rounded-3xl text-center space-y-4 shadow-2xl" dir="rtl">
        <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center mx-auto text-2xl">
          🔒
        </div>
        <h3 className="text-lg font-black text-white">غير مصرح بالدخول للإدارة</h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          عذراً، لوحة التحكم الإدارية مخصصة حصرياً لمالك التطبيق الرئيسي (<span className="text-amber-400 font-mono">seyfhad@gmail.com</span>).
        </p>
        <button
          onClick={() => setCurrentRole('passenger')}
          className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs transition-all shadow-md shadow-amber-500/20 cursor-pointer"
        >
          العودة لوضع الراكب
        </button>
      </div>
    );
  }

  const pendingDriversCount = drivers.filter(d => d.status === 'pending').length;
  const activeComplaintsCount = complaints.filter(c => c.status !== 'resolved').length;
  const activeRidesCount = rides.filter(
    r => r.status === 'searching' || r.status === 'accepted' || r.status === 'driver_arriving' || r.status === 'trip_started'
  ).length;

  const handleSendBroadcast = () => {
    if (!broadcastTitle.trim() || !broadcastBody.trim()) return;
    broadcastNotification(broadcastTitle.trim(), broadcastBody.trim());
    setBroadcastSuccess(true);
    setTimeout(() => {
      setBroadcastSuccess(false);
      setShowBroadcastModal(false);
    }, 1800);
  };

  const confirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      sessionStorage.clear();
      localStorage.removeItem('motodrive_user_session');
      localStorage.removeItem('motodrive_v3_role');
      localStorage.removeItem('motodz_v2_role');
      localStorage.removeItem('motodrive_current_user');
      localStorage.removeItem('motodrive_active_driver');
      setCurrentRole('passenger');
      await logout();
      window.dispatchEvent(new CustomEvent('open-welcome'));
    } catch (e) {
      console.warn('Logout notice:', e);
    } finally {
      setIsLoggingOut(false);
      setShowLogoutConfirm(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-16 w-full" dir="rtl">
      {/* Main Navigation Bar with All Admin Modules */}
      <div className="bg-slate-900/60 border-b border-slate-800 px-4 py-2.5 overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-2 min-w-max">
          {/* 1. طلبات السائقين */}
          <button
            onClick={() => setActiveTab('drivers')}
            className={`py-2 px-3.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'drivers'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>طلبات السائقين والوثائق</span>
            {pendingDriversCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                activeTab === 'drivers' ? 'bg-slate-950 text-amber-400' : 'bg-amber-500 text-slate-950 animate-pulse'
              }`}>
                {pendingDriversCount}
              </span>
            )}
          </button>

          {/* 2. لوحة الإحصائيات الشاملة */}
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`py-2 px-3.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>الإحصائيات والبيانات</span>
          </button>

          {/* 3. الرحلات المباشرة */}
          <button
            onClick={() => setActiveTab('rides')}
            className={`py-2 px-3.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'rides'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <MotoIcon className="w-4 h-4" />
            <span>الرحلات ({rides.length})</span>
            {activeRidesCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            )}
          </button>

          {/* 4. خريطة التتبع المباشر */}
          <button
            onClick={() => setActiveTab('map')}
            className={`py-2 px-3.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'map'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Map className="w-4 h-4" />
            <span>خريطة التتبع الحي 🗺️</span>
          </button>

          {/* 5. التسعير والعمولة */}
          <button
            onClick={() => setActiveTab('pricing')}
            className={`py-2 px-3.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'pricing'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>التسعير والعمولة</span>
          </button>

          {/* 6. مناطق الخدمة والولايات */}
          <button
            onClick={() => setActiveTab('service_areas')}
            className={`py-2 px-3.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'service_areas'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>مناطق الخدمة (58 ولاية)</span>
          </button>

          {/* 7. الشكاوى والدعم */}
          <button
            onClick={() => setActiveTab('complaints')}
            className={`py-2 px-3.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'complaints'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>الشكاوى والدعم</span>
            {activeComplaintsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-red-500 text-white">
                {activeComplaintsCount}
              </span>
            )}
          </button>

          {/* 8. حسابات الركاب والمستخدمين */}
          <button
            onClick={() => setActiveTab('users')}
            className={`py-2 px-3.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'users'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>المستخدمين ({passengers.length})</span>
          </button>
        </div>
      </div>

      {/* 3. Main Display Container */}
      <main className="w-full p-4 sm:p-6">
        {activeTab === 'drivers' && <AdminDriversPanel />}
        {activeTab === 'dashboard' && <AdminDashboard onNavigateTab={(t: any) => setActiveTab(t)} />}
        {activeTab === 'rides' && <AdminRides />}
        {activeTab === 'map' && <AdminLiveMap />}
        {activeTab === 'pricing' && <AdminPricing />}
        {activeTab === 'service_areas' && <AdminServiceAreas />}
        {activeTab === 'complaints' && <AdminComplaints />}
        {activeTab === 'users' && <AdminUsers />}
      </main>

      {/* Logout Confirmation Modal (Works 100% inside iframes without window.confirm) */}
      {showLogoutConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in"
          onClick={() => setShowLogoutConfirm(false)}
        >
          <div
            className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4 text-right"
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            <div className="w-12 h-12 rounded-2xl bg-red-500/15 text-red-400 flex items-center justify-center text-xl mx-auto border border-red-500/20">
              <LogOut className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-white">تسجيل الخروج</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                هل أنت متأكد من رغبتك في تسجيل الخروج من لوحة الإدارة والعودة للشاشة الرئيسية؟
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={confirmLogout}
                disabled={isLoggingOut}
                className="flex-1 py-2.5 px-4 bg-red-500 hover:bg-red-600 active:scale-95 text-white font-bold rounded-xl text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-red-500/20 disabled:opacity-50"
              >
                {isLoggingOut ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>جاري الخروج...</span>
                  </>
                ) : (
                  <span>نعم، تسجيل الخروج</span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Broadcast Notification Modal */}
      {showBroadcastModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in"
          onClick={() => setShowBroadcastModal(false)}
        >
          <div
            className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4 text-right"
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">إرسال إشعار عام فوري</h3>
                  <p className="text-[10px] text-slate-400">يصل لجميع الركاب والسائقين على المنصة</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowBroadcastModal(false)}
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {broadcastSuccess ? (
              <div className="py-6 flex flex-col items-center justify-center space-y-2 text-center animate-in fade-in">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-white">تم إرسال الإشعار بنجاح!</h4>
                <p className="text-xs text-slate-400">وصل الإشعار إلى جميع مستخدمي التطبيق.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300 block">عنوان الإشعار:</label>
                  <input
                    type="text"
                    value={broadcastTitle}
                    onChange={(e) => setBroadcastTitle(e.target.value)}
                    placeholder="مثال: إشعار من إدارة MotoDrive"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300 block">نص الرسالة:</label>
                  <textarea
                    rows={3}
                    value={broadcastBody}
                    onChange={(e) => setBroadcastBody(e.target.value)}
                    placeholder="اكتب تفاصيل الإشعار هنا..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 resize-none"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleSendBroadcast}
                    disabled={!broadcastTitle.trim() || !broadcastBody.trim()}
                    className="flex-1 py-2.5 px-4 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-black rounded-xl text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20 disabled:opacity-40"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>إرسال الإشعار الآن</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowBroadcastModal(false)}
                    className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
