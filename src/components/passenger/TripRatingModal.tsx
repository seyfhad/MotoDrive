import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Ride } from '../../types';
import { formatCurrencyDZD } from '../../utils/pricing';
import { Star, Check, Sparkles, X, ThumbsUp, Shield, MessageSquare, ChevronRight, User, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

interface TripRatingModalProps {
  ride: Ride;
  isOpen: boolean;
  onClose: () => void;
}

export const TripRatingModal: React.FC<TripRatingModalProps> = ({ ride, isOpen, onClose }) => {
  const { submitRating } = useApp();

  const [ratingStars, setRatingStars] = useState<number>(5);
  const [hoveredStars, setHoveredStars] = useState<number | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([
    'قيادة آمنة 🪖',
    'الالتزام بالوقت ⏱️',
  ]);
  const [comment, setComment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const quickTags = [
    'قيادة آمنة 🪖',
    'الالتزام بالوقت ⏱️',
    'أخلاق عالية وأدب ✨',
    'نظافة الخوذة والدراجة 🧼',
    'سياقة مريحة وسلسة 🏍️',
    'اتباع مسار GPS 🗺️',
  ];

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const activeStars = hoveredStars ?? ratingStars;

  const getRatingLabel = (stars: number) => {
    switch (stars) {
      case 5:
        return '🌟 تجربة استثنائية ومثالية!';
      case 4:
        return '⭐ سائق محترم ورحلة جيدة جداً';
      case 3:
        return '👍 رحلة جيدة ومقبولة';
      case 2:
        return '😐 تجربة متوسطة بحاجة لتحسين';
      case 1:
        return '👎 تجربة سيئة وغير مرضية';
      default:
        return 'اختر تقييمك للرحلة';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ride.driverId) {
      setErrorMsg('معلومات السائق غير متوفرة لهذا المشوار.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      await submitRating(ride.id, ratingStars, selectedTags, comment.trim());
      setIsSubmitted(true);

      // Trigger celebratory confetti
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#10b981', '#3b82f6', '#fbbf24'],
      });

      // Auto close after 2.5 seconds
      setTimeout(() => {
        onClose();
      }, 2500);
    } catch (err: any) {
      console.error('Error submitting rating:', err);
      setErrorMsg('تعذر حفظ التقييم حالياً. يرجى إعادة المحاولة.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const finalFare = ride.finalPrice || ride.passengerOfferedPrice || ride.estimatedPrice || 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200"
      dir="rtl"
    >
      <div
        className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl relative overflow-hidden space-y-4 text-right animate-in zoom-in-95 duration-200"
        id="trip-rating-feedback-card"
      >
        {/* Subtle Ambient Background */}
        <div className="absolute -top-16 -left-16 w-44 h-44 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-44 h-44 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Star className="w-4 h-4 fill-amber-400" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">تقييم الرحلة والكابتن</h3>
              <p className="text-[10px] text-slate-400">رأيك يُحفظ مباشرة في ملف السائق</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
            title="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isSubmitted ? (
          /* Success Screen */
          <div className="py-6 px-4 text-center space-y-3 relative z-10 animate-in fade-in duration-300">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center mx-auto text-2xl animate-bounce">
              🎉
            </div>
            <h4 className="text-base font-black text-white">شكراً لك على تقييمك!</h4>
            <p className="text-xs text-slate-300 leading-relaxed max-w-xs mx-auto">
              تم حفظ تقييمك ({ratingStars} من 5 نجوم) وملاحظاتك بنجاح في ملف الكابتن{' '}
              <span className="text-amber-400 font-bold">{ride.driverName || 'السائق'}</span> في قاعدة البيانات.
            </p>
            {comment && (
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs text-slate-300 italic max-w-xs mx-auto">
                "{comment}"
              </div>
            )}
            <button
              type="button"
              onClick={onClose}
              className="mt-2 px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black transition-all cursor-pointer shadow-lg shadow-emerald-500/20"
            >
              تم، المتابعة إلى الرئيسية
            </button>
          </div>
        ) : (
          /* Rating Form */
          <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
            {/* Driver & Trip Mini Card */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center overflow-hidden shrink-0 text-amber-400">
                  {ride.driverPhoto ? (
                    <img src={ride.driverPhoto} alt={ride.driverName} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xl">🛵</span>
                  )}
                </div>
                <div>
                  <div className="text-xs font-black text-white flex items-center gap-1.5">
                    <span>{ride.driverName || 'كابتن MotoDrive'}</span>
                    {ride.driverMotorcycle && (
                      <span className="text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                        {ride.driverMotorcycle.brand}
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate max-w-[180px]">
                    {ride.destination?.name || ride.destination?.address || 'الوجهة المحددة'}
                  </div>
                </div>
              </div>

              <div className="text-left shrink-0">
                <div className="text-[10px] text-slate-400">الأجرة المدفوعة</div>
                <div className="text-xs font-black text-emerald-400 font-mono">
                  {formatCurrencyDZD(finalFare)}
                </div>
              </div>
            </div>

            {/* Stars Rating Component */}
            <div className="text-center space-y-1.5 py-1">
              <div className="text-xs text-slate-300 font-bold">ما هو تقييمك للكابتن ومسار الرحلة؟</div>
              <div className="flex items-center justify-center gap-2 py-2">
                {[1, 2, 3, 4, 5].map(star => {
                  const isFilled = star <= activeStars;
                  return (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRatingStars(star)}
                      onMouseEnter={() => setHoveredStars(star)}
                      onMouseLeave={() => setHoveredStars(null)}
                      className="p-1 transition-transform hover:scale-125 active:scale-95 cursor-pointer focus:outline-none"
                      title={`${star} نجوم`}
                    >
                      <Star
                        className={`w-9 h-9 transition-colors ${
                          isFilled
                            ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_10px_rgba(245,158,11,0.7)]'
                            : 'text-slate-700 hover:text-slate-500'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
              <div className="text-xs font-extrabold text-amber-400 min-h-[1.25rem]">
                {getRatingLabel(activeStars)}
              </div>
            </div>

            {/* Quick Positive Badges */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 block text-center">
                ما الذي أعجبك في هذه الرحلة؟
              </label>
              <div className="flex flex-wrap gap-1.5 justify-center">
                {quickTags.map(tag => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20 scale-[1.02]'
                          : 'bg-slate-950 text-slate-400 border border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Short Comment Field */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-300 block flex items-center justify-between">
                <span>ملاحظة أو تعليق للكابتن (اختياري):</span>
                <span className="text-[10px] text-slate-500">{comment.length}/140</span>
              </label>
              <textarea
                rows={2}
                maxLength={140}
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="اكتب كلمة شكر أو أي ملاحظة بناءة للسائق هنا..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500 transition-colors resize-none"
              />
            </div>

            {errorMsg && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-2.5 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-2 flex items-center gap-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 active:scale-[0.99] text-slate-950 font-black rounded-xl text-xs transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>جاري حفظ التقييم في السحابة...</span>
                  </>
                ) : (
                  <>
                    <Star className="w-4 h-4 fill-slate-950" />
                    <span>إرسال التقييم وحفظه في ملف الكابتن</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="py-3 px-4 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white font-bold rounded-xl text-xs transition-colors border border-slate-800"
              >
                لاحقاً
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
