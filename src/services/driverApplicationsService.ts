import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { DriverApplication } from '../types';
import { handleFirestoreError, OperationType } from './firestoreErrorHandler';

const APPLICATIONS_COL = 'driver_applications';
const DRIVERS_COL = 'drivers';

/**
 * Submit a complete driver registration application to 'driver_applications' collection.
 * The 4 documents are stored directly as lightweight compressed Base64 strings (~40KB each).
 * Entire payload is well below 200KB (Firestore limit: 1MB). No Firebase Storage required.
 */
export const submitDriverApplication = async (
  applicationData: Omit<DriverApplication, 'id' | 'status' | 'submittedAt'> & { id?: string }
): Promise<string> => {
  const appId = applicationData.id || `app_${applicationData.driverId}`;
  const appRef = doc(db, APPLICATIONS_COL, appId);

  const now = new Date().toISOString();
  const applicationPayload: DriverApplication = {
    ...applicationData,
    id: appId,
    status: 'pending',
    submittedAt: now,
  };

  try {
    await setDoc(
      appRef,
      {
        ...applicationPayload,
        serverCreatedAt: serverTimestamp(),
        serverUpdatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    // Also update/sync the driver document in 'drivers' with status: 'pending'
    const driverRef = doc(db, DRIVERS_COL, applicationData.driverId);
    await setDoc(
      driverRef,
      {
        id: applicationData.driverId,
        userId: applicationData.userId,
        name: applicationData.fullName,
        phone: applicationData.phone,
        email: applicationData.email || '',
        wilaya: applicationData.wilaya,
        municipality: applicationData.municipality,
        motorcycle: applicationData.motorcycle,
        status: 'pending',
        photoUrl: applicationData.documents.selfieUrl || '',
        documents: {
          ...applicationData.documents,
          status: 'pending',
          submittedAt: now,
        },
        updatedAt: now,
      },
      { merge: true }
    );

    return appId;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${APPLICATIONS_COL}/${appId}`);
    throw err;
  }
};

/**
 * Real-time listener for the driver to monitor their own application status.
 */
export const subscribeDriverApplication = (
  userIdOrDriverId: string,
  onUpdate: (app: DriverApplication | null) => void
): (() => void) => {
  const appId = `app_${userIdOrDriverId.startsWith('driver-') ? userIdOrDriverId : `driver-${userIdOrDriverId}`}`;
  const appRef = doc(db, APPLICATIONS_COL, appId);

  const unsubscribe = onSnapshot(
    appRef,
    (snap) => {
      if (snap.exists()) {
        onUpdate({ id: snap.id, ...snap.data() } as DriverApplication);
      } else {
        // Fallback: query by userId
        const cleanUserId = userIdOrDriverId.replace(/^driver-/, '');
        const q = query(collection(db, APPLICATIONS_COL), where('userId', '==', cleanUserId));
        getDocs(q)
          .then((querySnap) => {
            if (!querySnap.empty) {
              onUpdate({ id: querySnap.docs[0].id, ...querySnap.docs[0].data() } as DriverApplication);
            } else {
              onUpdate(null);
            }
          })
          .catch(() => onUpdate(null));
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, `${APPLICATIONS_COL}/${appId}`);
    }
  );

  return unsubscribe;
};

/**
 * Real-time listener for Admin to inspect all pending driver applications.
 */
export const subscribePendingDriverApplications = (
  onUpdate: (apps: DriverApplication[]) => void
): (() => void) => {
  const q = query(
    collection(db, APPLICATIONS_COL),
    where('status', '==', 'pending')
  );

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const applications: DriverApplication[] = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as DriverApplication[];
      onUpdate(applications);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, APPLICATIONS_COL);
    }
  );

  return unsubscribe;
};

/**
 * Admin APPROVES a driver application:
 * Updates document status in 'driver_applications' to 'approved' and updates 'drivers' to 'approved'.
 * Operates purely via Firestore without Firebase Storage.
 */
export const approveDriverApplication = async (
  applicationId: string,
  driverId: string,
  reviewerId: string = 'admin'
): Promise<void> => {
  try {
    const appRef = doc(db, APPLICATIONS_COL, applicationId);
    const now = new Date().toISOString();

    await updateDoc(appRef, {
      status: 'approved',
      reviewedAt: now,
      reviewedBy: reviewerId,
      serverUpdatedAt: serverTimestamp(),
    });

    // Update driver profile in 'drivers' to approved and active
    const driverRef = doc(db, DRIVERS_COL, driverId);
    await setDoc(
      driverRef,
      {
        status: 'approved',
        rejectionReason: '',
        'documents.status': 'approved',
        'documents.reviewedAt': now,
        updatedAt: now,
        serverUpdatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `${APPLICATIONS_COL}/${applicationId}`);
    throw err;
  }
};

/**
 * Admin REJECTS a driver application:
 * Updates document status in 'driver_applications' to 'rejected' with reason, and updates 'drivers' to 'rejected'.
 * Operates purely via Firestore without Firebase Storage.
 */
export const rejectDriverApplication = async (
  applicationId: string,
  driverId: string,
  reason: string,
  reviewerId: string = 'admin'
): Promise<void> => {
  try {
    const appRef = doc(db, APPLICATIONS_COL, applicationId);
    const now = new Date().toISOString();

    await updateDoc(appRef, {
      status: 'rejected',
      rejectionReason: reason,
      reviewedAt: now,
      reviewedBy: reviewerId,
      serverUpdatedAt: serverTimestamp(),
    });

    // Update driver profile in 'drivers' to rejected
    const driverRef = doc(db, DRIVERS_COL, driverId);
    await setDoc(
      driverRef,
      {
        status: 'rejected',
        rejectionReason: reason,
        'documents.status': 'rejected',
        'documents.rejectionReason': reason,
        'documents.reviewedAt': now,
        updatedAt: now,
        serverUpdatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `${APPLICATIONS_COL}/${applicationId}`);
    throw err;
  }
};
