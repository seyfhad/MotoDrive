import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { LeafletMap } from '../../components/Map/LeafletMap';
import { BookRideModal } from './BookRideModal';
import { ActiveRideView } from './ActiveRideView';
import { ALGERIA_LOCATIONS, reverseGeocodeCoords, getRobustUserLocation } from '../../utils/geo';
import { Coordinates } from '../../types';
import { formatCurrencyDZD } from '../../utils/pricing';
import { MapPin, Navigation, ArrowLeft, History, Shield, Sparkles, Plus, Clock, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';

export const PassengerHome: React.FC = () => {
  const { activePassenger, currentPassengerRide, rides, drivers } = useApp();

  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedPickup, setSelectedPickup] = useState<Coordinates | null>(ALGERIA_LOCATIONS[2].coords);
  const [selectedDestination, setSelectedDestination] = useState<Coordinates | null>(ALGERIA_LOCATIONS[4].coords);
  const [isLocating, setIsLocating] = useState(false);
  const [gpsStatusMessage, setGpsStatusMessage] = useState<string | null>(null);
  const [mapSelectionMode, setMapSelectionMode] = useState<'pickup' | 'destination' | null>(null);
  const [mapNotice, setMapNotice] = useState<string | null>(null);

  // جلب موقع الـ GPS الحقيقي للهاتف أو الحاسوب مع طلب إذن صريح وعكس الإحداثيات لاسم شارع حقيقي
  const handleGetRealGPSLocation = async () => {
    setIsLocating(true);
    setGpsStatusMessage(null);

    try {
      const res = await getRobustUserLocation();
      setSelectedPickup(res.coords);
      if (res.message) {
        setGpsStatusMessage(res.message);
      }
    } catch (e) {
      setGpsStatusMessage('تعذر جلب موقعك. يمكنك النقر على الخريطة مباشرة لتحديد المكان.');
    } finally {
      setIsLocating(false);
      setTimeout(() => setGpsStatusMessage(null), 6000);
    }
  };

  // محاولة أخذ الموقع عند التشغيل
  useEffect(() => {
    handleGetRealGPSLocation();
  }, []);

  // النقر المباشر على الخريطة لتحديد موقع الانطلاق أو الوجهة
  const handleMapClick = async (coords: Coordinates) => {
    try {
      const address = await reverseGeocodeCoords(coords.lat, coords.lng);
      const newPlace: Coordinates = {
        lat: coords.lat,
        lng: coords.lng,
        name: address || 'مكان محدد على الخريطة',
        address: address || `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`,
      };

      if (mapSelectionMode === 'pickup') {
        setSelectedPickup(newPlace);
        setMapNotice(`📍 تم تعيين موقع الانطلاق: ${address}`);
        setMapSelectionMode(null);
      } else {
        setSelectedDestination(newPlace);
        setMapNotice(`🏁 تم تعيين الوجهة: ${address}`);
        setMapSelectionMode(null);
      }

      setTimeout(() => setMapNotice(null), 4000);
    } catch (e) {
      console.warn('Map click geocode failed:', e);
    }
  };

  // Recent trips completed by this passenger
  const pastTrips = rides
    .filter(r => r.passengerId === activePassenger.id && r.status === 'completed')
    .slice(0, 3);

  const handleQuickLocationSelect = (coords: Coordinates) => {
    setSelectedDestination(coords);
    setShowBookingModal(true);
  };

  return (
    <div className="relative min-h-[calc(100vh-65px)] pb-24 text-slate-100" id="passenger-home-screen">
      {/* Interactive Map Header / Background */}
      <div className="h-72 sm:h-96 w-full relative">
        <LeafletMap
          center={selectedPickup ? [selectedPickup.lat, selectedPickup.lng] : [36.7538, 3.0588]}
          zoom={14}
          pickup={currentPassengerRide?.pickup || selectedPickup}
          destination={currentPassengerRide?.destination || selectedDestination}
          drivers={drivers}
          activeDriverLocation={currentPassengerRide?.driverLocation}
          showRadar={currentPassengerRide?.status === 'searching'}
          interactive={true}
          onMapClick={handleMapClick}
          className="h-full w-full rounded-none"
        />

        {/* Floating Map Overlay Badges */}
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-800 text-xs text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>{drivers.filter(d => d.isOnline).length} سائق دراجة متاح</span>
        </div>

        {/* Floating GPS Button & Map Pinning Controls */}
        <div className="absolute bottom-12 left-4 z-20 flex flex-col gap-2">
          <button
            id="gps-floating-locate-btn"
            onClick={handleGetRealGPSLocation}
            disabled={isLocating}
            className="p-3 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-amber-500/40 text-amber-400 shadow-xl flex items-center gap-2 text-xs font-bold transition-transform active:scale-95 disabled:opacity-50"
            title="تحديد موقعي الفعلي عبر GPS"
          >
            <Navigation className={`w-4 h-4 ${isLocating ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">موقعي الفعلي (GPS)</span>
          </button>

          <button
            onClick={() => setMapSelectionMode(mapSelectionMode === 'destination' ? null : 'destination')}
            className={`p-2.5 rounded-2xl border text-xs font-bold shadow-xl flex items-center gap-1.5 transition-all ${
              mapSelectionMode === 'destination'
                ? 'bg-amber-500 text-slate-950 border-amber-400 animate-pulse'
                : 'bg-slate-900/90 text-slate-200 border-slate-700 hover:bg-slate-800'
            }`}
          >
            <span>🏁</span>
            <span className="text-[11px]">{mapSelectionMode === 'destination' ? 'انقر على الخريطة الآن...' : 'حدد وجهة بالخريطة'}</span>
          </button>
        </div>

        {/* Live GPS / Map Click Banner */}
        {(gpsStatusMessage || mapNotice) && (
          <div className="absolute top-4 left-4 right-4 sm:left-auto sm:right-40 z-30 bg-slate-900/95 border border-amber-500/50 rounded-2xl p-3 text-xs text-amber-300 shadow-2xl backdrop-blur-md flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="flex-1">{gpsStatusMessage || mapNotice}</span>
          </div>
        )}
      </div>

      {/* Main Content Container */}
      <div className="max-w-md mx-auto px-4 -mt-8 relative z-30 space-y-4">
        {/* If there is an active ride, show the live tracking / radar card */}
        {currentPassengerRide ? (
          <ActiveRideView ride={currentPassengerRide} />
        ) : (
          <>
            {/* Booking Card */}
            <div className="bg-slate-900 border border-slate-800/90 rounded-3xl p-5 shadow-2xl space-y-4">
              {/* Greeting */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black text-white">
                    مرحباً، <span className="text-amber-400">{activePassenger.name.split(' ')[0]}</span> 👋
                  </h2>
                  <p className="text-xs text-slate-400 font-medium">أين تريد الذهاب اليوم بالدراجة؟</p>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-lg">
                  🛵
                </div>
              </div>

              {/* Pickup & Destination Interactive Fields */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setShowBookingModal(true)}
                    className="flex-1 flex items-center gap-3 text-right hover:opacity-90 transition-opacity truncate"
                  >
                    <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500 text-emerald-400 flex items-center justify-center text-xs shrink-0">
                      📍
                    </div>
                    <div className="truncate flex-1">
                      <div className="text-[10px] text-emerald-400 font-semibold">موقع الانطلاق</div>
                      <div className="text-xs font-bold text-slate-200 truncate">
                        {selectedPickup?.name || selectedPickup?.address || 'موقعي الحالي'}
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={handleGetRealGPSLocation}
                    disabled={isLocating}
                    className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl text-amber-400 text-xs flex items-center gap-1 transition-all shrink-0"
                    title="تحديث الموقع"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
                    <span className="text-[10px]">تحديث</span>
                  </button>
                </div>

                <div className="h-px bg-slate-800/80 mx-2"></div>

                <button
                  onClick={() => setShowBookingModal(true)}
                  className="w-full flex items-center gap-3 text-right hover:opacity-90 transition-opacity"
                >
                  <div className="w-7 h-7 rounded-full bg-amber-500/20 border border-amber-500 text-amber-400 flex items-center justify-center text-xs shrink-0">
                    🏁
                  </div>
                  <div className="truncate flex-1">
                    <div className="text-[10px] text-amber-400 font-semibold">إلى أين؟ (الوجهة)</div>
                    <div className="text-xs font-bold text-slate-400 group-hover:text-white truncate">
                      {selectedDestination?.name || 'اختر وجهتك أو ابحث عن مكان'}
                    </div>
                  </div>
                </button>
              </div>

              {/* Main Call to Action Button */}
              <button
                id="passenger-order-ride-main-btn"
                onClick={() => setShowBookingModal(true)}
                className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-2xl shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2 text-base transition-all active:scale-[0.98]"
              >
                <span>اطلب رحلة دراجة الآن</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Destinations */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs px-1 text-slate-400 font-semibold">
                <span>وجهات شائعة وسريعة</span>
                <span className="text-[10px] text-amber-400">توفير الوقت في الزحام</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {ALGERIA_LOCATIONS.slice(0, 4).map((loc, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleQuickLocationSelect(loc.coords)}
                    className="p-3 bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800/80 rounded-2xl text-right transition-all group"
                  >
                    <div className="text-xs font-bold text-white group-hover:text-amber-400 truncate">
                      {loc.name.split('(')[0]}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{loc.wilaya}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Recent Trips Section */}
            <div className="bg-slate-900/90 border border-slate-800/80 rounded-3xl p-4 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-300 font-bold px-1">
                <div className="flex items-center gap-1.5">
                  <History className="w-4 h-4 text-amber-400" />
                  <span>رحلاتك الأخيرة</span>
                </div>
                <span className="text-[10px] text-slate-500 font-normal">سجل الرحلات</span>
              </div>

              {pastTrips.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-500">
                  لا توجد رحلات سابقة حتى الآن. اطلب رحلتك الأولى!
                </div>
              ) : (
                <div className="space-y-2">
                  {pastTrips.map(trip => (
                    <div
                      key={trip.id}
                      onClick={() => {
                        setSelectedPickup(trip.pickup);
                        setSelectedDestination(trip.destination);
                        setShowBookingModal(true);
                      }}
                      className="p-3 bg-slate-950/70 hover:bg-slate-800/60 border border-slate-800/60 rounded-2xl flex items-center justify-between text-xs cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <span className="text-base">🏍️</span>
                        <div className="truncate">
                          <div className="font-bold text-white truncate">
                            {trip.pickup.name || 'الانطلاق'} ← {trip.destination.name || 'الوجهة'}
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            {new Date(trip.requestedAt).toLocaleDateString('ar-DZ')} • {trip.distanceKm} كم
                          </div>
                        </div>
                      </div>

                      <div className="text-left shrink-0">
                        <div className="font-black text-amber-400">{formatCurrencyDZD(trip.finalPrice || trip.estimatedPrice)}</div>
                        <div className="text-[9px] text-emerald-400 font-medium">مكتملة</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Booking Modal */}
      {showBookingModal && (
        <BookRideModal
          onClose={() => setShowBookingModal(false)}
          onRideBooked={() => setShowBookingModal(false)}
          initialPickup={selectedPickup}
          initialDestination={selectedDestination}
        />
      )}
    </div>
  );
};
