import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { DriverProfile, Ride } from '../types';

export interface SupabaseNotice {
  id: string;
  title: string;
  message: string;
  type?: 'info' | 'warning' | 'promo';
}

/**
 * Service to manage data fetching for Passenger and Driver views
 * fully powered by Firebase Firestore.
 */
export const supabaseService = {
  /**
   * Fetch registered drivers from Firestore
   */
  async getDrivers(): Promise<any[]> {
    try {
      const q = query(collection(db, 'drivers'), limit(30));
      const snap = await getDocs(q);
      return snap.docs.map(doc => ({ id: doc.id, ...(doc.data() as Record<string, any>) }));
    } catch (err) {
      console.warn('Notice fetching Firestore drivers:', err);
      return [];
    }
  },

  /**
   * Fetch rides / trips from Firestore
   */
  async getRides(userId?: string, role: 'passenger' | 'driver' = 'passenger'): Promise<any[]> {
    try {
      const col = collection(db, 'rides');
      let q;
      if (userId) {
        const field = role === 'passenger' ? 'passengerId' : 'driverId';
        q = query(col, where(field, '==', userId), limit(30));
      } else {
        q = query(col, limit(30));
      }

      const snap = await getDocs(q);
      return snap.docs.map(doc => ({ id: doc.id, ...(doc.data() as Record<string, any>) }));
    } catch (err) {
      console.warn('Notice fetching Firestore rides:', err);
      return [];
    }
  },

  /**
   * Fetch driver earnings summary from Firestore rides
   */
  async getDriverEarnings(driverId?: string): Promise<{
    totalEarningsDZD: number;
    completedTripsCount: number;
    rating: number;
  } | null> {
    try {
      if (!driverId) return null;
      const q = query(
        collection(db, 'rides'),
        where('driverId', '==', driverId),
        where('status', '==', 'completed')
      );
      const snap = await getDocs(q);
      const rides = snap.docs.map(d => d.data() as Ride);

      const totalEarningsDZD = rides.reduce(
        (sum, item) => sum + (item.driverEarning || Math.round((item.finalPrice || 0) * 0.85)),
        0
      );

      return {
        totalEarningsDZD,
        completedTripsCount: rides.length,
        rating: 5.0,
      };
    } catch (err) {
      console.warn('Notice calculating driver earnings:', err);
      return null;
    }
  },

  /**
   * Check connection status to Firebase Firestore
   */
  async checkConnection(): Promise<boolean> {
    try {
      const q = query(collection(db, 'drivers'), limit(1));
      await getDocs(q);
      return true;
    } catch {
      return false;
    }
  },
};
