import React, { useState } from 'react';
import {
  X,
  BookOpen,
  MapPin,
  ShieldCheck,
  CheckCircle,
  Smartphone,
  CreditCard,
  Star,
  Sparkles,
  UserCheck,
  ChevronRight,
  FileCheck,
  ExternalLink,
  HelpCircle,
  Phone,
} from 'lucide-react';
import { MotoIcon } from '../shared/MotoIcon';
import { useApp } from '../../contexts/AppContext';

interface UserGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'passenger' | 'driver' | 'reviewer';
}

export const UserGuideModal: React.FC<UserGuideModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'passenger',
}) => {
  const { setCurrentRole, setDemoPassenger, setDemoDriver } = useApp();
  const [activeTab, setActiveTab] = useState<'passenger' | 'driver' | 'reviewer'>(defaultTab);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in"
      id="user-guide-modal"
      dir="rtl"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl text-right text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <button
            onClick={onClose}
            type="button"
            className="w-9 h-9 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5">
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">دليل استخدام MotoDrive الشامل</h2>
              <p className="text-[11px] text-amber-400 font-medium">
                دليل خطوات الحجز، التسجيل كسائق، وإرشادات مراجعي Google Play
              </p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold">
              <BookOpen className="w-5 h-5 text-amber-400" />
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 p-2 gap-1.5 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('passenger')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'passenger'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>دليل الراكب (حجز رحلة)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('driver')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'driver'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <MotoIcon className="w-4 h-4" />
            <span>دليل السائق (التسجيل والعمل)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('reviewer')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'reviewer'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>دليل مراجعي Google Play</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 text-xs sm:text-sm leading-relaxed">
          {/* TAB 1: PASSENGER GUIDE */}
          {activeTab === 'passenger' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3.5 flex items-center gap-3">
                <span className="text-2xl">📱</span>
                <div>
                  <h3 className="font-extrabold text-amber-300 text-sm">كيف تحجز رحلة دراجة نارية في 5 خطوات بسيطة؟</h3>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    تطبيق MotoDrive يوفر تجربة تنقل سريعة وآمنة باختيارك السعر المناسب في الجزائر.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-amber-500 text-slate-950 font-black flex items-center justify-center shrink-0">
                    1
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-xs sm:text-sm">تحديد نقطة الانطلاق والوجهة</h4>
                    <p className="text-slate-400 text-xs mt-1">
                      افتح الخريطة التفاعلية، اختر نقطة الركوب الحالية ووقت التوجّه للمكان المطلوب. سيظهر التطبيق المسافة بالكيلومترات والسعر الموصى به.
                    </p>
                  </div>
                </div>

                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-amber-500 text-slate-950 font-black flex items-center justify-center shrink-0">
                    2
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-xs sm:text-sm">تحديد السعر المقترح (InDrive Style)</h4>
                    <p className="text-slate-400 text-xs mt-1">
                      يمكنك قبول السعر المقترح من النظام أو تعديله بحرية بزيادة +30 د.ج أو +50 د.ج للحصول على سير سريع للسائقين.
                    </p>
                  </div>
                </div>

                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-amber-500 text-slate-950 font-black flex items-center justify-center shrink-0">
                    3
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-xs sm:text-sm">استلام واختيار العروض المباشرة</h4>
                    <p className="text-slate-400 text-xs mt-1">
                      ستصلك عروض فورية من سائقي الدراجات المتاحين مع ظهور صورهم، نوع الدراجة النارية، وتقييمهم العام. اختر العرض الأنسب لك.
                    </p>
                  </div>
                </div>

                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-amber-500 text-slate-950 font-black flex items-center justify-center shrink-0">
                    4
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-xs sm:text-sm">تتبع السائق والركوب الآمن</h4>
                    <p className="text-slate-400 text-xs mt-1">
                      تتبع حركة الدراجة النارية مباشرة على الخريطة حتى وصولها. تأكد من إعطاء السائق الخوذة الواقية المخصصة قبل انطلاق الرحلة.
                    </p>
                  </div>
                </div>

                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-amber-500 text-slate-950 font-black flex items-center justify-center shrink-0">
                    5
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-xs sm:text-sm">الدفع نقدًا والتقييم بالنجوم</h4>
                    <p className="text-slate-400 text-xs mt-1">
                      عند الوصول بأمان، أدّ المبلغ المتفق عليه نقدًا للسائق وقدم تقييمك بالنجوم والتعليق لمساعدتنا في ضمان جودة الخدمة.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentRole('passenger');
                    setDemoPassenger();
                    onClose();
                  }}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-95 shadow-lg shadow-amber-500/20"
                >
                  <span>🚀 التوجه فوراً لوضع الراكب وحجز رحلة تجريبية</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: DRIVER GUIDE */}
          {activeTab === 'driver' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3.5 flex items-center gap-3">
                <span className="text-2xl">🏍️</span>
                <div>
                  <h3 className="font-extrabold text-amber-300 text-sm">كيف تسجل وتعمل كسائق دراجة نارية في MotoDrive؟</h3>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    خطوات الانضمام وشروط قبول الوثائق والبدء في تحقيق الأرباح.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-amber-500 text-slate-950 font-black flex items-center justify-center shrink-0">
                    1
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-xs sm:text-sm">إنشاء حساب وإدخال البيانات</h4>
                    <p className="text-slate-400 text-xs mt-1">
                      اضغط على "تسجيل كسائق"، أدخل اسمك الكامل، رقم الهاتف، الولايات والبلدية، ونوع ولون ورقم لوحة الدراجة النارية.
                    </p>
                  </div>
                </div>

                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-amber-500 text-slate-950 font-black flex items-center justify-center shrink-0">
                    2
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-xs sm:text-sm">تأكيد البريد الإلكتروني (Email Verification)</h4>
                    <p className="text-slate-400 text-xs mt-1">
                      يتطلب النظام تأكيد بريدك الإلكتروني عن طريق الضغط على رابط التفعيل المنسق والمُرسل إلى صندوق الوارد الخاص ببريدك.
                    </p>
                  </div>
                </div>

                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-amber-500 text-slate-950 font-black flex items-center justify-center shrink-0">
                    3
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-xs sm:text-sm">رفع الوثائق الـ 7 المطلوبة للمراجعة</h4>
                    <p className="text-slate-400 text-xs mt-1">
                      ارفع الصور الواضحة لـ (الصورة الشخصية، صورة السيلفي، رخصة السياقة من الأمام والخلف، البطاقة الرمادية من الأمام والخلف، وصورة الدراجة).
                    </p>
                  </div>
                </div>

                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-amber-500 text-slate-950 font-black flex items-center justify-center shrink-0">
                    4
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-xs sm:text-sm">موافقة الإدارة وتفعيل وضع Online</h4>
                    <p className="text-slate-400 text-xs mt-1">
                      بعد قيام مالك التطبيق بمراجعة الوثائق وقبول ملفك، ستتلقى تنبيه قبول الحساب. فعل زر "Online" لاستقبال طلبيات الركاب القريبة فورياً.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentRole('driver');
                    setDemoDriver();
                    onClose();
                  }}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-95 shadow-lg shadow-amber-500/20"
                >
                  <span>🏍️ التوجه فوراً لوضع السائق وتجربة استقبال الطلبات</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: GOOGLE PLAY REVIEWERS GUIDE */}
          {activeTab === 'reviewer' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-3.5 flex items-center gap-3">
                <span className="text-2xl">🛡️</span>
                <div>
                  <h3 className="font-extrabold text-emerald-300 text-sm">
                    إرشادات المراجعة السريعة لمراجعي Google Play Console
                  </h3>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    تم توفير بيئة تجريبية سريعة وسلسة لاختبار كافة الأدوار والوظائف دون عوائق.
                  </p>
                </div>
              </div>

              <div className="space-y-3 bg-slate-950 border border-slate-800 p-4 rounded-2xl">
                <h4 className="font-bold text-white text-xs flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>طريقة الاختبار الفوري بزر واحد:</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentRole('passenger');
                      setDemoPassenger();
                      onClose();
                    }}
                    className="p-3 bg-slate-900 border border-slate-800 hover:border-amber-500 rounded-xl text-right cursor-pointer transition-colors"
                  >
                    <div className="text-xs font-bold text-amber-400">1. وضع الراكب</div>
                    <div className="text-[10px] text-slate-400 mt-1">طلب رحلة واختبار التفاوض والتتبع.</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCurrentRole('driver');
                      setDemoDriver();
                      onClose();
                    }}
                    className="p-3 bg-slate-900 border border-slate-800 hover:border-amber-500 rounded-xl text-right cursor-pointer transition-colors"
                  >
                    <div className="text-xs font-bold text-amber-400">2. وضع السائق</div>
                    <div className="text-[10px] text-slate-400 mt-1">تفعيل Online واستقبال العروض والقبول.</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCurrentRole('admin');
                      onClose();
                    }}
                    className="p-3 bg-slate-900 border border-slate-800 hover:border-emerald-500 rounded-xl text-right cursor-pointer transition-colors"
                  >
                    <div className="text-xs font-bold text-emerald-400">3. لوحة الإدارة</div>
                    <div className="text-[10px] text-slate-400 mt-1">مراجعة وثائق السائقين وقبول الحسابات.</div>
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-xs text-slate-300 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <div className="flex items-center gap-2 font-bold text-white">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>الامتثال لمعايير الخصوصية والأمان:</span>
                </div>
                <p className="text-slate-400 text-[11px] leading-normal">
                  التطبيق يطلب إذن الموقع الجغرافي والإشعارات لتقديم خدمة التوصيل الحية، ويحتوي على سياسة خصوصية واضحة وشاملة متوفرة بأسفل القائمة الرئيسية.
                </p>
              </div>

              {/* Direct Support Contact for Google Play Reviewers */}
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 font-bold text-amber-400 text-xs">
                    <Phone className="w-3.5 h-3.5" />
                    <span>خط الدعم المباشر لمراجعي Google Play:</span>
                  </div>
                  <p className="font-mono text-xs text-white" dir="ltr">+213 662 68 87 14</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    window.dispatchEvent(new CustomEvent('open-contact-us'));
                  }}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-[11px] font-black transition-colors cursor-pointer"
                >
                  فتح صفحة اتصل بنا
                </button>
              </div>

              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    window.dispatchEvent(new CustomEvent('open-android-modal'));
                  }}
                  className="w-full py-2.5 px-3 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 rounded-xl text-emerald-300 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                  <span>فتح نافذة حزمة تطبيق الأندرويد الحقيقي وتثبيته كـ WebAPK / Capacitor</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs">
          <div className="text-slate-400 text-[11px]">MotoDrive الجزائر • الإصدار V1.0</div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl cursor-pointer transition-colors"
          >
            إغلاق الدليل
          </button>
        </div>
      </div>
    </div>
  );
};
