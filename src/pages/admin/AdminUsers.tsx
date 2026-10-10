import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { UserProfile } from '../../types';
import { Users, Search, Phone, Star, Shield, Ban, Trash2, CheckCircle2, X } from 'lucide-react';

export const AdminUsers: React.FC = () => {
  const { passengers, rides, suspendPassenger, deletePassenger } = useApp();
  const [search, setSearch] = useState('');

  const [suspendTarget, setSuspendTarget] = useState<UserProfile | null>(null);
  const [suspendReason, setSuspendReason] = useState('مخالفة شروط الاستخدام وقوانين منصة MotoDrive');

  const [deleteTarget, setDeleteTarget] = useState<UserProfile | null>(null);
  const [deleteReason, setDeleteReason] = useState('قرار من المسؤول بحذف الحساب نهائياً');

  const filtered = passengers.filter(
    p => p.name.toLowerCase().includes(search.toLowerCase()) || p.phone.includes(search)
  );

  const handleConfirmSuspend = () => {
    if (!suspendTarget) return;
    suspendPassenger(suspendTarget.id, suspendReason);
    setSuspendTarget(null);
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    deletePassenger(deleteTarget.id, deleteReason);
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-6 text-right text-slate-100" id="admin-users-screen">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-black text-white">مسؤول حسابات الركاب (Passengers Management)</h2>
          <p className="text-xs text-slate-400">قائمة مستخدمي التطبيق وإحصاءات الرحلات مع إمكانية تعليق أو حذف الحساب مع كتابة السبب</p>
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
          const isSuspended = user.status === 'suspended';
          return (
            <div
              key={user.id}
              className="bg-slate-900 border border-slate-800/90 rounded-3xl p-5 space-y-3 shadow-lg"
            >
              <div className="flex items-center gap-3">
                <img
                  src={user.photoUrl || '/icon.jpg'}
                  alt={user.name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-amber-500"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/icon.jpg';
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-white text-sm truncate">{user.name}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5" dir="ltr">{user.phone}</div>
                  <div className="flex items-center gap-1 text-[10px] text-amber-400 font-semibold mt-0.5">
                    <Star className="w-3 h-3 fill-amber-400" />
                    <span>{(user.rating ?? 5.0).toFixed(1)} ({user.totalTrips ?? userRides.length} رحلة)</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-1.5 text-xs text-slate-300">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 text-[11px]">جهة اتصال الطوارئ:</span>
                  <span className="font-semibold text-white">
                    {user.emergencyContact?.name || 'غير مسجلة'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 text-[11px]">حالة الحساب:</span>
                  <span className={`font-bold ${isSuspended ? 'text-red-400' : 'text-emerald-400'}`}>
                    {isSuspended ? 'موقوف (معلق)' : 'نشط ومفعل'}
                  </span>
                </div>
              </div>

              {/* Admin Actions: Suspend / Activate & Delete */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    if (isSuspended) {
                      suspendPassenger(user.id, 'إلغاء تعليق الحساب وتفعيله من طرف المسؤول');
                    } else {
                      setSuspendTarget(user);
                    }
                  }}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                    isSuspended
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                      : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  <Ban className="w-3.5 h-3.5" />
                  <span>{isSuspended ? 'إلغاء التعليق (تفعيل)' : 'تعليق الحساب'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDeleteTarget(user)}
                  className="px-3 py-2 bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-400 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                  title="حذف الحساب نهائياً مع إرسال السبب"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Suspend Reason Modal */}
      {suspendTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 max-w-sm w-full text-right space-y-3.5 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h4 className="text-sm font-black text-amber-400">سبب تعليق حساب الراكب</h4>
              <button
                type="button"
                onClick={() => setSuspendTarget(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              يرجى كتابة السبب الموجه لحساب الراكب <span className="text-white font-bold">{suspendTarget.name}</span>:
            </p>

            <div>
              <textarea
                value={suspendReason}
                onChange={e => setSuspendReason(e.target.value)}
                rows={3}
                placeholder="أدخل سبب تعليق الحساب هنا..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-1">
              {[
                'مخالفة شروط الاستخدام وقوانين منصة MotoDrive',
                'إلغاء متكرر للرحلات بدون مبرر',
                'سلوك غير لائق مع السائقين',
              ].map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setSuspendReason(r)}
                  className={`w-full text-right px-3 py-1.5 rounded-xl text-[11px] transition-all border ${
                    suspendReason === r
                      ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setSuspendTarget(null)}
                className="py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl font-bold cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleConfirmSuspend}
                className="py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs rounded-xl font-black cursor-pointer shadow-lg shadow-amber-500/20"
              >
                تأكيد وتعليق الحساب
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Reason Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 max-w-sm w-full text-right space-y-3.5 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h4 className="text-sm font-black text-red-400">سبب حذف حساب الراكب</h4>
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              يرجى كتابة سبب الحذف النهائي الموجه للراكب <span className="text-white font-bold">{deleteTarget.name}</span>:
            </p>

            <div>
              <textarea
                value={deleteReason}
                onChange={e => setDeleteReason(e.target.value)}
                rows={3}
                placeholder="أدخل سبب الحذف هنا..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="space-y-1">
              {[
                'قرار من المسؤول بحذف الحساب نهائياً لمخالفة سياسة المنصة',
                'طلب من المستخدم حذف حسابه نهائياً',
                'حساب وهمي أو بيانات غير صحيحة',
              ].map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setDeleteReason(r)}
                  className={`w-full text-right px-3 py-1.5 rounded-xl text-[11px] transition-all border ${
                    deleteReason === r
                      ? 'bg-red-500/20 border-red-500/50 text-red-300 font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl font-bold cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="py-2.5 bg-red-500 hover:bg-red-600 text-white text-xs rounded-xl font-black cursor-pointer shadow-lg shadow-red-500/20"
              >
                تأكيد الحذف النهائي
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
