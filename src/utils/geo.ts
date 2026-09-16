import { Coordinates } from '../types';

// Famous Algerian Landmarks & Hotspots for Quick Selection and Geocoding
export const ALGERIA_LOCATIONS: { name: string; wilaya: string; coords: Coordinates }[] = [
  {
    name: 'ساحة أول ماي (Place du 1er Mai)',
    wilaya: 'الجزائر العاصمة',
    coords: { lat: 36.7561, lng: 3.0543, address: 'ساحة أول ماي، الجزائر العاصمة' },
  },
  {
    name: 'جامعة هواري بومدين للعلوم والتكنولوجيا (USTHB)',
    wilaya: 'الجزائر العاصمة',
    coords: { lat: 36.7118, lng: 3.1813, address: 'باب الزوار، الجزائر العاصمة' },
  },
  {
    name: 'حي 5 جويلية (Bab Ezzouar)',
    wilaya: 'الجزائر العاصمة',
    coords: { lat: 36.7215, lng: 3.1874, address: 'حي 5 جويلية، باب الزوار، الجزائر' },
  },
  {
    name: 'مطار الجزائر الدولي - هواري بومدين',
    wilaya: 'الجزائر العاصمة',
    coords: { lat: 36.6974, lng: 3.2185, address: 'مطار هواري بومدين الدولي، الدار البيضاء' },
  },
  {
    name: 'البريد المركزي (Grande Poste)',
    wilaya: 'الجزائر العاصمة',
    coords: { lat: 36.7725, lng: 3.0592, address: 'شارع زيغود يوسف، وسط الجزائر العاصمة' },
  },
  {
    name: 'شارع ديدوش مراد (Didouche Mourad)',
    wilaya: 'الجزائر العاصمة',
    coords: { lat: 36.7648, lng: 3.0526, address: 'شارع ديدوش مراد، سيدي امحمد' },
  },
  {
    name: 'حي حيدرة الدبلوماسي (Hydra)',
    wilaya: 'الجزائر العاصمة',
    coords: { lat: 36.7441, lng: 3.0298, address: 'ساحة القدس، حيدرة، الجزائر' },
  },
  {
    name: 'الأبيار (El Biar)',
    wilaya: 'الجزائر العاصمة',
    coords: { lat: 36.7687, lng: 3.0315, address: 'شارع بوقرة، الأبيار، الجزائر' },
  },
  {
    name: 'حي القبة (Kouba)',
    wilaya: 'الجزائر العاصمة',
    coords: { lat: 36.7256, lng: 3.0851, address: 'وسط القبة، الجزائر العاصمة' },
  },
  {
    name: 'المركز التجاري باب الزوار (Centre Commercial)',
    wilaya: 'الجزائر العاصمة',
    coords: { lat: 36.7176, lng: 3.1952, address: 'حي الأعمال، باب الزوار' },
  },
  {
    name: 'مقام الشهيد (Makam Echahid)',
    wilaya: 'الجزائر العاصمة',
    coords: { lat: 36.7458, lng: 3.0697, address: 'رياض الفتح، المدنية، الجزائر' },
  },
  {
    name: 'محطة القطار آغا (Gare de l\'Agha)',
    wilaya: 'الجزائر العاصمة',
    coords: { lat: 36.7645, lng: 3.0588, address: 'شارع حسيبة بن بوعلي، الجزائر' },
  },
  {
    name: 'وسط مدينة البليدة (Bab Dzair - Blida)',
    wilaya: 'البليدة',
    coords: { lat: 36.4702, lng: 2.8288, address: 'باب الدزاير، البليدة' },
  },
  {
    name: 'ساحة أول نوفمبر (Place 1er Novembre - Oran)',
    wilaya: 'وهران',
    coords: { lat: 35.7003, lng: -0.6417, address: 'وسط مدينة وهران' },
  },
  {
    name: 'جسر سيدي راشد (Constantine)',
    wilaya: 'قسنطينة',
    coords: { lat: 36.3650, lng: 6.6147, address: 'وسط مدينة قسنطينة' },
  }
];

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
