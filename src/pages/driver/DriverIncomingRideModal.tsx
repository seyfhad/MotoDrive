import React, { useEffect, useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Ride } from '../../types';
import { formatCurrencyDZD } from '../../utils/pricing';
import { MapPin, Navigation, Clock, Check, X, AlertCircle, Sparkles, Plus, Minus, Send } from 'lucide-react';

interface DriverIncomingRideModalProps {
  ride: Ride;
  onClose: () => void;
}

export const DriverIncomingRideModal: React.FC<DriverIncomingRideModalProps> = ({ ride, onClose }) => {
  const { submitDriverOffer, rejectRide, activeDriver, pricing } = useApp();
  const [timeLeft, setTimeLeft] = useState(25);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showCounterForm, setShowCounterForm] = useState(false);

  const passengerPrice = ride.passengerOfferedPrice || ride.estimatedPrice;
  const [counterPrice, setCounterPrice] = useState(passengerPrice + 40);

  // 25-second countdown timer for decision
  useEffect(() => {
    if (timeLeft <= 0) {
      rejectRide(ride.id, activeDriver.id);
      onClose();
      return;
    }
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  // Calculate commission & net earnings
  const commissionRate = (pricing.driverCommissionPercent || 15) / 100;
  const netEarningsOnAccept = Math.round(passengerPrice * (1 - commissionRate));
  const netEarningsOnCounter = Math.round(counterPrice * (1 - commissionRate));

  const handleAcceptPassengerPrice = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);
    const result = await submitDriverOffer(ride.id, activeDriver.id, passengerPrice);
    setIsSubmitting(false);

    if (result.success) {
      onClose();
    } else {
      setErrorMsg(result.error || 'تعذر إرسال العرض');
    }
  };

  const handleSendCounterOffer = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);
    const result = await submitDriverOffer(ride.id, activeDriver.id, counterPrice);
    setIsSubmitting(false);

    if (result.success) {
      onClose();
    } else {
      setErrorMsg(result.error || 'تعذر إرسال العرض المضاد');
    }
  };

  const handleReject = () => {
    rejectRide(ride.id, activeDriver.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in" id="driver-incoming-ride-modal">
      <div className="bg-slate-900 border-2 border-amber-500 rounded-3xl max-w-md w-full p-5 sm:p-6 text-right text-slate-100 shadow-2xl shadow-amber-500/20 space-y-4 relative overflow-hidden">
        {/* Top Progress Countdown Bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-800">
          <div
            className="h-full bg-amber-500 transition-all duration-1000 ease-linear"
            style={{ width: `${(timeLeft / 25) * 100}%` }}
          />
        </div>

        {/* Header Alert */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <span className="text-2xl animate-bounce">🏍️</span>
            <div>
              <h3 className="text-base font-black text-amber-400">طلب رحلة جديد قابل للتفاوض!</h3>
              <p className="text-[11px] text-slate-400">ينتهي العرض خلال {timeLeft} ثوانٍ</p>
            </div>
          </div>
          <span className="font-mono font-bold text-xs bg-slate-950 px-2 py-1 rounded-lg border border-slate-800 text-slate-400">
            #{ride.id}
          </span>
        </div>

        {/* Passenger Offer Spotlight Card */}
        <div className="bg-gradient-to-br from-slate-950 to-slate-900 border-2 border-amber-500/40 rounded-2xl p-4 flex items-center justify-between shadow-lg">
          <div>
            <div className="text-[11px] text-amber-400 font-semibold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>السعر المقترح من الراكب</span>
            </div>
            <div className="text-3xl font-black text-white mt-0.5">
              {formatCurrencyDZD(passengerPrice)}
            </div>
            <div className="text-[10px] text-emerald-400 font-medium">
              صافي ربحك: {formatCurrencyDZD(netEarningsOnAccept)} (بعد عمولة {pricing.driverCommissionPercent}%)
            </div>
          </div>

          <div className="text-left space-y-1">
            <div className="text-xs font-bold text-white flex items-center gap-1 justify-end">
              <span>{ride.distanceKm} كم</span>
              <Navigation className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-1 justify-end">
              <span>~{ride.estimatedDurationMins} دقائق</span>
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
            </div>
          </div>
        </div>

        {/* Passenger Note (if any) */}
        {ride.passengerNote && (
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-amber-200 flex items-center gap-2">
            <span>💬</span>
            <span className="font-medium">{ride.passengerNote}</span>
          </div>
        )}

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

        {/* Counter Offer Panel Toggle */}
        {showCounterForm && (
          <div className="bg-slate-950 border border-amber-500/50 rounded-2xl p-3 space-y-2.5 animate-in fade-in">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white">حدد سعرك المضاد للراكب:</span>
              <span className="text-[10px] text-slate-400">
                صافي ربحك: <span className="text-emerald-400 font-bold">{netEarningsOnCounter} د.ج</span>
              </span>
            </div>

            {/* Quick Counter Chips */}
            <div className="grid grid-cols-4 gap-1.5">
              {[20, 40, 60, 80].map(add => {
                const target = passengerPrice + add;
                const isSelected = counterPrice === target;
                return (
                  <button
                    key={add}
                    type="button"
                    onClick={() => setCounterPrice(target)}
                    className={`py-1.5 px-1 rounded-xl text-xs font-bold transition-all border ${
                      isSelected
                        ? 'bg-amber-500 text-slate-950 border-amber-400'
                        : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    <div>{target} د.ج</div>
                    <div className="text-[9px] text-slate-400">+{add}</div>
                  </button>
                );
              })}
            </div>

            {/* Adjust counter buttons */}
            <div className="flex items-center justify-between gap-2 pt-1">
              <button
                type="button"
                onClick={() => setCounterPrice(prev => Math.max(passengerPrice, prev - 10))}
                className="w-9 h-9 rounded-xl bg-slate-800 text-amber-400 flex items-center justify-center font-bold"
              >
                <Minus className="w-4 h-4" />
              </button>
              <div className="text-lg font-black text-amber-400">
                {counterPrice} <span className="text-xs text-slate-400">د.ج</span>
              </div>
              <button
                type="button"
                onClick={() => setCounterPrice(prev => prev + 10)}
                className="w-9 h-9 rounded-xl bg-slate-800 text-amber-400 flex items-center justify-center font-bold"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold text-center">
            {errorMsg}
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2 pt-1">
          {!showCounterForm ? (
            <div className="grid grid-cols-2 gap-2">
              <button
                id="driver-accept-ride-btn"
                onClick={handleAcceptPassengerPrice}
                disabled={isSubmitting}
                className="py-3.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black rounded-2xl text-xs sm:text-sm transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>قبول بسعر {passengerPrice} د.ج</span>
              </button>

              <button
                type="button"
                onClick={() => setShowCounterForm(true)}
                className="py-3.5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 font-bold rounded-2xl text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>تقديم عرض مضاد</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setShowCounterForm(false)}
                className="py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-2xl text-xs transition-colors"
              >
                تراجع
              </button>

              <button
                type="button"
                onClick={handleSendCounterOffer}
                disabled={isSubmitting}
                className="py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-2xl text-xs sm:text-sm transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>إرسال عرض {counterPrice} د.ج</span>
              </button>
            </div>
          )}

          <button
            onClick={handleReject}
            className="w-full py-2 text-slate-500 hover:text-red-400 font-medium text-xs transition-colors text-center"
          >
            تخطي هذا الطلب
          </button>
        </div>
      </div>
    </div>
  );
};

