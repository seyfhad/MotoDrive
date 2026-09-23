import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { DriverProfile } from '../../types';
import { syncDriverProfile } from '../../services/firestoreService';
import {
  X,
  Bike,
  Check,
  Loader2,
  Upload,
  Camera,
  FileCheck,
  Clock,
  AlertCircle,
  ShieldCheck,
  Image as ImageIcon,
} from 'lucide-react';

interface RegisterDriverModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const POPULAR_BRANDS = [
  'SYM',
  'Yamaha',
  'VMS',
  'Honda',
  'Kymco',
  'Peugeot',
  'Piaggio / Vespa',
  'Suzuki',
  'Benelli',
  'BMW',
  'Kawasaki',
  'KTM',
  'Dayang',
  'Lifan',
  'Haojue',
  'Keeway',
  'Luojia',
  'Sanya',
  'Zontes',
  'علامة أخرى',
];

const BRAND_MODELS_MAP: Record<string, string[]> = {
  SYM: ['Symphony ST', 'Symphony SR', 'Fiddle II', 'Fiddle III', 'Fiddle IV', 'Orbit II', 'Orbit III', 'Jet 14', 'Cruisym 300', 'GTS 250', 'Tonik 125', 'Jet 4 RX'],
  Yamaha: ['TMAX 530 / 560', 'NMAX 155', 'XMAX 300', 'MT-07', 'MT-09', 'Crypton 110', 'YBR 125', 'DT 125', 'Cygnus Z', 'RayZR 125'],
  VMS: ['VMS VMAX 200', 'VMS Cuxi 110', 'VMS Driver 125', 'VMS Joker 125', 'VMS RK200', 'VMS Monster 125', 'VMS Estate 125', 'VMS Express 125'],
  Honda: ['PCX 125 / 160', 'SH 125 / 150 / 300', 'ADV 150 / 350', 'Forza 300 / 350', 'CB125R', 'Africa Twin', 'Vision 110', 'X-ADV 750'],
  Kymco: ['Agility 16+ 125/150', 'Like 125', 'Super 8', 'Xciting 400', 'AK 550', 'People S 125'],
  Peugeot: ['Django 125', 'Kisbee 50/125', 'Tweet 125', 'Metropolis 400', 'Speedfight 4'],
  'Piaggio / Vespa': ['Vespa Primavera 125', 'Vespa GTS 300', 'Piaggio Liberty 125', 'Piaggio Beverly 300/400', 'Piaggio Zip 50/125'],
  Suzuki: ['Burgman 125/200/400', 'Address 110', 'GSX-R125', 'Bandit 600/1250', 'V-Strom 650'],
  Benelli: ['TNT 125 / 150 / 251', 'TRK 502 / 502X', 'BN 302', 'Imperiale 400', 'Leoncino 500'],
  BMW: ['C400X / C400GT', 'R1250GS / R1200GS', 'S1000RR', 'F850GS / F750GS'],
  Kawasaki: ['Z900', 'Z650', 'Z1000', 'Ninja 400', 'Versys 650'],
  KTM: ['Duke 125 / 200 / 390', 'Duke 790 / 890', 'RC 390', 'Adventure 390 / 790'],
  Dayang: ['Dayang DY125', 'Dayang DY150', 'Dayang ADV 150', 'Dayang Matrix'],
  Lifan: ['Lifan LF125', 'Lifan KPV 150', 'Lifan LF150'],
  Haojue: ['Haojue KA150', 'Haojue HJ125', 'Haojue VS125'],
  Keeway: ['Keeway Zahara 125', 'Keeway Superlight 125', 'Keeway Vieste 300'],
  Luojia: ['Luojia LJ125', 'Luojia LJ110'],
  Sanya: ['Sanya SY125', 'Sanya SY150'],
  Zontes: ['Zontes 310M', 'Zontes 350D', 'Zontes 125 U1'],
  'علامة أخرى': ['طراز آخر'],
};
const ALGERIA_WILAYAS = [
  '01 - أدرار',
  '02 - الشلف',
  '03 - الأغواط',
  '04 - أم البواقي',
  '05 - باتنة',
  '06 - بجاية',
  '07 - بسكرة',
  '08 - بشار',
  '09 - البليدة',
  '10 - البويرة',
  '11 - تمنراست',
  '12 - تبسة',
  '13 - تلمسان',
  '14 - تيارت',
  '15 - تيزي وزو',
  '16 - الجزائر العاصمة',
  '17 - الجلفة',
  '18 - جيجل',
  '19 - سطيف',
  '20 - سعيدة',
  '21 - سكيكدة',
  '22 - سيدي بلعباس',
  '23 - عنابة',
  '24 - قالمة',
  '25 - قسنطينة',
  '26 - المدية',
  '27 - مستغانم',
  '28 - المسيلة',
  '29 - معسكر',
  '30 - ورقلة',
  '31 - وهران',
  '32 - البيض',
  '33 - إليزي',
  '34 - برج بوعريريج',
  '35 - بومرداس',
  '36 - الطارف',
  '37 - تندوف',
  '38 - تسمسيلت',
  '39 - الوادي',
  '40 - خنشلة',
  '41 - سوق أهراس',
  '42 - تيبازة',
  '43 - ميلة',
  '44 - عين الدفلى',
  '45 - النعامة',
  '46 - عين تموشنت',
  '47 - غرداية',
  '48 - غليزان',
  '49 - تيميمون',
  '50 - برج باجي مختار',
  '51 - أولاد جلال',
  '52 - بني عباس',
  '53 - عين صالح',
  '54 - عين قزام',
  '55 - تقرت',
  '56 - جانت',
  '57 - المغير',
  '58 - المنيعة',
];

