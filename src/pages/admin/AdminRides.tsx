import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Ride, RideStatus } from '../../types';
import { formatCurrencyDZD } from '../../utils/pricing';
import { Activity, Search, MapPin, Calendar, Check, X, Shield, Phone, ArrowLeft } from 'lucide-react';

export const AdminRides: React.FC = () => {
  const { rides } = useApp();
  const [filter, setFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRide, setSelectedRide] = useState<Ride | null>(null);

  const filteredRides = rides.filter(ride => {
    const matchesFilter = filter === 'all' || ride.status === filter;
    const matchesSearch =
      ride.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ride.passengerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ride.driverName && ride.driverName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (ride.pickup.name && ride.pickup.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (ride.destination.name && ride.destination.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6 text-right text-slate-100" id="admin-rides-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-black text-white">سجل وإدارة الرحلات (Rides Monitor)</h2>
          <p className="text-xs text-slate-400">متابعة كافة رحلات الدراجات النارية في الجزائر مباشرة</p>
        </div>
      </div>

      {/* Filter & Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="بحث برقم الرحلة، اسم الراكب، السائق، أو العنوان..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-2.5 pr-10 pl-4 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
          />
          <Search className="w-4 h-4 text-slate-500 absolute right-3.5 top-3" />
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-2xl text-xs font-bold overflow-x-auto">
          {[
            { id: 'all', label: `الكل (${rides.length})` },
            { id: 'searching', label: 'جاري البحث' },
            { id: 'accepted', label: 'مقبولة' },
            { id: 'trip_started', label: 'جارية الآن' },
            { id: 'completed', label: 'مكتملة' },
            { id: 'cancelled_passenger', label: 'ملغاة' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all ${
                filter === tab.id ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Rides Table */}
      <div className="bg-slate-900 border border-slate-800/90 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-3.5 font-bold">رقم الرحلة</th>
                <th className="p-3.5 font-bold">الراكب</th>
                <th className="p-3.5 font-bold">السائق والدراجة</th>
                <th className="p-3.5 font-bold">المسار</th>
                <th className="p-3.5 font-bold">المسافة</th>
                <th className="p-3.5 font-bold">السعر</th>
                <th className="p-3.5 font-bold">الحالة</th>
                <th className="p-3.5 font-bold">الإجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredRides.map(ride => (
                <tr key={ride.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-3.5 font-mono font-bold text-amber-400">{ride.id}</td>
                  <td className="p-3.5">
                    <div className="font-bold text-white">{ride.passengerName}</div>
                    <div className="text-[10px] text-slate-500">{ride.passengerPhone}</div>
                  </td>
                  <td className="p-3.5">
                    {ride.driverName ? (
                      <div>
                        <div className="font-bold text-white">{ride.driverName}</div>
                        <div className="text-[10px] text-slate-400">
                          {ride.driverMotorcycle?.brand} {ride.driverMotorcycle?.model}
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-500">لم يعين بعد</span>
                    )}
                  </td>
                  <td className="p-3.5 max-w-xs">
                    <div className="text-slate-300 truncate">
                      <span className="text-emerald-400 font-bold">من: </span>
                      {ride.pickup.name || ride.pickup.address}
                    </div>
                    <div className="text-slate-300 truncate mt-0.5">
                      <span className="text-amber-400 font-bold">إلى: </span>
                      {ride.destination.name || ride.destination.address}
                    </div>
                  </td>
                  <td className="p-3.5 font-semibold text-slate-300">{ride.distanceKm} كم</td>
                  <td className="p-3.5 font-black text-amber-400">
                    {formatCurrencyDZD(ride.finalPrice || ride.estimatedPrice)}
                  </td>
                  <td className="p-3.5">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        ride.status === 'completed'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : ride.status === 'searching'
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          : ride.status === 'trip_started'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse'
                          : 'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}
                    >
                      {ride.status === 'completed' && 'مكتملة'}
                      {ride.status === 'searching' && 'جاري البحث'}
                      {ride.status === 'accepted' && 'مقبولة'}
                      {ride.status === 'driver_arriving' && 'السائق يقترب'}
                      {ride.status === 'driver_arrived' && 'السائق وصل'}
                      {ride.status === 'trip_started' && 'جارية الآن'}
                      {ride.status.includes('cancelled') && 'ملغاة'}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <button
                      onClick={() => setSelectedRide(ride)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px] font-bold transition-colors"
                    >
                      تفاصيل
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ride Details Modal */}
      {selectedRide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 text-right">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <button
                onClick={() => setSelectedRide(null)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
              <h3 className="text-base font-black text-white">تفاصيل الرحلة #{selectedRide.id}</h3>
              <div className="w-8"></div>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">الراكب:</span>
                <span className="font-bold text-white">{selectedRide.passengerName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">السائق:</span>
                <span className="font-bold text-white">{selectedRide.driverName || 'لم يتم التعيين'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">المسافة:</span>
                <span className="font-bold text-white">{selectedRide.distanceKm} كم</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">السعر الإجمالي:</span>
                <span className="font-black text-amber-400">
                  {formatCurrencyDZD(selectedRide.finalPrice || selectedRide.estimatedPrice)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">عمولة MotoDrive (15%):</span>
                <span className="font-bold text-emerald-400">
                  {formatCurrencyDZD(selectedRide.platformCommission || 0)}
                </span>
              </div>
            </div>

            <button
              onClick={() => setSelectedRide(null)}
              className="w-full py-3 bg-amber-500 text-slate-950 font-black rounded-xl text-xs"
            >
              إغلاق النافذة
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
