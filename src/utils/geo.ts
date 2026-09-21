import { Coordinates } from '../types';
import {
  COMPREHENSIVE_ALGERIA_LOCATIONS,
  searchLocalLocations,
  normalizeSearchString,
  FEATURED_WILAYAS,
  ALL_58_WILAYAS,
  WILAYA_NAMES,
  findNearestAlgerianWilaya,
  findNearestLocalLocation,
  AlgeriaLocationItem
} from '../data/algeriaLocations';

export {
  COMPREHENSIVE_ALGERIA_LOCATIONS,
  searchLocalLocations,
  normalizeSearchString,
  FEATURED_WILAYAS,
  ALL_58_WILAYAS,
  WILAYA_NAMES,
  findNearestAlgerianWilaya,
  findNearestLocalLocation
};
export type { AlgeriaLocationItem };

// Comprehensive Algerian Landmarks, Municipalities & Hotspots (Guelma, Algiers, Oran, Constantine, etc.)
export const ALGERIA_LOCATIONS = COMPREHENSIVE_ALGERIA_LOCATIONS;

// Default center: Algiers Center
export const DEFAULT_MAP_CENTER: [number, number] = [36.7538, 3.0588];

// Calculate Haversine distance in Kilometers
export function calculateDistanceKm(
  point1: { lat: number; lng: number },
  point2: { lat: number; lng: number }
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((point2.lat - point1.lat) * Math.PI) / 180;
  const dLng = ((point2.lng - point1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((point1.lat * Math.PI) / 180) *
      Math.cos((point2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return Math.round(d * 10) / 10; // 1 decimal place
}

// Estimate duration in minutes (motorcycles in Algerian traffic average ~25-35 km/h + 2 min buffer)
export function estimateDurationMinutes(distanceKm: number): number {
  if (distanceKm <= 0) return 3;
  // Motorcycle weaves fast through traffic
  const minutes = Math.round((distanceKm / 30) * 60 + 2);
  return Math.max(3, minutes);
}

// Generate intermediate coordinates along a route for smooth live animation
export function interpolateRoute(
  start: Coordinates,
  end: Coordinates,
  steps: number = 20
): Coordinates[] {
  const points: Coordinates[] = [];
  for (let i = 0; i <= steps; i++) {
    const factor = i / steps;
    // Add small realistic curvature so it's not a rigid straight line
    const curveOffsetLat = Math.sin(factor * Math.PI) * 0.002 * (Math.random() > 0.5 ? 1 : -1);
    const curveOffsetLng = Math.sin(factor * Math.PI) * 0.003 * (Math.random() > 0.5 ? 1 : -1);

    points.push({
      lat: start.lat + (end.lat - start.lat) * factor + (i > 0 && i < steps ? curveOffsetLat : 0),
      lng: start.lng + (end.lng - start.lng) * factor + (i > 0 && i < steps ? curveOffsetLng : 0),
    });
  }
  return points;
}

// Calculate bearing (rotation angle in degrees) between two points
export function calculateBearing(start: Coordinates, end: Coordinates): number {
  const startLat = (start.lat * Math.PI) / 180;
  const startLng = (start.lng * Math.PI) / 180;
  const endLat = (end.lat * Math.PI) / 180;
  const endLng = (end.lng * Math.PI) / 180;

  const dLng = endLng - startLng;
  const y = Math.sin(dLng) * Math.cos(endLat);
  const x =
    Math.cos(startLat) * Math.sin(endLat) -
    Math.sin(startLat) * Math.cos(endLat) * Math.cos(dLng);

  let brng = (Math.atan2(y, x) * 180) / Math.PI;
  return (brng + 360) % 360;
}

// Reverse Geocode coordinates to human-readable address in Algeria (Arabic/French)
// Uses Nominatim and offline Algerian landmark matching (100% free, zero billing requirement)
export async function reverseGeocodeCoords(lat: number, lng: number): Promise<string> {
  // 1. High-accuracy OpenStreetMap reverse geocoding with Arabic priority (No billing required)
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=ar,fr`,
      {
        headers: {
          'Accept-Language': 'ar,fr;q=0.9,en;q=0.8',
        },
      }
    );
    if (res.ok) {
      const data = await res.json();
      const road = data.address?.road || data.address?.suburb || data.address?.neighbourhood || data.address?.quarter || '';
      const city = data.address?.city || data.address?.town || data.address?.county || data.address?.state || '';
      if (road && city) return `${road}، ${city}`;
      if (data.display_name) {
        // Take first 2 parts of display name for clean reading
        const parts = data.display_name.split(',');
        return parts.slice(0, 2).join('،').trim();
      }
    }
  } catch (err) {
    // Fallback if offline or network blocked
  }

  // 2. Find nearest known Algerian location landmark across all 58 wilayas
  try {
    const nearest = findNearestLocalLocation(lat, lng);
    if (nearest && nearest.distKm <= 2) {
      return `${nearest.item.name} (${nearest.item.wilaya})`;
    } else if (nearest && nearest.distKm <= 20) {
      return `قرب ${nearest.item.name} (${nearest.item.wilaya} - ${nearest.distKm} كم)`;
    } else if (nearest) {
      return `${nearest.item.name}، ${nearest.item.wilaya}`;
    }
  } catch {
    // Ignore distance calculation errors
  }

  return `موقع إحداثيات: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}

// Real place search for Algeria with instant local index and live Nominatim enrichment
export async function searchAlgeriaPlaces(
  queryText: string,
  wilayaFilter: string = 'الكل'
): Promise<{ name: string; wilaya: string; coords: Coordinates }[]> {
  const trimmed = queryText ? queryText.trim() : '';

  // 1. Instant local results (supports any single letter or term e.g. "ق", "قالمة", "عقبي", "حمام")
  const localMatches = searchLocalLocations(trimmed, wilayaFilter).map(item => ({
    name: item.name,
    wilaya: item.wilaya,
    coords: item.coords,
  }));

  // If query is empty or less than 3 characters, instant local dataset provides perfect results
  if (trimmed.length < 3) {
    return localMatches.slice(0, 60);
  }

  // 2. For queries 3+ chars, also query Nominatim in background with timeout
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1800);

    const queryWithContext = wilayaFilter && wilayaFilter !== 'الكل'
      ? `${trimmed} ${wilayaFilter} Algeria`
      : `${trimmed} Algeria`;

    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        queryWithContext
      )}&countrycodes=dz&limit=10&addressdetails=1&accept-language=ar,fr`,
      {
        signal: controller.signal,
        headers: {
          'Accept-Language': 'ar,fr;q=0.9,en;q=0.8',
        },
      }
    );
    clearTimeout(timeoutId);

    if (res.ok) {
      const results = await res.json();
      const onlineResults = results.map((item: any) => {
        const wilaya = item.address?.state || item.address?.county || 'الجزائر';
        const name = item.display_name.split(',')[0] || item.name || trimmed;
        return {
          name,
          wilaya,
          coords: {
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
            name,
            address: item.display_name,
          },
        };
      });

      // Merge results without coordinate collisions
      const merged = [...localMatches];
      for (const online of onlineResults) {
        const isDuplicate = merged.some(
          m =>
            Math.abs(m.coords.lat - online.coords.lat) < 0.005 &&
            Math.abs(m.coords.lng - online.coords.lng) < 0.005
        );
        if (!isDuplicate) {
          merged.push(online);
        }
      }
      return merged.slice(0, 60);
    }
  } catch {
    // Return instant local matches on network timeout or failure
  }

  return localMatches.slice(0, 60);
}

export interface RobustLocationResult {
  coords: Coordinates;
  isFallback: boolean;
  message?: string;
}

/**
 * High-reliability geolocation getter for browser, webview, mobile, and iframe environments
 */
export async function getRobustUserLocation(): Promise<RobustLocationResult> {
  const defaultCoords: Coordinates = {
    lat: 36.7538,
    lng: 3.0588,
    name: 'وسط الجزائر العاصمة',
    address: 'ساحة البريد المركزي، الجزائر العاصمة',
  };

  if (!navigator || !navigator.geolocation) {
    return {
      coords: defaultCoords,
      isFallback: true,
      message: 'خاصية تحديد الموقع غير مدعومة في متصفحك. تم وضع الخريطة في وسط الجزائر العاصمة.',
    };
  }

  const tryPosition = (options: PositionOptions): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, options);
    });
  };

  try {
    // المحاولة الأولى: طلب الموقع السريع بالاعتماد على أجهزة الهاتف والشبكة بدون فرض الدقة المفرطة لمنع Timeout
    const pos = await tryPosition({ enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 });
    const { latitude, longitude } = pos.coords;
    const address = await reverseGeocodeCoords(latitude, longitude);
    return {
      coords: {
        lat: latitude,
        lng: longitude,
        name: address || 'موقعي الحالي (GPS)',
        address: address || `موقع: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
      },
      isFallback: false,
      message: address ? `تم تحديد موقعك بدقة: ${address}` : 'تم تحديد موقعك الجغرافي بنجاح.',
    };
  } catch (err1) {
    // المحاولة الثانية الاحتياطية: مهلة أطول وقبول آخر موقع مخزن لمنع توقف التطبيق
    try {
      const pos = await tryPosition({ enableHighAccuracy: false, timeout: 15000, maximumAge: Infinity });
      const { latitude, longitude } = pos.coords;
      const address = await reverseGeocodeCoords(latitude, longitude);
      return {
        coords: {
          lat: latitude,
          lng: longitude,
          name: address || 'موقعي الحالي',
          address: address || `موقع: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
        },
        isFallback: false,
        message: 'تم تحديد موقعك التقريبي عبر شبكة الاتصال.',
      };
    } catch (err2: any) {
      const isDenied = err2?.code === 1;
      return {
        coords: defaultCoords,
        isFallback: true,
        message: isDenied
          ? '⚠️ تم حظر الوصول إلى GPS. يرجى تفعيل إذن الموقع من إعدادات المتصفح أو الضغط على الخريطة مباشرة لتحديد مكانك.'
          : '⚠️ تعذر التقاط إشارة GPS. تم وضع الخريطة في وسط الجزائر العاصمة، يمكنك اختيار موقعك يدويًا.',
      };
    }
  }
}
