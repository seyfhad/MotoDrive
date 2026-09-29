import { PricingSettings } from '../types';

export const MINIMUM_BASE_FARE = 110; // 110 د.ج الحد الأدنى والابتدائي (0.0 - 5.0 كم)
export const MAX_ALLOWED_DISTANCE_KM = 70; // 70 كم أقصى مسافة مسموحة للرحلة

export const DEFAULT_PRICING: PricingSettings = {
  baseFare: 110, // 110 DA
  pricePerKm: 12.5, // 12.5 DA / km average rate
  pricePerMinute: 0, // 0 DA / min
  minimumFare: 110, // 110 DA minimum
  cancellationFee: 100, // 100 DA
  platformCommissionPercent: 0, // 0% عمولة المنصة - الأرباح كاملة 100% للسائق
  nightMultiplier: 1.0,
  peakMultiplier: 1.0,
  isTimeCalculationEnabled: false,
  minOfferedPriceRatio: 0.70, // -30% lower bound
  maxOfferedPriceRatio: 2.00, // +100% upper bound
  offerTimeoutSeconds: 30, // 30 seconds expiration per offer
  allowDriverCounterOffer: true,
};

export interface PriceBreakdown {
  baseFare: number;
  distanceCost: number;
  timeCost: number;
  subtotal: number;
  nightSurcharge: number;
  peakSurcharge: number;
  discountAmount: number;
  totalPrice: number;
  roundedPrice: number;
  platformCommission: number;
  driverEarning: number;
  isDistanceExceeded: boolean;
  distanceError?: string;
  tierLabel?: string;
}

export interface DistancePricingTier {
  minKm: number;
  maxKm: number;
  fareDZD: number;
  label: string;
}

/**
 * سلم تسعيرة رحلات الدراجات النارية المعتمد في الجزائر:
 * - من 0.0 كلم إلى 5.0 كلم: 110 دج
 * - من 5.1 كلم إلى 8.0 كلم: 150 دج
 * - من 8.1 كلم إلى 11.0 كلم: 200 دج
 * - من 11.1 كلم إلى 15.0 كلم: 250 دج
 * - من 15.1 كلم إلى 19.0 كلم: 300 دج
 * - من 19.1 كلم إلى 23.0 كلم: 350 دج
 * - من 23.1 كلم إلى 27.0 كلم: 400 دج
 * - من 27.1 كلم إلى 31.0 كلم: 450 دج
 * - من 31.0 كلم إلى 35.0 كلم: 700 دج
 * - من 35.1 كلم إلى 40.0 كلم: 850 دج
 * - من 40.1 كلم إلى 45.0 كلم: 1050 دج
 * - من 45.1 كلم إلى 50.0 كلم: 1300 دج
 * - من 50.1 كلم إلى 55.0 كلم: 1500 دج
 * - من 55.1 كلم إلى 60.0 كلم: 1800 دج
 * - من 60.1 كلم إلى 65.0 كلم: 2100 دج
 * - من 65.1 كلم إلى 70.0 كلم: 2400 دج
 * عمولة المنصة: 0% (جميع الأرباح للسائق 100%)
 */
export const DISTANCE_PRICING_TIERS: DistancePricingTier[] = [
  { minKm: 0.0, maxKm: 5.0, fareDZD: 110, label: 'من 0.0 إلى 5.0 كم' },
  { minKm: 5.1, maxKm: 8.0, fareDZD: 150, label: 'من 5.1 إلى 8.0 كم' },
  { minKm: 8.1, maxKm: 11.0, fareDZD: 200, label: 'من 8.1 إلى 11.0 كم' },
  { minKm: 11.1, maxKm: 15.0, fareDZD: 250, label: 'من 11.1 إلى 15.0 كم' },
  { minKm: 15.1, maxKm: 19.0, fareDZD: 300, label: 'من 15.1 إلى 19.0 كم' },
  { minKm: 19.1, maxKm: 23.0, fareDZD: 350, label: 'من 19.1 إلى 23.0 كم' },
  { minKm: 23.1, maxKm: 27.0, fareDZD: 400, label: 'من 23.1 إلى 27.0 كم' },
  { minKm: 27.1, maxKm: 31.0, fareDZD: 450, label: 'من 27.1 إلى 31.0 كم' },
  { minKm: 31.0, maxKm: 35.0, fareDZD: 700, label: 'من 31.0 إلى 35.0 كم' },
  { minKm: 35.1, maxKm: 40.0, fareDZD: 850, label: 'من 35.1 إلى 40.0 كم' },
  { minKm: 40.1, maxKm: 45.0, fareDZD: 1050, label: 'من 40.1 إلى 45.0 كم' },
  { minKm: 45.1, maxKm: 50.0, fareDZD: 1300, label: 'من 45.1 إلى 50.0 كم' },
  { minKm: 50.1, maxKm: 55.0, fareDZD: 1500, label: 'من 50.1 إلى 55.0 كم' },
  { minKm: 55.1, maxKm: 60.0, fareDZD: 1800, label: 'من 55.1 إلى 60.0 كم' },
  { minKm: 60.1, maxKm: 65.0, fareDZD: 2100, label: 'من 60.1 إلى 65.0 كم' },
  { minKm: 65.1, maxKm: 70.0, fareDZD: 2400, label: 'من 65.1 إلى 70.0 كم' },
];

