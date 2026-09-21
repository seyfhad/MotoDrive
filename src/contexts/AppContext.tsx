import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  collection,
  doc,
  query,
  where,
  orderBy,
  onSnapshot,
  getDocs,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import {
  UserRole,
  UserProfile,
  DriverProfile,
  DriverApprovalStatus,
  Ride,
  RideStatus,
  RideOffer,
  PricingSettings,
  ServiceArea,
  Complaint,
  AppNotification,
  Coordinates,
  Rating,
} from '../types';
import {
  INITIAL_PASSENGERS,
  INITIAL_DRIVERS,
  INITIAL_SERVICE_AREAS,
  INITIAL_COMPLAINTS,
  INITIAL_PROMO_CODES,
  GUEST_PASSENGER,
  DEFAULT_PENDING_DRIVER,
} from '../data/mockData';
import { DEFAULT_PRICING, calculateFare, validateOfferedPrice } from '../utils/pricing';
import { calculateDistanceKm, estimateDurationMinutes, calculateBearing } from '../utils/geo';
import {
  createRideInFirestore,
  updatePassengerOfferInFirestore,
  cancelRideInFirestore,
  submitDriverOfferInFirestore,
  acceptDriverOfferTransaction,
  advanceRideStatusInFirestore,
  submitRatingToFirestore,
  submitComplaintToFirestore,
  updateDriverLocation as updateFirestoreDriverLocation,
  updateDriverOnlineStatus as updateFirestoreDriverOnlineStatus,
  syncDriverProfile,
  syncUserProfile,
  clearAllTestDataFromFirestore,
  saveSystemPricing,
  sanitizeFirestoreData,
} from '../services/firestoreService';
import { handleFirestoreError, OperationType } from '../services/firestoreErrorHandler';
import { subscribeToAuth, signInQuickGuest, signOutUser } from '../services/authService';

interface AppContextType {
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  activePassenger: UserProfile;
  setActivePassenger: (passenger: UserProfile) => void;
  activeDriver: DriverProfile;
  setActiveDriver: (driver: DriverProfile) => void;
  
  passengers: UserProfile[];
  drivers: DriverProfile[];
  rides: Ride[];
  pricing: PricingSettings;
  serviceAreas: ServiceArea[];
  complaints: Complaint[];
  notifications: AppNotification[];
  ratings: Rating[];

  // Firebase Realtime State
  isFirebaseConnected: boolean;
  currentUser: any;
  setCurrentUser: (user: any) => void;
  logout: () => Promise<void>;

  // Passenger actions
  currentPassengerRide: Ride | null;
  requestRide: (
    pickup: Coordinates,
    destination: Coordinates,
    passengerOfferedPrice?: number,
    passengerNote?: string,
    promoCode?: string
  ) => Promise<{ success: boolean; rideId?: string; error?: string }>;
  acceptDriverOffer: (rideId: string, offerId: string) => Promise<{ success: boolean; error?: string }>;
  declineDriverOffer: (rideId: string, offerId: string) => void;
  updatePassengerOffer: (rideId: string, newOfferedPrice: number) => Promise<{ success: boolean; error?: string }>;
  cancelRide: (rideId: string, reason: string, cancelledBy: 'passenger' | 'driver') => Promise<void>;
  submitRating: (rideId: string, stars: number, tags: string[], comment?: string) => Promise<void>;
  submitComplaint: (
    rideId: string | undefined,
    reason: string,
    description: string,
    targetUserId?: string
  ) => Promise<void>;

  // Driver actions
  currentDriverRide: Ride | null;
  pendingDriverRideRequest: Ride | null;
  toggleDriverOnline: (driverId: string, isOnline: boolean) => Promise<{ success: boolean; error?: string }>;
  submitDriverOffer: (
    rideId: string,
    driverId: string,
    offeredPrice: number
  ) => Promise<{ success: boolean; error?: string }>;
  acceptRide: (rideId: string, driverId: string) => Promise<{ success: boolean; error?: string }>;
  rejectRide: (rideId: string, driverId: string) => void;
  advanceRideStatus: (rideId: string) => Promise<void>;
  updateDriverLocation: (driverId: string, location: Coordinates, heading?: number) => void;
  registerDriver: (driverData: Partial<DriverProfile>) => Promise<{ success: boolean; driverId: string }>;

