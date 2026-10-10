import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  Map,
  AdvancedMarker,
  InfoWindow,
  Circle,
  useMap,
  useMapsLibrary,
  MapMouseEvent,
} from '@vis.gl/react-google-maps';
import { LeafletFallbackMap } from './LeafletFallbackMap';
import { Coordinates, DriverProfile } from '../../types';
import { getRobustUserLocation, startBackgroundLocationTracking } from '../../utils/geo';
import { Navigation } from 'lucide-react';

export interface GoogleMapViewProps {
  center?: [number, number];
  zoom?: number;
  pickup?: Coordinates | null;
  destination?: Coordinates | null;
  routeFrom?: Coordinates | null;
  routeTo?: Coordinates | null;
  routeColor?: string;
  drivers?: DriverProfile[];
  activeDriverLocation?: Coordinates | null;
  activeDriverHeading?: number;
  activeDriverStatus?: 'available' | 'busy';
  interactive?: boolean;
  onMapClick?: (coords: Coordinates) => void;
  showRadar?: boolean;
  radarRadiusMeters?: number;
  className?: string;
  theme?: 'dark' | 'light';
}

// Sub-component that accesses `useMap()` and `useMapsLibrary()` for routes, bounds, and polylines
const MapController: React.FC<{
  pickup?: Coordinates | null;
  destination?: Coordinates | null;
  routeFrom?: Coordinates | null;
  routeTo?: Coordinates | null;
  routeColor?: string;
  activeDriverLocation?: Coordinates | null;
  drivers?: DriverProfile[];
  center: [number, number];
  zoom: number;
}> = ({
  pickup,
  destination,
  routeFrom,
  routeTo,
  routeColor,
  activeDriverLocation,
  drivers = [],
  center,
  zoom,
}) => {
  const map = useMap();
  const routesLib = useMapsLibrary('routes');
  const routePolylineRef = useRef<google.maps.Polyline | null>(null);

  // 1. Auto-fit camera bounds when points change
  useEffect(() => {
    if (!map) return;

    const points: google.maps.LatLngLiteral[] = [];
    const p1 = routeFrom || pickup;
    const p2 = routeTo || destination;
    if (p1) points.push({ lat: p1.lat, lng: p1.lng });
    if (p2) points.push({ lat: p2.lat, lng: p2.lng });
    if (activeDriverLocation && (!p1 || activeDriverLocation.lat !== p1.lat)) {
      points.push({ lat: activeDriverLocation.lat, lng: activeDriverLocation.lng });
    }

    if (points.length > 1) {
      const bounds = new google.maps.LatLngBounds();
      points.forEach(p => bounds.extend(p));
      map.fitBounds(bounds, { top: 60, right: 60, bottom: 60, left: 60 });
    } else if (points.length === 1 && !p2) {
      map.panTo(points[0]);
    } else if (points.length === 0) {
      map.panTo({ lat: center[0], lng: center[1] });
      map.setZoom(zoom);
    }
  }, [
    map,
    pickup?.lat,
    pickup?.lng,
    destination?.lat,
    destination?.lng,
    activeDriverLocation?.lat,
    activeDriverLocation?.lng,
  ]);

  // 2. Compute accurate road route between points using modern Routes API or OSRM fallback
  useEffect(() => {
    if (!map || !routesLib) return;

    // Clean up previous polyline
    if (routePolylineRef.current) {
      routePolylineRef.current.setMap(null);
      routePolylineRef.current = null;
    }

    const start = routeFrom || pickup;
    const end = routeTo || destination;
    if (!start || !end) return;

    const origin = { lat: start.lat, lng: start.lng };
    const dest = { lat: end.lat, lng: end.lng };

    let animInterval: any = null;
    let cleanupAnim: (() => void) | null = null;

    const setupAnimatedPolyline = (path: any) => {
      // 1. Base solid path
      const polyline = new google.maps.Polyline({
        path,
        strokeColor: routeColor || '#f59e0b',
        strokeOpacity: 0.85,
        strokeWeight: 6,
        map,
      });
      routePolylineRef.current = polyline;

      // 2. Animated dashing / pulsing symbol on top to show movement towards passenger
      const lineSymbol = {
        path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
        scale: 3,
        strokeColor: '#ffffff',
        fillColor: '#10b981',
        fillOpacity: 1,
        strokeWeight: 1.5,
      };

      const animatedLine = new google.maps.Polyline({
        path,
        strokeColor: '#10b981',
        strokeOpacity: 0,
        icons: [
          {
            icon: lineSymbol,
            offset: '0%',
            repeat: '60px',
          },
        ],
        map,
      });

      let count = 0;
      animInterval = setInterval(() => {
        count = (count + 1.5) % 100;
        const icons = animatedLine.get('icons');
        if (icons && icons[0]) {
          icons[0].offset = count + '%';
          animatedLine.set('icons', icons);
        }
      }, 50);

      // Keep both clean on unmount
      return () => {
        clearInterval(animInterval);
        animatedLine.setMap(null);
      };
    };

    // Try TWO_WHEELER first for motorcycles, fallback to DRIVING, then free OSRM road geometry
    const computeRouteWithMode = async (mode: 'TWO_WHEELER' | 'DRIVING') => {
      try {
        if (!routesLib?.Route) return false;
        const request = {
          origin,
          destination: dest,
          travelMode: mode,
          fields: ['path', 'distanceMeters', 'durationMillis', 'viewport'],
        };
        const res = await (routesLib.Route as any).computeRoutes(request);
        const route = res.routes?.[0];
        if (route?.path && route.path.length > 0) {
          cleanupAnim = setupAnimatedPolyline(route.path);
          return true;
        }
      } catch {
        return false;
      }
      return false;
    };

    // Free road routing fallback via OSRM (100% free, no billing needed)
    const fetchOsrmRoute = async (): Promise<google.maps.LatLngLiteral[] | null> => {
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${dest.lng},${dest.lat}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (data.routes?.[0]?.geometry?.coordinates?.length) {
            return data.routes[0].geometry.coordinates.map((c: [number, number]) => ({
              lat: c[1],
              lng: c[0],
            }));
          }
        }
      } catch {
        // Fallback to direct geodesic
      }
      return null;
    };

    computeRouteWithMode('TWO_WHEELER').then((success) => {
      if (!success) {
        computeRouteWithMode('DRIVING').then(async (drvSuccess) => {
          if (!drvSuccess && map) {
            const osrmPath = await fetchOsrmRoute();
            const finalPath = osrmPath || [origin, dest];
            cleanupAnim = setupAnimatedPolyline(finalPath);
          }
        });
      }
    });

    return () => {
      if (animInterval) clearInterval(animInterval);
      if (cleanupAnim) cleanupAnim();
      if (routePolylineRef.current) {
        routePolylineRef.current.setMap(null);
        routePolylineRef.current = null;
      }
    };
  }, [
    map,
    routesLib,
    pickup?.lat,
    pickup?.lng,
    destination?.lat,
    destination?.lng,
    routeFrom?.lat,
    routeFrom?.lng,
    routeTo?.lat,
    routeTo?.lng,
    routeColor,
  ]);

  return null;
};

