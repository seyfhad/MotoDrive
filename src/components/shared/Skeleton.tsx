import React from 'react';

interface SkeletonProps {
  className?: string;
  animate?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', animate = true }) => {
  return (
    <div
      className={`bg-slate-800/80 rounded-xl ${
        animate
          ? 'animate-pulse bg-gradient-to-r from-slate-800 via-slate-700/50 to-slate-800 bg-[length:200%_100%]'
          : ''
      } ${className}`}
    />
  );
};

/**
 * Passenger Dashboard Skeleton Loader:
 * Mirrors the Booking Card in PassengerHome with pickup/destination inputs, pricing banner, and booking button.
 */
export const PassengerDashboardSkeleton: React.FC = () => {
  return (
    <div
      data-testid="passenger-dashboard-skeleton"
      className="bg-slate-900 border border-slate-800/90 rounded-3xl p-5 shadow-2xl space-y-4 animate-in fade-in duration-300"
    >
      {/* Header Greeting */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="w-40 h-5 rounded-lg" />
          <Skeleton className="w-56 h-3 rounded-md" />
        </div>
        <Skeleton className="w-10 h-10 rounded-2xl" />
      </div>

      {/* Pickup & Destination Interactive Fields */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 space-y-3">
        {/* Pickup row */}
        <div className="flex items-center gap-3">
          <Skeleton className="w-7 h-7 rounded-full shrink-0" />
          <div className="space-y-1.5 flex-1">
            <Skeleton className="w-16 h-2.5 rounded" />
            <Skeleton className="w-48 h-3.5 rounded-md" />
          </div>
          <Skeleton className="w-14 h-7 rounded-xl shrink-0" />
        </div>

        <div className="h-px bg-slate-800/80 mx-2" />

        {/* Destination row */}
        <div className="flex items-center gap-3">
          <Skeleton className="w-7 h-7 rounded-full shrink-0" />
          <div className="space-y-1.5 flex-1">
            <Skeleton className="w-24 h-2.5 rounded" />
            <Skeleton className="w-36 h-3.5 rounded-md" />
          </div>
        </div>
      </div>

      {/* Pricing & Policy Banner */}
      <div className="flex items-center justify-between px-3 py-2.5 bg-slate-950/70 border border-slate-800/80 rounded-xl">
        <Skeleton className="w-48 h-3 rounded-md" />
        <Skeleton className="w-16 h-3 rounded-md" />
      </div>

      {/* Main Call to Action Button */}
      <Skeleton className="w-full h-12 rounded-2xl" />
    </div>
  );
};

/**
 * Passenger Trip History Skeleton Loader:
 * Mirrors the Recent Trips list in PassengerHome and PassengerTrips.
 */
export const PassengerTripHistorySkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <div
      data-testid="passenger-trip-history-skeleton"
      className="bg-slate-900/90 border border-slate-800/80 rounded-3xl p-4 space-y-3 animate-in fade-in duration-300"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Skeleton className="w-4 h-4 rounded-full" />
          <Skeleton className="w-24 h-3.5 rounded-md" />
        </div>
        <Skeleton className="w-16 h-2.5 rounded-md" />
      </div>

      {/* Trips list items */}
      <div className="space-y-2">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="p-3 bg-slate-950/70 border border-slate-800/60 rounded-2xl flex items-center justify-between"
          >
            <div className="flex items-center gap-2.5 flex-1">
              <Skeleton className="w-6 h-6 rounded-lg shrink-0" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="w-3/4 h-3.5 rounded-md" />
                <Skeleton className="w-1/3 h-2.5 rounded" />
              </div>
            </div>
            <div className="space-y-1 text-left shrink-0 pl-2">
              <Skeleton className="w-16 h-4 rounded-md ml-auto" />
              <Skeleton className="w-10 h-2.5 rounded ml-auto" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Driver Dashboard Skeleton Loader:
 * Mirrors the Driver Main Control Card in DriverHome (Greeting, motorcycle tag, toggle online button, and KPI metrics).
 */
export const DriverDashboardSkeleton: React.FC = () => {
  return (
    <div
      data-testid="driver-dashboard-skeleton"
      className="bg-slate-900 border border-slate-800/90 rounded-3xl p-5 shadow-2xl space-y-4 animate-in fade-in duration-300"
    >
      {/* Header with Driver info, motorcycle and rating */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="w-36 h-5 rounded-lg" />
          <Skeleton className="w-44 h-3.5 rounded-md" />
        </div>

        <div className="flex items-center gap-1.5">
          <Skeleton className="w-20 h-8 rounded-xl" />
          <Skeleton className="w-14 h-8 rounded-xl" />
        </div>
      </div>

      {/* Big Online / Offline Toggle Button */}
      <Skeleton className="w-full h-14 rounded-2xl" />

      {/* KPI Dashboard (Today's Trips and Net Earnings) */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 space-y-2">
          <div className="flex items-center gap-1.5">
            <Skeleton className="w-3.5 h-3.5 rounded" />
            <Skeleton className="w-16 h-3 rounded" />
          </div>
          <Skeleton className="w-16 h-7 rounded-lg" />
          <Skeleton className="w-20 h-2.5 rounded" />
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 space-y-2">
          <div className="flex items-center gap-1.5">
            <Skeleton className="w-3.5 h-3.5 rounded" />
            <Skeleton className="w-16 h-3 rounded" />
          </div>
          <Skeleton className="w-24 h-7 rounded-lg" />
          <Skeleton className="w-28 h-2.5 rounded" />
        </div>
      </div>
    </div>
  );
};

/**
 * Driver Trip History Skeleton Loader:
 * Mirrors the Recent Completed Trips card in DriverHome.
 */
export const DriverTripHistorySkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <div
      data-testid="driver-trip-history-skeleton"
      className="bg-slate-900 border border-slate-800/90 rounded-3xl p-4 space-y-3 animate-in fade-in duration-300"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <Skeleton className="w-28 h-3.5 rounded-md" />
        <Skeleton className="w-20 h-2.5 rounded-md" />
      </div>

      {/* Trip items */}
      <div className="space-y-2">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="p-3 bg-slate-950/70 border border-slate-800/60 rounded-2xl flex items-center justify-between"
          >
            <div className="space-y-1.5 flex-1 truncate">
              <Skeleton className="w-3/4 h-3.5 rounded-md" />
              <Skeleton className="w-1/2 h-2.5 rounded" />
            </div>
            <Skeleton className="w-16 h-5 rounded-lg shrink-0 mr-3" />
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Legacy/General Purpose Skeletons
 */
export const TripCardSkeleton: React.FC = () => {
  return (
    <div className="bg-slate-900 border border-slate-800/90 rounded-3xl p-4 space-y-3.5 shadow-lg relative overflow-hidden">
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <Skeleton className="w-16 h-4 rounded-md" />
          <Skeleton className="w-14 h-5 rounded-full" />
        </div>
        <Skeleton className="w-20 h-3 rounded-md" />
      </div>

      <div className="space-y-2 py-1">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/40 animate-pulse shrink-0" />
          <Skeleton className="h-4 w-3/4 rounded-md" />
        </div>
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500/40 animate-pulse shrink-0" />
          <Skeleton className="h-4 w-1/2 rounded-md" />
        </div>
      </div>

      <div className="pt-2.5 border-t border-slate-800/80 flex items-center justify-between">
        <div className="space-y-1.5">
          <Skeleton className="w-24 h-4 rounded-md" />
          <Skeleton className="w-16 h-3 rounded-md" />
        </div>
        <div className="text-left space-y-1">
          <Skeleton className="w-20 h-5 rounded-lg" />
          <Skeleton className="w-12 h-2.5 rounded-md ml-auto" />
        </div>
      </div>
    </div>
  );
};

export const StatCardSkeleton: React.FC = () => {
  return (
    <div className="bg-slate-900 border border-slate-800/90 rounded-3xl p-4 space-y-2.5 shadow-lg">
      <div className="flex items-center justify-between">
        <Skeleton className="w-20 h-3.5 rounded-md" />
        <Skeleton className="w-8 h-8 rounded-xl" />
      </div>
      <Skeleton className="w-28 h-7 rounded-lg" />
      <Skeleton className="w-36 h-3 rounded-md" />
    </div>
  );
};

export const EarningsSummarySkeleton: React.FC = () => {
  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-amber-500/20 rounded-3xl p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="w-32 h-3.5 rounded-md" />
          <Skeleton className="w-20 h-4 rounded-full" />
        </div>
        <Skeleton className="w-44 h-9 rounded-xl" />

        <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-3.5 space-y-3">
          <div className="flex justify-between items-center">
            <Skeleton className="w-28 h-3 rounded" />
            <Skeleton className="w-16 h-3 rounded" />
          </div>
          <div className="flex justify-between items-center">
            <Skeleton className="w-36 h-3 rounded" />
            <Skeleton className="w-24 h-3 rounded" />
          </div>
          <div className="flex justify-between items-center">
            <Skeleton className="w-32 h-3 rounded" />
            <Skeleton className="w-20 h-3 rounded" />
          </div>
        </div>
      </div>

      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <Skeleton className="w-28 h-4 rounded-md" />
          <Skeleton className="w-16 h-3 rounded-md" />
        </div>
        <TripCardSkeleton />
        <TripCardSkeleton />
      </div>
    </div>
  );
};

export const ProfileSkeleton: React.FC = () => {
  return (
    <div className="space-y-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4">
        <div className="flex items-center gap-3.5">
          <Skeleton className="w-16 h-16 rounded-full shrink-0" />
          <div className="space-y-2 flex-1">
            <Skeleton className="w-32 h-5 rounded-lg" />
            <Skeleton className="w-24 h-3.5 rounded" />
            <Skeleton className="w-20 h-4 rounded-full" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Skeleton className="h-16 rounded-2xl" />
        <Skeleton className="h-16 rounded-2xl" />
        <Skeleton className="h-16 rounded-2xl" />
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 space-y-3">
        <Skeleton className="w-32 h-4 rounded" />
        <Skeleton className="w-full h-10 rounded-xl" />
        <Skeleton className="w-full h-10 rounded-xl" />
      </div>
    </div>
  );
};