  // Admin actions
  approveDriver: (driverId: string) => Promise<void>;
  rejectDriver: (driverId: string, reason: string) => Promise<void>;
  suspendDriver: (driverId: string) => Promise<void>;
  updateDriverStatus: (driverId: string, status: DriverApprovalStatus, reason?: string) => Promise<void>;
  updatePricing: (newPricing: PricingSettings) => Promise<void>;
  toggleServiceArea: (id: string) => void;
  resolveComplaint: (complaintId: string, notes: string) => Promise<void>;
  broadcastNotification: (title: string, body: string, targetRole?: UserRole) => void;
  purgeAllTestData: () => Promise<{ deletedCount: number }>;

  // Simulator controls
  isAutoDriverSimulation: boolean;
  setIsAutoDriverSimulation: (val: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_PREFIX = 'motodz_v2_';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState<boolean>(false);

  // Current role selector for seamless UI preview
  const [currentRole, setCurrentRole] = useState<UserRole>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'role');
    return (saved as UserRole) || 'passenger';
  });

  const [passengers, setPassengers] = useState<UserProfile[]>(INITIAL_PASSENGERS);
  const [drivers, setDrivers] = useState<DriverProfile[]>(INITIAL_DRIVERS);
  const [rides, setRides] = useState<Ride[]>([]);
  const [pricing, setPricing] = useState<PricingSettings>(DEFAULT_PRICING);
  const [serviceAreas, setServiceAreas] = useState<ServiceArea[]>(INITIAL_SERVICE_AREAS);
  const [complaints, setComplaints] = useState<Complaint[]>(INITIAL_COMPLAINTS);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [ratings, setRatings] = useState<Rating[]>([]);

  // Simulation switch (default to false for real Firebase mode, toggleable in UI)
  const [isAutoDriverSimulation, setIsAutoDriverSimulation] = useState<boolean>(false);

  // Active profiles (fresh guest state by default)
  const [activePassenger, setActivePassenger] = useState<UserProfile>(() => GUEST_PASSENGER);
  const [activeDriver, setActiveDriver] = useState<DriverProfile>(() => DEFAULT_PENDING_DRIVER);

  // Track GPS location watcher
  const geoWatchIdRef = useRef<number | null>(null);

  // Auto-purge initial lingering test documents in Firestore as requested by user
  useEffect(() => {
    clearAllTestDataFromFirestore().then(() => {
      setRides([]);
      setDrivers([]);
      setPassengers([]);
      setComplaints([]);
      setRatings([]);
    }).catch(err => {
      console.warn('Auto purge initial test data notice:', err);
    });
  }, []);

  // --------------------------------------------------------------------------
  // 1. FIREBASE AUTH & USER PROFILE INITIALIZATION
  // --------------------------------------------------------------------------
  useEffect(() => {
    const unsubscribe = subscribeToAuth(async (firebaseUser, userProfile) => {
      if (firebaseUser && userProfile) {
        setCurrentUser(firebaseUser);
        setIsFirebaseConnected(true);
        setActivePassenger(userProfile);
        // Direct admin redirect if user is seyfhad@gmail.com
        if (
          firebaseUser.email?.toLowerCase() === 'seyfhad@gmail.com' ||
          userProfile.email?.toLowerCase() === 'seyfhad@gmail.com' ||
          userProfile.role === 'admin'
        ) {
          setCurrentRole('admin');
          localStorage.setItem(STORAGE_PREFIX + 'role', 'admin');
        } else if (userProfile.role === 'driver') {
          setCurrentRole('driver');
          localStorage.setItem(STORAGE_PREFIX + 'role', 'driver');
        } else {
          setCurrentRole('passenger');
          localStorage.setItem(STORAGE_PREFIX + 'role', 'passenger');
        }
      } else {
        setCurrentUser(null);
        setActivePassenger(GUEST_PASSENGER);
      }
    });

    return () => unsubscribe();
  }, []);

  // --------------------------------------------------------------------------
  // 2. REAL-TIME FIRESTORE SUBSCRIPTIONS (RIDES, OFFERS, DRIVERS, PRICING)
  // --------------------------------------------------------------------------
  useEffect(() => {
    // 2.1 Subscribe to System Pricing
    const pricingPath = 'system_config/pricing';
    const pricingDocRef = doc(db, 'system_config', 'pricing');
    const unsubPricing = onSnapshot(pricingDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const rawData = docSnap.data() as Partial<PricingSettings>;
        // Guarantee baseFare and minimumFare are at standard 120 DZD (not legacy 150 DZD)
        const sanitized: PricingSettings = {
          ...DEFAULT_PRICING,
          ...rawData,
          baseFare: 120,
          minimumFare: 120,
          peakMultiplier: rawData.peakMultiplier ?? (rawData as any).peakHourMultiplier ?? 1.0,
          nightMultiplier: rawData.nightMultiplier ?? 1.0,
        };
        delete (sanitized as any).peakHourMultiplier;
        setPricing(sanitized);

        // If Firestore had stale 150 DZD or deprecated keys, automatically update it
        if (rawData.minimumFare !== 120 || rawData.baseFare !== 120 || (rawData as any).peakHourMultiplier !== undefined) {
          saveSystemPricing(sanitized).catch(() => {});
        }
      } else {
        // Initialize default pricing in Firestore if missing
        saveSystemPricing({ ...DEFAULT_PRICING, baseFare: 120, minimumFare: 120 }).catch(err => {
          console.warn('Initial pricing set notice:', err);
        });
      }
    }, (err) => {
      console.warn('Pricing snapshot notice:', err.message);
      try {
        handleFirestoreError(err, OperationType.GET, pricingPath);
      } catch (e) {
        // Logged standardized error
      }
    });

    // 2.2 Subscribe to Real-Time Rides
    const ridesPath = 'rides';
    const ridesQuery = query(collection(db, 'rides'), orderBy('createdAt', 'desc'));
    const unsubRides = onSnapshot(ridesQuery, async (querySnap) => {
      const fetchedRides: Ride[] = [];
      
      for (const rideDoc of querySnap.docs) {
        const rideData = { id: rideDoc.id, ...rideDoc.data() } as Ride;
        
        // Fetch subcollection offers for active negotiating rides
        if (['searching', 'offers_available', 'accepted', 'driver_arriving'].includes(rideData.status)) {
          try {
            const offersQuery = query(collection(db, 'rides', rideDoc.id, 'offers'), orderBy('createdAt', 'asc'));
            const offersSnap = await getDocs(offersQuery);
            rideData.offers = offersSnap.docs.map(d => ({ id: d.id, ...d.data() } as RideOffer));
          } catch (err) {
            console.warn(`Error reading offers for ride ${rideDoc.id}:`, err);
          }
        }

        fetchedRides.push(rideData);
      }

      setRides(fetchedRides);
    }, (err) => {
      console.warn('Rides snapshot notice:', err.message);
      try {
        handleFirestoreError(err, OperationType.GET, ridesPath);
      } catch (e) {
        // Logged standardized error
      }
    });

    // 2.3 Subscribe to Real-Time Drivers
    const driversPath = 'drivers';
    const driversQuery = query(collection(db, 'drivers'));
    const unsubDrivers = onSnapshot(driversQuery, (querySnap) => {
      const fetchedDrivers: DriverProfile[] = querySnap.docs.map(
        d => ({ id: d.id, ...d.data() } as DriverProfile)
      );
      setDrivers(fetchedDrivers);
    }, (err) => {
      console.warn('Drivers snapshot notice:', err.message);
      try {
        handleFirestoreError(err, OperationType.GET, driversPath);
      } catch (e) {
        // Logged standardized error
      }
    });

    return () => {
      unsubPricing();
      unsubRides();
      unsubDrivers();
    };
  }, []);

  // Sync active driver/passenger references
  useEffect(() => {
    const foundD = drivers.find(d => d.id === activeDriver.id);
    if (foundD) setActiveDriver(foundD);
  }, [drivers, activeDriver.id]);

  // --------------------------------------------------------------------------
  // 3. REAL GPS TRACKING FOR ACTIVE DRIVER
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (activeDriver.isOnline && 'geolocation' in navigator) {
      geoWatchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude, heading, speed } = pos.coords;
          updateFirestoreDriverLocation(
            activeDriver.id,
            latitude,
            longitude,
            heading || undefined,
            speed || undefined
          ).catch(console.error);
        },
        (err) => {
          console.warn('Geolocation error or permission denied:', err.message);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
      );
    } else if (geoWatchIdRef.current !== null) {
      navigator.geolocation.clearWatch(geoWatchIdRef.current);
      geoWatchIdRef.current = null;
    }

    return () => {
      if (geoWatchIdRef.current !== null) {
        navigator.geolocation.clearWatch(geoWatchIdRef.current);
      }
    };
  }, [activeDriver.isOnline, activeDriver.id]);

  // Derive Current Active Rides
  const currentPassengerRide = rides.find(
    r =>
      r.passengerId === activePassenger.id &&
      !['completed', 'cancelled_by_passenger', 'cancelled_by_driver', 'expired'].includes(r.status)
  ) || null;

  const currentDriverRide = rides.find(
    r =>
      r.driverId === activeDriver.id &&
      !['completed', 'cancelled_by_passenger', 'cancelled_by_driver', 'expired'].includes(r.status)
  ) || null;

  // Driver incoming requests (searching or offers_available and driver is online)
  const pendingDriverRideRequest = (activeDriver.isOnline && activeDriver.status === 'approved' && !currentDriverRide)
    ? rides.find(r => (r.status === 'searching' || r.status === 'offers_available')) || null
    : null;

  // Notification Helper
  const addNotification = useCallback((
    recipientId: string,
    recipientRole: UserRole,
    title: string,
    body: string,
    type: AppNotification['type'] = 'ride_update',
    data?: Record<string, any>
  ) => {
    const newNotif: AppNotification = {
      id: 'NOTIF-' + Math.random().toString(36).substring(2, 9),
      recipientId,
      recipientRole,
      title,
      body,
      type,
      data,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    setNotifications(prev => [newNotif, ...prev]);
  }, []);

  // --------------------------------------------------------------------------
  // 4. PASSENGER REAL ACTIONS
  // --------------------------------------------------------------------------
  const requestRide = async (
    pickup: Coordinates,
    destination: Coordinates,
    passengerOfferedPrice?: number,
    passengerNote?: string,
    promoCode?: string
  ): Promise<{ success: boolean; rideId?: string; error?: string }> => {
    if (currentPassengerRide) {
      return { success: false, error: 'لديك رحلة جارية أو قيد التفاوض بالفعل!' };
    }

    const distanceKm = calculateDistanceKm(pickup, destination);
    if (distanceKm > 70) {
      return { success: false, error: 'أقصى مسافة مسموحة للرحلة بالدراجة النارية هي 70 كم حفاظاً على السلامة.' };
    }
    const estimatedDuration = estimateDurationMinutes(distanceKm);

    let discountPercent = 0;
    if (promoCode) {
      const foundPromo = INITIAL_PROMO_CODES.find(
        p => p.code.toUpperCase() === promoCode.toUpperCase() && p.isActive
      );
      if (foundPromo) discountPercent = foundPromo.discountPercent;
    }

    const recommendedBreakdown = calculateFare(distanceKm, estimatedDuration, pricing, discountPercent);
    const recommendedPrice = recommendedBreakdown.roundedPrice;

    const offeredPrice = passengerOfferedPrice && passengerOfferedPrice > 0
      ? passengerOfferedPrice
      : recommendedPrice;

    const validation = validateOfferedPrice(offeredPrice, recommendedPrice, pricing, distanceKm);
    if (!validation.isValid) {
      return { success: false, error: validation.error };
    }

    const commission = Math.round((offeredPrice * pricing.platformCommissionPercent) / 100);
    const driverEarning = offeredPrice - commission;

    try {
      const ridePayload: any = {
        passengerId: activePassenger.id,
        passengerName: activePassenger.name,
        passengerPhone: activePassenger.phone,
        passengerRating: activePassenger.rating || 4.9,
        status: 'searching',
        pickup,
        destination,
        distanceKm,
        estimatedDurationMins: estimatedDuration,
        recommendedPrice,
        passengerOfferedPrice: offeredPrice,
        estimatedPrice: offeredPrice,
        platformCommission: commission,
        driverEarning,
        paymentMethod: 'cash',
        paymentStatus: 'pending',
        requestedAt: new Date().toISOString(),
      };

      if (activePassenger.photoUrl) {
        ridePayload.passengerPhoto = activePassenger.photoUrl;
      }
      if (passengerNote && passengerNote.trim()) {
        ridePayload.passengerNote = passengerNote.trim();
      }

      const rideDocId = await createRideInFirestore(ridePayload);

      addNotification(
        'all_drivers',
        'driver',
        '🏍️ طلب رحلة جديد بالتفاوض!',
        `من ${pickup.name || 'الموقع المحدد'} إلى ${destination.name || 'الوجهة'} • عرض الراكب: ${offeredPrice} د.ج`
      );

      return { success: true, rideId: rideDocId };
    } catch (err: any) {
      console.warn('Ride creation notice in AppContext:', err);
      return { success: false, error: err.message || 'تعذر إرسال طلب الرحلة' };
    }
  };

  const acceptDriverOffer = async (
    rideId: string,
    offerId: string
  ): Promise<{ success: boolean; error?: string }> => {
    const ride = rides.find(r => r.id === rideId);
    if (!ride) return { success: false, error: 'الرحلة غير موجودة' };

    const offer = (ride.offers || []).find(o => o.id === offerId);
    if (!offer) return { success: false, error: 'عرض السائق غير متوفر أو منتهي' };

    const driver = drivers.find(d => d.id === offer.driverId);
    if (!driver) return { success: false, error: 'بيانات السائق غير موجودة' };

    // Atomically lock driver selection via Firestore Transaction
    const result = await acceptDriverOfferTransaction(
      rideId,
      offerId,
      driver,
      offer.offeredPrice,
      pricing.platformCommissionPercent
    );

    if (result.success) {
      addNotification(
        driver.id,
        'driver',
        '🎉 تم قبول عرضك!',
        `الراكب ${ride.passengerName} قبل عرضك بقيمة ${offer.offeredPrice} د.ج. توجه لموقع الانطلاق.`
      );
    }

    return result;
  };

  const declineDriverOffer = (rideId: string, offerId: string) => {
    // Declining is reflected directly in local state and filtered
    setRides(prev =>
      prev.map(r => {
        if (r.id !== rideId) return r;
        const updatedOffers = (r.offers || []).map(o =>
          o.id === offerId ? { ...o, status: 'declined' as const } : o
        );
        return { ...r, offers: updatedOffers };
      })
    );
  };

  const updatePassengerOffer = async (
    rideId: string,
    newOfferedPrice: number
  ): Promise<{ success: boolean; error?: string }> => {
    const targetRide = rides.find(r => r.id === rideId);
    if (!targetRide || !['searching', 'offers_available'].includes(targetRide.status)) {
      return { success: false, error: 'لا يمكن تعديل السعر في هذه المرحلة' };
    }

    const validation = validateOfferedPrice(newOfferedPrice, targetRide.recommendedPrice, pricing);
    if (!validation.isValid) {
      return { success: false, error: validation.error || 'السعر غير صالح' };
    }

    try {
      await updatePassengerOfferInFirestore(rideId, newOfferedPrice);
      addNotification(
        'all_drivers',
        'driver',
        '⚡ الراكب رفع السعر المقترح!',
        `تم تحديث السعر المقترح للرحلة #${rideId} إلى ${newOfferedPrice} د.ج.`
      );
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'تعذر تحديث السعر' };
    }
  };

  const cancelRide = async (rideId: string, reason: string, cancelledBy: 'passenger' | 'driver') => {
    try {
      await cancelRideInFirestore(rideId, reason, cancelledBy);
    } catch (e) {
      console.error('Error cancelling ride in Firestore:', e);
    }
  };

  // --------------------------------------------------------------------------
  // 5. DRIVER REAL ACTIONS
  // --------------------------------------------------------------------------
  const submitDriverOffer = async (
    rideId: string,
    driverId: string,
    offeredPrice: number
  ): Promise<{ success: boolean; error?: string }> => {
    const driver = drivers.find(d => d.id === driverId);
    if (!driver) return { success: false, error: 'السائق غير مسجل' };
    if (driver.status !== 'approved') return { success: false, error: 'حساب السائق غير معتمد' };
    if (!driver.isOnline) return { success: false, error: 'يجب أن تكون في وضع Online لتقديم العروض' };

    const targetRide = rides.find(r => r.id === rideId);
    if (!targetRide || !['searching', 'offers_available'].includes(targetRide.status)) {
      return { success: false, error: 'الرحلة لم تعد متاحة لتقديم العروض' };
    }

    const distToPickup = calculateDistanceKm(driver.location, targetRide.pickup);
    const etaMins = Math.max(1, Math.round(distToPickup * 2.2));
    const isCounter = offeredPrice !== targetRide.passengerOfferedPrice;
    const diff = offeredPrice - targetRide.passengerOfferedPrice;

    try {
      await submitDriverOfferInFirestore(rideId, {
        rideId,
        driverId: driver.id,
        driverName: driver.name,
        driverPhone: driver.phone,
        driverPhoto: driver.photoUrl,
        driverRating: driver.rating,
        driverTripsCount: driver.totalTrips,
        driverMotorcycle: driver.motorcycle,
        driverLocation: driver.location,
        distanceToPickupKm: distToPickup,
        etaMinutes: etaMins,
        offeredPrice,
        isCounterOffer: isCounter,
        passengerOfferedPrice: targetRide.passengerOfferedPrice,
        priceDifference: diff,
        status: 'pending',
        expiresAt: new Date(Date.now() + (pricing.offerTimeoutSeconds || 30) * 1000).toISOString(),
      });

      addNotification(
        targetRide.passengerId,
        'passenger',
        '🏍️ عرض جديد من سائق دراجة!',
        `${driver.name} يقترح ${offeredPrice} د.ج على دراجة ${driver.motorcycle.brand}`
      );

      return { success: true };
    } catch (err: any) {
      console.error('Error submitting driver offer in Firestore:', err);
      return { success: false, error: err.message || 'تعذر إرسال العرض' };
    }
  };

  const acceptRide = async (rideId: string, driverId: string): Promise<{ success: boolean; error?: string }> => {
    const ride = rides.find(r => r.id === rideId);
    if (!ride) return { success: false, error: 'الرحلة غير موجودة' };
    return submitDriverOffer(rideId, driverId, ride.passengerOfferedPrice || ride.estimatedPrice);
  };

  const toggleDriverOnline = async (driverId: string, isOnline: boolean): Promise<{ success: boolean; error?: string }> => {
    const driver = drivers.find(d => d.id === driverId);
    if (!driver) return { success: false, error: 'السائق غير موجود' };

    if (isOnline && driver.status !== 'approved') {
      return {
        success: false,
        error: 'لا يمكنك تفعيل وضع Online حتى تتم مراجعة وثائقك واعتماد حسابك من الإدارة.',
      };
    }

    try {
      await updateFirestoreDriverOnlineStatus(driverId, isOnline, isOnline);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'تعذر تغيير حالة الاتصال' };
    }
  };

  const rejectRide = (rideId: string, driverId: string) => {
    addNotification(driverId, 'driver', 'تم التخطي', 'تم تخطي هذا الطلب');
  };

  const advanceRideStatus = async (rideId: string) => {
    const targetRide = rides.find(r => r.id === rideId);
    if (!targetRide) return;

    let nextStatus: RideStatus = targetRide.status;
    const extraData: Partial<Ride> = {};

    if (targetRide.status === 'accepted' || targetRide.status === 'driver_arriving') {
      nextStatus = 'driver_arrived';
      extraData.arrivedAt = new Date().toISOString();
      addNotification(targetRide.passengerId, 'passenger', '📍 السائق وصل!', 'السائق بانتظارك في موقع الانطلاق.');
    } else if (targetRide.status === 'driver_arrived') {
      nextStatus = 'trip_started';
      extraData.startedAt = new Date().toISOString();
      addNotification(targetRide.passengerId, 'passenger', '🏍️ انطلقت الرحلة', 'نتمنى لك رحلة آمنة ومريحة مع MotoDrive.');
    } else if (targetRide.status === 'trip_started') {
      nextStatus = 'completed';
      extraData.completedAt = new Date().toISOString();
      extraData.paymentStatus = 'paid';
      extraData.finalPrice = targetRide.finalPrice || targetRide.estimatedPrice;
      addNotification(
        targetRide.passengerId,
        'passenger',
        '🎉 تم الوصول بنجاح',
        `المبلغ المستحق نقدًا: ${targetRide.finalPrice || targetRide.estimatedPrice} د.ج. يرجى تقييم السائق.`
      );
    }

    try {
      await advanceRideStatusInFirestore(rideId, nextStatus, extraData);
    } catch (e) {
      console.error('Error advancing ride status in Firestore:', e);
    }
  };

  const updateDriverLocation = (driverId: string, location: Coordinates, heading?: number) => {
    updateFirestoreDriverLocation(driverId, location.lat, location.lng, heading).catch(console.error);
  };

  const registerDriver = async (driverData: Partial<DriverProfile>): Promise<{ success: boolean; driverId: string }> => {
    const newDriverId = 'driver-' + Math.random().toString(36).substring(2, 8);
    const newDriver: DriverProfile = {
      id: newDriverId,
      userId: currentUser?.uid || ('user-' + newDriverId),
      name: driverData.name || 'سائق جديد',
      phone: driverData.phone || '',
      email: driverData.email,
      photoUrl: driverData.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      wilaya: driverData.wilaya || 'الجزائر العاصمة',
      municipality: driverData.municipality || 'الجزائر',
      birthDate: driverData.birthDate,
      status: 'pending',
      isOnline: false,
      isAvailable: false,
      motorcycle: driverData.motorcycle || {
        brand: 'Yamaha',
        model: 'Cygnus',
        year: 2023,
        color: 'أسود',
        plateNumber: '116-000-16',
      },
      documents: driverData.documents || {
        status: 'pending',
        submittedAt: new Date().toISOString(),
      },
      rating: 5.0,
      ratingCount: 0,
      totalTrips: 0,
      cancellationCount: 0,
      currentRideId: null,
      location: { lat: 36.7538, lng: 3.0588, address: 'الجزائر العاصمة' },
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    await syncDriverProfile(newDriver);
    setActiveDriver(newDriver);
    addNotification('admin', 'admin', '📋 تسجيل سائق جديد', `السائق ${newDriver.name} ينتظر مراجعة الوثائق.`);
    return { success: true, driverId: newDriverId };
  };

  // --------------------------------------------------------------------------
  // 6. RATINGS & COMPLAINTS
  // --------------------------------------------------------------------------
  const submitRating = async (rideId: string, stars: number, tags: string[], comment?: string) => {
    const ride = rides.find(r => r.id === rideId);
    if (!ride || !ride.driverId) return;

    await submitRatingToFirestore({
      rideId,
      passengerId: ride.passengerId,
      driverId: ride.driverId,
      rating: stars,
      tags,
      comment,
    });
  };

  const submitComplaint = async (
    rideId: string | undefined,
    reason: string,
    description: string,
    targetUserId?: string
  ) => {
    const isPassenger = currentRole === 'passenger';
    await submitComplaintToFirestore({
      rideId,
      submittedBy: isPassenger ? 'passenger' : 'driver',
      userId: isPassenger ? activePassenger.id : activeDriver.id,
      userName: isPassenger ? activePassenger.name : activeDriver.name,
      targetUserId,
      reason,
      description,
      status: 'pending',
    });
    addNotification('admin', 'admin', '⚠️ شكوى جديدة واردة', `${reason}: ${description}`);
  };

  // --------------------------------------------------------------------------
  // 7. ADMIN ACTIONS
  // --------------------------------------------------------------------------
  const approveDriver = async (driverId: string) => {
    const drv = drivers.find(d => d.id === driverId);
    if (!drv) return;
    await syncDriverProfile({ ...drv, status: 'approved' });
    addNotification(
      driverId,
      'driver',
      '🎉 تم قبول حسابك!',
      'تهانينا! تمت مراجعة وثائقك بنجاح. يمكنك الآن تفعيل وضع Online والبدء في استقبال الرحلات.'
    );
  };

  const rejectDriver = async (driverId: string, reason: string) => {
    const drv = drivers.find(d => d.id === driverId);
    if (!drv) return;
    await syncDriverProfile({ ...drv, status: 'rejected', rejectionReason: reason });
    addNotification(driverId, 'driver', '❌ لم يتم قبول الحساب', `سبب الرفض: ${reason}`);
  };

  const suspendDriver = async (driverId: string) => {
    const drv = drivers.find(d => d.id === driverId);
    if (!drv) return;
    await syncDriverProfile({ ...drv, status: 'suspended', isOnline: false, isAvailable: false });
  };

  const updateDriverStatus = async (driverId: string, status: DriverApprovalStatus, reason?: string) => {
    if (status === 'approved') {
      await approveDriver(driverId);
    } else if (status === 'rejected') {
      await rejectDriver(driverId, reason || 'الوثائق غير مقبولة');
    } else if (status === 'suspended') {
      await suspendDriver(driverId);
    } else {
      const drv = drivers.find(d => d.id === driverId);
      if (drv) {
        await syncDriverProfile({ ...drv, status });
      }
    }
    setDrivers(prev => prev.map(d => d.id === driverId ? { ...d, status, rejectionReason: reason } : d));
    if (activeDriver.id === driverId) {
      setActiveDriver(prev => ({ ...prev, status, rejectionReason: reason }));
    }
  };

  const updatePricing = async (newPricing: PricingSettings) => {
    const cleanedPricing: PricingSettings = {
      ...DEFAULT_PRICING,
      ...newPricing,
      peakMultiplier: newPricing.peakMultiplier ?? (newPricing as any).peakHourMultiplier ?? 1.0,
      nightMultiplier: newPricing.nightMultiplier ?? 1.0,
    };
    delete (cleanedPricing as any).peakHourMultiplier;
    setPricing(cleanedPricing);
    await saveSystemPricing(cleanedPricing);
    addNotification('admin', 'admin', '⚙️ تم تحديث الأسعار', 'تم حفظ إعدادات التسعير والعمولة في Firebase.');
  };

  const toggleServiceArea = (id: string) => {
    setServiceAreas(prev =>
      prev.map(a => (a.id === id ? { ...a, isActive: !a.isActive } : a))
    );
  };

  const resolveComplaint = async (complaintId: string, notes: string) => {
    setComplaints(prev =>
      prev.map(c =>
        c.id === complaintId
          ? {
              ...c,
              status: 'resolved',
              adminNotes: notes,
              resolvedAt: new Date().toISOString(),
            }
          : c
      )
    );
  };

  const broadcastNotification = (title: string, body: string, targetRole?: UserRole) => {
    addNotification('all', targetRole || 'passenger', title, body, 'system');
  };

  const logout = async () => {
    try {
      await signOutUser();
    } catch (e) {
      console.warn('Error during sign out:', e);
    }
    setCurrentUser(null);
    setActivePassenger(GUEST_PASSENGER);
    setActiveDriver(DEFAULT_PENDING_DRIVER);
    setCurrentRole('passenger');
    localStorage.setItem(STORAGE_PREFIX + 'role', 'passenger');
  };

  const purgeAllTestData = async (): Promise<{ deletedCount: number }> => {
    const result = await clearAllTestDataFromFirestore();
    setRides([]);
    setDrivers([]);
    setPassengers([]);
    setComplaints([]);
    setRatings([]);
    return result;
  };

  return (
    <AppContext.Provider
      value={{
        currentRole,
        setCurrentRole,
        activePassenger,
        setActivePassenger,
        activeDriver,
        setActiveDriver,
        passengers,
        drivers,
        rides,
        pricing,
        serviceAreas,
        complaints,
        notifications,
        ratings,
        isFirebaseConnected,
        currentUser,
        setCurrentUser,
        logout,

        currentPassengerRide,
        requestRide,
        acceptDriverOffer,
        declineDriverOffer,
        updatePassengerOffer,
        cancelRide,
        submitRating,
        submitComplaint,

        currentDriverRide,
        pendingDriverRideRequest,
        toggleDriverOnline,
        submitDriverOffer,
        acceptRide,
        rejectRide,
        advanceRideStatus,
        updateDriverLocation,
        registerDriver,

        approveDriver,
        rejectDriver,
        suspendDriver,
        updateDriverStatus,
        updatePricing,
        toggleServiceArea,
        resolveComplaint,
        broadcastNotification,
        purgeAllTestData,

        isAutoDriverSimulation,
        setIsAutoDriverSimulation,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
