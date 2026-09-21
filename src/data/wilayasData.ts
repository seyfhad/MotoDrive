import { ServiceArea, Coordinates } from '../types';

export interface WilayaInfo {
  code: string;
  codeNumber: number;
  name: string;
  nameAr?: string;
  nameFr: string;
  center: Coordinates;
  radiusKm: number;
}

export const ALL_58_WILAYAS: WilayaInfo[] = [
  { code: '01', codeNumber: 1, name: 'أدرار', nameFr: 'Adrar', center: { lat: 27.8742, lng: -0.2939 }, radiusKm: 40 },
  { code: '02', codeNumber: 2, name: 'الشلف', nameFr: 'Chlef', center: { lat: 36.1652, lng: 1.3345 }, radiusKm: 35 },
  { code: '03', codeNumber: 3, name: 'الأغواط', nameFr: 'Laghouat', center: { lat: 33.8000, lng: 2.8651 }, radiusKm: 35 },
  { code: '04', codeNumber: 4, name: 'أم البواقي', nameFr: 'Oum El Bouaghi', center: { lat: 35.8755, lng: 7.1136 }, radiusKm: 35 },
  { code: '05', codeNumber: 5, name: 'باتنة', nameFr: 'Batna', center: { lat: 35.5558, lng: 6.1741 }, radiusKm: 35 },
  { code: '06', codeNumber: 6, name: 'بجاية', nameFr: 'Béjaïa', center: { lat: 36.7559, lng: 5.0843 }, radiusKm: 35 },
  { code: '07', codeNumber: 7, name: 'بسكرة', nameFr: 'Biskra', center: { lat: 34.8504, lng: 5.7281 }, radiusKm: 35 },
  { code: '08', codeNumber: 8, name: 'بشار', nameFr: 'Béchar', center: { lat: 31.6167, lng: -2.2167 }, radiusKm: 35 },
  { code: '09', codeNumber: 9, name: 'البليدة', nameFr: 'Blida', center: { lat: 36.4702, lng: 2.8288 }, radiusKm: 30 },
  { code: '10', codeNumber: 10, name: 'البويرة', nameFr: 'Bouira', center: { lat: 36.3749, lng: 3.9020 }, radiusKm: 35 },
  { code: '11', codeNumber: 11, name: 'تمنراست', nameFr: 'Tamanrasset', center: { lat: 22.7850, lng: 5.5228 }, radiusKm: 45 },
  { code: '12', codeNumber: 12, name: 'تبسة', nameFr: 'Tébessa', center: { lat: 35.4042, lng: 8.1242 }, radiusKm: 35 },
  { code: '13', codeNumber: 13, name: 'تلمسان', nameFr: 'Tlemcen', center: { lat: 34.8828, lng: -1.3167 }, radiusKm: 35 },
  { code: '14', codeNumber: 14, name: 'تيارت', nameFr: 'Tiaret', center: { lat: 35.3710, lng: 1.3170 }, radiusKm: 35 },
  { code: '15', codeNumber: 15, name: 'تيزي وزو', nameFr: 'Tizi Ouzou', center: { lat: 36.7118, lng: 4.0459 }, radiusKm: 35 },
  { code: '16', codeNumber: 16, name: 'الجزائر العاصمة', nameFr: 'Alger', center: { lat: 36.7538, lng: 3.0588 }, radiusKm: 40 },
  { code: '17', codeNumber: 17, name: 'الجلفة', nameFr: 'Djelfa', center: { lat: 34.6728, lng: 3.2630 }, radiusKm: 35 },
  { code: '18', codeNumber: 18, name: 'جيجل', nameFr: 'Jijel', center: { lat: 36.8206, lng: 5.7667 }, radiusKm: 35 },
  { code: '19', codeNumber: 19, name: 'سطيف', nameFr: 'Sétif', center: { lat: 36.1911, lng: 5.4137 }, radiusKm: 35 },
  { code: '20', codeNumber: 20, name: 'سعيدة', nameFr: 'Saïda', center: { lat: 34.8303, lng: 0.1517 }, radiusKm: 30 },
  { code: '21', codeNumber: 21, name: 'سكيكدة', nameFr: 'Skikda', center: { lat: 36.8762, lng: 6.9092 }, radiusKm: 35 },
  { code: '22', codeNumber: 22, name: 'سيدي بلعباس', nameFr: 'Sidi Bel Abbès', center: { lat: 35.1899, lng: -0.6308 }, radiusKm: 35 },
  { code: '23', codeNumber: 23, name: 'عنابة', nameFr: 'Annaba', center: { lat: 36.9000, lng: 7.7667 }, radiusKm: 35 },
  { code: '24', codeNumber: 24, name: 'قالمة', nameFr: 'Guelma', center: { lat: 36.4621, lng: 7.4261 }, radiusKm: 35 },
  { code: '25', codeNumber: 25, name: 'قسنطينة', nameFr: 'Constantine', center: { lat: 36.3650, lng: 6.6147 }, radiusKm: 35 },
  { code: '26', codeNumber: 26, name: 'المدية', nameFr: 'Médéa', center: { lat: 36.2642, lng: 2.7539 }, radiusKm: 35 },
  { code: '27', codeNumber: 27, name: 'مستغانم', nameFr: 'Mostaganem', center: { lat: 35.9311, lng: 0.0892 }, radiusKm: 35 },
  { code: '28', codeNumber: 28, name: 'المسيلة', nameFr: 'M\'Sila', center: { lat: 35.7058, lng: 4.5419 }, radiusKm: 35 },
  { code: '29', codeNumber: 29, name: 'معسكر', nameFr: 'Mascara', center: { lat: 35.3944, lng: 0.1403 }, radiusKm: 35 },
  { code: '30', codeNumber: 30, name: 'ورقلة', nameFr: 'Ouargla', center: { lat: 31.9493, lng: 5.3250 }, radiusKm: 40 },
  { code: '31', codeNumber: 31, name: 'وهران', nameFr: 'Oran', center: { lat: 35.6971, lng: -0.6308 }, radiusKm: 40 },
  { code: '32', codeNumber: 32, name: 'البيض', nameFr: 'El Bayadh', center: { lat: 33.6832, lng: 1.0193 }, radiusKm: 35 },
  { code: '33', codeNumber: 33, name: 'إليزي', nameFr: 'Illizi', center: { lat: 26.4833, lng: 8.4667 }, radiusKm: 45 },
  { code: '34', codeNumber: 34, name: 'برج بوعريريج', nameFr: 'Bordj Bou Arréridj', center: { lat: 36.0732, lng: 4.7611 }, radiusKm: 35 },
  { code: '35', codeNumber: 35, name: 'بومرداس', nameFr: 'Boumerdès', center: { lat: 36.7664, lng: 3.4772 }, radiusKm: 30 },
  { code: '36', codeNumber: 36, name: 'الطارف', nameFr: 'El Tarf', center: { lat: 36.7672, lng: 8.3139 }, radiusKm: 35 },
  { code: '37', codeNumber: 37, name: 'تندوف', nameFr: 'Tindouf', center: { lat: 27.6711, lng: -8.1478 }, radiusKm: 40 },
  { code: '38', codeNumber: 38, name: 'تسمسيلت', nameFr: 'Tissemsilt', center: { lat: 35.6072, lng: 1.8108 }, radiusKm: 30 },
  { code: '39', codeNumber: 39, name: 'الوادي', nameFr: 'El Oued', center: { lat: 33.3683, lng: 6.8675 }, radiusKm: 35 },
  { code: '40', codeNumber: 40, name: 'خنشلة', nameFr: 'Khenchela', center: { lat: 35.4358, lng: 7.1433 }, radiusKm: 35 },
  { code: '41', codeNumber: 41, name: 'سوق أهراس', nameFr: 'Souk Ahras', center: { lat: 36.2864, lng: 7.9511 }, radiusKm: 35 },
  { code: '42', codeNumber: 42, name: 'تيبازة', nameFr: 'Tipaza', center: { lat: 36.5925, lng: 2.4475 }, radiusKm: 35 },
  { code: '43', codeNumber: 43, name: 'ميلة', nameFr: 'Mila', center: { lat: 36.4503, lng: 6.2644 }, radiusKm: 35 },
  { code: '44', codeNumber: 44, name: 'عين الدفلى', nameFr: 'Aïn Defla', center: { lat: 36.2650, lng: 1.9686 }, radiusKm: 35 },
  { code: '45', codeNumber: 45, name: 'النعامة', nameFr: 'Naâma', center: { lat: 33.2667, lng: -0.3167 }, radiusKm: 35 },
  { code: '46', codeNumber: 46, name: 'عين تموشنت', nameFr: 'Aïn Témouchent', center: { lat: 35.2975, lng: -1.1403 }, radiusKm: 30 },
  { code: '47', codeNumber: 47, name: 'غرداية', nameFr: 'Ghardaïa', center: { lat: 32.4909, lng: 3.6736 }, radiusKm: 35 },
  { code: '48', codeNumber: 48, name: 'غليزان', nameFr: 'Relizane', center: { lat: 35.7372, lng: 0.5558 }, radiusKm: 35 },
  { code: '49', codeNumber: 49, name: 'تيميمون', nameFr: 'Timimoun', center: { lat: 29.2639, lng: 0.2311 }, radiusKm: 40 },
  { code: '50', codeNumber: 50, name: 'برج باجي مختار', nameFr: 'Bordj Badji Mokhtar', center: { lat: 21.3278, lng: 0.9542 }, radiusKm: 45 },
  { code: '51', codeNumber: 51, name: 'أولاد جلال', nameFr: 'Ouled Djellal', center: { lat: 34.4333, lng: 5.0667 }, radiusKm: 35 },
  { code: '52', codeNumber: 52, name: 'بني عباس', nameFr: 'Béni Abbès', center: { lat: 30.1333, lng: -2.1667 }, radiusKm: 40 },
  { code: '53', codeNumber: 53, name: 'عين صالح', nameFr: 'In Salah', center: { lat: 27.1936, lng: 2.4608 }, radiusKm: 40 },
  { code: '54', codeNumber: 54, name: 'عين قزام', nameFr: 'In Guezzam', center: { lat: 19.5722, lng: 5.7694 }, radiusKm: 45 },
  { code: '55', codeNumber: 55, name: 'تقرت', nameFr: 'Touggourt', center: { lat: 33.1053, lng: 6.0581 }, radiusKm: 35 },
  { code: '56', codeNumber: 56, name: 'جانت', nameFr: 'Djanet', center: { lat: 24.5531, lng: 9.4847 }, radiusKm: 45 },
  { code: '57', codeNumber: 57, name: 'المغير', nameFr: 'El M\'Ghair', center: { lat: 33.9500, lng: 5.9167 }, radiusKm: 35 },
  { code: '58', codeNumber: 58, name: 'المنيعة', nameFr: 'El Meniaa', center: { lat: 30.5842, lng: 2.8797 }, radiusKm: 35 },
];

