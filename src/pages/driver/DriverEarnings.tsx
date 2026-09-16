import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { formatCurrencyDZD } from '../../utils/pricing';
import { Wallet, TrendingUp, Calendar, ArrowDownLeft, ShieldCheck, DollarSign } from 'lucide-react';

export const DriverEarnings: React.FC = () => {
  const { activeDriver, rides, pricing } = useApp();
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('today');

  const driverRides = rides.filter(r => r.driverId === activeDriver.id && r.status === 'completed');

  // Stats calculation as per prompt section 50
  const stats = {
    today: {
      trips: 8,
      gross: 3200,
      commission: 480, // 15%
      net: 2720,
    },
    week: {
      trips: 56,
      gross: 26350,
      commission: 3950,
      net: 22400,
    },
    month: {
      trips: 218,
      gross: 102940,
      commission: 15440,
      net: 87500,
    },
  }[period];

  return (
    <div className="max-w-md mx-auto px-4 py-6 text-right text-slate-100 space-y-4 pb-24" id="driver-earnings-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-white">محفظة وأرباح السائق</h2>
          <p className="text-xs text-slate-400">ملخص الإيرادات والعمولة بعد كل رحلة</p>
        </div>
        <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
          <Wallet className="w-5 h-5" />
        </div>
      </div>

      {/* Period Filter */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-2xl text-xs font-bold">
        <button
          onClick={() => setPeriod('today')}
          className={`flex-1 py-2 rounded-xl transition-all ${
            period === 'today' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400'
          }`}
        >
          اليوم
        </button>
        <button
          onClick={() => setPeriod('week')}
          className={`flex-1 py-2 rounded-xl transition-all ${
            period === 'week' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400'
          }`}
        >
          هذا الأسبوع
        </button>
        <button
          onClick={() => setPeriod('month')}
          className={`flex-1 py-2 rounded-xl transition-all ${
            period === 'month' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400'
          }`}
        >
          هذا الشهر
        </button>
      </div>

      {/* Net Earnings Big Card - Faithful to Prompt Section 50 */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-amber-500/30 rounded-3xl p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>صافي الأرباح القابلة للسحب:</span>
          <span className="text-emerald-400 font-bold">نسبة العمولة: {pricing.platformCommissionPercent}%</span>
        </div>

        <div className="text-3xl font-black text-amber-400">
          {formatCurrencyDZD(stats.net)}
        </div>

        {/* Breakdown details */}
        <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-3.5 space-y-2 text-xs">
          <div className="flex items-center justify-between text-slate-300">
            <span>عدد الرحلات المكتملة:</span>
            <span className="font-bold text-white">{stats.trips} رحلة</span>
          </div>
          <div className="flex items-center justify-between text-slate-300">
            <span>إجمالي المحصل من الركاب (Gross):</span>
            <span className="font-bold text-white">{formatCurrencyDZD(stats.gross)}</span>
          </div>
          <div className="flex items-center justify-between text-red-400">
            <span>عمولة تطبيق MotoDZ ({pricing.platformCommissionPercent}%):</span>
            <span className="font-bold">- {formatCurrencyDZD(stats.commission)}</span>
          </div>
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between font-bold text-emerald-400">
            <span>الصافي للسائق:</span>
            <span>{formatCurrencyDZD(stats.net)}</span>
          </div>
        </div>
      </div>

      {/* Commission transparency information */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-3xl space-y-2 text-xs text-slate-400 leading-relaxed">
        <div className="flex items-center gap-2 text-slate-200 font-bold">
          <ShieldCheck className="w-4 h-4 text-amber-400" />
          <span>شفافية الحسابات والتحصيل:</span>
        </div>
        <p className="text-[11px]">
          يقوم السائق بتحصيل المبلغ كاملاً نقدًا (Cash) مباشرة من الراكب عند الوصول. يتم خصم عمولة MotoDZ ({pricing.platformCommissionPercent}%) آلياً من رصيد المحفظة الإلكترونية.
        </p>
      </div>
    </div>
  );
};
