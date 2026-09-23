import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Ride, RideOffer } from '../../types';
import { formatCurrencyDZD } from '../../utils/pricing';
import { Phone, Star, Shield, AlertTriangle, CheckCircle, Navigation, Clock, User, X, MessageSquare, Plus, Sparkles, Check, ChevronRight, BadgeCheck } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ActiveRideViewProps {
  ride: Ride;
  onClose?: () => void;
}

export const ActiveRideView: React.FC<ActiveRideViewProps> = ({ ride, onClose }) => {
  const {
    cancelRide,
    submitRating,
    submitComplaint,
    advanceRideStatus,
    acceptDriverOffer,
    declineDriverOffer,
    updatePassengerOffer,
  } = useApp();

  const [ratingStars, setRatingStars] = useState(5);
  const [selectedTags, setSelectedTags] = useState<string[]>(['قيادة آمنة', 'الالتزام بالوقت']);
  const [ratingComment, setRatingComment] = useState('');
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('انتظرت طويلاً');

  const [showCallModal, setShowCallModal] = useState(false);
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [complaintReason, setComplaintReason] = useState('سلوك السائق');
  const [complaintDesc, setComplaintDesc] = useState('');
  const [complaintSent, setComplaintSent] = useState(false);

  const [isRaisingPrice, setIsRaisingPrice] = useState(false);

  const availableTags = ['قيادة آمنة 🪖', 'احترام وأدب ✨', 'نظافة الدراجة 🧼', 'الالتزام بالوقت ⏱️', 'سياقة مريحة 🏍️'];

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleRatingSubmit = () => {
    submitRating(ride.id, ratingStars, selectedTags, ratingComment);
    setRatingSubmitted(true);
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  const handleSendComplaint = () => {
    submitComplaint(ride.id, complaintReason, complaintDesc, ride.driverId || undefined);
    setComplaintSent(true);
    setTimeout(() => {
      setShowComplaintModal(false);
      setComplaintSent(false);
    }, 2000);
  };

  const handleConfirmCancel = () => {
    cancelRide(ride.id, cancelReason, 'passenger');
    setShowCancelModal(false);
  };

  const handleRaisePrice = (delta: number) => {
    const currentOffered = ride.passengerOfferedPrice || ride.estimatedPrice;
    const newPrice = currentOffered + delta;
    updatePassengerOffer(ride.id, newPrice);
    setIsRaisingPrice(false);
  };

  // --------------------------------------------------------------------------
  // Render InDrive-style Negotiating & Driver Offers Feed Screen
  // --------------------------------------------------------------------------
  if (ride.status === 'searching' || ride.status === 'offers_available') {
    const pendingOffers = (ride.offers || []).filter(o => o.status === 'pending');
    const passengerPrice = ride.passengerOfferedPrice || ride.estimatedPrice;

    return (
      <div className="bg-slate-900/95 border border-slate-800 rounded-3xl p-5 text-slate-100 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-4 space-y-4" id="active-ride-negotiation">
        {/* Top Header & Proposed Price Banner */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping"></span>
              <span className="text-xs font-black text-amber-400">
                {pendingOffers.length > 0 ? `وصلك ${pendingOffers.length} عروض من سائقين` : 'بث الطلب لسائقي الدراجات...'}
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
              #{ride.id}
            </span>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
            <div>
              <div className="text-[10px] text-slate-400">سعرك المقترح حالياً:</div>
              <div className="text-xl font-black text-amber-400">
                {formatCurrencyDZD(passengerPrice)}
              </div>
            </div>

            {/* Quick Raise Price Buttons */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleRaisePrice(30)}
                className="px-2.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold transition-all flex items-center gap-1"
                title="زيادة 30 د.ج لتسريع القبول"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+30 د.ج</span>
              </button>
              <button
                type="button"
                onClick={() => handleRaisePrice(50)}
                className="px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition-all flex items-center gap-1 shadow-md shadow-amber-500/20"
                title="زيادة 50 د.ج لقبول فوري"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+50 د.ج</span>
              </button>
            </div>
          </div>

          {ride.passengerNote && (
            <div className="text-[11px] text-slate-300 bg-slate-900/90 px-2.5 py-1 rounded-xl border border-slate-800 flex items-center gap-1.5">
              <span>💬</span>
              <span>{ride.passengerNote}</span>
            </div>
          )}
        </div>

        {/* Live Offers Stream */}
        {pendingOffers.length > 0 ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300 px-1">
              <span>عروض السائقين المتاحة:</span>
              <span className="text-[11px] text-amber-400">اختر السائق الأنسب لك 👇</span>
            </div>

            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-0.5">
              {pendingOffers.map(offer => {
                const isExact = offer.offeredPrice === passengerPrice;
                const diff = offer.offeredPrice - passengerPrice;

                return (
                  <div
                    key={offer.id}
                    className="bg-slate-950 border-2 border-slate-800 hover:border-amber-500/50 rounded-2xl p-3.5 transition-all space-y-3 shadow-md relative overflow-hidden"
                  >
                    {/* Top Driver Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <img
                          src={offer.driverPhoto || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'}
                          alt={offer.driverName}
                          className="w-11 h-11 rounded-full border-2 border-amber-500 object-cover shrink-0"
                        />
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-sm font-black text-white">{offer.driverName}</span>
                            <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20" title="هوية موثقة ومعتمدة">
                              <BadgeCheck className="w-3 h-3 text-emerald-400" />
                              <span>موثق ✓</span>
                            </span>
                            <span className="flex items-center text-[10px] text-amber-400 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded">
                              ⭐ {(offer.driverRating ?? 5.0).toFixed(1)}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {offer.driverMotorcycle?.brand || ''} {offer.driverMotorcycle?.model || ''} ({offer.driverMotorcycle?.color || ''})
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {offer.driverTripsCount ?? 0} رحلة مكتملة • لوحة: {offer.driverMotorcycle?.plateNumber || ''}
                          </div>
                        </div>
                      </div>

                      {/* Offered Price Tag */}
                      <div className="text-left shrink-0">
                        <div className="text-lg font-black text-amber-400">
                          {formatCurrencyDZD(offer.offeredPrice)}
                        </div>
                        <div className="text-[10px] mt-0.5">
                          {isExact ? (
                            <span className="text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                              قبل سعرك ✅
                            </span>
                          ) : (
                            <span className="text-amber-300 font-semibold bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                              +{diff} د.ج مضاد
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Distance & ETA Badge */}
                    <div className="flex items-center justify-between text-[11px] bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <Navigation className="w-3.5 h-3.5 text-amber-400" />
                        <span>على بعد {(offer.distanceToPickupKm ?? 0).toFixed(1)} كم</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                        <Clock className="w-3.5 h-3.5" />
                        <span>يصلك خلال ~{offer.etaMinutes} دقيقة</span>
                      </div>
                    </div>

                    {/* Action Buttons for this offer */}
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => declineDriverOffer(ride.id, offer.id)}
                        className="py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-red-400 rounded-xl text-xs font-semibold transition-colors border border-slate-800"
                      >
                        تخطي
                      </button>
                      <button
                        type="button"
                        onClick={() => acceptDriverOffer(ride.id, offer.id)}
                        className="col-span-2 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-xl text-xs font-black shadow-md shadow-amber-500/20 transition-all flex items-center justify-center gap-1.5 active:scale-95"
                      >
                        <Check className="w-4 h-4" />
                        <span>قبول السائق ({offer.offeredPrice} د.ج)</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Searching Radar View while waiting for driver offers */
          <div className="py-6 text-center space-y-3">
            <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-amber-500/20 radar-wave"></div>
              <div className="w-14 h-14 rounded-full bg-slate-950 border-2 border-amber-500 shadow-xl flex items-center justify-center text-2xl">
                🏍️
              </div>
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">جاري استقبال عروض السائقين...</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                السائقون القريبون يراجعون طلبك الآن وسيقدمون عروضهم خلال ثوانٍ.
              </p>
            </div>
          </div>
        )}

        {/* Cancellation trigger */}
        <button
          onClick={() => setShowCancelModal(true)}
          className="w-full py-2.5 bg-slate-950 hover:bg-slate-800 text-red-400 font-bold rounded-xl text-xs transition-colors border border-slate-800"
        >
          إلغاء الطلب
        </button>

        {/* Cancellation Modal */}
        {showCancelModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 max-w-xs w-full text-right space-y-3">
              <h4 className="text-sm font-bold text-white">تأكيد إلغاء الرحلة</h4>
              <p className="text-xs text-slate-400">هل أنت متأكد من رغبتك في إلغاء الطلب؟ الإلغاء مجاني قبل قبول السائق.</p>
              <div className="space-y-1.5">
                {['انتظرت طويلاً', 'غيرت رأيي', 'وجدت وسيلة أخرى'].map(r => (
                  <button
                    key={r}
                    onClick={() => setCancelReason(r)}
                    className={`w-full text-right p-2 rounded-lg text-xs ${
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
                  className="py-2 bg-slate-800 text-slate-300 text-xs rounded-xl font-bold"
                >
                  تراجع
                </button>
                <button
                  onClick={handleConfirmCancel}
                  className="py-2 bg-red-500 text-white text-xs rounded-xl font-bold"
                >
                  نعم، إلغاء
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // Render Completed Summary & Rating Screen
  // --------------------------------------------------------------------------
  if (ride.status === 'completed') {
    return (
      <div className="bg-slate-900/95 border border-emerald-500/40 rounded-3xl p-5 text-right text-slate-100 shadow-2xl backdrop-blur-md animate-in zoom-in-95" id="active-ride-completed">
        <div className="text-center pb-3 border-b border-slate-800">
          <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 text-2xl mb-2">
            ✓
          </div>
          <h3 className="text-lg font-black text-white">وصلت إلى وجهتك بالسلامة!</h3>
          <p className="text-xs text-slate-400">شكراً لاختيارك منصة MotoDrive</p>
        </div>

        {/* Fare Summary */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 my-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">المسافة الفعلية:</span>
            <span className="text-xs font-bold text-white">{ride.distanceKm} كم</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">السعر المتفق عليه:</span>
            <span className="text-xs font-bold text-white">{formatCurrencyDZD(ride.finalPrice || ride.estimatedPrice)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">طريقة الدفع:</span>
            <span className="text-xs font-bold text-amber-400">نقدًا (Cash)</span>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-slate-800">
            <span className="text-xs font-bold text-slate-200">المبلغ المستحق للدفع للسائق:</span>
            <span className="text-xl font-black text-amber-400">{formatCurrencyDZD(ride.finalPrice || ride.estimatedPrice)}</span>
          </div>
        </div>

        {/* 5-Star Rating Card */}
        {!ratingSubmitted && !ride.ratingStars ? (
          <div className="bg-slate-950/80 border border-amber-500/30 rounded-2xl p-4 space-y-3 shadow-xl">
            <div className="text-center space-y-1">
              <div className="text-xs font-black text-amber-400">تقييم تجربة الرحلة مع السائق</div>
              <div className="text-sm font-bold text-white">{ride.driverName || 'سائق MotoDrive'}</div>

              {/* Star Rating Bar */}
              <div className="flex items-center justify-center gap-2 py-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRatingStars(star)}
                    className="p-1 transition-all transform hover:scale-125 active:scale-95 cursor-pointer"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        star <= ratingStars ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]' : 'text-slate-700'
                      }`}
                    />
                  </button>
                ))}
              </div>

              <div className="text-[11px] font-extrabold text-amber-300">
                {ratingStars === 5 && '🌟 ممتاز جداً - رحلة مثالية!'}
                {ratingStars === 4 && '⭐ جيد جداً - خيار ممتاز'}
                {ratingStars === 3 && '👍 جيد - تجربة مقبولة'}
                {ratingStars === 2 && '😐 مقبول - يحتاج تحسين'}
                {ratingStars === 1 && '👎 سيء - تجربة غير مرضية'}
              </div>
            </div>

            {/* Quick Positive Compliments */}
            <div className="space-y-1">
              <div className="text-[10px] text-slate-400 font-bold text-center">أبرز النقاط الإيجابية:</div>
              <div className="flex flex-wrap gap-1.5 justify-center">
                {availableTags.map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-all cursor-pointer ${
                      selectedTags.includes(tag)
                        ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20'
                        : 'bg-slate-900 text-slate-400 border border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Text Comment Area */}
            <div className="space-y-1">
              <label className="text-[11px] text-slate-300 font-bold block">تعليق أو ملاحظة للسائق (اختياري):</label>
              <textarea
                rows={2}
                placeholder="اكتب كلمة طيبة أو ملاحظة للسائق هنا..."
                value={ratingComment}
                onChange={e => setRatingComment(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500 transition-colors resize-none"
              />
            </div>

            <button
              type="button"
              onClick={handleRatingSubmit}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 active:scale-[0.99] text-slate-950 font-black rounded-xl text-xs transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Star className="w-4 h-4 fill-slate-950" />
              <span>إرسال التقييم للسائق</span>
            </button>
          </div>
        ) : (
          <div className="text-center py-4 px-3 text-emerald-400 text-xs font-bold bg-emerald-500/10 rounded-2xl border border-emerald-500/20 space-y-1">
            <div className="text-base">🎉</div>
            <div>تم استلام تقييمك بنجاح. شكراً لمساهمتك في تحسين جودة MotoDrive!</div>
            {(ratingComment || ride.ratingComment) && (
              <div className="text-[11px] text-slate-300 italic pt-1 border-t border-emerald-500/20 mt-1">
                "{ratingComment || ride.ratingComment}"
              </div>
            )}
          </div>
        )}

        {/* Complaint link */}
        <div className="mt-3 text-center">
          <button
            onClick={() => setShowComplaintModal(true)}
            className="text-[11px] text-slate-500 hover:text-red-400 transition-colors underline"
          >
            هل واجهتك مشكلة في هذه الرحلة؟ إرسال شكوى
          </button>
        </div>

        {/* Complaint Modal */}
        {showComplaintModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 max-w-sm w-full text-right space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h4 className="text-xs font-bold text-red-400">إرسال شكوى للإدارة</h4>
                <button onClick={() => setShowComplaintModal(false)}><X className="w-4 h-4 text-slate-400" /></button>
              </div>

              {complaintSent ? (
                <div className="text-center py-6 text-emerald-400 text-xs font-bold">
                  تم إرسال شكواك للإدارة وستتم مراجعتها فوراً.
                </div>
              ) : (
                <>
                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-400">سبب الشكوى:</label>
                    <select
                      value={complaintReason}
                      onChange={e => setComplaintReason(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white"
                    >
                      <option value="السائق لم يصل">السائق لم يصل</option>
                      <option value="مشكلة في السعر">مشكلة في السعر أو طلب زيادة</option>
                      <option value="سلوك السائق">سلوك السائق أو السياقة المتهورة</option>
                      <option value="عدم توفر خوذة">عدم توفير خوذة واقية للراكب</option>
                      <option value="مشكلة أخرى">مشكلة أخرى</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-400">تفاصيل المشكلة:</label>
                    <textarea
                      rows={3}
                      value={complaintDesc}
                      onChange={e => setComplaintDesc(e.target.value)}
                      placeholder="صف ما حدث بدقة لمساعدة فريق الإدارة..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white focus:outline-none"
                    />
                  </div>

                  <button
                    onClick={handleSendComplaint}
                    className="w-full py-2.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl text-xs transition-colors"
                  >
                    إرسال الشكوى الآن
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // Active States: accepted, driver_arriving, driver_arrived, trip_started
  // --------------------------------------------------------------------------
  return (
    <div className="bg-slate-900/95 border border-amber-500/30 rounded-3xl p-4 sm:p-5 text-right text-slate-100 shadow-2xl backdrop-blur-md space-y-4 animate-in slide-in-from-bottom-3" id="active-ride-in-progress">
      {/* Status Banner */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping"></div>
          <span className="text-xs font-black text-amber-400">
            {ride.status === 'accepted' && 'السائق قبل العرض وهو في الطريق إليك'}
            {ride.status === 'driver_arriving' && 'السائق يقترب من موقعك (خلال دقيقتين)'}
            {ride.status === 'driver_arrived' && '📍 السائق وصل إلى موقع الانطلاق!'}
            {ride.status === 'trip_started' && '🏍️ الرحلة جارية الآن في الطريق إلى الوجهة'}
          </span>
        </div>
        <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
          {ride.id}
        </span>
      </div>

      {/* Driver & Motorcycle Info Card */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src={ride.driverPhoto || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'}
            alt={ride.driverName}
            className="w-12 h-12 rounded-full border-2 border-amber-500 object-cover"
          />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-white">{ride.driverName}</span>
              <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full border border-emerald-500/20">
                <BadgeCheck className="w-3 h-3 text-emerald-400" />
                <span>هوية موثقة ومعتمدة ✓</span>
              </span>
              <span className="flex items-center gap-0.5 text-xs text-amber-400 font-semibold bg-amber-500/10 px-1.5 py-0.2 rounded">
                ⭐ {ride.driverRating?.toFixed(1) || '4.9'}
              </span>
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              {ride.driverMotorcycle?.brand} {ride.driverMotorcycle?.model} • <span className="text-slate-300">{ride.driverMotorcycle?.color}</span>
            </div>
            <div className="text-[11px] font-mono font-bold text-amber-400 mt-0.5">
              لوحة: {ride.driverMotorcycle?.plateNumber || '116-123-16'}
            </div>
          </div>
        </div>

        {/* Call Action with privacy phone number masking */}
        <button
          onClick={() => setShowCallModal(true)}
          className="w-10 h-10 rounded-2xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 flex items-center justify-center text-emerald-400 transition-colors shadow-lg"
          title="اتصال آمن بالسائق"
        >
          <Phone className="w-5 h-5" />
        </button>
      </div>

      {/* Ride Milestones & Addresses */}
      <div className="space-y-2 text-xs bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
        <div className="flex items-start gap-2">
          <span className="text-emerald-400 font-bold">📍</span>
          <div className="truncate">
            <span className="text-slate-400">الانطلاق: </span>
            <span className="font-semibold text-slate-200">{ride.pickup.name || ride.pickup.address}</span>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <span className="text-amber-400 font-bold">🏁</span>
          <div className="truncate">
            <span className="text-slate-400">الوجهة: </span>
            <span className="font-semibold text-slate-200">{ride.destination.name || ride.destination.address}</span>
          </div>
        </div>
        <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-slate-300">
          <span>المسافة: {ride.distanceKm} كم</span>
          <span className="text-amber-400 font-bold">السعر المتفق عليه: {formatCurrencyDZD(ride.finalPrice || ride.estimatedPrice)} (نقدًا)</span>
        </div>
      </div>

      {/* Driver Simulation Step Advance Trigger (Quick dev helper to test passenger view advancing without switching role) */}
      <div className="flex items-center gap-2 pt-1">
        {ride.status !== 'trip_started' ? (
          <button
            onClick={() => advanceRideStatus(ride.id)}
            className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
          >
            {ride.status === 'accepted' && 'محاكاة: السائق يقترب'}
            {ride.status === 'driver_arriving' && 'محاكاة: السائق وصل'}
            {ride.status === 'driver_arrived' && 'محاكاة: بدء الرحلة'}
          </button>
        ) : (
          <button
            onClick={() => advanceRideStatus(ride.id)}
            className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors"
          >
            محاكاة: الوصول وإنهاء الرحلة
          </button>
        )}

        <button
          onClick={() => setShowCancelModal(true)}
          className="px-3 py-2 bg-slate-900 border border-slate-800 hover:bg-red-500/20 text-red-400 rounded-xl text-xs font-semibold transition-colors"
        >
          إلغاء الرحلة
        </button>
      </div>

      {/* Masked Safe Calling Dialog */}
      {showCallModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-xs w-full text-center space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Phone className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">اتصال آمن ومحمي بالسائق</h4>
              <p className="text-xs text-slate-400 mt-1">يتم الاتصال برقم مؤقت للحفاظ على خصوصية رقمك الشخصي</p>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-base font-bold text-amber-400">
              0550 ** ** 33
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setShowCallModal(false)}
                className="py-2.5 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold"
              >
                إلغاء
              </button>
              <a
                href="tel:0555000000"
                onClick={() => setShowCallModal(false)}
                className="py-2.5 bg-emerald-500 text-slate-950 rounded-xl text-xs font-black flex items-center justify-center"
              >
                اتصال الآن
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Cancellation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 max-w-xs w-full text-right space-y-3">
            <h4 className="text-sm font-bold text-red-400">تأكيد إلغاء الرحلة</h4>
            <p className="text-xs text-slate-400">
              {ride.status === 'accepted' || ride.status === 'driver_arriving'
                ? 'تنبيه: السائق قد تحرك بالفعل في اتجاهك. قد تطبق رسوم إلغاء حسب سياسة الاستخدام.'
                : 'هل تود إلغاء الرحلة؟'}
            </p>
            <div className="space-y-1.5">
              {['السائق تأخر كثيراً', 'تغيير الوجهة', 'سبب طارئ آخر'].map(r => (
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

