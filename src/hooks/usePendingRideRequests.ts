import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { RideRequest } from '../types';

/**
 * Custom hook for drivers to listen to 'ride_requests' in real-time
 * using Firestore onSnapshot listener directly inside the app without FCM/Push notifications.
 * Enforces clean memory management by calling unsubscribe() on unmount or offline toggle.
 */
export function usePendingRideRequests(isOnline: boolean, isApproved: boolean) {
  const [requests, setRequests] = useState<RideRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Only listen when driver is actively online and approved
    if (!isOnline || !isApproved) {
      setRequests([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(
      collection(db, 'ride_requests'),
      where('status', '==', 'pending')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const liveRequests = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        })) as RideRequest[];
        setRequests(liveRequests);
        setLoading(false);
      },
      (error) => {
        console.warn('Real-time ride_requests onSnapshot notice:', error.message);
        setLoading(false);
      }
    );

    // Clean memory management: always call unsubscribe() on unmount or dependency change
    return () => {
      unsubscribe();
    };
  }, [isOnline, isApproved]);

  return { requests, loading };
}

export default usePendingRideRequests;
