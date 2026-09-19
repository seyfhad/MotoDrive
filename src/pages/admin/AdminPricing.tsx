import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { formatCurrencyDZD } from '../../utils/pricing';
import { DollarSign, Save, RefreshCw, CheckCircle2, ShieldAlert, Sparkles, Percent } from 'lucide-react';

export const AdminPricing: React.FC = () => {
  const { pricing, updatePricing } = useApp();

  const [baseFare, setBaseFare] = useState(pricing.baseFare);
  const [pricePerKm, setPricePerKm] = useState(pricing.pricePerKm);
  const [pricePerMinute, setPricePerMinute] = useState(pricing.pricePerMinute);
  const [minimumFare, setMinimumFare] = useState(pricing.minimumFare);
  const [cancellationFee, setCancellationFee] = useState(pricing.cancellationFee);
  const [platformCommissionPercent, setPlatformCommissionPercent] = useState(pricing.platformCommissionPercent);
  const [nightMultiplier, setNightMultiplier] = useState(pricing.nightMultiplier);
  const [peakHourMultiplier, setPeakHourMultiplier] = useState(pricing.peakHourMultiplier);

  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updatePricing({
      baseFare,
      pricePerKm,
      pricePerMinute,
      minimumFare,
      cancellationFee,
      platformCommissionPercent,
      nightMultiplier,
      peakHourMultiplier,
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  // Example test calculator
  const testDist = 6;
  const testTime = 12;
  const testRaw = baseFare + testDist * pricePerKm + testTime * pricePerMinute;
  const testTotal = Math.max(minimumFare, Math.round(testRaw / 10) * 10);
  const testCommission = Math.round(testTotal * (platformCommissionPercent / 100));
  const testDriverNet = testTotal - testCommission;

  return (
    <div className="space-y-6 text-right text-slate-100 max-w-4xl" id="admin-pricing-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-black text-white">إعدادات التسعير والعمولة (Pricing & Commission)</h2>
          <p className="text-xs text-slate-400">
            تعديل معادلة احتساب تسعيرة النقل بالدراجة النارية وعمولة منصة MotoDrive في الجزائر
          </p>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3.5 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl text-xs text-emerald-300 font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>تم حفظ الإعدادات بنجاح وتطبيقها فوراً على جميع الرحلات القادمة!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pricing Inputs Form */}
        <div className="bg-slate-900 border border-slate-800/90 rounded-3xl p-5 space-y-4 shadow-xl">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-amber-400" />
            <span>عناصر تسعيرة الرحلة (بالدينار الجزائري DZD)</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">سعر الانطلاق الأساسي (Base Fare):</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={baseFare}
                  onChange={e => setBaseFare(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-bold"
                  min="0"
                />
                <span className="text-slate-400 shrink-0 font-bold">د.ج</span>
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-semibold">سعر الكيلومتر الواحد (Price per KM):</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={pricePerKm}
                  onChange={e => setPricePerKm(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-bold"
                  min="0"
                />
                <span className="text-slate-400 shrink-0 font-bold">د.ج / كم</span>
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-semibold">سعر الدقيقة (Price per Minute):</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={pricePerMinute}
                  onChange={e => setPricePerMinute(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-bold"
                  min="0"
                />
                <span className="text-slate-400 shrink-0 font-bold">د.ج / دقيقة</span>
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-semibold">الحد الأدنى للرحلة (Minimum Fare):</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={minimumFare}
                  onChange={e => setMinimumFare(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-bold"
                  min="0"
                />
                <span className="text-slate-400 shrink-0 font-bold">د.ج</span>
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-semibold">نسبة عمولة المنصة (MotoDrive Commission %):</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={platformCommissionPercent}
                  onChange={e => setPlatformCommissionPercent(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-amber-400 font-black text-sm"
                  min="0"
                  max="100"
                />
                <span className="text-amber-400 shrink-0 font-black">%</span>
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-semibold">رسوم إلغاء الرحلة بعد تحرك السائق:</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={cancellationFee}
                  onChange={e => setCancellationFee(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-bold"
                  min="0"
                />
                <span className="text-slate-400 shrink-0 font-bold">د.ج</span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-sm transition-all shadow-lg flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>حفظ وتطبيق أسعار المنصة</span>
          </button>
        </div>

        {/* Live Simulation & Live Calculator Card */}
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>محاكاة تجريبية لحساب رحلة (مثال: 6 كم / 12 دقيقة)</span>
            </h3>

            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span>سعر الانطلاق:</span>
                <span className="text-white font-semibold">{baseFare} د.ج</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>المسافة (6 كم × {pricePerKm} د.ج):</span>
                <span className="text-white font-semibold">{6 * pricePerKm} د.ج</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>الوقت (12 دقيقة × {pricePerMinute} د.ج):</span>
                <span className="text-white font-semibold">{12 * pricePerMinute} د.ج</span>
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-sm font-black text-amber-400">
                <span>إجمالي سعر الراكب:</span>
                <span>{formatCurrencyDZD(testTotal)}</span>
              </div>

              <div className="flex items-center justify-between text-red-400 font-semibold pt-1">
                <span>عمولة MotoDrive ({platformCommissionPercent}%):</span>
                <span>- {formatCurrencyDZD(testCommission)}</span>
              </div>

              <div className="flex items-center justify-between text-emerald-400 font-bold pt-1 border-t border-slate-800/80">
                <span>صافي ربح السائق:</span>
                <span>{formatCurrencyDZD(testDriverNet)}</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              تساعد دراجات MotoDrive الركاب في توفير ما يصل إلى 50% من زمن الرحلة في أوقات الذروة وازدحام شوارع الجزائر العاصمة، مع تقديم تسعيرة اقتصادية ومجزية للسائق.
            </p>
          </div>
        </div>
      </form>
    </div>
  );
};
