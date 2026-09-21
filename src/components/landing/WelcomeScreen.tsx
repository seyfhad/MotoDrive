import React from 'react';
import { LogIn, ArrowLeft, Shield, FileText, CheckCircle2, Bike, Sparkles, MapPin, Zap } from 'lucide-react';

interface WelcomeScreenProps {
  onOpenLogin: () => void;
  onContinueAsGuest: () => void;
  onOpenLegal: (tab: 'privacy' | 'terms' | 'gcp-guide') => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onOpenLogin,
  onContinueAsGuest,
  onOpenLegal,
}) => {
  return (
    <div
      className="min-h-screen w-full flex flex-col justify-between p-5 sm:p-7 bg-slate-950 text-slate-100 relative overflow-hidden text-right"
      id="motodrive-welcome-screen"
      dir="rtl"
    >
      {/* Subtle Ambient Background Lighting */}
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header / Brand Badge */}
      <div className="relative z-10 flex items-center justify-between pt-2">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 font-black text-lg shadow-lg shadow-amber-500/20">
            🏍️
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-black tracking-tight text-white font-sans">
                Moto<span className="text-amber-400">Drive</span>
              </span>
              <span className="text-[11px] px-1.5 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold">
                الجزائر 🇩🇿
              </span>
            </div>
            <p className="text-[10px] text-slate-400">منصة النقل الذكي بالدراجات النارية</p>
          </div>
        </div>

        <div className="text-[11px] text-slate-400 flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>58 ولاية نشطة</span>
        </div>
      </div>

      {/* Main Hero & Value Proposition */}
      <div className="relative z-10 my-auto py-8 space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">
            تنقل بحرية وسرعة، <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-l from-amber-400 to-amber-200">
              وتفاوض على سعرك مباشرة
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-sm">
            أول تطبيق جزائري يربط الركاب بسائقي الدراجات النارية لتفادي الازدحام المروري، مع نظام تسعير حر وتتبع فوري بالـ GPS.
          </p>
        </div>

        {/* Feature Highlights Bento */}
        <div className="space-y-2.5">
          <div className="p-3 bg-slate-900/80 border border-slate-800/80 rounded-2xl flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div className="text-right">
              <h2 className="text-xs font-bold text-white">وصول أسرع بمرتين وتجاوز الازدحام</h2>
              <p className="text-[11px] text-slate-400">تجاوز اختناقات الطرق في العاصمة وكافة الولايات بكل سلاسة.</p>
            </div>
          </div>

          <div className="p-3 bg-slate-900/80 border border-slate-800/80 rounded-2xl flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="text-right">
              <h2 className="text-xs font-bold text-white">تفاوض حر وشفاف على الأجرة</h2>
              <p className="text-[11px] text-slate-400">اقترح سعرك وتلقّ عروض السائقين واختر الأنسب لك ولرحلتك.</p>
            </div>
          </div>

          <div className="p-3 bg-slate-900/80 border border-slate-800/80 rounded-2xl flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4" />
            </div>
            <div className="text-right">
              <h2 className="text-xs font-bold text-white">تغطية وطنية ودقة GPS عالية</h2>
              <p className="text-[11px] text-slate-400">تحديد فوري للموقع على الخريطة ومسارات دقيقة من الباب إلى الباب.</p>
            </div>
          </div>
        </div>

        {/* Primary Action Button - Single clean sign-in button */}
        <div className="space-y-2.5 pt-2">
          <button
            type="button"
            id="welcome-login-btn"
            onClick={onOpenLogin}
            className="w-full py-4 px-5 rounded-2xl bg-amber-500 hover:bg-amber-400 active:scale-[0.99] text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-amber-500/20 transition-all cursor-pointer"
          >
            <LogIn className="w-4 h-4 shrink-0" />
            <span>تسجيل الدخول / إنشاء حساب</span>
          </button>

          <p className="text-center text-[11px] text-amber-400/90 font-medium">
            * تسجيل الدخول ضروري لجميع الركاب وسائقي الدراجات لاستخدام التطبيق
          </p>
        </div>
      </div>

      {/* Footer with Mandatory Legal & Privacy Buttons for Google Cloud */}
      <div className="relative z-10 pt-4 border-t border-slate-900 space-y-3">
        {/* Google Cloud & Algerian Compliance Badge */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-medium">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>ممتثل لسياسات Google Cloud والمعايير القانونية الجزائرية</span>
        </div>

        {/* The Two Small Bottom Buttons: Privacy Policy & Terms of Service */}
        <div className="flex items-center justify-center gap-2.5">
          {/* زر سياسة الخصوصية */}
          <button
            type="button"
            id="welcome-privacy-btn"
            onClick={() => onOpenLegal('privacy')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 text-slate-300 hover:text-amber-300 text-xs font-semibold transition-all cursor-pointer"
          >
            <Shield className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>سياسة الخصوصية</span>
          </button>

          <span className="text-slate-700">•</span>

          {/* زر شروط الاستخدام */}
          <button
            type="button"
            id="welcome-terms-btn"
            onClick={() => onOpenLegal('terms')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 text-slate-300 hover:text-amber-300 text-xs font-semibold transition-all cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>شروط الاستخدام</span>
          </button>
        </div>

        <div className="text-center text-[10px] text-slate-500">
          MotoDrive Algérie © 2026 • جميع الحقوق محفوظة
        </div>
      </div>
    </div>
  );
};
