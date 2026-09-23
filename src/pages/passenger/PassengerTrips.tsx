import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { formatCurrencyDZD } from '../../utils/pricing';
import { History, Calendar, MapPin, Star, AlertCircle, FileText, Download, RefreshCw } from 'lucide-react';
import { Ride } from '../../types';
import { TripCardSkeleton } from '../../components/shared/Skeleton';
import { supabaseService } from '../../services/supabaseService';

export const PassengerTrips: React.FC = () => {
  const { activePassenger, rides } = useApp();
  const [filter, setFilter] = useState<'all' | 'completed' | 'cancelled'>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // جلب وتحديث السجل مع Supabase مع إظهار تأثير التحميل الهيكلي (Loading Skeleton)
  const loadTripsData = async () => {
    setIsLoading(true);
    try {
      await supabaseService.getRides(activePassenger.id, 'passenger');
    } catch (e) {
      console.warn('Supabase fetch notice:', e);
    } finally {
      // إعطاء وقت كافٍ لتأثير الـ Skeleton لتقليل ارتباك المستخدم والانتقال بسلاسة
      setTimeout(() => setIsLoading(false), 450);
    }
  };

  useEffect(() => {
    loadTripsData();
  }, [activePassenger.id]);

  const passengerRides = rides.filter(r => r.passengerId === activePassenger.id);

  const filteredRides = passengerRides.filter(r => {
    if (filter === 'completed') return r.status === 'completed';
    if (filter === 'cancelled') return r.status.includes('cancelled');
    return true;
  });

  return (
    <div className="max-w-md mx-auto px-4 py-6 text-right text-slate-100 space-y-4 pb-24" id="passenger-trips-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-white">سجل رحلاتي</h2>
          <p className="text-xs text-slate-400">جميع الرحلات السابقة وتفاصيل الفواتير عبر Supabase</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadTripsData}
            disabled={isLoading}
            className="w-9 h-9 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-amber-400 flex items-center justify-center transition-colors active:scale-95 disabled:opacity-50"
            title="تحديث البيانات من السحابة"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
          </button>
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <History className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-2xl text-xs font-bold">
        <button
          onClick={() => setFilter('all')}
          className={`flex-1 py-2 rounded-xl transition-all ${
            filter === 'all' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400'
          }`}
        >
          الكل ({passengerRides.length})
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`flex-1 py-2 rounded-xl transition-all ${
            filter === 'completed' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400'
          }`}
        >
          المكتملة
        </button>
        <button
          onClick={() => setFilter('cancelled')}
          className={`flex-1 py-2 rounded-xl transition-all ${
            filter === 'cancelled' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400'
          }`}
        >
          الملغاة
        </button>
      </div>

      {/* Trips List with Loading Skeletons */}
      <div className="space-y-3">
        {isLoading ? (
          // Shimmering Loading Skeletons while querying Supabase
          <div className="space-y-3 animate-in fade-in duration-300">
            <TripCardSkeleton />
            <TripCardSkeleton />
            <TripCardSkeleton />
          </div>
        ) : filteredRides.length === 0 ? (
          <div className="text-center py-16 bg-slate-900/50 border border-slate-800/80 rounded-3xl p-6">
            <div className="text-3xl mb-2">📋</div>
            <h3 className="text-sm font-bold text-slate-300">لا توجد رحلات في هذا القسم</h3>
            <p className="text-xs text-slate-500 mt-1">ستظهر هنا تفاصيل رحلاتك فور إتمامها</p>
          </div>
        ) : (
          filteredRides.map(trip => (
            <div
              key={trip.id}
              className="bg-slate-900 border border-slate-800/90 rounded-3xl p-4 space-y-3 shadow-lg hover:border-slate-700 transition-colors"
            >
              {/* Trip Header */}
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-800/80 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-amber-400">{trip.id}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      trip.status === 'completed'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}
                  >
                    {trip.status === 'completed' ? 'مكتملة' : 'ملغاة'}
                  </span>
                </div>
                <span className="text-[11px] text-slate-500">
                  {new Date(trip.requestedAt).toLocaleDateString('ar-DZ')}
                </span>
              </div>

              {/* Route */}
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span>
                  <span className="text-slate-300 truncate">{trip.pickup.name || trip.pickup.address}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0"></span>
                  <span className="text-slate-300 truncate">{trip.destination.name || trip.destination.address}</span>
                </div>
              </div>

              {/* Driver & Price Footer */}
              <div className="pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <div>
                  {trip.driverName ? (
                    <div className="text-slate-400 text-[11px]">
                      السائق: <span className="text-white font-semibold">{trip.driverName}</span>
                    </div>
                  ) : (
                    <div className="text-slate-500 text-[11px]">لم يتم تعيين سائق</div>
                  )}
                  <div className="text-[10px] text-slate-500 mt-0.5">{trip.distanceKm} كم • نقدًا</div>
                </div>

                <div className="text-left flex flex-col items-end gap-1">
                  <div className="text-sm font-black text-amber-400">
                    {formatCurrencyDZD(trip.finalPrice || trip.estimatedPrice)}
                  </div>
                </div>
              </div>

              {/* Rating & Comment snippet if available */}
              {trip.status === 'completed' && (trip.ratingStars || trip.ratingComment) && (
                <div className="pt-2 border-t border-slate-800/50 bg-slate-950/50 p-2.5 rounded-xl space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-medium">تقييمك للسائق:</span>
                    <div className="flex items-center gap-0.5 text-amber-400 font-bold">
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star
                          key={s}
                          className={`w-3.5 h-3.5 ${
                            s <= (trip.ratingStars || 5) ? 'text-amber-400 fill-amber-400' : 'text-slate-700'
                          }`}
                        />
                      ))}
                      <span className="mr-1 text-xs text-amber-300">({trip.ratingStars || 5}/5)</span>
                    </div>
                  </div>
                  {trip.ratingComment && (
                    <p className="text-[11px] text-slate-300 italic">
                      "{trip.ratingComment}"
                    </p>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
