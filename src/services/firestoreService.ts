import { geohashForLocation, geohashQueryBounds, distanceBetween } from 'geofire-common';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  addDoc,
  query,
  where,
  orderBy,
  startAt,
  endAt,
  runTransaction,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { Coordinates, DriverProfile, Ride, RideOffer, PricingSettings, Rating, Complaint, UserProfile } from '../types';
import { handleFirestoreError, OperationType } from './firestoreErrorHandler';

// Helper to recursively remove all undefined properties to prevent Firestore crashes
export const sanitizeFirestoreData = <T extends Record<string, any>>(obj: T): T => {
  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) {
      continue;
    }
    if (value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Timestamp) && !(value instanceof Date)) {
      result[key] = sanitizeFirestoreData(value);
    } else {
      result[key] = value;
    }
  }
  return result;
};

// ============================================================================
// SYSTEM PRICING & CONFIGURATION SERVICE
// ============================================================================

export const getSystemPricing = async (): Promise<PricingSettings | null> => {
  try {
    const docRef = doc(db, 'system_config', 'pricing');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as PricingSettings;
    }
    return null;
  } catch (err) {
    console.warn('Error reading system pricing:', err);
    return null;
  }
};

export const saveSystemPricing = async (pricing: PricingSettings): Promise<void> => {
  const docRef = doc(db, 'system_config', 'pricing');
  await setDoc(docRef, sanitizeFirestoreData({ ...pricing, updatedAt: serverTimestamp() }), { merge: true });
};

// ============================================================================
// USER PROFILES SERVICE
// ============================================================================

export const syncUserProfile = async (user: Partial<UserProfile> & { id: string }): Promise<void> => {
  const userRef = doc(db, 'users', user.id);
  await setDoc(userRef, sanitizeFirestoreData({
    ...user,
    updatedAt: serverTimestamp(),
  }), { merge: true });
};

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  const userRef = doc(db, 'users', userId);
  const snap = await getDoc(userRef);
  return snap.exists() ? (snap.data() as UserProfile) : null;
};

// ============================================================================
// DRIVER PROFILE & LIVE GPS TELEMETRY
// ============================================================================

export const syncDriverProfile = async (driver: DriverProfile): Promise<void> => {
  const driverRef = doc(db, 'drivers', driver.id);
  const gh = geohashForLocation([driver.location.lat, driver.location.lng]);

  await setDoc(driverRef, sanitizeFirestoreData({
    ...driver,
    geohash: gh,
    updatedAt: serverTimestamp(),
  }), { merge: true });
};

export const updateDriverLocation = async (
  driverId: string,
  lat: number,
  lng: number,
  heading?: number,
  speed?: number
): Promise<void> => {
  const driverRef = doc(db, 'drivers', driverId);
  const gh = geohashForLocation([lat, lng]);

  await updateDoc(driverRef, {
    'location.lat': lat,
    'location.lng': lng,
    'location.heading': heading || 0,
    'location.speed': speed || 0,
    geohash: gh,
    lastLocationUpdate: serverTimestamp(),
  });
};

export const updateFirestoreDriverLocation = updateDriverLocation;

export const updateDriverOnlineStatus = async (
  driverId: string,
  isOnline: boolean,
  isAvailable: boolean
): Promise<void> => {
  const driverRef = doc(db, 'drivers', driverId);
  await updateDoc(driverRef, {
    isOnline,
    isAvailable,
    updatedAt: serverTimestamp(),
  });
};

// Query real nearby available drivers using Geofire Bounding Boxes
export const getNearbyDrivers = async (
  center: Coordinates,
  radiusInKm: number = 5
): Promise<DriverProfile[]> => {
  const centerCoord: [number, number] = [center.lat, center.lng];
  const radiusInM = radiusInKm * 1000;
  const bounds = geohashQueryBounds(centerCoord, radiusInM);
  const matchingDrivers: DriverProfile[] = [];

  for (const b of bounds) {
    const q = query(
      collection(db, 'drivers'),
      where('isOnline', '==', true),
      where('isAvailable', '==', true),
      orderBy('geohash'),
      startAt(b[0]),
      endAt(b[1])
    );

    const snapshots = await getDocs(q);
    for (const d of snapshots.docs) {
      const data = d.data() as DriverProfile;
      if (data.location) {
        const distKm = distanceBetween([data.location.lat, data.location.lng], centerCoord);
        if (distKm <= radiusInKm) {
          matchingDrivers.push({ ...data, id: d.id });
        }
      }
    }
  }

  return matchingDrivers;
};

// ============================================================================
// RIDES & FAIR FARE NEGOTIATION SERVICE
// ============================================================================

