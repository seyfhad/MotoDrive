import React, { useEffect, useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Ride } from '../../types';
import { formatCurrencyDZD } from '../../utils/pricing';
import { MapPin, Navigation, Clock, Check, X, AlertCircle } from 'lucide-react';

interface DriverIncomingRideModalProps {
  ride: Ride;
  onClose: () => void;
}

export const DriverIncomingRideModal: React.FC<DriverIncomingRideModalProps> = ({ ride, onClose }) => {
  const { acceptRide, rejectRide, activeDriver } = useApp();
  const [timeLeft, setTimeLeft] = useState(15);
  const [isAccepting, setIsAccepting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 15-second countdown timer for accepting
  useEffect(() => {
    if (timeLeft <= 0) {
      rejectRide(ride.id, activeDriver.id);
      onClose();
      return;
    }
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleAccept = async () => {
    setIsAccepting(true);
    setErrorMsg(null);
    const result = await acceptRide(ride.id, activeDriver.id);
    setIsAccepting(false);

    if (result.success) {
      onClose();
    } else {
      setErrorMsg(result.error || 'تعذر قبول الطلب');
    }
  };

  const handleReject = () => {
    rejectRide(ride.id, activeDriver.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in" id="driver-incoming-ride-modal">
      <div className="bg-slate-900 border-2 border-amber-500 rounded-3xl max-w-md w-full p-6 text-right text-slate-100 shadow-2xl shadow-amber-500/20 space-y-4 relative overflow-hidden">
        {/* Top Progress Countdown Bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-800">
          <div
            className="h-full bg-amber-500 transition-all duration-1000 ease-linear"
            style={{ width: `${(timeLeft / 15) * 100}%` }}
          />
        </div>

        {/* Header Alert */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <span className="text-2xl animate-bounce">🏍️</span>
            <div>
              <h3 className="text-base font-black text-amber-400">طلب رحلة جديدة قريب!</h3>
              <p className="text-[11px] text-slate-400">ينتهي العرض خلال {timeLeft} ثوانٍ</p>
            </div>
          </div>
          <span className="font-mono font-bold text-xs bg-slate-950 px-2 py-1 rounded-lg border border-slate-800 text-slate-400">
            {ride.id}
          </span>
        </div>

        {/* Fare & Distance Big Highlight */}
        <div className="bg-gradient-to-br from-slate-950 to-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-400 font-medium">صافي ربح السائق المقدر</div>
            <div className="text-2xl font-black text-emerald-400">
              {formatCurrencyDZD(ride.driverEarning || Math.round(ride.estimatedPrice * 0.85))}
            </div>
            <div className="text-[10px] text-slate-500">
              (السعر الإجمالي: {formatCurrencyDZD(ride.estimatedPrice)} • نقدًا)
            </div>
          </div>

          <div className="text-left space-y-1">
            <div className="text-xs font-bold text-white flex items-center gap-1 justify-end">
              <span>{ride.distanceKm} كم</span>
              <Navigation className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-1 justify-end">
              <span>{ride.estimatedDurationMins} دقائق</span>
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
            </div>
          </div>
        </div>

        {/* Pickup & Destination */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 space-y-2.5 text-xs">
          <div className="flex items-start gap-2.5">
            <span className="text-emerald-400 font-bold">📍</span>
            <div className="truncate flex-1">
              <div className="text-[10px] text-emerald-400 font-semibold">موقع الانطلاق (Pickup)</div>
              <div className="font-bold text-white truncate">{ride.pickup.name || ride.pickup.address}</div>
            </div>
          </div>

          <div className="h-px bg-slate-800/80"></div>

          <div className="flex items-start gap-2.5">
            <span className="text-amber-400 font-bold">🏁</span>
            <div className="truncate flex-1">
              <div className="text-[10px] text-amber-400 font-semibold">الوجهة (Destination)</div>
              <div className="font-bold text-white truncate">{ride.destination.name || ride.destination.address}</div>
            </div>
          </div>
        </div>

        {/* Passenger Info Preview */}
        <div className="flex items-center justify-between text-xs text-slate-300 px-1">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-xs">👤</span>
            <span className="font-bold">{ride.passengerName}</span>
          </div>
          <span className="text-amber-400 text-xs font-semibold">⭐ {ride.passengerRating || '4.9'}</span>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold text-center">
            {errorMsg}
          </div>
        )}

        {/* Action Buttons: Accept & Reject */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={handleReject}
            className="py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-2xl text-xs transition-colors flex items-center justify-center gap-2"
          >
            <X className="w-4 h-4" />
            <span>رفض الطلب</span>
          </button>

          <button
            id="driver-accept-ride-btn"
            onClick={handleAccept}
            disabled={isAccepting}
            className="py-3.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black rounded-2xl text-sm transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
          >
            <Check className="w-5 h-5" />
            <span>{isAccepting ? 'جاري القبول...' : 'قبول الرحلة 🏍️'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
