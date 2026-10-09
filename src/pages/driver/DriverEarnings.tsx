import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../contexts/AppContext';
import { formatCurrencyDZD } from '../../utils/pricing';
import {
  Wallet,
  RefreshCw,
  Sparkles,
  MapPin,
  Clock,
} from 'lucide-react';
import { EarningsSummarySkeleton } from '../../components/shared/Skeleton';
import { supabaseService } from '../../services/supabaseService';

export const DriverEarnings: React.FC = () => {
  const { activeDriver, rides, pricing } = useApp();
  const [isLoadingEarnings, setIsLoadingEarnings] = useState<boolean>(true);
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly'>('daily');

  // جلب وتحديث الأرباح مع Supabase وتطبيق الـ Skeleton
  const loadEarnings = async () => {
    setIsLoadingEarnings(true);
    try {
      await supabaseService.getDriverEarnings(activeDriver.id);
    } catch (e) {
      console.warn('Driver earnings fetch error:', e);
    } finally {
      setTimeout(() => setIsLoadingEarnings(false), 450);
    }
  };

  useEffect(() => {
    loadEarnings();
  }, [activeDriver.id]);

  // Real completed rides for this active driver
  const completedRides = useMemo(() => {
    return rides.filter(
      r => (r.driverId === activeDriver.id || r.driverId === activeDriver.phone) && r.status === 'completed'
    );
  }, [rides, activeDriver.id, activeDriver.phone]);

  const totalTrips = completedRides.length;

  const totalGrossDZD = useMemo(() => {
    return completedRides.reduce(
      (sum, r) => sum + (r.finalPrice || r.estimatedPrice || 0),
      0
    );
  }, [completedRides]);

  const commissionRate = (pricing.platformCommissionPercent ?? 0) / 100;

  const totalEarningsDZD = useMemo(() => {
    return completedRides.reduce((sum, r) => {
      const gross = r.finalPrice || r.estimatedPrice || 0;
      return sum + (r.driverEarning || Math.round(gross * (1 - commissionRate)));
    }, 0);
  }, [completedRides, commissionRate]);

  const totalCommissionDZD = totalGrossDZD - totalEarningsDZD;

  // Today's Earnings
  const todayEarnings = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayRides = completedRides.filter(r => {
      const d = new Date(r.completedAt || r.updatedAt || r.createdAt || r.requestedAt);
      return d >= today;
    });
    return todayRides.reduce((sum, r) => {
      const gross = r.finalPrice || r.estimatedPrice || 0;
      return sum + (r.driverEarning || Math.round(gross * (1 - commissionRate)));
    }, 0);
  }, [completedRides, commissionRate]);

  // This Week's Earnings
  const thisWeekEarnings = useMemo(() => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weekRides = completedRides.filter(r => {
      const d = new Date(r.completedAt || r.updatedAt || r.createdAt || r.requestedAt);
      return d >= oneWeekAgo;
    });
    return weekRides.reduce((sum, r) => {
      const gross = r.finalPrice || r.estimatedPrice || 0;
      return sum + (r.driverEarning || Math.round(gross * (1 - commissionRate)));
    }, 0);
  }, [completedRides, commissionRate]);

  const avgPerTrip = totalTrips > 0 ? Math.round(totalEarningsDZD / totalTrips) : 0;

  return (
    <div className="max-w-md mx-auto px-4 py-6 text-right text-slate-100 space-y-4 pb-24" id="driver-earnings-screen" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-white">محفظة وأرباح السائق</h2>
          <p className="text-xs text-slate-400">سجل الإيرادات والرحلات المنجزة الحقيقية</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadEarnings}
            disabled={isLoadingEarnings}
            className="w-9 h-9 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-amber-400 flex items-center justify-center transition-colors active:scale-95 disabled:opacity-50"
            title="تحديث الأرباح"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingEarnings ? 'animate-spin text-amber-400' : ''}`} />
          </button>
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <Wallet className="w-5 h-5" />
          </div>
        </div>
      </div>

      {isLoadingEarnings ? (
        <EarningsSummarySkeleton />
      ) : (
        <>
          {/* Real Net Earnings Hero Card */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-amber-500/30 rounded-3xl p-5 shadow-2xl space-y-4 animate-in fade-in duration-300 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between text-xs text-slate-400 relative z-10">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>إجمالي الأرباح الصافية المحققة:</span>
              </span>
              <span className="text-amber-400 font-black bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                {totalTrips} رحلة مكتملة
              </span>
            </div>

            <div className="text-3xl sm:text-4xl font-black text-amber-400 tracking-tight relative z-10 font-mono">
              {formatCurrencyDZD(totalEarningsDZD)}
            </div>

            {/* Breakdown Mini Grid */}
            <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-3.5 space-y-2 text-xs relative z-10">
              <div className="flex items-center justify-between text-slate-300">
                <span>إجمالي مبالغ الركاب (التحصيل الكامل):</span>
                <span className="font-bold text-white font-mono">{formatCurrencyDZD(totalGrossDZD)}</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>عمولة المنصة ({pricing.platformCommissionPercent ?? 0}%):</span>
                <span className="font-bold text-emerald-400 font-mono">
                  {totalCommissionDZD === 0 ? '0 د.ج (الأرباح 100% للسائق)' : `-${formatCurrencyDZD(totalCommissionDZD)}`}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between font-bold text-emerald-400">
                <span>صافي أرباح الكابتن (Cash باليد):</span>
                <span className="text-sm font-black font-mono">{formatCurrencyDZD(totalEarningsDZD)}</span>
              </div>
            </div>
          </div>

          {/* KPI Stat Cards Row */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 text-center space-y-1">
              <span className="text-[10px] text-slate-400 font-medium block">أرباح اليوم</span>
              <span className="text-xs sm:text-sm font-black text-amber-400 block font-mono">
                {formatCurrencyDZD(todayEarnings)}
              </span>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 text-center space-y-1">
              <span className="text-[10px] text-slate-400 font-medium block">هذا الأسبوع</span>
              <span className="text-xs sm:text-sm font-black text-emerald-400 block font-mono">
                {formatCurrencyDZD(thisWeekEarnings)}
              </span>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 text-center space-y-1">
              <span className="text-[10px] text-slate-400 font-medium block">معدل الرحلة</span>
              <span className="text-xs sm:text-sm font-black text-sky-400 block font-mono">
                {formatCurrencyDZD(avgPerTrip)}
              </span>
            </div>
          </div>

          {/* Recent Completed Trips History */}
          {completedRides.length > 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <h4 className="text-xs font-black text-white">آخر الرحلات المكتملة</h4>
                </div>
                <span className="text-[10px] text-slate-400">{completedRides.length} مشوار</span>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto pr-0.5">
                {completedRides.slice(0, 5).map(trip => {
                  const gross = trip.finalPrice || trip.estimatedPrice || 0;
                  const net = trip.driverEarning || Math.round(gross * (1 - commissionRate));
                  const tripDate = new Date(trip.completedAt || trip.updatedAt || trip.createdAt || trip.requestedAt);

                  return (
                    <div
                      key={trip.id}
                      className="bg-slate-950 border border-slate-800/90 rounded-2xl p-3 flex items-center justify-between text-xs hover:border-slate-700 transition-colors"
                    >
                      <div className="space-y-1 truncate max-w-[210px]">
                        <div className="flex items-center gap-1.5 text-slate-300 font-bold truncate">
                          <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span className="truncate">{trip.destination?.name || trip.destination?.address || 'الوجهة'}</span>
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {tripDate.toLocaleDateString('ar-DZ')} • {trip.passengerName || 'راكب'} • {trip.distanceKm} كم
                        </div>
                      </div>

                      <div className="text-left shrink-0">
                        <div className="text-xs font-black text-emerald-400 font-mono">
                          +{formatCurrencyDZD(net)}
                        </div>
                        <div className="text-[10px] text-slate-500 line-through">
                          {formatCurrencyDZD(gross)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl text-center space-y-2">
              <Clock className="w-8 h-8 text-slate-600 mx-auto" />
              <h4 className="text-xs font-bold text-white">لا توجد رحلات منجزة بعد</h4>
              <p className="text-[11px] text-slate-400">ستظهر رحلاتك المكتملة وأرباحها المحققة هنا مباشرة فور إتمام أول مشوار.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};
