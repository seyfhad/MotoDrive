import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Driver, DriverApprovalStatus } from '../../types';
import {
  Bike,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Search,
  Filter,
  Shield,
  Phone,
  MapPin,
  Star,
  FileText,
  X,
} from 'lucide-react';

export const AdminDrivers: React.FC = () => {
  const { drivers, updateDriverStatus } = useApp();
  const [filter, setFilter] = useState<DriverApprovalStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [rejectReason, setRejectReason] = useState('الوثائق غير واضحة');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [zoomedImageUrl, setZoomedImageUrl] = useState<string | null>(null);

  const filteredDrivers = drivers.filter(d => {
    const matchesFilter = filter === 'all' || d.status === filter;
    const matchesSearch =
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.phone.includes(searchQuery) ||
      d.motorcycle.plateNumber.includes(searchQuery) ||
      d.motorcycle.brand.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleApprove = (driverId: string) => {
    updateDriverStatus(driverId, 'approved');
    if (selectedDriver && selectedDriver.id === driverId) {
      setSelectedDriver(prev => (prev ? { ...prev, status: 'approved' } : null));
    }
  };

  const handleReject = () => {
    if (!selectedDriver) return;
    updateDriverStatus(selectedDriver.id, 'rejected', rejectReason);
    setSelectedDriver(prev => (prev ? { ...prev, status: 'rejected', rejectionReason: rejectReason } : null));
    setShowRejectModal(false);
  };

  const handleSuspend = (driverId: string) => {
    updateDriverStatus(driverId, 'suspended');
    if (selectedDriver && selectedDriver.id === driverId) {
      setSelectedDriver(prev => (prev ? { ...prev, status: 'suspended' } : null));
    }
  };

  return (
    <div className="space-y-6 text-right text-slate-100" id="admin-drivers-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-black text-white">إدارة واعتماد السائقين (Drivers Management)</h2>
          <p className="text-xs text-slate-400">مراجعة ملفات السائقين، رخص السياقة، وحالة التفعيل الأمني</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="بحث بالاسم، رقم الهاتف، نوع الدراجة، أو لوحة الترقيم..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-2.5 pr-10 pl-4 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
          />
          <Search className="w-4 h-4 text-slate-500 absolute right-3.5 top-3" />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-2xl text-xs font-bold overflow-x-auto">
          {(['all', 'pending', 'approved', 'suspended', 'rejected'] as const).map(st => (
            <button
              key={st}
              onClick={() => setFilter(st)}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all ${
                filter === st ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
              }`}
            >
              {st === 'all' && `الكل (${drivers.length})`}
              {st === 'pending' && `المعلقة (${drivers.filter(d => d.status === 'pending').length})`}
              {st === 'approved' && `المعتمدة (${drivers.filter(d => d.status === 'approved').length})`}
              {st === 'suspended' && `الموقوفة (${drivers.filter(d => d.status === 'suspended').length})`}
              {st === 'rejected' && `المرفوضة (${drivers.filter(d => d.status === 'rejected').length})`}
            </button>
          ))}
        </div>
      </div>

      {/* Drivers Table / Cards */}
      {filteredDrivers.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-12 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto text-2xl">
            <Bike className="w-7 h-7" />
          </div>
          <h3 className="text-sm font-bold text-white">لا يوجد سائقون في هذه القائمة حالياً</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            عند قيام أي سائق بالتسجيل وإرسال وثائق دراجته النارية، ستظهر طلباته هنا فوراً لتتمكن من مراجعة الوثائق السبع واعتماد الحساب.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDrivers.map(driver => (
            <div
              key={driver.id}
              className="bg-slate-900 border border-slate-800/90 hover:border-slate-700 rounded-3xl p-5 space-y-4 shadow-lg transition-all"
            >
              {/* Driver Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={driver.photoUrl}
                    alt={driver.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-amber-500"
                  />
                  <div>
                    <div className="font-bold text-white text-sm">{driver.name}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{driver.phone}</div>
                    <div className="flex items-center gap-1 text-[10px] text-amber-400 font-semibold mt-0.5">
                      <Star className="w-3 h-3 fill-amber-400" />
                      <span>{(driver.rating ?? 5.0).toFixed(1)} ({driver.totalTrips ?? 0} رحلة)</span>
                    </div>
                  </div>
                </div>

                {/* Status Badge */}
                <span
                  className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border ${
                    driver.status === 'approved'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : driver.status === 'pending'
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      : driver.status === 'suspended'
                      ? 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                      : 'bg-red-500/10 text-red-400 border-red-500/20'
                  }`}
                >
                  {driver.status === 'approved' && 'معتمد'}
                  {driver.status === 'pending' && 'قيد المراجعة'}
                  {driver.status === 'suspended' && 'موقوف مؤقتاً'}
                  {driver.status === 'rejected' && 'مرفوض'}
                </span>
              </div>

              {/* Motorcycle & Wilaya */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 space-y-1.5 text-xs text-slate-300">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 text-[11px]">الدراجة:</span>
                  <span className="font-semibold text-white">
                    {driver.motorcycle.brand} {driver.motorcycle.model} ({driver.motorcycle.year})
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 text-[11px]">اللوحة:</span>
                  <span className="font-mono font-bold text-amber-400">{driver.motorcycle.plateNumber}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 text-[11px]">الموقع:</span>
                  <span>{driver.wilaya} - {driver.municipality}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => setSelectedDriver(driver)}
                  className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs transition-colors"
                >
                  عرض الوثائق والتفاصيل
                </button>

                {driver.status === 'pending' && (
                  <button
                    onClick={() => handleApprove(driver.id)}
                    className="px-3 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs transition-colors"
                  >
                    قبول وتفعيل
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Driver Details Modal */}
      {selectedDriver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 space-y-4 text-right">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <button
                onClick={() => setSelectedDriver(null)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="text-center">
                <h3 className="text-base font-black text-white">ملف السائق والوثائق الرسمية</h3>
                <p className="text-xs text-slate-400 font-mono">{selectedDriver.id}</p>
              </div>
              <div className="w-8"></div>
            </div>

            {/* Profile Info */}
            <div className="flex items-center gap-4 bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <img
                src={selectedDriver.photoUrl}
                alt={selectedDriver.name}
                className="w-16 h-16 rounded-full object-cover border-2 border-amber-500"
              />
              <div className="space-y-1">
                <div className="text-base font-bold text-white">{selectedDriver.name}</div>
                <div className="text-xs text-slate-400">{selectedDriver.phone}</div>
                <div className="text-xs text-slate-400">
                  {selectedDriver.wilaya} - {selectedDriver.municipality}
                </div>
              </div>
            </div>

            {/* Documents Preview Checklist & Images */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-300">الوثائق والصور المرفوعة للمراجعة (7 صور):</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {[
                  {
                    title: 'صورة شخصية (سيلفي)',
                    url: selectedDriver.documents?.selfieUrl || selectedDriver.photoUrl,
                  },
                  {
                    title: 'الدراجة النارية (أمامي)',
                    url: selectedDriver.documents?.motorcycleFrontUrl || selectedDriver.documents?.motorcyclePhotosUrls?.[0],
                  },
                  {
                    title: 'الدراجة النارية (خلفي)',
                    url: selectedDriver.documents?.motorcycleBackUrl || selectedDriver.documents?.motorcyclePhotosUrls?.[1],
                  },
                  {
                    title: 'رخصة السياقة (أمامي)',
                    url: selectedDriver.documents?.licenseFrontUrl || selectedDriver.documents?.licenseUrl,
                  },
                  {
                    title: 'رخصة السياقة (خلفي)',
                    url: selectedDriver.documents?.licenseBackUrl,
                  },
                  {
                    title: 'البطاقة الرمادية (أمامي)',
                    url: selectedDriver.documents?.vehicleDocFrontUrl || selectedDriver.documents?.vehicleRegistrationUrl,
                  },
                  {
                    title: 'البطاقة الرمادية (خلفي)',
                    url: selectedDriver.documents?.vehicleDocBackUrl,
                  },
                ].map((doc, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-950 p-2 rounded-2xl border border-slate-800 space-y-1.5 flex flex-col"
                  >
                    <div className="text-[10px] font-bold text-slate-300 truncate">{doc.title}</div>
                    {doc.url ? (
                      <div
                        className="relative h-24 w-full rounded-xl overflow-hidden border border-slate-800 bg-slate-900 group cursor-pointer"
                        onClick={() => setZoomedImageUrl(doc.url || null)}
                      >
                        <img
                          src={doc.url}
                          alt={doc.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[10px] text-white font-bold">
                          تكبير 🔍
                        </div>
                      </div>
                    ) : (
                      <div className="h-24 w-full rounded-xl bg-slate-900/60 border border-dashed border-slate-800 flex items-center justify-center text-[10px] text-slate-500">
                        لم يتم الرفع
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Decision Controls */}
            <div className="pt-3 border-t border-slate-800 space-y-2">
              <div className="text-xs font-bold text-slate-300">اتخاذ القرار الإداري:</div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleApprove(selectedDriver.id)}
                  className="py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs transition-colors"
                >
                  قبول وتفعيل الحساب
                </button>

                <button
                  onClick={() => handleSuspend(selectedDriver.id)}
                  className="py-3 bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold rounded-xl text-xs transition-colors"
                >
                  إيقاف مؤقت
                </button>

                <button
                  onClick={() => setShowRejectModal(true)}
                  className="py-3 bg-red-500 hover:bg-red-400 text-white font-bold rounded-xl text-xs transition-colors"
                >
                  رفض الملف
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Reason Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 max-w-xs w-full text-right space-y-3">
            <h4 className="text-sm font-bold text-red-400">تحديد سبب رفض السائق</h4>
            <p className="text-xs text-slate-400">سيتم إرسال هذا السبب إلى السائق في التطبيق:</p>
            <div className="space-y-1.5">
              {[
                'الوثائق غير واضحة أو صور مقطوعة',
                'رخصة السياقة منتهية الصلاحية',
                'عمر الدراجة النارية يتجاوز الحد المسموح',
                'عدم توفر تأمين ساري المفعول',
              ].map(r => (
                <button
                  key={r}
                  onClick={() => setRejectReason(r)}
                  className={`w-full text-right p-2 rounded-xl text-xs ${
                    rejectReason === r ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-950 text-slate-300'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => setShowRejectModal(false)}
                className="py-2.5 bg-slate-800 text-slate-300 text-xs rounded-xl font-bold"
              >
                تراجع
              </button>
              <button
                onClick={handleReject}
                className="py-2.5 bg-red-500 text-white text-xs rounded-xl font-bold"
              >
                تأكيد الرفض
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Zoom Image Modal */}
      {zoomedImageUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in"
          onClick={() => setZoomedImageUrl(null)}
        >
          <div
            className="relative max-w-3xl w-full bg-slate-900 border border-slate-700 rounded-3xl p-3 shadow-2xl space-y-3"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold text-slate-300">معاينة الوثيقة مكبّرة 🔍</span>
              <button
                onClick={() => setZoomedImageUrl(null)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="max-h-[75vh] overflow-auto flex items-center justify-center bg-black/50 rounded-2xl p-2">
              <img
                src={zoomedImageUrl}
                alt="Document preview"
                className="max-h-[70vh] w-auto max-w-full object-contain rounded-xl"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
