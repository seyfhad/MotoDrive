import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db, isFirestoreQuotaExceeded } from '../lib/firebase';
import { RideRequest, DriverProfile } from '../types';
import { handleFirestoreError, OperationType } from './firestoreErrorHandler';

const RIDE_REQUESTS_COL = 'ride_requests';
const COMPLETED_RIDES_COL = 'rides';

/**
 * Passenger creates a ride request stored in Firestore collection 'ride_requests' with status: 'pending'.
 */
export const createRideRequest = async (
  requestData: Omit<RideRequest, 'id' | 'status' | 'createdAt'> & { id?: string }
): Promise<string> => {
  const reqCol = collection(db, RIDE_REQUESTS_COL);
  const newDocRef = requestData.id ? doc(db, RIDE_REQUESTS_COL, requestData.id) : doc(reqCol);
  const requestId = newDocRef.id;

  const now = new Date().toISOString();
  const payload: RideRequest = {
    ...requestData,
    id: requestId,
    status: 'pending',
    createdAt: now,
  };

  if (isFirestoreQuotaExceeded()) {
    return requestId;
  }

  try {
    await setDoc(newDocRef, {
      ...payload,
      serverCreatedAt: serverTimestamp(),
      serverUpdatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `${RIDE_REQUESTS_COL}/${requestId}`);
  }
  return requestId;
};

/**
 * Drivers listen to 'ride_requests' in real-time using Firestore onSnapshot listener
 * or fallback to localStorage / custom event bus if offline or quota exceeded.
 */
export const subscribePendingRideRequests = (
  onRequestsUpdate: (requests: RideRequest[]) => void
): (() => void) => {
  const q = query(
    collection(db, RIDE_REQUESTS_COL),
    where('status', '==', 'pending')
  );

  let isSubscribed = true;

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      if (!isSubscribed) return;
      const requests: RideRequest[] = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as RideRequest[];
      onRequestsUpdate(requests);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, RIDE_REQUESTS_COL);
    }
  );

  return () => {
    isSubscribed = false;
    unsubscribe();
  };
};

export const subscribeSingleRideRequest = (
  requestId: string,
  onRequestUpdate: (request: RideRequest | null) => void
): (() => void) => {
  const reqRef = doc(db, RIDE_REQUESTS_COL, requestId);
  let isSubscribed = true;

  const unsubscribe = onSnapshot(
    reqRef,
    (snapshot) => {
      if (!isSubscribed) return;
      if (snapshot.exists()) {
        onRequestUpdate({ id: snapshot.id, ...snapshot.data() } as RideRequest);
      } else {
        onRequestUpdate(null);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, `${RIDE_REQUESTS_COL}/${requestId}`);
    }
  );

  return () => {
    isSubscribed = false;
    unsubscribe();
  };
};

export const acceptRideRequest = async (
  requestId: string,
  driver: DriverProfile
): Promise<void> => {
  if (isFirestoreQuotaExceeded()) return;
  const reqRef = doc(db, RIDE_REQUESTS_COL, requestId);
  const now = new Date().toISOString();

  try {
    await updateDoc(reqRef, {
      status: 'accepted',
      driverId: driver.id,
      driverName: driver.name,
      driverPhone: driver.phone,
      driverPhoto: driver.photoUrl || '',
      driverLocation: driver.location || null,
      motorcycle: driver.motorcycle || null,
      acceptedAt: now,
      serverUpdatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `${RIDE_REQUESTS_COL}/${requestId}`);
  }
};

export const completeRideRequest = async (
  requestId: string
): Promise<void> => {
  if (isFirestoreQuotaExceeded()) return;
  const reqRef = doc(db, RIDE_REQUESTS_COL, requestId);

  try {
    const snap = await getDoc(reqRef);
    if (snap.exists()) {
      const data = snap.data() as RideRequest;
      const completedAt = new Date().toISOString();

      const archiveRef = doc(db, COMPLETED_RIDES_COL, requestId);
      await setDoc(archiveRef, {
        id: requestId,
        passengerId: data.passengerId,
        passengerName: data.passengerName,
        passengerPhone: data.passengerPhone,
        driverId: data.driverId || null,
        driverName: data.driverName || '',
        driverPhone: data.driverPhone || '',
        driverPhoto: data.driverPhoto || '',
        status: 'completed',
        pickup: data.pickup,
        destination: data.destination,
        distanceKm: data.distanceKm,
        estimatedDurationMins: data.estimatedDurationMins,
        finalPrice: data.fare,
        estimatedPrice: data.fare,
        recommendedPrice: data.fare,
        passengerOfferedPrice: data.fare,
        platformCommission: 0,
        driverEarning: data.fare,
        paymentMethod: 'cash',
        paymentStatus: 'paid',
        requestedAt: data.createdAt,
        acceptedAt: data.acceptedAt || data.createdAt,
        completedAt,
        serverCompletedAt: serverTimestamp(),
      }, { merge: true });

      await deleteDoc(reqRef);
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${RIDE_REQUESTS_COL}/${requestId}`);
  }
};

export const cancelRideRequest = async (
  requestId: string
): Promise<void> => {
  if (isFirestoreQuotaExceeded()) return;
  const reqRef = doc(db, RIDE_REQUESTS_COL, requestId);
  try {
    await deleteDoc(reqRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${RIDE_REQUESTS_COL}/${requestId}`);
  }
};
