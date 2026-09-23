import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import {
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
  UploadCloud,
  User,
  ShieldCheck,
  Camera,
  X,
  Plus,
} from 'lucide-react';
import { RegisterDriverModal } from '../../components/shared/RegisterDriverModal';

export const DriverDocumentsUpload: React.FC = () => {
  const { activeDriver } = useApp();
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [zoomedImageUrl, setZoomedImageUrl] = useState<string | null>(null);

  const docs = [
    {
      title: '1. صورة شخصية واضحة (سيلفي)',
      sub: 'صورة للوجه واضحة بدون نظارات',
      url: activeDriver.documents?.selfieUrl || activeDriver.photoUrl,
      icon: '👤',
    },
    {
      title: '2. الدراجة النارية (من الأمام)',
      sub: 'صورة كاملة لواجهة الدراجة',
      url: activeDriver.documents?.motorcycleFrontUrl || activeDriver.documents?.motorcyclePhotosUrls?.[0],
      icon: '🏍️',
    },
    {
      title: '3. الدراجة النارية (من الخلف)',
      sub: 'صورة تظهر لوحة الترقيم بوضوح',
      url: activeDriver.documents?.motorcycleBackUrl || activeDriver.documents?.motorcyclePhotosUrls?.[1],
      icon: '🛵',
    },
    {
      title: '4. رخصة السياقة (الوجه الأمامي)',
      sub: 'صنف A سارية المفعول',
      url: activeDriver.documents?.licenseFrontUrl || activeDriver.documents?.licenseUrl,
      icon: '📜',
    },
    {
      title: '5. رخصة السياقة (الوجه الخلفي)',
      sub: 'الظهر الخلفي لرخصة السياقة',
      url: activeDriver.documents?.licenseBackUrl,
      icon: '📜',
    },
    {
      title: '6. وثيقة الدراجة (البطاقة الرمادية - أمامي)',
      sub: 'Carte Grise الوجه الأمامي',
      url: activeDriver.documents?.vehicleDocFrontUrl || activeDriver.documents?.vehicleRegistrationUrl,
      icon: '📄',
    },
    {
      title: '7. وثيقة الدراجة (البطاقة الرمادية - خلفي)',
      sub: 'Carte Grise الوجه الخلفي',
      url: activeDriver.documents?.vehicleDocBackUrl,
      icon: '📄',
    },
  ];

  return (
    <div className="max-w-md mx-auto px-4 py-6 text-right text-slate-100 space-y-4 pb-24" id="driver-documents-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-white">وثائق وملف السائق</h2>
          <p className="text-xs text-slate-400">التحقق الأمني واعتماد الدراجة النارية</p>
        </div>
        <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
          <ShieldCheck className="w-5 h-5" />
        </div>
      </div>

      {/* Account Verification Status Card */}
      <div
        className={`border rounded-3xl p-5 shadow-xl space-y-3 ${
          activeDriver.status === 'approved'
            ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
            : activeDriver.status === 'pending'
            ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
            : 'bg-red-500/10 border-red-500/40 text-red-300'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-xl">
            {activeDriver.status === 'approved' && '✅'}
            {activeDriver.status === 'pending' && '⏳'}
            {activeDriver.status === 'rejected' && '❌'}
          </div>
          <div>
            <div className="text-[11px] font-semibold opacity-80">حالة ملف السائق:</div>
            <div className="text-base font-black">
              {activeDriver.status === 'approved' && 'تم قبول الحساب والموافقة عليه رسميًا'}
              {activeDriver.status === 'pending' && 'قيد المراجعة والتدقيق من قِبل الأدمن'}
              {activeDriver.status === 'rejected' && 'تم رفض ملف التسجيل'}
            </div>
          </div>
        </div>

        {activeDriver.status === 'rejected' && activeDriver.rejectionReason && (
          <div className="p-3 bg-red-500/20 rounded-xl text-xs text-red-200">
            <strong>سبب الرفض:</strong> {activeDriver.rejectionReason}
          </div>
        )}

        <p className="text-xs opacity-90 leading-relaxed">
          {activeDriver.status === 'approved'
            ? 'حسابك مفعل وجاهز لاستقبال طلبات الركاب. يرجى دائماً الالتزام بالخوذة الواقية.'
            : 'بناءً على طلبك، تم إرسال ملفك ووثائقك إلى لوحة الإدارة. يرجى الانتظار حتى يقوم الأدمن بمراجعتها وقبولها لتتمكن من تفعيل وضع (Online) واستقبال رحلات الركاب.'}
        </p>

        {activeDriver.status !== 'approved' && (
          <button
            onClick={() => setShowRegisterModal(true)}
            className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            <UploadCloud className="w-4 h-4" />
            <span>تعديل أو إعادة رفع الوثائق المطلوبة</span>
          </button>
        )}
      </div>

      {/* Uploaded Documents List */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">الوثائق السبع المطلوبة (7 صور):</h3>
          <span className="text-[10px] text-amber-400 font-semibold">مطلوبة للاعتماد</span>
        </div>

        <div className="space-y-2.5">
          {docs.map((doc, idx) => (
            <div
              key={idx}
              className="p-3 bg-slate-950/80 border border-slate-800 rounded-2xl flex items-center justify-between text-xs gap-3"
            >
              <div className="flex items-center gap-3 truncate">
                {doc.url ? (
                  <div
                    className="relative w-12 h-12 rounded-xl overflow-hidden border border-amber-500/50 shrink-0 cursor-pointer bg-slate-900"
                    onClick={() => setZoomedImageUrl(doc.url || null)}
                  >
                    <img src={doc.url} alt={doc.title} className="w-full h-full object-cover" />
                    <span className="absolute bottom-0 right-0 bg-emerald-500 text-slate-950 text-[8px] font-black px-1 rounded-tl">
                      ✓
                    </span>
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 shrink-0">
                    <Camera className="w-5 h-5" />
                  </div>
                )}
                <div className="truncate">
                  <div className="font-bold text-slate-200 truncate">{doc.title}</div>
                  <div className="text-[10px] text-slate-500 truncate">{doc.sub}</div>
                </div>
              </div>

              <div className="shrink-0">
                {doc.url ? (
                  <button
                    onClick={() => setZoomedImageUrl(doc.url || null)}
                    className="text-[11px] font-bold text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 px-2.5 py-1 rounded-lg border border-amber-500/20 transition-colors"
                  >
                    معاينة 🔍
                  </button>
                ) : (
                  <span className="text-[10px] text-slate-500 bg-slate-900 px-2 py-1 rounded-lg">
                    غير مرفوعة
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Motorcycle Info Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3 text-xs">
        <h3 className="text-sm font-bold text-white mb-1">معلومات الدراجة النارية المسجلة:</h3>
        <div className="grid grid-cols-2 gap-2 text-slate-300">
          <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
            <span className="text-slate-500 text-[10px] block">الشركة والموديل:</span>
            <span className="font-bold text-white text-xs">
              {activeDriver.motorcycle.brand} {activeDriver.motorcycle.model}
            </span>
          </div>
          <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
            <span className="text-slate-500 text-[10px] block">سنة الصنع:</span>
            <span className="font-bold text-white text-xs">{activeDriver.motorcycle.year}</span>
          </div>
          <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
            <span className="text-slate-500 text-[10px] block">اللون:</span>
            <span className="font-bold text-white text-xs">{activeDriver.motorcycle.color}</span>
          </div>
          <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
            <span className="text-slate-500 text-[10px] block">رقم لوحة الترقيم:</span>
            <span className="font-mono font-bold text-amber-400 text-xs">
              {activeDriver.motorcycle.plateNumber}
            </span>
          </div>
        </div>
      </div>

      {/* Zoom Modal */}
      {zoomedImageUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in"
          onClick={() => setZoomedImageUrl(null)}
        >
          <div
            className="relative max-w-2xl w-full bg-slate-900 border border-slate-700 rounded-3xl p-3 shadow-2xl space-y-3"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold text-slate-300">معاينة الوثيقة مكبّرة 🔍</span>
              <button
                onClick={() => setZoomedImageUrl(null)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="max-h-[75vh] overflow-auto flex items-center justify-center bg-black/50 rounded-2xl p-2">
              <img
                src={zoomedImageUrl}
                alt="Document preview"
                className="max-h-[70vh] w-auto max-w-full object-contain rounded-xl"
              />
            </div>
          </div>
        </div>
      )}

      {/* Edit/Re-upload Modal */}
      <RegisterDriverModal isOpen={showRegisterModal} onClose={() => setShowRegisterModal(false)} />
    </div>
  );
};
