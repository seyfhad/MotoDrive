import React, { useState, useEffect, useRef } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Ride, DriverProfile, Coordinates } from '../../types';
import { GoogleMapView } from './GoogleMapView';
import {
  calculateDistanceKm,
  estimateDurationMinutes,
  fetchAccurateRoadRoute,
  calculateBearing,
} from '../../utils/geo';
import { formatCurrencyDZD } from '../../utils/pricing';
import {
  Navigation,
  Phone,
  Clock,
  MapPin,
  Flag,
  X,
  Gauge,
  Sparkles,
} from 'lucide-react';

export interface RideTrackerProps {
  rideId: string;
  initialRide?: Ride;
  onClose?: () => void;
  userRole?: 'passenger' | 'driver';
}

export const RideTracker: React.FC<RideTrackerProps> = ({
  rideId,
  initialRide,
  onClose,
}) => {
  const [ride, setRide] = useState<Ride | null>(initialRide || null);
  const [driver, setDriver] = useState<DriverProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(!initialRide);

  // Smooth live driver position & heading that dynamically updates along the road
  const [liveDriverPos, setLiveDriverPos] = useState<Coordinates | null>(null);
  const [liveHeading, setLiveHeading] = useState<number>(0);
  const routeWaypointsRef = useRef<[number, number][]>([]);
  const waypointIndexRef = useRef<number>(0);

  // Sync with parent initialRide updates (e.g. status transitions)
  useEffect(() => {
    if (initialRide) {
      setRide(initialRide);
      setIsLoading(false);
    }
  }, [initialRide]);

  // 1. Subscribe to real-time updates for the Ride document in Firestore
  useEffect(() => {
    if (!rideId) return;

    const rideRef = doc(db, 'rides', rideId);
    const unsubRide = onSnapshot(
      rideRef,
      (snap) => {
        if (snap.exists()) {
          const data = { id: snap.id, ...snap.data() } as Ride;
          setRide(data);
          setIsLoading(false);
        }
      },
      () => {
        setIsLoading(false);
      }
    );

    return () => unsubRide();
  }, [rideId]);

  // 2. Subscribe to real-time updates for the Driver document in Firestore
  useEffect(() => {
    const driverId = ride?.driverId;
    if (!driverId) return;

    const driverRef = doc(db, 'drivers', driverId);
    const unsubDriver = onSnapshot(
      driverRef,
      (snap) => {
        if (snap.exists()) {
          const dData = { id: snap.id, ...snap.data() } as DriverProfile;
          setDriver(dData);
          if (dData.location) {
            setLiveDriverPos(dData.location);
            if (dData.heading !== undefined) {
              setLiveHeading(dData.heading);
            }
          }
        }
      },
      () => {}
    );

    return () => unsubDriver();
  }, [ride?.driverId]);

  // Base driver coordinates from driver profile, ride, or initial offset near pickup
  const baseDriverCoords: Coordinates | null = React.useMemo(() => {
    if (driver?.location) return driver.location;
    if (ride?.driverLocation) return ride.driverLocation;
    if (ride?.offers && ride?.driverId) {
      const found = ride.offers.find((o) => o.driverId === ride.driverId)?.driverLocation;
      if (found) return found;
    }
    if (ride?.pickup) {
      return {
        lat: ride.pickup.lat + 0.0085,
        lng: ride.pickup.lng + 0.0095,
        name: 'موقع السائق',
      };
    }
    return null;
  }, [driver?.location?.lat, driver?.location?.lng, ride?.driverLocation?.lat, ride?.driverLocation?.lng, ride?.pickup?.lat, ride?.pickup?.lng, ride?.driverId]);

  // Determine stage & route endpoints
  const isApproachingPickup = ride?.status === 'accepted' || ride?.status === 'driver_arriving';
  const isAtPickup = ride?.status === 'driver_arrived';
  const isTripInProgress = ride?.status === 'trip_started';
  const isCompleted = ride?.status === 'completed';

  // Fetch road waypoints & smoothly advance driver along the road toward passenger / destination
  useEffect(() => {
    if (!ride) return;

    if (isAtPickup) {
      setLiveDriverPos(ride.pickup);
      return;
    }

    const startPoint = isApproachingPickup
      ? baseDriverCoords || {
          lat: ride.pickup.lat + 0.0085,
          lng: ride.pickup.lng + 0.0095,
        }
      : isTripInProgress
      ? liveDriverPos || ride.pickup
      : null;

    const targetPoint = isApproachingPickup
      ? ride.pickup
      : isTripInProgress
      ? ride.destination
      : null;

    if (!startPoint || !targetPoint) return;

    let isCancelled = false;
    let moveInterval: any = null;

    setLiveDriverPos(startPoint);

    fetchAccurateRoadRoute(startPoint, targetPoint).then((res) => {
      if (isCancelled) return;
      const points = res.coordinates;
      routeWaypointsRef.current = points;
      waypointIndexRef.current = 0;

      if (points.length >= 2) {
        moveInterval = setInterval(() => {
          const idx = waypointIndexRef.current;
          if (idx < points.length - 1) {
            const curr = { lat: points[idx][0], lng: points[idx][1] };
            const next = { lat: points[idx + 1][0], lng: points[idx + 1][1] };
            const heading = calculateBearing(curr, next);
            setLiveHeading(heading);
            setLiveDriverPos(next);
            waypointIndexRef.current = idx + 1;
          } else {
            clearInterval(moveInterval);
          }
        }, 2800);
      }
    });

    return () => {
      isCancelled = true;
      if (moveInterval) clearInterval(moveInterval);
    };
  }, [ride?.id, ride?.status]);

  if (isLoading || !ride) {
    return (
      <div className="w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center space-y-3">
        <div className="w-8 h-8 mx-auto border-2 border-yellow-300 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-slate-400">جاري تحميل مسار وتتبع الرحلة لحظياً...</p>
      </div>
    );
  }

  const effectiveDriverCoords = liveDriverPos || baseDriverCoords;
  const driverSpeed = (driver as any)?.speed ? Math.round((driver as any).speed * 3.6) : 38;

  // Dynamic Route calculation
  let routeFrom: Coordinates | null = null;
  let routeTo: Coordinates | null = null;
  let dynamicDistanceKm = 0;
  let dynamicEtaMinutes = 0;
  let statusText = 'جاري تتبع الرحلة';

  if (isApproachingPickup) {
    routeFrom = effectiveDriverCoords;
    routeTo = ride.pickup;
    if (effectiveDriverCoords && ride.pickup) {
      dynamicDistanceKm = calculateDistanceKm(effectiveDriverCoords, ride.pickup);
      dynamicEtaMinutes = estimateDurationMinutes(dynamicDistanceKm);
    }
    statusText = 'السائق في الطريق إليك';
  } else if (isAtPickup) {
    routeFrom = ride.pickup;
    routeTo = ride.destination;
    dynamicDistanceKm = calculateDistanceKm(ride.pickup, ride.destination);
    dynamicEtaMinutes = estimateDurationMinutes(dynamicDistanceKm);
    statusText = 'السائق وصل إلى موقعك وبانتظارك';
  } else if (isTripInProgress) {
    routeFrom = effectiveDriverCoords || ride.pickup;
    routeTo = ride.destination;
    if (routeFrom && ride.destination) {
      dynamicDistanceKm = calculateDistanceKm(routeFrom, ride.destination);
      dynamicEtaMinutes = estimateDurationMinutes(dynamicDistanceKm);
    }
    statusText = 'الرحلة جارية نحو الوجهة';
  } else if (isCompleted) {
    routeFrom = ride.pickup;
    routeTo = ride.destination;
    statusText = 'اكتملت الرحلة بنجاح';
  }

  const driverName = ride.driverName || driver?.name || 'سائق MotoDrive';
  const driverPhone = ride.driverPhone || driver?.phone || '0550000000';
  const motorcycle = ride.driverMotorcycle || driver?.motorcycle;

  return (
    <div
      className="bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl space-y-0 relative text-right"
      id="ride-tracker-container"
      dir="rtl"
    >
      {/* Top Floating Status Ribbon */}
      <div className="bg-slate-900/95 backdrop-blur-md px-4 py-3 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-300 animate-pulse"></span>
          <div>
            <div className="text-xs font-black text-white flex items-center gap-1.5">
              <span>{statusText}</span>
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            </div>
            <div className="text-[10px] text-slate-400">
              مسار مباشر يتحدث تلقائياً مع حركة السائق
            </div>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Interactive Map with live vehicle tracking and road polyline */}
      <div className="h-64 sm:h-72 w-full relative">
        <GoogleMapView
          center={
            effectiveDriverCoords
              ? [effectiveDriverCoords.lat, effectiveDriverCoords.lng]
              : [ride.pickup.lat, ride.pickup.lng]
          }
          zoom={15}
          pickup={ride.pickup}
          destination={isApproachingPickup ? undefined : ride.destination}
          routeFrom={routeFrom}
          routeTo={routeTo}
          routeColor="#fde047"
          activeDriverLocation={effectiveDriverCoords}
          activeDriverHeading={liveHeading}
          activeDriverStatus={driver?.isAvailable === false ? 'busy' : 'available'}
          interactive={true}
          className="h-full w-full rounded-none"
        />

        {/* Floating Live Telemetry Cards on Map */}
        <div className="absolute top-3 right-3 left-3 flex items-center justify-between pointer-events-none z-20">
          {/* ETA & Distance Pill */}
          <div className="bg-slate-950/90 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-yellow-300/40 shadow-xl flex items-center gap-3 pointer-events-auto">
            <div className="flex items-center gap-1 text-yellow-300 text-xs font-black">
              <Clock className="w-3.5 h-3.5" />
              <span>~{dynamicEtaMinutes > 0 ? dynamicEtaMinutes : 2} دقيقة</span>
            </div>
            <span className="w-1 h-3 bg-slate-800 rounded"></span>
            <div className="flex items-center gap-1 text-slate-200 text-xs font-bold">
              <Navigation className="w-3.5 h-3.5 text-yellow-300" />
              <span>{dynamicDistanceKm.toFixed(1)} كم</span>
            </div>
          </div>

          {/* Speed Indicator */}
          {(isApproachingPickup || isTripInProgress) && driverSpeed > 0 && (
            <div className="bg-slate-950/90 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-slate-800 text-[11px] font-mono text-yellow-200 flex items-center gap-1 shadow-lg pointer-events-auto">
              <Gauge className="w-3.5 h-3.5 text-yellow-300" />
              <span>{driverSpeed} كم/س</span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Driver Profile & Trip Details Card */}
      <div className="p-4 sm:p-5 bg-slate-900 space-y-3.5">
        {/* Driver Snapshot */}
        <div className="flex items-center justify-between gap-3 bg-slate-950/80 p-3 rounded-2xl border border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="relative w-11 h-11 rounded-2xl overflow-hidden border border-yellow-300/50 shadow-md shrink-0">
              <img
                src={ride.driverPhoto || '/icon.jpg'}
                alt={driverName}
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border border-slate-950 rounded-full" />
            </div>

            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-black text-white">{driverName}</span>
                <span className="text-[10px] text-yellow-300 font-bold bg-yellow-300/10 px-1.5 py-0.5 rounded">
                  ⭐ {(ride.driverRating ?? driver?.rating ?? 5.0).toFixed(1)}
                </span>
              </div>
              <div className="text-[11px] text-slate-300 mt-0.5">
                {motorcycle ? `${motorcycle.brand} ${motorcycle.model} (${motorcycle.color})` : 'دراجة نارية'}
              </div>
              {motorcycle?.plateNumber && (
                <div className="text-[10px] text-slate-400 font-mono">
                  لوحة: {motorcycle.plateNumber}
                </div>
              )}
            </div>
          </div>

          {/* Quick Action: Call Button */}
          <a
            href={`tel:${driverPhone}`}
            className="p-3 bg-yellow-300 hover:bg-yellow-200 text-slate-950 rounded-2xl font-black shadow-lg shadow-yellow-300/20 transition-all flex items-center justify-center shrink-0 active:scale-95"
            title="اتصال مباشر بالسائق"
          >
            <Phone className="w-4 h-4" />
          </a>
        </div>

        {/* Trip Points Summary */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
            <div className="text-[10px] text-slate-400 flex items-center gap-1 mb-0.5">
              <MapPin className="w-3 h-3 text-yellow-300 shrink-0" />
              <span>الانطلاق:</span>
            </div>
            <div className="text-white font-bold text-[11px] truncate">
              {ride.pickup.name || ride.pickup.address || 'موقعك الحالي'}
            </div>
          </div>

          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
            <div className="text-[10px] text-slate-400 flex items-center gap-1 mb-0.5">
              <Flag className="w-3 h-3 text-yellow-300 shrink-0" />
              <span>الوجهة:</span>
            </div>
            <div className="text-white font-bold text-[11px] truncate">
              {ride.destination.name || ride.destination.address || 'الوجهة المحددة'}
            </div>
          </div>
        </div>

        {/* Price & Payment Footer */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-xs">
          <span className="text-slate-400 text-[11px]">أجرة الرحلة المتفق عليها:</span>
          <span className="text-sm font-black text-yellow-300">
            {formatCurrencyDZD(ride.finalPrice || ride.passengerOfferedPrice || ride.estimatedPrice)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default RideTracker;
