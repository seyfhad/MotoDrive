import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Ride } from '../../types';
import { formatCurrencyDZD } from '../../utils/pricing';
import { Phone, Navigation, Clock, Check, AlertTriangle, User, Shield, ChevronRight, DollarSign } from 'lucide-react';
import confetti from 'canvas-confetti';

interface DriverActiveRideProps {
  ride: Ride;
}

export const DriverActiveRide: React.FC<DriverActiveRideProps> = ({ ride }) => {
  const { advanceRideStatus, cancelRide, pricing } = useApp();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('الراكب لم يحضر');
  const [cashCollected, setCashCollected] = useState(false);

  const agreedPrice = ride.finalPrice || ride.estimatedPrice;
  const commissionRate = (pricing.driverCommissionPercent || 15) / 100;
  const driverNetEarnings = ride.driverEarning || Math.round(agreedPrice * (1 - commissionRate));

  const handleNextStep = () => {
    advanceRideStatus(ride.id);
    if (ride.status === 'trip_started') {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
      });
    }
  };

  const handleConfirmCancel = () => {
    cancelRide(ride.id, cancelReason, 'driver');
    setShowCancelModal(false);
  };

  return (
    <div className="bg-slate-900 border border-amber-500/40 rounded-3xl p-5 text-right text-slate-100 shadow-2xl space-y-4 animate-in slide-in-from-bottom-4" id="driver-active-ride-card">
      {/* Ride Step Status Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-xs font-black text-amber-400">
            {ride.status === 'accepted' && '1. التوجه إلى موقع الراكب'}
            {ride.status === 'driver_arriving' && '1. في الطريق إلى موقع الراكب'}
            {ride.status === 'driver_arrived' && '2. بانتظار صعود الراكب'}
            {ride.status === 'trip_started' && '3. الرحلة جارية في الطريق إلى الوجهة'}
            {ride.status === 'completed' && '4. تم إكمال الرحلة بنجاح'}
          </span>
        </div>
        <span className="font-mono text-xs text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
          #{ride.id}
        </span>
      </div>

      {/* Passenger Info & Safe Call */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src={ride.passengerPhoto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
            alt={ride.passengerName}
            className="w-11 h-11 rounded-full border border-slate-700 object-cover"
          />
          <div>
            <div className="text-sm font-bold text-white flex items-center gap-2">
              <span>{ride.passengerName}</span>
              <span className="text-xs text-amber-400 font-semibold">⭐ {ride.passengerRating || '4.9'}</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">الدفع: نقدًا (Cash)</div>
          </div>
        </div>

        <a
          href={`tel:${ride.passengerPhone}`}
          className="w-10 h-10 rounded-2xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 flex items-center justify-center text-emerald-400 transition-colors"
          title="الاتصال بالراكب"
        >
          <Phone className="w-5 h-5" />
        </a>
      </div>

      {/* Passenger Note (if any) */}
      {ride.passengerNote && (
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-amber-200 flex items-center gap-2">
          <span>💬</span>
          <span className="font-medium">{ride.passengerNote}</span>
        </div>
      )}

      {/* Route & Negotiated Fare Details */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 space-y-2 text-xs">
        <div className="flex items-start gap-2">
          <span className="text-emerald-400 font-bold">📍</span>
          <div className="truncate">
            <span className="text-slate-400 text-[10px]">موقع الانطلاق:</span>
            <div className="font-semibold text-slate-200 truncate">{ride.pickup.name || ride.pickup.address}</div>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <span className="text-amber-400 font-bold">🏁</span>
          <div className="truncate">
            <span className="text-slate-400 text-[10px]">الوجهة:</span>
            <div className="font-semibold text-slate-200 truncate">{ride.destination.name || ride.destination.address}</div>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
          <div>
            <div className="text-slate-400 text-[10px]">السعر المتفق عليه (يُحصّل نقدًا):</div>
            <div className="text-amber-400 font-black text-base">{formatCurrencyDZD(agreedPrice)}</div>
          </div>
          <div className="text-left">
            <div className="text-slate-400 text-[10px]">صافي ربحك التقديري:</div>
            <div className="text-emerald-400 font-bold text-sm">{formatCurrencyDZD(driverNetEarnings)}</div>
          </div>
        </div>
      </div>

      {/* Action Buttons Depending on State */}
      <div className="space-y-2">
        {/* Step 1: In route to pickup -> [وصلت] */}
        {(ride.status === 'accepted' || ride.status === 'driver_arriving') && (
          <button
            id="driver-arrived-btn"
            onClick={handleNextStep}
            className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-2xl text-sm shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <span>وصلت إلى موقع الراكب (Arrived) 📍</span>
          </button>
        )}

        {/* Step 2: At pickup -> [بدء الرحلة] */}
        {ride.status === 'driver_arrived' && (
          <div className="space-y-2">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-xs text-emerald-300 text-center font-bold">
              أنت الآن في موقع الراكب. تأكد من صعود الراكب وارتدائه الخوذة ثم ابدأ الرحلة.
            </div>

            <button
              id="driver-start-trip-btn"
              onClick={handleNextStep}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black rounded-2xl text-sm shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <span>هل الراكب موجود؟ [ بدء الرحلة 🏍️ ]</span>
            </button>
          </div>
        )}

        {/* Step 3: En route to destination -> [إنهاء الرحلة] */}
        {ride.status === 'trip_started' && (
          <button
            id="driver-complete-trip-btn"
            onClick={handleNextStep}
            className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black rounded-2xl text-sm shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <span>وصلنا إلى الوجهة [ إنهاء الرحلة وتحصيل {agreedPrice} د.ج 🏁 ]</span>
          </button>
        )}

        {/* Cancel option for driver */}
        {ride.status !== 'trip_started' && ride.status !== 'completed' && (
          <button
            onClick={() => setShowCancelModal(true)}
            className="w-full py-2 bg-slate-950 text-red-400/80 hover:text-red-400 rounded-xl text-xs font-semibold transition-colors"
          >
            إلغاء الرحلة
          </button>
        )}
      </div>

      {/* Cancellation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 max-w-xs w-full text-right space-y-3">
            <h4 className="text-sm font-bold text-red-400">إلغاء الرحلة من قبل السائق</h4>
            <p className="text-xs text-slate-400">يرجى تحديد سبب الإلغاء لمراجعته من قبل الإدارة:</p>
            <div className="space-y-1.5">
              {['الراكب لم يحضر بعد الانتظار', 'عطل طارئ في الدراجة', 'موقع الانطلاق غير مناسب أو مغلق'].map(r => (
                <button
                  key={r}
                  onClick={() => setCancelReason(r)}
                  className={`w-full text-right p-2 rounded-xl text-xs ${
                    cancelReason === r ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-950 text-slate-300'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => setShowCancelModal(false)}
                className="py-2.5 bg-slate-800 text-slate-300 text-xs rounded-xl font-bold"
              >
                تراجع
              </button>
              <button
                onClick={handleConfirmCancel}
                className="py-2.5 bg-red-500 text-white text-xs rounded-xl font-bold"
              >
                تأكيد الإلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

