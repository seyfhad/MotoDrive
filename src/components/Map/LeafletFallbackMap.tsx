import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { GoogleMapViewProps } from './GoogleMapView';
import { Navigation } from 'lucide-react';
import {
  getRobustUserLocation,
  startBackgroundLocationTracking,
  fetchAccurateRoadRoute,
  calculateAirDistanceKm,
} from '../../utils/geo';
import { Coordinates } from '../../types';

// Slice the road polyline from the driver's current position to the target so the route dynamically shrinks as the driver moves
function getRemainingRouteFromDriver(
  fullPath: [number, number][],
  driverPos?: Coordinates | null
): [number, number][] {
  if (!driverPos || fullPath.length < 2) return fullPath;

  let closestIdx = 0;
  let minDist = Infinity;
  for (let i = 0; i < fullPath.length; i++) {
    const d = calculateAirDistanceKm(
      { lat: driverPos.lat, lng: driverPos.lng },
      { lat: fullPath[i][0], lng: fullPath[i][1] }
    );
    if (d < minDist) {
      minDist = d;
      closestIdx = i;
    }
  }

  // If driver is reasonably close to the route (< 3 km), trim already-traversed segments
  if (minDist < 3) {
    const remaining = fullPath.slice(closestIdx + 1);
    return [[driverPos.lat, driverPos.lng], ...remaining];
  }

  return [[driverPos.lat, driverPos.lng], ...fullPath];
}

