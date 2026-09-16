import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  updateDoc,
  addDoc,
  Timestamp,
  runTransaction,
  Query,
  QueryConstraint,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  UserProfile,
  DriverProfile,
  Ride,
  Rating,
  Complaint,
  PricingSettings,
  ServiceArea,
} from '../types';

// ============================================
// Users Collection
// ============================================

export async function saveUserProfile(userId: string, profile: Partial<UserProfile>): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {
      ...profile,
      updatedAt: Timestamp.now(),
    }, { merge: true });
  } catch (error) {
    console.error('Error saving user profile:', error);
    throw error;
  }
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      return userSnap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
}

// ============================================
// Drivers Collection
// ============================================

export async function saveDriverProfile(driverId: string, profile: Partial<DriverProfile>): Promise<void> {
  try {
    const driverRef = doc(db, 'drivers', driverId);
    await setDoc(driverRef, {
      ...profile,
      updatedAt: Timestamp.now(),
    }, { merge: true });
  } catch (error) {
    console.error('Error saving driver profile:', error);
    throw error;
  }
}

export async function getDriverProfile(driverId: string): Promise<DriverProfile | null> {
  try {
    const driverRef = doc(db, 'drivers', driverId);
    const driverSnap = await getDoc(driverRef);
    if (driverSnap.exists()) {
      return driverSnap.data() as DriverProfile;
    }
    return null;
  } catch (error) {
    console.error('Error getting driver profile:', error);
    throw error;
  }
}

