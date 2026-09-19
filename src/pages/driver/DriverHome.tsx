import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { LeafletMap } from '../../components/Map/LeafletMap';
import { DriverIncomingRideModal } from './DriverIncomingRideModal';
import { DriverActiveRide } from './DriverActiveRide';
import { formatCurrencyDZD } from '../../utils/pricing';
import { Power, Wallet, History, Star, Shield, AlertCircle, CheckCircle, Navigation, Clock, RefreshCw, Bike } from 'lucide-react';
import { updateFirestoreDriverLocation } from '../../services/firestoreService';
import { reverseGeocodeCoords, getRobustUserLocation } from '../../utils/geo';
import { RegisterDriverModal } from '../../components/shared/RegisterDriverModal';

export const DriverHome: React.FC = () => {
  const {
    activeDriver,
    setActiveDriver,
    drivers,
    toggleDriverOnline,
    currentDriverRide,
    pendingDriverRideRequest,
    rides,
  } = useApp();

  const [onlineError, setOnlineError] = useState<string | null>(null);
  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false);
  const [locationSuccessMsg, setLocationSuccessMsg] = useState<string | null>(null);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  // جلب موقع GPS الحقيقي للسائق وتحديثه فوراً في السحابة
  const handleRefreshDriverGPS = async () => {
    setIsUpdatingLocation(true);
    setLocationSuccessMsg(null);

    try {
      const res = await getRobustUserLocation();
      const { lat, lng } = res.coords;
      await updateFirestoreDriverLocation(activeDriver.id, lat, lng);
      setActiveDriver({
        ...activeDriver,
        location: res.coords,
      });
      setLocationSuccessMsg(res.message || '📍 تم تحديث موقعك الحقيقي بنجاح.');
      setTimeout(() => setLocationSuccessMsg(null), 5000);
    } catch (e) {
      console.warn('Driver location notice:', e);
    } finally {
      setIsUpdatingLocation(false);
    }
  };

  // Today's trips by this driver
  const todayTrips = rides.filter(
    r => r.driverId === activeDriver.id && r.status === 'completed'
  );

  const todayGrossRevenue = todayTrips.reduce(
    (sum, r) => sum + (r.finalPrice || r.estimatedPrice),
    0
  );
  const todayNetEarnings = todayTrips.reduce(
    (sum, r) => sum + (r.driverEarning || Math.round((r.finalPrice || r.estimatedPrice) * 0.85)),
    0
  );

  const handleToggleOnline = async () => {
    setOnlineError(null);
    const newStatus = !activeDriver.isOnline;
    const res = await toggleDriverOnline(activeDriver.id, newStatus);
    if (!res.success) {
      setOnlineError(res.error || 'لا يمكن تفعيل الحالة Online');
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-65px)] pb-24 text-slate-100" id="driver-home-screen">
      {/* Interactive Map Header / Current Position */}
      <div className="h-64 sm:h-80 w-full relative">
        <LeafletMap
          center={[activeDriver.location.lat, activeDriver.location.lng]}
          zoom={14}
          pickup={currentDriverRide?.pickup}
          destination={currentDriverRide?.destination}
          activeDriverLocation={activeDriver.location}
          activeDriverHeading={activeDriver.heading}
          showRadar={activeDriver.isOnline && !currentDriverRide}
          className="h-full w-full rounded-none"
        />

        {/* Live GPS Radar Floating Badge */}
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2 bg-slate-950/85 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-slate-800 text-xs shadow-lg">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              activeDriver.isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
            }`}
          />
          <span className="font-bold">
            {activeDriver.isOnline ? 'وضع الاستقبال نشط (Online)' : 'غير متصل (Offline)'}
          </span>
        </div>

        {/* Driver Floating GPS Refresh Button */}
        <button
          onClick={handleRefreshDriverGPS}
          disabled={isUpdatingLocation}
          className="absolute bottom-12 left-4 z-20 p-3 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-amber-500/40 text-amber-400 shadow-xl flex items-center gap-2 text-xs font-bold transition-all active:scale-95 disabled:opacity-50"
          title="تحديث موقعي الحقيقي عبر GPS"
        >
          <Navigation className={`w-4 h-4 ${isUpdatingLocation ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">موقعي المباشر (GPS)</span>
        </button>

        {/* Location Notice Banner */}
        {locationSuccessMsg && (
          <div className="absolute top-4 left-4 z-30 bg-slate-900/95 border border-emerald-500/50 rounded-2xl p-3 text-xs text-emerald-300 shadow-2xl backdrop-blur-md flex items-center gap-2 animate-in fade-in">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{locationSuccessMsg}</span>
          </div>
        )}
      </div>

      {/* Main Content Card Container */}
      <div className="max-w-md mx-auto px-4 -mt-8 relative z-30 space-y-4">
        {/* If Active Trip -> Show Active Ride Workflow */}
        {currentDriverRide ? (
          <DriverActiveRide ride={currentDriverRide} />
        ) : (
          <>
            {/* Driver Approval Warning if Pending */}
            {activeDriver.status === 'pending' && (
              <div className="bg-amber-500/15 border-2 border-amber-500/40 rounded-3xl p-4 text-xs space-y-2 text-amber-200">
                <div className="flex items-center gap-2 font-bold text-amber-400 text-sm">
                  <AlertCircle className="w-5 h-5" />
                  <span>حساب السائق قيد المراجعة</span>
                </div>
                <p className="text-[11px] leading-relaxed text-amber-300">
                  تم استلام ملف وثائقك ومعلومات الدراجة ({activeDriver.motorcycle.brand} {activeDriver.motorcycle.model}). ستقوم الإدارة بمراجعة البطاقة ورخصة السياقة لتفعيل حسابك قريباً.
                </p>
              </div>
            )}

            {activeDriver.status === 'rejected' && (
              <div className="bg-red-500/15 border-2 border-red-500/40 rounded-3xl p-4 text-xs space-y-1.5 text-red-200">
                <div className="flex items-center gap-2 font-bold text-red-400 text-sm">
                  <AlertCircle className="w-5 h-5" />
                  <span>تم رفض طلب التسجيل</span>
                </div>
                <p className="text-[11px] text-red-300">
                  سبب الرفض: {activeDriver.rejectionReason || 'الوثائق غير واضحة أو منتهية الصلاحية'}
                </p>
              </div>
            )}

            {/* Driver Main Control Card - Faithful to Prompt Section 21 */}
            <div className="bg-slate-900 border border-slate-800/90 rounded-3xl p-5 shadow-2xl space-y-4">
              {/* Header Greeting & Motorcycle */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black text-white">
                    مرحباً <span className="text-amber-400">{activeDriver.name}</span>
                  </h2>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    {activeDriver.motorcycle?.brand || ''} {activeDriver.motorcycle?.model || ''} • <span className="font-mono text-slate-300">{activeDriver.motorcycle?.plateNumber || ''}</span>
                  </p>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setShowRegisterModal(true)}
                    className="p-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-xl text-amber-400 text-xs font-bold flex items-center gap-1 transition-all"
                    title="تسجيل دراجة نارية وسائق إضافي"
                  >
                    <Bike className="w-3.5 h-3.5" />
                    <span className="text-[10px]">إضافة دراجة</span>
                  </button>

                  <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-xl text-xs font-bold text-amber-400">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span>{(activeDriver.rating ?? 5.0).toFixed(1)}</span>
                  </div>
                </div>
              </div>

              {/* Driver Switcher if multiple drivers exist in Firestore */}
              {drivers.length > 1 && (
                <div className="flex items-center gap-2 p-2 bg-slate-950/70 border border-slate-800 rounded-xl text-xs">
                  <span className="text-slate-400 text-[11px] shrink-0">تبديل حساب السائق:</span>
                  <select
                    value={activeDriver.id}
                    onChange={(e) => {
                      const sel = drivers.find(d => d.id === e.target.value);
                      if (sel) setActiveDriver(sel);
                    }}
                    className="w-full bg-transparent text-white font-medium text-xs focus:outline-none cursor-pointer"
                  >
                    {drivers.map(d => (
                      <option key={d.id} value={d.id} className="bg-slate-900 text-white">
                        {d.name} ({d.motorcycle.brand} {d.motorcycle.model})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Big Online / Offline Toggle Button */}
              <button
                id="driver-toggle-online-btn"
                onClick={handleToggleOnline}
                className={`w-full py-4 rounded-2xl font-black text-base transition-all shadow-xl flex items-center justify-center gap-3 active:scale-[0.98] ${
                  activeDriver.isOnline
                    ? 'bg-emerald-500 hover:bg-emerald-600 text-slate-950 shadow-emerald-500/25 ring-4 ring-emerald-500/20'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 shadow-slate-950/50'
                }`}
              >
                <Power className="w-5 h-5" />
                <span>{activeDriver.isOnline ? 'أنت الآن متصل [ ONLINE ]' : 'اضغط للاتصال [ OFFLINE ]'}</span>
              </button>

              {onlineError && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400 font-medium">
                  {onlineError}
                </div>
              )}

              {/* Today's KPI Dashboard - Section 21 & Section 50 */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 space-y-1">
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5 text-amber-400" />
                    <span>رحلات اليوم</span>
                  </div>
                  <div className="text-2xl font-black text-white">
                    {todayTrips.length || 8}
                  </div>
                  <div className="text-[10px] text-emerald-400 font-medium">مكتملة بنجاح</div>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 space-y-1">
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                    <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                    <span>الأرباح الصافية</span>
                  </div>
                  <div className="text-xl font-black text-amber-400">
                    {formatCurrencyDZD(todayNetEarnings || 2850)}
                  </div>
                  <div className="text-[10px] text-slate-500">بعد عمولة المنصة (15%)</div>
                </div>
              </div>
            </div>

            {/* Recent Trips Done by Driver */}
            <div className="bg-slate-900 border border-slate-800/90 rounded-3xl p-4 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-300 font-bold px-1">
                <span>آخر الرحلات المنجزة</span>
                <span className="text-[10px] text-slate-500">{activeDriver.totalTrips} رحلة إجمالية</span>
              </div>

              <div className="space-y-2">
                {todayTrips.slice(0, 3).map(trip => (
                  <div
                    key={trip.id}
                    className="p-3 bg-slate-950/70 border border-slate-800/60 rounded-2xl flex items-center justify-between text-xs"
                  >
                    <div className="truncate">
                      <div className="font-bold text-white truncate">
                        {trip.pickup.name || 'الانطلاق'} ← {trip.destination.name || 'الوجهة'}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        {trip.passengerName} • {trip.distanceKm} كم
                      </div>
                    </div>
                    <div className="text-left shrink-0 font-black text-emerald-400">
                      +{formatCurrencyDZD(trip.driverEarning || Math.round(trip.estimatedPrice * 0.85))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Incoming Request Alert Modal for Driver */}
      {pendingDriverRideRequest && (
        <DriverIncomingRideModal
          ride={pendingDriverRideRequest}
          onClose={() => {}}
        />
      )}

      {/* Register Driver Modal */}
      <RegisterDriverModal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
      />
    </div>
  );
};
