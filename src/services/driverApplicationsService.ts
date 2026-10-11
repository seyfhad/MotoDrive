import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db, isFirestoreQuotaExceeded } from '../lib/firebase';
import { DriverApplication } from '../types';
import { handleFirestoreError, OperationType } from './firestoreErrorHandler';

const APPLICATIONS_COL = 'driver_applications';
const DRIVERS_COL = 'drivers';

/**
 * Submit a complete driver registration application to 'driver_applications' collection.
 */
export const submitDriverApplication = async (
  applicationData: Omit<DriverApplication, 'id' | 'status' | 'submittedAt'> & { id?: string; rejectionCount?: number }
): Promise<string> => {
  const appId = applicationData.id || `app_${applicationData.driverId}`;
  if (isFirestoreQuotaExceeded()) {
    return appId;
  }

  const appRef = doc(db, APPLICATIONS_COL, appId);
  const now = new Date().toISOString();
  const preservedRejectionCount = typeof applicationData.rejectionCount === 'number' ? applicationData.rejectionCount : 0;

  const applicationPayload: DriverApplication = {
    ...applicationData,
    id: appId,
    status: 'pending',
    rejectionReason: '',
    rejectionCount: preservedRejectionCount,
    isPermanentlyRejected: false,
    submittedAt: now,
  };

  try {
    const writeOps = async () => {
      await setDoc(
        appRef,
        {
          ...applicationPayload,
          serverCreatedAt: serverTimestamp(),
          serverUpdatedAt: serverTimestamp(),
        },
        { merge: true }
      );

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
          rejectionReason: '',
          rejectionCount: preservedRejectionCount,
          isPermanentlyRejected: false,
          photoUrl: applicationData.documents.selfieUrl || '',
          documents: {
            ...applicationData.documents,
            status: 'pending',
            rejectionReason: '',
            submittedAt: now,
          },
          updatedAt: now,
        },
        { merge: true }
      );
    };

    await Promise.race([
      writeOps(),
      new Promise<void>((resolve) => setTimeout(resolve, 2500)),
    ]);
  } catch (err) {
    console.warn('Notice submitting driver application to Firestore:', err);
  }
  return appId;
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
 * Admin APPROVES a driver application
 */
export const approveDriverApplication = async (
  applicationId: string,
  driverId: string,
  reviewerId: string = 'admin',
  driverPhone?: string
): Promise<void> => {
  if (isFirestoreQuotaExceeded()) return;
  try {
    const now = new Date().toISOString();
    const cleanUserId = driverId.replace(/^driver-/, '');
    const appApprovalPayload = {
      status: 'approved',
      rejectionReason: '',
      rejectionCount: 0,
      isPermanentlyRejected: false,
      reviewedAt: now,
      reviewedBy: reviewerId,
      serverUpdatedAt: serverTimestamp(),
    };

    const appRef = doc(db, APPLICATIONS_COL, applicationId);
    await setDoc(appRef, appApprovalPayload, { merge: true }).catch(() => {});

    const altAppId = `app_${driverId.startsWith('driver-') ? driverId : `driver-${driverId}`}`;
    if (altAppId !== applicationId) {
      await setDoc(doc(db, APPLICATIONS_COL, altAppId), appApprovalPayload, { merge: true }).catch(() => {});
    }

    const qAppsByDriver = query(collection(db, APPLICATIONS_COL), where('driverId', '==', driverId));
    const snapAppsByDriver = await getDocs(qAppsByDriver).catch(() => null);
    if (snapAppsByDriver && !snapAppsByDriver.empty) {
      for (const d of snapAppsByDriver.docs) {
        await setDoc(d.ref, appApprovalPayload, { merge: true }).catch(() => {});
      }
    }

    if (driverPhone) {
      const qAppsByPhone = query(collection(db, APPLICATIONS_COL), where('phone', '==', driverPhone.trim()));
      const snapAppsByPhone = await getDocs(qAppsByPhone).catch(() => null);
      if (snapAppsByPhone && !snapAppsByPhone.empty) {
        for (const d of snapAppsByPhone.docs) {
          await setDoc(d.ref, appApprovalPayload, { merge: true }).catch(() => {});
        }
      }
    }

    const driverApprovalPayload = {
      status: 'approved',
      rejectionReason: '',
      rejectionCount: 0,
      isPermanentlyRejected: false,
      isAvailable: true,
      updatedAt: now,
      serverUpdatedAt: serverTimestamp(),
    };

    const driverRef = doc(db, DRIVERS_COL, driverId);
    await setDoc(driverRef, driverApprovalPayload, { merge: true });

    const prefixedDriverId = driverId.startsWith('driver-') ? driverId : `driver-${cleanUserId}`;
    if (prefixedDriverId !== driverId) {
      await setDoc(doc(db, DRIVERS_COL, prefixedDriverId), driverApprovalPayload, { merge: true }).catch(() => {});
    }

    if (driverPhone) {
      const qDrvPhone = query(collection(db, DRIVERS_COL), where('phone', '==', driverPhone.trim()));
      const snapDrvPhone = await getDocs(qDrvPhone).catch(() => null);
      if (snapDrvPhone && !snapDrvPhone.empty) {
        for (const d of snapDrvPhone.docs) {
          await setDoc(d.ref, driverApprovalPayload, { merge: true }).catch(() => {});
        }
      }
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `${APPLICATIONS_COL}/${applicationId}`);
  }
};

