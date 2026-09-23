import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { MotoIcon } from '../shared/MotoIcon';
import {
  Check,
  X,
  RefreshCw,
  Clock,
  Phone,
  MapPin,
  ShieldCheck,
  ShieldAlert,
  FileImage,
  User,
  Loader2,
  Eye,
} from 'lucide-react';

export interface SupabaseDriver {
  id: number;
  created_at: string;
  user_id?: string;
  email?: string;
  name: string;
  phone?: string;
  wilaya?: string;
  brand?: string;
  model?: string;
  plate_number?: string;
  license_image?: string;
  status: 'pending' | 'approved' | 'rejected';
}

export const AdminDriversPanel: React.FC = () => {
  const [drivers, setDrivers] = useState<SupabaseDriver[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  // جلب قائمة السائقين من Supabase
  const fetchDrivers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('Drivers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('خطأ في جلب السائقين من Supabase:', error.message);
      } else {
        setDrivers(data || []);
      }
    } catch (err) {
      console.error('حدث خطأ أثناء الاتصال:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  // تحديث حالة الطلب (قبول أو رفض)
  const handleUpdateStatus = async (id: number, newStatus: 'approved' | 'rejected') => {
    setUpdatingId(id);
    try {
      const { error } = await supabase
        .from('Drivers')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) {
        alert('تعذر تحديث حالة السائق: ' + error.message);
      } else {
        // تحديث القائمة محلياً
        setDrivers((prev) =>
          prev.map((drv) => (drv.id === id ? { ...drv, status: newStatus } : drv))
        );
      }
    } catch (err) {
      console.error('خطأ في التحديث:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  // تصفية السائقين بحسب التبويب المختار
  const filteredDrivers = drivers.filter((drv) => {
    if (filter === 'pending') return drv.status === 'pending';
    if (filter === 'approved') return drv.status === 'approved';
    if (filter === 'rejected') return drv.status === 'rejected';
    return true;
  });

  const pendingCount = drivers.filter((d) => d.status === 'pending').length;

  return (
    <div className="space-y-4 text-right text-slate-100 dir-rtl" dir="rtl">
      {/* رأس الصفحة وأزرار التصفية */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-lg">
        <div>
          <h2 className="text-base font-black text-white flex items-center gap-2">
            <MotoIcon className="w-5 h-5 text-amber-400" />
            <span>طلبات انضمام السائقين (Supabase)</span>
            {pendingCount > 0 && (
              <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
                {pendingCount} قيد الانتظار
              </span>
            )}
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">
            إدارة ومراجعة الوثائق المرفوعة ومعالجة الطلبات مباشرة من السحابة
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchDrivers}
            disabled={loading}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-xl transition-colors border border-slate-700 flex items-center gap-1.5 text-xs font-bold"
            title="تحديث البيانات"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">تحديث</span>
          </button>
        </div>
      </div>

      {/* تبويبات الفلترة */}
      <div className="flex gap-2 overflow-x-auto pb-1 text-xs">
        {[
          { key: 'all', label: `الكل (${drivers.length})` },
          { key: 'pending', label: `معلقة (${pendingCount})` },
          { key: 'approved', label: `مقبولة (${drivers.filter((d) => d.status === 'approved').length})` },
          { key: 'rejected', label: `مرفوضة (${drivers.filter((d) => d.status === 'rejected').length})` },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key as any)}
            className={`px-3.5 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all border ${
              filter === tab.key
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* قائمة السائقين */}
      {loading ? (
        <div className="p-12 text-center bg-slate-900/50 border border-slate-800 rounded-2xl space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-amber-400 mx-auto" />
          <p className="text-xs text-slate-400 font-medium">جاري جلب الطلبات من Supabase...</p>
        </div>
      ) : filteredDrivers.length === 0 ? (
        <div className="p-10 text-center bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
          <Clock className="w-10 h-10 text-slate-600 mx-auto" />
          <p className="text-sm font-bold text-slate-300">لا توجد طلبات سائقين في هذه القائمة</p>
          <p className="text-xs text-slate-500">الطلبات المسجلة حديثاً عبر التطبيق ستظهر هنا فوراً.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredDrivers.map((drv) => (
            <div
              key={drv.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 space-y-3 shadow-xl transition-all relative overflow-hidden"
            >
              {/* شريط الحالة العلوي */}
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center font-bold text-xs">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">{drv.name || 'بدون اسم'}</h3>
                    <p className="text-[10px] text-slate-400 font-mono" dir="ltr">
                      {drv.email || `ID: ${drv.user_id || drv.id}`}
                    </p>
                  </div>
                </div>

                <span
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-black flex items-center gap-1 border ${
                    drv.status === 'pending'
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      : drv.status === 'approved'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-red-500/10 text-red-400 border-red-500/20'
                  }`}
                >
                  {drv.status === 'pending' && <Clock className="w-3 h-3" />}
                  {drv.status === 'approved' && <ShieldCheck className="w-3 h-3" />}
                  {drv.status === 'rejected' && <ShieldAlert className="w-3 h-3" />}
                  <span>
                    {drv.status === 'pending'
                      ? 'قيد المراجعة'
                      : drv.status === 'approved'
                      ? 'مقبول'
                      : 'مرفوض'}
                  </span>
                </span>
              </div>

              {/* تفاصيل السائق والدراجة */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 space-y-1">
                  <span className="text-[10px] text-slate-500 block font-semibold">بيانات الاتصال</span>
                  <p className="text-slate-300 font-medium flex items-center gap-1 truncate" dir="ltr">
                    <Phone className="w-3 h-3 text-amber-400 shrink-0" />
                    <span>{drv.phone || 'غير مسجل'}</span>
                  </p>
                  <p className="text-slate-400 text-[11px] flex items-center gap-1 truncate">
                    <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
                    <span>{drv.wilaya || 'غير محددة'}</span>
                  </p>
                </div>

                <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 space-y-1">
                  <span className="text-[10px] text-slate-500 block font-semibold">الدراجة النارية</span>
                  <p className="text-slate-200 font-bold truncate">
                    {drv.brand || 'SYM'} {drv.model || ''}
                  </p>
                  <p className="text-amber-400 font-mono text-[11px] font-bold">
                    {drv.plate_number || 'بدون لوحة'}
                  </p>
                </div>
              </div>

              {/* معاينة صورة الوثيقة / الرخصة */}
              {drv.license_image ? (
                <div className="bg-slate-950/80 p-2 rounded-xl border border-slate-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <FileImage className="w-4 h-4 text-amber-400" />
                    <span className="text-xs text-slate-300 font-medium">صورة رخصة القيادة والوثيقة</span>
                  </div>
                  <button
                    onClick={() => setSelectedImage(drv.license_image || null)}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-lg text-[11px] font-bold flex items-center gap-1 border border-slate-700 transition-colors"
                  >
                    <Eye className="w-3 h-3" />
                    <span>تكبير</span>
                  </button>
                </div>
              ) : (
                <div className="p-2 bg-slate-950/40 rounded-xl text-center text-[11px] text-slate-500">
                  لم يتم رفع صورة الرخصة
                </div>
              )}

              {/* أزرار القبول والرفض */}
              <div className="pt-1 flex items-center gap-2">
                {drv.status !== 'approved' && (
                  <button
                    onClick={() => handleUpdateStatus(drv.id, 'approved')}
                    disabled={updatingId === drv.id}
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-colors disabled:opacity-50"
                  >
                    {updatingId === drv.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>قبول السائق</span>
                      </>
                    )}
                  </button>
                )}

                {drv.status !== 'rejected' && (
                  <button
                    onClick={() => handleUpdateStatus(drv.id, 'rejected')}
                    disabled={updatingId === drv.id}
                    className="flex-1 py-2 bg-red-600/80 hover:bg-red-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-colors disabled:opacity-50"
                  >
                    {updatingId === drv.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <>
                        <X className="w-3.5 h-3.5" />
                        <span>رفض الطلب</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* نافذة معاينة الصورة مكبرة */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="relative bg-slate-900 border border-slate-800 rounded-3xl p-2 max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col items-center justify-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-800/80 text-white hover:bg-red-500 flex items-center justify-center transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={selectedImage}
              alt="معاينة الوثيقة"
              className="w-full h-auto max-h-[75vh] object-contain rounded-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};
