import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Coordinates, DriverProfile } from '../../types';

interface LeafletMapProps {
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

export const LeafletMap: React.FC<LeafletMapProps> = ({
  center = [36.7538, 3.0588],
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
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);
  const radarCircleRef = useRef<L.Circle | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [center[0], center[1]] as [number, number],
      zoom: zoom,
      zoomControl: false,
      attributionControl: false,
      dragging: interactive,
      touchZoom: interactive,
      scrollWheelZoom: interactive,
      doubleClickZoom: interactive,
    });

    // Dark sleek CartoDB or OpenStreetMap tiles
    const tileUrl =
      theme === 'dark'
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

    L.tileLayer(tileUrl, {
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map);

    markersGroupRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    // Map click handler
    map.on('click', (e: L.LeafletMouseEvent) => {
      if (onMapClick) {
        onMapClick({
          lat: Math.round(e.latlng.lat * 100000) / 100000,
          lng: Math.round(e.latlng.lng * 100000) / 100000,
        });
      }
    });

    // Invalidate size on mount / resize
    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(mapContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update center/zoom if changed explicitly
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    // Don't override if we have pickup + destination bounds
    if (!pickup && !destination) {
      mapInstanceRef.current.setView(center, zoom, { animate: true });
    }
  }, [center[0], center[1], zoom]);

  // Update Markers, Routes, Drivers & Radar
  useEffect(() => {
    if (!mapInstanceRef.current || !markersGroupRef.current) return;

    markersGroupRef.current.clearLayers();

    if (polylineRef.current) {
      polylineRef.current.remove();
      polylineRef.current = null;
    }

    if (radarCircleRef.current) {
      radarCircleRef.current.remove();
      radarCircleRef.current = null;
    }

    const boundsPoints: L.LatLngExpression[] = [];

    // 1. Pickup Marker (Emerald Green Pin)
    if (pickup) {
      const pickupIcon = L.divIcon({
        className: 'custom-pin-pickup',
        html: `
          <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-full">
            <div class="w-10 h-10 rounded-full bg-emerald-500 border-2 border-white shadow-xl flex items-center justify-center text-white text-lg font-bold">
              📍
            </div>
            <div class="absolute -bottom-1 w-2 h-2 bg-emerald-500 rotate-45"></div>
            <div class="absolute -bottom-6 bg-slate-900/90 text-emerald-400 border border-emerald-500/30 text-xs px-2 py-0.5 rounded shadow whitespace-nowrap font-medium">
              الانطلاق
            </div>
          </div>
        `,
        iconSize: [0, 0],
      });

      L.marker([pickup.lat, pickup.lng], { icon: pickupIcon })
        .addTo(markersGroupRef.current)
        .bindTooltip(pickup.name || 'موقع الانطلاق', { direction: 'top', offset: [0, -40] });

      boundsPoints.push([pickup.lat, pickup.lng]);

      // Radar search wave if searching
      if (showRadar) {
        radarCircleRef.current = L.circle([pickup.lat, pickup.lng], {
          radius: radarRadiusMeters,
          color: '#f59e0b',
          fillColor: '#f59e0b',
          fillOpacity: 0.12,
          weight: 2,
          dashArray: '6, 8',
        }).addTo(mapInstanceRef.current);
      }
    }

    // 2. Destination Marker (Amber Gold Pin)
    if (destination) {
      const destIcon = L.divIcon({
        className: 'custom-pin-dest',
        html: `
          <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-full">
            <div class="w-10 h-10 rounded-full bg-amber-500 border-2 border-white shadow-xl flex items-center justify-center text-slate-950 text-lg font-bold">
              🏁
            </div>
            <div class="absolute -bottom-1 w-2 h-2 bg-amber-500 rotate-45"></div>
            <div class="absolute -bottom-6 bg-slate-900/90 text-amber-400 border border-amber-500/30 text-xs px-2 py-0.5 rounded shadow whitespace-nowrap font-medium">
              الوجهة
            </div>
          </div>
        `,
        iconSize: [0, 0],
      });

      L.marker([destination.lat, destination.lng], { icon: destIcon })
        .addTo(markersGroupRef.current)
        .bindTooltip(destination.name || 'الوجهة المقصودة', { direction: 'top', offset: [0, -40] });

      boundsPoints.push([destination.lat, destination.lng]);
    }

    // 3. Polyline Route connecting Pickup & Destination
    if (pickup && destination) {
      polylineRef.current = L.polyline(
        [
          [pickup.lat, pickup.lng],
          [destination.lat, destination.lng],
        ],
        {
          color: '#f59e0b',
          weight: 5,
          opacity: 0.85,
          dashArray: '1, 10',
          lineJoin: 'round',
        }
      ).addTo(mapInstanceRef.current);
    }

    // 4. Other Online Nearby Drivers (Motorcycle Markers)
    drivers
      .filter(d => d.isOnline && d.status === 'approved')
      .forEach(driver => {
        const bikeIcon = L.divIcon({
          className: 'custom-bike-marker',
          html: `
            <div class="relative -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform duration-300 hover:scale-125">
              <div class="w-9 h-9 rounded-full bg-slate-900 border-2 border-amber-500 shadow-lg flex items-center justify-center text-amber-400 text-sm">
                🏍️
              </div>
              <div class="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border border-slate-950"></div>
            </div>
          `,
          iconSize: [0, 0],
        });

        L.marker([driver.location.lat, driver.location.lng], { icon: bikeIcon })
          .addTo(markersGroupRef.current!)
          .bindPopup(`
            <div class="text-right p-1 font-sans text-slate-900" dir="rtl">
              <div class="font-bold text-sm text-slate-950 flex items-center gap-1">
                <span>🏍️</span> <span>${driver.name}</span>
              </div>
              <div class="text-xs text-slate-600 mt-0.5">${driver.motorcycle.brand} ${driver.motorcycle.model}</div>
              <div class="text-xs text-amber-600 font-semibold mt-1">⭐ ${driver.rating.toFixed(1)} (${driver.totalTrips} رحلة)</div>
            </div>
          `);
      });

    // 5. Active Trip Driver Location (Highlighted moving motorcycle)
    if (activeDriverLocation) {
      const activeBikeIcon = L.divIcon({
        className: 'custom-active-bike',
        html: `
          <div class="relative -translate-x-1/2 -translate-y-1/2">
            <div class="w-12 h-12 rounded-full bg-amber-500 border-3 border-slate-950 shadow-2xl flex items-center justify-center text-slate-950 text-xl font-bold transition-transform duration-500" style="transform: rotate(${activeDriverHeading}deg)">
              🛵
            </div>
            <div class="absolute -inset-1 rounded-full bg-amber-400/40 animate-ping pointer-events-none"></div>
          </div>
        `,
        iconSize: [0, 0],
      });

      L.marker([activeDriverLocation.lat, activeDriverLocation.lng], { icon: activeBikeIcon })
        .addTo(markersGroupRef.current)
        .bindTooltip('سائقك على الطريق', { permanent: true, direction: 'top', offset: [0, -25] });

      boundsPoints.push([activeDriverLocation.lat, activeDriverLocation.lng]);
    }

    // Auto-fit bounds if we have multiple points
    if (boundsPoints.length > 1) {
      const bounds = L.latLngBounds(boundsPoints);
      mapInstanceRef.current.fitBounds(bounds, {
        padding: [60, 60],
        maxZoom: 15,
        animate: true,
      });
    } else if (boundsPoints.length === 1 && !pickup && !destination) {
      mapInstanceRef.current.panTo(boundsPoints[0]);
    }
  }, [
    pickup?.lat,
    pickup?.lng,
    destination?.lat,
    destination?.lng,
    drivers.length,
    activeDriverLocation?.lat,
    activeDriverLocation?.lng,
    activeDriverHeading,
    showRadar,
    radarRadiusMeters,
  ]);

  return (
    <div className={`relative overflow-hidden rounded-2xl ${className}`} id="map-container-root">
      <div ref={mapContainerRef} className="h-full w-full" />
      {/* Visual GPS Center Target if interactive and selecting location */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
        <div className="w-4 h-4 rounded-full border-2 border-amber-400/60 bg-amber-400/20"></div>
      </div>
    </div>
  );
};
