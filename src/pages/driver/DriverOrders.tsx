import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Ride } from '../../types';
import { formatCurrencyDZD } from '../../utils/pricing';
import { calculateDistanceKm } from '../../utils/geo';
import { DriverIncomingRideModal } from './DriverIncomingRideModal';
import { DriverActiveRide } from './DriverActiveRide';
import {
  Radio,
  MapPin,
  Navigation,
  Clock,
  Check,
  X,
  MessageSquare,
  AlertCircle,
  Power,
  RefreshCw,
  Sparkles,
  User,
  Star,
  CheckCircle2,
  Car,
  ChevronRight,
  Send,
  Zap,
} from 'lucide-react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export const DriverOrders: React.FC = () => {
  const {
    activeDriver,
    pendingDriverRideRequests,
    currentDriverRide,
    acceptRide,
    rejectRide,
    submitDriverOffer,
    toggleDriverOnline,
    toggleDriverAvailability,
    rides,
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'available' | 'active' | 'history'>('available');
  const [selectedRideForModal, setSelectedRideForModal] = useState<Ride | null>(null);
  const [actionLoadingRideId, setActionLoadingRideId] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [counterRideId, setCounterRideId] = useState<string | null>(null);
  const [counterPriceInput, setCounterPriceInput] = useState<number>(0);

  // Real-time direct Firestore onSnapshot listener for pending ride_requests
  const [liveRequests, setLiveRequests] = useState<Ride[]>([]);

  useEffect(() => {
    // Listen directly to ride_requests in real-time
    const q = query(
      collection(db, 'ride_requests'),
      where('status', '==', 'pending')
    );

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const directList: Ride[] = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            passengerId: data.passengerId || 'guest',
            passengerName: data.passengerName || 'راكب MotoDrive',
            passengerPhone: data.passengerPhone || '0550000000',
            passengerPhoto: data.passengerPhoto,
            passengerRating: 4.9,
            pickup: data.pickup,
            destination: data.destination,
            distanceKm: data.distanceKm || 5,
            estimatedDurationMins: data.estimatedDurationMins || 10,
            recommendedPrice: data.fare || 150,
            passengerOfferedPrice: data.fare || 150,
            estimatedPrice: data.fare || 150,
            status: 'searching',
            paymentMethod: 'cash',
            paymentStatus: 'pending',
            requestedAt: data.createdAt || new Date().toISOString(),
            offers: [],
          } as Ride;
        });

        // Filter and merge with AppContext pending requests
        setLiveRequests(directList);
      },
      (err) => {
        console.warn('Real-time ride_requests listener notice in DriverOrders:', err);
      }
    );

    return () => unsub();
  }, []);

  const [filterMode, setFilterMode] = useState<'all' | 'nearest' | 'tenes'>('all');

  // Merge context pending requests, all searching rides, and direct Firestore requests
  const allAvailableOrders: Ride[] = React.useMemo(() => {
    const map = new Map<string, Ride>();

    // 1. All pending/searching rides from AppContext rides
    for (const r of rides) {
      if (!r) continue;
      const s = r.status as string;
      if (
        (s === 'searching' || s === 'offers_available' || s === 'pending') &&
        (!r.driverId || r.driverId === activeDriver.id)
      ) {
        map.set(r.id, r);
      }
    }

    // 2. Add AppContext pending driver requests
    for (const r of pendingDriverRideRequests) {
      map.set(r.id, r);
    }

    // 3. Add direct Firestore live requests
    for (const r of liveRequests) {
      if (!map.has(r.id)) {
        map.set(r.id, r);
      }
    }

    let list = Array.from(map.values());

    if (filterMode === 'tenes') {
      list = list.filter((r) => {
        const pAddr = ((r.pickup?.address || '') + ' ' + (r.pickup?.name || '')).toLowerCase();
        const dAddr = ((r.destination?.address || '') + ' ' + (r.destination?.name || '')).toLowerCase();
        return pAddr.includes('تنس') || dAddr.includes('تنس') || pAddr.includes('شلف') || dAddr.includes('شلف');
      });
    } else if (filterMode === 'nearest') {
      list = list.filter((r) => {
        const dist = calculateDistanceKm(activeDriver.location, r.pickup);
        return dist <= 20;
      });
    }

    return list.sort((a, b) => {
      const distA = calculateDistanceKm(activeDriver.location, a.pickup);
      const distB = calculateDistanceKm(activeDriver.location, b.pickup);
      return distA - distB;
    });
  }, [rides, pendingDriverRideRequests, liveRequests, activeDriver.location, activeDriver.id, filterMode]);

  // Past completed or cancelled trips for history subtab
  const pastOrders = React.useMemo(() => {
    return rides.filter(
      (r) => r.driverId === activeDriver.id || (r.offers && r.offers.some((o) => o.driverId === activeDriver.id))
    );
  }, [rides, activeDriver.id]);

  const handleQuickAccept = async (ride: Ride) => {
    setActionLoadingRideId(ride.id);
    setFeedbackMsg(null);
    try {
      if (!activeDriver.isOnline) {
        await toggleDriverOnline(activeDriver.id, true);
      }
      const res = await acceptRide(ride.id, activeDriver.id);
      if (res.success) {
        setFeedbackMsg({
          type: 'success',
          text: `🚀 تم اختيار وقبول الطلب بنجاح! توجه الآن إلى موقع الراكب: ${ride.pickup.name || ride.pickup.address}`,
        });
        setActiveSubTab('active');
      } else {
        setFeedbackMsg({ type: 'error', text: res.error || 'تعذر قبول الطلب' });
      }
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err?.message || 'حدث خطأ أثناء قبول الطلب' });
    } finally {
      setActionLoadingRideId(null);
    }
  };

  const handleStartCounterOffer = (ride: Ride) => {
    setCounterRideId(ride.id);
    const currPrice = ride.passengerOfferedPrice || ride.estimatedPrice;
    setCounterPriceInput(currPrice + 50);
  };

  const handleSendCounterOffer = async (ride: Ride) => {
    if (counterPriceInput <= 0) return;
    setActionLoadingRideId(ride.id);
    setFeedbackMsg(null);
    try {
      if (!activeDriver.isOnline) {
        await toggleDriverOnline(activeDriver.id, true);
      }
      const res = await submitDriverOffer(ride.id, activeDriver.id, counterPriceInput);
      if (res.success) {
        setFeedbackMsg({
          type: 'success',
          text: `💬 تم إرسال عرضك (${counterPriceInput} د.ج) للراكب بنجاح! بانتظار موافقته.`,
        });
        setCounterRideId(null);
      } else {
        setFeedbackMsg({ type: 'error', text: res.error || 'تعذر إرسال العرض' });
      }
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err?.message || 'خطأ في إرسال العرض المضاد' });
    } finally {
      setActionLoadingRideId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-28" dir="rtl" id="driver-orders-screen">
      {/* Top Header Card */}
      <div className="bg-slate-900/90 border-b border-slate-800 backdrop-blur-md sticky top-0 z-30 px-4 py-4 shadow-xl">
        <div className="max-w-md mx-auto space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-400 flex items-center justify-center border border-amber-500/30">
                <Radio className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h1 className="text-base font-black text-white flex items-center gap-2">
                  <span>طلبات الرحلات</span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold animate-pulse">
                    استماع حي (onSnapshot)
                  </span>
                </h1>
                <p className="text-[11px] text-slate-400">
                  {activeDriver.municipality || 'تنس'} • {activeDriver.wilaya || 'الشلف'}
                </p>
              </div>
            </div>

            {/* Quick Online Status Badge & Toggle */}
            <button
              onClick={() => toggleDriverOnline(activeDriver.id, !activeDriver.isOnline)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 border transition-all cursor-pointer ${
                activeDriver.isOnline
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/25'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${activeDriver.isOnline ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
              <span>{activeDriver.isOnline ? 'متصل 🟢' : 'غير متصل ⚪'}</span>
            </button>
          </div>

          {/* Subtabs Selector: Available vs Active vs History */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-2xl border border-slate-800 text-xs font-bold">
            <button
              onClick={() => setActiveSubTab('available')}
              className={`flex-1 py-2 px-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeSubTab === 'available'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>الطلبات المتاحة</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  activeSubTab === 'available' ? 'bg-slate-950 text-amber-400' : 'bg-slate-800 text-slate-300'
                }`}
              >
                {allAvailableOrders.length}
              </span>
            </button>

            {currentDriverRide && (
              <button
                onClick={() => setActiveSubTab('active')}
                className={`flex-1 py-2 px-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeSubTab === 'active'
                    ? 'bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/20 animate-pulse'
                    : 'text-emerald-400 hover:text-white bg-emerald-500/10'
                }`}
              >
                <Car className="w-3.5 h-3.5" />
                <span>الرحلة الجارية</span>
              </button>
            )}

            <button
              onClick={() => setActiveSubTab('history')}
              className={`flex-1 py-2 px-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeSubTab === 'history'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>سجل الطلبات</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  activeSubTab === 'history' ? 'bg-slate-950 text-amber-400' : 'bg-slate-800 text-slate-300'
                }`}
              >
                {pastOrders.length}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-md mx-auto px-4 pt-4 space-y-4">
        {/* Feedback Alert Toast */}
        {feedbackMsg && (
          <div
            className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-lg animate-in fade-in ${
              feedbackMsg.type === 'success'
                ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-300'
                : 'bg-red-500/15 border border-red-500/40 text-red-300'
            }`}
          >
            {feedbackMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            )}
            <span className="flex-1">{feedbackMsg.text}</span>
            <button
              onClick={() => setFeedbackMsg(null)}
              className="text-slate-400 hover:text-white text-xs font-mono"
            >
              ✕
            </button>
          </div>
        )}

        {/* Driver Offline Notice */}
        {!activeDriver.isOnline && (
          <div className="bg-amber-500/10 border-2 border-amber-500/30 rounded-3xl p-4 text-xs space-y-2 text-right">
            <div className="flex items-center gap-2 font-black text-amber-400">
              <AlertCircle className="w-4 h-4" />
              <span>أنت في وضع غير متصل [ OFFLINE ]</span>
            </div>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              لن تصلك طلبات الركاب الجديدة حتى تقوم بتفعيل وضع الاتصال. اضغط على الزر أدناه للاتصال واستقبال الطلبات فوراً.
            </p>
            <button
              onClick={() => toggleDriverOnline(activeDriver.id, true)}
              className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer"
            >
              <Power className="w-4 h-4" />
              <span>تفعيل وضع الاتصال الآن [ ONLINE ] 🟢</span>
            </button>
          </div>
        )}

        {/* TAB 1: Available Requests */}
        {activeSubTab === 'available' && (
          <div className="space-y-4">
            {allAvailableOrders.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-4 shadow-xl">
                <div className="relative w-16 h-16 mx-auto">
                  <div className="absolute inset-0 rounded-full bg-amber-500/20 animate-ping"></div>
                  <div className="relative w-16 h-16 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                    <Radio className="w-8 h-8" />
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="text-base font-black text-white">الرادار يبحث عن طلبات قريبة...</h3>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                    يتم الاستماع المباشر في منطقة <span className="text-amber-400 font-bold">{activeDriver.municipality || 'تنس'} - {activeDriver.wilaya || 'الشلف'}</span>. ستظهر الطلبات الجديدة هنا في أجزاء من الثانية فور طلبها من طرف الراكب.
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-center gap-2 text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 py-2 px-3 rounded-xl max-w-xs mx-auto">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>الاستماع اللحظي (Realtime onSnapshot) مفعّل</span>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3 text-xs text-amber-300 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    اختر من قائمة طلبات الركاب الحالية أدناه واضغط على <strong>اختيار وقبول</strong> للانطلاق فوراً أو <strong>تفاوض</strong> لاقتراح سعرك.
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs font-black text-amber-400 px-1 pt-1">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                    <span>طلبات الركاب المتاحة حالياً ({allAvailableOrders.length})</span>
                  </span>
                  <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                    فرز حسب الأقرب 📍
                  </span>
                </div>

                {/* Filter and selection chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                  <button
                    onClick={() => setFilterMode('all')}
                    className={`py-1.5 px-3 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                      filterMode === 'all'
                        ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                        : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    كل الطلبات ({allAvailableOrders.length})
                  </button>
                  <button
                    onClick={() => setFilterMode('nearest')}
                    className={`py-1.5 px-3 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                      filterMode === 'nearest'
                        ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                        : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    📍 الأقرب إلي (&lt; 20 كم)
                  </button>
                  <button
                    onClick={() => setFilterMode('tenes')}
                    className={`py-1.5 px-3 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                      filterMode === 'tenes'
                        ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                        : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    🏖️ تنس والشلف
                  </button>
                </div>

                {allAvailableOrders.map((order) => {
                  const distToPickup = calculateDistanceKm(activeDriver.location, order.pickup);
                  const isCounteringThis = counterRideId === order.id;
                  const isLoadingThis = actionLoadingRideId === order.id;
                  const passengerFare = order.passengerOfferedPrice || order.estimatedPrice;

                  return (
                    <div
                      key={order.id}
                      className="bg-slate-900 border-2 border-amber-500/50 hover:border-amber-400 rounded-3xl p-4 space-y-3 shadow-2xl transition-all animate-in fade-in"
                    >
                      {/* Card Header: Passenger Info & Fare */}
                      <div className="flex items-start justify-between border-b border-slate-800 pb-3">
                        <div className="flex items-center gap-2.5">
                          {order.passengerPhoto ? (
                            <img
                              src={order.passengerPhoto}
                              alt={order.passengerName}
                              className="w-10 h-10 rounded-2xl object-cover border border-amber-500/40"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-400 flex items-center justify-center font-black text-sm border border-amber-500/30">
                              <User className="w-5 h-5" />
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h4 className="text-sm font-black text-white">{order.passengerName}</h4>
                              <div className="flex items-center gap-0.5 text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded-md font-bold">
                                <Star className="w-2.5 h-2.5 fill-amber-400" />
                                <span>{(order.passengerRating || 4.9).toFixed(1)}</span>
                              </div>
                            </div>
                            <p className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 mt-0.5">
                              <Navigation className="w-3 h-3 text-emerald-400" />
                              <span>يبعد عنك {distToPickup.toFixed(1)} كم تقريباً</span>
                            </p>
                          </div>
                        </div>

                        {/* Offered Price Badge */}
                        <div className="text-left">
                          <span className="text-[10px] text-slate-400 block font-medium">سعر الراكب:</span>
                          <span className="text-lg font-black text-amber-400 font-mono">
                            {formatCurrencyDZD(passengerFare)}
                          </span>
                        </div>
                      </div>

                      {/* Route Path (Pickup & Destination) */}
                      <div className="space-y-2 bg-slate-950 p-3 rounded-2xl border border-slate-800/80 text-xs">
                        <div className="flex items-start gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 mt-1 shrink-0" />
                          <div className="flex-1">
                            <span className="text-[10px] text-slate-500 block">نقطة الانطلاق (Pickup):</span>
                            <span className="font-bold text-white leading-snug">
                              {order.pickup?.name || order.pickup?.address || 'موقع الراكب'}
                            </span>
                          </div>
                        </div>

                        <div className="border-r-2 border-dashed border-slate-800 mr-1.5 h-2" />

                        <div className="flex items-start gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 mt-1 shrink-0" />
                          <div className="flex-1">
                            <span className="text-[10px] text-slate-500 block">الوجهة المقصودة (Destination):</span>
                            <span className="font-bold text-slate-200 leading-snug">
                              {order.destination?.name || order.destination?.address || 'الوجهة'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Distance & Trip Time Summary */}
                      <div className="flex items-center justify-between text-[11px] text-slate-400 bg-slate-950/60 px-3 py-1.5 rounded-xl border border-slate-800/50">
                        <span className="flex items-center gap-1">
                          <Navigation className="w-3.5 h-3.5 text-amber-400" />
                          <span>مسافة الرحلة: <strong className="text-slate-200">{order.distanceKm.toFixed(1)} كم</strong></span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-amber-400" />
                          <span>المدة التقديرية: <strong className="text-slate-200">{order.estimatedDurationMins} دقيقة</strong></span>
                        </span>
                      </div>

                      {/* Passenger Note if provided */}
                      {order.passengerNote && (
                        <div className="text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/20 px-3 py-2 rounded-xl flex items-center gap-2">
                          <MessageSquare className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span>ملاحظة: {order.passengerNote}</span>
                        </div>
                      )}

                      {/* Counter-Offer Inline Form */}
                      {isCounteringThis ? (
                        <div className="bg-slate-950 border border-amber-500/40 rounded-2xl p-3 space-y-2 animate-in fade-in">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-amber-300">اقترح سعراً بديلاً (د.ج):</span>
                            <button
                              type="button"
                              onClick={() => setCounterRideId(null)}
                              className="text-slate-400 hover:text-white text-xs font-bold"
                            >
                              إلغاء
                            </button>
                          </div>

                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={counterPriceInput}
                              onChange={(e) => setCounterPriceInput(Number(e.target.value))}
                              step={10}
                              min={100}
                              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-black font-mono text-sm focus:outline-none focus:border-amber-500"
                            />
                            <button
                              type="button"
                              onClick={() => handleSendCounterOffer(order)}
                              disabled={isLoadingThis || counterPriceInput <= 0}
                              className="py-2 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>إرسال العرض</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Standard Action Buttons */
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => handleQuickAccept(order)}
                            disabled={isLoadingThis}
                            className="py-3 px-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 active:scale-95 text-slate-950 font-black rounded-2xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-emerald-500/25 cursor-pointer disabled:opacity-50"
                          >
                            <Check className="w-4 h-4" />
                            <span>اختيار وقبول ({formatCurrencyDZD(passengerFare)}) 🚀</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleStartCounterOffer(order)}
                            className="py-3 px-3 bg-slate-800 hover:bg-slate-750 active:scale-95 border border-slate-700 text-amber-400 font-black rounded-2xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                          >
                            <MessageSquare className="w-4 h-4 text-amber-400" />
                            <span>تفاوض / سعر مضاد 💬</span>
                          </button>
                        </div>
                      )}

                      {/* Reject / Skip Button */}
                      <div className="text-center">
                        <button
                          type="button"
                          onClick={() => rejectRide(order.id, activeDriver.id)}
                          className="text-[11px] text-slate-500 hover:text-slate-300 underline cursor-pointer"
                        >
                          تجاهل هذا الطلب ✕
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Active Ride View */}
        {activeSubTab === 'active' && currentDriverRide && (
          <div className="space-y-4 animate-in fade-in">
            <DriverActiveRide ride={currentDriverRide} />
          </div>
        )}

        {/* TAB 3: Past Orders History */}
        {activeSubTab === 'history' && (
          <div className="space-y-3 animate-in fade-in">
            {pastOrders.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center text-slate-400 text-xs">
                لا توجد طلبات سابقة مكتملة حتى الآن.
              </div>
            ) : (
              pastOrders.map((ride) => (
                <div
                  key={ride.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">{ride.passengerName}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        ride.status === 'completed'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-red-500/10 text-red-400'
                      }`}
                    >
                      {ride.status === 'completed' ? 'مكتملة بنجاح ✅' : 'ملغاة ❌'}
                    </span>
                  </div>

                  <div className="text-slate-400 text-[11px] space-y-0.5">
                    <p>من: {ride.pickup?.name || ride.pickup?.address}</p>
                    <p>إلى: {ride.destination?.name || ride.destination?.address}</p>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/60 font-mono">
                    <span>{ride.completedAt ? new Date(ride.completedAt).toLocaleTimeString('ar-DZ') : ''}</span>
                    <span className="font-black text-amber-400">
                      {formatCurrencyDZD(ride.finalPrice || ride.estimatedPrice)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Counter Offer & Negotiate Modal if open */}
      {selectedRideForModal && (
        <DriverIncomingRideModal
          ride={selectedRideForModal}
          onClose={() => setSelectedRideForModal(null)}
        />
      )}
    </div>
  );
};
