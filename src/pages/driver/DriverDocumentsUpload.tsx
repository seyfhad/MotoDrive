import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { FileText, CheckCircle2, Clock, AlertTriangle, UploadCloud, Bike, User, ShieldCheck } from 'lucide-react';

export const DriverDocumentsUpload: React.FC = () => {
  const { activeDriver, registerDriver } = useApp();

  const [isRegisteringNew, setIsRegisteringNew] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [wilaya, setWilaya] = useState('الجزائر العاصمة');
  const [municipality, setMunicipality] = useState('سيدي امحمد');
  const [bikeBrand, setBikeBrand] = useState('Honda');
  const [bikeModel, setBikeModel] = useState('SH 150i');
  const [bikeYear, setBikeYear] = useState('2023');
  const [bikePlate, setBikePlate] = useState('116-123-16');
  const [submitted, setSubmitted] = useState(false);

  const docs = [
    { title: 'بطاقة التعريف الوطنية (ID Card)', status: 'مرفوعة', required: true, icon: '🪪' },
    { title: 'رخصة السياقة صنف (أ / A)', status: 'مرفوعة', required: true, icon: '📜' },
    { title: 'البطاقة الرمادية للدراجة (Carte Grise)', status: 'مرفوعة', required: true, icon: '📄' },
    { title: 'شهادة التأمين السارية (Assurance)', status: 'مرفوعة', required: true, icon: '🛡️' },
    { title: 'صورة شخصية للسائق', status: 'مرفوعة', required: true, icon: '👤' },
    { title: 'صور الدراجة مع لوحة الترقيم', status: 'مرفوعة', required: true, icon: '🏍️' },
  ];

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    registerDriver({
      name,
      phone,
      wilaya,
      municipality,
      motorcycle: {
        brand: bikeBrand,
        model: bikeModel,
        year: parseInt(bikeYear) || 2023,
        color: 'أسود',
        plateNumber: bikePlate,
      },
    });
    setSubmitted(true);
    setIsRegisteringNew(false);
  };

  return (
    <div className="max-w-md mx-auto px-4 py-6 text-right text-slate-100 space-y-4 pb-24" id="driver-documents-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-white">وثائق وملف السائق</h2>
          <p className="text-xs text-slate-400">التحقق الأمني ورخصة سياقة الدراجة النارية</p>
        </div>
        <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
          <ShieldCheck className="w-5 h-5" />
        </div>
      </div>

      {/* Account Verification Status Card - Prompt Section 5 */}
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
            <div className="text-[11px] font-semibold opacity-80">حالة اعتماد الحساب:</div>
            <div className="text-base font-black">
              {activeDriver.status === 'approved' && 'تم قبول الحساب والموافقة عليه'}
              {activeDriver.status === 'pending' && 'قيد المراجعة والتدقيق الأمني'}
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
            : 'لا يمكن للسائق تفعيل وضع Online أو استقبال الرحلات قبل اعتماد الوثائق رسمياً من فريق إدارة MotoDrive.'}
        </p>
      </div>

      {/* Uploaded Documents List */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3">
        <h3 className="text-sm font-bold text-white mb-2">قائمة الوثائق الرسمية المطلوبة:</h3>
        <div className="space-y-2">
          {docs.map((doc, idx) => (
            <div
              key={idx}
              className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-2xl flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-base">{doc.icon}</span>
                <div>
                  <div className="font-bold text-slate-200">{doc.title}</div>
                  <div className="text-[10px] text-slate-500">مطلوبة وفق قانون النقل بالجزائر</div>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                ✓ تم الرفع
              </span>
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
            <span className="font-bold text-white text-xs">{activeDriver.motorcycle.brand} {activeDriver.motorcycle.model}</span>
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
            <span className="font-mono font-bold text-amber-400 text-xs">{activeDriver.motorcycle.plateNumber}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
