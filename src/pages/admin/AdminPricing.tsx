import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import {
  formatCurrencyDZD,
  DISTANCE_PRICING_TIERS,
  calculateFare,
  getTieredFareByDistance,
} from '../../utils/pricing';
import { DollarSign, Save, RefreshCw, CheckCircle2, ShieldAlert, Sparkles, Percent, MapPin, Gauge } from 'lucide-react';

export const AdminPricing: React.FC = () => {
  const { pricing, updatePricing } = useApp();

  const [baseFare, setBaseFare] = useState(pricing.baseFare ?? 110);
  const [pricePerKm, setPricePerKm] = useState(pricing.pricePerKm ?? 25);
  const [pricePerMinute, setPricePerMinute] = useState(pricing.pricePerMinute ?? 2);
  const [minimumFare, setMinimumFare] = useState(pricing.minimumFare ?? 110);
  const [cancellationFee, setCancellationFee] = useState(pricing.cancellationFee ?? 100);
  const [platformCommissionPercent, setPlatformCommissionPercent] = useState(pricing.platformCommissionPercent ?? 0);
  const [nightMultiplier, setNightMultiplier] = useState(pricing.nightMultiplier ?? 1.0);
  const [peakMultiplier, setPeakMultiplier] = useState(pricing.peakMultiplier ?? 1.0);

  const [saveSuccess, setSaveSuccess] = useState(false);

  React.useEffect(() => {
    setBaseFare(pricing.baseFare ?? 110);
    setPricePerKm(pricing.pricePerKm ?? 25);
    setPricePerMinute(pricing.pricePerMinute ?? 2);
    setMinimumFare(pricing.minimumFare ?? 110);
    setCancellationFee(pricing.cancellationFee ?? 100);
    setPlatformCommissionPercent(pricing.platformCommissionPercent ?? 0);
    setNightMultiplier(pricing.nightMultiplier ?? 1.0);
    setPeakMultiplier(pricing.peakMultiplier ?? 1.0);
  }, [pricing]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updatePricing({
      ...pricing,
      baseFare: Number(baseFare) >= 0 ? Number(baseFare) : 110,
      pricePerKm: Number(pricePerKm) >= 0 ? Number(pricePerKm) : 25,
      pricePerMinute: Number(pricePerMinute) >= 0 ? Number(pricePerMinute) : 2,
      minimumFare: Number(minimumFare) >= 0 ? Number(minimumFare) : 110,
      cancellationFee: Number(cancellationFee) >= 0 ? Number(cancellationFee) : 100,
      platformCommissionPercent: Number(platformCommissionPercent) >= 0 ? Number(platformCommissionPercent) : 0,
      nightMultiplier: Number(nightMultiplier) || 1.0,
      peakMultiplier: Number(peakMultiplier) || 1.0,
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Live test distance state & calculation
  const [testDistance, setTestDistance] = useState<number>(6);
  const testBreakdown = calculateFare(testDistance, 10, {
    ...pricing,
    baseFare: Number(baseFare) || 110,
    minimumFare: Number(minimumFare) || 110,
    platformCommissionPercent: Number(platformCommissionPercent) ?? 0,
  });

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

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">معامل الساعات الليلية (Night Multiplier):</label>
                <input
                  type="number"
                  step="0.05"
                  value={nightMultiplier}
                  onChange={e => setNightMultiplier(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-bold"
                  min="1"
                  max="3"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">معامل ساعات الذروة (Peak Multiplier):</label>
                <input
                  type="number"
                  step="0.05"
                  value={peakMultiplier}
                  onChange={e => setPeakMultiplier(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-bold"
                  min="1"
                  max="3"
                />
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
          {/* Approved Tiered Scale Card */}
          <div className="bg-slate-900 border border-amber-500/30 rounded-3xl p-5 space-y-3 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2">
                <span>🏍️</span>
                <span>سلم التسعيرة والمسافات المعتمد (Algeria Moto Scale)</span>
              </h3>
              <span className="text-[10px] text-slate-400">نظام الشرائح المعتمد</span>
            </div>

            {/* List of Tiers with Visual Progression */}
            <div className="space-y-1.5 text-xs max-h-72 overflow-y-auto pr-1">
              {DISTANCE_PRICING_TIERS.map((tier, idx) => (
                <div
                  key={idx}
                  className={`flex items-center justify-between p-2 rounded-xl border transition-colors ${
                    testDistance >= tier.minKm && testDistance <= tier.maxKm
                      ? 'bg-amber-500/15 border-amber-500/50 text-amber-300 font-bold'
                      : 'bg-slate-950 border-slate-800/80 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                    <span>{tier.label}:</span>
                  </div>
                  <span className="font-black text-amber-400 font-mono">{tier.fareDZD} د.ج</span>
                </div>
              ))}

              <div className="flex items-center justify-between p-2 rounded-xl bg-rose-950/30 border border-rose-500/40 text-rose-300">
                <span className="font-bold">أقصى مسافة مسموحة للرحلة:</span>
                <span className="font-black text-rose-400">70 كم (ممنوع تجاوزها)</span>
              </div>
            </div>
          </div>

          {/* Interactive Calculator Simulation Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>محاكي فوري لحساب أي مسافة</span>
              </h3>
              <span className="text-[10px] text-emerald-400 font-bold font-mono">
                {testBreakdown.tierLabel}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-400 font-semibold">
                <label>حدد مسافة التجربة:</label>
                <div className="flex items-center gap-1 font-mono text-white text-sm font-black">
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="70"
                    value={testDistance}
                    onChange={e => setTestDistance(Math.min(70, Math.max(0.5, Number(e.target.value) || 1)))}
                    className="w-16 bg-slate-950 border border-slate-800 rounded-lg p-1 text-center font-bold text-amber-400"
                  />
                  <span>كم</span>
                </div>
              </div>

              <input
                type="range"
                min="0.5"
                max="70"
                step="0.5"
                value={testDistance}
                onChange={e => setTestDistance(Number(e.target.value))}
                className="w-full accent-amber-500 bg-slate-950 cursor-pointer"
              />

              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 space-y-2 text-xs mt-3">
                <div className="flex items-center justify-between text-slate-400">
                  <span>سعر الرحلة الإجمالي للمسافة ({testDistance} كم):</span>
                  <span className="text-amber-400 font-black text-sm font-mono">
                    {formatCurrencyDZD(testBreakdown.roundedPrice)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-400">
                  <span>عمولة المنصة ({platformCommissionPercent}%):</span>
                  <span className="text-red-400 font-bold font-mono">
                    -{formatCurrencyDZD(testBreakdown.platformCommission)}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between font-bold text-emerald-400">
                  <span>صافي ربح السائق الفعلي:</span>
                  <span className="text-sm font-black font-mono">
                    {formatCurrencyDZD(testBreakdown.driverEarning)}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              يتم تطبيق هذا السلم فوراً على جميع حسابات الركاب والسائقين في محاكاة الأسعار وحجز المشاوير.
            </p>
          </div>
        </div>
      </form>
    </div>
  );
};
