import { PricingSettings } from '../types';

export const DEFAULT_PRICING: PricingSettings = {
  baseFare: 100, // 100 DA
  pricePerKm: 40, // 40 DA / km
  pricePerMinute: 5, // 5 DA / min
  minimumFare: 150, // 150 DA minimum
  cancellationFee: 100, // 100 DA
  platformCommissionPercent: 15, // 15% MotoDZ commission
  nightMultiplier: 1.0,
  peakMultiplier: 1.0,
  isTimeCalculationEnabled: false,
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

  // MotoDZ Commission calculation
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

export function formatCurrencyDZD(amount: number): string {
  return `${amount.toLocaleString('fr-DZ')} د.ج`;
}