export const LeafletFallbackMap: React.FC<GoogleMapViewProps> = ({
  center = [36.7538, 3.0588],
  zoom = 13,
  pickup,
  destination,
  routeFrom,
  routeTo,
  routeColor = '#fde047',
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
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const routeLayerRef = useRef<L.LayerGroup | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const userMarkerLayerRef = useRef<L.LayerGroup | null>(null);
  const fullRouteCoordsRef = useRef<[number, number][]>([]);
  const lastFittedKeyRef = useRef<string>('');

  const [isLocating, setIsLocating] = useState(false);
  const [locationToast, setLocationToast] = useState<string | null>(null);
  const [userLiveCoords, setUserLiveCoords] = useState<Coordinates | null>(null);

  // Initialize map with Google Maps Arabic Dark Mode tiles + Light Yellow accent filter
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [center[0], center[1]],
        zoom: zoom,
        zoomControl: false,
        attributionControl: false,
      });

      L.tileLayer('https://mt{s}.google.com/vt/lyrs=m&hl=ar&gl=DZ&x={x}&y={y}&z={z}', {
        subdomains: ['0', '1', '2', '3'],
        maxZoom: 20,
        className: theme === 'dark' ? 'motodrive-google-dark-tiles' : '',
      }).addTo(map);

      if (interactive && onMapClick) {
        map.on('click', (e) => {
          onMapClick({
            lat: Math.round(e.latlng.lat * 100000) / 100000,
            lng: Math.round(e.latlng.lng * 100000) / 100000,
          });
        });
      }

      const routeLayer = L.layerGroup().addTo(map);
      const markersLayer = L.layerGroup().addTo(map);
      const userLayerGroup = L.layerGroup().addTo(map);

      routeLayerRef.current = routeLayer;
      markersLayerRef.current = markersLayer;
      userMarkerLayerRef.current = userLayerGroup;
      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Continuous background GPS tracking for the blue user dot
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

  // Render User Live GPS Blue Dot marker
  useEffect(() => {
    const userLayer = userMarkerLayerRef.current;
    if (!userLayer) return;
    userLayer.clearLayers();

    if (userLiveCoords) {
      const gpsIcon = L.divIcon({
        className: 'custom-leaflet-gps-marker',
        html: `
          <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 44px; height: 44px; transform: translate(-22px, -22px); pointer-events: none;">
            <div style="position: absolute; width: 44px; height: 44px; border-radius: 9999px; background: rgba(14, 165, 233, 0.15); border: 1px solid rgba(56, 189, 248, 0.35);"></div>
            <div style="width: 20px; height: 20px; border-radius: 9999px; background-color: #0ea5e9; border: 2.5px solid #ffffff; box-shadow: 0 0 14px rgba(14, 165, 233, 0.9); z-index: 10;"></div>
          </div>
        `,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });
      L.marker([userLiveCoords.lat, userLiveCoords.lng], {
        icon: gpsIcon,
        interactive: false,
      }).addTo(userLayer);
    }
  }, [userLiveCoords]);

  // Helper to draw the sleek, simple, dynamic route polyline
  const drawDynamicRoute = (coords: [number, number][]) => {
    const routeLayer = routeLayerRef.current;
    if (!routeLayer) return;
    routeLayer.clearLayers();

    if (coords.length < 2) return;

    // 1. Soft glowing outer halo
    L.polyline(coords, {
      color: '#fef08a',
      weight: 9,
      opacity: 0.24,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(routeLayer);

    // 2. Clean, vibrant light-yellow/amber main tracking line
    L.polyline(coords, {
      color: routeColor || '#fde047',
      weight: 4.5,
      opacity: 0.95,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(routeLayer);

    // 3. Subtle directional flow dashes along the path
    L.polyline(coords, {
      color: '#ffffff',
      weight: 1.8,
      opacity: 0.55,
      dashArray: '6, 12',
      lineCap: 'round',
    }).addTo(routeLayer);
  };

  // Fetch road geometry when endpoints change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const routeLayer = routeLayerRef.current;
    if (!map || !routeLayer) return;

    const startCoord = routeFrom || pickup;
    const endCoord = routeTo || destination;

    if (!startCoord || !endCoord) {
      fullRouteCoordsRef.current = [];
      routeLayer.clearLayers();
      return;
    }

    let isCurrent = true;
    fetchAccurateRoadRoute(startCoord, endCoord).then((res) => {
      if (!isCurrent) return;
      fullRouteCoordsRef.current = res.coordinates;
      const trimmed = getRemainingRouteFromDriver(res.coordinates, activeDriverLocation);
      drawDynamicRoute(trimmed);

      const fitKey = `${startCoord.lat.toFixed(3)},${startCoord.lng.toFixed(3)}-${endCoord.lat.toFixed(3)},${endCoord.lng.toFixed(3)}`;
      if (lastFittedKeyRef.current !== fitKey && res.coordinates.length > 1) {
        lastFittedKeyRef.current = fitKey;
        const bounds = L.latLngBounds(res.coordinates);
        map.fitBounds(bounds, { padding: [55, 55], maxZoom: 16 });
      }
    });

    return () => {
      isCurrent = false;
    };
  }, [
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

  // Dynamically update & trim the route polyline in real time as the driver moves!
  useEffect(() => {
    if (fullRouteCoordsRef.current.length >= 2 && activeDriverLocation) {
      const trimmed = getRemainingRouteFromDriver(fullRouteCoordsRef.current, activeDriverLocation);
      drawDynamicRoute(trimmed);
    }
  }, [activeDriverLocation?.lat, activeDriverLocation?.lng]);

  // Render clean markers (Pickup, Destination, Active Driver, Nearby Drivers) with Light Yellow accents
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();

    // 1. Pickup Marker (Light Yellow pin icon instead of red emoji)
    if (pickup) {
      const pickupLabel = pickup.name || 'الانطلاق';
      const pickupIcon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%);">
            <div style="background-color: #10b981; color: #fef08a; width: 38px; height: 38px; border-radius: 9999px; display: flex; align-items: center; justify-content: center; border: 2px solid #fef08a; box-shadow: 0 6px 16px rgba(0,0,0,0.45);">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#fef08a" stroke="#064e3b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                <circle cx="12" cy="10" r="3" fill="#064e3b"/>
              </svg>
            </div>
            <div style="width: 8px; height: 8px; background-color: #10b981; transform: rotate(45deg); margin-top: -4px;"></div>
            <div style="margin-top: 2px; background-color: rgba(15, 23, 42, 0.95); color: #fef08a; border: 1px solid rgba(254, 240, 138, 0.4); font-size: 11px; padding: 2px 8px; border-radius: 6px; white-space: nowrap; font-weight: 700; box-shadow: 0 4px 12px rgba(0,0,0,0.4); direction: rtl;">
              ${pickupLabel}
            </div>
          </div>
        `,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });
      L.marker([pickup.lat, pickup.lng], { icon: pickupIcon }).addTo(markersLayer);
    }

    // 2. Destination Marker
    if (destination) {
      const destLabel = destination.name || 'الوجهة';
      const destIcon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%);">
            <div style="background-color: #eab308; color: #020617; width: 38px; height: 38px; border-radius: 9999px; display: flex; align-items: center; justify-content: center; font-size: 17px; border: 2px solid #fef08a; box-shadow: 0 6px 16px rgba(0,0,0,0.45);">🏁</div>
            <div style="width: 8px; height: 8px; background-color: #eab308; transform: rotate(45deg); margin-top: -4px;"></div>
            <div style="margin-top: 2px; background-color: rgba(15, 23, 42, 0.95); color: #fef08a; border: 1px solid rgba(254, 240, 138, 0.4); font-size: 11px; padding: 2px 8px; border-radius: 6px; white-space: nowrap; font-weight: 700; box-shadow: 0 4px 12px rgba(0,0,0,0.4); direction: rtl;">
              ${destLabel}
            </div>
          </div>
        `,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });
      L.marker([destination.lat, destination.lng], { icon: destIcon }).addTo(markersLayer);
    }

    // 3. Active Driver Marker (smooth, clean moving motorcycle marker)
    if (activeDriverLocation) {
      const driverIcon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-22px, -22px);">
            <div style="position: relative; background-color: #020617; width: 44px; height: 44px; border-radius: 9999px; border: 2.5px solid #fef08a; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 18px rgba(254, 240, 138, 0.45); transition: transform 0.35s ease; transform: rotate(${activeDriverHeading}deg);">
              <img src="/icon.jpg" style="width: 36px; height: 36px; border-radius: 9999px; object-fit: cover;" />
            </div>
            <div style="margin-top: 3px; background-color: #fef08a; color: #020617; font-size: 9px; font-weight: 900; padding: 1px 6px; border-radius: 9999px; white-space: nowrap; box-shadow: 0 2px 8px rgba(0,0,0,0.4);">
              سائقك 🏍️
            </div>
          </div>
        `,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });
      L.marker([activeDriverLocation.lat, activeDriverLocation.lng], { icon: driverIcon })
        .bindPopup('سائقك في الطريق إليك')
        .addTo(markersLayer);
    }

    // 4. Nearby Drivers (Light Yellow & Emerald accents instead of red)
    drivers
      .filter((d) => d.isOnline && d.status === 'approved')
      .forEach((driver) => {
        if (
          activeDriverLocation &&
          Math.abs(driver.location.lat - activeDriverLocation.lat) < 0.0001 &&
          Math.abs(driver.location.lng - activeDriverLocation.lng) < 0.0001
        ) {
          return;
        }
        const isAvail = driver.isAvailable !== false;
        const driverMarkerIcon = L.divIcon({
          className: 'custom-leaflet-marker',
          html: `<div style="position: relative; transform: translate(-18px, -18px);">
            <div style="background-color: #020617; width: 36px; height: 36px; border-radius: 50%; border: 2px solid ${
              isAvail ? '#fef08a' : '#fde047'
            }; display: flex; align-items: center; justify-content: center; box-shadow: 0 3px 10px rgba(0,0,0,0.45);">
              <img src="/icon.jpg" style="width: 30px; height: 30px; border-radius: 50%; object-fit: cover;" />
            </div>
            <div style="position: absolute; top: -2px; right: -2px; width: 12px; height: 12px; border-radius: 50%; background-color: ${
              isAvail ? '#10b981' : '#fef08a'
            }; border: 2px solid #020617;"></div>
          </div>`,
          iconSize: [0, 0],
          iconAnchor: [0, 0],
        });
        L.marker([driver.location.lat, driver.location.lng], { icon: driverMarkerIcon })
          .bindPopup(
            `<div style="direction: rtl; text-align: right; font-family: sans-serif;"><b>${driver.name}</b><br/>${
              isAvail ? 'متاح للطلب 🟢' : 'في مهمة حالياً 🟡'
            }<br/>⭐ ${(driver.rating || 5).toFixed(1)}</div>`
          )
          .addTo(markersLayer);
      });

    // 5. Radar Circle
    const radarCenter = pickup || routeFrom;
    if (showRadar && radarCenter) {
      L.circle([radarCenter.lat, radarCenter.lng], {
        radius: radarRadiusMeters,
        color: '#fef08a',
        fillColor: '#fef08a',
        fillOpacity: 0.12,
        weight: 2,
      }).addTo(markersLayer);
    }
  }, [
    pickup?.lat,
    pickup?.lng,
    pickup?.name,
    destination?.lat,
    destination?.lng,
    destination?.name,
    drivers,
    activeDriverLocation?.lat,
    activeDriverLocation?.lng,
    activeDriverHeading,
    showRadar,
    radarRadiusMeters,
  ]);

  const handleLocateMe = async () => {
    setIsLocating(true);
    setLocationToast(null);
    try {
      const res = await getRobustUserLocation();
      const userCoords = res.coords;
      setUserLiveCoords(userCoords);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setView([userCoords.lat, userCoords.lng], 16);
      }
      if (onMapClick) {
        onMapClick(userCoords);
      }
      if (res.message) {
        setLocationToast(res.message);
        setTimeout(() => setLocationToast(null), 5000);
      }
    } catch {
      setLocationToast("💡 يرجى التأكد من تشغيل خيار 'الموقع' (GPS).");
      setTimeout(() => setLocationToast(null), 5000);
    } finally {
      setIsLocating(false);
    }
  };

  // Auto-locate user once on mount when interactive
  const hasAutoLocatedRef = useRef(false);
  useEffect(() => {
    if (interactive && !hasAutoLocatedRef.current) {
      hasAutoLocatedRef.current = true;
      getRobustUserLocation()
        .then((res) => {
          setUserLiveCoords(res.coords);
        })
        .catch(() => {});
    }
  }, [interactive]);

  const handleZoomIn = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomOut();
    }
  };

  return (
    <div
      className={`relative overflow-hidden rounded-2xl ${className}`}
      style={{ backgroundColor: '#06142e' }}
    >
      {/* Inline SVG Filter that preserves the exact Dark Navy/Slate Map while converting red tile symbols into Light Yellow */}
      <svg width="0" height="0" className="absolute pointer-events-none">
        <defs>
          <filter id="motodrive-red-to-light-yellow" colorInterpolationFilters="sRGB">
            <feColorMatrix
              type="matrix"
              values="
                1.00  0.00  0.00  0  0
                0.78  0.55  0.00  0  0
                0.30  0.00  0.85  0  0
                0.00  0.00  0.00  1  0
              "
            />
          </filter>
        </defs>
      </svg>

      {/* Scoped CSS for Google Maps Dark Mode tile color scheme + Light Yellow symbols */}
      <style>{`
        .motodrive-google-dark-tiles {
          filter: invert(100%) hue-rotate(185deg) brightness(93%) contrast(92%) saturate(135%) url(#motodrive-red-to-light-yellow);
        }
        .leaflet-container {
          background-color: #06142e !important;
          font-family: inherit;
        }
        .custom-leaflet-marker,
        .custom-leaflet-gps-marker {
          background: transparent !important;
          border: none !important;
        }
      `}</style>

      <div ref={mapContainerRef} className="w-full h-full z-10" />

      {/* Locate Me button */}
      {interactive && (
        <button
          type="button"
          id="map-locate-me-recenter-btn"
          onClick={handleLocateMe}
          disabled={isLocating}
          className="absolute bottom-28 right-2.5 sm:right-3.5 z-20 flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-slate-950/95 hover:bg-slate-900 border border-yellow-300/70 hover:border-yellow-200 text-yellow-200 shadow-2xl transition-all active:scale-95 cursor-pointer backdrop-blur-md group"
          title="تحديد موقعي الفعلي وإعادة تمركز الخريطة (GPS)"
        >
          {isLocating ? (
            <span className="w-4 h-4 border-2 border-yellow-300 border-t-transparent rounded-full animate-spin"></span>
          ) : (
            <Navigation className="w-4 h-4 text-yellow-300 transition-transform group-hover:scale-110" />
          )}
          <span className="text-xs font-black tracking-tight text-white">تحديد موقعي</span>
        </button>
      )}

      {/* Dark Google Maps-style Zoom Controls (+ / -) */}
      {interactive && (
        <div className="absolute bottom-5 right-2.5 sm:right-3.5 z-20 flex flex-col rounded-lg overflow-hidden bg-[#1e2433]/95 border border-slate-700/70 shadow-2xl backdrop-blur-md">
          <button
            type="button"
            onClick={handleZoomIn}
            aria-label="تكبير الخريطة"
            className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800/80 text-2xl font-light transition-colors border-b border-slate-700/70 cursor-pointer select-none"
          >
            +
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            aria-label="تصغير الخريطة"
            className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800/80 text-2xl font-light transition-colors cursor-pointer select-none"
          >
            −
          </button>
        </div>
      )}

      {locationToast && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 max-w-[90%] bg-slate-950/95 border border-yellow-300/50 text-slate-100 text-xs py-2 px-3.5 rounded-xl shadow-2xl backdrop-blur-md text-center dir-rtl flex items-center gap-2 animate-bounce">
          <span className="text-yellow-300 font-bold shrink-0">✨</span>
          <span>{locationToast}</span>
          <button
            onClick={() => setLocationToast(null)}
            className="text-slate-400 hover:text-white mr-auto text-sm px-1 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Visual GPS Center Target when interactive */}
      {interactive && onMapClick && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-40 z-20">
          <div className="w-4 h-4 rounded-full border-2 border-yellow-300/80 bg-yellow-300/20"></div>
        </div>
      )}
    </div>
  );
};

export default LeafletFallbackMap;
