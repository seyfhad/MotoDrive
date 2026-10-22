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
  name: 'راكب MotoDrive',
  phone: '0550123456',
  status: 'active',
  cancellationCount: 0,
  createdAt: new Date().toISOString(),
};

export const DEFAULT_PENDING_DRIVER: DriverProfile = {
  id: 'driver-default',
  userId: 'user-default',
  name: 'سائق MotoDrive',
  phone: '0550123456',
  wilaya: 'الجزائر العاصمة',
  municipality: 'الجزائر الوسطى',
  status: 'approved',
  isOnline: false,
  isAvailable: false,
  motorcycle: {
    brand: 'سيم (SYM)',
    model: 'Orbit III 150',
    year: 2024,
    color: 'أسود',
    plateNumber: '16-12345-123',
  },
  documents: {
    status: 'approved',
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

export const INITIAL_PROMO_CODES: PromoCode[] = [];

