import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Ride } from '../../types';
import { formatCurrencyDZD } from '../../utils/pricing';
import {
  Star,
  Check,
  Sparkles,
  X,
  ThumbsUp,
  Shield,
  MessageSquare,
  ChevronRight,
  User,
  AlertCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface TripRatingModalProps {
  ride: Ride;
  isOpen: boolean;
  onClose: () => void;
  raterRole?: 'passenger' | 'driver';
}

export const TripRatingModal: React.FC<TripRatingModalProps> = ({
  ride,
  isOpen,
  onClose,
  raterRole = 'passenger',
}) => {
  const { submitRating } = useApp();

  const [ratingStars, setRatingStars] = useState<number>(5);
  const [hoveredStars, setHoveredStars] = useState<number | null>(null);

  const passengerTags = [
    'قيادة آمنة 🪖',
    'الالتزام بالوقت ⏱️',
    'نظافة الخوذة 🧼',
    'أخلاق عالية وأدب ✨',
    'سياقة مريحة وسلسة 🏍️',
    'اتباع مسار GPS 🗺️',
  ];

  const driverTags = [
    'أخلاق عالية وأدب ✨',
    'جاهز في نقطة الالتقاء ⏱️',
    'دفع نقدي بالتمام 💵',
    'تعامل راقٍ وممتاز 👍',
    'احترام قواعد السلامة 🪖',
    'تواصل واضح وسريع 💬',
  ];

  const quickTags = raterRole === 'driver' ? driverTags : passengerTags;

  const [selectedTags, setSelectedTags] = useState<string[]>([
    quickTags[0],
    quickTags[1],
  ]);
  const [comment, setComment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const activeStars = hoveredStars ?? ratingStars;

  const getRatingLabel = (stars: number) => {
    switch (stars) {
      case 5:
        return '🌟 تجربة استثنائية ومثالية!';
      case 4:
        return '⭐ تعامل محترم وتجربة جيدة جداً';
      case 3:
        return '👍 رحلة جيدة ومقبولة';
      case 2:
        return '😐 تجربة متوسطة بحاجة لتحسين';
      case 1:
        return '👎 تجربة غير مرضية';
      default:
        return 'اختر التقييم';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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

      // Auto close after 2.2 seconds
      setTimeout(() => {
        onClose();
      }, 2200);
    } catch (err: any) {
      console.error('Error submitting rating:', err);
      setErrorMsg('تعذر حفظ التقييم حالياً. يرجى إعادة المحاولة.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const targetName =
    raterRole === 'driver'
      ? ride.passengerName || 'الراكب'
      : ride.driverName || 'سائق MotoDrive';

  const targetPhoto =
    raterRole === 'driver'
      ? ride.passengerPhoto || '/assets/images/passenger_logo.jpg'
      : ride.driverPhoto || '/assets/images/driver_logo.jpg';

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
        {/* Ambient Glow */}
        <div className="absolute -top-16 -left-16 w-44 h-44 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-44 h-44 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Star className="w-4 h-4 fill-amber-400" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">
                {raterRole === 'driver' ? 'تقييم الراكب بعد المشوار' : 'تقييم الكابتن والرحلة'}
              </h3>
              <p className="text-[10px] text-slate-400">رأيك يُحفظ مباشرة لتحسين جودة وأمان المنصة</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
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
              تم حفظ تقييمك ({ratingStars} من 5 نجوم) وملاحظاتك بنجاح في ملف{' '}
              <span className="text-amber-400 font-bold">{targetName}</span> في قاعدة البيانات.
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
              تم، العودة إلى الرئيسية
            </button>
          </div>
        ) : (
          /* Rating Form */
          <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
            {/* Target Profile Snippet */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={targetPhoto}
                  alt={targetName}
                  className="w-12 h-12 rounded-full border-2 border-amber-500/40 object-cover shrink-0"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      raterRole === 'driver'
                        ? '/assets/images/passenger_logo.jpg'
                        : '/assets/images/driver_logo.jpg';
                  }}
                />
                <div>
                  <div className="text-xs text-slate-400 font-medium">
                    {raterRole === 'driver' ? 'الراكب:' : 'سائق الدراجة:'}
                  </div>
                  <div className="text-sm font-black text-white">{targetName}</div>
                  {raterRole === 'passenger' && ride.driverMotorcycle && (
                    <div className="text-[10px] text-amber-400/90 font-medium mt-0.5">
                      🏍️ {ride.driverMotorcycle.brand} {ride.driverMotorcycle.model} ({ride.driverMotorcycle.plateNumber})
                    </div>
                  )}
                </div>
              </div>

              <div className="text-left font-mono">
                <div className="text-[10px] text-slate-500">أجرة الرحلة</div>
                <div className="text-sm font-black text-amber-400">{formatCurrencyDZD(finalFare)}</div>
                <div className="text-[9px] text-emerald-400 font-bold">دفع نقداً (Cash)</div>
              </div>
            </div>

            {/* 5-Star Interactive Rating */}
            <div className="text-center py-2 space-y-2">
              <div className="flex items-center justify-center gap-2" dir="ltr">
                {[1, 2, 3, 4, 5].map((star) => {
                  const isFilled = star <= activeStars;
                  return (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRatingStars(star)}
                      onMouseEnter={() => setHoveredStars(star)}
                      onMouseLeave={() => setHoveredStars(null)}
                      className="p-1 transition-transform active:scale-90 hover:scale-110 cursor-pointer focus:outline-none"
                    >
                      <Star
                        className={`w-9 h-9 transition-colors ${
                          isFilled
                            ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                            : 'text-slate-700 hover:text-slate-500'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
              <div className="text-xs font-bold text-amber-400 animate-in fade-in duration-150">
                {getRatingLabel(activeStars)}
              </div>
            </div>

            {/* Predefined Feedback Tags */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>ما أكثر ما ميّز هذه التجربة؟</span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {quickTags.map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`text-xs px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold shadow-sm'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Comment Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                <span>ملاحظات إضافية (اختياري):</span>
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="اكتب تعليقك أو أي كلمة شكر إضافية..."
                rows={2}
                maxLength={300}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500 transition-colors resize-none"
              />
            </div>

            {errorMsg && (
              <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-1">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm transition-all shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>جاري حفظ التقييم...</span>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>إرسال التقييم ⭐</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
