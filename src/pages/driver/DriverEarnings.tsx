import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../contexts/AppContext';
import { formatCurrencyDZD } from '../../utils/pricing';
import {
  Wallet,
  TrendingUp,
  Calendar,
  ArrowDownLeft,
  ShieldCheck,
  DollarSign,
  RefreshCw,
  BarChart3,
  Sparkles,
  ChevronLeft,
  MapPin,
  Clock,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';
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

  // --------------------------------------------------------------------------
  // Prepare Aggregated Chart Data (Daily & Weekly)
  // --------------------------------------------------------------------------
  const chartData = useMemo(() => {
    const arabicDays = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

    if (timeframe === 'daily') {
      // Last 7 days including today
      const days = [];
      const now = new Date();

      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        d.setHours(0, 0, 0, 0);

        const nextD = new Date(d);
        nextD.setDate(d.getDate() + 1);

        const dayName = i === 0 ? 'اليوم' : i === 1 ? 'أمس' : arabicDays[d.getDay()];
        const shortDate = `${d.getDate()}/${d.getMonth() + 1}`;

        // Find rides on this day
        const dayRides = completedRides.filter(r => {
          const rideDate = new Date(r.completedAt || r.updatedAt || r.createdAt || r.requestedAt);
          return rideDate >= d && rideDate < nextD;
        });

        const dayIncome = dayRides.reduce((sum, r) => {
          const gross = r.finalPrice || r.estimatedPrice || 0;
          return sum + (r.driverEarning || Math.round(gross * (1 - commissionRate)));
        }, 0);

        const dayGross = dayRides.reduce((sum, r) => sum + (r.finalPrice || r.estimatedPrice || 0), 0);

        days.push({
          label: dayName,
          fullDate: shortDate,
          income: dayIncome,
          gross: dayGross,
          trips: dayRides.length,
        });
      }
      return days;
    } else {
      // Last 4 weeks
      const weeks = [];
      const now = new Date();

      for (let i = 3; i >= 0; i--) {
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - (i + 1) * 7);
        const weekEnd = new Date(now);
        weekEnd.setDate(now.getDate() - i * 7);

        const weekLabel = i === 0 ? 'هذا الأسبوع' : i === 1 ? 'الأسبوع الماضي' : `منذ ${i} أسابيع`;

        const weekRides = completedRides.filter(r => {
          const rideDate = new Date(r.completedAt || r.updatedAt || r.createdAt || r.requestedAt);
          return rideDate >= weekStart && rideDate < weekEnd;
        });

        const weekIncome = weekRides.reduce((sum, r) => {
          const gross = r.finalPrice || r.estimatedPrice || 0;
          return sum + (r.driverEarning || Math.round(gross * (1 - commissionRate)));
        }, 0);

        const weekGross = weekRides.reduce((sum, r) => sum + (r.finalPrice || r.estimatedPrice || 0), 0);

        weeks.push({
          label: weekLabel,
          income: weekIncome,
          gross: weekGross,
          trips: weekRides.length,
        });
      }
      return weeks;
    }
  }, [completedRides, timeframe, commissionRate]);

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

  // Custom Arabic Tooltip for Recharts
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-950/95 border border-amber-500/40 rounded-2xl p-3 shadow-2xl text-right text-xs space-y-1.5 backdrop-blur-md min-w-[150px]">
          <div className="flex items-center justify-between pb-1 border-b border-slate-800 text-[11px] text-slate-400">
            <span>{data.fullDate || ''}</span>
            <span className="font-bold text-white">{data.label}</span>
          </div>
          <div className="flex items-center justify-between text-amber-400">
            <span className="text-[10px] text-slate-400">الصافي:</span>
            <span className="font-black text-sm">{formatCurrencyDZD(data.income)}</span>
          </div>
          <div className="flex items-center justify-between text-slate-300 text-[10px]">
            <span>التحصيل الكلي:</span>
            <span>{formatCurrencyDZD(data.gross)}</span>
          </div>
          <div className="flex items-center justify-between text-slate-400 text-[10px]">
            <span>عدد الرحلات:</span>
            <span className="font-bold text-white">{data.trips} رحلة</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="max-w-md mx-auto px-4 py-6 text-right text-slate-100 space-y-4 pb-24" id="driver-earnings-screen" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-white">محفظة وأرباح السائق</h2>
          <p className="text-xs text-slate-400">سجل الإيرادات والرسوم البيانية التفاعلية</p>
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

          {/* Interactive Income Chart Card with Recharts */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4" id="driver-income-chart-card">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">مخطط الدخل البياني</h3>
                  <p className="text-[10px] text-slate-400">تتبع الإيرادات اليومية والأسبوعية</p>
                </div>
              </div>

              {/* Timeframe Filter Buttons */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setTimeframe('daily')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    timeframe === 'daily'
                      ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  يومي
                </button>
                <button
                  type="button"
                  onClick={() => setTimeframe('weekly')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    timeframe === 'weekly'
                      ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  أسبوعي
                </button>
              </div>
            </div>

            {/* Recharts Bar Chart Container */}
            <div className="w-full h-56 pt-2" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis
                    dataKey="label"
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#334155' }}
                  />
                  <YAxis
                    stroke="#64748b"
                    fontSize={10}
                    tickLine={false}
                    axisLine={{ stroke: '#334155' }}
                    tickFormatter={(val) => `${val}`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="income"
                    radius={[6, 6, 0, 0]}
                    animationDuration={800}
                  >
                    {chartData.map((entry, index) => {
                      const isMax = entry.income > 0 && entry.income === Math.max(...chartData.map(d => d.income));
                      return (
                        <Cell
                          key={`cell-${index}`}
                          fill={isMax ? '#fbbf24' : '#f59e0b'}
                          fillOpacity={entry.income > 0 ? 0.95 : 0.25}
                        />
                      );
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Chart Subtitle / Insight */}
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
              <span>الفترة المعروضة: {timeframe === 'daily' ? 'آخر 7 أيام' : 'آخر 4 أسابيع'}</span>
              <span className="text-amber-400 font-bold">
                {timeframe === 'daily'
                  ? `أعلى دخل يومي: ${formatCurrencyDZD(Math.max(0, ...chartData.map(d => d.income)))}`
                  : `أعلى أسبوع: ${formatCurrencyDZD(Math.max(0, ...chartData.map(d => d.income)))}`}
              </span>
            </div>
          </div>

          {/* Recent Completed Trips History */}
          {completedRides.length > 0 && (
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
          )}
        </>
      )}

      {/* Empty State / Notice if driver has not worked yet */}
      {totalTrips === 0 && !isLoadingEarnings && (
        <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-3xl text-center space-y-2">
          <DollarSign className="w-8 h-8 text-slate-600 mx-auto" />
          <h4 className="text-xs font-bold text-white">لا توجد أرباح مسجلة بعد</h4>
          <p className="text-[11px] text-slate-400 leading-relaxed max-w-xs mx-auto">
            حسابك لم يقم بإتمام أي رحلة بعد. قم بتفعيل وضع Online واستقبال طلبات الركاب لبدء جني الأرباح وظهورها في المخطط البياني!
          </p>
        </div>
      )}

      {/* Transparency Note */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-3xl space-y-2 text-xs text-slate-400 leading-relaxed">
        <div className="flex items-center gap-2 text-slate-200 font-bold">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>الأرباح كاملة للسائق (عمولة المنصة 0%):</span>
        </div>
        <p className="text-[11px]">
          تم إلغاء عمولة المنصة بالكامل (0%)، حيث يستلم السائق إجمالي المبلغ كاملاً 100% نقدًا (Cash) مباشرة من الراكب عند وصول الوجهة دون أي اقتطاع.
        </p>
      </div>
    </div>
  );
};
