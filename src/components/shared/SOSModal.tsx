import React, { useState } from 'react';
import { Ride } from '../../types';
import { AlertTriangle, Phone, Share2, ShieldAlert, X, Check, Copy } from 'lucide-react';

interface SOSModalProps {
  onClose: () => void;
  activeRide: Ride | null;
}

export const SOSModal: React.FC<SOSModalProps> = ({ onClose, activeRide }) => {
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);

  const copyRideInfo = () => {
    const text = activeRide
      ? `معلومات طوارئ رحلة MotoDrive:\nرقم الرحلة: ${activeRide.id}\nالانطلاق: ${activeRide.pickup.name || activeRide.pickup.address}\nالوجهة: ${activeRide.destination.name || activeRide.destination.address}\nالسائق: ${activeRide.driverName || 'قيد البحث'}`
      : `طلب مساعدة طوارئ من تطبيق MotoDrive`;

    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const shareEmergency = () => {
    setShared(true);
    setTimeout(() => setShared(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in" id="sos-modal-backdrop">
      <div className="bg-slate-900 border-2 border-red-500/50 rounded-3xl max-w-md w-full p-6 shadow-2xl relative text-right text-slate-100" id="sos-modal-content">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 w-9 h-9 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-500">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-lg font-black text-red-400">زر الطوارئ والمساعدة (SOS)</h3>
            <p className="text-xs text-slate-400">خدمات المساعدة والسلامة في الجزائر</p>
          </div>
        </div>

        {/* Active Ride Card if ongoing */}
        {activeRide && (
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 mb-5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">رقم الرحلة الحالية:</span>
              <span className="font-mono font-bold text-amber-400">{activeRide.id}</span>
            </div>
            <div className="text-xs text-slate-300">
              <div className="truncate">📍 <span className="text-slate-400">من:</span> {activeRide.pickup.name || activeRide.pickup.address}</div>
              <div className="truncate">🏁 <span className="text-slate-400">إلى:</span> {activeRide.destination.name || activeRide.destination.address}</div>
              {activeRide.driverName && (
                <div className="mt-1 pt-1 border-t border-slate-900 text-amber-300 font-semibold">
                  🏍️ السائق: {activeRide.driverName} ({activeRide.driverMotorcycle?.plateNumber})
                </div>
              )}
            </div>
          </div>
        )}

        {/* Emergency Algeria Contacts List */}
        <div className="space-y-2.5 mb-5">
          <a
            href="tel:17"
            className="flex items-center justify-between p-3.5 rounded-2xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/40 text-red-300 font-bold transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-red-500 text-slate-950 flex items-center justify-center">
                <Phone className="w-4 h-4" />
              </div>
              <div className="text-right">
                <div className="text-sm">الشرطة الجزائرية (Police)</div>
                <div className="text-[11px] text-red-400/80 font-normal">خط النجدة السريع</div>
              </div>
            </div>
            <span className="font-mono text-lg font-black bg-red-500/20 px-3 py-1 rounded-xl">17</span>
          </a>

          <a
            href="tel:14"
            className="flex items-center justify-between p-3.5 rounded-2xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 font-bold transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center">
                <Phone className="w-4 h-4" />
              </div>
              <div className="text-right">
                <div className="text-sm">الحماية المدنية (Protection Civile)</div>
                <div className="text-[11px] text-amber-400/80 font-normal">الإسعاف والطوارئ الطبية</div>
              </div>
            </div>
            <span className="font-mono text-lg font-black bg-amber-500/20 px-3 py-1 rounded-xl">14</span>
          </a>

          <a
            href="tel:1055"
            className="flex items-center justify-between p-3.5 rounded-2xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 font-bold transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center">
                <Phone className="w-4 h-4" />
              </div>
              <div className="text-right">
                <div className="text-sm">الدرك الوطني (Gendarmerie)</div>
                <div className="text-[11px] text-emerald-400/80 font-normal">الطرق السريعة والولائية</div>
              </div>
            </div>
            <span className="font-mono text-lg font-black bg-emerald-500/20 px-3 py-1 rounded-xl">1055</span>
          </a>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-2.5 mb-4">
          <button
            onClick={copyRideInfo}
            className="flex items-center justify-center gap-2 py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'تم النسخ' : 'نسخ تفاصيل الرحلة'}</span>
          </button>

          <button
            onClick={shareEmergency}
            className="flex items-center justify-center gap-2 py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-colors"
          >
            {shared ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
            <span>{shared ? 'تمت المشاركة' : 'مشاركة مع العائلة'}</span>
          </button>
        </div>

        {/* Legal & Safety Note */}
        <p className="text-[10px] text-slate-500 text-center leading-relaxed">
          تنبيه أمان: هذا الزر مخصص لحالات الطوارئ الفعلية للمساعدة السريعة ومشاركة بيانات الرحلة ولا يعتبر بديلاً عن أجهزة الدولة الرسمية.
        </p>
      </div>
    </div>
  );
};
