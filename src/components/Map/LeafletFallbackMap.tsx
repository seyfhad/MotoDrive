import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { GoogleMapViewProps } from './GoogleMapView';
import { Navigation } from 'lucide-react';
import { getRobustUserLocation } from '../../utils/geo';

export const LeafletFallbackMap: React.FC<GoogleMapViewProps> = ({
  center = [36.7538, 3.0588],
  zoom = 13,
  pickup,
  destination,
  routeFrom,
  routeTo,
  routeColor = '#f59e0b',
  drivers = [],
  activeDriverLocation,
  activeDriverHeading = 0,
  activeDriverStatus = 'available',
  interactive = true,
  onMapClick,
  showRadar = false,
  radarRadiusMeters = 3000,
  className = 'h-full w-full',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const [isLocating, setIsLocating] = React.useState(false);
  const [locationToast, setLocationToast] = React.useState<string | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [center[0], center[1]],
        zoom: zoom,
        zoomControl: false,
        attributionControl: false,
      });

      // Dark or light tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(map);

      if (interactive && onMapClick) {
        map.on('click', (e) => {
          onMapClick({
            lat: Math.round(e.latlng.lat * 100000) / 100000,
            lng: Math.round(e.latlng.lng * 100000) / 100000,
          });
        });
      }

      const layerGroup = L.layerGroup().addTo(map);
      layerGroupRef.current = layerGroup;
      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update markers and routes when props change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    const boundsPoints: [number, number][] = [];

    // 1. Pickup Marker
    const startCoord = routeFrom || pickup;
    if (startCoord) {
      boundsPoints.push([startCoord.lat, startCoord.lng]);
      const pickupIcon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: `<div style="background-color: #10b981; color: white; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; border: 2px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.3);">📍</div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
      });
      L.marker([startCoord.lat, startCoord.lng], { icon: pickupIcon })
        .bindPopup(pickup?.name || 'موقع الانطلاق')
        .addTo(layerGroup);
    }

    // 2. Destination Marker
    const endCoord = routeTo || destination;
    if (endCoord) {
      boundsPoints.push([endCoord.lat, endCoord.lng]);
      const destIcon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: `<div style="background-color: #f59e0b; color: #020617; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; border: 2px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.3);">🏁</div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
      });
      L.marker([endCoord.lat, endCoord.lng], { icon: destIcon })
        .bindPopup(destination?.name || 'الوجهة المقصودة')
        .addTo(layerGroup);
    }

    // 3. Route Polyline via OSRM or straight line
    if (startCoord && endCoord) {
      fetch(`https://router.project-osrm.org/route/v1/driving/${startCoord.lng},${startCoord.lat};${endCoord.lng},${endCoord.lat}?overview=full&geometries=geojson`)
        .then(res => res.json())
        .then(data => {
          if (data.routes?.[0]?.geometry?.coordinates) {
            const latLngs = data.routes[0].geometry.coordinates.map((c: [number, number]) => [c[1], c[0]]);
            L.polyline(latLngs, { color: routeColor, weight: 5, opacity: 0.8 }).addTo(layerGroup);
          } else {
            L.polyline([[startCoord.lat, startCoord.lng], [endCoord.lat, endCoord.lng]], { color: routeColor, weight: 5, opacity: 0.8 }).addTo(layerGroup);
          }
        })
        .catch(() => {
          L.polyline([[startCoord.lat, startCoord.lng], [endCoord.lat, endCoord.lng]], { color: routeColor, weight: 5, opacity: 0.8 }).addTo(layerGroup);
        });
    }

    // 4. Active Driver Marker
    if (activeDriverLocation) {
      boundsPoints.push([activeDriverLocation.lat, activeDriverLocation.lng]);
      const driverIcon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: `<div style="background-color: #020617; width: 42px; height: 42px; border-radius: 50%; border: 3px solid #f59e0b; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(0,0,0,0.4); transform: rotate(${activeDriverHeading}deg);">
          <img src="/icon.jpg" style="width: 36px; height: 36px; border-radius: 50%; object-fit: cover;" />
        </div>`,
        iconSize: [42, 42],
        iconAnchor: [21, 21],
      });
      L.marker([activeDriverLocation.lat, activeDriverLocation.lng], { icon: driverIcon })
        .bindPopup('سائقك على الطريق')
        .addTo(layerGroup);
    }

    // 5. Nearby Drivers
    drivers
      .filter(d => d.isOnline && d.status === 'approved')
      .forEach(driver => {
        const isAvail = driver.isAvailable !== false;
        const driverMarkerIcon = L.divIcon({
          className: 'custom-leaflet-marker',
          html: `<div style="position: relative;">
            <div style="background-color: #020617; width: 36px; height: 36px; border-radius: 50%; border: 2px solid ${isAvail ? '#f59e0b' : '#f43f5e'}; display: flex; align-items: center; justify-content: center; box-shadow: 0 3px 10px rgba(0,0,0,0.3);">
              <img src="/icon.jpg" style="width: 30px; height: 30px; border-radius: 50%; object-fit: cover;" />
            </div>
            <div style="position: absolute; top: -2px; right: -2px; width: 12px; height: 12px; border-radius: 50%; background-color: ${isAvail ? '#10b981' : '#f43f5e'}; border: 2px solid #020617;"></div>
          </div>`,
          iconSize: [36, 36],
          iconAnchor: [18, 18],
        });
        L.marker([driver.location.lat, driver.location.lng], { icon: driverMarkerIcon })
          .bindPopup(`<b>${driver.name}</b><br/>${isAvail ? 'متاح للطلب 🟢' : 'مشغول برحلة 🔴'}<br/>⭐ ${(driver.rating || 5).toFixed(1)}`)
          .addTo(layerGroup);
      });

    // 6. Radar Circle
    if (showRadar && startCoord) {
      L.circle([startCoord.lat, startCoord.lng], {
        radius: radarRadiusMeters,
        color: '#f59e0b',
        fillColor: '#f59e0b',
        fillOpacity: 0.1,
        weight: 2,
      }).addTo(layerGroup);
    }

    // Fit bounds if points exist
    if (boundsPoints.length > 0) {
      const latLngBounds = L.latLngBounds(boundsPoints);
      map.fitBounds(latLngBounds, { padding: [50, 50], maxZoom: 16 });
    }
  }, [pickup, destination, routeFrom, routeTo, drivers, activeDriverLocation, activeDriverHeading, activeDriverStatus, showRadar, radarRadiusMeters, routeColor]);

  const handleLocateMe = async () => {
    setIsLocating(true);
    setLocationToast(null);
    try {
      const res = await getRobustUserLocation();
      const userCoords = res.coords;
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

  return (
    <div className={`relative overflow-hidden rounded-2xl ${className}`}>
      <div ref={mapContainerRef} className="w-full h-full z-10" />

      {/* Locate Me button */}
      {interactive && (
        <button
          type="button"
          onClick={handleLocateMe}
          disabled={isLocating}
          className="absolute bottom-28 right-3 z-20 flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-slate-950/95 hover:bg-slate-900 border border-amber-500/70 text-amber-400 shadow-2xl transition-all active:scale-95 cursor-pointer backdrop-blur-md"
        >
          {isLocating ? (
            <span className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></span>
          ) : (
            <Navigation className="w-4 h-4 text-amber-400" />
          )}
          <span className="text-xs font-black text-white">تحديد موقعي</span>
        </button>
      )}

      {locationToast && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 max-w-[90%] bg-slate-950/95 border border-amber-500/50 text-slate-100 text-xs py-2 px-3.5 rounded-xl shadow-2xl text-center flex items-center gap-2">
          <span>📍</span>
          <span>{locationToast}</span>
        </div>
      )}
    </div>
  );
};

export default LeafletFallbackMap;
