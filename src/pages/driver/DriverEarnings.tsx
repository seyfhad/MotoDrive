import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { formatCurrencyDZD } from '../../utils/pricing';
import { Wallet, TrendingUp, Calendar, ArrowDownLeft, ShieldCheck, DollarSign, RefreshCw } from 'lucide-react';
import { EarningsSummarySkeleton } from '../../components/shared/Skeleton';
import { supabaseService } from '../../services/supabaseService';

export const DriverEarnings: React.FC = () => {
  const { activeDriver, rides, pricing } = useApp();
  const [isLoadingEarnings, setIsLoadingEarnings] = useState<boolean>(true);

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
  const completedRides = rides.filter(
    r => (r.driverId === activeDriver.id || r.driverId === activeDriver.phone) && r.status === 'completed'
  );

  const totalTrips = completedRides.length;

  const totalGrossDZD = completedRides.reduce(
    (sum, r) => sum + (r.finalPrice || r.estimatedPrice || 0),
    0
  );

  const totalEarningsDZD = completedRides.reduce(
    (sum, r) => sum + (r.driverEarning || Math.round((r.finalPrice || r.estimatedPrice || 0) * (1 - (pricing.platformCommissionPercent || 15) / 100))),
    0
  );

  const totalCommissionDZD = totalGrossDZD - totalEarningsDZD;

  return (
    <div className="max-w-md mx-auto px-4 py-6 text-right text-slate-100 space-y-4 pb-24" id="driver-earnings-screen" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-white">محفظة وأرباح السائق</h2>
          <p className="text-xs text-slate-400">سجل الأرباح والعمولات المتزامن مع Supabase</p>
        </div>
        <div className="flex items-center gap-2">
          <button
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
          {/* Real Net Earnings Card */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-amber-500/30 rounded-3xl p-5 shadow-2xl space-y-4 animate-in fade-in duration-300">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>إجمالي الأرباح الفعلية:</span>
              <span className="text-amber-400 font-bold">{totalTrips} رحلة مكتملة</span>
            </div>

            <div className="text-3xl font-black text-amber-400">
              {formatCurrencyDZD(totalEarningsDZD)}
            </div>

            {/* Breakdown details */}
            <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-3.5 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-300">
                <span>عدد الرحلات المكتملة:</span>
                <span className="font-bold text-white">{totalTrips} رحلة</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>إجمالي تحصيل الركاب (المبلغ الكلي):</span>
                <span className="font-bold text-white">{formatCurrencyDZD(totalGrossDZD)}</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>عمولة التطبيق ({pricing.platformCommissionPercent || 15}%):</span>
                <span className="font-bold text-red-400">-{formatCurrencyDZD(totalCommissionDZD)}</span>
              </div>
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between font-bold text-emerald-400">
                <span>الصافي الفعلي للسائق:</span>
                <span>{formatCurrencyDZD(totalEarningsDZD)}</span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Empty State / Notice if driver has not worked yet */}
      {totalTrips === 0 && (
        <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-3xl text-center space-y-2">
          <DollarSign className="w-8 h-8 text-slate-600 mx-auto" />
          <h4 className="text-xs font-bold text-white">لا توجد أرباح مسجلة بعد</h4>
          <p className="text-[11px] text-slate-400 leading-relaxed max-w-xs mx-auto">
            حسابك جديد ولم يقم بإتمام أي رحلة بعد. قم بتفعيل وضع Online واستقبال طلبات الركاب لبدء جني الأرباح!
          </p>
        </div>
      )}

      {/* Transparency Note */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-3xl space-y-2 text-xs text-slate-400 leading-relaxed">
        <div className="flex items-center gap-2 text-slate-200 font-bold">
          <ShieldCheck className="w-4 h-4 text-amber-400" />
          <span>تحصيل المبالغ نقدياً:</span>
        </div>
        <p className="text-[11px]">
          يقوم السائق بتحصيل المبلغ نقدًا (Cash) مباشرة من الراكب عند وصول الوجهة بنجاح.
        </p>
      </div>
    </div>
  );
};
