import React, { useState, useEffect } from 'react';
import {
  X,
  Smartphone,
  Download,
  CheckCircle,
  Copy,
  Check,
  Shield,
  Zap,
  Bell,
  Cpu,
  Terminal,
  ExternalLink,
  ChevronRight,
  ArrowDownToLine,
  Layers,
} from 'lucide-react';
import { androidNativeService } from '../../services/androidNativeService';

interface AndroidAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AndroidAppModal: React.FC<AndroidAppModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'direct-install' | 'apk-export' | 'features'>('direct-install');
  const [isInstalled, setIsInstalled] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  useEffect(() => {
    setIsInstalled(androidNativeService.isInstalled());
    setCanInstall(androidNativeService.canInstallDirectly());

    const unsubscribe = androidNativeService.subscribe(() => {
      setIsInstalled(androidNativeService.isInstalled());
      setCanInstall(androidNativeService.canInstallDirectly());
    });

    return () => unsubscribe();
  }, []);

  if (!isOpen) return null;

  const handleDirectInstall = async () => {
    androidNativeService.vibrateTap();
    const success = await androidNativeService.promptInstall();
    if (success) {
      setIsInstalled(true);
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    androidNativeService.vibrateSuccess();
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in"
      id="android-app-modal"
      dir="rtl"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl text-right text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <button
            onClick={() => {
              androidNativeService.vibrateTap();
              onClose();
            }}
            type="button"
            className="w-9 h-9 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white">تطبيق MotoDrive للأندرويد</h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black">
                  Android Native
                </span>
              </div>
              <p className="text-[11px] text-amber-400 font-medium">
                تثبيت مباشر كـ WebAPK أو تصدير حزمة APK / AAB لمتجر Google Play
              </p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold">
              <Smartphone className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 p-2 gap-1.5 overflow-x-auto">
          <button
            type="button"
            onClick={() => {
              androidNativeService.vibrateTap();
              setActiveTab('direct-install');
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'direct-install'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <ArrowDownToLine className="w-4 h-4" />
            <span>تثبيت فوري على الهاتف (PWA/WebAPK)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              androidNativeService.vibrateTap();
              setActiveTab('apk-export');
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'apk-export'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>تصدير APK/AAB لـ Google Play</span>
          </button>

          <button
            type="button"
            onClick={() => {
              androidNativeService.vibrateTap();
              setActiveTab('features');
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'features'
                ? 'bg-blue-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>المميزات الحصرية للأندرويد</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs sm:text-sm leading-relaxed">
          {/* TAB 1: DIRECT 1-TAP INSTALLATION */}
          {activeTab === 'direct-install' && (
            <div className="space-y-4 animate-in fade-in">
              {isInstalled ? (
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-emerald-400 text-sm">التطبيق مثبت ويعمل كأندرويد أصلي!</h3>
                    <p className="text-[11px] text-slate-300 mt-0.5">
                      MotoDrive يعمل الآن بملء الشاشة مع كافة ميزات الأندرويد من أيقونة شاشتك الرئيسية.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-extrabold text-amber-300 text-sm flex items-center gap-1.5">
                        <Zap className="w-4 h-4 text-amber-400" />
                        <span>تثبيت MotoDrive مباشرة على هاتف الأندرويد</span>
                      </h3>
                      <p className="text-[11px] text-slate-300 mt-1">
                        لا داعي لانتظار تحميل خارجي، يمكنك تثبيته كأيقونة تطبيق كاملة على هاتفك فورياً:
                      </p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={handleDirectInstall}
                      className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20 transition-transform active:scale-95"
                    >
                      <Download className="w-4 h-4" />
                      <span>تثبيت التطبيق على هاتفي الآن (1-Click Install)</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Step by Step fallback instructions for Chrome Android */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-3">
                <h4 className="font-bold text-white text-xs sm:text-sm flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-amber-400" />
                  <span>طريقة التثبيت اليدوي على متصفح Chrome في هاتف الأندرويد:</span>
                </h4>
                <div className="space-y-2 text-xs text-slate-300 pr-2">
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-800 text-amber-400 font-bold flex items-center justify-center shrink-0 text-[10px]">
                      1
                    </span>
                    <span>اضغط على قائمة الثلاث نقاط (⋮) في الزاوية العلوية لمتصفح Chrome على هاتفك.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-800 text-amber-400 font-bold flex items-center justify-center shrink-0 text-[10px]">
                      2
                    </span>
                    <span>اختر <strong>"تثبيت التطبيق" (Install app)</strong> أو <strong>"الإضافة إلى الشاشة الرئيسية" (Add to Home screen)</strong>.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-800 text-amber-400 font-bold flex items-center justify-center shrink-0 text-[10px]">
                      3
                    </span>
                    <span>سيظهر تطبيق MotoDrive في درج التطبيقات وعلى شاشة هاتفك مثل أي تطبيق تم تنزيله من Google Play تماماً.</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: EXPORT FOR GOOGLE PLAY / CAPACITOR */}
          {activeTab === 'apk-export' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-3.5 flex items-center gap-3">
                <Terminal className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <h3 className="font-extrabold text-emerald-300 text-sm">
                    مشروع Android Studio المجهز وحزمة Capacitor
                  </h3>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    معرف الحزمة المعتمد: <code className="font-mono text-amber-300 bg-slate-900 px-1 py-0.5 rounded">com.motodrive.dz</code>
                  </p>
                </div>
              </div>

              {/* Commands to run */}
              <div className="space-y-3">
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">الخطوة 1: بناء وتوليد ملفات التطبيق للأندرويد</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard('npm run build && npx cap copy android', 1)}
                      className="text-[10px] text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedIndex === 1 ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedIndex === 1 ? 'تم النسخ!' : 'نسخ الأمر'}</span>
                    </button>
                  </div>
                  <pre className="bg-slate-900 p-2.5 rounded-xl font-mono text-[11px] text-amber-300 overflow-x-auto text-left" dir="ltr">
                    npm run build && npx cap copy android
                  </pre>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">الخطوة 2: فتح المشروع في Android Studio لاستخراج ملف الـ APK أو AAB</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard('npx cap open android', 2)}
                      className="text-[10px] text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedIndex === 2 ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedIndex === 2 ? 'تم النسخ!' : 'نسخ الأمر'}</span>
                    </button>
                  </div>
                  <pre className="bg-slate-900 p-2.5 rounded-xl font-mono text-[11px] text-amber-300 overflow-x-auto text-left" dir="ltr">
                    npx cap open android
                  </pre>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 space-y-2">
                  <span className="text-xs font-bold text-white">الخطوة 3: استخراج حزمة النشر في متجر Google Play:</span>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    من قائمة Android Studio: اختر <strong>Build</strong> ثم <strong>Generate Signed Bundle / APK</strong> واختر <strong>Android App Bundle (.aab)</strong>. الحزمة جاهزة للرفع مباشرة على Google Play Console!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ANDROID EXCLUSIVE FEATURES */}
          {activeTab === 'features' && (
            <div className="space-y-3 animate-in fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-2xl flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-xs">اهتزاز الهاتف اللمسي (Haptic Feedback)</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      نبضات اهتزاز هاتفية مدمجة عند قبول الرحلات، نقرات الأزرار، وحالات الطوارئ SOS.
                    </p>
                  </div>
                </div>

                <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-2xl flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-xs">إشعارات هاتفية ونغمات رنين</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      تنبيه السائق فورياً برنين واهتزاز هاتف الأندرويد حتى عند قفل الشاشة عند طلب مشوار جديد.
                    </p>
                  </div>
                </div>

                <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-2xl flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center shrink-0">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-xs">دعم زر الرجوع لهاتف الأندرويد (Back Button)</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      الضغط على زر الرجوع في الهاتف يغلق النوافذ المنبثقة والقوائم بسلاسة دون الخروج من التطبيق.
                    </p>
                  </div>
                </div>

                <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-2xl flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center shrink-0">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-xs">العمل دون اتصال (Offline Service Worker)</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      تخزين مؤقت عالي السرعة يضمن فتح التطبيق فوراً حتى في حالات ضعف شبكة الهاتف في الجزائر.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs">
          <div className="text-slate-400 text-[11px]">معرف التطبيق: com.motodrive.dz</div>
          <button
            type="button"
            onClick={() => {
              androidNativeService.vibrateTap();
              onClose();
            }}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl cursor-pointer transition-colors"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
