import { PricingSettings } from '../types';

export const DEFAULT_PRICING: PricingSettings = {
  baseFare: 100, // 100 DA
  pricePerKm: 40, // 40 DA / km
  pricePerMinute: 5, // 5 DA / min
  minimumFare: 150, // 150 DA minimum
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
}

export function calculateFare(
  distanceKm: number,
  durationMinutes: number,
  pricing: PricingSettings = DEFAULT_PRICING,
  discountPercent: number = 0
): PriceBreakdown {
  const baseFare = pricing.baseFare;
  const distanceCost = distanceKm * pricing.pricePerKm;
  const timeCost = pricing.isTimeCalculationEnabled
    ? durationMinutes * pricing.pricePerMinute
    : 0;

  let subtotal = baseFare + distanceCost + timeCost;

  // Apply minimum fare constraint
  if (subtotal < pricing.minimumFare) {
    subtotal = pricing.minimumFare;
  }

  // Multipliers
  const nightMultiplier = pricing.nightMultiplier || 1.0;
  const peakMultiplier = pricing.peakMultiplier || 1.0;

  const afterMultipliers = subtotal * nightMultiplier * peakMultiplier;
  const nightSurcharge = subtotal * (nightMultiplier - 1);
  const peakSurcharge = subtotal * (peakMultiplier - 1);

  // Discount
  const discountAmount = discountPercent > 0 ? (afterMultipliers * discountPercent) / 100 : 0;
  const totalPrice = Math.max(pricing.minimumFare, afterMultipliers - discountAmount);

  // Round to nearest 10 DA for easy cash handling in Algeria (e.g. 356 -> 360 DA)
  const roundedPrice = Math.ceil(totalPrice / 10) * 10;

  // MotoDrive Commission calculation
  const platformCommission = Math.round(
    (roundedPrice * pricing.platformCommissionPercent) / 100
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
  };
}

export function getQuickFareChips(recommendedPrice: number): number[] {
  const step = 50;
  const p1 = Math.max(150, Math.round((recommendedPrice - step) / 10) * 10);
  const p2 = recommendedPrice;
  const p3 = recommendedPrice + step;
  const p4 = recommendedPrice + step * 2;
  const unique = Array.from(new Set([p1, p2, p3, p4]));
  return unique.sort((a, b) => a - b);
}

export function validateOfferedPrice(
  price: number,
  recommendedPrice: number,
  pricing: PricingSettings = DEFAULT_PRICING
): { isValid: boolean; minPrice: number; maxPrice: number; error?: string } {
  const minRatio = pricing.minOfferedPriceRatio || 0.7;
  const maxRatio = pricing.maxOfferedPriceRatio || 2.0;

  const minPrice = Math.max(pricing.minimumFare, Math.round((recommendedPrice * minRatio) / 10) * 10);
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