export const WILAYA_NAMES: string[] = ALL_58_WILAYAS.map(w => w.name);

export const ALL_58_SERVICE_AREAS: ServiceArea[] = ALL_58_WILAYAS.map(w => ({
  id: `area-dz-${w.code}`,
  name: w.nameFr,
  nameAr: w.name,
  wilayaCode: w.codeNumber,
  center: w.center,
  radiusKm: w.radiusKm,
  isActive: true,
}));

export function getWilayaByCode(code: string | number): WilayaInfo | undefined {
  const normCode = typeof code === 'number' ? code.toString().padStart(2, '0') : code.trim().padStart(2, '0');
  return ALL_58_WILAYAS.find(w => w.code === normCode || w.codeNumber.toString() === code.toString());
}

export function getWilayaByName(name: string): WilayaInfo | undefined {
  if (!name) return undefined;
  const clean = name.replace(/^ولاية\s+/, '').trim();
  return ALL_58_WILAYAS.find(
    w => w.name.includes(clean) || clean.includes(w.name) || w.nameFr.toLowerCase().includes(clean.toLowerCase())
  );
}

/**
 * Calculates Euclidean/Haversine distance to find the nearest Wilaya in Algeria
 */
export function findNearestAlgerianWilaya(lat: number, lng: number): WilayaInfo {
  let closest = ALL_58_WILAYAS[0];
  let minDistanceSq = Number.MAX_VALUE;

  for (const w of ALL_58_WILAYAS) {
    const dLat = lat - w.center.lat;
    const dLng = lng - w.center.lng;
    const distSq = dLat * dLat + dLng * dLng;
    if (distSq < minDistanceSq) {
      minDistanceSq = distSq;
      closest = w;
    }
  }

  return closest;
}
