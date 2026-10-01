import React, { useEffect, useState } from 'react';
import { DriverApplication } from '../../types';
import {
  subscribePendingDriverApplications,
  approveDriverApplication,
  rejectDriverApplication,
} from '../../services/driverApplicationsService';
import {
  X,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  RotateCw,
  Phone,
  MapPin,
  ShieldCheck,
  AlertTriangle,
  Loader2,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { MotoIcon } from '../shared/MotoIcon';

interface AdminApplicationsReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminApplicationsReviewModal: React.FC<AdminApplicationsReviewModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [applications, setApplications] = useState<DriverApplication[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedApp, setSelectedApp] = useState<DriverApplication | null>(null);

  // Zoom / Image Preview
  const [zoomedImage, setZoomedImage] = useState<{ url: string; title: string } | null>(null);
  const [zoomRotation, setZoomRotation] = useState<number>(0);

  // Reject reason dialog
  const [rejectingApp, setRejectingApp] = useState<DriverApplication | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('الوثائق المرفقة غير واضحة أو منتهية الصلاحية');

  // Real-time onSnapshot subscription with clean unsubscribe
  useEffect(() => {
    if (!isOpen) return;

    setLoading(true);
    const unsubscribe = subscribePendingDriverApplications((pendingApps) => {
      setApplications(pendingApps);
      setLoading(false);

      // Keep selected application up to date or select the first one
      if (pendingApps.length > 0) {
        setSelectedApp((prev) => {
          if (!prev) return pendingApps[0];
          const found = pendingApps.find((a) => a.id === prev.id);
          return found || pendingApps[0];
        });
      } else {
        setSelectedApp(null);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleApprove = async (app: DriverApplication) => {
    if (!window.confirm(`هل أنت متأكد من اعتماد السائق "${app.fullName}"؟\nسيتم تفعيل حسابه كـ سائق مؤهل فوراً في Firestore.`)) {
      return;
    }

    setProcessingId(app.id);
    try {
      await approveDriverApplication(app.id, app.driverId, 'admin');
      alert(`تم اعتماد السائق "${app.fullName}" بنجاح في Firestore ✅`);
    } catch (err: any) {
      console.error('Error approving application:', err);
      alert(`حدث خطأ أثناء الاعتماد: ${err?.message || err}`);
    } finally {
      setProcessingId(null);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectingApp) return;

    setProcessingId(rejectingApp.id);
    try {
      await rejectDriverApplication(
        rejectingApp.id,
        rejectingApp.driverId,
        rejectReason.trim() || 'الوثائق غير مطابقة للشروط',
        'admin'
      );
      alert(`تم رفض الطلب وتحديث حالة السائق في Firestore بنجاح ❌`);
      setRejectingApp(null);
    } catch (err: any) {
      console.error('Error rejecting application:', err);
      alert(`حدث خطأ أثناء الرفض: ${err?.message || err}`);
    } finally {
      setProcessingId(null);
    }
  };

  const getDocImage = (app: DriverApplication, key: 'selfie' | 'motorcyclePhoto' | 'license' | 'vehicleRegistration'): string => {
    const docs = app.documents || {};
    if (key === 'selfie') return docs.selfieUrl || '';
    if (key === 'motorcyclePhoto') return docs.motorcyclePhotoUrl || docs.motorcycleFrontUrl || '';
    if (key === 'license') return docs.licenseUrl || docs.licenseFrontUrl || '';
    if (key === 'vehicleRegistration') return docs.vehicleRegistrationUrl || docs.vehicleDocFrontUrl || '';
    return '';
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in"
      id="admin-applications-review-modal"
      dir="rtl"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-right text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <span>طلبات تسجيل السائقين المعلقة (driver_applications)</span>
                <span className="text-xs font-mono font-bold bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full">
                  {applications.length} طلب
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                مراجعة وثائق السائقين الـ 4، وتفعيل أو رفض الحساب في Firestore مباشرة
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {loading ? (
            <div className="py-20 text-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-amber-400 mx-auto" />
              <p className="text-xs text-slate-400">جاري تحميل طلبات السائقين من Firestore...</p>
            </div>
          ) : applications.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto text-2xl">
                ✓
              </div>
              <h4 className="text-sm font-bold text-white">لا توجد طلبات معلقة حالياً</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                تمت معالجة كافة طلبات انضمام السائقين، ولا توجد وثائق في انتظار التدقيق.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Left Column: Applications List (Cards) */}
              <div className="lg:col-span-4 space-y-2.5 max-h-[70vh] overflow-y-auto pl-1">
                {applications.map((app) => {
                  const isSelected = selectedApp?.id === app.id;
                  const isThisProcessing = processingId === app.id;

                  return (
                    <div
                      key={app.id}
                      onClick={() => setSelectedApp(app)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer text-right ${
                        isSelected
                          ? 'bg-amber-500/10 border-amber-500/50 shadow-md'
                          : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-xs text-white truncate">{app.fullName}</span>
                        <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                          معلق ⏳
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-400 space-y-0.5">
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-500" />
                          <span className="font-mono">{app.phone}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-500" />
                          <span className="truncate">{app.wilaya} • {app.municipality}</span>
                        </div>
                        <div className="flex items-center gap-1 text-slate-300 font-semibold pt-1 border-t border-slate-800/80">
                          <MotoIcon className="w-3.5 h-3.5 text-amber-400" />
                          <span>{app.motorcycle?.brand} {app.motorcycle?.model} ({app.motorcycle?.plateNumber})</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Right Column: Selected Application Details & 4 Verification Images */}
              {selectedApp && (
                <div className="lg:col-span-8 bg-slate-950 border border-slate-800 rounded-3xl p-4 sm:p-5 space-y-4">
                  {/* Driver Header Summary */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                    <div>
                      <h4 className="text-base font-black text-white">{selectedApp.fullName}</h4>
                      <p className="text-xs text-slate-400">
                        {selectedApp.wilaya} • {selectedApp.municipality} | هاتف: <span className="font-mono text-amber-400">{selectedApp.phone}</span>
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleApprove(selectedApp)}
                        disabled={processingId === selectedApp.id}
                        className="py-2 px-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
                      >
                        {processingId === selectedApp.id ? (
                          <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 text-slate-950" />
                        )}
                        <span>قبول واعتماد السائق</span>
                      </button>

                      <button
                        onClick={() => setRejectingApp(selectedApp)}
                        disabled={processingId === selectedApp.id}
                        className="py-2 px-3 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 hover:text-white border border-red-500/30 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                      >
                        <XCircle className="w-4 h-4 text-red-400" />
                        <span>رفض الطلب</span>
                      </button>
                    </div>
                  </div>

                  {/* Vehicle Information Banner */}
                  <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-3 text-xs grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div>
                      <span className="text-slate-500 text-[10px] block">العلامة والموديل:</span>
                      <span className="font-bold text-white">{selectedApp.motorcycle?.brand} {selectedApp.motorcycle?.model}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">سنة الصنع:</span>
                      <span className="font-bold text-white">{selectedApp.motorcycle?.year || 2023}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">لوحة الترقيم:</span>
                      <span className="font-mono font-bold text-amber-400">{selectedApp.motorcycle?.plateNumber || 'غير محدد'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">تاريخ الإرسال:</span>
                      <span className="font-mono text-[11px] text-slate-400">{new Date(selectedApp.submittedAt).toLocaleDateString('ar-DZ')}</span>
                    </div>
                  </div>

                  {/* The EXACT 4 Verification Documents Grid */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-amber-400">
                      <span>الوثائق الـ 4 المرفقة (Base64 مضغوطة):</span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        محفوظة مباشرة في Firestore
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {[
                        { key: 'selfie' as const, label: '1. سيلفي السائق' },
                        { key: 'motorcyclePhoto' as const, label: '2. الدراجة النارية' },
                        { key: 'license' as const, label: '3. رخصة السياقة' },
                        { key: 'vehicleRegistration' as const, label: '4. البطاقة الرمادية' },
                      ].map((item) => {
                        const url = getDocImage(selectedApp, item.key);

                        return (
                          <div
                            key={item.key}
                            className="bg-slate-900 border border-slate-800 rounded-2xl p-2 text-center space-y-1.5 flex flex-col justify-between"
                          >
                            <span className="text-[10px] font-bold text-slate-300 block truncate">
                              {item.label}
                            </span>

                            {url ? (
                              <div
                                className="relative aspect-square rounded-xl overflow-hidden border border-slate-700 bg-black cursor-pointer group shadow-sm"
                                onClick={() => setZoomedImage({ url, title: `${selectedApp.fullName} - ${item.label}` })}
                              >
                                <img
                                  src={url}
                                  alt={item.label}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs gap-1 font-bold">
                                  <Eye className="w-4 h-4" />
                                  <span>معاينة</span>
                                </div>
                              </div>
                            ) : (
                              <div className="aspect-square rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-center text-slate-600 text-xs">
                                غير مرفق
                              </div>
                            )}

                            {url && (
                              <button
                                type="button"
                                onClick={() => setZoomedImage({ url, title: `${selectedApp.fullName} - ${item.label}` })}
                                className="w-full py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[10px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                              >
                                <Eye className="w-3 h-3" />
                                <span>تكبير</span>
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Reject Reason Dialog Modal */}
      {rejectingApp && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in"
          onClick={() => setRejectingApp(null)}
        >
          <div
            className="bg-slate-900 border border-red-500/40 rounded-3xl max-w-md w-full p-5 space-y-4 shadow-2xl text-right text-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h4 className="text-sm font-bold text-red-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                <span>رفض طلب السائق: {rejectingApp.fullName}</span>
              </h4>
              <button
                onClick={() => setRejectingApp(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              يرجى تحديد سبب الرفض ليظهر للسائق في حسابه لتحديث حالته في Firestore.
            </p>

            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="اكتب سبب الرفض هنا..."
              className="w-full bg-slate-950 border border-slate-700 rounded-2xl p-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-red-500"
            />

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={handleConfirmReject}
                disabled={processingId === rejectingApp.id}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-black text-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {processingId === rejectingApp.id ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
                <span>تأكيد الرفض في Firestore</span>
              </button>
              <button
                onClick={() => setRejectingApp(null)}
                className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview & Zoom Modal */}
      {zoomedImage && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-md animate-in fade-in"
          onClick={() => {
            setZoomedImage(null);
            setZoomRotation(0);
          }}
        >
          <div
            className="relative max-w-3xl w-full bg-slate-900 border border-slate-700 rounded-3xl p-4 shadow-2xl space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-bold text-amber-400 truncate">{zoomedImage.title}</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setZoomRotation((r) => (r + 90) % 360)}
                  className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>تدوير</span>
                </button>
                <button
                  onClick={() => {
                    setZoomedImage(null);
                    setZoomRotation(0);
                  }}
                  className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="max-h-[75vh] overflow-auto flex items-center justify-center bg-black/60 rounded-2xl p-2">
              <img
                src={zoomedImage.url}
                alt={zoomedImage.title}
                style={{ transform: `rotate(${zoomRotation}deg)` }}
                className="max-h-[70vh] w-auto max-w-full object-contain rounded-xl shadow-lg transition-transform duration-200"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default AdminApplicationsReviewModal;
