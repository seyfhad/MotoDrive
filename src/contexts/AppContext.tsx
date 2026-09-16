import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  UserRole,
  UserProfile,
  DriverProfile,
  Ride,
  RideStatus,
  PricingSettings,
  ServiceArea,
  Complaint,
  AppNotification,
  Coordinates,
  Rating,
} from '../types';
import {
  INITIAL_PASSENGERS,
  INITIAL_DRIVERS,
  INITIAL_RIDES,
  INITIAL_SERVICE_AREAS,
  INITIAL_COMPLAINTS,
  INITIAL_PROMO_CODES,
} from '../data/mockData';
import { DEFAULT_PRICING, calculateFare } from '../utils/pricing';
import { calculateDistanceKm, estimateDurationMinutes, interpolateRoute, calculateBearing } from '../utils/geo';

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

  // Passenger actions
  currentPassengerRide: Ride | null;
  requestRide: (
    pickup: Coordinates,
    destination: Coordinates,
    promoCode?: string
  ) => Promise<{ success: boolean; rideId?: string; error?: string }>;
  cancelRide: (rideId: string, reason: string, cancelledBy: 'passenger' | 'driver') => void;
  submitRating: (rideId: string, stars: number, tags: string[], comment?: string) => void;
  submitComplaint: (
    rideId: string | undefined,
    reason: string,
    description: string,
    targetUserId?: string
  ) => void;

  // Driver actions
  currentDriverRide: Ride | null;
  pendingDriverRideRequest: Ride | null;
  toggleDriverOnline: (driverId: string, isOnline: boolean) => { success: boolean; error?: string };
  acceptRide: (rideId: string, driverId: string) => Promise<{ success: boolean; error?: string }>;
  rejectRide: (rideId: string, driverId: string) => void;
  advanceRideStatus: (rideId: string) => void;
  updateDriverLocation: (driverId: string, location: Coordinates, heading?: number) => void;
  registerDriver: (driverData: Partial<DriverProfile>) => { success: boolean; driverId: string };

  // Admin actions
  approveDriver: (driverId: string) => void;
  rejectDriver: (driverId: string, reason: string) => void;
  suspendDriver: (driverId: string) => void;
  updatePricing: (newPricing: PricingSettings) => void;
  resolveComplaint: (complaintId: string, notes: string) => void;
  broadcastNotification: (title: string, body: string, targetRole?: UserRole) => void;

  // Simulator controls
  isAutoDriverSimulation: boolean;
  setIsAutoDriverSimulation: (val: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_PREFIX = 'motodz_v1_';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Current active role for testing / viewing
  const [currentRole, setCurrentRole] = useState<UserRole>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'role');
    return (saved as UserRole) || 'passenger';
  });

  const [passengers, setPassengers] = useState<UserProfile[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'passengers');
    return saved ? JSON.parse(saved) : INITIAL_PASSENGERS;
  });

  const [drivers, setDrivers] = useState<DriverProfile[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'drivers');
    return saved ? JSON.parse(saved) : INITIAL_DRIVERS;
  });

  const [rides, setRides] = useState<Ride[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'rides');
    return saved ? JSON.parse(saved) : INITIAL_RIDES;
  });

  const [pricing, setPricing] = useState<PricingSettings>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'pricing');
    return saved ? JSON.parse(saved) : DEFAULT_PRICING;
  });

  const [serviceAreas, setServiceAreas] = useState<ServiceArea[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'service_areas');
    return saved ? JSON.parse(saved) : INITIAL_SERVICE_AREAS;
  });

  const [complaints, setComplaints] = useState<Complaint[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'complaints');
    return saved ? JSON.parse(saved) : INITIAL_COMPLAINTS;
  });

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [isAutoDriverSimulation, setIsAutoDriverSimulation] = useState<boolean>(true);

  // Active user profiles
  const [activePassenger, setActivePassenger] = useState<UserProfile>(() => passengers[0] || INITIAL_PASSENGERS[0]);
  const [activeDriver, setActiveDriver] = useState<DriverProfile>(() => drivers[0] || INITIAL_DRIVERS[0]);

  // Keep active driver/passenger in sync with state lists
  useEffect(() => {
    const foundP = passengers.find(p => p.id === activePassenger.id);
    if (foundP) setActivePassenger(foundP);
  }, [passengers]);

  useEffect(() => {
    const foundD = drivers.find(d => d.id === activeDriver.id);
    if (foundD) setActiveDriver(foundD);
  }, [drivers]);

  // Local storage persistence
  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'role', currentRole);
  }, [currentRole]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'passengers', JSON.stringify(passengers));
  }, [passengers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'drivers', JSON.stringify(drivers));
  }, [drivers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'rides', JSON.stringify(rides));
  }, [rides]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'pricing', JSON.stringify(pricing));
  }, [pricing]);

  // Derive Current Rides
  const currentPassengerRide = rides.find(
    r =>
      r.passengerId === activePassenger.id &&
      !['completed', 'cancelled_by_passenger', 'cancelled_by_driver', 'expired'].includes(r.status)
  ) || null;

  const currentDriverRide = rides.find(
    r =>
      r.driverId === activeDriver.id &&
      !['completed', 'cancelled_by_passenger', 'cancelled_by_driver', 'expired'].includes(r.status)
  ) || null;

  // Driver incoming requests (status = 'searching' and driver is online & approved)
  const pendingDriverRideRequest = (activeDriver.isOnline && activeDriver.status === 'approved' && !currentDriverRide)
    ? rides.find(r => r.status === 'searching') || null
    : null;

  // Add Notification Helper
  const addNotification = useCallback((
    recipientId: string,
    recipientRole: UserRole,
    title: string,
    body: string,
    type: AppNotification['type'] = 'ride_update',
    data?: Record<string, any>
  ) => {
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
    setNotifications(prev => [newNotif, ...prev]);
  }, []);

  // Passenger: Request Ride
  const requestRide = async (
    pickup: Coordinates,
    destination: Coordinates,
    promoCode?: string
  ): Promise<{ success: boolean; rideId?: string; error?: string }> => {
    if (currentPassengerRide) {
      return { success: false, error: 'لديك رحلة جارية بالفعل!' };
    }

    const distanceKm = calculateDistanceKm(pickup, destination);
    const estimatedDuration = estimateDurationMinutes(distanceKm);

    let discountPercent = 0;
    if (promoCode) {
      const foundPromo = INITIAL_PROMO_CODES.find(
        p => p.code.toUpperCase() === promoCode.toUpperCase() && p.isActive
      );
      if (foundPromo) discountPercent = foundPromo.discountPercent;
    }

    const fare = calculateFare(distanceKm, estimatedDuration, pricing, discountPercent);
    const rideId = 'RIDE-DZ-' + Math.floor(1000 + Math.random() * 9000);

    const newRide: Ride = {
      id: rideId,
      passengerId: activePassenger.id,
      passengerName: activePassenger.name,
      passengerPhone: activePassenger.phone,
      passengerPhoto: activePassenger.photoUrl,
      passengerRating: 4.9,
      status: 'searching',
      pickup,
      destination,
      distanceKm,
      estimatedDurationMins: estimatedDuration,
      estimatedPrice: fare.roundedPrice,
      platformCommission: fare.platformCommission,
      driverEarning: fare.driverEarning,
      paymentMethod: 'cash',
      paymentStatus: 'pending',
      requestedAt: new Date().toISOString(),
    };

    setRides(prev => [newRide, ...prev]);

    // Broadcast to online drivers
    addNotification(
      'all_drivers',
      'driver',
      '🏍️ طلب رحلة جديد قريب!',
      `من ${pickup.name || 'الموقع المحدد'} إلى ${destination.name || 'الوجهة'} (${fare.roundedPrice} د.ج)`
    );

    return { success: true, rideId };
  };

  // Driver: Toggle Online/Offline
  const toggleDriverOnline = (driverId: string, isOnline: boolean): { success: boolean; error?: string } => {
    const driver = drivers.find(d => d.id === driverId);
    if (!driver) return { success: false, error: 'السائق غير موجود' };

    if (isOnline && driver.status !== 'approved') {
      return {
        success: false,
        error: 'لا يمكنك استقبال الرحلات حتى تتم مراجعة وثائقك والموافقة على حسابك من قبل الإدارة.',
      };
    }

    setDrivers(prev =>
      prev.map(d => (d.id === driverId ? { ...d, isOnline, isAvailable: isOnline } : d))
    );

    return { success: true };
  };

  // Driver / Simulator: Transactional Accept Ride
  const acceptRide = async (rideId: string, driverId: string): Promise<{ success: boolean; error?: string }> => {
    const driver = drivers.find(d => d.id === driverId);
    if (!driver) return { success: false, error: 'السائق غير مسجل' };
    if (driver.status !== 'approved') return { success: false, error: 'حساب السائق غير معتمد' };

    let accepted = false;

    setRides(prev => {
      const targetRide = prev.find(r => r.id === rideId);
      // Concurrency check: If status is not 'searching', another driver accepted first!
      if (!targetRide || targetRide.status !== 'searching') {
        return prev;
      }

      accepted = true;
      return prev.map(r => {
        if (r.id === rideId) {
          return {
            ...r,
            status: 'accepted',
            driverId: driver.id,
            driverName: driver.name,
            driverPhone: driver.phone,
            driverPhoto: driver.photoUrl,
            driverRating: driver.rating,
            driverMotorcycle: driver.motorcycle,
            driverLocation: driver.location,
            acceptedAt: new Date().toISOString(),
          };
        }
        return r;
      });
    });

    if (!accepted) {
      return { success: false, error: 'عذراً! تم قبول هذا الطلب من قبل سائق آخر.' };
    }

    // Update driver status
    setDrivers(prev =>
      prev.map(d => (d.id === driverId ? { ...d, currentRideId: rideId, isAvailable: false } : d))
    );

    // Notify passenger
    const ride = rides.find(r => r.id === rideId);
    if (ride) {
      addNotification(
        ride.passengerId,
        'passenger',
        '✅ تم قبول رحلتك!',
        `السائق ${driver.name} يقود دراجة ${driver.motorcycle.brand} في الطريق إليك.`
      );
    }

    return { success: true };
  };

  // Driver: Reject Ride Request
  const rejectRide = (rideId: string, driverId: string) => {
    // For MVP simulator: just dismiss from this driver's screen
    addNotification(driverId, 'driver', 'تم رفض الطلب', 'تم إلغاء التنبيه للرحلة');
  };

  // Advance Ride Status (Driver moves the flow or automated)
  const advanceRideStatus = (rideId: string) => {
    setRides(prev => {
      return prev.map(r => {
        if (r.id !== rideId) return r;

        let nextStatus: RideStatus = r.status;
        const updates: Partial<Ride> = {};

        if (r.status === 'accepted') {
          nextStatus = 'driver_arriving';
          updates.driverLocation = r.driverLocation;
        } else if (r.status === 'driver_arriving') {
          nextStatus = 'driver_arrived';
          updates.arrivedAt = new Date().toISOString();
        } else if (r.status === 'driver_arrived') {
          nextStatus = 'trip_started';
          updates.startedAt = new Date().toISOString();
        } else if (r.status === 'trip_started') {
          nextStatus = 'completed';
          updates.completedAt = new Date().toISOString();
          updates.paymentStatus = 'paid';
          updates.actualDurationMins = r.estimatedDurationMins;
          updates.finalPrice = r.estimatedPrice;
        }

        const updatedRide = { ...r, ...updates, status: nextStatus };

        // Send notifications on milestones
        if (nextStatus === 'driver_arrived') {
          addNotification(r.passengerId, 'passenger', '📍 السائق وصل!', 'السائق بانتظارك في موقع الانطلاق.');
        } else if (nextStatus === 'trip_started') {
          addNotification(r.passengerId, 'passenger', '🏍️ انطلقت الرحلة', 'نتمنى لك رحلة آمنة ومريحة مع MotoDZ.');
        } else if (nextStatus === 'completed') {
          addNotification(
            r.passengerId,
            'passenger',
            '🎉 تم الوصول بنجاح',
            `المبلغ المستحق نقدًا: ${r.estimatedPrice} د.ج. يرجى تقييم السائق.`
          );
        }

        return updatedRide;
      });
    });

    // If completed, update driver stats and release driver
    const targetRide = rides.find(r => r.id === rideId);
    if (targetRide && targetRide.status === 'trip_started') {
      setDrivers(prev =>
        prev.map(d => {
          if (d.id === targetRide.driverId) {
            return {
              ...d,
              totalTrips: d.totalTrips + 1,
              currentRideId: null,
              isAvailable: true,
            };
          }
          return d;
        })
      );
    }
  };

  // Cancel Ride
  const cancelRide = (rideId: string, reason: string, cancelledBy: 'passenger' | 'driver') => {
    setRides(prev =>
      prev.map(r => {
        if (r.id === rideId) {
          const status: RideStatus =
            cancelledBy === 'passenger' ? 'cancelled_by_passenger' : 'cancelled_by_driver';
          return {
            ...r,
            status,
            cancelledBy,
            cancellationReason: reason,
            cancelledAt: new Date().toISOString(),
          };
        }
        return r;
      })
    );

    // Free driver if assigned
    const ride = rides.find(r => r.id === rideId);
    if (ride?.driverId) {
      setDrivers(prev =>
        prev.map(d =>
          d.id === ride.driverId ? { ...d, currentRideId: null, isAvailable: true } : d
        )
      );
    }

    if (cancelledBy === 'passenger') {
      setPassengers(prev =>
        prev.map(p =>
          p.id === activePassenger.id
            ? { ...p, cancellationCount: p.cancellationCount + 1 }
            : p
        )
      );
    }
  };

  // Update Driver Location & Live Bearing
  const updateDriverLocation = (driverId: string, location: Coordinates, heading?: number) => {
    setDrivers(prev =>
      prev.map(d =>
        d.id === driverId
          ? {
              ...d,
              location,
              heading: heading !== undefined ? heading : d.heading,
              updatedAt: new Date().toISOString(),
            }
          : d
      )
    );

    // Also update in any active ride
    setRides(prev =>
      prev.map(r => (r.driverId === driverId ? { ...r, driverLocation: location } : r))
    );
  };

  // Submit Rating
  const submitRating = (rideId: string, stars: number, tags: string[], comment?: string) => {
    const ride = rides.find(r => r.id === rideId);
    if (!ride || !ride.driverId) return;

    const newRating: Rating = {
      id: 'RAT-' + Math.random().toString(36).substring(2, 9),
      rideId,
      passengerId: ride.passengerId,
      driverId: ride.driverId,
      rating: stars,
      tags,
      comment,
      createdAt: new Date().toISOString(),
    };

    setRatings(prev => [newRating, ...prev]);

    // Recalculate driver average rating
    setDrivers(prev =>
      prev.map(d => {
        if (d.id === ride.driverId) {
          const newCount = d.ratingCount + 1;
          const newRatingVal = Math.round(((d.rating * d.ratingCount + stars) / newCount) * 100) / 100;
          return {
            ...d,
            rating: newRatingVal,
            ratingCount: newCount,
          };
        }
        return d;
      })
    );
  };

  // Submit Complaint
  const submitComplaint = (
    rideId: string | undefined,
    reason: string,
    description: string,
    targetUserId?: string
  ) => {
    const isPassenger = currentRole === 'passenger';
    const newComplaint: Complaint = {
      id: 'CMP-' + Math.floor(100 + Math.random() * 900),
      rideId,
      submittedBy: isPassenger ? 'passenger' : 'driver',
      userId: isPassenger ? activePassenger.id : activeDriver.id,
      userName: isPassenger ? activePassenger.name : activeDriver.name,
      targetUserId,
      reason,
      description,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    setComplaints(prev => [newComplaint, ...prev]);
    addNotification('admin', 'admin', '⚠️ شكوى جديدة واردة', `${newComplaint.userName}: ${reason}`);
  };

  // Driver Self-Registration
  const registerDriver = (driverData: Partial<DriverProfile>): { success: boolean; driverId: string } => {
    const newDriverId = 'driver-' + Math.random().toString(36).substring(2, 8);
    const newDriver: DriverProfile = {
      id: newDriverId,
      userId: 'user-' + newDriverId,
      name: driverData.name || 'سائق جديد',
      phone: driverData.phone || '',
      email: driverData.email,
      photoUrl: driverData.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      wilaya: driverData.wilaya || 'الجزائر العاصمة',
      municipality: driverData.municipality || 'الجزائر',
      birthDate: driverData.birthDate,
      status: 'pending', // Requires admin review
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

    setDrivers(prev => [newDriver, ...prev]);
    setActiveDriver(newDriver);
    addNotification('admin', 'admin', '📋 تسجيل سائق جديد', `السائق ${newDriver.name} ينتظر مراجعة الوثائق.`);
    return { success: true, driverId: newDriverId };
  };

  // Admin Actions
  const approveDriver = (driverId: string) => {
    setDrivers(prev =>
      prev.map(d => {
        if (d.id === driverId) {
          return {
            ...d,
            status: 'approved',
            documents: {
              ...d.documents,
              status: 'approved',
              reviewedBy: 'Admin MotoDZ',
              reviewedAt: new Date().toISOString(),
            },
          };
        }
        return d;
      })
    );
    addNotification(
      driverId,
      'driver',
      '🎉 تم قبول حسابك!',
      'تهانينا! تمت مراجعة وثائقك بنجاح. يمكنك الآن تفعيل وضع Online والبدء في استقبال الرحلات.'
    );
  };

  const rejectDriver = (driverId: string, reason: string) => {
    setDrivers(prev =>
      prev.map(d => {
        if (d.id === driverId) {
          return {
            ...d,
            status: 'rejected',
            rejectionReason: reason,
            documents: {
              ...d.documents,
              status: 'rejected',
              rejectionReason: reason,
              reviewedBy: 'Admin MotoDZ',
              reviewedAt: new Date().toISOString(),
            },
          };
        }
        return d;
      })
    );
    addNotification(driverId, 'driver', '❌ لم يتم قبول الحساب', `سبب الرفض: ${reason}`);
  };

  const suspendDriver = (driverId: string) => {
    setDrivers(prev =>
      prev.map(d => (d.id === driverId ? { ...d, status: 'suspended', isOnline: false } : d))
    );
  };

  const updatePricing = (newPricing: PricingSettings) => {
    setPricing(newPricing);
    addNotification('admin', 'admin', '⚙️ تم تحديث الأسعار', 'تم حفظ إعدادات التسعير والعمولة الجديدة.');
  };

  const resolveComplaint = (complaintId: string, notes: string) => {
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

  // -------------------------------------------------------------
  // Automatic Simulation Loop for Live Driver Movement & Ride Flow
  // -------------------------------------------------------------
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    // 1. Auto Accept if in Passenger Mode and simulation enabled
    if (isAutoDriverSimulation && currentRole === 'passenger') {
      const searchingRide = rides.find(r => r.status === 'searching');
      if (searchingRide) {
        const timer = setTimeout(() => {
          // Find first available approved driver
          const availableDriver = drivers.find(d => d.status === 'approved' && d.isOnline);
          if (availableDriver) {
            acceptRide(searchingRide.id, availableDriver.id);
          }
        }, 3500);
        return () => clearTimeout(timer);
      }
    }
  }, [rides, isAutoDriverSimulation, currentRole, drivers]);

  // 2. Smooth live GPS interpolation for active ride
  useEffect(() => {
    const activeRide = rides.find(
      r => r.status === 'driver_arriving' || r.status === 'trip_started'
    );

    if (!activeRide || !activeRide.driverId) return;

    const driver = drivers.find(d => d.id === activeRide.driverId);
    if (!driver) return;

    // Route target: if arriving -> pickup, if started -> destination
    const target = activeRide.status === 'driver_arriving' ? activeRide.pickup : activeRide.destination;
    const startLoc = driver.location;

    // Generate small route path
    const routePoints = interpolateRoute(startLoc, target, 12);
    let step = 0;

    const interval = setInterval(() => {
      if (step < routePoints.length) {
        const nextCoord = routePoints[step];
        const prevCoord = step > 0 ? routePoints[step - 1] : startLoc;
        const bearing = calculateBearing(prevCoord, nextCoord);

        updateDriverLocation(activeRide.driverId!, nextCoord, bearing);
        step++;
      } else {
        clearInterval(interval);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [rides.map(r => r.status).join(',')]);

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

        currentPassengerRide,
        requestRide,
        cancelRide,
        submitRating,
        submitComplaint,

        currentDriverRide,
        pendingDriverRideRequest,
        toggleDriverOnline,
        acceptRide,
        rejectRide,
        advanceRideStatus,
        updateDriverLocation,
        registerDriver,

        approveDriver,
        rejectDriver,
        suspendDriver,
        updatePricing,
        resolveComplaint,
        broadcastNotification,

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
