import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import {
  X,
  User,
  Phone,
  ShieldCheck,
  LogOut,
  CheckCircle2,
  Lock,
  AlertTriangle,
  MessageCircle,
  PhoneCall,
} from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose }) => {
  const { activePassenger, activeDriver, currentRole, currentUser, logout } = useApp();
  const [showReportOptions, setShowReportOptions] = useState(false);

  if (!isOpen) return null;

  const isDriverView = currentRole === 'driver' && activeDriver;
  const displayName = isDriverView ? activeDriver.name : activePassenger.name;
  const displayPhone = isDriverView ? activeDriver.phone : activePassenger.phone || '0542524728';
  const displayPhoto =
    (isDriverView ? activeDriver.photoUrl : activePassenger.photoUrl) ||
    currentUser?.photoURL ||
    (activePassenger.role === 'admin'
      ? '/assets/images/admin_logo.jpg'
      : isDriverView
      ? '/assets/images/driver_logo.jpg'
      : '/assets/images/passenger_logo.jpg');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in"
      id="user-profile-modal"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-5 text-right text-slate-100 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="text-center">
            <h3 className="text-base font-black text-white flex items-center gap-1.5 justify-center">
              <span>بيانات الحساب</span>
              <User className="w-4 h-4 text-amber-400" />
            </h3>
            <p className="text-[11px] text-slate-400">بيانات الحساب موثقة وغير قابلة للتعديل</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-sm">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>

        {/* Locked Avatar Photo Section */}
        <div className="text-center space-y-2">
          <div className="relative w-20 h-20 mx-auto">
            <img
              src={displayPhoto}
              alt={displayName}
              className="w-full h-full rounded-full object-cover border-3 border-amber-500 shadow-xl"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/icon.jpg';
              }}
            />
            <span
              className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-slate-800 text-amber-400 border-2 border-slate-900 flex items-center justify-center shadow-md"
              title="الصورة الشخصية مقفولة"
            >
              <Lock className="w-3.5 h-3.5" />
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-semibold block">
            🔒 الصورة الشخصية والاسم ورقم الهاتف ثابتة ومقفولة
          </span>
        </div>

        {/* Account Status Badge */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="text-right">
              <span className="text-[10px] text-emerald-400 font-bold block">حساب مفعل برقم الهاتف</span>
              <span className="text-slate-300 font-mono text-[11px]" dir="ltr">
                {displayPhone}
              </span>
            </div>
          </div>
          <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20 font-bold">
            {activePassenger.role === 'admin' ? 'المسؤول' : isDriverView ? 'سائق' : 'راكب'}
          </span>
        </div>

        {/* Read-only Name and Phone */}
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">الاسم الكامل (ثابت):</label>
            <div className="w-full bg-slate-950/90 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 font-bold flex items-center justify-between">
              <span>{displayName}</span>
              <Lock className="w-3.5 h-3.5 text-slate-500" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">رقم الهاتف (ثابت):</label>
            <div className="w-full bg-slate-950/90 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 font-mono flex items-center justify-between" dir="ltr">
              <span>{displayPhone}</span>
              <Lock className="w-3.5 h-3.5 text-slate-500" />
            </div>
          </div>
        </div>

        {/* Report a Problem & Facebook Contact Buttons */}
        <div className="pt-2 border-t border-slate-800 space-y-2.5">
          <button
            type="button"
            onClick={() => setShowReportOptions(!showReportOptions)}
            className="w-full py-3 px-4 bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-300 font-bold rounded-2xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span>إبلاغ عن مشكلة</span>
          </button>

          {showReportOptions && (
            <div className="p-3 bg-slate-950 border border-red-500/30 rounded-2xl space-y-2 animate-in fade-in">
              <p className="text-[11px] text-slate-300 font-semibold text-center">
                تواصل مباشرة مع المسؤول لحل المشكلة فوراً:
              </p>
              <a
                href="tel:0542524728"
                className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition-all"
              >
                <PhoneCall className="w-4 h-4" />
                <span>اتصال بالمسؤول (0542524728)</span>
              </a>
            </div>
          )}

          <a
            href="https://www.facebook.com/share/1DnSTUk7WL/"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 px-4 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 font-bold rounded-2xl text-xs flex items-center justify-center gap-2 transition-all"
          >
            <MessageCircle className="w-4 h-4 text-blue-400" />
            <span>إرسال رسالة عبر فيسبوك</span>
          </a>
        </div>

        {currentUser && (
          <button
            type="button"
            onClick={async () => {
              await logout();
              onClose();
            }}
            className="w-full py-2.5 bg-slate-800 hover:bg-red-500/20 border border-slate-700 hover:border-red-500/30 text-slate-300 hover:text-red-400 font-bold rounded-2xl text-xs flex items-center justify-center gap-2 transition-colors mt-2 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>تسجيل الخروج من الحساب</span>
          </button>
        )}
      </div>
    </div>
  );
};
