import React, { useState, useMemo } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Coordinates } from '../../types';
import {
  ALGERIA_LOCATIONS,
  FEATURED_WILAYAS,
  ALL_58_WILAYAS,
  findNearestLocalLocation,
  findNearestAlgerianWilaya,
  calculateDistanceKm,
  fetchAccurateRoadRoute,
  estimateDurationMinutes,
  reverseGeocodeCoords,
  searchAlgeriaPlaces,
} from '../../utils/geo';
import { calculateFare, formatCurrencyDZD, getQuickFareChips, validateOfferedPrice } from '../../utils/pricing';
import {
  MapPin,
  Navigation,
  ArrowLeft,
  Clock,
  Check,
  Search,
  X,
  Plus,
  Minus,
  Sparkles,
  MessageSquare,
  Loader2,
  RefreshCw,
  AlertTriangle,
  Tag,
  CheckCircle2,
} from 'lucide-react';

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
  const { requestRide, pricing, activePassenger, applyPromoCode } = useApp();

  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discountAmount: number } | null>(null);
  const [promoMessage, setPromoMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [pickup, setPickup] = useState<Coordinates>(
    initialPickup || {
      lat: 36.1652,
      lng: 1.3345,
      name: 'ساحة التضامن - وسط مدينة الشلف',
      address: 'ساحة التضامن وأول نوفمبر، وسط مدينة الشلف',
    }
  );
  const [destination, setDestination] = useState<Coordinates>(
    initialDestination || {
      lat: 36.1780,
      lng: 1.3480,
      name: 'جامعة حسيبة بن بوعلي - الشلف',
      address: 'حي السلام / أولاد فارس، الشلف',
    }
  );

  // Sync pickup and destination whenever initialPickup / initialDestination props change
  React.useEffect(() => {
    if (initialPickup && typeof initialPickup.lat === 'number' && typeof initialPickup.lng === 'number') {
      setPickup(initialPickup);
    }
  }, [initialPickup?.lat, initialPickup?.lng, initialPickup?.name]);

  React.useEffect(() => {
    if (initialDestination && typeof initialDestination.lat === 'number' && typeof initialDestination.lng === 'number') {
      setDestination(initialDestination);
    }
  }, [initialDestination?.lat, initialDestination?.lng, initialDestination?.name]);

  const [searchType, setSearchType] = useState<'pickup' | 'destination' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ name: string; wilaya: string; coords: Coordinates }[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isGpsLoading, setIsGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [selectedNotes, setSelectedNotes] = useState<string[]>([]);
  const [customNote, setCustomNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Automatically detect passenger's current Wilaya
  const currentWilaya = useMemo(() => {
    const nearest = findNearestAlgerianWilaya(pickup.lat, pickup.lng);
    return nearest?.name || 'الشلف';
  }, [pickup.lat, pickup.lng]);

  // Real-time location search: instant results on any letter typed
  React.useEffect(() => {
    let isCancelled = false;
    const trimmed = searchQuery.trim();

    if (trimmed.length >= 3) {
      setIsSearching(true);
    }

    // If query is empty, show only 2 famous places of passenger's wilaya; otherwise search across all 58 wilayas
    searchAlgeriaPlaces(trimmed, trimmed ? 'الكل' : currentWilaya).then(results => {
      if (!isCancelled) {
        setSearchResults(results);
        setIsSearching(false);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [searchQuery, currentWilaya]);

  // Auto-detect GPS position immediately on modal open ONLY for pickup if initialPickup is missing
  React.useEffect(() => {
    if (!initialPickup) {
      handleUseRealGPS('pickup');
    }
  }, []);

  // Real GPS Geolocation with robust high/low accuracy fallback
  const handleUseRealGPS = async (forcedTarget?: 'pickup' | 'destination') => {
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

      const placeName =
        address ||
        (nearest ? `${nearest.item.name} (${nearest.item.wilaya})` : 'موقعي الحالي (GPS)');

      const realLoc: Coordinates = {
        lat: latitude,
        lng: longitude,
        name: placeName,
        address: address || `موقع: ${latitude.toFixed(4)}, ${longitude.toFixed(4)} (${nearest?.item?.wilaya || 'الجزائر'})`,
      };

      const targetField = forcedTarget || searchType || 'pickup';
      if (targetField === 'pickup') {
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
      const targetField = forcedTarget || searchType || 'pickup';
      if (targetField === 'pickup') setPickup(fallbackLoc);
      else setDestination(fallbackLoc);
      setSearchType(null);
    } finally {
      setIsGpsLoading(false);
    }
  };

  const [roadDistanceKm, setRoadDistanceKm] = useState<number>(() =>
    calculateDistanceKm(pickup, destination)
  );

  React.useEffect(() => {
    let active = true;
    const initialDist = calculateDistanceKm(pickup, destination);
    setRoadDistanceKm(initialDist);
    fetchAccurateRoadRoute(pickup, destination).then((res) => {
      if (active && res.distanceKm > 0) {
        setRoadDistanceKm(res.distanceKm);
      }
    });
    return () => {
      active = false;
    };
  }, [pickup.lat, pickup.lng, destination.lat, destination.lng]);

  const distanceKm = roadDistanceKm;
  const estimatedDuration = estimateDurationMinutes(distanceKm);

  const fareBreakdown = calculateFare(distanceKm, estimatedDuration, pricing, 0);
  const baseRecommendedPrice = fareBreakdown.roundedPrice;
  const recommendedPrice = appliedPromo
    ? Math.max(baseRecommendedPrice - appliedPromo.discountAmount, 100)
    : baseRecommendedPrice;

  // Passenger offered starting fare (editable manually or via chips)
  const [offeredPrice, setOfferedPrice] = useState<number>(recommendedPrice);

  // Update offered price if recommended changes
  React.useEffect(() => {
    setOfferedPrice(recommendedPrice);
  }, [recommendedPrice]);

  const handleApplyPromo = () => {
    if (!promoInput.trim()) {
      setPromoMessage({ type: 'error', text: 'يرجى كتابة رمز الكود أولاً' });
      return;
    }
    const result = applyPromoCode(promoInput.trim(), baseRecommendedPrice);
    if (result.valid) {
      setAppliedPromo({
        code: promoInput.trim().toUpperCase(),
        discountAmount: result.discountAmount,
      });
      setPromoMessage({ type: 'success', text: result.message || 'تم تطبيق الخصم بنجاح!' });
      setOfferedPrice(result.finalFare);
    } else {
      setPromoMessage({ type: 'error', text: result.message || 'الكود غير صالح' });
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoInput('');
    setPromoMessage(null);
    setOfferedPrice(baseRecommendedPrice);
  };

  const handleToggleNote = (note: string) => {
    setSelectedNotes((prev) =>
      prev.includes(note) ? prev.filter((n) => n !== note) : [...prev, note]
    );
  };

  const handleConfirmRide = async () => {
    if (distanceKm > 70) {
      setErrorMsg('لا يمكن طلب رحلة أبعد من 70 كم بالدراجة النارية حفاظاً على السلامة والراحة.');
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
      appliedPromo?.code
    );
    setIsSubmitting(false);

    if (res.success) {
      onRideBooked();
    } else {
      setErrorMsg(res.error || 'فشل في إنشاء الطلب');
    }
  };

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
            <h3 className="text-base font-black text-white">طلب رحلة جديدة</h3>
            <p className="text-[11px] text-amber-400 font-medium">تأكيد مكان الانطلاق والوجهة 🏍️</p>
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
                      ? 'ابحث عن مكان الانطلاق (اسم البلدية، الدائرة، أو المكان)...'
                      : 'ابحث عن الوجهة (اسم البلدية، الدائرة، أو المكان)...'
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

            {/* Current Real GPS option */}
            <button
              onClick={() => handleUseRealGPS(searchType || 'pickup')}
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
                    : `أماكن ومحطات شهيرة وسريعة في ولاية ${currentWilaya}:`}
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
                  <div className="w-7 h-7 rounded-full bg-yellow-300/15 border border-yellow-300 text-yellow-200 flex items-center justify-center text-xs shrink-0">
                    <MapPin className="w-3.5 h-3.5 text-yellow-200" />
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

            {/* Quick Saved Home / Work Destination Selector inside Booking Modal */}
            {(activePassenger?.homeLocation || activePassenger?.workLocation) && (
              <div className="grid grid-cols-2 gap-2" dir="rtl">
                {activePassenger?.homeLocation && (
                  <button
                    type="button"
                    onClick={() => setDestination(activePassenger.homeLocation!)}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer truncate ${
                      destination.lat === activePassenger.homeLocation.lat &&
                      destination.lng === activePassenger.homeLocation.lng
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-amber-500/40'
                    }`}
                  >
                    <span>🏠</span>
                    <span className="truncate">
                      المنزل: {activePassenger.homeLocation.name || activePassenger.homeLocation.address}
                    </span>
                  </button>
                )}
                {activePassenger?.workLocation && (
                  <button
                    type="button"
                    onClick={() => setDestination(activePassenger.workLocation!)}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer truncate ${
                      destination.lat === activePassenger.workLocation.lat &&
                      destination.lng === activePassenger.workLocation.lng
                        ? 'bg-blue-500/20 border-blue-500 text-blue-300'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-blue-500/40'
                    }`}
                  >
                    <span>💼</span>
                    <span className="truncate">
                      العمل: {activePassenger.workLocation.name || activePassenger.workLocation.address}
                    </span>
                  </button>
                )}
              </div>
            )}

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



            {/* Flexible Bidding Section (InDrive Style Bidding System) */}
            <div className="bg-slate-950 border-2 border-amber-500/40 rounded-2xl p-4 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-black text-white flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>سعرك المقترح للرحلة (قابل للتفاوض):</span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    السعر القياسي المقترح للمسافة: <strong className="text-slate-200">{recommendedPrice} د.ج</strong>
                  </div>
                </div>

                {/* Price Difference Indicator Badge */}
                {offeredPrice !== recommendedPrice && (
                  <span
                    className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                      offeredPrice > recommendedPrice
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {offeredPrice > recommendedPrice
                      ? `+${offeredPrice - recommendedPrice} د.ج (قبول أسرع ⚡)`
                      : `-${recommendedPrice - offeredPrice} د.ج`}
                  </span>
                )}
              </div>

              {/* Price adjustment controller */}
              <div className="flex items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-2.5">
                <button
                  type="button"
                  onClick={() => setOfferedPrice((prev) => Math.max(100, prev - 20))}
                  className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 font-black text-lg flex items-center justify-center transition-all active:scale-95 cursor-pointer"
                  title="إنقاص السعر 20 د.ج"
                >
                  <Minus className="w-5 h-5" />
                </button>

                <div className="flex-1 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <input
                      type="number"
                      step="10"
                      min="100"
                      value={offeredPrice}
                      onChange={(e) => setOfferedPrice(Math.max(100, Number(e.target.value)))}
                      className="text-3xl font-black text-amber-400 font-mono bg-transparent text-center focus:outline-none w-28"
                    />
                    <span className="text-sm font-bold text-slate-400">د.ج</span>
                  </div>
                  <div className="text-[10px] text-slate-500">يمكنك تعديل الرقم يدوياً</div>
                </div>

                <button
                  type="button"
                  onClick={() => setOfferedPrice((prev) => prev + 20)}
                  className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 font-black text-lg flex items-center justify-center transition-all active:scale-95 cursor-pointer"
                  title="زيادة السعر 20 د.ج"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              {/* Quick Fare Increment Chips */}
              <div className="grid grid-cols-4 gap-1.5 text-center text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setOfferedPrice(recommendedPrice)}
                  className={`py-1.5 px-1 rounded-xl border transition-all ${
                    offeredPrice === recommendedPrice
                      ? 'bg-amber-500 text-slate-950 border-amber-400 font-black'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  <span>المقترح</span>
                </button>
                <button
                  type="button"
                  onClick={() => setOfferedPrice(recommendedPrice + 30)}
                  className={`py-1.5 px-1 rounded-xl border transition-all ${
                    offeredPrice === recommendedPrice + 30
                      ? 'bg-amber-500 text-slate-950 border-amber-400 font-black'
                      : 'bg-slate-900 text-slate-300 border-slate-800 hover:text-white'
                  }`}
                >
                  <span>+30 د.ج</span>
                </button>
                <button
                  type="button"
                  onClick={() => setOfferedPrice(recommendedPrice + 50)}
                  className={`py-1.5 px-1 rounded-xl border transition-all ${
                    offeredPrice === recommendedPrice + 50
                      ? 'bg-amber-500 text-slate-950 border-amber-400 font-black'
                      : 'bg-slate-900 text-slate-300 border-slate-800 hover:text-white'
                  }`}
                >
                  <span>+50 د.ج</span>
                </button>
                <button
                  type="button"
                  onClick={() => setOfferedPrice(recommendedPrice + 100)}
                  className={`py-1.5 px-1 rounded-xl border transition-all ${
                    offeredPrice === recommendedPrice + 100
                      ? 'bg-amber-500 text-slate-950 border-amber-400 font-black'
                      : 'bg-slate-900 text-slate-300 border-slate-800 hover:text-white'
                  }`}
                >
                  <span>+100 د.ج ⚡</span>
                </button>
              </div>
            </div>

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

            {errorMsg && (
              <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 p-2.5 rounded-xl">
                {errorMsg}
              </div>
            )}

            {/* Promo Code Input Section (Positioned Directly Above Publish Button) */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-slate-300 font-bold">
                  <Tag className="w-3.5 h-3.5 text-amber-400" />
                  <span>كود الخصم (Promo Code):</span>
                </div>
                {appliedPromo && (
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>تم خصم {appliedPromo.discountAmount} د.ج</span>
                  </span>
                )}
              </div>

              {appliedPromo ? (
                <div className="flex items-center justify-between bg-slate-900 border border-emerald-500/30 rounded-xl px-3 py-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-amber-400">{appliedPromo.code}</span>
                    <span className="text-slate-400">تخفيض: {appliedPromo.discountAmount} د.ج</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemovePromo}
                    className="text-red-400 hover:text-red-300 text-xs font-bold underline cursor-pointer"
                  >
                    إلغاء الكود
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                    placeholder="أدخل رمز الكوبون (مثال: MOTO20)..."
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white uppercase placeholder:text-slate-600 focus:outline-none focus:border-amber-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleApplyPromo}
                    className="py-2 px-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs transition-colors cursor-pointer shrink-0"
                  >
                    تطبيق
                  </button>
                </div>
              )}

              {promoMessage && (
                <div
                  className={`text-[11px] font-bold ${
                    promoMessage.type === 'success' ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {promoMessage.text}
                </div>
              )}
            </div>

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
