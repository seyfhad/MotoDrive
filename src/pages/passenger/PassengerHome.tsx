import React, { useCallback, useEffect, useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { LeafletMap } from '../../components/Map/LeafletMap';
import { BookRideModal } from './BookRideModal';
import { ActiveRideView } from './ActiveRideView';
import { ALGERIA_LOCATIONS, reverseGeocodeCoords } from '../../utils/geo';
import { Coordinates } from '../../types';
import { Navigation, RefreshCw, Sparkles } from 'lucide-react';

const DEFAULT_MAP_CENTER: Coordinates = {
  lat: 36.7538,
  lng: 3.0588,
  name: 'وسط الجزائر العاصمة',
  address: 'ساحة البريد المركزي، الجزائر العاصمة',
};

export const PassengerHome: React.FC = () => {
  const { currentPassengerRide, drivers } = useApp();
  const [selectedPickup, setSelectedPickup] = useState<Coordinates>(ALGERIA_LOCATIONS[2]?.coords || DEFAULT_MAP_CENTER);
  const [selectedDestination, setSelectedDestination] = useState<Coordinates | null>(ALGERIA_LOCATIONS[4]?.coords || null);
  const [isLocating, setIsLocating] = useState(false);
  const [gpsStatusMessage, setGpsStatusMessage] = useState<string | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);

  const requestUserLocation = useCallback(() => {
    setIsLocating(true);
    setGpsStatusMessage('جارٍ طلب إذن الوصول إلى موقعك...');

    if (!navigator.geolocation) {
      setIsLocating(false);
      setGpsStatusMessage('⚠️ تحديد الموقع غير مدعوم في هذا المتصفح.');
      return;
    }

    // Calling getCurrentPosition directly here deliberately triggers the browser/webview
    // permission dialog when permission is still in the prompt state.
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const address = await reverseGeocodeCoords(coords.latitude, coords.longitude);
        setSelectedPickup({
          lat: coords.latitude,
          lng: coords.longitude,
          name: address || 'موقعي الحالي (GPS)',
          address: address || `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`,
        });
        setGpsStatusMessage(address ? `تم تحديد موقعك: ${address}` : 'تم تحديد موقعك الجغرافي بنجاح.');
        setIsLocating(false);
      },
      (error) => {
        const message = error.code === error.PERMISSION_DENIED
          ? '⚠️ تم رفض إذن الموقع. فعّل الموقع من إعدادات المتصفح أو الجهاز ثم حاول مرة أخرى.'
          : '⚠️ تعذر تحديد موقعك. تأكد من تشغيل GPS ثم حاول مرة أخرى.';
        setGpsStatusMessage(message);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  // Request location on mount so the native browser/webview prompt appears immediately.
  useEffect(() => {
    requestUserLocation();
  }, [requestUserLocation]);

  const handleMapClick = async (coords: Coordinates) => {
    const address = await reverseGeocodeCoords(coords.lat, coords.lng);
    setSelectedPickup({ ...coords, name: address || 'موقع محدد على الخريطة', address });
  };

  return (
    <div className="relative min-h-[calc(100vh-65px)] pb-24 text-slate-100" id="passenger-home-screen">
      <div className="h-72 sm:h-96 w-full relative">
        <LeafletMap
          center={[selectedPickup.lat, selectedPickup.lng]}
          zoom={14}
          pickup={currentPassengerRide?.pickup || selectedPickup}
          destination={currentPassengerRide?.destination || selectedDestination}
          drivers={drivers}
          activeDriverLocation={currentPassengerRide?.driverLocation}
          showRadar={currentPassengerRide?.status === 'searching'}
          interactive
          onMapClick={handleMapClick}
          className="h-full w-full rounded-none"
        />

        <button
          type="button"
          id="gps-floating-locate-btn"
          onClick={requestUserLocation}
          disabled={isLocating}
          className="absolute bottom-12 left-4 z-20 p-3 rounded-2xl bg-slate-900/95 hover:bg-slate-800 border border-amber-500/40 text-amber-400 shadow-xl flex items-center gap-2 text-xs font-bold"
        >
          <Navigation className={`w-4 h-4 ${isLocating ? 'animate-spin' : ''}`} />
          <span>تحديد موقعي الآن</span>
        </button>

        {gpsStatusMessage && (
          <div className="absolute top-4 left-4 right-4 z-30 bg-slate-900/95 border border-amber-500/50 rounded-2xl p-3 text-xs text-amber-300 shadow-2xl backdrop-blur-md flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="flex-1">{gpsStatusMessage}</span>
            {!isLocating && gpsStatusMessage.startsWith('⚠️') && (
              <button
                type="button"
                onClick={requestUserLocation}
                className="shrink-0 rounded-xl bg-amber-500 px-2.5 py-1.5 text-[11px] font-black text-slate-950"
              >
                تحديد موقعي الآن
              </button>
            )}
          </div>
        )}
      </div>

      <div className="max-w-md mx-auto px-4 -mt-8 relative z-30 space-y-4">
        {currentPassengerRide ? (
          <ActiveRideView ride={currentPassengerRide} />
        ) : (
          <div className="bg-slate-900 border border-slate-800/90 rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="text-right">
              <h2 className="text-lg font-black text-white">أين تريد الذهاب؟</h2>
              <p className="text-xs text-slate-400 mt-1">موقع الانطلاق: {selectedPickup.name || selectedPickup.address}</p>
            </div>
            <button
              type="button"
              onClick={() => setShowBookingModal(true)}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-2xl"
            >
              اطلب رحلة دراجة الآن
            </button>
            <button
              type="button"
              onClick={requestUserLocation}
              disabled={isLocating}
              className="w-full py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 text-xs font-semibold flex items-center justify-center gap-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} /> تحديث الموقع
            </button>
          </div>
        )}
      </div>

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
