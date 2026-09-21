import React, { useEffect, useState } from 'react';
import { Shield, FileText, X, CheckCircle2, Lock, Smartphone, MapPin, AlertCircle, Copy, Check, Globe, Sparkles } from 'lucide-react';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'privacy' | 'terms';
}

export const LegalModal: React.FC<LegalModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'privacy',
}) => {
  const [activeTab, setActiveTab] = useState<'privacy' | 'terms'>('privacy');

  useEffect(() => {
    setActiveTab(defaultTab === 'terms' ? 'terms' : 'privacy');
  }, [defaultTab]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in" id="legal-privacy-modal">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl text-right text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">MotoDrive الجزائر - الشروط والخصوصية</h2>
              <p className="text-[11px] text-amber-400 font-medium">الامتثال القانوني وسياسة حماية البيانات والمعلومات</p>
            </div>
            <div className="w-9 h-9 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center text-sm font-bold">
              ⚖️
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 p-2 gap-1.5 overflow-x-auto">
          <button
            onClick={() => setActiveTab('privacy')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all whitespace-nowrap ${
              activeTab === 'privacy'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>سياسة الخصوصية (Privacy Policy)</span>
          </button>

          <button
            onClick={() => setActiveTab('terms')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all whitespace-nowrap ${
              activeTab === 'terms'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>شروط الاستخدام (Terms of Service)</span>
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs leading-relaxed text-slate-300">
          {activeTab === 'privacy' ? (
            <div className="space-y-4">
              <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-300 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-xs">
                  <Shield className="w-4 h-4 text-amber-400" />
                  <span>التزام MotoDrive بحماية خصوصية المستخدمين في الجزائر</span>
                </div>
                <p className="text-[11px] text-slate-300">
                  تلتزم منصة MotoDrive بالمعايير الصارمة لحماية المعطيات ذات الطابع الشخصي وفقاً للقانون الجزائري.
                </p>
              </div>

              <div>
                <h4 className="text-sm font-bold text-white mb-1.5 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-amber-400" />
                  <span>1. البيانات التي نجمعها وكيفية استخدامها</span>
                </h4>
                <ul className="list-disc list-inside space-y-1 text-slate-300 pr-2">
                  <li><strong>بيانات الموقع الجغرافي:</strong> نستخدم إحداثيات GPS بدقة حصرياً لحساب المسافات وتحديد الرحلة.</li>
                  <li><strong>معلومات الحساب:</strong> الاسم، رقم الهاتف، والبريد الإلكتروني للتحقق من هوية المستخدمين.</li>
                  <li><strong>بيانات الرحلة والتفاوض:</strong> الأسعار المعروضة ونقطة الانطلاق والوجهة.</li>
                </ul>
              </div>

              <div>
                <h4 className="text-sm font-bold text-white mb-1.5 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-amber-400" />
                  <span>2. حماية وتشفير البيانات</span>
                </h4>
                <p>
                  يتم تخزين جميع السجلات ومعاملات الرحلات عبر قاعدة بيانات سحابية مشفرة ببروتوكولات SSL/TLS ومعايير Google Cloud.</p>
              </div>

              <div>
                <h4 className="text-sm font-bold text-white mb-1.5 flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-amber-400" />
                  <span>3. حقوق المستخدم وحذف البيانات</span>
                </h4>
                <p>
                  يحق لكل مستخدم في أي وقت طلب تعديل أو حذف حسابه وبياناته المسجلة عبر التواصل مع الدعم الفني.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl space-y-1">
                <div className="font-bold text-amber-400 flex items-center gap-1.5">
                  <FileText className="w-4 h-4" />
                  <span>شروط وقواعد استخدام منصة MotoDrive</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  تحدد هذه الاتفاقية حقوق والتزامات كل من الركاب وسائقي الدراجات النارية في الجمهورية الجزائرية.
                </p>
              </div>

              <div>
                <h4 className="text-sm font-bold text-white mb-1.5 flex items-center gap-2">
                  <span>🏍️</span>
                  <span>1. قواعد الأمان وارتداء الخوذة</span>
                </h4>
                <p>السلامة هي أولويتنا القصوى: يُلزم كل سائق بتوفير خوذة أمان معتمدة للراكب.</p>
              </div>

              <div>
                <h4 className="text-sm font-bold text-white mb-1.5 flex items-center gap-2">
                  <span>📏</span>
                  <span>2. حد المسافة الأقصى (70 كم)</span>
                </h4>
                <p>تقتصر رحلات الدراجات النارية في منصة MotoDrive على مسافة أقصاها 70 كم لكل رحلة.</p>
              </div>

              <div>
                <h4 className="text-sm font-bold text-white mb-1.5 flex items-center gap-2">
                  <span>💰</span>
                  <span>3. نموذج التسعير والتفاوض الحر</span>
                </h4>
                <p>تبدأ التسعيرة بالمنصة من 120 د.ج، ويتم احتساب السعر التقديري استناداً إلى المسافة والطلب.</p>
              </div>

              <div>
                <h4 className="text-sm font-bold text-white mb-1.5 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                  <span>4. الدعم والتواصل الرسمي</span>
                </h4>
                <p>لأي استفسار أو شكوى تتعلق بالخدمة، يرجى التواصل المباشر مع فريق إدارة المنصة عبر البريد الرسمي.</p>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="text-[11px] text-slate-500">
            MotoDrive Algérie • إصدار الإنتاج الرسمي 2026
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-colors"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
