export type UserRole = 'passenger' | 'driver' | 'admin';

export type DriverStatus = 'pending' | 'approved' | 'rejected' | 'suspended';
export type DriverApprovalStatus = DriverStatus;
export type Driver = DriverProfile;

export type RideStatus =
  | 'searching'
  | 'offers_available'
  | 'accepted'
  | 'driver_arriving'
  | 'driver_arrived'
  | 'trip_started'
  | 'completed'
  | 'cancelled_by_passenger'
  | 'cancelled_by_driver'
  | 'expired';

export type OfferStatus = 'pending' | 'accepted' | 'declined' | 'countered' | 'expired';

export interface Coordinates {
  lat: number;
  lng: number;
  address?: string;
  name?: string;
}

export interface RideOffer {
  id: string;
  rideId: string;
  driverId: string;
  driverName: string;
  driverPhone: string;
  driverPhoto?: string;
  driverRating: number;
  driverTripsCount: number;
  driverMotorcycle: MotorcycleInfo;
  driverLocation: Coordinates;
  distanceToPickupKm: number;
  etaMinutes: number;
  offeredPrice: number;
  isCounterOffer: boolean;
  passengerOfferedPrice: number;
  priceDifference: number;
  status: OfferStatus;
  createdAt: string;
  expiresAt: string;
}

export interface UserProfile {
  id: string;
  role: UserRole;
  name: string;
  phone: string;
  email?: string;
  photoUrl?: string;
  rating?: number;
  totalTrips?: number;
  status: 'active' | 'suspended';
  cancellationCount: number;
  createdAt: string;
  emergencyContact?: {
    name: string;
    phone: string;
  };
}

export interface MotorcycleInfo {
  brand: string;
  model: string;
  year: number;
  color: string;
  plateNumber: string;
}

export interface DriverDocuments {
  identityDocumentUrl?: string;
  licenseUrl?: string;
  vehicleRegistrationUrl?: string;
  insuranceUrl?: string;
  personalPhotoUrl?: string;
  motorcyclePhotosUrls?: string[];
  // Specific required uploads requested by user
  selfieUrl?: string;
  motorcycleFrontUrl?: string;
  motorcycleBackUrl?: string;
  licenseFrontUrl?: string;
  licenseBackUrl?: string;
  vehicleDocFrontUrl?: string;
  vehicleDocBackUrl?: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  submittedAt: string;
}

export interface DriverProfile {
  id: string;
  userId: string;
  name: string;
  phone: string;
  email?: string;
  photoUrl?: string;
  wilaya: string;
  municipality: string;
  birthDate?: string;
  status: DriverStatus;
  rejectionReason?: string;
  isOnline: boolean;
  isAvailable: boolean;
  motorcycle: MotorcycleInfo;
  documents: DriverDocuments;
  rating: number;
  ratingCount: number;
  totalTrips: number;
  cancellationCount: number;
  currentRideId?: string | null;
  location: Coordinates;
  heading?: number;
  updatedAt: string;
  createdAt: string;
}

export interface Ride {
  id: string;
  passengerId: string;
  passengerName: string;
  passengerPhone: string;
  passengerPhoto?: string;
  passengerRating?: number;
  passengerNote?: string;

  driverId?: string | null;
  driverName?: string;
  driverPhone?: string;
  driverPhoto?: string;
  driverRating?: number;
  driverMotorcycle?: MotorcycleInfo;
  driverLocation?: Coordinates;

  status: RideStatus;
  pickup: Coordinates;
  destination: Coordinates;

  distanceKm: number;
  estimatedDurationMins: number;
  actualDurationMins?: number;

  recommendedPrice: number;
  passengerOfferedPrice: number;
  estimatedPrice: number;
  finalPrice?: number;
  platformCommission: number;
  driverEarning: number;

  offers?: RideOffer[];
  selectedOfferId?: string;

  paymentMethod: 'cash' | 'card' | 'wallet';
  paymentStatus: 'pending' | 'paid';

  cancellationReason?: string;
  cancelledBy?: 'passenger' | 'driver' | 'admin';
  cancellationFee?: number;

  requestedAt: string;
  acceptedAt?: string;
  arrivedAt?: string;
  startedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  expiresAt?: string;
}

export interface Rating {
  id: string;
  rideId: string;
  passengerId: string;
  driverId: string;
  rating: number; // 1 - 5
  tags: string[]; // e.g. "قيادة آمنة", "نظافة الدراجة", "الالتزام بالوقت", "احترام"
  comment?: string;
  createdAt: string;
}

export interface PaymentRecord {
  id: string;
  rideId: string;
  passengerId: string;
  driverId: string;
  amount: number;
  platformFee: number;
  driverEarning: number;
  method: 'cash' | 'cib' | 'edahabia';
  status: 'completed' | 'pending';
  createdAt: string;
}

export interface PricingSettings {
  baseFare: number; // e.g. 100 DA
  pricePerKm: number; // e.g. 40 DA
  pricePerMinute: number; // e.g. 5 DA
  minimumFare: number; // e.g. 150 DA
  cancellationFee: number; // e.g. 100 DA
  platformCommissionPercent: number; // e.g. 15%
  nightMultiplier: number; // e.g. 1.2
  peakMultiplier: number; // e.g. 1.15
  isTimeCalculationEnabled: boolean;
  minOfferedPriceRatio: number; // e.g. 0.70 (-30% minimum price tolerance)
  maxOfferedPriceRatio: number; // e.g. 2.00 (+100% maximum price tolerance)
  offerTimeoutSeconds: number; // e.g. 30 seconds
  allowDriverCounterOffer: boolean;
}

export interface ServiceArea {
  id: string;
  name: string;
  nameAr: string;
  wilayaCode: number;
  center: Coordinates;
  radiusKm: number;
  isActive: boolean;
  customPricing?: Partial<PricingSettings>;
}

export interface Complaint {
  id: string;
  rideId?: string;
  submittedBy: 'passenger' | 'driver';
  userId: string;
  userName: string;
  targetUserId?: string;
  targetUserName?: string;
  reason: string;
  description: string;
  status: 'pending' | 'investigating' | 'resolved' | 'dismissed';
  adminNotes?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface AppNotification {
  id: string;
  recipientId: string;
  recipientRole: UserRole;
  title: string;
  body: string;
  type: 'ride_update' | 'driver_approval' | 'complaint' | 'system' | 'promo';
  data?: Record<string, any>;
  isRead: boolean;
  createdAt: string;
}

export interface PromoCode {
  code: string;
  discountPercent: number;
  maxDiscount: number;
  isActive: boolean;
  expiresAt: string;
  usageCount: number;
}