export function getTieredFareByDistance(distanceKm: number): number {
  if (distanceKm <= 5.0) return 110;
  if (distanceKm <= 8.0) return 150;
  if (distanceKm <= 11.0) return 200;
  if (distanceKm <= 15.0) return 250;
  if (distanceKm <= 19.0) return 300;
  if (distanceKm <= 23.0) return 350;
  if (distanceKm <= 27.0) return 400;
  if (distanceKm <= 31.0) return 450;
  if (distanceKm <= 35.0) return 700;
  if (distanceKm <= 40.0) return 850;
  if (distanceKm <= 45.0) return 1050;
  if (distanceKm <= 50.0) return 1300;
  if (distanceKm <= 55.0) return 1500;
  if (distanceKm <= 60.0) return 1800;
  if (distanceKm <= 65.0) return 2100;
  if (distanceKm <= 70.0) return 2400;

  // For any extended distance beyond 70 km:
  const extraKm = distanceKm - 70;
  return 2400 + Math.ceil(extraKm / 5) * 300;
}

export function getTierLabelByDistance(distanceKm: number): string {
  if (distanceKm <= 5.0) return 'شريحة 0.0 - 5.0 كم (110 د.ج)';
  if (distanceKm <= 8.0) return 'شريحة 5.1 - 8.0 كم (150 د.ج)';
  if (distanceKm <= 11.0) return 'شريحة 8.1 - 11.0 كم (200 د.ج)';
  if (distanceKm <= 15.0) return 'شريحة 11.1 - 15.0 كم (250 د.ج)';
  if (distanceKm <= 19.0) return 'شريحة 15.1 - 19.0 كم (300 د.ج)';
  if (distanceKm <= 23.0) return 'شريحة 19.1 - 23.0 كم (350 د.ج)';
  if (distanceKm <= 27.0) return 'شريحة 23.1 - 27.0 كم (400 د.ج)';
  if (distanceKm <= 31.0) return 'شريحة 27.1 - 31.0 كم (450 د.ج)';
  if (distanceKm <= 35.0) return 'شريحة 31.0 - 35.0 كم (700 د.ج)';
  if (distanceKm <= 40.0) return 'شريحة 35.1 - 40.0 كم (850 د.ج)';
  if (distanceKm <= 45.0) return 'شريحة 40.1 - 45.0 كم (1,050 د.ج)';
  if (distanceKm <= 50.0) return 'شريحة 45.1 - 50.0 كم (1,300 د.ج)';
  if (distanceKm <= 55.0) return 'شريحة 50.1 - 55.0 كم (1,500 د.ج)';
  if (distanceKm <= 60.0) return 'شريحة 55.1 - 60.0 كم (1,800 د.ج)';
  if (distanceKm <= 65.0) return 'شريحة 60.1 - 65.0 كم (2,100 د.ج)';
  return 'شريحة 65.1 - 70.0 كم (2,400 د.ج)';
}

export function calculateTieredDistanceCost(distanceKm: number): number {
  const tieredFare = getTieredFareByDistance(distanceKm);
  return Math.max(0, tieredFare - MINIMUM_BASE_FARE);
}

