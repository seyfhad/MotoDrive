import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { formatCurrencyDZD } from '../../utils/pricing';
import {
  Users,
  Bike,
  Activity,
  CheckCircle2,
  TrendingUp,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  Shield,
  Trash2,
  Loader2,
} from 'lucide-react';

interface AdminDashboardProps {
  onNavigateTab: (tab: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigateTab }) => {
  const { drivers, passengers, rides, complaints, purgeAllTestData } = useApp();
  const [isPurging, setIsPurging] = useState(false);
  const [purgeSuccessMsg, setPurgeSuccessMsg] = useState<string | null>(null);

  const pendingDrivers = drivers.filter(d => d.status === 'pending');
  const onlineDrivers = drivers.filter(d => d.isOnline);
  const activeComplaints = complaints.filter(c => c.status !== 'resolved');
  const completedRides = rides.filter(r => r.status === 'completed');

  // Real stats calculated directly from live Firestore
  const totalUsersCount = passengers.length;
  const totalDriversCount = drivers.length;
  const totalTripsCount = rides.length;
  const completedTripsCount = completedRides.length;

  const totalRevenueDZD = completedRides.reduce(
    (sum, r) => sum + (r.finalPrice || r.offeredPrice || 0),
    0
  );

  const handlePurgeData = async () => {
    if (
      !window.confirm(
        'هل أنت تأكد من رغبتك في مسح كافة الطلبات والسائقين والركاب والبيانات الاختبارية الحالية من قاعدة البيانات؟'
      )
    ) {
      return;
    }

    setIsPurging(true);
    setPurgeSuccessMsg(null);
    try {
      const res = await purgeAllTestData();
      setPurgeSuccessMsg(`تم مسح وتصفير كافة البيانات والطلبات الوهمية بنجاح! (${res.deletedCount} مستند)`);
    } catch (e: any) {
      alert('حدث خطأ أثناء مسح البيانات: ' + (e?.message || e));
    } finally {
      setIsPurging(false);
    }
  };

  return (
    <div className="space-y-6 text-right text-slate-100" id="admin-dashboard-root">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <span>لوحة تحكم إدارة MotoDrive</span>
            <span className="text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-xl">
              قاعدة البيانات المباشرة
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            متابعة فورية للرحلات، السائقين، الإيرادات، والموافقة على الوثائق الرسمية
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onNavigateTab('map')}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs transition-all shadow-lg shadow-amber-500/20 flex items-center gap-1.5"
          >
            <span>خريطة التتبع المباشر 🗺️</span>
          </button>
        </div>
      </div>

      {purgeSuccessMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-xs font-bold text-emerald-400 text-center animate-in fade-in">
          {purgeSuccessMsg}
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {/* Total Users */}
        <div
          onClick={() => onNavigateTab('users')}
          className="bg-slate-900 border border-slate-800/90 hover:border-slate-700 rounded-3xl p-4 cursor-pointer transition-all shadow-lg group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">إجمالي الركاب (Users)</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">{totalUsersCount}</div>
          <div className="text-[10px] text-slate-400 font-semibold mt-1 flex items-center gap-0.5">
            <span>مسجلين في Firestore</span>
          </div>
        </div>

        {/* Total & Online Drivers */}
        <div
          onClick={() => onNavigateTab('drivers')}
          className="bg-slate-900 border border-slate-800/90 hover:border-slate-700 rounded-3xl p-4 cursor-pointer transition-all shadow-lg group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">السائقين المسجلين</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Bike className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">{totalDriversCount}</div>
          <div className="text-[10px] text-emerald-400 font-bold mt-1 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>{onlineDrivers.length} سائق متصل الآن</span>
          </div>
        </div>

        {/* Total Trips */}
        <div
          onClick={() => onNavigateTab('rides')}
          className="bg-slate-900 border border-slate-800/90 hover:border-slate-700 rounded-3xl p-4 cursor-pointer transition-all shadow-lg group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">الرحلات (Trips)</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">{totalTripsCount}</div>
          <div className="text-[10px] text-slate-400 mt-1">
            {completedTripsCount} مكتملة • {totalTripsCount - completedTripsCount} جارية أو معلقة
          </div>
        </div>

        {/* Total Platform Revenue */}
        <div
          onClick={() => onNavigateTab('pricing')}
          className="bg-slate-900 border border-slate-800/90 hover:border-slate-700 rounded-3xl p-4 cursor-pointer transition-all shadow-lg group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">إجمالي المبيعات (Revenue)</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-400">{formatCurrencyDZD(totalRevenueDZD)}</div>
          <div className="text-[10px] text-slate-400 mt-1">
            عمولة المنصة: {formatCurrencyDZD(Math.round(totalRevenueDZD * 0.15))}
          </div>
        </div>
      </div>

      {/* Urgent Alerts Row: Pending Driver Applications & Open Complaints */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pending Drivers review card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white">طلبات السائقين المعلقة ({pendingDrivers.length})</h3>
            </div>
            <button
              onClick={() => onNavigateTab('drivers')}
              className="text-xs text-amber-400 hover:underline font-semibold"
            >
              عرض الكل
            </button>
          </div>

          <div className="space-y-2">
            {pendingDrivers.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500">
                لا توجد طلبات سائقين معلقة حالياً.
              </div>
            ) : (
              pendingDrivers.slice(0, 3).map(driver => (
                <div
                  key={driver.id}
                  className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-2xl flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={driver.photoUrl}
                      alt={driver.name}
                      className="w-9 h-9 rounded-full object-cover border border-slate-700"
                    />
                    <div>
                      <div className="font-bold text-white">{driver.name || 'سائق جديد'}</div>
                      <div className="text-[10px] text-slate-400">
                        {driver.motorcycle?.brand} {driver.motorcycle?.model} • {driver.wilaya}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onNavigateTab('drivers')}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-colors"
                  >
                    مراجعة الوثائق
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Open Complaints card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <h3 className="text-sm font-bold text-white">الشكاوى والمشكلات المفتوحة ({activeComplaints.length})</h3>
            </div>
            <button
              onClick={() => onNavigateTab('complaints')}
              className="text-xs text-red-400 hover:underline font-semibold"
            >
              إدارة الشكاوى
            </button>
          </div>

          <div className="space-y-2">
            {activeComplaints.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500">
                لا توجد شكاوى مفتوحة حالياً.
              </div>
            ) : (
              activeComplaints.slice(0, 3).map(c => (
                <div
                  key={c.id}
                  className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-2xl flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-bold text-white flex items-center gap-1.5">
                      <span className="text-red-400">⚠️</span>
                      <span>{c.reason}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5 truncate max-w-xs">
                      مقدمة من: {c.userName} ({c.id})
                    </div>
                  </div>

                  <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20 font-bold">
                    قيد التحقيق
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
