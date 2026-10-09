import algeriaDataRaw from './algeria_administrative_divisions.json';
import { AlgeriaLocationItem } from './algeriaLocations';

export interface AlgerianCommune {
  id: number;
  code: string;
  name: string;
  nameAr: string;
  dairaName: string;
  dairaNameFr: string;
  wilayaName: string;
  wilayaNameFr: string;
  wilayaCode: string;
  fullName: string;
  fullNameFr: string;
  coords: {
    lat: number;
    lng: number;
    name: string;
    address: string;
  };
}

export interface AlgerianDaira {
  id: number;
  code: string;
  name: string;
  nameAr: string;
  communesCount: number;
  communes: AlgerianCommune[];
}

export interface AlgerianWilaya {
  code: string;
  codeNumber: number;
  name: string;
  nameFr: string;
  center: {
    lat: number;
    lng: number;
  };
  radiusKm: number;
  dairasCount: number;
  communesCount: number;
  dairas: AlgerianDaira[];
}

export interface AlgerianAdministrativeDivisionsData {
  metadata: {
    title: string;
    titleFr: string;
    country: string;
    countryCode: string;
    version: string;
    totalWilayas: number;
    totalDairas: number;
    totalCommunes: number;
    generatedFor: string;
  };
  wilayas: AlgerianWilaya[];
}

export const ALGERIA_DIVISIONS_DATA = algeriaDataRaw as unknown as AlgerianAdministrativeDivisionsData;

export const ALL_WILAYAS_LIST: AlgerianWilaya[] = ALGERIA_DIVISIONS_DATA.wilayas;

// Flattened list of all communes across all 58 wilayas
export const ALL_COMMUNES_FLAT: AlgerianCommune[] = ALL_WILAYAS_LIST.flatMap(w =>
  w.dairas.flatMap(d => d.communes)
);

// Flattened list of all dairas
export const ALL_DAIRAS_FLAT: AlgerianDaira[] = ALL_WILAYAS_LIST.flatMap(w => w.dairas);

/**
 * Normalizes text for search (Arabic & French)
 */
export function normalizeDivisionsSearchText(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/[ىي]/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/[\u064B-\u065F]/g, '') // tashkeel
    .replace(/[^a-z0-9\u0600-\u06FF]/g, ' ')
    .replace(/\s+/g, ' ');
}

/**
 * Get wilaya by code ("01".."58" or number 1..58) or name
 */
export function getWilayaByCodeOrName(identifier: string | number): AlgerianWilaya | undefined {
  if (!identifier) return undefined;
  const str = String(identifier).trim();
  const num = parseInt(str, 10);
  if (!isNaN(num)) {
    return ALL_WILAYAS_LIST.find(w => w.codeNumber === num || w.code === str.padStart(2, '0'));
  }
  const norm = normalizeDivisionsSearchText(str);
  return ALL_WILAYAS_LIST.find(
    w =>
      normalizeDivisionsSearchText(w.name).includes(norm) ||
      normalizeDivisionsSearchText(w.nameFr).includes(norm)
  );
}

/**
 * Get all communes of a wilaya
 */
export function getCommunesByWilaya(wilayaIdentifier: string | number): AlgerianCommune[] {
  const wilaya = getWilayaByCodeOrName(wilayaIdentifier);
  if (!wilaya) return [];
  return wilaya.dairas.flatMap(d => d.communes);
}

/**
 * Get all dairas of a wilaya
 */
export function getDairasByWilaya(wilayaIdentifier: string | number): AlgerianDaira[] {
  const wilaya = getWilayaByCodeOrName(wilayaIdentifier);
  return wilaya ? wilaya.dairas : [];
}

/**
 * Convert all communes into AlgeriaLocationItem objects for seamless MotoDrive autocomplete
 */
export function convertCommunesToLocationItems(): AlgeriaLocationItem[] {
  return ALL_COMMUNES_FLAT.map(c => ({
    id: `commune-${c.wilayaCode}-${c.id}`,
    name: `${c.nameAr} (${c.name}) - ${c.wilayaName}`,
    nameFr: `${c.name} - ${c.wilayaNameFr}`,
    wilaya: c.wilayaName,
    wilayaCode: c.wilayaCode,
    type: 'municipality',
    coords: {
      lat: c.coords.lat,
      lng: c.coords.lng,
      name: c.nameAr,
      address: c.coords.address || `${c.nameAr}، ${c.dairaName}، ${c.wilayaName}`,
    },
    aliases: [
      c.nameAr,
      c.name,
      c.dairaName,
      c.dairaNameFr,
      c.fullName,
      c.fullNameFr,
      `بلدية ${c.nameAr}`,
      `دائرة ${c.dairaName}`,
      `ولاية ${c.wilayaName}`,
    ],
  }));
}
