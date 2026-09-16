import React from 'react';
import { useApp } from '../../contexts/AppContext';
import { formatCurrencyDZD } from '../../utils/pricing';
import { History, Calendar, MapPin, Star, User } from 'lucide-react';

export const DriverTrips: React.FC = () => {
  const { activeDriver, rides } = useApp();

  const driverRides = rides.filter(r => r.driverId === activeDriver.id);

  return (
    <div className="max-w-md mx-auto px-4 py-6 text-right text-slate-100 space-y-4 pb-24" id="driver-trips-screen">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-white">سجل رحلات السائق</h2>
          <p className="text-xs text-slate-400">إجمالي الرحلات والأرباح المحققة</p>
        </div>
        <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
          <History className="w-5 h-5" />
        </div>
      </div>

      <div className="space-y-3">
        {driverRides.length === 0 ? (
          <div className="text-center py-16 bg-slate-900/50 border border-slate-800/80 rounded-3xl p-6">
            <div className="text-3xl mb-2">🏍️</div>
            <h3 className="text-sm font-bold text-slate-300">لا توجد رحلات مسجلة بعد</h3>
            <p className="text-xs text-slate-500 mt-1">قم بتفعيل وضع Online لاستقبال أول رحلة لك</p>
          </div>
        ) : (
          driverRides.map(trip => (
            <div
              key={trip.id}
              className="bg-slate-900 border border-slate-800/90 rounded-3xl p-4 space-y-3 shadow-lg"
            >
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-800 text-xs">
                <span className="font-mono font-bold text-amber-400">{trip.id}</span>
                <span className="text-[11px] text-slate-500">
                  {new Date(trip.requestedAt).toLocaleDateString('ar-DZ')}
                </span>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span className="text-slate-300 truncate">{trip.pickup.name || trip.pickup.address}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  <span className="text-slate-300 truncate">{trip.destination.name || trip.destination.address}</span>
                </div>
              </div>

              <div className="pt-2.5 border-t border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <div className="text-slate-300 font-bold">{trip.passengerName}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{trip.distanceKm} كم • نقدًا</div>
                </div>

                <div className="text-left">
                  <div className="text-sm font-black text-emerald-400">
                    +{formatCurrencyDZD(trip.driverEarning || Math.round((trip.finalPrice || trip.estimatedPrice) * 0.85))}
                  </div>
                  <div className="text-[10px] text-slate-500">الصافي للسائق</div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
