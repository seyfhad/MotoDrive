import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { DriverProfile } from '../../types';
import { syncDriverProfile } from '../../services/firestoreService';
import { X, Bike, Check, Loader2, Sparkles, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';

interface RegisterDriverModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const POPULAR_BRANDS = ['SYM', 'Yamaha', 'Honda', 'VMS', 'Kymco', 'Peugeot', 'Suzuki', 'BMW'];
const ALGERIA_WILAYAS = [
  'الجزائر العاصمة',
  'وهران',
  'البليدة',
  'قسنطينة',
  'سطيف',
  'بومرداس',
  'تيبازة',
  'تيزي وزو',
  'عنابة',
  'باتنة',
];

export const RegisterDriverModal: React.FC<RegisterDriverModalProps> = ({ isOpen, onClose }) => {
  const { setCurrentRole, setActiveDriver, drivers } = useApp();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [brand, setBrand] = useState('SYM');
  const [model, setModel] = useState('Symphony ST');
  const [year, setYear] = useState('2023');
  const [plateNumber, setPlateNumber] = useState('');
  const [wilaya, setWilaya] = useState('الجزائر العاصمة');
  const [hasHelmet, setHasHelmet] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !model.trim()) {
      setErrorMsg('يرجى ملء جميع الحقول المطلوبة.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const driverId = `drv_${Date.now()}`;
    const newDriver: DriverProfile = {
      id: driverId,
      userId: `user_${driverId}`,
      name: name.trim(),
      phone: phone.trim(),
      wilaya,
      municipality: 'الجزائر الوسطى',
      rating: 5.0,
      ratingCount: 1,
      totalTrips: 0,
      cancellationCount: 0,
      isOnline: true,
      isAvailable: true,
      status: 'approved', // Auto-approved for instant app usability
      location: {
        lat: 36.7538 + (Math.random() - 0.5) * 0.04,
        lng: 3.0588 + (Math.random() - 0.5) * 0.04,
      },
      motorcycle: {
        brand,
        model: model.trim(),
        year: parseInt(year) || 2023,
        plateNumber: plateNumber.trim() || `${Math.floor(10000 + Math.random() * 90000)}-123-16`,
        color: 'أسود',
      },
      documents: {
        status: 'approved',
        submittedAt: new Date().toISOString(),
        identityDocumentUrl: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=300',
        licenseUrl: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=300',
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await syncDriverProfile(newDriver);
      setActiveDriver(newDriver);
      setCurrentRole('driver');
      confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
      setIsSubmitting(false);
      onClose();
    } catch (err: any) {
      console.error('Error registering real driver in Firestore:', err);
      setErrorMsg(err.message || 'تعذر حفظ بيانات السائق في السحابة.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in" id="register-driver-modal">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-5 text-right text-slate-100 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="text-center">
            <h3 className="text-base font-black text-white flex items-center gap-1.5 justify-center">
              <span>تسجيل دراجة نارية وسائق جديد</span>
              <Bike className="w-4 h-4 text-amber-400" />
            </h3>
            <p className="text-[11px] text-amber-400 font-medium">سجل بياناتك الحقيقية وابدأ العمل فوراً 🏍️</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-sm">
            ✨
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-300">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Personal Info */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">الاسم واللقب الكامل:</label>
            <input
              type="text"
              required
              placeholder="مثال: يوسف بلقاسم"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">رقم الهاتف (الجزائر):</label>
            <input
              type="tel"
              required
              placeholder="مثال: 0661123456 أو 0550123456"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500 text-left"
              dir="ltr"
            />
          </div>

          {/* Motorcycle Info */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">ماركة الدراجة:</label>
              <select
                value={brand}
                onChange={e => setBrand(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                {POPULAR_BRANDS.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">الموديل (الطراز):</label>
              <input
                type="text"
                required
                placeholder="مثال: Symphony ST"
                value={model}
                onChange={e => setModel(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">سنة الصنع:</label>
              <input
                type="number"
                value={year}
                onChange={e => setYear(e.target.value)}
                min="2010"
                max="2026"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 text-center"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">الولاية:</label>
              <select
                value={wilaya}
                onChange={e => setWilaya(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                {ALGERIA_WILAYAS.map(w => (
                  <option key={w} value={w}>{w}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">رقم لوحة الترقيم (Matricule):</label>
            <input
              type="text"
              placeholder="مثال: 01452-120-16"
              value={plateNumber}
              onChange={e => setPlateNumber(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500 text-center font-mono"
            />
          </div>

          {/* Helmet Toggle */}
          <div className="flex items-center justify-between p-3 bg-slate-950/60 border border-slate-800 rounded-xl">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-xs text-slate-200">خوذة أمان إضافية متوفرة للراكب</span>
            </div>
            <input
              type="checkbox"
              checked={hasHelmet}
              onChange={e => setHasHelmet(e.target.checked)}
              className="w-4 h-4 accent-amber-500 cursor-pointer"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-2xl text-sm shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                <span>جاري الحفظ في قاعدة البيانات الحقيقية...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>تأكيد التسجيل وتفعيل الحساب فوراً 🏍️</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
