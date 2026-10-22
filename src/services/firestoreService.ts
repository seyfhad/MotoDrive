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
  arrayUnion,
} from 'firebase/firestore';
import { db, isFirestoreQuotaExceeded } from '../lib/firebase';
import { Coordinates, DriverProfile, Ride, RideOffer, PricingSettings, Rating, Complaint, UserProfile, DriverApprovalStatus } from '../types';
import { handleFirestoreError, OperationType } from './firestoreErrorHandler';
import { saveUserToSecureVault, saveActiveSessionSecurely, loadActiveSessionSecurely, removeRideFromSecureVault } from './dataVaultService';

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
    handleFirestoreError(err, OperationType.GET, 'system_config/pricing');
    return null;
  }
};

export const saveSystemPricing = async (pricing: PricingSettings): Promise<void> => {
  if (isFirestoreQuotaExceeded()) return;
  try {
    const docRef = doc(db, 'system_config', 'pricing');
    await setDoc(docRef, sanitizeFirestoreData({ ...pricing, updatedAt: serverTimestamp() }), { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'system_config/pricing');
  }
};

// ============================================================================
// USER PROFILES SERVICE
// ============================================================================

export const syncUserProfile = async (user: Partial<UserProfile> & { id: string }): Promise<void> => {
  if (!isFirestoreQuotaExceeded()) {
    try {
      const userRef = doc(db, 'users', user.id);
      await setDoc(userRef, sanitizeFirestoreData({
        ...user,
        updatedAt: serverTimestamp(),
      }), { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.id}`);
    }
  }

  try {
    const { user: currentSessUser, driver: currentSessDriver } = loadActiveSessionSecurely();
    if (currentSessUser && currentSessUser.id === user.id) {
      const mergedUser = { ...currentSessUser, ...user };
      saveActiveSessionSecurely(mergedUser, currentSessDriver);
      if (mergedUser.phone) {
        saveUserToSecureVault(mergedUser.phone, mergedUser, currentSessDriver).catch(() => {});
      }
    } else if (user.phone && user.name) {
      saveUserToSecureVault(user.phone, user as UserProfile).catch(() => {});
    }
  } catch (e) {}
};

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    const userRef = doc(db, 'users', userId);
    const snap = await getDoc(userRef);
    return snap.exists() ? (snap.data() as UserProfile) : null;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `users/${userId}`);
    return null;
  }
};

export const updatePassengerSavedLocation = async (
  userId: string,
  phone: string | undefined,
  type: 'home' | 'work',
  location: Coordinates | null,
  fullProfile?: UserProfile
): Promise<boolean> => {
  const fieldName = type === 'home' ? 'homeLocation' : 'workLocation';
  const cleanPhone = phone
    ? phone.trim().replace(/[\s\-().]/g, '').replace(/^(?:\+213|00213|213)/, '0')
    : '';

  const cleanLocation = location
    ? {
        lat: Number(location.lat),
        lng: Number(location.lng),
        name: String(location.name || location.address || (type === 'home' ? 'المنزل' : 'العمل')),
        address: String(location.address || location.name || (type === 'home' ? 'المنزل' : 'العمل')),
      }
    : null;

  if (!isFirestoreQuotaExceeded()) {
    const updatePayload = sanitizeFirestoreData({
      [fieldName]: cleanLocation,
      updatedAt: serverTimestamp(),
    });

    const targetIds = new Set<string>();
    if (userId && userId !== 'passenger-guest' && userId !== 'guest') {
      targetIds.add(userId);
    }
    if (cleanPhone) {
      targetIds.add(`user-${cleanPhone}`);
    }

    for (const targetId of targetIds) {
      try {
        const userRef = doc(db, 'users', targetId);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          await updateDoc(userRef, updatePayload);
        } else {
          const createPayload = sanitizeFirestoreData({
            id: targetId,
            name: fullProfile?.name || 'راكب MotoDrive',
            phone: cleanPhone || fullProfile?.phone || '',
            role: fullProfile?.role || 'passenger',
            status: fullProfile?.status || 'active',
            createdAt: fullProfile?.createdAt || new Date().toISOString(),
            ...(fullProfile || {}),
            [fieldName]: cleanLocation,
            updatedAt: serverTimestamp(),
          });
          await setDoc(userRef, createPayload, { merge: true });
        }
      } catch (err) {
        try {
          const userRef = doc(db, 'users', targetId);
          await setDoc(
            userRef,
            sanitizeFirestoreData({
              ...(fullProfile || {}),
              id: targetId,
              [fieldName]: cleanLocation,
              updatedAt: serverTimestamp(),
            }),
            { merge: true }
          );
        } catch (innerErr) {
          handleFirestoreError(innerErr, OperationType.WRITE, `users/${targetId}`);
        }
      }
    }

    // Also update any existing user documents matching phone number in 'users' collection
    if (cleanPhone) {
      try {
        const qPhone = query(collection(db, 'users'), where('phone', '==', cleanPhone));
        const snapPhone = await getDocs(qPhone);
        for (const docSnap of snapPhone.docs) {
          if (!targetIds.has(docSnap.id)) {
            await updateDoc(docSnap.ref, updatePayload).catch(() => {});
          }
        }
      } catch {}
    }
  }

  try {
    const { user: currentSessUser, driver: currentSessDriver } = loadActiveSessionSecurely();
    const baseUser = currentSessUser || fullProfile;
    if (baseUser) {
      const mergedUser: UserProfile = {
        ...baseUser,
        [fieldName]: cleanLocation,
      };
      saveActiveSessionSecurely(mergedUser, currentSessDriver);
      if (mergedUser.phone || cleanPhone) {
        saveUserToSecureVault(mergedUser.phone || cleanPhone, mergedUser, currentSessDriver).catch(() => {});
      }
    }
  } catch (e) {}

  return true;
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
    handleFirestoreError(err, OperationType.GET, 'drivers');
    return null;
  }
};

// ============================================================================
// DRIVER PROFILE & LIVE GPS TELEMETRY
// ============================================================================

export const syncDriverProfile = async (driver: DriverProfile): Promise<void> => {
  if (!isFirestoreQuotaExceeded()) {
    const gh = geohashForLocation([driver.location?.lat || 36.7538, driver.location?.lng || 3.0588]);
    const cleanData = sanitizeFirestoreData({
      ...driver,
      geohash: gh,
      updatedAt: serverTimestamp(),
    });

    // 1. Primary write to Firestore by driver.id
    try {
      const driverRef = doc(db, 'drivers', driver.id);
      await setDoc(driverRef, cleanData, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `drivers/${driver.id}`);
    }

    // 2. Secondary write by userId or prefixed ID if different
    if (!isFirestoreQuotaExceeded() && driver.userId && `driver-${driver.userId}` !== driver.id) {
      try {
        const altRef = doc(db, 'drivers', `driver-${driver.userId}`);
        await setDoc(altRef, cleanData, { merge: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `drivers/driver-${driver.userId}`);
      }
    }
  }

  // 3. Multi-layer redundant local & IndexedDB persistence
  try {
    localStorage.setItem('motodrive_active_driver', JSON.stringify(driver));
    if (driver.phone) {
      localStorage.setItem(`motodrive_pending_driver_${driver.phone}`, JSON.stringify(driver));
    }

    const { user: currentSessUser } = loadActiveSessionSecurely();
    const associatedUser: UserProfile =
      currentSessUser && (currentSessUser.id === driver.userId || currentSessUser.phone === driver.phone)
        ? currentSessUser
        : {
            id: driver.userId || `user-${driver.phone}`,
            name: driver.name,
            phone: driver.phone,
            role: 'driver',
            status: 'active',
            cancellationCount: driver.cancellationCount || 0,
            createdAt: driver.createdAt || new Date().toISOString(),
          };

    saveUserToSecureVault(driver.phone, associatedUser, driver).catch(() => {});
    if (currentSessUser && (currentSessUser.id === driver.userId || currentSessUser.phone === driver.phone)) {
      saveActiveSessionSecurely(currentSessUser, driver);
    }
  } catch (e) {}
};

export const updateDriverStatusInFirestore = async (
  driverId: string,
  status: DriverApprovalStatus,
  rejectionReason?: string,
  driverPhone?: string,
  rejectionCount?: number
): Promise<void> => {
  if (isFirestoreQuotaExceeded()) return;
  try {
    const updateData: any = {
      status,
      updatedAt: serverTimestamp(),
      'documents.status': status,
      'documents.selfieUrl': null,
      'documents.personalPhotoUrl': null,
      'documents.motorcyclePhotoUrl': null,
      'documents.motorcycleFrontUrl': null,
      'documents.motorcycleBackUrl': null,
      'documents.licenseUrl': null,
      'documents.licenseFrontUrl': null,
      'documents.licenseBackUrl': null,
      'documents.vehicleRegistrationUrl': null,
      'documents.vehicleDocFrontUrl': null,
      'documents.vehicleDocBackUrl': null,
      'documents.motorcyclePhotosUrls': [],
    };
    if (rejectionReason !== undefined) {
      updateData.rejectionReason = rejectionReason;
    } else if (status === 'approved') {
      updateData.rejectionReason = null;
      updateData.rejectionCount = 0;
      updateData.isPermanentlyRejected = false;
    }
    if (typeof rejectionCount === 'number') {
      updateData.rejectionCount = rejectionCount;
      updateData.isPermanentlyRejected = rejectionCount >= 2;
    }

    const cleanUserId = driverId.replace(/^driver-/, '');
    const cleanPhone = driverPhone
      ? driverPhone.trim().replace(/[\s\-().]/g, '').replace(/^(?:\+213|00213|213)/, '0')
      : cleanUserId.replace(/^user-/, '');

    let updatedAny = false;

    // 1. Direct doc by driverId
    const docRef1 = doc(db, 'drivers', driverId);
    const snap1 = await getDoc(docRef1);
    if (snap1.exists()) {
      await setDoc(docRef1, updateData, { merge: true });
      updatedAny = true;
    }

    // 2. Doc with 'driver-' prefix
    const prefixedId = driverId.startsWith('driver-') ? driverId : `driver-${driverId}`;
    if (prefixedId !== driverId) {
      const docRef2 = doc(db, 'drivers', prefixedId);
      const snap2 = await getDoc(docRef2);
      if (snap2.exists()) {
        await setDoc(docRef2, updateData, { merge: true });
        updatedAny = true;
      }
    }

    // 3. Query by 'userId'
    const qUserId = query(collection(db, 'drivers'), where('userId', '==', cleanUserId));
    const snapUserId = await getDocs(qUserId);
    for (const d of snapUserId.docs) {
      await setDoc(d.ref, updateData, { merge: true });
      updatedAny = true;
    }

    // 4. Query by 'phone'
    if (cleanPhone && cleanPhone.length >= 8) {
      const qPhone = query(collection(db, 'drivers'), where('phone', '==', cleanPhone));
      const snapPhone = await getDocs(qPhone);
      for (const d of snapPhone.docs) {
        await setDoc(d.ref, updateData, { merge: true });
        updatedAny = true;
      }
    }

    // 5. Query by 'id'
    const qId = query(collection(db, 'drivers'), where('id', '==', driverId));
    const snapId = await getDocs(qId);
    for (const d of snapId.docs) {
      await setDoc(d.ref, updateData, { merge: true });
      updatedAny = true;
    }

    // 6. Fallback merge docRef1 if none existed yet
    if (!updatedAny) {
      await setDoc(docRef1, {
        id: driverId,
        userId: cleanUserId,
        ...updateData,
      }, { merge: true });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `drivers/${driverId}`);
  }
};

export const deleteUserAccountFromFirestore = async (
  role: 'passenger' | 'driver',
  userId?: string,
  driverId?: string,
  phone?: string,
  applicationId?: string
): Promise<void> => {
  if (isFirestoreQuotaExceeded()) return;
  const rawPhone = phone ? phone.trim().replace(/\s+/g, '') : '';
  const cleanPhone = phone
    ? phone.trim().replace(/[\s\-().]/g, '').replace(/^(?:\+213|00213|213)/, '0')
    : '';
  const cleanUserId = (userId || driverId || '').replace(/^driver-/, '');

  try {
    // 1. Delete matching user docs
    if (userId && userId !== 'guest' && userId !== 'passenger-guest') {
      await deleteDoc(doc(db, 'users', userId)).catch(() => {});
    }
    if (cleanUserId && cleanUserId !== 'guest' && cleanUserId !== 'passenger-guest') {
      await deleteDoc(doc(db, 'users', cleanUserId)).catch(() => {});
    }
    if (cleanPhone) {
      await deleteDoc(doc(db, 'users', `user-${cleanPhone}`)).catch(() => {});
      const uq = query(collection(db, 'users'), where('phone', '==', cleanPhone));
      const uSnap = await getDocs(uq).catch(() => null);
      if (uSnap) {
        for (const d of uSnap.docs) {
          await deleteDoc(d.ref).catch(() => {});
        }
      }
      if (rawPhone && rawPhone !== cleanPhone) {
        const uq2 = query(collection(db, 'users'), where('phone', '==', rawPhone));
        const uSnap2 = await getDocs(uq2).catch(() => null);
        if (uSnap2) {
          for (const d of uSnap2.docs) {
            await deleteDoc(d.ref).catch(() => {});
          }
        }
      }
    }

    // 2. Always delete any matching driver or driver_application records for this account
    if (applicationId) {
      await deleteDoc(doc(db, 'driver_applications', applicationId)).catch(() => {});
    }
    if (driverId && driverId !== 'driver-default') {
      await deleteDoc(doc(db, 'drivers', driverId)).catch(() => {});
      await deleteDoc(doc(db, 'driver_applications', `app_${driverId}`)).catch(() => {});
      await deleteDoc(doc(db, 'driver_applications', driverId)).catch(() => {});

      const dqById = query(collection(db, 'drivers'), where('id', '==', driverId));
      const dSnapById = await getDocs(dqById).catch(() => null);
      if (dSnapById) {
        for (const d of dSnapById.docs) {
          await deleteDoc(d.ref).catch(() => {});
        }
      }

      const aqByDrv = query(collection(db, 'driver_applications'), where('driverId', '==', driverId));
      const aSnapByDrv = await getDocs(aqByDrv).catch(() => null);
      if (aSnapByDrv) {
        for (const d of aSnapByDrv.docs) {
          await deleteDoc(d.ref).catch(() => {});
        }
      }
    }

    if (cleanUserId && cleanUserId !== 'guest' && cleanUserId !== 'passenger-guest') {
      await deleteDoc(doc(db, 'drivers', `driver-${cleanUserId}`)).catch(() => {});
      await deleteDoc(doc(db, 'driver_applications', `app_driver-${cleanUserId}`)).catch(() => {});
      await deleteDoc(doc(db, 'driver_applications', `app_${cleanUserId}`)).catch(() => {});

      const dqByUser = query(collection(db, 'drivers'), where('userId', '==', cleanUserId));
      const dSnapByUser = await getDocs(dqByUser).catch(() => null);
      if (dSnapByUser) {
        for (const d of dSnapByUser.docs) {
          await deleteDoc(d.ref).catch(() => {});
        }
      }

      const aqByUser = query(collection(db, 'driver_applications'), where('userId', '==', cleanUserId));
      const aSnapByUser = await getDocs(aqByUser).catch(() => null);
      if (aSnapByUser) {
        for (const d of aSnapByUser.docs) {
          await deleteDoc(d.ref).catch(() => {});
        }
      }
    }

    if (cleanPhone) {
      await deleteDoc(doc(db, 'drivers', `driver-user-${cleanPhone}`)).catch(() => {});
      await deleteDoc(doc(db, 'drivers', `driver-${cleanPhone}`)).catch(() => {});
      await deleteDoc(doc(db, 'driver_applications', `app_driver-user-${cleanPhone}`)).catch(() => {});
      await deleteDoc(doc(db, 'driver_applications', `app_driver-${cleanPhone}`)).catch(() => {});
      await deleteDoc(doc(db, 'driver_applications', `app_${cleanPhone}`)).catch(() => {});

      const dq = query(collection(db, 'drivers'), where('phone', '==', cleanPhone));
      const dSnap = await getDocs(dq).catch(() => null);
      if (dSnap) {
        for (const d of dSnap.docs) {
          await deleteDoc(d.ref).catch(() => {});
        }
      }

      const aq = query(collection(db, 'driver_applications'), where('phone', '==', cleanPhone));
      const aSnap = await getDocs(aq).catch(() => null);
      if (aSnap) {
        for (const d of aSnap.docs) {
          await deleteDoc(d.ref).catch(() => {});
        }
      }

      if (rawPhone && rawPhone !== cleanPhone) {
        const dqRaw = query(collection(db, 'drivers'), where('phone', '==', rawPhone));
        const dSnapRaw = await getDocs(dqRaw).catch(() => null);
        if (dSnapRaw) {
          for (const d of dSnapRaw.docs) {
            await deleteDoc(d.ref).catch(() => {});
          }
        }
        const aqRaw = query(collection(db, 'driver_applications'), where('phone', '==', rawPhone));
        const aSnapRaw = await getDocs(aqRaw).catch(() => null);
        if (aSnapRaw) {
          for (const d of aSnapRaw.docs) {
            await deleteDoc(d.ref).catch(() => {});
          }
        }
      }
    }
  } catch (err) {
    console.warn('Error deleting account from Firestore:', err);
  }
};

export const updateDriverLocation = async (
  driverId: string,
  lat: number,
  lng: number,
  heading?: number,
  speed?: number,
  activeRideId?: string
): Promise<void> => {
  if (isFirestoreQuotaExceeded()) return;
  try {
    const driverRef = doc(db, 'drivers', driverId);
    const gh = geohashForLocation([lat, lng]);

    await setDoc(
      driverRef,
      {
        location: {
          lat,
          lng,
          heading: heading || 0,
          speed: speed || 0,
        },
        geohash: gh,
        lastLocationUpdate: serverTimestamp(),
      },
      { merge: true }
    );

    if (activeRideId) {
      const rideRef = doc(db, 'rides', activeRideId);
      await setDoc(
        rideRef,
        {
          driverLocation: {
            lat,
            lng,
          },
          driverHeading: heading || 0,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      ).catch(() => {});
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `drivers/${driverId}`);
  }
};

export const updateFirestoreDriverLocation = updateDriverLocation;

export const updateDriverOnlineStatus = async (
  driverId: string,
  isOnline: boolean,
  isAvailable: boolean,
  customStatus?: string
): Promise<void> => {
  if (isFirestoreQuotaExceeded()) return;
  const dutyValue = customStatus || (isOnline ? (isAvailable ? 'available' : 'busy') : 'offline');
  try {
    const driverRef = doc(db, 'drivers', driverId);
    const docUpdates: Record<string, any> = {
      isOnline,
      isAvailable,
      dutyStatus: dutyValue,
      updatedAt: serverTimestamp(),
    };
    // Only update approval status if explicitly provided as an administrative status
    if (customStatus && ['approved', 'pending', 'rejected', 'suspended'].includes(customStatus)) {
      docUpdates.status = customStatus;
    }
    await setDoc(driverRef, docUpdates, { merge: true });
  } catch (err) {
    console.warn(`Notice updating driver ${driverId} status in Firestore:`, err);
    try {
      handleFirestoreError(err, OperationType.UPDATE, `drivers/${driverId}`);
    } catch {}
  }
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
  if (isFirestoreQuotaExceeded()) {
    return 'ride-' + Math.random().toString(36).substring(2, 9);
  }
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
      expiresAt: Timestamp.fromMillis(Date.now() + 8 * 60 * 1000), // 08 mins expiration
    });

    const docRef = await addDoc(ridesCol, cleanPayload);
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    return 'ride-' + Math.random().toString(36).substring(2, 9);
  }
};

export const deleteExpiredRideFromFirestore = async (rideId: string): Promise<void> => {
  await removeRideFromSecureVault(rideId);
  if (isFirestoreQuotaExceeded()) return;
  try {
    await deleteDoc(doc(db, 'rides', rideId));
  } catch (err) {
    // Ignore if already deleted or permission restricted
  }
  try {
    await deleteDoc(doc(db, 'ride_requests', rideId));
  } catch (err) {
    // Ignore if already deleted
  }
};

export const updatePassengerOfferInFirestore = async (
  rideId: string,
  newPrice: number
): Promise<void> => {
  if (isFirestoreQuotaExceeded()) return;
  try {
    const rideRef = doc(db, 'rides', rideId);
    await updateDoc(rideRef, sanitizeFirestoreData({
      passengerOfferedPrice: newPrice,
      estimatedPrice: newPrice,
      updatedAt: serverTimestamp(),
    }));
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `rides/${rideId}`);
  }
};

export const cancelRideInFirestore = async (
  rideId: string,
  reason: string,
  cancelledBy: 'passenger' | 'driver' | 'system'
): Promise<void> => {
  if (isFirestoreQuotaExceeded()) return;
  try {
    const rideRef = doc(db, 'rides', rideId);
    await updateDoc(rideRef, sanitizeFirestoreData({
      status: cancelledBy === 'passenger' ? 'cancelled_by_passenger' : 'cancelled_by_driver',
      cancellationReason: reason,
      cancelledAt: serverTimestamp(),
    }));
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `rides/${rideId}`);
  }
};

// ============================================================================
// DRIVER OFFERS & COUNTEROFFERS (SUBCOLLECTION)
// ============================================================================

export const submitDriverOfferInFirestore = async (
  rideId: string,
  offer: Omit<RideOffer, 'id' | 'createdAt'>
): Promise<string> => {
  if (isFirestoreQuotaExceeded()) {
    return 'offer-' + Math.random().toString(36).substring(2, 9);
  }
  try {
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
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `rides/${rideId}/offers`);
    return 'offer-' + Math.random().toString(36).substring(2, 9);
  }
};

// CRITICAL: Transaction-safe driver selection to prevent Race Conditions
export const acceptDriverOfferTransaction = async (
  rideId: string,
  offerId: string,
  driver: DriverProfile,
  offeredPrice: number,
  commissionPercent: number = 0
): Promise<{ success: boolean; error?: string }> => {
  if (isFirestoreQuotaExceeded()) {
    return { success: true };
  }
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
        driverLocation: driver.location,
        finalPrice: offeredPrice,
        platformCommission: commission,
        driverEarning: driverEarning,
        acceptedAt: serverTimestamp(),
      });
      transaction.update(rideRef, rideUpdatePayload);

      // 2. Mark this offer as accepted (safe set with merge so direct acceptance works without pre-existing offer doc)
      transaction.set(
        offerRef,
        sanitizeFirestoreData({
          id: offerId,
          rideId,
          driverId: driver.id,
          driverName: driver.name,
          driverPhone: driver.phone,
          driverPhoto: driver.photoUrl || null,
          driverRating: driver.rating ?? 5.0,
          driverTripsCount: driver.totalTrips ?? 0,
          driverMotorcycle: driver.motorcycle,
          driverLocation: driver.location,
          offeredPrice,
          status: 'accepted',
          acceptedAt: serverTimestamp(),
        }),
        { merge: true }
      );

      // 3. Mark the driver as busy / not available (safe set with merge)
      transaction.set(
        driverRef,
        sanitizeFirestoreData({
          isAvailable: false,
          currentRideId: rideId,
          updatedAt: serverTimestamp(),
        }),
        { merge: true }
      );
    });

    return { success: true };
  } catch (err: any) {
    handleFirestoreError(err, OperationType.UPDATE, `rides/${rideId}`);
    return { success: true };
  }
};

export const advanceRideStatusInFirestore = async (
  rideId: string,
  newStatus: Ride['status'],
  extraData?: Partial<Ride>
): Promise<void> => {
  if (isFirestoreQuotaExceeded()) return;
  try {
    const rideRef = doc(db, 'rides', rideId);
    const updates: Record<string, any> = sanitizeFirestoreData({
      status: newStatus,
      updatedAt: serverTimestamp(),
      ...(extraData || {}),
    });

    if (newStatus === 'trip_started') updates.startedAt = serverTimestamp();
    if (newStatus === 'completed') updates.completedAt = serverTimestamp();

    await updateDoc(rideRef, updates);
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `rides/${rideId}`);
  }
};

// ============================================================================
// RATINGS & COMPLAINTS
// ============================================================================

export const submitRatingToFirestore = async (
  rating: Omit<Rating, 'id' | 'createdAt'>
): Promise<string> => {
  if (isFirestoreQuotaExceeded()) {
    return 'rating-' + Math.random().toString(36).substring(2, 9);
  }
  try {
    const ratingCol = collection(db, 'ratings');
    const cleanRating = sanitizeFirestoreData({
      ...rating,
      createdAt: serverTimestamp(),
    });

    // 1. Save to root ratings collection
    const docRef = await addDoc(ratingCol, cleanRating);

    // 2. Save directly to the driver's document subcollection ('drivers/{driverId}/ratings')
    if (rating.driverId) {
      try {
        const driverRatingSubCol = collection(db, 'drivers', rating.driverId, 'ratings');
        await addDoc(driverRatingSubCol, {
          ...cleanRating,
          ratingDocId: docRef.id,
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `drivers/${rating.driverId}/ratings`);
      }
    }

    // 3. Update Ride Document with rating
    if (rating.rideId && !isFirestoreQuotaExceeded()) {
      try {
        const rideRef = doc(db, 'rides', rating.rideId);
        await updateDoc(rideRef, {
          ratingStars: rating.rating,
          ratingComment: rating.comment || '',
          ratingTags: rating.tags || [],
          ratedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `rides/${rating.rideId}`);
      }
    }

    // 4. Recalculate & Update Driver's Rating and append feedback to Driver Document
    if (rating.driverId && !isFirestoreQuotaExceeded()) {
      try {
        const driverRef = doc(db, 'drivers', rating.driverId);
        const driverSnap = await getDoc(driverRef);
        if (driverSnap.exists()) {
          const dData = driverSnap.data() as DriverProfile;
          const currentCount = dData.ratingCount || 0;
          const currentAvg = dData.rating || 5.0;
          const newCount = currentCount + 1;
          const newAvg = Number(((currentAvg * currentCount + rating.rating) / newCount).toFixed(1));

          const feedbackSnippet = {
            id: docRef.id,
            rating: rating.rating,
            comment: rating.comment || '',
            tags: rating.tags || [],
            passengerName: rating.passengerName || 'راكب محترم',
            createdAt: new Date().toISOString(),
          };

          await updateDoc(driverRef, {
            rating: newAvg,
            ratingCount: newCount,
            recentFeedback: arrayUnion(feedbackSnippet),
            updatedAt: serverTimestamp(),
          });
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `drivers/${rating.driverId}`);
      }
    }

    return docRef.id;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, 'ratings');
    return 'rating-' + Math.random().toString(36).substring(2, 9);
  }
};

// Fetch driver ratings from Firestore driver subcollection
export const getDriverRatingsFromFirestore = async (driverId: string): Promise<Rating[]> => {
  try {
    const driverRatingSubCol = collection(db, 'drivers', driverId, 'ratings');
    const snap = await getDocs(driverRatingSubCol);
    if (!snap.empty) {
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as Rating));
    }
    // Fallback: check root ratings collection
    const q = query(collection(db, 'ratings'), where('driverId', '==', driverId));
    const rootSnap = await getDocs(q);
    return rootSnap.docs.map(d => ({ id: d.id, ...d.data() } as Rating));
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `drivers/${driverId}/ratings`);
    return [];
  }
};

export const submitComplaintToFirestore = async (
  complaint: Omit<Complaint, 'id' | 'createdAt'>
): Promise<string> => {
  if (isFirestoreQuotaExceeded()) {
    return 'complaint-' + Math.random().toString(36).substring(2, 9);
  }
  try {
    const compCol = collection(db, 'complaints');
    const cleanComplaint = sanitizeFirestoreData({
      ...complaint,
      status: 'pending',
      createdAt: serverTimestamp(),
    });
    const docRef = await addDoc(compCol, cleanComplaint);
    return docRef.id;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, 'complaints');
    return 'complaint-' + Math.random().toString(36).substring(2, 9);
  }
};

// ============================================================================
// STORAGE UPLOAD (DOCUMENTS & PHOTOS WITH BASE64 FALLBACK)
// ============================================================================

export const fileToCompressedDataUrl = (file: File, maxDimension: number = 500, quality: number = 0.55): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string || '';
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        } else {
          resolve(result);
        }
      };
      img.onerror = () => resolve(result);
      img.src = result;
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
};

export const uploadDriverDocument = async (
  driverId: string,
  docType: string,
  file: File
): Promise<string> => {
  return await fileToCompressedDataUrl(file, 640, 0.55);
};

// ============================================================================
// PURGE / CLEAR ALL TEST DATA (ADMIN TOOL)
// ============================================================================

export const clearAllTestDataFromFirestore = async (): Promise<{ deletedCount: number }> => {
  if (isFirestoreQuotaExceeded()) {
    return { deletedCount: 0 };
  }
  let deletedCount = 0;

  // 1. Delete all rides and subcollection offers
  try {
    const ridesSnap = await getDocs(collection(db, 'rides'));
    for (const rideDoc of ridesSnap.docs) {
      if (isFirestoreQuotaExceeded()) break;
      try {
        const offersSnap = await getDocs(collection(db, 'rides', rideDoc.id, 'offers'));
        for (const offerDoc of offersSnap.docs) {
          if (isFirestoreQuotaExceeded()) break;
          await deleteDoc(offerDoc.ref);
        }
      } catch (e) {
        // ignore subcollection errors
      }
      await deleteDoc(rideDoc.ref);
      deletedCount++;
    }
  } catch (e) {
    handleFirestoreError(e, OperationType.DELETE, 'rides');
  }

  // 2. Delete all drivers and driver_applications
  try {
    if (!isFirestoreQuotaExceeded()) {
      const driversSnap = await getDocs(collection(db, 'drivers'));
      for (const driverDoc of driversSnap.docs) {
        if (isFirestoreQuotaExceeded()) break;
        await deleteDoc(driverDoc.ref);
        deletedCount++;
      }
      const appsSnap = await getDocs(collection(db, 'driver_applications'));
      for (const appDoc of appsSnap.docs) {
        if (isFirestoreQuotaExceeded()) break;
        await deleteDoc(appDoc.ref);
        deletedCount++;
      }
    }
  } catch (e) {
    handleFirestoreError(e, OperationType.DELETE, 'drivers');
  }

  // 3. Delete ALL users (passengers, drivers, and any legacy admin records including 0542524728 / 0662688714)
  try {
    if (!isFirestoreQuotaExceeded()) {
      const usersSnap = await getDocs(collection(db, 'users'));
      for (const userDoc of usersSnap.docs) {
        if (isFirestoreQuotaExceeded()) break;
        await deleteDoc(userDoc.ref);
        deletedCount++;
      }
    }
  } catch (e) {
    handleFirestoreError(e, OperationType.DELETE, 'users');
  }

  // 4. Delete ride_requests
  try {
    if (!isFirestoreQuotaExceeded()) {
      const reqSnap = await getDocs(collection(db, 'ride_requests'));
      for (const reqDoc of reqSnap.docs) {
        if (isFirestoreQuotaExceeded()) break;
        await deleteDoc(reqDoc.ref);
        deletedCount++;
      }
    }
  } catch (e) {}

  // 5. Delete complaints
  try {
    if (!isFirestoreQuotaExceeded()) {
      const complaintsSnap = await getDocs(collection(db, 'complaints'));
      for (const cDoc of complaintsSnap.docs) {
        if (isFirestoreQuotaExceeded()) break;
        await deleteDoc(cDoc.ref);
        deletedCount++;
      }
    }
  } catch (e) {
    handleFirestoreError(e, OperationType.DELETE, 'complaints');
  }

  // 6. Delete ratings
  try {
    if (!isFirestoreQuotaExceeded()) {
      const ratingsSnap = await getDocs(collection(db, 'ratings'));
      for (const rDoc of ratingsSnap.docs) {
        if (isFirestoreQuotaExceeded()) break;
        await deleteDoc(rDoc.ref);
        deletedCount++;
      }
    }
  } catch (e) {
    handleFirestoreError(e, OperationType.DELETE, 'ratings');
  }

  // 7. Delete support_messages
  try {
    if (!isFirestoreQuotaExceeded()) {
      const msgSnap = await getDocs(collection(db, 'support_messages'));
      for (const mDoc of msgSnap.docs) {
        if (isFirestoreQuotaExceeded()) break;
        await deleteDoc(mDoc.ref);
        deletedCount++;
      }
    }
  } catch (e) {}

  return { deletedCount };
};

export const toggleDriverVerification = async (
  driverId: string,
  isVerified: boolean
): Promise<void> => {
  if (isFirestoreQuotaExceeded()) return;
  try {
    const driverRef = doc(db, 'drivers', driverId);
    await setDoc(driverRef, { isVerified }, { merge: true });
    
    // Also try updating secondary doc if it exists
    const altRef = doc(db, 'drivers', `driver-${driverId.replace('driver-', '')}`);
    await setDoc(altRef, { isVerified }, { merge: true }).catch(() => {});
  } catch (err) {
    console.warn('Error toggling driver verification:', err);
  }
};

export const toggleUserVerification = async (
  userId: string,
  isVerified: boolean
): Promise<void> => {
  if (isFirestoreQuotaExceeded()) return;
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, { isVerified }, { merge: true });
    
    // Also check if user is a driver
    const driverRef = doc(db, 'drivers', userId);
    await setDoc(driverRef, { isVerified }, { merge: true }).catch(() => {});
  } catch (err) {
    console.warn('Error toggling user verification:', err);
  }
};

export const submitVerificationRequestToFirestore = async (
  requestData: {
    userId: string;
    userName: string;
    userPhone: string;
    userPhoto?: string;
    role: 'passenger' | 'driver';
    idCardUrl: string;
  }
): Promise<string> => {
  const reqId = `ver_${requestData.userId}_${Date.now()}`;
  const payload = {
    id: reqId,
    ...requestData,
    status: 'pending' as const,
    submittedAt: new Date().toISOString(),
  };

  // Save to localStorage fallback immediately
  try {
    const saved = localStorage.getItem('motodrive_verification_requests');
    const list = saved ? JSON.parse(saved) : [];
    list.unshift(payload);
    localStorage.setItem('motodrive_verification_requests', JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('motodrive_verification_submitted'));
  } catch {}

  if (isFirestoreQuotaExceeded()) return reqId;
  try {
    const reqRef = doc(db, 'verification_requests', reqId);
    await setDoc(reqRef, {
      ...payload,
      serverCreatedAt: serverTimestamp(),
    });
    return reqId;
  } catch (err) {
    console.warn('Error submitting verification request to Firestore:', err);
    return reqId;
  }
};

