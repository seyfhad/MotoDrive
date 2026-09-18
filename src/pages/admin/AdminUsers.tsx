import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Users, Search, Phone, Star, Shield } from 'lucide-react';

export const AdminUsers: React.FC = () => {
  const { passengers, rides } = useApp();
  const [search, setSearch] = useState('');

  const filtered = passengers.filter(
    p => p.name.toLowerCase().includes(search.toLowerCase()) || p.phone.includes(search)
  );

  return (
    <div className="space-y-6 text-right text-slate-100" id="admin-users-screen">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-black text-white">إدارة حسابات الركاب (Passengers Management)</h2>
          <p className="text-xs text-slate-400">قائمة مستخدمي التطبيق وإحصاءات الرحلات والتقييمات</p>
        </div>
      </div>

      <div className="relative max-w-md">
        <input
          type="text"
          placeholder="بحث بالاسم أو رقم الهاتف..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-2.5 pr-10 pl-4 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
        />
        <Search className="w-4 h-4 text-slate-500 absolute right-3.5 top-3" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(user => {
          const userRides = rides.filter(r => r.passengerId === user.id);
          return (
            <div
              key={user.id}
              className="bg-slate-900 border border-slate-800/90 rounded-3xl p-5 space-y-3 shadow-lg"
            >
              <div className="flex items-center gap-3">
                <img
                  src={user.photoUrl}
                  alt={user.name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-amber-500"
                />
                <div>
                  <div className="font-bold text-white text-sm">{user.name}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{user.phone}</div>
                  <div className="flex items-center gap-1 text-[10px] text-amber-400 font-semibold mt-0.5">
                    <Star className="w-3 h-3 fill-amber-400" />
                    <span>{(user.rating ?? 5.0).toFixed(1)} ({user.totalTrips ?? userRides.length} رحلة)</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-1 text-xs text-slate-300">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 text-[11px]">جهة اتصال الطوارئ:</span>
                  <span className="font-semibold text-white">
                    {user.emergencyContact?.name || 'غير مسجلة'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 text-[11px]">حالة الحساب:</span>
                  <span className="text-emerald-400 font-bold">نشط ومفعل</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
