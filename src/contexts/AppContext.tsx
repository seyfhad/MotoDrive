import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  collection,
  doc,
  getDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  getDocs,
  setDoc as fbSetDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db, auth, isFirestoreQuotaExceeded } from '../lib/firebase';

const setDoc = async (reference: any, data: any, options?: any): Promise<void> => {
  if (isFirestoreQuotaExceeded()) return;
  if (options !== undefined) {
    await fbSetDoc(reference, data, options);
  } else {
    await fbSetDoc(reference, data);
  }
};
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
import { pushNotificationService } from '../services/pushNotificationService';
import { findUserAndDriverByPhone } from '../services/authService';
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
  updateDriverStatusInFirestore,
  syncUserProfile,
  getDriverByUserIdOrPhone,
  clearAllTestDataFromFirestore,
  saveSystemPricing,
  sanitizeFirestoreData,
  deleteExpiredRideFromFirestore,
} from '../services/firestoreService';
import { handleFirestoreError, OperationType } from '../services/firestoreErrorHandler';
import { subscribeToAuth, signInQuickGuest, signOutUser } from '../services/authService';
import {
  approveDriverApplication,
  rejectDriverApplication,
} from '../services/driverApplicationsService';
import {
  createRideRequest,
  subscribePendingRideRequests,
  acceptRideRequest,
  completeRideRequest,
  cancelRideRequest,
} from '../services/rideRequestsService';
import {
  hydrateVaultOnStartup,
  loadActiveSessionSecurely,
  saveActiveSessionSecurely,
  saveUserToSecureVault,
  loadRidesFromSecureStorage,
  saveRidesToSecureVault,
  loadRatingsFromSecureStorage,
  saveRatingsToSecureVault,
  loadComplaintsFromSecureStorage,
  saveComplaintsToSecureVault,
  isPendingRideExpired,
  removeRideFromSecureVault,
} from '../services/dataVaultService';
import {
  syncOfflineQueueToFirestore,
  addToOfflineQueue,
} from '../services/dbService';

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
  deleteMyAccount: () => Promise<void>;

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
  pendingDriverRideRequests: Ride[];
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
  suspendPassenger: (passengerId: string, reason?: string) => Promise<void>;
  deletePassenger: (passengerId: string, reason?: string) => Promise<void>;
  deleteDriver: (driverId: string) => Promise<void>;
  updateDriverStatus: (driverId: string, status: DriverApprovalStatus, reason?: string) => Promise<void>;
  updatePricing: (newPricing: PricingSettings) => Promise<void>;
  toggleServiceArea: (id: string) => void;
  resolveComplaint: (complaintId: string, notes: string) => Promise<void>;
  broadcastNotification: (title: string, body: string, targetRole?: UserRole) => void;
  sendInAppNotification: (recipientId: string, recipientRole: UserRole, title: string, body: string) => void;
  markAllNotificationsAsRead: () => void;
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
  const [rides, setRides] = useState<Ride[]>(() => loadRidesFromSecureStorage());
  const [pricing, setPricing] = useState<PricingSettings>(DEFAULT_PRICING);
  const [serviceAreas, setServiceAreas] = useState<ServiceArea[]>(INITIAL_SERVICE_AREAS);
  const [complaints, setComplaints] = useState<Complaint[]>(() => {
    const saved = loadComplaintsFromSecureStorage();
    return saved.length > 0 ? saved : INITIAL_COMPLAINTS;
  });
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [ratings, setRatings] = useState<Rating[]>(() => loadRatingsFromSecureStorage());

  // Simulation switch (default to false for real Firebase mode, toggleable in UI)
  const [isAutoDriverSimulation, setIsAutoDriverSimulation] = useState<boolean>(false);

  // Active profiles (fresh guest state by default)
  const [activePassenger, setActivePassenger] = useState<UserProfile>(() => GUEST_PASSENGER);
  const [activeDriver, setActiveDriver] = useState<DriverProfile>(() => {
    try {
      const saved = localStorage.getItem('motodrive_active_driver');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {}
    return DEFAULT_PENDING_DRIVER;
  });

  // Hydrate and self-heal from IndexedDB Vault on startup
  useEffect(() => {
    hydrateVaultOnStartup().then(({ restoredRidesCount }) => {
      if (restoredRidesCount > 0) {
        setRides(loadRidesFromSecureStorage());
      }
    });
  }, []);

  // Persist rides, complaints, ratings, and activePassenger/activeDriver profiles into multi-layer vault
  useEffect(() => {
    saveRidesToSecureVault(rides);
  }, [rides]);

  useEffect(() => {
    saveComplaintsToSecureVault(complaints);
  }, [complaints]);

  useEffect(() => {
    saveRatingsToSecureVault(ratings);
  }, [ratings]);

  useEffect(() => {
    try {
      if (activePassenger && activePassenger.phone && activePassenger.id !== 'passenger-guest') {
        saveUserToSecureVault(
          activePassenger.phone,
          activePassenger,
          activeDriver?.id !== DEFAULT_PENDING_DRIVER.id ? activeDriver : undefined
        );
      }
    } catch (e) {}
  }, [activePassenger, activeDriver]);

  // Track GPS location watcher
  const geoWatchIdRef = useRef<number | null>(null);

  // Track recent notifications to prevent duplicates and spam
  const lastNotifRef = useRef<{ key: string; time: number }>({ key: '', time: 0 });

  // Notification Helper (Strictly for essential events only: Ride Offers, Driver Arrival, Admin Account Decisions/Messages)
  const addNotification = useCallback((
    recipientId: string,
    recipientRole: UserRole,
    title: string,
    body: string,
    type: AppNotification['type'] = 'ride_update',
    data?: Record<string, any>
  ) => {
    const dedupKey = `${recipientId}:${title}:${body}`;
    const now = Date.now();
    if (lastNotifRef.current.key === dedupKey && now - lastNotifRef.current.time < 8000) {
      return;
    }
    lastNotifRef.current = { key: dedupKey, time: now };

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
    setNotifications(prev => [newNotif, ...prev.slice(0, 29)]);

    // Send Push Notification & Play Audio Chime only for essential events
    let soundType: 'new_ride' | 'driver_arriving' | 'admin_update' | 'general' = 'general';
    if (title.includes('طلب') || title.includes('عرض')) {
      soundType = 'new_ride';
    } else if (title.includes('وصل') || title.includes('أقترب') || title.includes('اقترب')) {
      soundType = 'driver_arriving';
    } else if (title.includes('مسؤول') || title.includes('قبول') || title.includes('رفض') || title.includes('موافقة')) {
      soundType = 'admin_update';
    }

    pushNotificationService.sendPushNotification(title, body, {
      soundType,
      data,
    });
  }, []);

  // --------------------------------------------------------------------------
  // 1. FIREBASE & SUPABASE AUTH & USER PROFILE INITIALIZATION
  // --------------------------------------------------------------------------
  useEffect(() => {
    // 1a. Hydrate cached local user session for instant startup (with automatic backup recovery)
    const hydrateLocalSession = () => {
      try {
        const { user: rawCachedUser, driver: cachedDriver } = loadActiveSessionSecurely();
        if (rawCachedUser) {
          const cachedUser = { ...rawCachedUser };
          if (
            (cachedUser.role === 'admin' || cachedUser.email?.toLowerCase() === 'seyfhad@gmail.com') &&
            (!cachedUser.phone || cachedUser.phone === '0550000000' || cachedUser.phone === '0550123456' || cachedUser.phone === '0662688714')
          ) {
            cachedUser.phone = '0542524728';
          }
          setActivePassenger(cachedUser);
          setCurrentUser({
            uid: cachedUser.id,
            displayName: cachedUser.name,
            email: cachedUser.email,
            photoURL: cachedUser.photoUrl,
          } as any);

          if (cachedDriver) {
            setActiveDriver(cachedDriver);
          }

          if (cachedUser.role === 'admin' || cachedUser.email === 'seyfhad@gmail.com') {
            setCurrentRole('admin');
          } else if (cachedUser.role === 'driver') {
            setCurrentRole('driver');
          } else {
            setCurrentRole('passenger');
          }
        }
      } catch (e) {
        console.warn('Error hydrating cached user session:', e);
      }
    };

    hydrateLocalSession();
    window.addEventListener('motodrive_session_updated', hydrateLocalSession);

    const unsubscribe = subscribeToAuth(async (firebaseUser, userProfile) => {
      if (firebaseUser && userProfile) {
        if (
          (firebaseUser.email?.toLowerCase() === 'seyfhad@gmail.com' ||
            userProfile.email?.toLowerCase() === 'seyfhad@gmail.com' ||
            userProfile.role === 'admin') &&
          (!userProfile.phone || userProfile.phone === '0550000000' || userProfile.phone === '0550123456' || userProfile.phone === '0662688714')
        ) {
          userProfile.phone = '0542524728';
        }
        setCurrentUser(firebaseUser);
        setIsFirebaseConnected(true);
        setActivePassenger(userProfile);

        // Save active session to redundant vault for fast & safe boot
        saveActiveSessionSecurely(userProfile);

        // Auto-restore DriverProfile if user has one in Firestore
        getDriverByUserIdOrPhone(userProfile.id, userProfile.phone, userProfile.email)
          .then((driverProfile) => {
            if (driverProfile) {
              setActiveDriver(driverProfile);
              saveActiveSessionSecurely(userProfile, driverProfile);
            }
          })
          .catch((err) => {
            console.warn('Driver profile auto restore notice:', err);
          });

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
        // Do NOT wipe local phone or passcode-admin session if one is saved in primary or backup vault
        const { user: existingSessionUser } = loadActiveSessionSecurely();
        if (!existingSessionUser) {
          setCurrentUser(null);
          setActivePassenger(GUEST_PASSENGER);
        } else {
          hydrateLocalSession();
        }
      }
    });

    return () => {
      window.removeEventListener('motodrive_session_updated', hydrateLocalSession);
      unsubscribe();
    };
  }, []);

  // --------------------------------------------------------------------------
  // 2. REAL-TIME FIRESTORE SUBSCRIPTIONS (RIDES, OFFERS, DRIVERS, PRICING)
  // --------------------------------------------------------------------------
  useEffect(() => {
    // 2.1 Subscribe to System Pricing (public configuration)
    const pricingPath = 'system_config/pricing';
    const pricingDocRef = doc(db, 'system_config', 'pricing');
    const unsubPricing = onSnapshot(
      pricingDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const rawData = docSnap.data() as Partial<PricingSettings>;
          const sanitized: PricingSettings = {
            ...DEFAULT_PRICING,
            ...rawData,
            baseFare: typeof rawData.baseFare === 'number' ? rawData.baseFare : DEFAULT_PRICING.baseFare,
            minimumFare: typeof rawData.minimumFare === 'number' ? rawData.minimumFare : DEFAULT_PRICING.minimumFare,
            pricePerKm: typeof rawData.pricePerKm === 'number' ? rawData.pricePerKm : DEFAULT_PRICING.pricePerKm,
            pricePerMinute: typeof rawData.pricePerMinute === 'number' ? rawData.pricePerMinute : DEFAULT_PRICING.pricePerMinute,
            peakMultiplier: rawData.peakMultiplier ?? (rawData as any).peakHourMultiplier ?? 1.0,
            nightMultiplier: rawData.nightMultiplier ?? 1.0,
          };
          delete (sanitized as any).peakHourMultiplier;
          setPricing(sanitized);
        } else {
          // Initialize default pricing in Firestore if missing
          saveSystemPricing(DEFAULT_PRICING).catch(
            (err) => {
              console.warn('Initial pricing set notice:', err);
            }
          );
        }
      },
      (err) => {
        if (err?.code !== 'unavailable') {
          console.warn('Pricing snapshot notice:', err.message);
          try {
            handleFirestoreError(err, OperationType.GET, pricingPath);
          } catch (e) {}
        }
      }
    );

    // 2.2 Subscribe to Real-Time Rides, Drivers, Users & Driver Applications
    let unsubRides: (() => void) | undefined;
    let unsubDrivers: (() => void) | undefined;
    let unsubUsers: (() => void) | undefined;
    let unsubApps: (() => void) | undefined;

    if (currentUser) {
      const ridesPath = 'rides';
      const ridesQuery = query(collection(db, 'rides'), orderBy('createdAt', 'desc'));
      unsubRides = onSnapshot(
        ridesQuery,
        async (querySnap) => {
          const fetchedRides: Ride[] = [];
          for (const rideDoc of querySnap.docs) {
            const rideData = { id: rideDoc.id, ...rideDoc.data() } as Ride;
            // Automatically delete unaccepted ride requests older than 08 minutes
            if (isPendingRideExpired(rideData)) {
              deleteExpiredRideFromFirestore(rideData.id).catch(() => {});
              continue;
            }
            if (
              ['searching', 'offers_available', 'accepted', 'driver_arriving'].includes(
                rideData.status
              )
            ) {
              try {
                const offersQuery = query(
                  collection(db, 'rides', rideDoc.id, 'offers'),
                  orderBy('createdAt', 'asc')
                );
                const offersSnap = await getDocs(offersQuery);
                rideData.offers = offersSnap.docs.map(
                  (d) => ({ id: d.id, ...d.data() } as RideOffer)
                );
              } catch (err) {
                console.warn(`Error reading offers for ride ${rideDoc.id}:`, err);
              }
            }
            fetchedRides.push(rideData);
          }
          const uniqueRidesMap = new Map<string, Ride>();
          for (const ride of fetchedRides) {
            if (['searching', 'offers_available'].includes(ride.status)) {
              const key = ride.passengerId;
              if (uniqueRidesMap.has(key)) {
                const existing = uniqueRidesMap.get(key)!;
                const existingTime = new Date(existing.requestedAt || 0).getTime();
                const newTime = new Date(ride.requestedAt || 0).getTime();
                if (newTime >= existingTime) {
                  // Delete the older duplicate pending request
                  deleteExpiredRideFromFirestore(existing.id).catch(() => {});
                  uniqueRidesMap.set(key, ride);
                } else {
                  deleteExpiredRideFromFirestore(ride.id).catch(() => {});
                }
              } else {
                uniqueRidesMap.set(key, ride);
              }
            } else {
              uniqueRidesMap.set(ride.id, ride);
            }
          }
          setRides((prevRides) => {
            // Merge cloud rides with locally persisted completed rides, dropping expired pending rides
            const mergedMap = new Map<string, Ride>();
            for (const localRide of prevRides) {
              if (!localRide || isPendingRideExpired(localRide)) continue;
              const isLocalPending =
                localRide.status === 'searching' || localRide.status === 'offers_available';
              if (!isLocalPending) {
                mergedMap.set(localRide.id, localRide);
              }
            }
            for (const cloudRide of uniqueRidesMap.values()) {
              if (!isPendingRideExpired(cloudRide)) {
                mergedMap.set(cloudRide.id, cloudRide);
              }
            }
            return Array.from(mergedMap.values()).sort(
              (a, b) => new Date(b.requestedAt || 0).getTime() - new Date(a.requestedAt || 0).getTime()
            );
          });
        },
        (err) => {
          if (err?.code !== 'unavailable') {
            console.warn('Rides snapshot notice:', err.message);
            try {
              handleFirestoreError(err, OperationType.GET, ridesPath);
            } catch (e) {}
          }
        }
      );

      const driversPath = 'drivers';
      const driversQuery = query(collection(db, 'drivers'));
      unsubDrivers = onSnapshot(
        driversQuery,
        (querySnap) => {
          const fetchedDrivers: DriverProfile[] = querySnap.docs.map(
            (d) => ({ id: d.id, ...d.data() } as DriverProfile)
          );
          setDrivers(fetchedDrivers);
        },
        (err) => {
          if (err?.code !== 'unavailable') {
            console.warn('Drivers snapshot notice:', err.message);
            try {
              handleFirestoreError(err, OperationType.GET, driversPath);
            } catch (e) {}
          }
        }
      );

      // Subscribe to users collection for real-time passenger sync in Admin
      const usersQuery = query(collection(db, 'users'));
      unsubUsers = onSnapshot(
        usersQuery,
        (querySnap) => {
          if (!querySnap.empty) {
            const fetchedUsers: UserProfile[] = querySnap.docs.map(
              (u) => ({ id: u.id, ...u.data() } as UserProfile)
            );
            setPassengers(fetchedUsers);
          }
        },
        () => {}
      );

      // Subscribe to driver_applications collection so newly registered drivers appear in Admin in real-time
      const appsQuery = query(collection(db, 'driver_applications'));
      unsubApps = onSnapshot(
        appsQuery,
        (querySnap) => {
          if (!querySnap.empty) {
            const appsData = querySnap.docs.map((d) => ({ id: d.id, ...d.data() }));
            setDrivers((prevDrivers) => {
              const updated = [...prevDrivers];
              appsData.forEach((app: any) => {
                const appDriverId = app.driverId || `driver-${app.phone}`;
                const idx = updated.findIndex((d) => d.id === appDriverId || d.phone === app.phone);
                const mappedDriver: DriverProfile = {
                  id: appDriverId,
                  userId: app.userId || appDriverId,
                  name: app.fullName || app.phone,
                  phone: app.phone,
                  email: app.email,
                  wilaya: app.wilaya || 'الجزائر العاصمة',
                  municipality: app.municipality || 'وسط المدينة',
                  photoUrl: app.documents?.selfieUrl || '',
                  rating: 5.0,
                  ratingCount: 1,
                  totalTrips: 0,
                  cancellationCount: 0,
                  isOnline: false,
                  isAvailable: false,
                  status: app.status || 'pending',
                  rejectionReason: app.rejectionReason,
                  location: { lat: 36.7538, lng: 3.0588 },
                  motorcycle: app.motorcycle || {
                    brand: 'SYM',
                    model: 'Symphony',
                    year: 2023,
                    plateNumber: '',
                    color: 'أسود',
                  },
                  documents: app.documents || { status: app.status || 'pending' },
                  createdAt: app.submittedAt || new Date().toISOString(),
                  updatedAt: app.reviewedAt || new Date().toISOString(),
                };

                if (idx >= 0) {
                  updated[idx] = { ...updated[idx], ...mappedDriver };
                } else {
                  updated.push(mappedDriver);
                }
              });
              return updated;
            });
          }
        },
        () => {}
      );
    }

    return () => {
      unsubPricing();
      if (unsubRides) unsubRides();
      if (unsubDrivers) unsubDrivers();
      if (unsubUsers) unsubUsers();
      if (unsubApps) unsubApps();
    };
  }, [currentUser]);

  // Auto-restore registered driver application by phone on app mount
  useEffect(() => {
    const savedPhone =
      localStorage.getItem('motodrive_registered_phone') ||
      localStorage.getItem('motodrive_active_driver_phone');
    if (savedPhone) {
      findUserAndDriverByPhone(savedPhone)
        .then(({ driver }) => {
          if (driver) {
            setActiveDriver((prev) => {
              if (prev.id === driver.id && prev.status === driver.status) return prev;
              return driver;
            });
          }
        })
        .catch(() => {});
    }
  }, []);

  // --------------------------------------------------------------------------
  // REAL-TIME FIRESTORE LISTENER (onSnapshot) FOR CURRENT DRIVER PROFILE
  // Ensures instant update of 'approved' status when approved by Admin without app restart
  // --------------------------------------------------------------------------
  const prevDriverStatusRef = useRef<DriverApprovalStatus | undefined>(activeDriver.status);

  useEffect(() => {
    const uid = currentUser?.uid || activePassenger?.id;
    const currentEmail = currentUser?.email || activePassenger?.email || activeDriver?.email;
    const currentPhone = activePassenger?.phone || activeDriver?.phone;
    const driverId =
      activeDriver?.id && activeDriver.id !== 'driver-pending-1' ? activeDriver.id : null;

    if (!uid && !driverId && !currentEmail && !currentPhone) {
      return;
    }

    const unsubs: (() => void)[] = [];

    const handleDriverSnapshotData = (driverData: DriverProfile) => {
      const prevStatus = prevDriverStatusRef.current;
      prevDriverStatusRef.current = driverData.status;

      // Realtime notification when approved or rejected by admin
      if (prevStatus !== 'approved' && driverData.status === 'approved') {
        addNotification(
          driverData.id,
          'driver',
          '🎉 تهانينا! تمت الموافقة على حسابك',
          'تم قبول ملفك واعتماد وثائقك رسمياً من قبل المسؤول! يمكنك الآن تفعيل وضع (متصل) والبدء في استقبال طلبات الركاب.',
          'admin_update'
        );
      } else if (prevStatus !== 'rejected' && driverData.status === 'rejected') {
        addNotification(
          driverData.id,
          'driver',
          '❌ تم رفض ملف التسجيل',
          driverData.rejectionReason
            ? `سبب الرفض: ${driverData.rejectionReason}`
            : 'يرجى مراجعة وثائقك وإعادة رفعها للمراجعة.',
          'admin_update'
        );
      }

      setActiveDriver((prev) => {
        const merged: DriverProfile = {
          ...prev,
          ...driverData,
          status: driverData.status, // Instant status change to approved/pending/rejected
          motorcycle: {
            ...prev.motorcycle,
            ...(driverData.motorcycle || {}),
          },
          documents: {
            ...prev.documents,
            ...(driverData.documents || {}),
            status:
              driverData.status === 'approved'
                ? 'approved'
                : driverData.documents?.status || prev.documents?.status || 'pending',
          },
        };

        try {
          localStorage.setItem('motodrive_active_driver', JSON.stringify(merged));
        } catch (e) {}

        return merged;
      });

      // Synchronize drivers list in state for Admin & map viewers
      setDrivers((prevDrivers) => {
        const idx = prevDrivers.findIndex(
          (d) => d.id === driverData.id || (driverData.userId && d.userId === driverData.userId)
        );
        if (idx >= 0) {
          const updated = [...prevDrivers];
          updated[idx] = { ...updated[idx], ...driverData };
          return updated;
        }
        return [...prevDrivers, driverData];
      });
    };

    // 1. Direct document listener by driverId (e.g. 'driver-123')
    if (driverId) {
      try {
        const docRef = doc(db, 'drivers', driverId);
        const unsubDoc = onSnapshot(
          docRef,
          (snap) => {
            if (snap.exists()) {
              handleDriverSnapshotData({ id: snap.id, ...snap.data() } as DriverProfile);
            }
          },
          (err) => {
            console.warn('Realtime driver doc onSnapshot notice:', err);
          }
        );
        unsubs.push(unsubDoc);
      } catch (err) {
        console.warn('Failed to listen to driver document:', err);
      }
    }

    // 2. Query listener by userId to catch approvals even before driverId is locally known
    if (uid) {
      try {
        const qUserId = query(collection(db, 'drivers'), where('userId', '==', uid));
        const unsubUser = onSnapshot(
          qUserId,
          (snap) => {
            if (!snap.empty) {
              const first = snap.docs[0];
              handleDriverSnapshotData({ id: first.id, ...first.data() } as DriverProfile);
            }
          },
          (err) => {
            console.warn('Realtime driver userId query onSnapshot notice:', err);
          }
        );
        unsubs.push(unsubUser);
      } catch (err) {
        console.warn('Failed to listen to driver userId query:', err);
      }

      // Also listen to direct doc with prefix `driver-${uid}`
      const prefixedId = `driver-${uid}`;
      if (prefixedId !== driverId) {
        try {
          const unsubPrefixed = onSnapshot(
            doc(db, 'drivers', prefixedId),
            (snap) => {
              if (snap.exists()) {
                handleDriverSnapshotData({ id: snap.id, ...snap.data() } as DriverProfile);
              }
            },
            () => {}
          );
          unsubs.push(unsubPrefixed);
        } catch (e) {}
      }
    }

    // 3. Fallback query by email if available
    if (currentEmail && currentEmail.includes('@')) {
      try {
        const qEmail = query(
          collection(db, 'drivers'),
          where('email', '==', currentEmail.trim().toLowerCase())
        );
        const unsubEmail = onSnapshot(
          qEmail,
          (snap) => {
            if (!snap.empty) {
              const first = snap.docs[0];
              handleDriverSnapshotData({ id: first.id, ...first.data() } as DriverProfile);
            }
          },
          () => {}
        );
        unsubs.push(unsubEmail);
      } catch (e) {}
    }

    // 4. Also listen to driver_applications collection by phone for instant real-time approval/rejection update
    if (currentPhone) {
      try {
        const qAppPhone = query(
          collection(db, 'driver_applications'),
          where('phone', '==', currentPhone.trim())
        );
        const unsubAppPhone = onSnapshot(
          qAppPhone,
          (snap) => {
            if (!snap.empty) {
              const appData = snap.docs[0].data();
              if (appData.status) {
                setActiveDriver((prev) => {
                  if (prev.status === appData.status && prev.rejectionReason === appData.rejectionReason) {
                    return prev;
                  }
                  return {
                    ...prev,
                    status: appData.status,
                    rejectionReason: appData.rejectionReason || prev.rejectionReason,
                  };
                });
              }
            }
          },
          () => {}
        );
        unsubs.push(unsubAppPhone);
      } catch (e) {}
    }

    return () => {
      unsubs.forEach((u) => u());
    };
  }, [
    currentUser?.uid,
    currentUser?.email,
    activePassenger?.id,
    activePassenger?.phone,
    activePassenger?.email,
    activeDriver?.id,
    activeDriver?.userId,
    activeDriver?.email,
    addNotification,
  ]);

  // Sync active driver/passenger references from the broad drivers collection
  useEffect(() => {
    const foundD = drivers.find(
      (d) =>
        d.id === activeDriver.id ||
        (activeDriver.userId && d.userId === activeDriver.userId) ||
        (activeDriver.email &&
          d.email &&
          d.email.toLowerCase() === activeDriver.email.toLowerCase())
    );
    if (foundD && foundD.status !== activeDriver.status) {
      setActiveDriver((prev) => ({
        ...prev,
        ...foundD,
        status: foundD.status,
      }));
    }
  }, [drivers, activeDriver.id, activeDriver.userId, activeDriver.email, activeDriver.status]);

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

  // --------------------------------------------------------------------------
  // AUTO-DELETE UNACCEPTED PENDING RIDE REQUESTS AFTER 08 MINUTES
  // --------------------------------------------------------------------------
  useEffect(() => {
    const cleanupExpiredRides = () => {
      setRides((prevRides) => {
        const expired = prevRides.filter((r) => isPendingRideExpired(r));
        if (expired.length === 0) return prevRides;

        for (const expRide of expired) {
          deleteExpiredRideFromFirestore(expRide.id).catch(() => {});
          removeRideFromSecureVault(expRide.id).catch(() => {});
          if (
            expRide.passengerId === activePassenger.id ||
            (activePassenger.phone &&
              expRide.passengerPhone &&
              expRide.passengerPhone.trim().replace(/\s+/g, '') ===
                activePassenger.phone.trim().replace(/\s+/g, ''))
          ) {
            addNotification(
              activePassenger.id,
              'passenger',
              '⏱️ انتهت مهلة الطلب (08 دقائق)',
              'لم يتم قبول الطلب من أي سائق خلال 8 دقائق، لذلك تم حذفه تلقائياً. يمكنك طلب رحلة جديدة الآن.'
            );
          }
        }

        return prevRides.filter((r) => !isPendingRideExpired(r));
      });
    };

    cleanupExpiredRides();
    const interval = setInterval(cleanupExpiredRides, 5000);
    return () => clearInterval(interval);
  }, [activePassenger.id, activePassenger.phone, addNotification]);

  // Derive Current Active Rides (matched by passengerId or passengerPhone so restored phone accounts always resume active trips)
  const currentPassengerRide = rides.find(
    r =>
      !isPendingRideExpired(r) &&
      (r.passengerId === activePassenger.id ||
        (activePassenger.phone &&
          r.passengerPhone &&
          r.passengerPhone.trim().replace(/\s+/g, '') === activePassenger.phone.trim().replace(/\s+/g, ''))) &&
      !['completed', 'cancelled_by_passenger', 'cancelled_by_driver', 'expired'].includes(r.status)
  ) || null;

  const currentDriverRide = rides.find(
    r =>
      r.driverId === activeDriver.id &&
      !['completed', 'cancelled_by_passenger', 'cancelled_by_driver', 'expired'].includes(r.status)
  ) || null;

  // Driver incoming requests with Geofencing / Radius Matching (Yassir / inDrive style: prioritizes requests within 5 km road distance, sorted closest first)
  const pendingDriverRideRequests = (activeDriver.isOnline && activeDriver.status === 'approved' && !currentDriverRide)
    ? rides
        .filter(r => {
          if (isPendingRideExpired(r)) return false;
          if (r.status !== 'searching' && r.status !== 'offers_available') return false;
          if ((r.offers || []).some(o => o.driverId === activeDriver.id && o.status === 'declined')) return false;
          const distToPickup = calculateDistanceKm(activeDriver.location, r.pickup);
          // Match within 5 km primary radius (or up to 25 km if driver is in the same wilaya/suburb)
          const isDefaultCoords =
            Math.abs(activeDriver.location.lat - 36.7538) < 0.01 &&
            Math.abs(activeDriver.location.lng - 3.0588) < 0.01;
          return distToPickup <= 5 || distToPickup <= 25 || isDefaultCoords;
        })
        .sort((a, b) => {
          const distA = calculateDistanceKm(activeDriver.location, a.pickup);
          const distB = calculateDistanceKm(activeDriver.location, b.pickup);
          return distA - distB;
        })
    : [];

  const pendingDriverRideRequest = pendingDriverRideRequests[0] || null;

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
    if (currentPassengerRide && ['searching', 'offers_available'].includes(currentPassengerRide.status)) {
      if (passengerOfferedPrice && passengerOfferedPrice > 0) {
        const res = await updatePassengerOffer(currentPassengerRide.id, passengerOfferedPrice);
        return { success: res.success, rideId: currentPassengerRide.id, error: res.error };
      }
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

    const commission = Math.round((offeredPrice * (pricing.platformCommissionPercent ?? 0)) / 100);
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

      const newLocalRide: Ride = {
        ...ridePayload,
        id: rideDocId,
        offers: [],
      };
      setRides((prev) => [newLocalRide, ...prev.filter((r) => r.id !== rideDocId)]);

      // Save to Firestore collection 'ride_requests' with status: 'pending' (Real-time queue)
      try {
        await createRideRequest({
          id: rideDocId,
          passengerId: activePassenger.id,
          passengerName: activePassenger.name,
          passengerPhone: activePassenger.phone,
          passengerPhoto: activePassenger.photoUrl,
          pickup,
          destination,
          fare: offeredPrice,
          distanceKm,
          estimatedDurationMins: estimatedDuration,
        });
      } catch (reqErr) {
        console.warn('Notice writing to ride_requests:', reqErr);
      }

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

    const driver = drivers.find(d => d.id === offer.driverId) || activeDriver;
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
      setRides(prev =>
        prev.map(r => {
          if (r.id !== rideId) return r;
          return {
            ...r,
            status: 'accepted',
            selectedDriverId: driver.id,
            driverId: driver.id,
            driverName: driver.name,
            driverPhone: driver.phone,
            driverPhoto: driver.photoUrl,
            driverRating: driver.rating ?? 5.0,
            driverMotorcycle: driver.motorcycle,
            driverLocation: offer.driverLocation || driver.location,
            finalPrice: offer.offeredPrice,
            acceptedAt: new Date().toISOString(),
            offers: (r.offers || []).map(o =>
              o.id === offerId ? { ...o, status: 'accepted' as const } : o
            ),
          };
        })
      );

      // Update status to accepted in ride_requests collection
      acceptRideRequest(rideId, driver).catch(e => console.warn('Notice updating ride_requests accepted status:', e));

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
      setRides(prev =>
        prev.map(r =>
          r.id === rideId
            ? { ...r, passengerOfferedPrice: newOfferedPrice, estimatedPrice: newOfferedPrice }
            : r
        )
      );
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'تعذر تحديث السعر' };
    }
  };

  const cancelRide = async (rideId: string, reason: string, cancelledBy: 'passenger' | 'driver') => {
    const target = rides.find(r => r.id === rideId);
    const isStillPending = target && (target.status === 'searching' || target.status === 'offers_available');

    if (isStillPending) {
      setRides(prev => prev.filter(r => r.id !== rideId));
      try {
        await deleteExpiredRideFromFirestore(rideId);
      } catch (e) {
        console.warn('Error deleting pending ride in Firestore:', e);
      }
      return;
    }

    const newStatus = cancelledBy === 'passenger' ? 'cancelled_by_passenger' : 'cancelled_by_driver';
    setRides(prev =>
      prev.map(r =>
        r.id === rideId ? { ...r, status: newStatus, cancellationReason: reason } : r
      )
    );
    try {
      await cancelRideInFirestore(rideId, reason, cancelledBy);
      await cancelRideRequest(rideId);
    } catch (e) {
      console.warn('Error cancelling ride in Firestore:', e);
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
    const driver = drivers.find(d => d.id === driverId) || activeDriver;
    if (!driver) return { success: false, error: 'السائق غير مسجل' };
    if (driver.status !== 'approved') return { success: false, error: 'حساب السائق غير معتمد' };
    if (!driver.isOnline) return { success: false, error: 'يجب أن تكون في وضع Online لتقديم العروض' };

    const targetRide = rides.find(r => r.id === rideId);
    if (!targetRide || !['searching', 'offers_available'].includes(targetRide.status)) {
      return { success: false, error: 'الرحلة لم تعد متاحة لتقديم العروض' };
    }

    const distToPickup = calculateDistanceKm(driver.location, targetRide.pickup);
    const etaMins = Math.max(1, Math.round(distToPickup * 1.8));
    const isCounter = offeredPrice !== targetRide.passengerOfferedPrice;
    const diff = offeredPrice - targetRide.passengerOfferedPrice;

    const offerData: Omit<RideOffer, 'id' | 'createdAt'> = {
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
    };

    try {
      const offerId = await submitDriverOfferInFirestore(rideId, offerData);

      setRides(prev =>
        prev.map(r => {
          if (r.id !== rideId) return r;
          const newOffer: RideOffer = {
            ...offerData,
            id: offerId,
            createdAt: new Date().toISOString(),
          };
          return {
            ...r,
            status: 'offers_available',
            offers: [...(r.offers || []), newOffer],
          };
        })
      );

      addNotification(
        targetRide.passengerId,
        'passenger',
        '🏍️ عرض جديد من سائق دراجة!',
        `${driver.name} يقترح ${offeredPrice} د.ج على دراجة ${driver.motorcycle.brand}`
      );

      return { success: true };
    } catch (err: any) {
      console.warn('Error submitting driver offer in Firestore:', err);
      return { success: false, error: err.message || 'تعذر إرسال العرض' };
    }
  };

  const acceptRide = async (rideId: string, driverId: string): Promise<{ success: boolean; error?: string }> => {
    const ride = rides.find(r => r.id === rideId);
    if (!ride) return { success: false, error: 'الرحلة غير موجودة' };
    const driver = drivers.find(d => d.id === driverId) || activeDriver;
    if (!driver) return { success: false, error: 'السائق غير مسجل' };
    if (driver.status !== 'approved') return { success: false, error: 'حساب السائق غير معتمد' };
    if (!driver.isOnline) return { success: false, error: 'يجب أن تكون في وضع Online لقبول الرحلات' };

    const passengerPrice = ride.passengerOfferedPrice || ride.estimatedPrice;
    const directOfferId = `direct-${driver.id}-${Date.now()}`;

    const txResult = await acceptDriverOfferTransaction(
      rideId,
      directOfferId,
      driver,
      passengerPrice,
      pricing.platformCommissionPercent
    );

    if (txResult.success) {
      const distToPickup = calculateDistanceKm(driver.location, ride.pickup);
      const etaMins = Math.max(1, Math.round(distToPickup * 1.8));
      const acceptedOffer: RideOffer = {
        id: directOfferId,
        rideId,
        driverId: driver.id,
        driverName: driver.name,
        driverPhone: driver.phone,
        driverPhoto: driver.photoUrl,
        driverRating: driver.rating ?? 5.0,
        driverTripsCount: driver.totalTrips ?? 0,
        driverMotorcycle: driver.motorcycle,
        driverLocation: driver.location,
        distanceToPickupKm: distToPickup,
        etaMinutes: etaMins,
        offeredPrice: passengerPrice,
        isCounterOffer: false,
        passengerOfferedPrice: passengerPrice,
        priceDifference: 0,
        status: 'accepted',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 60000).toISOString(),
      };

      setRides(prev =>
        prev.map(r => {
          if (r.id !== rideId) return r;
          return {
            ...r,
            status: 'accepted',
            selectedDriverId: driver.id,
            driverId: driver.id,
            driverName: driver.name,
            driverPhone: driver.phone,
            driverPhoto: driver.photoUrl,
            driverRating: driver.rating ?? 5.0,
            driverMotorcycle: driver.motorcycle,
            driverLocation: driver.location,
            finalPrice: passengerPrice,
            acceptedAt: new Date().toISOString(),
            offers: [...(r.offers || []), acceptedOffer],
          };
        })
      );

      acceptRideRequest(rideId, driver).catch(e => console.warn('Notice accepting in ride_requests:', e));

      addNotification(
        ride.passengerId,
        'passenger',
        '🎉 السائق قبل طلبك بالسعر المقترح!',
        `السائق ${driver.name} قبل رحلتك بسعر ${passengerPrice} د.ج وهو في الطريق إليك الآن.`
      );

      return { success: true };
    }

    // Fallback to offer submission if transaction falls back
    return submitDriverOffer(rideId, driverId, passengerPrice);
  };

  const toggleDriverOnline = async (driverId: string, isOnline: boolean): Promise<{ success: boolean; error?: string }> => {
    const driver = drivers.find(d => d.id === driverId) || activeDriver;
    if (!driver) return { success: false, error: 'السائق غير موجود' };

    if (isOnline && driver.status !== 'approved') {
      return {
        success: false,
        error: 'لا يمكنك تفعيل وضع Online حتى تتم مراجعة وثائقك واعتماد حسابك من المسؤول.',
      };
    }

    try {
      await updateFirestoreDriverOnlineStatus(driverId, isOnline, isOnline);
      setActiveDriver(prev => (prev.id === driverId ? { ...prev, isOnline, isAvailable: isOnline } : prev));
      setDrivers(prev =>
        prev.map(d => (d.id === driverId ? { ...d, isOnline, isAvailable: isOnline } : d))
      );
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'تعذر تغيير حالة الاتصال' };
    }
  };

  const rejectRide = (_rideId: string, _driverId: string) => {
    // Silent skip without noisy notification
  };

  const advanceRideStatus = async (rideId: string) => {
    const targetRide = rides.find(r => r.id === rideId);
    if (!targetRide) return;

    let nextStatus: RideStatus = targetRide.status;
    const extraData: Partial<Ride> = {};

    if (targetRide.status === 'accepted' || targetRide.status === 'driver_arriving') {
      nextStatus = 'driver_arrived';
      extraData.arrivedAt = new Date().toISOString();
      addNotification(targetRide.passengerId, 'passenger', '✨ السائق وصل!', 'السائق بانتظارك في موقع الانطلاق.');
    } else if (targetRide.status === 'driver_arrived') {
      nextStatus = 'trip_started';
      extraData.startedAt = new Date().toISOString();
    } else if (targetRide.status === 'trip_started') {
      nextStatus = 'completed';
      extraData.completedAt = new Date().toISOString();
      extraData.paymentStatus = 'paid';
      extraData.finalPrice = targetRide.finalPrice || targetRide.estimatedPrice;
      // Delete from ride_requests queue and archive to completed rides in Firestore
      completeRideRequest(rideId).catch(e => console.warn('Notice completing ride_requests doc:', e));
    }

    setRides(prev =>
      prev.map(r => (r.id === rideId ? { ...r, status: nextStatus, ...extraData } : r))
    );

    try {
      await advanceRideStatusInFirestore(rideId, nextStatus, extraData);
    } catch (e) {
      console.warn('Error advancing ride status in Firestore:', e);
    }
  };

  const updateDriverLocation = (driverId: string, location: Coordinates, heading?: number) => {
    setActiveDriver(prev => (prev.id === driverId ? { ...prev, location, heading } : prev));
    setDrivers(prev =>
      prev.map(d => (d.id === driverId ? { ...d, location, heading } : d))
    );
    updateFirestoreDriverLocation(driverId, location.lat, location.lng, heading).catch(() => {});
  };

  const registerDriver = async (driverData: Partial<DriverProfile>): Promise<{ success: boolean; driverId: string }> => {
    const newDriverId = 'driver-' + Math.random().toString(36).substring(2, 8);
    const newDriver: DriverProfile = {
      id: newDriverId,
      userId: currentUser?.uid || ('user-' + newDriverId),
      name: driverData.name || 'سائق جديد',
      phone: driverData.phone || '',
      email: driverData.email,
      photoUrl: driverData.photoUrl || '/assets/images/driver_logo.jpg',
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
      passengerName: ride.passengerName || activePassenger.name,
      rating: stars,
      tags,
      comment,
    });

    // Update local rides state
    setRides(prev =>
      prev.map(r =>
        r.id === rideId
          ? {
              ...r,
              ratingStars: stars,
              ratingComment: comment,
              ratingTags: tags,
              ratedAt: new Date().toISOString(),
            }
          : r
      )
    );

    // Update local drivers state
    setDrivers(prev =>
      prev.map(d => {
        if (d.id === ride.driverId) {
          const currentCount = d.ratingCount || 0;
          const currentAvg = d.rating || 5.0;
          const newCount = currentCount + 1;
          const newAvg = Number(((currentAvg * currentCount + stars) / newCount).toFixed(1));
          return {
            ...d,
            rating: newAvg,
            ratingCount: newCount,
          };
        }
        return d;
      })
    );
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
    // 1. Permanently delete verification files from Firebase Storage & update driver_applications doc
    try {
      await approveDriverApplication(`app_${driverId}`, driverId, currentUser?.uid || 'admin');
    } catch (appErr) {
      console.warn('Notice in approveDriverApplication:', appErr);
    }

    await updateDriverStatusInFirestore(driverId, 'approved');
    const drv = drivers.find(d => d.id === driverId);
    if (drv) {
      await syncDriverProfile({ ...drv, status: 'approved' });
    }
  };

  const rejectDriver = async (driverId: string, reason: string) => {
    // 1. Permanently delete verification files from Firebase Storage & update driver_applications doc
    try {
      await rejectDriverApplication(`app_${driverId}`, driverId, reason, currentUser?.uid || 'admin');
    } catch (appErr) {
      console.warn('Notice in rejectDriverApplication:', appErr);
    }

    await updateDriverStatusInFirestore(driverId, 'rejected', reason);
    const drv = drivers.find(d => d.id === driverId);
    if (drv) {
      await syncDriverProfile({ ...drv, status: 'rejected', rejectionReason: reason });
    }
  };

  const suspendDriver = async (driverId: string) => {
    await updateDriverStatusInFirestore(driverId, 'suspended');
    const drv = drivers.find(d => d.id === driverId);
    if (drv) {
      await syncDriverProfile({ ...drv, status: 'suspended', isOnline: false, isAvailable: false });
    }
  };

  const suspendPassenger = async (passengerId: string, reason: string = 'خالف شروط الاستخدام') => {
    setPassengers(prev =>
      prev.map(p =>
        p.id === passengerId
          ? { ...p, status: p.status === 'suspended' ? 'active' : 'suspended', suspensionReason: reason }
          : p
      )
    );
    try {
      const userRef = doc(db, 'users', passengerId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const currentStatus = userSnap.data().status;
        const newStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
        await setDoc(userRef, { status: newStatus, suspensionReason: reason, updatedAt: serverTimestamp() }, { merge: true });
      }
    } catch (e) {
      console.warn('Error suspending passenger in Firestore:', e);
    }
    addNotification(passengerId, 'passenger', '⚠️ تحديث حالة حسابك', `تم تعليق حسابك. السبب: ${reason}`);
  };

  const deletePassenger = async (passengerId: string, reason: string = 'قرار من المسؤول') => {
    setPassengers(prev => prev.filter(p => p.id !== passengerId));
    try {
      await setDoc(doc(db, 'users', passengerId), { status: 'deleted', deletionReason: reason, deletedAt: serverTimestamp() }, { merge: true });
    } catch (e) {
      console.warn('Error deleting passenger:', e);
    }
    addNotification(passengerId, 'passenger', '❌ حذف الحساب', `تم حذف حسابك نهائياً من منصة MotoDrive. السبب: ${reason}`);
  };

  const deleteDriver = async (driverId: string) => {
    setDrivers(prev => prev.filter(d => d.id !== driverId));
    try {
      await setDoc(doc(db, 'drivers', driverId), { status: 'deleted', deletedAt: serverTimestamp() }, { merge: true });
    } catch (e) {
      console.warn('Error deleting driver:', e);
    }
  };

  const updateDriverStatus = async (driverId: string, status: DriverApprovalStatus, reason?: string) => {
    await updateDriverStatusInFirestore(driverId, status, reason);
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
    setDrivers(prev => prev.map(d => d.id === driverId || d.userId === driverId ? { ...d, status, rejectionReason: reason } : d));
    if (activeDriver.id === driverId || activeDriver.userId === driverId) {
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

  const sendInAppNotification = (recipientId: string, recipientRole: UserRole, title: string, body: string) => {
    addNotification(recipientId, recipientRole, title, body, 'system');
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
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

  // Google Play Account Deletion Policy Mandatory Handler
  const deleteMyAccount = async () => {
    const uid = activePassenger?.id;
    const phone = activePassenger?.phone || activeDriver?.phone;
    const drvId = activeDriver?.id;

    try {
      if (uid && uid !== 'passenger-guest') {
        await addToOfflineQueue('users', 'delete', { deletedAt: new Date().toISOString() }, uid);
      }
      if (drvId && drvId !== 'driver-pending-1') {
        await addToOfflineQueue('drivers', 'delete', { deletedAt: new Date().toISOString() }, drvId);
      }
      await syncOfflineQueueToFirestore();
    } catch (e) {
      console.warn('Notice queuing account deletion:', e);
    }

    // Purge user entry from phone directory & local storage
    try {
      if (phone) {
        const cleanPhone = phone.replace(/\D/g, '');
        ['motodrive_phone_directory', 'motodrive_phone_directory_backup_v1'].forEach((k) => {
          const raw = localStorage.getItem(k);
          if (raw) {
            const parsed = JSON.parse(raw);
            delete parsed[cleanPhone];
            delete parsed[phone];
            localStorage.setItem(k, JSON.stringify(parsed));
          }
        });
      }
      localStorage.removeItem('motodrive_user_session');
      localStorage.removeItem('motodrive_user_session_backup_v1');
      localStorage.removeItem('motodrive_active_driver');
      localStorage.removeItem('motodrive_active_driver_backup_v1');
      localStorage.removeItem('motodrive_registered_phone');
      localStorage.removeItem('motodrive_active_driver_phone');
    } catch {}

    await logout();
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
        deleteMyAccount,

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
        pendingDriverRideRequests,
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
        suspendPassenger,
        deletePassenger,
        deleteDriver,
        updateDriverStatus,
        updatePricing,
        toggleServiceArea,
        resolveComplaint,
        broadcastNotification,
        sendInAppNotification,
        markAllNotificationsAsRead,
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
