import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { User, Star, Award, Shield, Phone, MapPin, BadgeCheck, MessageSquare } from 'lucide-react';
import { MotoIcon } from '../../components/shared/MotoIcon';
import { DriverIdentityVerificationCard } from '../../components/driver/DriverIdentityVerificationCard';
import { RegisterDriverModal } from '../../components/shared/RegisterDriverModal';
import { ProfileSkeleton } from '../../components/shared/Skeleton';

export const DriverProfile: React.FC = () => {
  const { activeDriver, setActiveDriver, drivers } = useApp();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState<boolean>(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoadingProfile(false), 350);
    return () => clearTimeout(timer);
  }, []);

  if (isLoadingProfile) {
    return (
      <div className="max-w-md mx-auto px-4 py-6 text-right text-slate-100 space-y-4 pb-24" id="driver-profile-screen">
        <ProfileSkeleton />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-6 text-right text-slate-100 space-y-4 pb-24" id="driver-profile-screen">
      {/* Header Profile Card */}
      <div className="bg-slate-900 border border-slate-800/90 rounded-3xl p-5 shadow-xl text-center space-y-3">
        <div className="relative w-20 h-20 mx-auto">
          <img
            src={activeDriver.photoUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'}
            alt={activeDriver.name}
            className="w-full h-full rounded-full object-cover border-3 border-amber-500 shadow-xl"
          />
          <span
            className={`absolute bottom-0 right-0 w-6 h-6 rounded-full border-2 border-slate-900 flex items-center justify-center text-[10px] font-bold ${
              activeDriver.status === 'approved'
                ? 'bg-emerald-500 text-slate-950'
                : activeDriver.status === 'pending'
                ? 'bg-amber-500 text-slate-950'
                : 'bg-red-500 text-white'
            }`}
            title={activeDriver.status === 'approved' ? 'موثق رسمياً' : 'قيد المراجعة'}
          >
            {activeDriver.status === 'approved' ? '✓' : '⏳'}
          </span>
        </div>

        <div>
          <div className="flex items-center justify-center gap-1.5 text-sm font-black text-white">
            <span>{activeDriver.name}</span>
            {activeDriver.status === 'approved' && (
              <BadgeCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5" dir="ltr">{activeDriver.phone}</p>
          <div className="inline-flex items-center gap-1 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full text-xs font-bold text-amber-400 mt-2">
            <Star className="w-3.5 h-3.5 fill-amber-400" />
            <span>{(activeDriver.rating ?? 5.0).toFixed(1)} ({activeDriver.totalTrips ?? 0} رحلة منجزة)</span>
          </div>
        </div>

        {/* Demo Driver Switcher for testing */}
        <div className="pt-3 border-t border-slate-800/80">
          <div className="text-[11px] text-slate-500 mb-1.5 font-medium">تبديل حساب السائق (للتجربة):</div>
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            {drivers.map(d => (
              <button
                key={d.id}
                onClick={() => setActiveDriver(d)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                  d.id === activeDriver.id
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-slate-950 text-slate-400 border border-slate-800'
                }`}
              >
                {d.name.split(' ')[0]} ({d.status === 'approved' ? 'معتمد' : 'معلق'})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Identity Verification Status Card (علامة صح خضراء والوثائق المعتمدة لتعزيز الثقة) */}
      <DriverIdentityVerificationCard
        driver={activeDriver}
        onOpenDocuments={() => setIsEditModalOpen(true)}
        onOpenContactSupport={() => window.dispatchEvent(new CustomEvent('open-contact-us'))}
      />

      {/* Motorcycle Specs */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
          <MotoIcon className="w-5 h-5 text-amber-400" />
          <h4 className="text-sm font-bold text-white">دراجتي النارية</h4>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between text-slate-300">
            <span className="text-slate-500">النوع والموديل:</span>
            <span className="font-bold text-white">{activeDriver.motorcycle.brand} {activeDriver.motorcycle.model} ({activeDriver.motorcycle.year})</span>
          </div>
          <div className="flex items-center justify-between text-slate-300">
            <span className="text-slate-500">اللون:</span>
            <span>{activeDriver.motorcycle.color}</span>
          </div>
          <div className="flex items-center justify-between text-slate-300">
            <span className="text-slate-500">رقم لوحة الترقيم:</span>
            <span className="font-mono font-bold text-amber-400">{activeDriver.motorcycle.plateNumber}</span>
          </div>
          <div className="flex items-center justify-between text-slate-300">
            <span className="text-slate-500">الولاية والبلدية:</span>
            <span>{activeDriver.wilaya} - {activeDriver.municipality}</span>
          </div>
        </div>
      </div>

      {/* Driver Legal & Policies */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 space-y-2.5 text-xs">
        <div className="flex items-center justify-between">
          <div className="font-bold text-white flex items-center gap-1.5">
            <span>⚖️</span>
            <span>الميثاق القانوني والخصوصية</span>
          </div>
          <span className="text-[10px] text-amber-400 font-mono">MotoDrive Algérie</span>
        </div>
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('open-legal', { detail: { tab: 'terms' } }))}
            className="p-2.5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 rounded-xl text-amber-300 font-bold text-center transition-colors cursor-pointer"
          >
            شروط الاستخدام 📄
          </button>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('open-legal', { detail: { tab: 'privacy' } }))}
            className="p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-300 hover:text-white font-semibold text-center transition-colors cursor-pointer"
          >
            سياسة الخصوصية
          </button>
        </div>
      </div>

      {/* Driver Registration / Documents update modal */}
      <RegisterDriverModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
      />
    </div>
  );
};

