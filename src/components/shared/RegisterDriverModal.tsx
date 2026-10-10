import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { DriverProfile } from '../../types';
import { syncDriverProfile } from '../../services/firestoreService';
import { submitDriverApplication } from '../../services/driverApplicationsService';
import { compressImageToBase64 } from '../../utils/imageCompressor';
import { findUserAndDriverByPhone } from '../../services/authService';
import {
  X,
  Loader2,
  Upload,
  Camera,
  FileCheck,
  Clock,
  AlertCircle,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { MotoIcon } from './MotoIcon';

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

interface RequiredDocumentConfig {
  key: 'selfie' | 'motorcyclePhoto' | 'license' | 'vehicleRegistration';
  label: string;
  description: string;
}

const REQUIRED_DOCUMENTS: RequiredDocumentConfig[] = [
  {
    key: 'selfie',
    label: '1. صورة شخصية واضحة (سيلفي)',
    description: 'صورة واضحة للوجه بدون نظارات شمسية أو خوذة',
  },
  {
    key: 'motorcyclePhoto',
    label: '2. صورة الدراجة النارية (مع لوحة الترقيم)',
    description: 'صورة كاملة للمركبة تبرز الحالة ورقم لوحة الترقيم (Matricule)',
  },
  {
    key: 'license',
    label: '3. رخصة السياقة (Permis de Conduire)',
    description: 'صورة رخصة السياقة سارية المفعول صنف أ / A',
  },
  {
    key: 'vehicleRegistration',
    label: '4. البطاقة الرمادية للمركبة (Carte Grise)',
    description: 'صورة واضحة لبطاقة تسجيل الدراجة النارية',
  },
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

  // Exactly 4 verification documents: mapping keys to raw Files and preview URLs
  const [filesMap, setFilesMap] = useState<Partial<Record<RequiredDocumentConfig['key'], File>>>({});
  const [previewUrls, setPreviewUrls] = useState<Partial<Record<RequiredDocumentConfig['key'], string>>>({});

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadStatusText, setUploadStatusText] = useState<string>('');
  const [isSubmittedSuccess, setIsSubmittedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelectFile = (docKey: RequiredDocumentConfig['key'], file?: File) => {
    if (!file) return;
    setFilesMap((prev) => ({ ...prev, [docKey]: file }));
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrls((prev) => ({ ...prev, [docKey]: objectUrl }));
  };

  const handleClearFile = (docKey: RequiredDocumentConfig['key']) => {
    setFilesMap((prev) => {
      const next = { ...prev };
      delete next[docKey];
      return next;
    });
    setPreviewUrls((prev) => {
      const next = { ...prev };
      delete next[docKey];
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !phone.trim()) {
      setErrorMsg('يرجى كتابة الاسم الثلاثي ورقم الهاتف بشكل صحيح.');
      return;
    }

    if (!plateNumber.trim()) {
      setErrorMsg('يرجى إدخال رقم لوحة الترقيم (Matricule) للدراجة النارية.');
      return;
    }

    // Verify all 4 documents are provided
    const missingDocs = REQUIRED_DOCUMENTS.filter((doc) => !filesMap[doc.key]);
    if (missingDocs.length > 0) {
      setErrorMsg(`يرجى إرفاق الوثائق الـ 4 المطلوبة كاملة. ينقصك: ${missingDocs.map((d) => d.label).join('، ')}`);
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    // Strictly block registering a second account with the same phone number or with a different name
    try {
      const existing = await findUserAndDriverByPhone(phone.trim());
      if (existing.driver && existing.driver.status !== 'rejected') {
        setIsSubmitting(false);
        setErrorMsg(
          `⚠️ رقم الهاتف (${phone.trim()}) مسجل بالفعل بحساب السائق "${existing.driver.name}". يمنع تسجيل حسابين برقم واحد.`
        );
        return;
      }
      if (
        existing.profile &&
        existing.profile.name &&
        !['راكب MotoDrive', 'سائق MotoDrive', 'مستخدم MotoDrive', 'ضيف MotoDrive'].includes(existing.profile.name)
      ) {
        const normExisting = existing.profile.name.trim().replace(/\s+/g, ' ').toLowerCase();
        const normTyped = name.trim().replace(/\s+/g, ' ').toLowerCase();
        if (normExisting !== normTyped) {
          setIsSubmitting(false);
          setErrorMsg(
            `⚠️ رقم الهاتف (${phone.trim()}) مسجل مسبقاً باسم "${existing.profile.name}". لا يمكن التسجيل بنفس الرقم واسم مختلف.`
          );
          return;
        }
      }
    } catch (e) {}

    setUploadStatusText('بدء ضغط ومعالجة الوثائق الـ 4 بواسطة Canvas...');

    const cleanUid = currentUser?.uid || phone.trim().replace(/\D/g, '') || `user_${Date.now()}`;
    const driverId = `driver-${cleanUid}`;

    try {
      const uploadedDocUrls: Record<string, string> = {};

      const docKeys: RequiredDocumentConfig['key'][] = ['selfie', 'motorcyclePhoto', 'license', 'vehicleRegistration'];
      let count = 0;

      // 1. Compress the 4 verification documents on client side using Canvas to ~40KB Base64
      for (const key of docKeys) {
        count++;
        const file = filesMap[key];
        if (file) {
          const label = REQUIRED_DOCUMENTS.find((d) => d.key === key)?.label || key;
          setUploadStatusText(`جاري ضغط (${count} من 4): ${label} (~40KB)...`);
          const base64String = await compressImageToBase64(file, 40, 640);
          uploadedDocUrls[key] = base64String;
        }
      }

      setUploadStatusText('حفظ بيانات السائق وصور الوثائق في Firestore (driver_applications)...');

      const selfieUrl = uploadedDocUrls.selfie || '';
      const motorcyclePhotoUrl = uploadedDocUrls.motorcyclePhoto || '';
      const licenseUrl = uploadedDocUrls.license || '';
      const vehicleRegistrationUrl = uploadedDocUrls.vehicleRegistration || '';

      const motorcycleData = {
        brand,
        model: model.trim(),
        year: parseInt(year) || 2023,
        plateNumber: plateNumber.trim(),
        color: 'أسود',
      };

      // 2. Store driver application with Base64 images directly into Firestore 'driver_applications' collection
      await submitDriverApplication({
        id: `app_${driverId}`,
        driverId,
        userId: currentUser?.uid || cleanUid,
        fullName: name.trim(),
        phone: phone.trim(),
        email: currentUser?.email || undefined,
        wilaya,
        municipality: municipality || 'وسط المدينة',
        motorcycle: motorcycleData,
        documents: {
          selfieUrl,
          motorcyclePhotoUrl,
          licenseUrl,
          vehicleRegistrationUrl,
          // Backwards compatibility mappings for existing screens
          licenseFrontUrl: licenseUrl,
          licenseBackUrl: licenseUrl,
          vehicleDocFrontUrl: vehicleRegistrationUrl,
          vehicleDocBackUrl: vehicleRegistrationUrl,
          motorcycleFrontUrl: motorcyclePhotoUrl,
          motorcycleBackUrl: motorcyclePhotoUrl,
        },
      });

      // 3. Keep local app state updated and switch to driver role
      const newDriver: DriverProfile = {
        id: driverId,
        userId: currentUser?.uid || cleanUid,
        name: name.trim(),
        phone: phone.trim(),
        email: currentUser?.email || undefined,
        wilaya,
        municipality: municipality || 'وسط المدينة',
        photoUrl: selfieUrl,
        rating: 5.0,
        ratingCount: 1,
        totalTrips: 0,
        cancellationCount: 0,
        isOnline: false,
        isAvailable: false,
        status: 'pending',
        rejectionReason: undefined,
        location: {
          lat: 36.7538 + (Math.random() - 0.5) * 0.04,
          lng: 3.0588 + (Math.random() - 0.5) * 0.04,
          name: `${wilaya}، الجزائر`,
        },
        motorcycle: motorcycleData,
        documents: {
          status: 'pending',
          submittedAt: new Date().toISOString(),
          selfieUrl,
          personalPhotoUrl: selfieUrl,
          motorcycleFrontUrl: motorcyclePhotoUrl,
          motorcycleBackUrl: motorcyclePhotoUrl,
          licenseFrontUrl: licenseUrl,
          licenseBackUrl: licenseUrl,
          vehicleDocFrontUrl: vehicleRegistrationUrl,
          vehicleDocBackUrl: vehicleRegistrationUrl,
          licenseUrl,
          identityDocumentUrl: selfieUrl,
          vehicleRegistrationUrl,
          motorcyclePhotosUrls: [motorcyclePhotoUrl],
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      try {
        localStorage.setItem('motodrive_registered_phone', phone.trim());
        localStorage.setItem('motodrive_active_driver_phone', phone.trim());
      } catch (e) {}

      await syncDriverProfile(newDriver);
      setActiveDriver(newDriver);
      setCurrentRole('driver');

      setIsSubmitting(false);
      setIsSubmittedSuccess(true);
    } catch (err: any) {
      console.error('Error submitting driver application:', err);
      setErrorMsg(err?.message || 'تعذر إرسال وثائق السائق إلى السحابة. يرجى التأكد من الاتصال بالإنترنت.');
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
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="text-center">
            <h3 className="text-base font-black text-white flex items-center gap-1.5 justify-center">
              <span>تسجيل سائق دراجة نارية</span>
              <MotoIcon className="w-5 h-5 text-amber-400" />
            </h3>
            <p className="text-[11px] text-slate-400 font-medium">خطوة واحدة: إدخال البيانات ورفع الوثائق الـ 4 المطلوبة</p>
          </div>
          <div className="w-8 h-8 rounded-xl overflow-hidden border border-amber-500/30 shrink-0 shadow-sm">
            <img src="/icon.jpg" alt="MotoDrive" className="w-full h-full object-cover" />
          </div>
        </div>

        {/* Success / Pending Confirmation View */}
        {isSubmittedSuccess ? (
          <div className="p-6 text-center space-y-4 animate-in fade-in">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-500 text-amber-400 flex items-center justify-center text-2xl mx-auto shadow-lg shadow-amber-500/20">
              <Clock className="w-8 h-8 animate-pulse" />
            </div>

            <div className="space-y-1.5">
              <h4 className="text-lg font-black text-white">تم إرسال طلبك والوثائق الـ 4 بنجاح!</h4>
              <p className="text-xs text-amber-300 font-extrabold bg-amber-500/10 py-1.5 px-3 rounded-xl border border-amber-500/20 inline-block">
                طلب التسجيل قيد المراجعة والمعالجة من المسؤول
              </p>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-xs text-slate-300 text-right space-y-2 leading-relaxed">
              <div className="flex items-center gap-2 text-amber-400 font-bold">
                <ShieldCheck className="w-4 h-4" />
                <span>ماذا يحدث الآن؟</span>
              </div>
              <p className="text-[11px] text-slate-400">
                يقوم مسؤول المنصة بمراجعة صور دراجتك ورخصة السياقة والبطاقة الرمادية. وفور الموافقة، سيتم تفعيل حسابك كـ سائق مؤهل وبدء استقبال طلبات الرحلات فوراً.
              </p>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs transition-colors cursor-pointer"
            >
              الانتقال لشاشة متابعة حالة الاعتماد
            </button>
          </div>
        ) : (
          /* Single-Step Registration & Document Upload Form */
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* 1. Personal Information */}
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
                    onChange={(e) => setName(e.target.value)}
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
                    onChange={(e) => setPhone(e.target.value)}
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
                    onChange={(e) => setWilaya(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    {ALGERIA_WILAYAS.map((w) => (
                      <option key={w} value={w}>{w}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">البلدية:</label>
                  <input
                    type="text"
                    value={municipality}
                    onChange={(e) => setMunicipality(e.target.value)}
                    placeholder="مثال: سيدي امحمد"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* 2. Motorcycle Details */}
            <div className="space-y-2.5 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80">
              <h4 className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <span>2. بيانات الدراجة النارية</span>
              </h4>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">الماركة:</label>
                  <select
                    value={brand}
                    onChange={(e) => {
                      const newBrand = e.target.value;
                      setBrand(newBrand);
                      if (BRAND_MODELS_MAP[newBrand]?.[0]) {
                        setModel(BRAND_MODELS_MAP[newBrand][0]);
                      }
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    {POPULAR_BRANDS.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">الموديل (الطراز):</label>
                  <select
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    {(BRAND_MODELS_MAP[brand] || ['طراز آخر']).map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">سنة الصنع:</label>
                  <input
                    type="number"
                    min="2010"
                    max="2026"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono text-center"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    لوحة الترقيم (Matricule):
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: 12345-123-16"
                    value={plateNumber}
                    onChange={(e) => setPlateNumber(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-amber-400 placeholder:text-slate-600 focus:outline-none focus:border-amber-500 font-mono text-center"
                    dir="ltr"
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
                  onChange={(e) => setHasHelmet(e.target.checked)}
                  className="w-4 h-4 accent-amber-500 cursor-pointer"
                />
              </div>
            </div>

            {/* 3. The EXACT 4 Required Verification Documents */}
            <div className="space-y-3 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <span>3. الوثائق المطلوبة (4 صور فقط ترفع مباشرة)</span>
                </h4>
                <span className="text-[10px] text-amber-300 font-mono bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  {Object.keys(filesMap).length} / 4 مكتملة
                </span>
              </div>

              <div className="space-y-2.5">
                {REQUIRED_DOCUMENTS.map((docConfig) => {
                  const previewUrl = previewUrls[docConfig.key];
                  const hasFile = Boolean(filesMap[docConfig.key]);

                  return (
                    <div
                      key={docConfig.key}
                      className={`p-3 rounded-2xl border transition-all ${
                        hasFile
                          ? 'bg-slate-950/90 border-emerald-500/40 shadow-sm'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          {previewUrl ? (
                            <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-emerald-500/60 shrink-0 bg-slate-950">
                              <img src={previewUrl} alt={docConfig.label} className="w-full h-full object-cover" />
                              <span className="absolute bottom-0 right-0 bg-emerald-500 text-slate-950 text-[8px] font-black px-1 rounded-tl">
                                ✓
                              </span>
                            </div>
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600 shrink-0">
                              <Camera className="w-5 h-5" />
                            </div>
                          )}

                          <div className="min-w-0">
                            <div className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                              <span>{docConfig.label}</span>
                              {hasFile && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate mt-0.5">{docConfig.description}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <label
                            htmlFor={`doc-${docConfig.key}`}
                            className={`cursor-pointer px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 shadow-sm ${
                              hasFile
                                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                                : 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-black'
                            }`}
                          >
                            <Upload className="w-3 h-3" />
                            <span>{hasFile ? 'تغيير' : 'اختيار صورة'}</span>
                          </label>
                          <input
                            type="file"
                            id={`doc-${docConfig.key}`}
                            accept="image/*"
                            onChange={(e) => handleSelectFile(docConfig.key, e.target.files?.[0])}
                            className="hidden"
                          />

                          {hasFile && (
                            <button
                              type="button"
                              onClick={() => handleClearFile(docConfig.key)}
                              className="w-7 h-7 rounded-xl bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 flex items-center justify-center transition-colors cursor-pointer"
                              title="إزالة الصورة"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Submission Progress Indicator */}
            {isSubmitting && uploadStatusText && (
              <div className="p-3 bg-amber-500/15 border border-amber-500/40 rounded-xl text-xs text-amber-300 flex items-center gap-2.5 animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin text-amber-400 shrink-0" />
                <span className="font-semibold">{uploadStatusText}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              id="submit-driver-documents-btn"
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-2xl text-sm shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  <span>جاري معالجة وحفظ الوثائق في Firestore...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>إرسال الملف والوثائق الـ 4 للقبول ⏳</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
