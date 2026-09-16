import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { User, Phone, Mail, Shield, AlertTriangle, MessageSquare, LogOut, Check, ChevronLeft } from 'lucide-react';

export const PassengerProfile: React.FC = () => {
  const { activePassenger, setActivePassenger, passengers, complaints } = useApp();
  const [editingEmergency, setEditingEmergency] = useState(false);
  const [emergencyName, setEmergencyName] = useState(activePassenger.emergencyContact?.name || '');
  const [emergencyPhone, setEmergencyPhone] = useState(activePassenger.emergencyContact?.phone || '');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const passengerComplaints = complaints.filter(c => c.userId === activePassenger.id);

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
        <h4 className="font-bold text-slate-200 mb-2">تعليمات السلامة لركاب MotoDZ:</h4>
        <div className="space-y-1.5 text-slate-400 text-[11px] leading-relaxed">
          <p>• ارتداء الخوذة الواقية إلزامي طوال مسار الرحلة.</p>
          <p>• التمسك بالمقابض الجانبية أو خصر السائق لتوازن أفضل عند المنعطفات.</p>
          <p>• الدفع نقدًا بالسعر المحدد مسبقًا في التطبيق دون أي زيادة.</p>
        </div>
      </div>
    </div>
  );
};
