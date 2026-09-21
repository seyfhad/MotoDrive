import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Coordinates } from '../../types';
import {
  ALGERIA_LOCATIONS,
  FEATURED_WILAYAS,
  ALL_58_WILAYAS,
  findNearestLocalLocation,
  calculateDistanceKm,
  estimateDurationMinutes,
  reverseGeocodeCoords,
  searchAlgeriaPlaces,
} from '../../utils/geo';
import { calculateFare, formatCurrencyDZD, getQuickFareChips, validateOfferedPrice } from '../../utils/pricing';
import { MapPin, Navigation, ArrowLeft, Clock, Check, Search, X, Plus, Minus, Sparkles, MessageSquare, Loader2, RefreshCw, AlertTriangle } from 'lucide-react';

interface BookRideModalProps {
  onClose: () => void;
  onRideBooked: () => void;
  initialPickup?: Coordinates | null;
  initialDestination?: Coordinates | null;
}

const QUICK_NOTES = [
  '🪖 أحتاج خوذة إضافية',
  '🎒 معي حقيبة ظهر خفيفة',
  '⚡ مستعجل جداً',
  '📍 أنا أمام المدخل الرئيسي',
];

export const BookRideModal: React.FC<BookRideModalProps> = ({
  onClose,
  onRideBooked,
  initialPickup,
  initialDestination,
}) => {
  const { requestRide, pricing } = useApp();

  const [pickup, setPickup] = useState<Coordinates>(
    initialPickup || ALGERIA_LOCATIONS[0].coords // Default: Guelma Centre or first hotspot
  );
  const [destination, setDestination] = useState<Coordinates>(
    initialDestination || ALGERIA_LOCATIONS[19].coords // Default: Hammam Debagh
  );

  const [searchType, setSearchType] = useState<'pickup' | 'destination' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWilaya, setSelectedWilaya] = useState<string>('الكل');
  const [searchResults, setSearchResults] = useState<{ name: string; wilaya: string; coords: Coordinates }[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isGpsLoading, setIsGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [selectedNotes, setSelectedNotes] = useState<string[]>([]);
  const [customNote, setCustomNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Real-time location search: instant results on any letter typed or wilaya clicked
  React.useEffect(() => {
    let isCancelled = false;
    const trimmed = searchQuery.trim();

    if (trimmed.length >= 3) {
      setIsSearching(true);
    }

    searchAlgeriaPlaces(trimmed, selectedWilaya).then(results => {
      if (!isCancelled) {
        setSearchResults(results);
        setIsSearching(false);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [searchQuery, selectedWilaya]);

  // Real GPS Geolocation with robust high/low accuracy fallback
  const handleUseRealGPS = async () => {
    if (!navigator.geolocation) {
      setGpsError('خاصية تحديد المواقع الجغرافي غير مدعومة في متصفحك أو جهازك.');
      return;
    }

    setIsGpsLoading(true);
    setGpsError(null);

    const getPositionPromise = (options: PositionOptions): Promise<GeolocationPosition> => {
      return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, options);
      });
    };

    let position: GeolocationPosition | null = null;
    let locationError: GeolocationPositionError | null = null;

    // Attempt 1: High Accuracy GPS (Satellite)
    try {
      position = await getPositionPromise({
        enableHighAccuracy: true,
        timeout: 6000,
        maximumAge: 30000,
      });
    } catch (err1: any) {
      locationError = err1;
      // If permission was denied directly (code 1), don't retry, fail immediately
      if (err1?.code === 1) {
        setIsGpsLoading(false);
        setGpsError(
          'تم رفض إذن الموقع. إذا قمت بتثبيت التطبيق على هاتفك، يُرجى فتح إعدادات الهاتف ⬅️ التطبيقات ⬅️ MotoDrive (أو Chrome) ⬅️ الأذونات ⬅️ تفعيل إذن "الموقع الجغرافي".'
        );
        return;
      }

      // Attempt 2: Network / Cellular / Wi-Fi fallback (crucial for mobile indoors)
      try {
        position = await getPositionPromise({
          enableHighAccuracy: false,
          timeout: 8000,
          maximumAge: 120000,
        });
      } catch (err2: any) {
        locationError = err2;
      }
    }

    if (!position) {
      setIsGpsLoading(false);
      if (locationError?.code === 1) {
        setGpsError(
          'تم رفض إذن الموقع الجغرافي. يرجى تفعيل إذن الموقع من إعدادات المتصفح أو إعدادات الهاتف.'
        );
      } else if (locationError?.code === 2) {
        setGpsError(
          'تعذر التقاط إشارة GPS. تأكد من تفعيل زر "الموقع" (Location) في شريط إشعارات هاتفك، أو اختر ولايتك ووجهتك مباشرة من القائمة.'
        );
      } else {
        setGpsError(
          'انتهت مهلة التقاط إشارة GPS. يمكنك اختيار ولايتك ومنطقتك مباشرة وسيقوم التطبيق بحساب المسار فوراً.'
        );
      }
      return;
    }

    try {
      const { latitude, longitude } = position.coords;
      const address = await reverseGeocodeCoords(latitude, longitude);
      const nearest = findNearestLocalLocation(latitude, longitude);

      if (nearest?.item?.wilaya) {
        setSelectedWilaya(nearest.item.wilaya);
      }

      const placeName =
        address ||
        (nearest ? `${nearest.item.name} (${nearest.item.wilaya})` : 'موقعي الحالي (GPS)');

      const realLoc: Coordinates = {
        lat: latitude,
        lng: longitude,
        name: placeName,
        address: address || `موقع: ${latitude.toFixed(4)}, ${longitude.toFixed(4)} (${nearest?.item?.wilaya || 'الجزائر'})`,
      };

      if (searchType === 'pickup') {
        setPickup(realLoc);
      } else {
        setDestination(realLoc);
      }
      setSearchType(null);
    } catch {
      const { latitude, longitude } = position.coords;
      const nearest = findNearestLocalLocation(latitude, longitude);
      const fallbackLoc: Coordinates = {
        lat: latitude,
        lng: longitude,
        name: nearest ? `${nearest.item.name} (${nearest.item.wilaya})` : 'موقعي الحالي (GPS)',
        address: `إحداثيات: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
      };
      if (nearest?.item?.wilaya) {
        setSelectedWilaya(nearest.item.wilaya);
      }
      if (searchType === 'pickup') setPickup(fallbackLoc);
      else setDestination(fallbackLoc);
      setSearchType(null);
    } finally {
      setIsGpsLoading(false);
    }
  };

  const distanceKm = calculateDistanceKm(pickup, destination);
  const estimatedDuration = estimateDurationMinutes(distanceKm);

  const discountPercent = appliedPromo === 'MOTO20' ? 20 : appliedPromo === 'SAHL10' ? 10 : 0;
  const fareBreakdown = calculateFare(distanceKm, estimatedDuration, pricing, discountPercent);
  const recommendedPrice = fareBreakdown.roundedPrice;

  // Passenger offered price state (defaults to recommended)
  const [offeredPrice, setOfferedPrice] = useState<number>(recommendedPrice);
  const quickChips = getQuickFareChips(recommendedPrice);

  // Update offered price if recommended changes
  React.useEffect(() => {
    setOfferedPrice(recommendedPrice);
  }, [recommendedPrice]);

  const minAllowedForTrip = distanceKm <= 5 ? 120 : (pricing.minimumFare || 120);

  const handleAdjustPrice = (delta: number) => {
    const newPrice = Math.max(minAllowedForTrip, offeredPrice + delta);
    setOfferedPrice(newPrice);
    setErrorMsg(null);
  };

  const handleToggleNote = (note: string) => {
    setSelectedNotes(prev =>
      prev.includes(note) ? prev.filter(n => n !== note) : [...prev, note]
    );
  };

  const handleApplyPromo = () => {
    if (promoCode.trim().toUpperCase() === 'MOTO20' || promoCode.trim().toUpperCase() === 'SAHL10') {
      setAppliedPromo(promoCode.trim().toUpperCase());
      setErrorMsg(null);
    } else {
      setErrorMsg('رمز العرض الترويجي غير صالح أو منتهي');
    }
  };

  const handleConfirmRide = async () => {
    if (distanceKm > 70) {
      setErrorMsg('لا يمكن طلب رحلة أبعد من 70 كم بالدراجة النارية حفاظاً على السلامة والراحة.');
      return;
    }

    // Validate price bounds
    const validation = validateOfferedPrice(offeredPrice, recommendedPrice, pricing, distanceKm);
    if (!validation.isValid) {
      setErrorMsg(validation.error || 'السعر المقترح غير صالح');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const fullNote = [...selectedNotes, customNote.trim()].filter(Boolean).join(' • ');

    const res = await requestRide(
      pickup,
      destination,
      offeredPrice,
      fullNote || undefined,
      appliedPromo || undefined
    );
    setIsSubmitting(false);

    if (res.success) {
      onRideBooked();
    } else {
      setErrorMsg(res.error || 'فشل في إنشاء الطلب');
    }
  };

  const priceDiff = offeredPrice - recommendedPrice;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in" id="book-ride-modal">
      <div className="bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl max-w-lg w-full max-h-[92vh] overflow-y-auto p-5 text-right text-slate-100 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="text-center">
            <h3 className="text-base font-black text-white">طلب رحلة بالتفاوض الحر</h3>
            <p className="text-[11px] text-amber-400 font-medium">حدد سعرك واستقبل عروض السائقين مباشرة 🏍️</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-sm">
            ⚡
          </div>
        </div>

        {/* Search Modal Drawer inside if selecting location */}
        {searchType ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setSearchType(null);
                  setSearchQuery('');
                }}
                className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
                title="رجوع"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder={
                    searchType === 'pickup'
                      ? selectedWilaya !== 'الكل'
                        ? `ابحث عن أي مكان أو بلدية في ${selectedWilaya} أو اكتب حرفاً...`
                        : 'ابحث عن مكان الانطلاق (اكتب اسم المكان أو البلدية أو حرفاً)...'
                      : selectedWilaya !== 'الكل'
                      ? `ابحث عن الوجهة في ${selectedWilaya} أو أي ولاية...`
                        : 'ابحث عن الوجهة (اكتب اسم المكان أو البلدية أو حرفاً)...'
                  }
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  autoFocus
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2.5 pr-9 pl-8 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                />
                <Search className="w-4 h-4 text-slate-500 absolute right-3 top-3" />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute left-2.5 top-2.5 p-0.5 rounded-full hover:bg-slate-800 text-slate-400"
                    title="مسح"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* 58 Wilayas Selector & Quick Filter */}
            <div className="space-y-2">
              <div className="text-[11px] text-slate-400 flex items-center justify-between px-1">
                <span>تحديد الولاية (58 ولاية):</span>
                <span className="text-[10px] text-amber-400 font-bold">
                  {selectedWilaya === 'الكل' ? 'جميع الولايات والمدن' : `ولاية ${selectedWilaya}`}
                </span>
              </div>

              {/* 58 Wilayas Dropdown */}
              <div className="relative">
                <select
                  value={selectedWilaya}
                  onChange={e => setSelectedWilaya(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-amber-300 font-medium focus:outline-none focus:border-amber-500"
                >
                  <option value="الكل">🇩🇿 كل ولايات الجزائر (58 ولاية - تغطية وطنية)</option>
                  {ALL_58_WILAYAS.map(w => (
                    <option key={w.code} value={w.name}>
                      {String(w.code).padStart(2, '0')} - ولاية {w.name} ({w.nameFr})
                    </option>
                  ))}
                </select>
              </div>

              {/* Quick Horizontal Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {FEATURED_WILAYAS.map(w => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => setSelectedWilaya(w)}
                    className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap transition-all border shrink-0 ${
                      selectedWilaya === w
                        ? 'bg-amber-500 text-slate-950 border-amber-400 font-black shadow-md'
                        : 'bg-slate-950/80 text-slate-300 hover:bg-slate-800 border-slate-800 font-medium'
                    }`}
                  >
                    {w === 'قالمة' ? '📍 قالمة (Guelma)' : w}
                  </button>
                ))}
              </div>
            </div>

            {/* Current Real GPS option */}
            <button
              onClick={handleUseRealGPS}
              disabled={isGpsLoading}
              className="w-full flex items-center justify-center gap-3 p-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold transition-all disabled:opacity-50"
            >
              {isGpsLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                  <span>جاري تحديد موقعك الفعلي عبر الأقمار الصناعية (GPS)...</span>
                </>
              ) : (
                <>
                  <Navigation className="w-4 h-4 text-amber-400" />
                  <span>استخدام موقعي الفعلي الحالي عبر GPS</span>
                </>
              )}
            </button>

            {gpsError && (
              <div className="p-2.5 bg-red-500/10 border border-red-500/30 rounded-xl text-[11px] text-red-300">
                {gpsError}
              </div>
            )}

            {/* Live Instant Search Results List */}
            <div className="space-y-1.5 max-h-72 overflow-y-auto pr-0.5">
              <div className="text-[11px] text-amber-400 font-semibold px-1 flex items-center justify-between">
                <span>
                  {searchQuery.trim()
                    ? `الأماكن المطابقة لـ "${searchQuery}" (${searchResults.length}):`
                    : selectedWilaya !== 'الكل'
                    ? `أماكن وبلديات ولاية ${selectedWilaya} (${searchResults.length}):`
                    : 'أماكن ومحطات شهيرة وسريعة:'}
                </span>
                {isSearching && <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />}
              </div>

              {searchResults.length > 0 ? (
                searchResults.map((loc, idx) => (
                  <button
                    key={`loc-${idx}`}
                    onClick={() => {
                      if (searchType === 'pickup') setPickup(loc.coords);
                      else setDestination(loc.coords);
                      setSearchType(null);
                      setSearchQuery('');
                    }}
                    className="w-full text-right p-3 rounded-2xl bg-slate-950/80 hover:bg-slate-800/90 border border-slate-800/80 hover:border-amber-500/40 transition-all flex items-center justify-between group"
                  >
                    <div className="truncate flex-1">
                      <div className="text-xs font-bold text-white group-hover:text-amber-400 truncate flex items-center gap-2">
                        <span className="truncate">{loc.name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 font-normal shrink-0 border border-slate-700">
                          {loc.wilaya}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                        {loc.coords.address || loc.wilaya}
                      </div>
                    </div>
                    <MapPin className="w-4 h-4 text-slate-500 group-hover:text-amber-400 shrink-0 mr-2" />
                  </button>
                ))
              ) : !isSearching ? (
                <div className="p-4 text-center text-xs text-slate-400 bg-slate-950/40 rounded-xl space-y-1">
                  <div>لم نجد نتائج مطابقة لـ "{searchQuery}".</div>
                  <div className="text-[10px] text-slate-500">جرب كتابة حرف أو اسم بلدية أو اختيار ولاية من الأزرار أعلاه.</div>
                </div>
              ) : null}
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
              <div className={`border rounded-2xl p-3 flex items-center gap-3 ${
                distanceKm > 70 ? 'bg-rose-950/40 border-rose-500/60' : 'bg-slate-950 border-slate-800'
              }`}>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  distanceKm > 70 ? 'bg-rose-900/50 text-rose-400' : 'bg-slate-900 text-amber-400'
                }`}>
                  <Navigation className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">المسافة المقدرة</div>
                  <div className={`text-sm font-black ${distanceKm > 70 ? 'text-rose-400' : 'text-white'}`}>
                    {distanceKm} كم
                  </div>
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">المدة بالدراجة</div>
                  <div className="text-sm font-black text-white">~{estimatedDuration} دقيقة</div>
                </div>
              </div>
            </div>

            {/* Special highlight for trips <= 5 km */}
            {distanceKm <= 5 && (
              <div className="bg-emerald-500/15 border border-emerald-500/30 rounded-2xl p-3 flex items-center gap-2.5 text-xs text-emerald-300">
                <span className="text-base shrink-0">⚡</span>
                <div>
                  <div className="font-bold text-emerald-200">مسافة رحلة قصيرة ({distanceKm} كم)</div>
                  <div className="text-[11px] text-emerald-400/90 mt-0.5">
                    جميع المسافات الأقل من 5 كم تسعيرتها الموحدة <strong>120 د.ج</strong> فقط!
                  </div>
                </div>
              </div>
            )}

            {/* Warning if distance exceeds 70 km */}
            {distanceKm > 70 && (
              <div className="bg-rose-500/15 border-2 border-rose-500/40 rounded-2xl p-3.5 text-rose-200 text-xs flex items-start gap-3 animate-in fade-in">
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-black text-white text-sm">المسافة تتجاوز الحد الأقصى (70 كم)</div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    المسافة المحسوبة لهذه الرحلة هي <strong className="text-rose-300 font-bold">{distanceKm} كم</strong>. حفاظاً على سلامتك وسلامة سائقي الدراجات، تمنع المنصة طلبات الرحلات الأطول من 70 كم. يرجى اختيار وجهة أقرب.
                  </p>
                </div>
              </div>
            )}

            {/* InDrive-style Fare Negotiation Section */}
            <div className="bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border-2 border-amber-500/40 rounded-2xl p-4 space-y-3.5 shadow-lg relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>اقترح سعرك للرحلة (د.ج)</span>
                </div>
                <div className="text-[11px] text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-full">
                  السعر المقترح بالنظام: <span className="font-bold text-amber-400">{recommendedPrice} د.ج</span>
                </div>
              </div>

              {/* Price Adjuster with big +/- controls */}
              <div className="flex items-center justify-between gap-3 bg-slate-950/80 border border-slate-800 rounded-2xl p-3">
                <button
                  type="button"
                  onClick={() => handleAdjustPrice(-20)}
                  disabled={offeredPrice <= minAllowedForTrip}
                  className="w-12 h-12 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-amber-400 font-bold flex items-center justify-center text-lg disabled:opacity-30 transition-all"
                  title="إنقاص 20 د.ج"
                >
                  <Minus className="w-5 h-5" />
                </button>

                <div className="text-center flex-1">
                  <div className="text-3xl font-black text-amber-400 tracking-tight">
                    {offeredPrice} <span className="text-sm font-semibold text-slate-400">د.ج</span>
                  </div>
                  <div className="text-[10px] font-medium mt-0.5">
                    {priceDiff === 0 ? (
                      <span className="text-slate-400">مطابق للتسعيرة المقترحة</span>
                    ) : priceDiff > 0 ? (
                      <span className="text-emerald-400 font-semibold">+{priceDiff} د.ج (قبول فوري وأسرع)</span>
                    ) : (
                      <span className="text-amber-400/90 font-semibold">{priceDiff} د.ج (عرض اقتصادي)</span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleAdjustPrice(20)}
                  className="w-12 h-12 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-bold flex items-center justify-center text-lg transition-all"
                  title="زيادة 20 د.ج"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              {/* Quick Fare Chips */}
              <div className="space-y-1.5">
                <div className="text-[10px] text-slate-400">خيارات سريعة مقترحة:</div>
                <div className="grid grid-cols-4 gap-1.5">
                  {quickChips.map((chipPrice, i) => {
                    const isSelected = offeredPrice === chipPrice;
                    const diff = chipPrice - recommendedPrice;
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setOfferedPrice(chipPrice)}
                        className={`py-2 px-1 rounded-xl text-xs font-bold transition-all text-center border ${
                          isSelected
                            ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md scale-[1.02]'
                            : 'bg-slate-950/90 text-slate-300 hover:bg-slate-800 border-slate-800'
                        }`}
                      >
                        <div>{chipPrice} د.ج</div>
                        <div className={`text-[9px] ${isSelected ? 'text-slate-900 font-black' : 'text-slate-500'}`}>
                          {diff === 0 ? 'الموصى به' : diff > 0 ? `+${diff}` : `${diff}`}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Quick Trip Notes & Requirements */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs text-slate-300 font-semibold">
                <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                <span>ملاحظات إضافية لسائق الدراجة:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_NOTES.map((note, idx) => {
                  const active = selectedNotes.includes(note);
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleToggleNote(note)}
                      className={`text-[11px] px-2.5 py-1.5 rounded-xl border transition-all ${
                        active
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {note}
                    </button>
                  );
                })}
              </div>

              <input
                type="text"
                placeholder="أضف ملاحظة مخصصة (مثال: أمام العمارة B2)..."
                value={customNote}
                onChange={e => setCustomNote(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Promo Code Input */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="كود خصم (MOTO20 أو SAHL10)"
                value={promoCode}
                onChange={e => setPromoCode(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500 flex-1 uppercase"
              />
              <button
                type="button"
                onClick={handleApplyPromo}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-xl text-xs font-bold transition-colors"
              >
                تطبيق
              </button>
            </div>

            {appliedPromo && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl">
                <Check className="w-3.5 h-3.5" />
                <span>تم تطبيق الكود {appliedPromo} (-{discountPercent}%) بنجاح!</span>
              </div>
            )}

            {errorMsg && (
              <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 p-2.5 rounded-xl">
                {errorMsg}
              </div>
            )}

            {/* Submit Action Button */}
            <button
              id="confirm-ride-booking-btn"
              onClick={handleConfirmRide}
              disabled={isSubmitting || distanceKm > 70}
              className={`w-full py-4 font-black rounded-2xl shadow-xl flex items-center justify-center gap-2 text-base transition-all active:scale-[0.98] ${
                distanceKm > 70
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-amber-500/25 disabled:opacity-50'
              }`}
            >
              <span>
                {isSubmitting
                  ? 'جاري نشر طلبك...'
                  : distanceKm > 70
                  ? 'المسافة تتجاوز الحد الأقصى (70 كم) ⛔'
                  : `نشر الطلب بسعر ${offeredPrice} د.ج واستقبال العروض 🏍️`}
              </span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};