export const RegisterDriverModal: React.FC<RegisterDriverModalProps> = ({ isOpen, onClose }) => {
  const { setCurrentRole, setActiveDriver, broadcastNotification, currentUser } = useApp();

  // Basic Information
  const [name, setName] = useState(currentUser?.displayName || '');
  const [phone, setPhone] = useState('');
  const [brand, setBrand] = useState('SYM');
  const [model, setModel] = useState('Symphony ST');
  const [year, setYear] = useState('2023');
  const [plateNumber, setPlateNumber] = useState('');
  const [wilaya, setWilaya] = useState('الجزائر العاصمة');
  const [municipality, setMunicipality] = useState('الجزائر الوسطى');
  const [hasHelmet, setHasHelmet] = useState(true);

  // 7 Required Documents requested by the user
  const [selfieUrl, setSelfieUrl] = useState<string>('');
  const [motorcycleFrontUrl, setMotorcycleFrontUrl] = useState<string>('');
  const [motorcycleBackUrl, setMotorcycleBackUrl] = useState<string>('');
  const [licenseFrontUrl, setLicenseFrontUrl] = useState<string>('');
  const [licenseBackUrl, setLicenseBackUrl] = useState<string>('');
  const [vehicleDocFrontUrl, setVehicleDocFrontUrl] = useState<string>('');
  const [vehicleDocBackUrl, setVehicleDocBackUrl] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittedSuccess, setIsSubmittedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Helper to read file to base64
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setter(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !phone.trim() || !model.trim()) {
      setErrorMsg('يرجى ملء جميع معلومات السائق والدراجة النارية.');
      return;
    }

    // Strict validation: Driver MUST upload all 7 required documents before moving to pending review
    if (
      !selfieUrl ||
      !motorcycleFrontUrl ||
      !motorcycleBackUrl ||
      !licenseFrontUrl ||
      !licenseBackUrl ||
      !vehicleDocFrontUrl ||
      !vehicleDocBackUrl
    ) {
      setErrorMsg('⚠️ يرجى رفع جميع الصور الـ 7 المطلوبة كاملاً قبل الإرسال (الصورة الشخصية، صور الدراجة أمام وخلف، رخصة السياقة جهتين، والبطاقة الرمادية جهتين).');
      return;
    }

    const finalSelfie = selfieUrl;
    const finalMotoFront = motorcycleFrontUrl;
    const finalMotoBack = motorcycleBackUrl;
    const finalLicenseFront = licenseFrontUrl;
    const finalLicenseBack = licenseBackUrl;
    const finalVehicleDocFront = vehicleDocFrontUrl;
    const finalVehicleDocBack = vehicleDocBackUrl;

    setIsSubmitting(true);
    setErrorMsg(null);

    const driverId = `drv_${Date.now()}`;
    const newDriver: DriverProfile = {
      id: driverId,
      userId: currentUser?.uid || `user_${driverId}`,
      name: name.trim(),
      phone: phone.trim(),
      email: currentUser?.email || undefined,
      wilaya,
      municipality: municipality || 'وسط المدينة',
      photoUrl: finalSelfie,
      rating: 5.0,
      ratingCount: 1,
      totalTrips: 0,
      cancellationCount: 0,
      isOnline: false, // Must not be online until admin approves
      isAvailable: false,
      status: 'pending', // Strictly pending as requested by user!
      rejectionReason: undefined,
      location: {
        lat: 36.7538 + (Math.random() - 0.5) * 0.04,
        lng: 3.0588 + (Math.random() - 0.5) * 0.04,
        name: `${wilaya}، الجزائر`,
      },
      motorcycle: {
        brand,
        model: model.trim(),
        year: parseInt(year) || 2023,
        plateNumber: plateNumber.trim() || `${Math.floor(10000 + Math.random() * 90000)}-123-16`,
        color: 'أسود',
      },
      documents: {
        status: 'pending',
        submittedAt: new Date().toISOString(),
        selfieUrl: finalSelfie,
        personalPhotoUrl: finalSelfie,
        motorcycleFrontUrl: finalMotoFront,
        motorcycleBackUrl: finalMotoBack,
        licenseFrontUrl: finalLicenseFront,
        licenseBackUrl: finalLicenseBack,
        vehicleDocFrontUrl: finalVehicleDocFront,
        vehicleDocBackUrl: finalVehicleDocBack,
        licenseUrl: finalLicenseFront,
        identityDocumentUrl: finalSelfie,
        vehicleRegistrationUrl: finalVehicleDocFront,
        motorcyclePhotosUrls: [finalMotoFront, finalMotoBack],
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await syncDriverProfile(newDriver);
      setActiveDriver(newDriver);
      setCurrentRole('driver');

      // Send broadcast notification for the admin
      broadcastNotification(
        'طلب تسجيل سائق جديد',
        `أرسل السائق ${name.trim()} وثائق دراجته (${brand} ${model}) بانتظار موافقة الإدارة.`
      );

      setIsSubmitting(false);
      setIsSubmittedSuccess(true);
    } catch (err: any) {
      console.error('Error registering driver:', err);
      setErrorMsg(err.message || 'تعذر حفظ ملف السائق في السحابة.');
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in"
      id="register-driver-modal"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-5 text-right text-slate-100 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
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
              <span>تسجيل سائق دراجة نارية</span>
              <Bike className="w-4 h-4 text-amber-400" />
            </h3>
            <p className="text-[11px] text-slate-400 font-medium">إدخال معلومات السائق ورفع الوثائق الـ 7 المطلوبة</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-sm">
            🏍️
          </div>
        </div>

        {/* Success / Pending Notice State */}
        {isSubmittedSuccess ? (
          <div className="p-6 text-center space-y-4 animate-in fade-in">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-500 text-amber-400 flex items-center justify-center text-2xl mx-auto shadow-lg shadow-amber-500/20">
              <Clock className="w-8 h-8 animate-pulse" />
            </div>

            <div className="space-y-1.5">
              <h4 className="text-lg font-black text-white">تم إرسال طلبك بنجاح!</h4>
              <p className="text-xs text-amber-300 font-extrabold bg-amber-500/10 py-1.5 px-3 rounded-xl border border-amber-500/20 inline-block">
                طلب السائق قيد المراجعة والمعالجة من طرف المالك
              </p>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-xs text-slate-300 text-right space-y-2 leading-relaxed">
              <div className="flex items-center gap-2 text-amber-400 font-bold">
                <ShieldCheck className="w-4 h-4" />
                <span>الخطوة القادمة:</span>
              </div>
              <p className="text-[11px] text-slate-400">
                يرجى الانتظار حتى يقوم الأدمن بمراجعة صور دراجتك ورخصة السياقة والبطاقة الرمادية وقبول حسابك في لوحة الإدارة. ستتلقى إشعاراً فور التفعيل وستتمكن من فتح وضع (Online) واستقبال طلبات الركاب.
              </p>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs transition-colors"
            >
              فهمت، الانتقال لواجهة السائق
            </button>
          </div>
        ) : (
          /* Registration & Document Upload Form */
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Step 1: Personal Info */}
            <div className="space-y-2.5 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80">
              <h4 className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <span>1. المعلومات الشخصية</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">الاسم واللقب:</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: يوسف بلقاسم"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">رقم الهاتف:</label>
                  <input
                    type="tel"
                    required
                    placeholder="0661123456"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500 text-left"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">الولاية:</label>
                  <select
                    value={wilaya}
                    onChange={e => setWilaya(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    {ALGERIA_WILAYAS.map(w => (
                      <option key={w} value={w}>{w}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">البلدية:</label>
                  <input
                    type="text"
                    value={municipality}
                    onChange={e => setMunicipality(e.target.value)}
                    placeholder="مثال: سيدي امحمد"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* Step 2: Motorcycle Details */}
            <div className="space-y-2.5 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80">
              <h4 className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <span>2. بيانات الدراجة النارية</span>
              </h4>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">الماركة:</label>
                  <select
                    value={brand}
                    onChange={e => {
                      const newBrand = e.target.value;
                      setBrand(newBrand);
                      if (BRAND_MODELS_MAP[newBrand]?.[0]) {
                        setModel(BRAND_MODELS_MAP[newBrand][0]);
                      }
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    {POPULAR_BRANDS.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">الموديل (الطراز):</label>
                  <select
                    value={model}
                    onChange={e => setModel(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    {(BRAND_MODELS_MAP[brand] || ['طراز آخر']).map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Custom brand/model note when 'علامة أخرى' is selected */}
              {brand === 'علامة أخرى' && (
                <div className="pt-1.5 border-t border-amber-500/30">
                  <label className="block text-[11px] font-bold text-amber-400 mb-1">
                    خانة ملاحظة: اكتب اسم الماركة وطراز الدراجة النارية بالتفصيل:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: Ducati Monster 821 / Aprilia RS660"
                    value={model}
                    onChange={e => setModel(e.target.value)}
                    className="w-full bg-slate-900 border border-amber-500/50 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">سنة الصنع:</label>
                  <input
                    type="number"
                    value={year}
                    onChange={e => setYear(e.target.value)}
                    min="2010"
                    max="2026"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 text-center"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">لوحة الترقيم (Matricule):</label>
                  <input
                    type="text"
                    placeholder="12345-120-16"
                    value={plateNumber}
                    onChange={e => setPlateNumber(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500 text-center font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-slate-900 border border-slate-800 rounded-xl">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs text-slate-200">أتوفر على خوذة واقية إضافية للراكب</span>
                </div>
                <input
                  type="checkbox"
                  checked={hasHelmet}
                  onChange={e => setHasHelmet(e.target.checked)}
                  className="w-4 h-4 accent-amber-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Step 3: Required 7 Document Uploads */}
            <div className="space-y-3 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-amber-400">
                  <span>3. رفع الوثائق المطلوبة (7 صور واضحة)</span>
                </h4>
                <span className="text-[10px] text-slate-400">مطلوبة لموافقة الأدمن</span>
              </div>

              {/* Driver Requirements & Conditions Notice */}
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3 space-y-1.5 text-xs text-amber-200">
                <div className="flex items-center gap-1.5 font-bold text-amber-400">
                  <Bike className="w-4 h-4 shrink-0" />
                  <span>شروط ومتطلبات التسجيل المعتمدة:</span>
                </div>
                <ul className="text-[11px] space-y-1 text-slate-300 list-disc pr-4 leading-relaxed">
                  <li>رفع <strong>رخصة السياقة</strong> (صنفي أ / A جهتين)</li>
                  <li>رفع <strong>البطاقة الرمادية للدراجة</strong> (جهتين)</li>
                  <li>رفع <strong>صورة شخصية (سيلفي)</strong> واضحة</li>
                  <li>رفع <strong>صور الدراجة النارية</strong> من الأمام والخلف (مع ظهور لوحة الترقيم بوضوح)</li>
                  <li className="text-amber-300 font-bold list-none pr-0 pt-1 border-t border-amber-500/20 mt-1">
                    🔒 <strong>ملاحظة هامة:</strong> بعد استكمال رفع الوثائق الـ 7 والضغط على إرسال، سيتم تحويل ملفك لمالك التطبيق لمراجعته وقبوله.
                  </li>
                </ul>
              </div>

              <div className="space-y-3">
                {/* 1. Clear Selfie */}
                <DocumentUploadCard
                  id="selfie-upload"
                  label="1. صورة شخصية واضحة (سيلفي)"
                  description="صورة سيلفي واضحة للوجه بدون نظارات شمسية"
                  previewUrl={selfieUrl}
                  onUpload={e => handleFileUpload(e, setSelfieUrl)}
                  onClear={() => setSelfieUrl('')}
                />

                {/* 2 & 3. Motorcycle Front and Back */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <DocumentUploadCard
                    id="moto-front-upload"
                    label="2. الدراجة النارية - من الأمام"
                    description="صورة واجهة الدراجة"
                    previewUrl={motorcycleFrontUrl}
                    onUpload={e => handleFileUpload(e, setMotorcycleFrontUrl)}
                    onClear={() => setMotorcycleFrontUrl('')}
                  />

                  <DocumentUploadCard
                    id="moto-back-upload"
                    label="3. الدراجة النارية - من الخلف"
                    description="شرط إلزامي: يجب أن تظهر لوحة الترقيم (Matricule) بوضوح"
                    previewUrl={motorcycleBackUrl}
                    onUpload={e => handleFileUpload(e, setMotorcycleBackUrl)}
                    onClear={() => setMotorcycleBackUrl('')}
                  />
                </div>

                {/* 4 & 5. Driving License Front and Back */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <DocumentUploadCard
                    id="license-front-upload"
                    label="4. رخصة السياقة - من الأمام"
                    description="صنف أ / A سارية المفعول"
                    previewUrl={licenseFrontUrl}
                    onUpload={e => handleFileUpload(e, setLicenseFrontUrl)}
                    onClear={() => setLicenseFrontUrl('')}
                  />

                  <DocumentUploadCard
                    id="license-back-upload"
                    label="5. رخصة السياقة - من الخلف"
                    description="الوجه الخلفي لرخصة السياقة"
                    previewUrl={licenseBackUrl}
                    onUpload={e => handleFileUpload(e, setLicenseBackUrl)}
                    onClear={() => setLicenseBackUrl('')}
                  />
                </div>

                {/* 6 & 7. Vehicle Registration Front and Back */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <DocumentUploadCard
                    id="vehicledoc-front-upload"
                    label="6. وثيقة الدراجة (البطاقة الرمادية) - أمامي"
                    description="Carte Grise الوجه الأمامي"
                    previewUrl={vehicleDocFrontUrl}
                    onUpload={e => handleFileUpload(e, setVehicleDocFrontUrl)}
                    onClear={() => setVehicleDocFrontUrl('')}
                  />

                  <DocumentUploadCard
                    id="vehicledoc-back-upload"
                    label="7. وثيقة الدراجة (البطاقة الرمادية) - خلفي"
                    description="Carte Grise الوجه الخلفي"
                    previewUrl={vehicleDocBackUrl}
                    onUpload={e => handleFileUpload(e, setVehicleDocBackUrl)}
                    onClear={() => setVehicleDocBackUrl('')}
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              id="submit-driver-documents-btn"
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-2xl text-sm shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  <span>جاري إرسال الوثائق إلى لوحة الإدارة...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>إرسال الملف والوثائق للمراجعة والقبول ⏳</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

interface DocumentUploadCardProps {
  id: string;
  label: string;
  description: string;
  previewUrl: string;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
}

const DocumentUploadCard: React.FC<DocumentUploadCardProps> = ({
  id,
  label,
  description,
  previewUrl,
  onUpload,
  onClear,
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5 truncate">
        {previewUrl ? (
          <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-amber-500/60 shrink-0 bg-slate-950">
            <img src={previewUrl} alt={label} className="w-full h-full object-cover" />
            <span className="absolute bottom-0 right-0 bg-emerald-500 text-slate-950 text-[8px] font-black px-1 rounded-tl">
              ✓
            </span>
          </div>
        ) : (
          <div className="w-12 h-12 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-600 shrink-0">
            <Camera className="w-5 h-5" />
          </div>
        )}

        <div className="truncate">
          <div className="text-xs font-bold text-white truncate flex items-center gap-1.5">
            <span>{label}</span>
            {previewUrl && <FileCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
          </div>
          <div className="text-[10px] text-slate-400 truncate">{description}</div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <label
          htmlFor={id}
          className="cursor-pointer px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 text-[11px] font-bold border border-slate-700 transition-colors flex items-center gap-1"
        >
          <Upload className="w-3 h-3" />
          <span>{previewUrl ? 'تغيير' : 'رفع صورة'}</span>
        </label>
        <input
          type="file"
          id={id}
          accept="image/*"
          capture="environment"
          onChange={onUpload}
          className="hidden"
        />

        {previewUrl && (
          <button
            type="button"
            onClick={onClear}
            className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 flex items-center justify-center transition-colors"
            title="حذف"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
};
