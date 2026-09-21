import {
  UserProfile,
  DriverProfile,
  Ride,
  PricingSettings,
  ServiceArea,
  Complaint,
  AppNotification,
  PromoCode,
} from '../types';
import { DEFAULT_PRICING } from '../utils/pricing';
import { ALL_58_SERVICE_AREAS } from './wilayasData';

export const INITIAL_PASSENGERS: UserProfile[] = [];

export const INITIAL_DRIVERS: DriverProfile[] = [];

export const INITIAL_RIDES: Ride[] = [];

export const GUEST_PASSENGER: UserProfile = {
  id: 'guest',
  role: 'passenger',
  name: 'زائر',
  phone: '',
  status: 'active',
  cancellationCount: 0,
  createdAt: new Date().toISOString(),
};

export const DEFAULT_PENDING_DRIVER: DriverProfile = {
  id: 'driver-default',
  userId: 'user-default',
  name: '',
  phone: '',
  wilaya: 'الجزائر العاصمة',
  municipality: 'الجزائر الوسطى',
  status: 'pending',
  isOnline: false,
  isAvailable: false,
  motorcycle: {
    brand: '',
    model: '',
    year: 2024,
    color: 'أسود',
    plateNumber: '',
  },
  documents: {
    status: 'pending',
    submittedAt: new Date().toISOString(),
  },
  rating: 5.0,
  ratingCount: 0,
  totalTrips: 0,
  cancellationCount: 0,
  location: {
    lat: 36.7538,
    lng: 3.0588,
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const INITIAL_SERVICE_AREAS: ServiceArea[] = ALL_58_SERVICE_AREAS;

export const INITIAL_COMPLAINTS: Complaint[] = [];

export const INITIAL_PROMO_CODES: PromoCode[] = [
  {
    code: 'MOTO20',
    discountPercent: 20,
    maxDiscount: 150,
    isActive: true,
    expiresAt: '2026-12-31T23:59:59Z',
    usageCount: 0,
  },
  {
    code: 'SAHL10',
    discountPercent: 10,
    maxDiscount: 100,
    isActive: true,
    expiresAt: '2026-12-31T23:59:59Z',
    usageCount: 0,
  },
];