export async function getApprovedDrivers(): Promise<DriverProfile[]> {
  try {
    const driversRef = collection(db, 'drivers');
    const q = query(driversRef, where('status', '==', 'approved'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as DriverProfile);
  } catch (error) {
    console.error('Error getting approved drivers:', error);
    throw error;
  }
}

export async function updateDriverOnlineStatus(driverId: string, isOnline: boolean): Promise<void> {
  try {
    const driverRef = doc(db, 'drivers', driverId);
    await updateDoc(driverRef, {
      isOnline,
      isAvailable: isOnline,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error updating driver online status:', error);
    throw error;
  }
}

export async function updateDriverLocation(
  driverId: string,
  location: { lat: number; lng: number; address?: string },
  heading?: number
): Promise<void> {
  try {
    const driverRef = doc(db, 'drivers', driverId);
    await updateDoc(driverRef, {
      location,
      heading: heading !== undefined ? heading : null,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error updating driver location:', error);
    throw error;
  }
}

// ============================================
// Rides Collection
// ============================================

export async function createRide(ride: Partial<Ride>): Promise<string> {
  try {
    const ridesRef = collection(db, 'rides');
    const docRef = await addDoc(ridesRef, {
      ...ride,
      requestedAt: Timestamp.now(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating ride:', error);
    throw error;
  }
}

export async function getRide(rideId: string): Promise<Ride | null> {
  try {
    const rideRef = doc(db, 'rides', rideId);
    const rideSnap = await getDoc(rideRef);
    if (rideSnap.exists()) {
      return rideSnap.data() as Ride;
    }
    return null;
  } catch (error) {
    console.error('Error getting ride:', error);
    throw error;
  }
}

export async function updateRideStatus(rideId: string, status: string, updates?: Record<string, any>): Promise<void> {
  try {
    const rideRef = doc(db, 'rides', rideId);
    await updateDoc(rideRef, {
      status,
      ...updates,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error updating ride status:', error);
    throw error;
  }
}

export async function acceptRideTransaction(
  rideId: string,
  driverId: string,
  driverData: any
): Promise<boolean> {
  try {
    const result = await runTransaction(db, async (transaction) => {
      const rideRef = doc(db, 'rides', rideId);
      const rideDoc = await transaction.get(rideRef);

      if (!rideDoc.exists()) {
        throw new Error('Ride not found');
      }

      const ride = rideDoc.data();
      if (ride.status !== 'searching') {
        // Another driver already accepted this ride
        return false;
      }

      // Update ride with driver info
      transaction.update(rideRef, {
        status: 'accepted',
        driverId,
        driverName: driverData.name,
        driverPhone: driverData.phone,
        driverPhoto: driverData.photoUrl,
        driverRating: driverData.rating,
        driverMotorcycle: driverData.motorcycle,
        driverLocation: driverData.location,
        acceptedAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      // Update driver availability
      const driverRef = doc(db, 'drivers', driverId);
      transaction.update(driverRef, {
        currentRideId: rideId,
        isAvailable: false,
        updatedAt: Timestamp.now(),
      });

      return true;
    });

    return result;
  } catch (error) {
    console.error('Error accepting ride (transaction):', error);
    throw error;
  }
}

export async function getPassengerRides(passengerId: string): Promise<Ride[]> {
  try {
    const ridesRef = collection(db, 'rides');
    const q = query(ridesRef, where('passengerId', '==', passengerId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ride));
  } catch (error) {
    console.error('Error getting passenger rides:', error);
    throw error;
  }
}

export async function getSearchingRides(): Promise<Ride[]> {
  try {
    const ridesRef = collection(db, 'rides');
    const q = query(ridesRef, where('status', '==', 'searching'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ride));
  } catch (error) {
    console.error('Error getting searching rides:', error);
    throw error;
  }
}

// ============================================
// Ratings Collection
// ============================================

export async function createRating(rating: Partial<Rating>): Promise<void> {
  try {
    const ratingsRef = collection(db, 'ratings');
    await addDoc(ratingsRef, {
      ...rating,
      createdAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error creating rating:', error);
    throw error;
  }
}

export async function getDriverRatings(driverId: string): Promise<Rating[]> {
  try {
    const ratingsRef = collection(db, 'ratings');
    const q = query(ratingsRef, where('driverId', '==', driverId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as Rating);
  } catch (error) {
    console.error('Error getting driver ratings:', error);
    throw error;
  }
}

// ============================================
// Complaints Collection
// ============================================

export async function createComplaint(complaint: Partial<Complaint>): Promise<void> {
  try {
    const complaintsRef = collection(db, 'complaints');
    await addDoc(complaintsRef, {
      ...complaint,
      createdAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error creating complaint:', error);
    throw error;
  }
}

export async function getAllComplaints(): Promise<Complaint[]> {
  try {
    const complaintsRef = collection(db, 'complaints');
    const querySnapshot = await getDocs(complaintsRef);
    return querySnapshot.docs.map(doc => doc.data() as Complaint);
  } catch (error) {
    console.error('Error getting complaints:', error);
    throw error;
  }
}

export async function resolveComplaint(complaintId: string, notes: string): Promise<void> {
  try {
    const complaintRef = doc(db, 'complaints', complaintId);
    await updateDoc(complaintRef, {
      status: 'resolved',
      adminNotes: notes,
      resolvedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error resolving complaint:', error);
    throw error;
  }
}

// ============================================
// Pricing Settings Collection (Admin)
// ============================================

export async function getPricingSettings(): Promise<PricingSettings | null> {
  try {
    const pricingRef = doc(db, 'settings', 'pricing');
    const pricingSnap = await getDoc(pricingRef);
    if (pricingSnap.exists()) {
      return pricingSnap.data() as PricingSettings;
    }
    return null;
  } catch (error) {
    console.error('Error getting pricing settings:', error);
    throw error;
  }
}

export async function updatePricingSettings(pricing: Partial<PricingSettings>): Promise<void> {
  try {
    const pricingRef = doc(db, 'settings', 'pricing');
    await setDoc(pricingRef, {
      ...pricing,
      updatedAt: Timestamp.now(),
    }, { merge: true });
  } catch (error) {
    console.error('Error updating pricing settings:', error);
    throw error;
  }
}

// ============================================
// Service Areas Collection
// ============================================

export async function getServiceAreas(): Promise<ServiceArea[]> {
  try {
    const areasRef = collection(db, 'serviceAreas');
    const querySnapshot = await getDocs(areasRef);
    return querySnapshot.docs.map(doc => doc.data() as ServiceArea);
  } catch (error) {
    console.error('Error getting service areas:', error);
    throw error;
  }
}
