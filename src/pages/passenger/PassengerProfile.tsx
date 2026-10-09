import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { User, Phone, Mail, Shield, AlertTriangle, MessageSquare, LogOut, Check, ChevronLeft, CheckCircle2, Sparkles } from 'lucide-react';
import { signOutUser } from '../../services/authService';
import { ProfileSkeleton } from '../../components/shared/Skeleton';
import { UserProfileModal } from '../../components/shared/UserProfileModal';
import { Camera, FileText } from 'lucide-react';

export const PassengerProfile: React.FC = () => {
  const { activePassenger, setActivePassenger, currentUser, setCurrentUser, passengers, complaints, broadcastNotification } = useApp();
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEmergency, setEditingEmergency] = useState(false);
  const [emergencyName, setEmergencyName] = useState(activePassenger.emergencyContact?.name || '');
  const [emergencyPhone, setEmergencyPhone] = useState(activePassenger.emergencyContact?.phone || '');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoadingProfile(false), 350);
    return () => clearTimeout(timer);
  }, []);

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

  if (isLoadingProfile) {
    return (
      <div className="max-w-md mx-auto px-4 py-6 text-right text-slate-100 space-y-4 pb-24" id="passenger-profile-screen">
        <ProfileSkeleton />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-6 text-right text-slate-100 space-y-4 pb-24" id="passenger-profile-screen">
      {/* Header Profile Card */}
      <div className="bg-slate-900 border border-slate-800/90 rounded-3xl p-5 shadow-xl text-center space-y-3">
        <div className="relative w-20 h-20 mx-auto">
          <img
            src={
              activePassenger.photoUrl ||
              (activePassenger.role === 'admin' ? '/assets/images/admin_logo.jpg' : '/assets/images/passenger_logo.jpg')
            }
            alt={activePassenger.name}
            className="w-full h-full rounded-full object-cover border-3 border-amber-500 shadow-xl cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => setShowEditModal(true)}
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                activePassenger.role === 'admin' ? '/assets/images/admin_logo.jpg' : '/assets/images/passenger_logo.jpg';
            }}
          />
          <button
            type="button"
            onClick={() => setShowEditModal(true)}
            className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-amber-500 text-slate-950 border-2 border-slate-900 flex items-center justify-center text-[10px] font-bold shadow-md hover:bg-amber-400 cursor-pointer transition-transform hover:scale-105"
            title="تغيير الصورة أو رفع وثيقة"
          >
            <Camera className="w-3.5 h-3.5" />
          </button>
        </div>

        <div>
          <h3 className="text-lg font-black text-white">{activePassenger.name}</h3>
          <p className="text-xs text-slate-400 mt-0.5">{activePassenger.phone}</p>
        </div>
      </div>

      {/* Phone Account Status Card */}
      <div className="bg-slate-900 border border-slate-800/90 rounded-3xl p-5 space-y-3" id="phone-auth-profile-card">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            <h4 className="text-sm font-bold text-white">معلومات الحساب</h4>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs border border-amber-500/30">
                <Phone className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-white text-xs">{activePassenger.name}</div>
                <div className="text-[11px] text-slate-400 font-mono" dir="ltr">{activePassenger.phone || '0550123456'}</div>
              </div>
            </div>
            <span className="text-[10px] text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded-md font-bold">
              راكب
            </span>
          </div>

          <button
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-800 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30 border border-slate-700 text-slate-200 font-semibold text-xs transition-all disabled:opacity-60 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{isSigningOut ? 'جاري تسجيل الخروج...' : 'تسجيل الخروج من الحساب'}</span>
          </button>
        </div>
      </div>

      {/* Emergency Contact Card */}
      <div className="bg-slate-900 border border-slate-800/90 rounded-3xl p-5 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-red-400" />
            <h4 className="text-sm font-bold text-white">جهة اتصال الطوارئ</h4>
          </div>
          <span className="text-[10px] text-slate-400 font-bold bg-slate-800 px-2 py-0.5 rounded-full">
            مسجلة
          </span>
        </div>

        <div className="text-xs text-slate-300 bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80 flex items-center justify-between">
          <div>
            <div className="font-bold text-white">
              {activePassenger.emergencyContact?.name || 'جهة اتصال الطوارئ مسجلة'}
            </div>
            <div className="text-slate-400 text-[11px] mt-0.5">
              {activePassenger.emergencyContact?.phone || 'جهة اتصالات الأمان للحساب'}
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center font-bold">
            SOS
          </div>
        </div>
      </div>

      {/* Safety & App Guidelines */}
      <div className="bg-slate-900 border border-slate-800/90 rounded-3xl p-4 space-y-2 text-xs">
        <h4 className="font-bold text-slate-200 mb-2">تعليمات السلامة لركاب MotoDrive:</h4>
        <div className="space-y-1.5 text-slate-400 text-[11px] leading-relaxed">
          <p>• ارتداء الخوذة الواقية إلزامي طوال مسار الرحلة.</p>
          <p>• التمسك بالمقابض الجانبية أو خصر السائق لتوازن أفضل عند المنعطفات.</p>
          <p>• أقصى مسافة مسموحة للرحلة هي 70 كم كحد أقصى للحفاظ على سلامتك.</p>
          <p>• السعر المعتمد يبدأ من 110 د.ج وهو سعر رسمي ثابت حسب شريحة المسافة.</p>
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

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={() =>
              window.dispatchEvent(
                new CustomEvent('open-legal', {
                  detail: { tab: 'terms' },
                }),
              )
            }
            className="p-2.5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 rounded-xl text-amber-300 font-bold text-center transition-colors cursor-pointer"
          >
            شروط الاستخدام 📄
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
        </div>
      </div>

      <UserProfileModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
      />
    </div>
  );
};