/**
 * Admin REJECTS a driver application (with 2-strike rule: on 2nd rejection, permanently deletes request)
 */
export const rejectDriverApplication = async (
  applicationId: string,
  driverId: string,
  reason: string,
  reviewerId: string = 'admin',
  driverPhone?: string,
  newRejectionCount: number = 1
): Promise<void> => {
  if (isFirestoreQuotaExceeded()) return;
  try {
    const now = new Date().toISOString();
    const cleanUserId = driverId.replace(/^driver-/, '');
    const isPermanent = newRejectionCount >= 2;

    const appRejectPayload = {
      status: 'rejected',
      rejectionReason: reason,
      rejectionCount: newRejectionCount,
      isPermanentlyRejected: isPermanent,
      reviewedAt: now,
      reviewedBy: reviewerId,
      serverUpdatedAt: serverTimestamp(),
    };

    const appRef = doc(db, APPLICATIONS_COL, applicationId);
    await setDoc(appRef, appRejectPayload, { merge: true }).catch(() => {});

    const altAppId = `app_${driverId.startsWith('driver-') ? driverId : `driver-${driverId}`}`;
    if (altAppId !== applicationId) {
      await setDoc(doc(db, APPLICATIONS_COL, altAppId), appRejectPayload, { merge: true }).catch(() => {});
    }

    const qAppsByDriver = query(collection(db, APPLICATIONS_COL), where('driverId', '==', driverId));
    const snapAppsByDriver = await getDocs(qAppsByDriver).catch(() => null);
    if (snapAppsByDriver && !snapAppsByDriver.empty) {
      for (const d of snapAppsByDriver.docs) {
        await setDoc(d.ref, appRejectPayload, { merge: true }).catch(() => {});
      }
    }

    if (driverPhone) {
      const qAppsByPhone = query(collection(db, APPLICATIONS_COL), where('phone', '==', driverPhone.trim()));
      const snapAppsByPhone = await getDocs(qAppsByPhone).catch(() => null);
      if (snapAppsByPhone && !snapAppsByPhone.empty) {
        for (const d of snapAppsByPhone.docs) {
          await setDoc(d.ref, appRejectPayload, { merge: true }).catch(() => {});
        }
      }
    }

    const driverRejectPayload = {
      status: 'rejected',
      rejectionReason: reason,
      rejectionCount: newRejectionCount,
      isPermanentlyRejected: isPermanent,
      isOnline: false,
      isAvailable: false,
      updatedAt: now,
      serverUpdatedAt: serverTimestamp(),
    };

    const driverRef = doc(db, DRIVERS_COL, driverId);
    await setDoc(driverRef, driverRejectPayload, { merge: true });

    const prefixedDriverId = driverId.startsWith('driver-') ? driverId : `driver-${cleanUserId}`;
    if (prefixedDriverId !== driverId) {
      await setDoc(doc(db, DRIVERS_COL, prefixedDriverId), driverRejectPayload, { merge: true }).catch(() => {});
    }

    if (driverPhone) {
      const qDrvPhone = query(collection(db, DRIVERS_COL), where('phone', '==', driverPhone.trim()));
      const snapDrvPhone = await getDocs(qDrvPhone).catch(() => null);
      if (snapDrvPhone && !snapDrvPhone.empty) {
        for (const d of snapDrvPhone.docs) {
          await setDoc(d.ref, driverRejectPayload, { merge: true }).catch(() => {});
        }
      }
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `${APPLICATIONS_COL}/${applicationId}`);
  }
};
