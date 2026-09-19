import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { formatCurrencyDZD } from '../../utils/pricing';
import { History, Calendar, MapPin, Star, AlertCircle, FileText, Download, Mail } from 'lucide-react';
import { GmailReceiptModal } from '../../components/shared/GmailReceiptModal';
import { Ride } from '../../types';

export const PassengerTrips: React.FC = () => {
  const { activePassenger, rides } = useApp();
  const [filter, setFilter] = useState<'all' | 'completed' | 'cancelled'>('all');
  const [selectedRideForReceipt, setSelectedRideForReceipt] = useState<Ride | null>(null);

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
          <p className="text-xs text-slate-400">جميع الرحلات السابقة وتفاصيل الفواتير</p>
        </div>
        <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
          <History className="w-5 h-5" />
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

      {/* Trips List */}
      <div className="space-y-3">
        {filteredRides.length === 0 ? (
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
                  {trip.status === 'completed' && (
                    <button
                      onClick={() => setSelectedRideForReceipt(trip)}
                      className="px-2 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 text-[10px] font-bold transition-all flex items-center gap-1 mt-1"
                      title="إرسال إيصال الرحلة إلى البريد الإلكتروني"
                    >
                      <Mail className="w-3 h-3" />
                      <span>إيصال Gmail</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Gmail Receipt Modal */}
      {selectedRideForReceipt && (
        <GmailReceiptModal
          isOpen={Boolean(selectedRideForReceipt)}
          onClose={() => setSelectedRideForReceipt(null)}
          ride={selectedRideForReceipt}
          defaultRecipient={activePassenger.email || ''}
        />
      )}
    </div>
  );
};
