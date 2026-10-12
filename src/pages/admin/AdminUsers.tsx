import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { UserProfile } from '../../types';
import { AdminDriversPanel } from '../../components/admin/AdminDriversPanel';
import { MotoIcon } from '../../components/shared/MotoIcon';
import {
  Users,
  Search,
  Star,
  Ban,
  Trash2,
  X,
  UserCheck,
  Filter,
  Home,
  Briefcase,
} from 'lucide-react';

export interface AdminUsersProps {
  initialRoleFilter?: 'all' | 'driver' | 'passenger';
}

export const AdminUsers: React.FC<AdminUsersProps> = ({ initialRoleFilter = 'all' }) => {
  const { passengers, drivers, rides, suspendPassenger, deletePassenger } = useApp();
  const [roleFilter, setRoleFilter] = useState<'all' | 'pending_drivers' | 'approved_drivers' | 'passenger'>(
    initialRoleFilter === 'driver' ? 'pending_drivers' : initialRoleFilter
  );
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (initialRoleFilter === 'driver') {
      setRoleFilter('pending_drivers');
    } else {
      setRoleFilter(initialRoleFilter);
    }
  }, [initialRoleFilter]);

  const [suspendTarget, setSuspendTarget] = useState<UserProfile | null>(null);
  const [suspendReason, setSuspendReason] = useState('مخالفة شروط الاستخدام وقوانين منصة MotoDrive');

  const [deleteTarget, setDeleteTarget] = useState<UserProfile | null>(null);
  const [deleteReason, setDeleteReason] = useState('قرار من المسؤول بحذف الحساب نهائياً');

  // Filter out user profiles that belong purely to drivers when displaying passenger cards so there is no confusion, or show all passenger records
  const passengerProfiles = passengers.filter((p) => p.role !== 'driver');

  const filteredPassengers = passengerProfiles.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.phone && p.phone.includes(search))
  );

  const pendingDriversCount = drivers.filter((d) => d.status === 'pending').length;
  const approvedDriversCount = drivers.filter((d) => d.status === 'approved').length;
  const totalUsersCount = drivers.length + passengerProfiles.length;

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
    <div className="space-y-6 text-right text-slate-100" id="admin-users-screen" dir="rtl">
      {/* Unified Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-400" />
              <span>إدارة المستخدمين الموحدة (السائقين والركاب)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              قائمة موحدة لجميع مستخدمي المنصة مع تبويب وفلتر خاص لكل نوع مستخدم (سائق / راكب) لسهولة المراجعة والإدارة
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-bold">
              الإجمالي: <span className="text-amber-400 font-black">{totalUsersCount}</span>
            </span>
          </div>
        </div>

        {/* Role Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2" id="admin-users-role-filter-tabs">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 ml-2">
            <Filter className="w-3.5 h-3.5 text-amber-400" />
            <span>نوع العرض:</span>
          </div>

          <button
            type="button"
            onClick={() => setRoleFilter('all')}
            className={`px-3 py-2 rounded-2xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
              roleFilter === 'all'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                : 'bg-slate-950 text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>الكل</span>
          </button>

          <button
            type="button"
            onClick={() => setRoleFilter('pending_drivers')}
            className={`px-3 py-2 rounded-2xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
              roleFilter === 'pending_drivers'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                : 'bg-slate-950 text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>طلبات السائقين</span>
            {pendingDriversCount > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                roleFilter === 'pending_drivers' ? 'bg-slate-950 text-amber-400' : 'bg-amber-500 text-slate-950 animate-pulse'
              }`}>
                {pendingDriversCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setRoleFilter('approved_drivers')}
            className={`px-3 py-2 rounded-2xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
              roleFilter === 'approved_drivers'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                : 'bg-slate-950 text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>السائقون المقبولون ({approvedDriversCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setRoleFilter('passenger')}
            className={`px-3 py-2 rounded-2xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
              roleFilter === 'passenger'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                : 'bg-slate-950 text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>الركاب ({passengerProfiles.length})</span>
          </button>
        </div>
      </div>

      {/* 1. PENDING DRIVERS REQUESTS SECTION */}
      {(roleFilter === 'all' || roleFilter === 'pending_drivers') && (
        <div className="space-y-3" id="admin-pending-drivers-section">
          {roleFilter === 'all' && (
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-black text-amber-400 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>طلبات تسجيل السائقين المعلقة ({pendingDriversCount})</span>
              </h3>
            </div>
          )}
          <AdminDriversPanel initialStatusFilter="pending" />
        </div>
      )}

      {/* 2. APPROVED DRIVERS SECTION */}
      {(roleFilter === 'all' || roleFilter === 'approved_drivers') && (
        <div className="space-y-3 pt-4 border-t border-slate-800" id="admin-approved-drivers-section">
          {roleFilter === 'all' && (
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-black text-emerald-400 flex items-center gap-2">
                <UserCheck className="w-4 h-4" />
                <span>قائمة السائقين المقبولين ({approvedDriversCount})</span>
              </h3>
            </div>
          )}
          <AdminDriversPanel initialStatusFilter="approved" />
        </div>
      )}

      {/* 2. PASSENGERS SECTION (Shown when filter is 'all' or 'passenger') */}
      {(roleFilter === 'all' || roleFilter === 'passenger') && (
        <div className="space-y-4" id="admin-unified-passengers-section">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-400" />
                <span>قائمة حسابات الركاب ({passengerProfiles.length})</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                إحصاءات الرحلات والعناوين المحفوظة (المنزل/العمل) مع إمكانية تعليق أو حذف الحساب
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <input
                type="text"
                placeholder="بحث عن راكب بالاسم أو رقم الهاتف..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-2.5 pr-10 pl-4 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
              />
              <Search className="w-4 h-4 text-slate-500 absolute right-3.5 top-3" />
            </div>
          </div>

          {filteredPassengers.length === 0 ? (
            <div className="text-center p-10 bg-slate-900/40 border border-slate-800 rounded-3xl text-slate-400 text-xs">
              لا توجد حسابات ركاب مطابقة للبحث حالياً.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPassengers.map((user) => {
                const userRides = rides.filter((r) => r.passengerId === user.id);
                const isSuspended = user.status === 'suspended';
                return (
                  <div
                    key={user.id}
                    className="bg-slate-900 border border-slate-800/90 rounded-3xl p-5 space-y-3 shadow-lg"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={user.photoUrl || '/icon.jpg'}
                          alt={user.name}
                          className="w-12 h-12 rounded-full object-cover border-2 border-amber-500 shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/icon.jpg';
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-white text-sm truncate">{user.name}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5 font-mono" dir="ltr">
                            {user.phone}
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-amber-400 font-semibold mt-0.5">
                            <Star className="w-3 h-3 fill-amber-400" />
                            <span>
                              {(user.rating ?? 5.0).toFixed(1)} ({user.totalTrips ?? userRides.length} رحلة)
                            </span>
                          </div>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-blue-500/15 text-blue-300 border border-blue-500/30 shrink-0">
                        راكب
                      </span>
                    </div>

                    <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-1.5 text-xs text-slate-300">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-500 text-[11px] flex items-center gap-1 shrink-0">
                          <Home className="w-3 h-3 text-amber-400" />
                          <span>المنزل:</span>
                        </span>
                        <span className="font-semibold text-white truncate text-[11px]">
                          {user.homeLocation?.name || user.homeLocation?.address || 'غير محدد'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-500 text-[11px] flex items-center gap-1 shrink-0">
                          <Briefcase className="w-3 h-3 text-blue-400" />
                          <span>العمل:</span>
                        </span>
                        <span className="font-semibold text-white truncate text-[11px]">
                          {user.workLocation?.name || user.workLocation?.address || 'غير محدد'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 text-[11px]">حالة الحساب:</span>
                        <span
                          className={`font-bold ${
                            isSuspended ? 'text-red-400' : 'text-emerald-400'
                          }`}
                        >
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
                            suspendPassenger(
                              user.id,
                              'إلغاء تعليق الحساب وتفعيله من طرف المسؤول'
                            );
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
          )}
        </div>
      )}

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
              يرجى كتابة السبب الموجه لحساب الراكب{' '}
              <span className="text-white font-bold">{suspendTarget.name}</span>:
            </p>

            <div>
              <textarea
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
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
              ].map((r) => (
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
              يرجى كتابة سبب الحذف النهائي الموجه للراكب{' '}
              <span className="text-white font-bold">{deleteTarget.name}</span>:
            </p>

            <div>
              <textarea
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
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
              ].map((r) => (
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