export const GoogleMapView: React.FC<GoogleMapViewProps> = (props) => {
  const {
    center = [36.1652, 1.3345],
    zoom = 14,
    pickup,
    destination,
    routeFrom,
    routeTo,
    routeColor,
    drivers = [],
    activeDriverLocation,
    activeDriverHeading = 0,
    activeDriverStatus = 'available',
    interactive = true,
    onMapClick,
    showRadar = false,
    radarRadiusMeters = 3000,
    className = 'h-full w-full',
    theme = 'dark',
  } = props;

  const [useFallback, setUseFallback] = useState<boolean>(true);

  const [userLiveCoords, setUserLiveCoords] = useState<Coordinates | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<DriverProfile | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locationToast, setLocationToast] = useState<string | null>(null);
  const mapInstance = useMap();

  useEffect(() => {
    (window as any).gm_authFailure = () => {
      setUseFallback(true);
    };
  }, []);

  const handleMapClick = useCallback(
    (e: MapMouseEvent) => {
      if (!onMapClick || !e.detail.latLng) return;
      onMapClick({
        lat: Math.round(e.detail.latLng.lat * 100000) / 100000,
        lng: Math.round(e.detail.latLng.lng * 100000) / 100000,
      });
    },
    [onMapClick]
  );

  // Background continuous location tracking
  useEffect(() => {
    if (!interactive) return;

    const stopTracking = startBackgroundLocationTracking({
      enableHighAccuracy: true,
      intervalMs: 10000,
      onLocationUpdate: (res) => {
        setUserLiveCoords(res.coords);
      },
    });

    return () => {
      stopTracking();
    };
  }, [interactive]);

  // دالة طلب إذن وتحديد الموقع الجغرافي للـ GPS وتوجيه الخريطة وإعادة التمركز نحو المستخدم
  const requestUserLocation = async () => {
    setIsLocating(true);
    setLocationToast(null);
    try {
      const res = await getRobustUserLocation();
      const userCoords = res.coords;
      setUserLiveCoords(userCoords);

      if (mapInstance) {
        mapInstance.panTo({ lat: userCoords.lat, lng: userCoords.lng });
        mapInstance.setZoom(16);
      }

      if (onMapClick) {
        onMapClick(userCoords);
      }

      if (res.message) {
        setLocationToast(res.message);
        setTimeout(() => setLocationToast(null), 5000);
      }
    } catch (err) {
      console.warn("Location request notice:", err);
      setLocationToast("💡 يرجى التأكد من تشغيل خيار 'الموقع' (GPS) في شريط الإشعارات للهاتف.");
      setTimeout(() => setLocationToast(null), 5000);
    } finally {
      setIsLocating(false);
    }
  };

  // Automatically request and center GPS user location on mount when map is ready
  const hasAutoLocatedRef = React.useRef(false);
  useEffect(() => {
    if (interactive && mapInstance && !hasAutoLocatedRef.current) {
      hasAutoLocatedRef.current = true;
      requestUserLocation();
    }
  }, [mapInstance, interactive]);

  if (useFallback) {
    return <LeafletFallbackMap {...props} />;
  }

  return (
    <div className={`relative overflow-hidden rounded-2xl ${className}`} id="google-map-container-root">
      <Map
        mapId="DEMO_MAP_ID"
        defaultCenter={{ lat: center[0], lng: center[1] }}
        defaultZoom={zoom}
        gestureHandling={interactive ? 'greedy' : 'none'}
        disableDefaultUI={true}
        zoomControl={interactive}
        colorScheme={theme === 'dark' ? 'DARK' : 'LIGHT'}
        onClick={handleMapClick}
        internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
        style={{ width: '100%', height: '100%' }}
      >
        {/* Map Controller for camera synchronization & route polylines */}
        <MapController
          pickup={pickup}
          destination={destination}
          routeFrom={routeFrom}
          routeTo={routeTo}
          routeColor={routeColor}
          activeDriverLocation={activeDriverLocation}
          drivers={drivers}
          center={center}
          zoom={zoom}
        />

        {/* 1. Pickup Advanced Marker */}
        {pickup && (
          <AdvancedMarker
            position={{ lat: pickup.lat, lng: pickup.lng }}
            title={pickup.name || 'موقع الانطلاق'}
          >
            <div className="relative flex items-center justify-center -translate-x-1/2 -translate-y-full cursor-pointer group">
              <div className="w-10 h-10 rounded-full bg-emerald-500 border-2 border-white shadow-xl flex items-center justify-center text-white text-lg font-bold group-hover:scale-110 transition-transform">
                📍
              </div>
              <div className="absolute -bottom-1 w-2 h-2 bg-emerald-500 rotate-45"></div>
              <div className="absolute -bottom-6 bg-slate-900/95 text-emerald-400 border border-emerald-500/30 text-xs px-2 py-0.5 rounded shadow whitespace-nowrap font-medium pointer-events-none">
                {pickup.name || 'الانطلاق'}
              </div>
            </div>
          </AdvancedMarker>
        )}

        {/* 2. Destination Advanced Marker */}
        {destination && (
          <AdvancedMarker
            position={{ lat: destination.lat, lng: destination.lng }}
            title={destination.name || 'الوجهة المقصودة'}
          >
            <div className="relative flex items-center justify-center -translate-x-1/2 -translate-y-full cursor-pointer group">
              <div className="w-10 h-10 rounded-full bg-amber-500 border-2 border-white shadow-xl flex items-center justify-center text-slate-950 text-lg font-bold group-hover:scale-110 transition-transform">
                🏁
              </div>
              <div className="absolute -bottom-1 w-2 h-2 bg-amber-500 rotate-45"></div>
              <div className="absolute -bottom-6 bg-slate-900/95 text-amber-400 border border-amber-500/30 text-xs px-2 py-0.5 rounded shadow whitespace-nowrap font-medium pointer-events-none">
                {destination.name || 'الوجهة'}
              </div>
            </div>
          </AdvancedMarker>
        )}

        {/* 3. Radar Search Wave Circle */}
        {showRadar && pickup && (
          <Circle
            center={{ lat: pickup.lat, lng: pickup.lng }}
            radius={radarRadiusMeters}
            strokeColor="#f59e0b"
            strokeOpacity={0.8}
            strokeWeight={2}
            fillColor="#f59e0b"
            fillOpacity={0.12}
          />
        )}

        {/* 4. Active Driver Moving Motorcycle Marker */}
        {activeDriverLocation && (
          <AdvancedMarker
            position={{ lat: activeDriverLocation.lat, lng: activeDriverLocation.lng }}
            title="سائقك على الطريق"
          >
            <div className="relative -translate-x-1/2 -translate-y-1/2">
              <div
                className="w-12 h-12 rounded-full bg-slate-950 border-3 border-amber-500 shadow-2xl overflow-hidden flex items-center justify-center p-1 transition-transform duration-500"
                style={{ transform: `rotate(${activeDriverHeading}deg)` }}
              >
                <img src="/icon.jpg" alt="سائقك" className="w-full h-full object-cover rounded-full" />
              </div>
              <div className="absolute -inset-1 rounded-full bg-amber-400/40 animate-ping pointer-events-none"></div>
              {/* Dynamic Status Pill */}
              <div className={`absolute -bottom-6 left-1/2 -translate-x-1/2 text-[9px] font-black px-2 py-0.5 rounded-full whitespace-nowrap shadow border flex items-center gap-1 ${
                activeDriverStatus === 'busy'
                  ? 'bg-rose-950/95 text-rose-300 border-rose-500/60'
                  : 'bg-emerald-500 text-slate-950 border-emerald-400'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${activeDriverStatus === 'busy' ? 'bg-rose-400 animate-pulse' : 'bg-slate-950'}`}></span>
                <span>{activeDriverStatus === 'busy' ? 'مشغول برحلة' : 'سائقك متاح'}</span>
              </div>
            </div>
          </AdvancedMarker>
        )}

        {/* 5. Online Nearby Drivers Markers with Available/Busy status indicator */}
        {drivers
          .filter(d => d.isOnline && d.status === 'approved')
          .map(driver => {
            const isDriverAvail = driver.isAvailable !== false;
            return (
              <AdvancedMarker
                key={driver.id}
                position={{ lat: driver.location.lat, lng: driver.location.lng }}
                title={`${driver.name} (${isDriverAvail ? 'متاح للطلب' : 'مشغول برحلة'})`}
                onClick={() => setSelectedDriver(driver)}
              >
                <div className="relative -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform duration-300 hover:scale-125">
                  <div className={`w-9 h-9 rounded-full bg-slate-950 border-2 ${
                    isDriverAvail ? 'border-amber-400' : 'border-rose-500'
                  } shadow-lg overflow-hidden flex items-center justify-center p-0.5`}>
                    <img src="/icon.jpg" alt="دراجة" className="w-full h-full object-cover rounded-full" />
                  </div>
                  {/* Status Indicator Dot */}
                  <div
                    className={`absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full border border-slate-950 shadow-md ${
                      isDriverAvail ? 'bg-emerald-500' : 'bg-rose-500'
                    }`}
                  />
                  {/* Status Mini Pill */}
                  <div
                    className={`absolute -bottom-4 left-1/2 -translate-x-1/2 px-1 py-0.2 rounded text-[8px] font-black whitespace-nowrap shadow border leading-tight ${
                      isDriverAvail
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                        : 'bg-rose-950 text-rose-300 border-rose-600'
                    }`}
                  >
                    {isDriverAvail ? 'متاح' : 'مشغول'}
                  </div>
                </div>
              </AdvancedMarker>
            );
          })}

        {/* InfoWindow for clicked driver */}
        {selectedDriver && (
          <InfoWindow
            position={{ lat: selectedDriver.location.lat, lng: selectedDriver.location.lng }}
            onCloseClick={() => setSelectedDriver(null)}
          >
            <div className="text-right p-1 font-sans text-slate-900 min-w-[160px]" dir="rtl">
              <div className="font-bold text-sm text-slate-950 flex items-center gap-1.5">
                <img src="/icon.jpg" alt="دراجة" className="w-4 h-4 rounded-md object-cover shrink-0" />
                <span>{selectedDriver.name}</span>
              </div>
              <div className="text-xs text-slate-600 mt-0.5">
                {selectedDriver.motorcycle?.brand || ''} {selectedDriver.motorcycle?.model || ''}
              </div>
              <div className="text-xs text-amber-600 font-semibold mt-1">
                ⭐ {(selectedDriver.rating ?? 5.0).toFixed(1)} ({selectedDriver.totalTrips ?? 0} رحلة)
              </div>
              <div className="mt-1 pt-1 border-t border-slate-200">
                <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  selectedDriver.isAvailable !== false
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-800'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${selectedDriver.isAvailable !== false ? 'bg-emerald-600' : 'bg-rose-600'}`}></span>
                  {selectedDriver.isAvailable !== false ? 'متاح للاستقبال الآن 🟢' : 'مشغول حالياً 🔴'}
                </span>
              </div>
            </div>
          </InfoWindow>
        )}
      </Map>

      {/* زر إعادة تمركز الخريطة وإحضار موقعي الحالي (GPS) */}
      {interactive && (
        <button
          type="button"
          id="map-locate-me-recenter-btn"
          onClick={requestUserLocation}
          disabled={isLocating}
          className="absolute bottom-28 right-2.5 sm:right-3.5 z-20 flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-slate-950/95 hover:bg-slate-900 border border-amber-500/70 hover:border-amber-400 text-amber-400 shadow-2xl transition-all active:scale-95 cursor-pointer backdrop-blur-md group"
          title="تحديد موقعي الفعلي وإعادة تمركز الخريطة (GPS)"
        >
          {isLocating ? (
            <span className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></span>
          ) : (
            <Navigation className="w-4 h-4 text-amber-400 transition-transform group-hover:scale-110" />
          )}
          <span className="text-xs font-black tracking-tight text-white">تحديد موقعي</span>
        </button>
      )}

      {/* floating GPS feedback toast */}
      {locationToast && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 max-w-[90%] bg-slate-950/95 border border-amber-500/50 text-slate-100 text-xs py-2 px-3.5 rounded-xl shadow-2xl backdrop-blur-md text-center dir-rtl flex items-center gap-2 animate-bounce">
          <span className="text-amber-400 font-bold shrink-0">📍</span>
          <span>{locationToast}</span>
          <button
            onClick={() => setLocationToast(null)}
            className="text-slate-400 hover:text-white mr-auto text-sm px-1 font-bold"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};
