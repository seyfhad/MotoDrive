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
  center = [36.1652, 1.3345],
  zoom = 14,
  pickup,
  destination,
  routeFrom,
  routeTo,
  routeColor = '#facc15',
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
  const fullRouteCoordsRef = useRef<[number, number][]>([]);
  const lastFittedKeyRef = useRef<string>('');

  const [isLocating, setIsLocating] = useState(false);
  const [locationToast, setLocationToast] = useState<string | null>(null);
  const [userGPSPosition, setUserGPSPosition] = useState<Coordinates>({
    lat: center[0],
    lng: center[1],
  });

  // Initialize exact Google Maps Dark Navy/Slate style matching the attached reference screenshot
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [center[0], center[1]],
        zoom: zoom,
        zoomControl: false,
        attributionControl: false,
      });

      // Official Google Maps Dark Mode server-side styling (apistyle):
      // - Land: #1d2633 (deep dark navy-slate)
      // - All roads (local, arterial, and highways): normal dark slate gray (#2c3748 / #354356) without any prominent yellow road lines on the base map
      // - Water / rivers (e.g. Oued Chlef): #0f3d6b (rich deep blue)
      // - Parks / green areas: #1b382c (dark forest green)
      // - Labels: crisp light slate #9ca5b3 with #17202b halo
      const darkApiStyle = encodeURIComponent(
        [
          's.e:g|p.c:#ff1d2633',
          's.e:l.t.f|p.c:#ff9ca5b3',
          's.e:l.t.s|p.c:#ff17202b',
          's.t:3|s.e:g|p.c:#ff2c3748',
          's.t:3|s.e:g.s|p.c:#ff1f2937',
          's.t:49|s.e:g|p.c:#ff354356',
          's.t:49|s.e:g.s|p.c:#ff1f2937',
          's.t:50|s.e:g|p.c:#ff3b4a5e',
          's.t:50|s.e:g.s|p.c:#ff1f2937',
          's.t:6|s.e:g|p.c:#ff0f3d6b',
          's.t:2|s.e:g|p.c:#ff1b382c',
        ].join(',')
      );

      const tileUrl =
        theme === 'dark'
          ? `https://mt{s}.google.com/vt/lyrs=m&hl=ar&gl=DZ&apistyle=${darkApiStyle}&x={x}&y={y}&z={z}`
          : 'https://mt{s}.google.com/vt/lyrs=m&hl=ar&gl=DZ&x={x}&y={y}&z={z}';

      L.tileLayer(tileUrl, {
        subdomains: ['0', '1', '2', '3'],
        maxZoom: 20,
        className: theme === 'dark' ? 'motodrive-algeria-dark-tiles' : '',
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

      routeLayerRef.current = routeLayer;
      markersLayerRef.current = markersLayer;
      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Keep map centered when `center` prop updates across any Wilaya in Algeria
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !center) return;
    setUserGPSPosition({ lat: center[0], lng: center[1] });
    if (!pickup && !destination) {
      map.panTo([center[0], center[1]]);
    }
  }, [center?.[0], center?.[1]]);

  // Continuous background GPS tracking
  useEffect(() => {
    if (!interactive) return;

    const stopTracking = startBackgroundLocationTracking({
      enableHighAccuracy: true,
      intervalMs: 10000,
      onLocationUpdate: (loc) => {
        if (loc?.coords && typeof loc.coords.lat === 'number' && typeof loc.coords.lng === 'number') {
          setUserGPSPosition({ lat: loc.coords.lat, lng: loc.coords.lng });
        }
      },
    });

    return () => {
      stopTracking();
    };
  }, [interactive]);

  // Helper to draw the sleek, dynamic yellow tracking route polyline ONLY during an accepted/active ride
  const drawDynamicRoute = (coords: [number, number][]) => {
    const routeLayer = routeLayerRef.current;
    if (!routeLayer) return;
    routeLayer.clearLayers();

    if (coords.length < 2) return;

    // 1. Dark Gray road casing for high contrast
    L.polyline(coords, {
      color: '#1e293b',
      weight: 9,
      opacity: 0.85,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(routeLayer);

    // 2. Vibrant Yellow active tracking line between Driver and Passenger
    L.polyline(coords, {
      color: routeColor || '#facc15',
      weight: 5,
      opacity: 0.98,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(routeLayer);

    // 3. Subtle directional flow dashes along the path
    L.polyline(coords, {
      color: '#fef08a',
      weight: 2,
      opacity: 0.75,
      dashArray: '6, 12',
      lineCap: 'round',
    }).addTo(routeLayer);
  };

  // Fetch road geometry ONLY when explicit routeFrom and routeTo are provided (after ride acceptance)
  useEffect(() => {
    const map = mapInstanceRef.current;
    const routeLayer = routeLayerRef.current;
    if (!map || !routeLayer) return;

    const startCoord = routeFrom;
    const endCoord = routeTo;

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

  // Render clean markers (Blue GPS dot with halo, Pickup, Destination, Active Driver, Nearby Drivers)
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();

    // 0. User GPS Blue Dot with translucent blue halo (matches the exact Google Maps blue dot in the reference image)
    const gpsCoords = pickup || userGPSPosition;
    if (gpsCoords) {
      L.circle([gpsCoords.lat, gpsCoords.lng], {
        radius: 120,
        color: '#3b82f6',
        weight: 1,
        opacity: 0.45,
        fillColor: '#3b82f6',
        fillOpacity: 0.22,
      }).addTo(markersLayer);

      const blueDotIcon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: `
          <div style="position: relative; width: 18px; height: 18px; transform: translate(-9px, -9px); display: flex; align-items: center; justify-content: center;">
            <div style="width: 15px; height: 15px; border-radius: 9999px; background-color: #4285F4; border: 2.5px solid #ffffff; box-shadow: 0 0 10px rgba(66, 133, 244, 0.9);"></div>
          </div>
        `,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });
      L.marker([gpsCoords.lat, gpsCoords.lng], { icon: blueDotIcon, interactive: false }).addTo(markersLayer);
    }

    // 1. Pickup Marker (Only when destination or active route is present so the center of the map stays clean like the screenshot)
    if (pickup && (destination || routeTo || activeDriverLocation || showRadar)) {
      const pickupLabel = pickup.name || 'الانطلاق';
      const pickupIcon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%);">
            <div style="background-color: #10b981; color: #fef08a; width: 36px; height: 36px; border-radius: 9999px; display: flex; align-items: center; justify-content: center; border: 2px solid #fef08a; box-shadow: 0 6px 16px rgba(0,0,0,0.55);">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#fef08a" stroke="#064e3b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                <circle cx="12" cy="10" r="3" fill="#064e3b"/>
              </svg>
            </div>
            <div style="width: 8px; height: 8px; background-color: #10b981; transform: rotate(45deg); margin-top: -4px;"></div>
            <div style="margin-top: 2px; background-color: rgba(15, 23, 42, 0.96); color: #fef08a; border: 1px solid rgba(254, 240, 138, 0.45); font-size: 11px; padding: 2px 8px; border-radius: 6px; white-space: nowrap; font-weight: 800; box-shadow: 0 4px 12px rgba(0,0,0,0.5); direction: rtl;">
              ${pickupLabel}
            </div>
          </div>
        `,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });
      L.marker([pickup.lat, pickup.lng], { icon: pickupIcon }).addTo(markersLayer);
    }

    // 2. Destination Marker (Google Maps Red Teardrop Pin + Label)
    if (destination) {
      const destLabel = destination.name || 'الوجهة';
      const destIcon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%);">
            <svg width="34" height="42" viewBox="0 0 24 30" fill="none" style="filter: drop-shadow(0 5px 10px rgba(0,0,0,0.55));">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 9 12 18 12 18s12-9 12-18c0-6.63-5.37-12-12-12z" fill="#EA4335"/>
              <circle cx="12" cy="11.5" r="4.5" fill="#75140C"/>
            </svg>
            <div style="margin-top: 2px; background-color: rgba(23, 32, 43, 0.96); color: #f8fafc; border: 1px solid rgba(234, 67, 53, 0.55); font-size: 11px; padding: 2px 8px; border-radius: 6px; white-space: nowrap; font-weight: 800; box-shadow: 0 4px 12px rgba(0,0,0,0.5); direction: rtl;">
              ${destLabel}
            </div>
          </div>
        `,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });
      L.marker([destination.lat, destination.lng], { icon: destIcon }).addTo(markersLayer);
    }

    // 3. Active Driver Marker
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

    // 4. Nearby Drivers
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
    userGPSPosition.lat,
    userGPSPosition.lng,
    pickup?.lat,
    pickup?.lng,
    pickup?.name,
    destination?.lat,
    destination?.lng,
    destination?.name,
    routeTo?.lat,
    routeTo?.lng,
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
      setUserGPSPosition(userCoords);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setView([userCoords.lat, userCoords.lng], 15);
      }
      if (onMapClick) {
        onMapClick(userCoords);
      }
      if (res.message) {
        setLocationToast(res.message);
        setTimeout(() => setLocationToast(null), 4000);
      }
    } catch {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setView([center[0], center[1]], 14);
      }
    } finally {
      setIsLocating(false);
    }
  };

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
      style={{ backgroundColor: '#1d2633' }}
    >
      {/* Scoped CSS matching the exact dark navy/slate aesthetic of the attached screenshot across all of Algeria */}
      <style>{`
        .motodrive-algeria-dark-tiles {
          filter: brightness(1.02) contrast(1.04) saturate(1.08);
        }
        .leaflet-container {
          background-color: #1d2633 !important;
          font-family: inherit;
        }
        .custom-leaflet-marker {
          background: transparent !important;
          border: none !important;
        }
      `}</style>

      <div ref={mapContainerRef} className="w-full h-full z-10" />

      {/* Locate Me Button with Yellow Arrow ("تحديد الموقع") */}
      {interactive && (
        <button
          type="button"
          id="map-locate-me-recenter-btn"
          onClick={handleLocateMe}
          disabled={isLocating}
          className="absolute bottom-28 right-3 sm:right-4 z-20 w-11 h-11 rounded-full bg-[#0f172a]/95 hover:bg-slate-900 border-2 border-yellow-400 text-yellow-400 shadow-[0_0_16px_rgba(250,204,21,0.7)] flex items-center justify-center transition-all active:scale-95 cursor-pointer backdrop-blur-md group"
          title="تحديد الموقع والتركيز عليه بدقة"
          aria-label="تحديد الموقع"
        >
          {isLocating ? (
            <span className="w-5 h-5 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <Navigation className="w-5 h-5 text-yellow-400 fill-yellow-400/20 transition-transform group-hover:scale-110" />
          )}
        </button>
      )}

      {/* Dark Google Maps-style Zoom Controls (+ / -) matching the bottom-right of the screenshot */}
      {interactive && (
        <div className="absolute bottom-5 right-3 sm:right-4 z-20 flex flex-col rounded-xl overflow-hidden bg-[#162032]/95 border border-slate-700/80 shadow-2xl backdrop-blur-md">
          <button
            type="button"
            onClick={handleZoomIn}
            aria-label="تكبير الخريطة"
            className="w-10 h-10 flex items-center justify-center text-slate-200 hover:text-white hover:bg-slate-800/80 text-2xl font-light transition-colors border-b border-slate-700/80 cursor-pointer select-none"
          >
            +
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            aria-label="تصغير الخريطة"
            className="w-10 h-10 flex items-center justify-center text-slate-200 hover:text-white hover:bg-slate-800/80 text-2xl font-light transition-colors cursor-pointer select-none"
          >
            −
          </button>
        </div>
      )}

      {locationToast && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-30 max-w-[90%] bg-slate-950/95 border border-sky-400/50 text-slate-100 text-xs py-2 px-3.5 rounded-xl shadow-xl backdrop-blur-md text-center dir-rtl flex items-center gap-2">
          <span className="text-sky-400 font-bold shrink-0">📍</span>
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

export default LeafletFallbackMap;
