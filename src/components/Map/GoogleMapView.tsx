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
import { Coordinates, DriverProfile } from '../../types';
import { getRobustUserLocation } from '../../utils/geo';

export interface GoogleMapViewProps {
  center?: [number, number];
  zoom?: number;
  pickup?: Coordinates | null;
  destination?: Coordinates | null;
  drivers?: DriverProfile[];
  activeDriverLocation?: Coordinates | null;
  activeDriverHeading?: number;
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
  activeDriverLocation?: Coordinates | null;
  drivers?: DriverProfile[];
  center: [number, number];
  zoom: number;
}> = ({ pickup, destination, activeDriverLocation, drivers = [], center, zoom }) => {
  const map = useMap();
  const routesLib = useMapsLibrary('routes');
  const routePolylineRef = useRef<google.maps.Polyline | null>(null);

  // 1. Auto-fit camera bounds when points change
  useEffect(() => {
    if (!map) return;

    const points: google.maps.LatLngLiteral[] = [];
    if (pickup) points.push({ lat: pickup.lat, lng: pickup.lng });
    if (destination) points.push({ lat: destination.lat, lng: destination.lng });
    if (activeDriverLocation) points.push({ lat: activeDriverLocation.lat, lng: activeDriverLocation.lng });

    if (points.length > 1) {
      const bounds = new google.maps.LatLngBounds();
      points.forEach(p => bounds.extend(p));
      map.fitBounds(bounds, { top: 60, right: 60, bottom: 60, left: 60 });
    } else if (points.length === 1 && !destination) {
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

  // 2. Compute accurate road route between pickup and destination using modern Routes API
  useEffect(() => {
    if (!map || !routesLib) return;

    // Clean up previous polyline
    if (routePolylineRef.current) {
      routePolylineRef.current.setMap(null);
      routePolylineRef.current = null;
    }

    if (!pickup || !destination) return;

    const origin = { lat: pickup.lat, lng: pickup.lng };
    const dest = { lat: destination.lat, lng: destination.lng };

    // Try TWO_WHEELER first for motorcycles, fallback to DRIVING
    const computeRouteWithMode = async (mode: 'TWO_WHEELER' | 'DRIVING') => {
      try {
        const request = {
          origin,
          destination: dest,
          travelMode: mode,
          fields: ['path', 'distanceMeters', 'durationMillis', 'viewport'],
        };
        const res = await (routesLib.Route as any).computeRoutes(request);
        const route = res.routes?.[0];
        if (route?.path && route.path.length > 0) {
          const polyline = new google.maps.Polyline({
            path: route.path,
            strokeColor: '#f59e0b',
            strokeOpacity: 0.9,
            strokeWeight: 5,
            map,
          });
          routePolylineRef.current = polyline;
          return true;
        }
      } catch {
        return false;
      }
      return false;
    };

    computeRouteWithMode('TWO_WHEELER').then((success) => {
      if (!success) {
        computeRouteWithMode('DRIVING').then((drvSuccess) => {
          // If Routes API fails or quota exceeded, fallback to direct path
          if (!drvSuccess && map) {
            const fallbackPolyline = new google.maps.Polyline({
              path: [origin, dest],
              strokeColor: '#f59e0b',
              strokeOpacity: 0.8,
              strokeWeight: 4,
              geodesic: true,
              map,
            });
            routePolylineRef.current = fallbackPolyline;
          }
        });
      }
    });

    return () => {
      if (routePolylineRef.current) {
        routePolylineRef.current.setMap(null);
        routePolylineRef.current = null;
      }
    };
  }, [map, routesLib, pickup?.lat, pickup?.lng, destination?.lat, destination?.lng]);

  return null;
};

export const GoogleMapView: React.FC<GoogleMapViewProps> = ({
  center = [36.7538, 3.0588], // Algiers Coordinates
  zoom = 13,
  pickup,
  destination,
  drivers = [],
  activeDriverLocation,
  activeDriverHeading = 0,
  interactive = true,
  onMapClick,
  showRadar = false,
  radarRadiusMeters = 3000,
  className = 'h-full w-full',
  theme = 'dark',
}) => {
  const [selectedDriver, setSelectedDriver] = useState<DriverProfile | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const mapInstance = useMap();

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

  // دالة طلب إذن وتحديد الموقع الجغرافي للـ GPS وتوجيه الخريطة نحوه
  const requestUserLocation = async () => {
    setIsLocating(true);
    try {
      const res = await getRobustUserLocation();
      const userCoords = res.coords;

      if (mapInstance) {
        mapInstance.panTo({ lat: userCoords.lat, lng: userCoords.lng });
        mapInstance.setZoom(16);
      }

      if (onMapClick) {
        onMapClick(userCoords);
      }
    } catch (err) {
      console.warn("Location request notice:", err);
    } finally {
      setIsLocating(false);
    }
  };

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
                className="w-12 h-12 rounded-full bg-amber-500 border-3 border-slate-950 shadow-2xl flex items-center justify-center text-slate-950 text-xl font-bold transition-transform duration-500"
                style={{ transform: `rotate(${activeDriverHeading}deg)` }}
              >
                🛵
              </div>
              <div className="absolute -inset-1 rounded-full bg-amber-400/40 animate-ping pointer-events-none"></div>
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-amber-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full whitespace-nowrap shadow">
                سائقك
              </div>
            </div>
          </AdvancedMarker>
        )}

        {/* 5. Online Nearby Drivers Markers */}
        {drivers
          .filter(d => d.isOnline && d.status === 'approved')
          .map(driver => (
            <AdvancedMarker
              key={driver.id}
              position={{ lat: driver.location.lat, lng: driver.location.lng }}
              title={driver.name}
              onClick={() => setSelectedDriver(driver)}
            >
              <div className="relative -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform duration-300 hover:scale-125">
                <div className="w-9 h-9 rounded-full bg-slate-900 border-2 border-amber-500 shadow-lg flex items-center justify-center text-amber-400 text-sm">
                  🏍️
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border border-slate-950"></div>
              </div>
            </AdvancedMarker>
          ))}

        {/* InfoWindow for clicked driver */}
        {selectedDriver && (
          <InfoWindow
            position={{ lat: selectedDriver.location.lat, lng: selectedDriver.location.lng }}
            onCloseClick={() => setSelectedDriver(null)}
          >
            <div className="text-right p-1 font-sans text-slate-900 min-w-[160px]" dir="rtl">
              <div className="font-bold text-sm text-slate-950 flex items-center gap-1">
                <span>🏍️</span> <span>{selectedDriver.name}</span>
              </div>
              <div className="text-xs text-slate-600 mt-0.5">
                {selectedDriver.motorcycle?.brand || ''} {selectedDriver.motorcycle?.model || ''}
              </div>
              <div className="text-xs text-amber-600 font-semibold mt-1">
                ⭐ {(selectedDriver.rating ?? 5.0).toFixed(1)} ({selectedDriver.totalTrips ?? 0} رحلة)
              </div>
            </div>
          </InfoWindow>
        )}
      </Map>

      {/* زر تحديد الموقع الحالي GPS عائم على الخريطة */}
      {interactive && (
        <button
          type="button"
          onClick={requestUserLocation}
          disabled={isLocating}
          className="absolute bottom-6 right-6 z-10 bg-slate-900/95 border border-amber-500/50 text-amber-400 p-3.5 rounded-full shadow-2xl hover:bg-slate-800 transition-all flex items-center justify-center group active:scale-95"
          title="تحديد موقعي الحالي"
        >
          {isLocating ? (
            <span className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></span>
          ) : (
            <span className="text-xl">🎯</span>
          )}
        </button>
      )}

      {/* Visual GPS Center Target when interactive */}
      {interactive && onMapClick && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-40">
          <div className="w-4 h-4 rounded-full border-2 border-amber-400/80 bg-amber-400/20"></div>
        </div>
      )}
    </div>
  );
};
