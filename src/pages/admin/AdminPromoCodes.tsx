import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { PromoCode } from '../../types';
import {
  Tag,
  Plus,
  Check,
  Trash2,
  Calendar,
  Sparkles,
  Percent,
  DollarSign,
  Power,
  AlertCircle,
  Copy,
  CheckCheck,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { formatCurrencyDZD } from '../../utils/pricing';

export const AdminPromoCodes: React.FC = () => {
  const { promoCodes = [], addPromoCode, togglePromoCode, deletePromoCode } = useApp();

  // Quick inline creation state
  const [quickCode, setQuickCode] = useState('');
  const [quickType, setQuickType] = useState<'fixed' | 'percent'>('fixed');
  const [quickValue, setQuickValue] = useState<number>(50);
  const [quickLoading, setQuickLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Advanced modal creation state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent');
  const [discountPercent, setDiscountPercent] = useState<number>(20);
  const [discountFixed, setDiscountFixed] = useState<number>(100);
  const [maxDiscount, setMaxDiscount] = useState<number>(150);
  const [maxUsageLimit, setMaxUsageLimit] = useState<number>(50);
  const [expiresAt, setExpiresAt] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const activeCount = promoCodes.filter((p) => p.isActive).length;
  const totalUsages = promoCodes.reduce((sum, p) => sum + (p.usageCount || 0), 0);

  // Handle Quick Add Promo Code
  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = quickCode.trim().toUpperCase();
    if (!clean) {
      setFeedbackMsg({ type: 'error', text: 'يرجى إدخال رمز كود الخصم أولاً' });
      return;
    }

    if (promoCodes.some((p) => p.code.toUpperCase() === clean)) {
      setFeedbackMsg({ type: 'error', text: `رمز الكود (${clean}) موجود مسبقاً في النظام!` });
      return;
    }

    setQuickLoading(true);
    try {
      const d = new Date();
      d.setFullYear(d.getFullYear() + 1); // 1 year expiration by default

      const newPromo: PromoCode = {
        code: clean,
        discountType: quickType,
        discountValue: Number(quickValue),
        discountPercent: quickType === 'percent' ? Number(quickValue) : undefined,
        maxDiscount: quickType === 'percent' ? 200 : Number(quickValue),
        isActive: true,
        expiresAt: d.toISOString(),
        usageCount: 0,
      };

      await addPromoCode(newPromo);
      setQuickCode('');
      setFeedbackMsg({
        type: 'success',
        text: `تم تفعيل كود الخصم (${clean}) بنجاح! يمكن للركاب استخدامه الآن عند طلب الرحلة.`,
      });
      setTimeout(() => setFeedbackMsg(null), 4000);
    } catch {
      setFeedbackMsg({ type: 'error', text: 'حدث خطأ أثناء حفظ الكود' });
    } finally {
      setQuickLoading(false);
    }
  };

  // Handle Modal Create
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      setErrorMsg('يرجى إدخال رمز الكوبون');
      return;
    }

    if (promoCodes.some((p) => p.code.toUpperCase() === cleanCode)) {
      setErrorMsg('رمز الكوبون موجود مسبقاً، يرجى اختيار رمز آخر');
      return;
    }

    const newPromo: PromoCode = {
      code: cleanCode,
      discountType,
      discountValue: discountType === 'percent' ? Number(discountPercent) : Number(discountFixed),
      discountPercent: Number(discountPercent) || 10,
      maxDiscount: discountType === 'percent' ? Number(maxDiscount) || 150 : Number(discountFixed),
      maxUsageLimit: Number(maxUsageLimit) || undefined,
      isActive: true,
      expiresAt: new Date(expiresAt).toISOString(),
      usageCount: 0,
    };

    if (addPromoCode) {
      await addPromoCode(newPromo);
    }
    setShowCreateModal(false);
    setCode('');
    setErrorMsg(null);
    setFeedbackMsg({
      type: 'success',
      text: `تم إنشاء كود الخصم (${cleanCode}) بنجاح!`,
    });
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const handleDelete = async (promoCode: string) => {
    try {
      await deletePromoCode(promoCode);
      setFeedbackMsg({
        type: 'success',
        text: `تم حذف كود الخصم (${promoCode}) نهائياً من النظام ولن يعمل لدى أي راكب.`,
      });
      setTimeout(() => setFeedbackMsg(null), 3500);
    } catch {
      setFeedbackMsg({ type: 'error', text: 'تعذر حذف الكود' });
    }
  };

  const handleCopy = (c: string) => {
    navigator.clipboard.writeText(c);
    setCopiedCode(c);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="space-y-6 text-right text-slate-100 max-w-5xl" id="admin-promo-codes-screen" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-black text-white">إدارة أكواد الخصم والعروض (Promo Codes)</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            الأكواد المضافة والمفعلة هنا فقط هي التي ستعمل وتطبق عند كتابتها من قِبل الركاب في واجهة طلب الرحلة
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-2xl text-xs flex items-center justify-center gap-2 transition-all border border-slate-700 cursor-pointer"
        >
          <Plus className="w-4 h-4 text-amber-400" />
          <span>خيارات متقدمة للكود</span>
        </button>
      </div>

      {/* Feedback Banner */}
      {feedbackMsg && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-black flex items-center gap-2 animate-in fade-in ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
              : 'bg-red-500/15 border border-red-500/30 text-red-300'
          }`}
        >
          {feedbackMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          )}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* QUICK ADD PROMO CODE CARD (Prominent in Admin Panel) */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-950 border-2 border-amber-500/40 rounded-3xl p-5 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">إضافة وتفعيل كود خصم فوري للركاب</h3>
              <p className="text-[11px] text-slate-400">
                اكتب الرمز وقيمة الخصم وسيتم تفعيله وتطبيقه في قاعدة البيانات فوراً
              </p>
            </div>
          </div>
          <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full">
            تفعيل مباشر ⚡
          </span>
        </div>

        <form onSubmit={handleQuickAdd} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end pt-1">
          {/* Code input */}
          <div className="md:col-span-4 space-y-1">
            <label className="text-xs font-bold text-slate-300 block">رمز الكود:</label>
            <input
              type="text"
              value={quickCode}
              onChange={(e) => setQuickCode(e.target.value.toUpperCase())}
              placeholder="مثال: MOTO20، CHLEF50، RAMADAN"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white uppercase placeholder:text-slate-600 focus:outline-none focus:border-amber-500 font-mono font-bold"
            />
          </div>

          {/* Discount type */}
          <div className="md:col-span-3 space-y-1">
            <label className="text-xs font-bold text-slate-300 block">نوع الخصم:</label>
            <div className="grid grid-cols-2 gap-1 bg-slate-950 border border-slate-800 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setQuickType('fixed')}
                className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                  quickType === 'fixed'
                    ? 'bg-amber-500 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                ثابت (د.ج)
              </button>
              <button
                type="button"
                onClick={() => setQuickType('percent')}
                className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                  quickType === 'percent'
                    ? 'bg-amber-500 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                نسبة (%)
              </button>
            </div>
          </div>

          {/* Discount value */}
          <div className="md:col-span-2 space-y-1">
            <label className="text-xs font-bold text-slate-300 block">
              {quickType === 'fixed' ? 'القيمة (د.ج):' : 'النسبة (%):'}
            </label>
            <input
              type="number"
              min="1"
              max={quickType === 'percent' ? 90 : 500}
              step={quickType === 'fixed' ? 10 : 1}
              value={quickValue}
              onChange={(e) => setQuickValue(Math.max(1, Number(e.target.value)))}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-amber-400 font-black text-center focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Submit button */}
          <div className="md:col-span-3">
            <button
              type="submit"
              disabled={quickLoading}
              className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-amber-500/20 active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة وتفعيل الكود فوراً</span>
            </button>
          </div>
        </form>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-3 gap-3.5">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs text-slate-400 font-semibold mb-1">إجمالي الأكواد</div>
          <div className="text-2xl font-black text-white">{promoCodes.length}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">كوبونات مسجلة بالنظام</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs text-slate-400 font-semibold mb-1">الأكواد الفعالة حالياً</div>
          <div className="text-2xl font-black text-emerald-400">{activeCount}</div>
          <div className="text-[10px] text-emerald-400/80 mt-0.5">متاحة ومطبقة للركاب</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs text-slate-400 font-semibold mb-1">إجمالي مرات الاستخدام</div>
          <div className="text-2xl font-black text-amber-400">{totalUsages}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">رحلة مستفيدة من التخفيض</div>
        </div>
      </div>

      {/* Promo Codes Cards Grid */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-300">قائمة الأكواد المضافة في النظام:</h3>

        {promoCodes.length === 0 ? (
          <div className="text-center py-14 bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-2">
            <Tag className="w-10 h-10 text-slate-600 mx-auto" />
            <h4 className="text-sm font-bold text-slate-300">لا توجد أكواد خصم مضافة حالياً</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              لن يتمكن أي راكب من تفعيل أي كود خصم في شاشة حجز الرحلات حتى تقوم بإنشاء وتفعيل كود جديد من خلال الحقل أعلاه.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {promoCodes.map((promo) => {
              const isExpired = promo.expiresAt && new Date(promo.expiresAt).getTime() < Date.now();
              const isLimitReached =
                promo.maxUsageLimit && promo.maxUsageLimit > 0
                  ? (promo.usageCount || 0) >= promo.maxUsageLimit
                  : false;
              const isUsable = promo.isActive && !isExpired && !isLimitReached;

              return (
                <div
                  key={promo.code}
                  className={`border rounded-3xl p-4 space-y-3 transition-all relative overflow-hidden ${
                    isUsable
                      ? 'bg-slate-900 border-slate-800 hover:border-amber-500/40 shadow-lg'
                      : 'bg-slate-950/60 border-slate-900 opacity-70'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-base font-black text-amber-400 tracking-wider bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800">
                        {promo.code}
                      </span>
                      <button
                        onClick={() => handleCopy(promo.code)}
                        className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                        title="نسخ الرمز"
                      >
                        {copiedCode === promo.code ? (
                          <CheckCheck className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                        isExpired
                          ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                          : isLimitReached
                          ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                          : promo.isActive
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {isExpired
                        ? 'منتهي الصلاحية'
                        : isLimitReached
                        ? 'اكتمل الحد'
                        : promo.isActive
                        ? 'مفعل ✓'
                        : 'معطل'}
                    </span>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">قيمة التخفيض:</span>
                      <span className="font-bold text-white">
                        {promo.discountType === 'fixed'
                          ? `خصم ثابت ${formatCurrencyDZD(promo.discountValue || promo.maxDiscount)}`
                          : `خصم ${promo.discountValue || promo.discountPercent}% (بحد أقصى ${formatCurrencyDZD(promo.maxDiscount)})`}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-400">مرات الاستخدام:</span>
                      <span className="font-bold text-white font-mono">
                        {promo.usageCount || 0}{' '}
                        {promo.maxUsageLimit ? `/ ${promo.maxUsageLimit} أقصى حد` : '(غير محدود)'}
                      </span>
                    </div>

                    {promo.expiresAt && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">تاريخ الصلاحية:</span>
                        <span className="text-slate-300 font-mono text-[11px]">
                          {new Date(promo.expiresAt).toLocaleDateString('ar-DZ')}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions: Toggle Active and Dedicated Delete Button */}
                  <div className="flex items-center gap-2 pt-1 border-t border-slate-800/80">
                    <button
                      onClick={() => togglePromoCode && togglePromoCode(promo.code)}
                      className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        promo.isActive
                          ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/30'
                          : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30'
                      }`}
                    >
                      <Power className="w-3.5 h-3.5" />
                      <span>{promo.isActive ? 'تعطيل الكود' : 'تفعيل الكود'}</span>
                    </button>

                    <button
                      onClick={() => handleDelete(promo.code)}
                      className="py-1.5 px-3 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30 transition-all flex items-center justify-center gap-1.5 text-xs font-bold cursor-pointer"
                      title="حذف كود الخصم نهائياً"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>حذف الكود</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Advanced Create Promo Code Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 text-right space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h4 className="text-base font-black text-white flex items-center gap-2">
                <Tag className="w-4 h-4 text-amber-400" />
                <span>إنشاء كود خصم مخصص (خيارات متقدمة)</span>
              </h4>
              <button
                onClick={() => setShowCreateModal(false)}
                className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">رمز الكوبون:</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="مثال: MOTO20، RAMADAN، CHLEF"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono uppercase focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">نوع التخفيض:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDiscountType('percent')}
                    className={`py-2 px-3 rounded-xl border font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      discountType === 'percent'
                        ? 'bg-amber-500 text-slate-950 border-amber-400 font-black'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    <Percent className="w-3.5 h-3.5" />
                    <span>نسبة مئوية (%)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiscountType('fixed')}
                    className={`py-2 px-3 rounded-xl border font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      discountType === 'fixed'
                        ? 'bg-amber-500 text-slate-950 border-amber-400 font-black'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>مبلغ ثابت (د.ج)</span>
                  </button>
                </div>
              </div>

              {discountType === 'percent' ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">نسبة الخصم (%):</label>
                    <input
                      type="number"
                      min="1"
                      max="90"
                      value={discountPercent}
                      onChange={(e) => setDiscountPercent(Number(e.target.value))}
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-bold text-center focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">أقصى خصم (د.ج):</label>
                    <input
                      type="number"
                      min="10"
                      value={maxDiscount}
                      onChange={(e) => setMaxDiscount(Number(e.target.value))}
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-bold text-center focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-slate-300 font-bold mb-1">مبلغ التخفيض الثابت (د.ج):</label>
                  <input
                    type="number"
                    min="10"
                    step="10"
                    value={discountFixed}
                    onChange={(e) => setDiscountFixed(Number(e.target.value))}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-bold text-center focus:border-amber-500 focus:outline-none"
                  />
                </div>
              )}

              {/* Usage Limit & Expiration */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">أقصى عدد استخدامات:</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="مثال: 50"
                    value={maxUsageLimit}
                    onChange={(e) => setMaxUsageLimit(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-bold text-center focus:border-amber-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-500">اتركه فارغاً لعدد غير محدود</span>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">تاريخ الانتهاء:</label>
                  <input
                    type="date"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono text-center focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold flex-1 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl flex-1 shadow-lg shadow-amber-500/20 cursor-pointer"
                >
                  إنشاء وتفعيل الكود
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
