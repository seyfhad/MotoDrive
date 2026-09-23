import { geohashForLocation, geohashQueryBounds, distanceBetween } from 'geofire-common';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  addDoc,
  deleteDoc,
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
import { Coordinates, DriverProfile, Ride, RideOffer, PricingSettings, Rating, Complaint, UserProfile, DriverApprovalStatus } from '../types';
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

export const getDriverByUserIdOrPhone = async (
  userId: string,
  phone?: string,
  email?: string
): Promise<DriverProfile | null> => {
  try {
    const docRef = doc(db, 'drivers', 'driver-' + userId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as DriverProfile;
    }

    const qUser = query(collection(db, 'drivers'), where('userId', '==', userId));
    const snapUser = await getDocs(qUser);
    if (!snapUser.empty) {
      return { id: snapUser.docs[0].id, ...snapUser.docs[0].data() } as DriverProfile;
    }

    if (phone) {
      const qPhone = query(collection(db, 'drivers'), where('phone', '==', phone.trim()));
      const snapPhone = await getDocs(qPhone);
      if (!snapPhone.empty) {
        return { id: snapPhone.docs[0].id, ...snapPhone.docs[0].data() } as DriverProfile;
      }
    }

    if (email) {
      const qEmail = query(collection(db, 'drivers'), where('email', '==', email.trim().toLowerCase()));
      const snapEmail = await getDocs(qEmail);
      if (!snapEmail.empty) {
        return { id: snapEmail.docs[0].id, ...snapEmail.docs[0].data() } as DriverProfile;
      }
    }

    return null;
  } catch (err) {
    console.warn('Error fetching driver profile:', err);
    return null;
  }
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

export const updateDriverStatusInFirestore = async (
  driverId: string,
  status: DriverApprovalStatus,
  rejectionReason?: string
): Promise<void> => {
  try {
    const updateData: any = {
      status,
      updatedAt: serverTimestamp(),
    };
    if (rejectionReason !== undefined) {
      updateData.rejectionReason = rejectionReason;
    }

    const cleanUserId = driverId.replace(/^driver-/, '');

    // 1. Direct doc by driverId
    const docRef1 = doc(db, 'drivers', driverId);
    const snap1 = await getDoc(docRef1);
    if (snap1.exists()) {
      await setDoc(docRef1, updateData, { merge: true });
      return;
    }

    // 2. Doc with 'driver-' prefix
    const prefixedId = driverId.startsWith('driver-') ? driverId : `driver-${driverId}`;
    const docRef2 = doc(db, 'drivers', prefixedId);
    const snap2 = await getDoc(docRef2);
    if (snap2.exists()) {
      await setDoc(docRef2, updateData, { merge: true });
      return;
    }

    // 3. Query by 'userId'
    const qUserId = query(collection(db, 'drivers'), where('userId', '==', cleanUserId));
    const snapUserId = await getDocs(qUserId);
    if (!snapUserId.empty) {
      await setDoc(snapUserId.docs[0].ref, updateData, { merge: true });
      return;
    }

    // 4. Query by 'user_id'
    const qUserIdSnake = query(collection(db, 'drivers'), where('user_id', '==', cleanUserId));
    const snapUserIdSnake = await getDocs(qUserIdSnake);
    if (!snapUserIdSnake.empty) {
      await setDoc(snapUserIdSnake.docs[0].ref, updateData, { merge: true });
      return;
    }

    // 5. Query by 'id'
    const qId = query(collection(db, 'drivers'), where('id', '==', driverId));
    const snapId = await getDocs(qId);
    if (!snapId.empty) {
      await setDoc(snapId.docs[0].ref, updateData, { merge: true });
      return;
    }

    // 6. Fallback merge docRef1
    await setDoc(docRef1, {
      id: driverId,
      userId: cleanUserId,
      user_id: cleanUserId,
      ...updateData,
    }, { merge: true });
  } catch (err) {
    console.warn('Error updating driver status in Firestore:', err);
  }
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
    console.warn('Firestore write warning for rides, returning local ID fallback:', error);
    return 'ride-' + Math.random().toString(36).substring(2, 9);
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

  // 1. Update Ride Document with rating
  if (rating.rideId) {
    try {
      const rideRef = doc(db, 'rides', rating.rideId);
      await updateDoc(rideRef, {
        ratingStars: rating.rating,
        ratingComment: rating.comment || '',
        ratingTags: rating.tags || [],
        ratedAt: serverTimestamp(),
      });
    } catch (err) {
      console.warn('Error updating ride document with rating:', err);
    }
  }

  // 2. Recalculate & Update Driver's Rating
  if (rating.driverId) {
    try {
      const driverRef = doc(db, 'drivers', rating.driverId);
      const driverSnap = await getDoc(driverRef);
      if (driverSnap.exists()) {
        const dData = driverSnap.data() as DriverProfile;
        const currentCount = dData.ratingCount || 0;
        const currentAvg = dData.rating || 5.0;
        const newCount = currentCount + 1;
        const newAvg = Number(((currentAvg * currentCount + rating.rating) / newCount).toFixed(1));

        await updateDoc(driverRef, {
          rating: newAvg,
          ratingCount: newCount,
          updatedAt: serverTimestamp(),
        });
      }
    } catch (err) {
      console.warn('Error updating driver rating average:', err);
    }
  }

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

// ============================================================================
// PURGE / CLEAR ALL TEST DATA (ADMIN TOOL)
// ============================================================================

export const clearAllTestDataFromFirestore = async (): Promise<{ deletedCount: number }> => {
  let deletedCount = 0;

  // 1. Delete all rides and subcollection offers
  try {
    const ridesSnap = await getDocs(collection(db, 'rides'));
    for (const rideDoc of ridesSnap.docs) {
      try {
        const offersSnap = await getDocs(collection(db, 'rides', rideDoc.id, 'offers'));
        for (const offerDoc of offersSnap.docs) {
          await deleteDoc(offerDoc.ref);
        }
      } catch (e) {
        // ignore subcollection errors
      }
      await deleteDoc(rideDoc.ref);
      deletedCount++;
    }
  } catch (e) {
    console.warn('Error purging rides:', e);
  }

  // 2. Delete all drivers
  try {
    const driversSnap = await getDocs(collection(db, 'drivers'));
    for (const driverDoc of driversSnap.docs) {
      await deleteDoc(driverDoc.ref);
      deletedCount++;
    }
  } catch (e) {
    console.warn('Error purging drivers:', e);
  }

  // 3. Delete non-admin users (preserve seyfhad@gmail.com)
  try {
    const usersSnap = await getDocs(collection(db, 'users'));
    for (const userDoc of usersSnap.docs) {
      const data = userDoc.data();
      if (data?.email?.toLowerCase() !== 'seyfhad@gmail.com' && data?.role !== 'admin') {
        await deleteDoc(userDoc.ref);
        deletedCount++;
      }
    }
  } catch (e) {
    console.warn('Error purging users:', e);
  }

  // 4. Delete complaints
  try {
    const complaintsSnap = await getDocs(collection(db, 'complaints'));
    for (const cDoc of complaintsSnap.docs) {
      await deleteDoc(cDoc.ref);
      deletedCount++;
    }
  } catch (e) {
    console.warn('Error purging complaints:', e);
  }

  // 5. Delete ratings
  try {
    const ratingsSnap = await getDocs(collection(db, 'ratings'));
    for (const rDoc of ratingsSnap.docs) {
      await deleteDoc(rDoc.ref);
      deletedCount++;
    }
  } catch (e) {
    console.warn('Error purging ratings:', e);
  }

  return { deletedCount };
};
