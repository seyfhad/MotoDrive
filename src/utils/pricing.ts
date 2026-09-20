import { PricingSettings } from '../types';

export const MINIMUM_BASE_FARE = 120; // 120 د.ج الحد الأدنى والابتدائي
export const MAX_ALLOWED_DISTANCE_KM = 70; // 70 كم أقصى مسافة مسموحة للرحلة

export const DEFAULT_PRICING: PricingSettings = {
  baseFare: 120, // 120 DA
  pricePerKm: 14, // 14 DA / km base rate (0 to 20 km)
  pricePerMinute: 0, // 0 DA / min
  minimumFare: 120, // 120 DA minimum
  cancellationFee: 100, // 100 DA
  platformCommissionPercent: 15, // 15% MotoDrive commission
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
}

/**
 * Algerian Motorcycle Ride Tiered Pricing Formula:
 * - All trips <= 5 km: flat 120 DZD (distance cost = 0, covered by minimum base fare 120 DZD)
 * - 5 to 20 km: climbs from 120 DZD to 400 DZD (+280 DZD across 15 km)
 * - At 20 km: exactly 400 DZD (120 base + 280 distance)
 * - At 40 km: exactly 750 DZD (120 base + 630 distance)
 * - At 60 km: exactly 1500 DZD (120 base + 1380 distance)
 * - 60 to 70 km: continues at 37.5 DZD/km (1875 DZD at 70 km)
 * - Maximum travel distance: 70 km (trips > 70 km are strictly blocked)
 */
export function calculateTieredDistanceCost(distanceKm: number): number {
  if (distanceKm <= 5) {
    // All distances 5 km or under are flat 120 DZD (0 additional distance charge)
    return 0;
  }

  if (distanceKm <= 20) {
    // 5 -> 20 km: climbs from 120 to 400 DZD (+280 DZD over 15 km)
    return ((distanceKm - 5) / 15) * 280;
  } else if (distanceKm <= 40) {
    // 20 -> 40 km: climbs from 400 to 750 DZD (+350 DZD => 17.5 DZD/km)
    // Distance cost at 20 km = 280 DZD
    return 280 + (distanceKm - 20) * 17.5;
  } else if (distanceKm <= 60) {
    // 40 -> 60 km: climbs from 750 to 1500 DZD (+750 DZD => 37.5 DZD/km)
    // Distance cost at 40 km = 280 + 350 = 630 DZD
    return 630 + (distanceKm - 40) * 37.5;
  } else {
    // 60 -> 70 km: intercity rate continues at 37.5 DZD/km
    // Distance cost at 60 km = 630 + 750 = 1380 DZD
    return 1380 + (distanceKm - 60) * 37.5;
  }
}

export function calculateFare(
  distanceKm: number,
  durationMinutes: number = 0,
  pricing: PricingSettings = DEFAULT_PRICING,
  discountPercent: number = 0
): PriceBreakdown {
  const isDistanceExceeded = distanceKm > MAX_ALLOWED_DISTANCE_KM;
  const distanceError = isDistanceExceeded
    ? `لا يمكن التنقل لأبعد من ${MAX_ALLOWED_DISTANCE_KM} كم بالدراجة النارية حفاظاً على السلامة والراحة.`
    : undefined;

  // For any trip from 0.0 km to 5.0 km (e.g. 0.7 km): strictly flat 120 DZD base fare
  if (distanceKm <= 5) {
    const baseFare = MINIMUM_BASE_FARE;
    const roundedPrice = MINIMUM_BASE_FARE; // 120 DZD flat
    const platformCommission = Math.round(
      (roundedPrice * (pricing.platformCommissionPercent || 15)) / 100
    );
    const driverEarning = roundedPrice - platformCommission;

    return {
      baseFare,
      distanceCost: 0,
      timeCost: 0,
      subtotal: baseFare,
      nightSurcharge: 0,
      peakSurcharge: 0,
      discountAmount: 0,
      totalPrice: baseFare,
      roundedPrice,
      platformCommission,
      driverEarning,
      isDistanceExceeded,
      distanceError,
    };
  }

  const baseFare = MINIMUM_BASE_FARE;
  const distanceCost = calculateTieredDistanceCost(distanceKm);
  const timeCost = pricing.isTimeCalculationEnabled
    ? durationMinutes * (pricing.pricePerMinute || 0)
    : 0;

  let subtotal = baseFare + distanceCost + timeCost;

  // Apply 120 DZD minimum fare constraint
  const effectiveMin = MINIMUM_BASE_FARE;
  if (subtotal < effectiveMin) {
    subtotal = effectiveMin;
  }

  // Multipliers
  const nightMultiplier = pricing.nightMultiplier || 1.0;
  const peakMultiplier = pricing.peakMultiplier || 1.0;

  const afterMultipliers = subtotal * nightMultiplier * peakMultiplier;
  const nightSurcharge = subtotal * (nightMultiplier - 1);
  const peakSurcharge = subtotal * (peakMultiplier - 1);

  // Discount
  const discountAmount = discountPercent > 0 ? (afterMultipliers * discountPercent) / 100 : 0;
  const totalPrice = Math.max(effectiveMin, afterMultipliers - discountAmount);

  // Round to nearest 10 DA for easy cash handling in Algeria
  const roundedPrice = Math.round(totalPrice / 10) * 10;

  // MotoDrive Commission calculation
  const platformCommission = Math.round(
    (roundedPrice * (pricing.platformCommissionPercent || 15)) / 100
  );
  const driverEarning = roundedPrice - platformCommission;

  return {
    baseFare,
    distanceCost: Math.round(distanceCost),
    timeCost: Math.round(timeCost),
    subtotal: Math.round(subtotal),
    nightSurcharge: Math.round(nightSurcharge),
    peakSurcharge: Math.round(peakSurcharge),
    discountAmount: Math.round(discountAmount),
    totalPrice: Math.round(totalPrice),
    roundedPrice,
    platformCommission,
    driverEarning,
    isDistanceExceeded,
    distanceError,
  };
}

export function getQuickFareChips(recommendedPrice: number): number[] {
  const minFare = MINIMUM_BASE_FARE;
  if (recommendedPrice <= minFare) {
    return [120, 150, 200, 250];
  }

  const step = recommendedPrice >= 1000 ? 100 : 50;
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
      maxPrice: 2500,
      error: `لا يمكن طلب رحلة أبعد من ${MAX_ALLOWED_DISTANCE_KM} كم بالدراجة النارية حفاظاً على السلامة.`,
    };
  }

  // Strict check for distances from 0.0 to 5.0 km:
  // Flat recommended price is 120 DZD, minimum allowed price is strictly 120 DZD
  if (distanceKm <= 5) {
    const minPrice = MINIMUM_BASE_FARE; // exactly 120 DZD
    const maxPrice = Math.max(300, Math.round((recommendedPrice * 2.0) / 10) * 10);

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

  const effectiveMin = MINIMUM_BASE_FARE; // 120 DZD
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