export function calculateFare(
  distanceKm: number,
  _durationMinutes: number = 0,
  pricing: PricingSettings = DEFAULT_PRICING,
  discountPercent: number = 0
): PriceBreakdown {
  const isDistanceExceeded = distanceKm > MAX_ALLOWED_DISTANCE_KM;
  const distanceError = isDistanceExceeded
    ? `لا يمكن التنقل لأبعد من ${MAX_ALLOWED_DISTANCE_KM} كم بالدراجة النارية حفاظاً على السلامة والراحة.`
    : undefined;

  const baseFare = MINIMUM_BASE_FARE; // 110 DZD
  const tieredFare = getTieredFareByDistance(distanceKm);
  const distanceCost = Math.max(0, tieredFare - baseFare);

  // Discount
  const discountAmount = discountPercent > 0 ? (tieredFare * discountPercent) / 100 : 0;
  const totalPrice = Math.max(MINIMUM_BASE_FARE, tieredFare - discountAmount);

  // Exact rounded price matching official tier table
  const roundedPrice = Math.round(totalPrice);

  // MotoDrive Commission calculation (0% commission - all earnings for the driver)
  const commissionRate = (pricing.platformCommissionPercent ?? 0) / 100;
  const platformCommission = Math.round(roundedPrice * commissionRate);
  const driverEarning = roundedPrice - platformCommission;

  return {
    baseFare,
    distanceCost: Math.round(distanceCost),
    timeCost: 0,
    subtotal: Math.round(tieredFare),
    nightSurcharge: 0,
    peakSurcharge: 0,
    discountAmount: Math.round(discountAmount),
    totalPrice: Math.round(totalPrice),
    roundedPrice,
    platformCommission,
    driverEarning,
    isDistanceExceeded,
    distanceError,
    tierLabel: getTierLabelByDistance(distanceKm),
  };
}

export function getQuickFareChips(recommendedPrice: number): number[] {
  const minFare = MINIMUM_BASE_FARE; // 110 DZD
  if (recommendedPrice <= minFare) {
    return [110, 130, 150, 180];
  }

  const step = recommendedPrice >= 1000 ? 100 : (recommendedPrice >= 500 ? 50 : (recommendedPrice <= 150 ? 20 : 30));
  const p1 = Math.max(minFare, Math.round((recommendedPrice - step) / 10) * 10);
  const p2 = recommendedPrice;
  const p3 = recommendedPrice + step;
  const p4 = recommendedPrice + step * 2;
  const unique = Array.from(new Set([p1, p2, p3, p4]));
  return unique.sort((a, b) => a - b);
}

export function validateOfferedPrice(
  price: number,
  recommendedPrice: number,
  pricing: PricingSettings = DEFAULT_PRICING,
  distanceKm: number = 0
): { isValid: boolean; minPrice: number; maxPrice: number; error?: string } {
  if (distanceKm > MAX_ALLOWED_DISTANCE_KM) {
    return {
      isValid: false,
      minPrice: MINIMUM_BASE_FARE,
      maxPrice: 3500,
      error: `لا يمكن طلب رحلة أبعد من ${MAX_ALLOWED_DISTANCE_KM} كم بالدراجة النارية حفاظاً على السلامة.`,
    };
  }

  // Strict check for distances from 0.0 to 5.0 km:
  // Flat recommended price is 110 DZD, minimum allowed price is strictly 110 DZD
  if (distanceKm <= 5) {
    const minPrice = MINIMUM_BASE_FARE; // exactly 110 DZD
    const maxPrice = Math.max(250, Math.round((recommendedPrice * 2.0) / 10) * 10);

    if (price < minPrice) {
      return {
        isValid: false,
        minPrice,
        maxPrice,
        error: `السعر المقترح منخفض جداً. الحد الأدنى المقبول لرحلات (0 إلى 5 كم) هو ${minPrice} د.ج`,
      };
    }

    if (price > maxPrice) {
      return {
        isValid: false,
        minPrice,
        maxPrice,
        error: `السعر المقترح مرتفع جداً. الحد الأقصى هو ${maxPrice} د.ج`,
      };
    }

    return { isValid: true, minPrice, maxPrice };
  }

  const effectiveMin = MINIMUM_BASE_FARE; // 110 DZD
  const minRatio = pricing.minOfferedPriceRatio || 0.7;
  const maxRatio = pricing.maxOfferedPriceRatio || 2.0;

  const minPrice = Math.max(effectiveMin, Math.round((recommendedPrice * minRatio) / 10) * 10);
  const maxPrice = Math.round((recommendedPrice * maxRatio) / 10) * 10;

  if (price < minPrice) {
    return {
      isValid: false,
      minPrice,
      maxPrice,
      error: `السعر المقترح منخفض جداً. الحد الأدنى المقبول لهذه الرحلة هو ${minPrice} د.ج`,
    };
  }

  if (price > maxPrice) {
    return {
      isValid: false,
      minPrice,
      maxPrice,
      error: `السعر المقترح مرتفع جداً عن التسعيرة الموصى بها. الحد الأقصى هو ${maxPrice} د.ج`,
    };
  }

  return { isValid: true, minPrice, maxPrice };
}

export function formatCurrencyDZD(amount: number): string {
  return `${amount.toLocaleString('fr-DZ')} د.ج`;
}
