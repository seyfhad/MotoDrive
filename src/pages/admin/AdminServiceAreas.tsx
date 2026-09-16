import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { MapPin, Check, X, Shield, Plus } from 'lucide-react';

export const AdminServiceAreas: React.FC = () => {
  const { serviceAreas, toggleServiceArea } = useApp();
  const [areas, setAreas] = useState(serviceAreas);

  const handleToggle = (id: string) => {
    toggleServiceArea(id);
    setAreas(prev =>
      prev.map(a => (a.id === id ? { ...a, isActive: !a.isActive } : a))
    );
  };

  return (
    <div className="space-y-6 text-right text-slate-100 max-w-4xl" id="admin-service-areas-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-black text-white">نطاق التغطية والولايات (Service Areas)</h2>
          <p className="text-xs text-slate-400">تفعيل وتعطيل خدمة MotoDZ في ولايات الجزائر ونصف قطر التغطية</p>
        </div>
      </div>

      {/* Wilayas Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {areas.map(area => (
          <div
            key={area.id}
            className={`border rounded-3xl p-5 space-y-3 transition-all ${
              area.isActive
                ? 'bg-slate-900 border-slate-800'
                : 'bg-slate-950/40 border-slate-900 opacity-60'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black ${
                    area.isActive
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {area.code}
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">{area.nameAr}</h4>
                  <p className="text-[10px] text-slate-400 font-sans">{area.nameFr}</p>
                </div>
              </div>

              {/* Active Toggle Switch */}
              <button
                onClick={() => handleToggle(area.id)}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                  area.isActive ? 'bg-emerald-500 justify-end' : 'bg-slate-800 justify-start'
                }`}
              >
                <div className="bg-white w-4 h-4 rounded-full shadow-md transform transition-transform"></div>
              </button>
            </div>

            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800/80 space-y-1 text-xs text-slate-300">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 text-[11px]">نصف قطر التغطية:</span>
                <span className="font-bold text-white">{area.radiusKm} كم</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 text-[11px]">حالة الخدمة:</span>
                <span
                  className={`font-bold text-[11px] ${
                    area.isActive ? 'text-emerald-400' : 'text-slate-500'
                  }`}
                >
                  {area.isActive ? 'مفعلة وتستقبل الطلبات' : 'معطلة مؤقتاً'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
