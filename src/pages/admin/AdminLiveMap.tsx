import React from 'react';
import { useApp } from '../../contexts/AppContext';
import { LeafletMap } from '../../components/Map/LeafletMap';
import { formatCurrencyDZD } from '../../utils/pricing';
import { Navigation, Activity } from 'lucide-react';

export const AdminLiveMap: React.FC = () => {
  const { drivers, rides } = useApp();

  const activeRides = rides.filter(
    r => r.status === 'accepted' || r.status === 'driver_arriving' || r.status === 'trip_started'
  );

  return (
    <div className="space-y-4 text-right text-slate-100" id="admin-live-map-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <span>خريطة التتبع المباشر لأسطول الدراجات (Fleet Live Tracker)</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
          </h2>
          <p className="text-xs text-slate-400">
            رؤية فورية لكافة سائقي الدراجات النارية المتصلين ومسارات الرحلات النشطة في الجزائر
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl font-bold text-amber-400">
            {drivers.filter(d => d.isOnline).length} دراجة متصلة
          </span>
          <span className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl font-bold text-emerald-400">
            {activeRides.length} رحلة جارية
          </span>
        </div>
      </div>

      {/* Main Big Map Container */}
      <div className="h-[520px] w-full rounded-3xl overflow-hidden border border-slate-800 shadow-2xl relative">
        <LeafletMap
          center={[36.7538, 3.0588]} // Algiers center
          zoom={13}
          drivers={drivers}
          className="h-full w-full"
        />

        {/* Floating summary of active trips */}
        <div className="absolute bottom-4 left-4 right-4 z-20 max-w-sm mr-auto bg-slate-950/90 backdrop-blur-md border border-slate-800 p-3.5 rounded-2xl shadow-xl space-y-2 text-xs">
          <div className="flex items-center justify-between font-bold text-white border-b border-slate-800/80 pb-1.5">
            <span className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-amber-400" />
              <span>الرحلات الجارية الآن</span>
            </span>
            <span className="text-[10px] text-emerald-400">{activeRides.length} رحلة نشطة</span>
          </div>

          {activeRides.length === 0 ? (
            <div className="text-slate-500 text-[11px]">لا توجد رحلات جارية حالياً على الخريطة</div>
          ) : (
            <div className="space-y-1.5 max-h-32 overflow-y-auto">
              {activeRides.map(r => (
                <div key={r.id} className="p-2 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div className="truncate">
                    <div className="font-bold text-white truncate">{r.pickup.name} ← {r.destination.name}</div>
                    <div className="text-[10px] text-slate-400">{r.driverName} • {r.passengerName}</div>
                  </div>
                  <span className="font-mono text-amber-400 font-bold shrink-0">{formatCurrencyDZD(r.estimatedPrice)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