export const createRideInFirestore = async (
  rideData: Omit<Ride, 'id' | 'createdAt'>
): Promise<string> => {
  const path = 'rides';
  try {
    const ridesCol = collection(db, path);
    const pickupGh = geohashForLocation([rideData.pickup.lat, rideData.pickup.lng]);
    const destGh = geohashForLocation([rideData.destination.lat, rideData.destination.lng]);

    const cleanPayload = sanitizeFirestoreData({
      ...rideData,
      pickupGeohash: pickupGh,
      destinationGeohash: destGh,
      status: 'searching',
      createdAt: serverTimestamp(),
      expiresAt: Timestamp.fromMillis(Date.now() + 5 * 60 * 1000), // 5 mins expiration
    });

    const docRef = await addDoc(ridesCol, cleanPayload);
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
};

export const updatePassengerOfferInFirestore = async (
  rideId: string,
  newPrice: number
): Promise<void> => {
  const rideRef = doc(db, 'rides', rideId);
  await updateDoc(rideRef, sanitizeFirestoreData({
    passengerOfferedPrice: newPrice,
    estimatedPrice: newPrice,
    updatedAt: serverTimestamp(),
  }));
};

export const cancelRideInFirestore = async (
  rideId: string,
  reason: string,
  cancelledBy: 'passenger' | 'driver' | 'system'
): Promise<void> => {
  const rideRef = doc(db, 'rides', rideId);
  await updateDoc(rideRef, sanitizeFirestoreData({
    status: cancelledBy === 'passenger' ? 'cancelled_by_passenger' : 'cancelled_by_driver',
    cancellationReason: reason,
    cancelledAt: serverTimestamp(),
  }));
};

// ============================================================================
// DRIVER OFFERS & COUNTEROFFERS (SUBCOLLECTION)
// ============================================================================

export const submitDriverOfferInFirestore = async (
  rideId: string,
  offer: Omit<RideOffer, 'id' | 'createdAt'>
): Promise<string> => {
  const offersCol = collection(db, 'rides', rideId, 'offers');
  const cleanOffer = sanitizeFirestoreData({
    ...offer,
    status: 'pending',
    createdAt: serverTimestamp(),
  });
  const docRef = await addDoc(offersCol, cleanOffer);

  // Also update ride status to indicate offers are available
  const rideRef = doc(db, 'rides', rideId);
  await updateDoc(rideRef, {
    status: 'offers_available',
  });

  return docRef.id;
};

// CRITICAL: Transaction-safe driver selection to prevent Race Conditions
export const acceptDriverOfferTransaction = async (
  rideId: string,
  offerId: string,
  driver: DriverProfile,
  offeredPrice: number,
  commissionPercent: number = 15
): Promise<{ success: boolean; error?: string }> => {
  const rideRef = doc(db, 'rides', rideId);
  const offerRef = doc(db, 'rides', rideId, 'offers', offerId);
  const driverRef = doc(db, 'drivers', driver.id);

  try {
    await runTransaction(db, async (transaction) => {
      const rideSnap = await transaction.get(rideRef);
      if (!rideSnap.exists()) {
        throw new Error('الرحلة غير موجودة');
      }

      const rideData = rideSnap.data() as Ride;
      if (rideData.status !== 'searching' && rideData.status !== 'offers_available') {
        throw new Error('الرحلة محجوزة مسبقاً أو غير متاحة للتأكيد');
      }

      const commission = Math.round((offeredPrice * commissionPercent) / 100);
      const driverEarning = offeredPrice - commission;

      // 1. Lock ride to the winning driver
      const rideUpdatePayload = sanitizeFirestoreData({
        status: 'accepted',
        selectedDriverId: driver.id,
        driverId: driver.id,
        driverName: driver.name,
        driverPhone: driver.phone,
        driverPhoto: driver.photoUrl || null,
        driverRating: driver.rating ?? 5.0,
        driverMotorcycle: driver.motorcycle,
        finalPrice: offeredPrice,
        platformCommission: commission,
        driverEarning: driverEarning,
        acceptedAt: serverTimestamp(),
      });
      transaction.update(rideRef, rideUpdatePayload);

      // 2. Mark this specific offer as accepted
      transaction.update(offerRef, {
        status: 'accepted',
        acceptedAt: serverTimestamp(),
      });

      // 3. Mark the driver as busy / not available
      transaction.update(driverRef, {
        isAvailable: false,
        currentRideId: rideId,
        updatedAt: serverTimestamp(),
      });
    });

    return { success: true };
  } catch (err: any) {
    console.error('Error during driver selection transaction:', err);
    return { success: false, error: err?.message || 'فشلت المعاملة' };
  }
};

export const advanceRideStatusInFirestore = async (
  rideId: string,
  newStatus: Ride['status'],
  extraData?: Partial<Ride>
): Promise<void> => {
  const rideRef = doc(db, 'rides', rideId);
  const updates: Record<string, any> = sanitizeFirestoreData({
    status: newStatus,
    updatedAt: serverTimestamp(),
    ...(extraData || {}),
  });

  if (newStatus === 'trip_started') updates.startedAt = serverTimestamp();
  if (newStatus === 'completed') updates.completedAt = serverTimestamp();

  await updateDoc(rideRef, updates);
};

// ============================================================================
// RATINGS & COMPLAINTS
// ============================================================================

export const submitRatingToFirestore = async (
  rating: Omit<Rating, 'id' | 'createdAt'>
): Promise<string> => {
  const ratingCol = collection(db, 'ratings');
  const cleanRating = sanitizeFirestoreData({
    ...rating,
    createdAt: serverTimestamp(),
  });
  const docRef = await addDoc(ratingCol, cleanRating);
  return docRef.id;
};

export const submitComplaintToFirestore = async (
  complaint: Omit<Complaint, 'id' | 'createdAt'>
): Promise<string> => {
  const compCol = collection(db, 'complaints');
  const cleanComplaint = sanitizeFirestoreData({
    ...complaint,
    status: 'pending',
    createdAt: serverTimestamp(),
  });
  const docRef = await addDoc(compCol, cleanComplaint);
  return docRef.id;
};

// ============================================================================
// STORAGE UPLOAD (DOCUMENTS & PHOTOS)
// ============================================================================

export const uploadDriverDocument = async (
  driverId: string,
  docType: string,
  file: File
): Promise<string> => {
  const storageRef = ref(storage, `driver_documents/${driverId}/${docType}_${Date.now()}_${file.name}`);
  const snap = await uploadBytes(storageRef, file);
  return getDownloadURL(snap.ref);
};
