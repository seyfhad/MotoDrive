import React, { useEffect, useState } from 'react';
import { Shield, FileText, X, CheckCircle2, Lock, Smartphone, MapPin, AlertCircle, Copy, Check, Globe, Sparkles } from 'lucide-react';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'privacy' | 'terms' | 'gcp-guide';
}

export const LegalModal: React.FC<LegalModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'privacy',
}) => {
  const [activeTab, setActiveTab] = useState<'privacy' | 'terms' | 'gcp-guide'>(defaultTab);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  if (!isOpen) return null;

  const currentOrigin = window.location.origin;
  const currentPath = window.location.pathname;
  const baseUrl = `${currentOrigin}${currentPath}`;
  const privacyUrl = `${baseUrl}?page=privacy`;
  const termsUrl = `${baseUrl}?page=terms`;

  const copyText = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

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
              <h2 className="text-base sm:text-lg font-black text-white">MotoDrive الجزائر - التوثيق وجاهزية النشر</h2>
              <p className="text-[11px] text-amber-400 font-medium">الامتثال القانوني وسياسة حماية البيانات وإعدادات Google Cloud</p>
            </div>
            <div className="w-9 h-9 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center text-sm font-bold">
              ⚖️
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 p-2 gap-1.5 overflow-x-auto">
          <button
            onClick={() => setActiveTab('gcp-guide')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all whitespace-nowrap ${
              activeTab === 'gcp-guide'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-900" />
            <span>حل مشكلة Google Cloud Branding 🚀</span>
          </button>

          <button
            onClick={() => setActiveTab('privacy')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all whitespace-nowrap ${
              activeTab === 'privacy'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>سياسة الخصوصية (Privacy)</span>
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
            <span>شروط الاستخدام (Terms)</span>
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs leading-relaxed text-slate-300">
          {activeTab === 'gcp-guide' ? (
            <div className="space-y-4">
              {/* Alert explaining the message */}
              <div className="p-4 bg-amber-500/10 border-2 border-amber-500/30 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-300 text-sm">
                  <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
                  <span>حل تنبيه: "Votre branding n'est pas visible par les utilisateurs"</span>
                </div>
                <p className="text-slate-200 text-xs leading-relaxed">
                  تظهر هذه الرسالة في وحدة تحكم <strong>Google Cloud Console (OAuth Consent Screen)</strong> لأن حالة نشر التطبيق ما زالت في وضع الاختبار.
                </p>
              </div>

              {/* Step 1: Ready to copy URLs */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  <Globe className="w-4 h-4 text-amber-400" />
                  <span>1. روابط التوثيق المباشرة (انسخها بضغطة زر وضعها في Google Cloud):</span>
                </h4>

                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                    <div className="truncate flex-1 pl-2">
                      <div className="text-[10px] text-slate-400">Page d'accueil de l'application (الصفحة الرئيسية):</div>
                      <div className="text-xs font-mono text-amber-300 truncate dir-ltr text-left">{baseUrl}</div>
                    </div>
                    <button
                      onClick={() => copyText(baseUrl, 'home')}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-xs flex items-center gap-1.5 shrink-0 transition-all"
                    >
                      {copiedField === 'home' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedField === 'home' ? 'تم النسخ!' : 'نسخ'}</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                    <div className="truncate flex-1 pl-2">
                      <div className="text-[10px] text-slate-400">Règles de confidentialité (رابط سياسة الخصوصية):</div>
                      <div className="text-xs font-mono text-amber-300 truncate dir-ltr text-left">{privacyUrl}</div>
                    </div>
                    <button
                      onClick={() => copyText(privacyUrl, 'privacy')}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-xs flex items-center gap-1.5 shrink-0 transition-all"
                    >
                      {copiedField === 'privacy' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedField === 'privacy' ? 'تم النسخ!' : 'نسخ'}</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                    <div className="truncate flex-1 pl-2">
                      <div className="text-[10px] text-slate-400">Conditions d'utilisation (رابط شروط الاستخدام):</div>
                      <div className="text-xs font-mono text-amber-300 truncate dir-ltr text-left">{termsUrl}</div>
                    </div>
                    <button
                      onClick={() => copyText(termsUrl, 'terms')}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-xs flex items-center gap-1.5 shrink-0 transition-all"
                    >
                      {copiedField === 'terms' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedField === 'terms' ? 'تم النسخ!' : 'نسخ'}</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2.5">
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>2. الخطوة الحاسمة: نشر التطبيق (Publier l'application)</span>
                </h4>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-300 pr-1">
                  <li>افتح <strong className="text-amber-400">Google Cloud Console</strong> &gt; <strong>APIs &amp; Services</strong> &gt; <strong>OAuth consent screen</strong>.</li>
                  <li>في قسم <span className="font-bold text-white">État de publication (Publishing Status)</span> ستجد عبارة: <em className="text-amber-300">En cours de test</em> وبجانبها زر أزرق.</li>
                  <li>انقر على زر <strong className="text-white">PUBLIER L'APPLICATION</strong> ثم أكد العملية.</li>
                  <li>بمجرد النشر، يتحول التطبيق إلى <strong className="text-emerald-400">En production</strong> ويختفي تنبيه branding.</li>
                </ol>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2">
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  <span>🗺️</span>
                  <span>3. حل خطأ Geocoding Billing (الفوترة للخرائط):</span>
                </h4>
                <p className="text-slate-300 text-xs">
                  تطلب Google Cloud تفعيل الفوترة لخدمة Geocoding API، ولكن في تطبيقنا تم دمج محرك بحث هجين في الواجهة الخلفية.
                </p>
              </div>
            </div>
          ) : activeTab === 'privacy' ? (
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
