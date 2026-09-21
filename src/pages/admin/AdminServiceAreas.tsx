import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { MapPin, Check, X, Shield, Search, CheckCircle2, XCircle } from 'lucide-react';
import { normalizeSearchString } from '../../data/algeriaLocations';

export const AdminServiceAreas: React.FC = () => {
  const { serviceAreas, toggleServiceArea } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const filteredAreas = serviceAreas.filter(area => {
    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'active'
        ? area.isActive
        : !area.isActive;

    if (!matchesStatus) return false;

    if (!searchQuery.trim()) return true;

    const normQ = normalizeSearchString(searchQuery);
    const codeStr = String(area.code || area.wilayaCode || '');
    const normAr = normalizeSearchString(area.nameAr || '');
    const normFr = normalizeSearchString(area.nameFr || area.name || '');

    return (
      codeStr === searchQuery.trim() ||
      codeStr.padStart(2, '0') === searchQuery.trim().padStart(2, '0') ||
      normAr.includes(normQ) ||
      normFr.includes(normQ)
    );
  });

  const activeCount = serviceAreas.filter(a => a.isActive).length;
  const inactiveCount = serviceAreas.length - activeCount;

  return (
    <div className="space-y-6 text-right text-slate-100 max-w-5xl" id="admin-service-areas-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-black text-white">نطاق التغطية والـ 58 ولاية جزائرية</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            إدارة وتفعيل خدمة MotoDrive في جميع ولايات الجزائر الـ 58 وضبط نطاقات التغطية
          </p>
        </div>

        {/* Stats summary */}
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {activeCount} مفعلة
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-400 text-xs font-bold flex items-center gap-1.5">
            <XCircle className="w-3.5 h-3.5" />
            {inactiveCount} معطلة
          </span>
        </div>
      </div>

      {/* Controls: Search and Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="ابحث برقم الولاية (مثلاً: 16، 24) أو اسمها بالعربية والفرنسية..."
            className="w-full pr-10 pl-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 self-center sm:self-auto">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              statusFilter === 'all'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            الكل ({serviceAreas.length})
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              statusFilter === 'active'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            المفعلة ({activeCount})
          </button>
          <button
            onClick={() => setStatusFilter('inactive')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              statusFilter === 'inactive'
                ? 'bg-rose-500 text-white shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            المعطلة ({inactiveCount})
          </button>
        </div>
      </div>

      {/* Wilayas Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredAreas.map(area => {
          const code = area.code || area.wilayaCode;
          const nameFr = area.nameFr || area.name;
          return (
            <div
              key={area.id}
              className={`border rounded-2xl p-4 space-y-3 transition-all ${
                area.isActive
                  ? 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                  : 'bg-slate-950/40 border-slate-900 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                      area.isActive
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {String(code).padStart(2, '0')}
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm leading-snug">{area.nameAr}</h4>
                    <p className="text-[11px] text-slate-400 font-sans">{nameFr}</p>
                  </div>
                </div>

                {/* Active Toggle Switch */}
                <button
                  type="button"
                  onClick={() => toggleServiceArea(area.id)}
                  title={area.isActive ? 'تعطيل الولاية' : 'تفعيل الولاية'}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                    area.isActive ? 'bg-emerald-500 justify-end' : 'bg-slate-800 justify-start'
                  }`}
                >
                  <div className="bg-white w-4 h-4 rounded-full shadow-md transform transition-transform" />
                </button>
              </div>

              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 space-y-1 text-xs text-slate-300">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 text-[11px]">نصف قطر التغطية:</span>
                  <span className="font-bold text-white font-sans">{area.radiusKm} km</span>
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
          );
        })}
      </div>

      {filteredAreas.length === 0 && (
        <div className="text-center py-12 bg-slate-900/40 rounded-3xl border border-slate-800 text-slate-400">
          <p className="text-sm">لم يتم العثور على ولاية مطابقة لـ "{searchQuery}"</p>
        </div>
      )}
    </div>
  );
};

