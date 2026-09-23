import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileCheck2,
  Award,
  Shield,
  Clock,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  FileText,
  BadgeCheck,
} from 'lucide-react';
import { MotoIcon } from '../shared/MotoIcon';
import { DriverProfile } from '../../types';

interface DriverIdentityVerificationCardProps {
  driver: DriverProfile;
  onOpenDocuments?: () => void;
  onOpenContactSupport?: () => void;
}

export const DriverIdentityVerificationCard: React.FC<DriverIdentityVerificationCardProps> = ({
  driver,
  onOpenDocuments,
  onOpenContactSupport,
}) => {
  const [expanded, setExpanded] = useState(true);

  const isApproved = driver.status === 'approved';
  const isPending = driver.status === 'pending';
  const isRejected = driver.status === 'rejected';

  // Verified documents list reflecting Algerian regulatory standards
  const verificationItems = [
    {
      id: 'cni',
      title: 'بطاقة التعريف الوطنية البيومترية (CNI)',
      badge: isApproved ? 'معتمدة ومطابقة' : isPending ? 'قيد التدقيق' : 'مرفوضة',
      desc: 'تم فحص الوجه ومطابقة الاسم ورقم التعريف الوطني البيومتري (NIN).',
      status: isApproved ? 'approved' : isPending ? 'pending' : 'rejected',
      icon: ShieldCheck,
    },
    {
      id: 'license',
      title: 'رخصة السياقة صنف (أ / Permis A)',
      badge: isApproved ? 'سارية المفعول ومؤهلة' : isPending ? 'قيد التدقيق' : 'مرفوضة',
      desc: 'رخصة قانونية جزائرية سارية المفعول لقيادة الدراجات النارية.',
      status: isApproved ? 'approved' : isPending ? 'pending' : 'rejected',
      icon: Award,
    },
    {
      id: 'carte_grise',
      title: 'البطاقة الرمادية للدراجة النارية (Carte Grise)',
      badge: isApproved ? 'ملكية موثقة' : isPending ? 'قيد التدقيق' : 'مرفوضة',
      desc: `مطابقة لوحة الترقيم (${driver.motorcycle?.plateNumber || 'مسجلة'}) ورقم الهيكل.`,
      status: isApproved ? 'approved' : isPending ? 'pending' : 'rejected',
      icon: MotoIcon as any,
    },
    {
      id: 'insurance',
      title: 'شهادة التأمين الإجباري (Assurance Moto)',
      badge: isApproved ? 'تأمين ساري المفعول' : isPending ? 'قيد التدقيق' : 'مرفوضة',
      desc: 'تغطية تأمينية للمسؤولية المدنية والركاب سارية المفعول في الجزائر.',
      status: isApproved ? 'approved' : isPending ? 'pending' : 'rejected',
      icon: FileCheck2,
    },
    {
      id: 'helmet_safety',
      title: 'فحص الدراجة وخوذة الأمان الإلزامية (Casque)',
      badge: isApproved ? 'معايير السلامة مستوفاة' : isPending ? 'قيد التدقيق' : 'مرفوضة',
      desc: 'التزام بتوفير خوذة حماية معتمدة للراكب مع فحص جاهزية الدراجة.',
      status: isApproved ? 'approved' : isPending ? 'pending' : 'rejected',
      icon: CheckCircle2,
    },
    {
      id: 'casier_judiciaire',
      title: 'صحيفة السوابق العدلية (القسيمة رقم 3)',
      badge: isApproved ? 'سجل نظيف ومعتمد' : isPending ? 'قيد التدقيق' : 'مرفوضة',
      desc: 'تم التدقيق القانوني لضمان سلامة وأمان جميع ركاب منصة MotoDrive.',
      status: isApproved ? 'approved' : isPending ? 'pending' : 'rejected',
      icon: Shield,
    },
  ];

  const approvedCount = isApproved ? 6 : isPending ? 3 : 1;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4 text-right">
      {/* Header and Verification Seal */}
      <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-1.5">
              <span>حالة التحقق من الهوية والوثائق</span>
            </h3>
            {isApproved && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black animate-in fade-in">
                <BadgeCheck className="w-3.5 h-3.5" />
                <span>موثق رسمياً</span>
              </span>
            )}
            {isPending && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-black">
                <Clock className="w-3.5 h-3.5" />
                <span>قيد التدقيق</span>
              </span>
            )}
            {isRejected && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] font-black">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>مرفوضة</span>
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400">
            {isApproved
              ? 'تم التحقق من مطابقة الهوية ومراجعة السوابق والوثائق من طرف إدارة MotoDrive'
              : 'جاري فحص وتدقيق الوثائق الرسمية من طرف فريق التحقق المعتمد'}
          </p>
        </div>

        <div
          className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
            isApproved
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
              : isPending
              ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
              : 'bg-red-500/15 border-red-500/30 text-red-400'
          }`}
        >
          {isApproved ? (
            <BadgeCheck className="w-6 h-6" />
          ) : isPending ? (
            <Clock className="w-6 h-6" />
          ) : (
            <AlertCircle className="w-6 h-6" />
          )}
        </div>
      </div>

      {/* Progress & Badge Summary */}
      <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3.5 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-300">نسبة اكتمال التحقق الأمني:</span>
          <span className="font-mono font-black text-emerald-400">
            {isApproved ? '100% (6 من 6 وثائق)' : isPending ? '50% (قيد المراجعة)' : 'يحتاج تحديث'}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              isApproved
                ? 'bg-gradient-to-r from-emerald-500 to-emerald-400 w-full'
                : isPending
                ? 'bg-gradient-to-r from-amber-500 to-amber-400 w-1/2'
                : 'bg-red-500 w-1/6'
            }`}
          />
        </div>

        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
          <span>معرف الاعتماد: <code className="text-amber-400 font-mono">DZ-MOTODRIVE-{driver.id.slice(0, 6).toUpperCase()}</code></span>
          <span>آخر تحديث: {new Date().toLocaleDateString('ar-DZ')}</span>
        </div>
      </div>

      {/* Toggle Button for Details */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between py-1 text-xs font-bold text-amber-400 hover:text-amber-300 cursor-pointer transition-colors"
      >
        <span>تفاصيل الوثائق المعتمدة والمطابقة ({approvedCount} من 6)</span>
        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {/* Verification Items List with Clear Green Checkmarks */}
      {expanded && (
        <div className="space-y-2.5 animate-in fade-in">
          {verificationItems.map((item) => {
            const Icon = item.icon;
            const isItemApproved = item.status === 'approved';

            return (
              <div
                key={item.id}
                className="bg-slate-950/60 border border-slate-800/80 hover:border-slate-700/80 rounded-2xl p-3 flex items-start gap-3 transition-colors"
              >
                {/* Status Indicator Icon: Big Green Checkmark for approved */}
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 font-bold ${
                    isItemApproved
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm shadow-emerald-500/20'
                      : item.status === 'pending'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}
                >
                  {isItemApproved ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 fill-emerald-500/20" />
                  ) : item.status === 'pending' ? (
                    <Clock className="w-4 h-4 text-amber-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-400" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 space-y-0.5">
                  <div className="flex items-center justify-between gap-1 flex-wrap">
                    <h4 className="font-bold text-xs text-white flex items-center gap-1.5">
                      <span>{item.title}</span>
                    </h4>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                        isItemApproved
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : item.status === 'pending'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          : 'bg-red-500/10 text-red-400 border-red-500/30'
                      }`}
                    >
                      {item.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-normal">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Safety & Google Play Compliance Trust Guarantee */}
      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-3 flex items-start gap-2.5 text-xs">
        <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="font-bold text-emerald-300 text-xs">ضمان الثقة والسلامة للمستخدمين ومراجعي المتجر:</h4>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            يخضع جميع سائقي MotoDrive للتدقيق الهوائي والميداني والتحقق البيومتري قبل السماح لهم بنقل الركاب، امتثالاً لسياسات Google Play ومطابقة شروط النقل البري في الجمهورية الجزائرية.
          </p>
        </div>
      </div>

      {/* Quick Action button */}
      {onOpenDocuments && (
        <div className="pt-1 text-xs">
          <button
            type="button"
            onClick={onOpenDocuments}
            className="w-full py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
          >
            <FileText className="w-4 h-4 text-amber-400" />
            <span>عرض وتحديث الوثائق المرفوعة</span>
          </button>
        </div>
      )}
    </div>
  );
};
