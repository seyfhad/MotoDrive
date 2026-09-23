import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { User, Phone, Mail, Shield, AlertTriangle, MessageSquare, LogOut, Check, ChevronLeft, CheckCircle2, Sparkles } from 'lucide-react';
import { GoogleSignInButton } from '../../components/auth/GoogleSignInButton';
import { signOutUser } from '../../services/authService';

export const PassengerProfile: React.FC = () => {
  const { activePassenger, setActivePassenger, currentUser, setCurrentUser, passengers, complaints, broadcastNotification } = useApp();
  const [editingEmergency, setEditingEmergency] = useState(false);
  const [emergencyName, setEmergencyName] = useState(activePassenger.emergencyContact?.name || '');
  const [emergencyPhone, setEmergencyPhone] = useState(activePassenger.emergencyContact?.phone || '');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const passengerComplaints = complaints.filter(c => c.userId === activePassenger.id);

  const isGoogleConnected = Boolean(currentUser && (currentUser.email || currentUser.photoURL));

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      await signOutUser();
      setCurrentUser(null);
      broadcastNotification('تسجيل الخروج', 'تم تسجيل الخروج بنجاح.');
    } catch (e) {
      console.error(e);
    } finally {
      setIsSigningOut(false);
    }
  };

  const handleSaveEmergency = () => {
    activePassenger.emergencyContact = {
      name: emergencyName,
      phone: emergencyPhone,
    };
    setEditingEmergency(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="max-w-md mx-auto px-4 py-6 text-right text-slate-100 space-y-4 pb-24" id="passenger-profile-screen">
      {/* Header Profile Card */}
      <div className="bg-slate-900 border border-slate-800/90 rounded-3xl p-5 shadow-xl text-center space-y-3">
        <div className="relative w-20 h-20 mx-auto">
          <img
            src={activePassenger.photoUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
            alt={activePassenger.name}
            className="w-full h-full rounded-full object-cover border-3 border-amber-500 shadow-xl"
          />
          <span className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-emerald-500 border-2 border-slate-900 text-slate-950 flex items-center justify-center text-[10px] font-bold">
            ✓
          </span>
        </div>

        <div>
          <h3 className="text-lg font-black text-white">{activePassenger.name}</h3>
          <p className="text-xs text-slate-400 mt-0.5">{activePassenger.phone}</p>
        </div>

        {/* Switch demo passenger for testing */}
        <div className="pt-2 border-t border-slate-800/80">
          <div className="text-[11px] text-slate-500 mb-1.5 font-medium">تبديل حساب الراكب (للتجربة):</div>
          <div className="flex items-center justify-center gap-2">
            {passengers.map(p => (
              <button
                key={p.id}
                onClick={() => setActivePassenger(p)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                  p.id === activePassenger.id
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-slate-950 text-slate-400 border border-slate-800'
                }`}
              >
                {p.name.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Google Authentication Status Card */}
      <div className="bg-slate-900 border border-slate-800/90 rounded-3xl p-5 space-y-3" id="google-auth-profile-card">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h4 className="text-sm font-bold text-white">المصادقة وحساب Google</h4>
          </div>
          {isGoogleConnected ? (
            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <CheckCircle2 className="w-3 h-3" />
              متصل
            </span>
          ) : (
            <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
              حساب تجريبي / ضيف
            </span>
          )}
        </div>

        {isGoogleConnected ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
              <div className="flex items-center gap-2.5">
                <img
                  src={currentUser?.photoURL || activePassenger.photoUrl || ''}
                  alt="Avatar"
                  className="w-8 h-8 rounded-full object-cover border border-emerald-500/50"
                />
                <div>
                  <div className="font-bold text-white text-xs">{currentUser?.displayName || activePassenger.name}</div>
                  <div className="text-[11px] text-slate-400 font-mono" dir="ltr">{currentUser?.email || activePassenger.email}</div>
                </div>
              </div>
            </div>

            <button
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-slate-800 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30 border border-slate-700 text-slate-200 font-semibold transition-all disabled:opacity-60"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{isSigningOut ? 'جاري تسجيل الخروج...' : 'تسجيل الخروج من حساب Google'}</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            <p className="text-[11px] text-slate-400 leading-relaxed">
              اربط حسابك بحساب Google لمزامنة مشاويرك وعروضك وسجل رحلاتك على أي جهاز بشكل فوري وآمن.
            </p>
            <GoogleSignInButton
              role="passenger"
              label="تسجيل الدخول وربط الحساب بـ Google"
              id="profile-google-signin-btn"
            />
          </div>
        )}
      </div>

      {/* Emergency Contact Card */}
      <div className="bg-slate-900 border border-slate-800/90 rounded-3xl p-5 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-red-400" />
            <h4 className="text-sm font-bold text-white">جهة اتصال الطوارئ</h4>
          </div>
          <button
            onClick={() => setEditingEmergency(!editingEmergency)}
            className="text-xs text-amber-400 font-semibold"
          >
            {editingEmergency ? 'إلغاء' : 'تعديل'}
          </button>
        </div>

        {savedSuccess && (
          <div className="text-xs text-emerald-400 bg-emerald-500/10 p-2 rounded-xl border border-emerald-500/20">
            تم حفظ جهة اتصال الطوارئ بنجاح.
          </div>
        )}

        {editingEmergency ? (
          <div className="space-y-2 text-xs">
            <input
              type="text"
              placeholder="الاسم والقرابة (مثال: الأخ / الوالد)"
              value={emergencyName}
              onChange={e => setEmergencyName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
            />
            <input
              type="tel"
              placeholder="رقم الهاتف (05...)"
              value={emergencyPhone}
              onChange={e => setEmergencyPhone(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
            />
            <button
              onClick={handleSaveEmergency}
              className="w-full py-2 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs"
            >
              حفظ
            </button>
          </div>
        ) : (
          <div className="text-xs text-slate-300 bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80 flex items-center justify-between">
            <div>
              <div className="font-bold text-white">
                {activePassenger.emergencyContact?.name || 'لم يتم تحديد جهة اتصال'}
              </div>
              <div className="text-slate-400 text-[11px] mt-0.5">
                {activePassenger.emergencyContact?.phone || 'أضف جهة اتصال لمشاركتها عند الطوارئ'}
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center font-bold">
              SOS
            </div>
          </div>
        )}
      </div>

      {/* Safety & App Guidelines */}
      <div className="bg-slate-900 border border-slate-800/90 rounded-3xl p-4 space-y-2 text-xs">
        <h4 className="font-bold text-slate-200 mb-2">تعليمات السلامة لركاب MotoDrive:</h4>
        <div className="space-y-1.5 text-slate-400 text-[11px] leading-relaxed">
          <p>• ارتداء الخوذة الواقية إلزامي طوال مسار الرحلة.</p>
          <p>• التمسك بالمقابض الجانبية أو خصر السائق لتوازن أفضل عند المنعطفات.</p>
          <p>• أقصى مسافة مسموحة للرحلة هي 70 كم كحد أقصى للحفاظ على سلامتك.</p>
          <p>• السعر المعتمد يبدأ من 120 د.ج ويتم التفاوض عليه بشفافية تامة.</p>
        </div>
      </div>

      {/* Legal, Privacy & Compliance */}
      <div className="bg-slate-900 border border-slate-800/90 rounded-3xl p-4 space-y-2.5 text-xs">
        <div className="flex items-center justify-between">
          <div className="font-bold text-white flex items-center gap-1.5">
            <span>⚖️</span>
            <span>الامتثال القانوني والخصوصية</span>
          </div>
          <span className="text-[10px] text-amber-400 font-mono">v1.2.0 Production</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          <button
            type="button"
            onClick={() =>
              window.dispatchEvent(
                new CustomEvent('open-user-guide', {
                  detail: { tab: 'passenger' },
                }),
              )
            }
            className="p-2.5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 rounded-xl text-amber-300 font-bold text-center transition-colors cursor-pointer"
          >
            دليل الاستخدام 📖
          </button>

          <button
            type="button"
            onClick={() =>
              window.dispatchEvent(
                new CustomEvent('open-legal', {
                  detail: { tab: 'privacy' },
                }),
              )
            }
            className="p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-300 hover:text-white font-semibold text-center transition-colors cursor-pointer"
          >
            حول التطبيق
          </button>

          <button
            type="button"
            onClick={() =>
              window.dispatchEvent(
                new CustomEvent('open-legal', {
                  detail: { tab: 'privacy' },
                }),
              )
            }
            className="p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-300 hover:text-white font-semibold text-center transition-colors cursor-pointer"
          >
            سياسة الخصوصية
          </button>

          <button
            type="button"
            onClick={() =>
              window.dispatchEvent(
                new CustomEvent('open-legal', {
                  detail: { tab: 'terms' },
                }),
              )
            }
            className="p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-300 hover:text-white font-semibold text-center transition-colors cursor-pointer"
          >
            شروط الاستخدام
          </button>
        </div>
      </div>
    </div>
  );
};
