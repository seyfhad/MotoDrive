import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Coordinates } from '../../types';
import { ALGERIA_LOCATIONS, calculateDistanceKm, estimateDurationMinutes } from '../../utils/geo';
import { calculateFare, formatCurrencyDZD } from '../../utils/pricing';
import { MapPin, Navigation, ArrowLeft, Tag, Shield, Clock, Check, Search, X } from 'lucide-react';

interface BookRideModalProps {
  onClose: () => void;
  onRideBooked: () => void;
  initialPickup?: Coordinates | null;
  initialDestination?: Coordinates | null;
}

export const BookRideModal: React.FC<BookRideModalProps> = ({
  onClose,
  onRideBooked,
  initialPickup,
  initialDestination,
}) => {
  const { requestRide, pricing } = useApp();

  const [pickup, setPickup] = useState<Coordinates>(
    initialPickup || ALGERIA_LOCATIONS[2].coords // Default: Bab Ezzouar (حي 5 جويلية)
  );
  const [destination, setDestination] = useState<Coordinates>(
    initialDestination || ALGERIA_LOCATIONS[4].coords // Default: Grande Poste (البريد المركزي)
  );

  const [searchType, setSearchType] = useState<'pickup' | 'destination' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const distanceKm = calculateDistanceKm(pickup, destination);
  const estimatedDuration = estimateDurationMinutes(distanceKm);

  const discountPercent = appliedPromo === 'MOTO20' ? 20 : appliedPromo === 'SAHL10' ? 10 : 0;
  const fareBreakdown = calculateFare(distanceKm, estimatedDuration, pricing, discountPercent);

  const handleApplyPromo = () => {
    if (promoCode.trim().toUpperCase() === 'MOTO20' || promoCode.trim().toUpperCase() === 'SAHL10') {
      setAppliedPromo(promoCode.trim().toUpperCase());
      setErrorMsg(null);
    } else {
      setErrorMsg('رمز العرض الترويجي غير صالح أو منتهي');
    }
  };

  const handleConfirmRide = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);

    const res = await requestRide(pickup, destination, appliedPromo || undefined);
    setIsSubmitting(false);

    if (res.success) {
      onRideBooked();
    } else {
      setErrorMsg(res.error || 'فشل في إنشاء الطلب');
    }
  };

  // Filter locations
  const filteredLocations = ALGERIA_LOCATIONS.filter(
    loc =>
      loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.wilaya.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in" id="book-ride-modal">
      <div className="bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-5 text-right text-slate-100 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="text-center">
            <h3 className="text-base font-black text-white">تأكيد طلب الرحلة بالدراجة</h3>
            <p className="text-[11px] text-slate-400">سائق دراجة نارية معتمد يصلك في دقائق</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-sm">
            🏍️
          </div>
        </div>

        {/* Search Modal Drawer inside if selecting location */}
        {searchType ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSearchType(null)}
                className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder={searchType === 'pickup' ? 'ابحث عن موقع الانطلاق...' : 'ابحث عن الوجهة...'}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  autoFocus
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2.5 pr-9 pl-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                />
                <Search className="w-4 h-4 text-slate-500 absolute right-3 top-3" />
              </div>
            </div>

            {/* Current GPS option */}
            <button
              onClick={() => {
                const currentLoc = ALGERIA_LOCATIONS[0].coords;
                if (searchType === 'pickup') setPickup(currentLoc);
                else setDestination(currentLoc);
                setSearchType(null);
              }}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold transition-colors"
            >
              <Navigation className="w-4 h-4" />
              <span>استخدام موقعي الحالي عبر GPS</span>
            </button>

            {/* Hotspot Locations List */}
            <div className="space-y-1.5 max-h-60 overflow-y-auto">
              <div className="text-[11px] text-slate-400 font-semibold px-1">أماكن شهيرة ومحطات في الجزائر:</div>
              {filteredLocations.map((loc, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    if (searchType === 'pickup') setPickup(loc.coords);
                    else setDestination(loc.coords);
                    setSearchType(null);
                    setSearchQuery('');
                  }}
                  className="w-full text-right p-3 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800/80 transition-all flex items-center justify-between"
                >
                  <div className="truncate">
                    <div className="text-xs font-bold text-white">{loc.name}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{loc.wilaya}</div>
                  </div>
                  <MapPin className="w-4 h-4 text-slate-500 shrink-0" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Pickup & Destination Inputs */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 space-y-3 relative">
              <div className="absolute right-7 top-9 bottom-9 w-0.5 bg-dashed border-r border-slate-700 pointer-events-none"></div>

              {/* Pickup selector */}
              <button
                onClick={() => setSearchType('pickup')}
                className="w-full flex items-center justify-between text-right p-2 rounded-xl hover:bg-slate-900 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500 text-emerald-400 flex items-center justify-center text-xs shrink-0">
                    📍
                  </div>
                  <div className="truncate">
                    <div className="text-[10px] text-emerald-400 font-semibold">موقع الانطلاق (Pickup)</div>
                    <div className="text-xs font-bold text-white group-hover:text-amber-400 truncate">
                      {pickup.name || pickup.address || 'حدد موقع الانطلاق'}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] text-slate-500 underline">تغيير</span>
              </button>

              <div className="h-px bg-slate-800/80"></div>

              {/* Destination selector */}
              <button
                onClick={() => setSearchType('destination')}
                className="w-full flex items-center justify-between text-right p-2 rounded-xl hover:bg-slate-900 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-amber-500/20 border border-amber-500 text-amber-400 flex items-center justify-center text-xs shrink-0">
                    🏁
                  </div>
                  <div className="truncate">
                    <div className="text-[10px] text-amber-400 font-semibold">الوجهة المقصودة (Destination)</div>
                    <div className="text-xs font-bold text-white group-hover:text-amber-400 truncate">
                      {destination.name || destination.address || 'حدد الوجهة'}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] text-slate-500 underline">تغيير</span>
              </button>
            </div>

            {/* Distance & Time Metrics Bar */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center">
                  <Navigation className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">المسافة المقدرة</div>
                  <div className="text-sm font-black text-white">{distanceKm} كم</div>
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">المدة التقريبية</div>
                  <div className="text-sm font-black text-white">{estimatedDuration} دقيقة</div>
                </div>
              </div>
            </div>

            {/* Pricing Breakdown Card */}
            <div className="bg-gradient-to-br from-slate-950 to-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>سعر الانطلاق الأساسي:</span>
                <span>{pricing.baseFare} د.ج</span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>المسافة ({distanceKm} كم × {pricing.pricePerKm} د.ج):</span>
                <span>{fareBreakdown.distanceCost} د.ج</span>
              </div>
              {discountPercent > 0 && (
                <div className="flex items-center justify-between text-xs text-emerald-400 font-semibold">
                  <span>خصم كود العرض ({discountPercent}%):</span>
                  <span>- {fareBreakdown.discountAmount} د.ج</span>
                </div>
              )}

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-400 font-medium">السعر التقديري النهائي</div>
                  <div className="text-[10px] text-amber-500/80">الدفع نقدًا للسائق عند الوصول</div>
                </div>
                <div className="text-2xl font-black text-amber-400">
                  {formatCurrencyDZD(fareBreakdown.roundedPrice)}
                </div>
              </div>
            </div>

            {/* Promo Code Input */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="رمز العرض الترويجي (مثال: MOTO20)"
                value={promoCode}
                onChange={e => setPromoCode(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500 flex-1 uppercase"
              />
              <button
                onClick={handleApplyPromo}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-xl text-xs font-bold transition-colors"
              >
                تطبيق
              </button>
            </div>

            {appliedPromo && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl">
                <Check className="w-3.5 h-3.5" />
                <span>تم تطبيق الكود {appliedPromo} بنجاح!</span>
              </div>
            )}

            {errorMsg && (
              <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 p-2.5 rounded-xl">
                {errorMsg}
              </div>
            )}

            {/* Action Button */}
            <button
              id="confirm-ride-booking-btn"
              onClick={handleConfirmRide}
              disabled={isSubmitting}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-2xl shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 text-base transition-all active:scale-[0.98] disabled:opacity-50"
            >
              <span>{isSubmitting ? 'جاري إرسال الطلب...' : 'تأكيد طلب الرحلة الآن 🏍️'}</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};
