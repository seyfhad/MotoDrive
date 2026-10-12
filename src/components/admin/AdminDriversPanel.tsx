import React, { useEffect, useState } from 'react';
import { db, isFirestoreQuotaExceeded } from '../../lib/firebase';
import {
  collection,
  onSnapshot,
  doc,
  deleteDoc as fbDeleteDoc,
} from 'firebase/firestore';

const deleteDoc = async (reference: any): Promise<void> => {
  if (isFirestoreQuotaExceeded()) return;
  await fbDeleteDoc(reference);
};
import { 
  updateDriverStatusInFirestore, 
  deleteUserAccountFromFirestore,
  toggleDriverVerification,
} from '../../services/firestoreService';
import { approveDriverApplication, rejectDriverApplication } from '../../services/driverApplicationsService';
import { removeAccountFromLocalVault } from '../../services/dataVaultService';
import {
  Check,
  X,
  RefreshCw,
  Clock,
  Phone,
  MapPin,
  FileImage,
  User,
  Loader2,
  Eye,
  Search,
  Trash2,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export interface FirestoreDriverRecord {
  id: string;
  applicationId?: string;
  userId?: string;
  name: string;
  email?: string;
  phone?: string;
  wilaya?: string;
  municipality?: string;
  photoUrl?: string;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  rejectionReason?: string;
  rejectionCount?: number;
  isPermanentlyRejected?: boolean;
  createdAt?: any;
  isVerified?: boolean;
  motorcycle?: {
    brand?: string;
    model?: string;
    year?: number | string;
    plateNumber?: string;
    color?: string;
  };
  documents?: {
    selfieUrl?: string;
    personalPhotoUrl?: string;
    motorcyclePhotoUrl?: string;
    motorcycleFrontUrl?: string;
    licenseUrl?: string;
    licenseFrontUrl?: string;
    vehicleRegistrationUrl?: string;
    vehicleDocFrontUrl?: string;
    motorcyclePhotosUrls?: string[];
    submittedAt?: string;
    status?: string;
  };
}

const isValidUploadedImage = (url?: string): boolean => {
  if (!url || typeof url !== 'string') return false;
  if (url.includes('images.unsplash.com')) return false;
  return url.length > 15;
};

export const AdminDriversPanel: React.FC = () => {
  const [driversMap, setDriversMap] = useState<Record<string, FirestoreDriverRecord>>({});
  const [appsList, setAppsList] = useState<any[]>([]);
  const [rawDriversList, setRawDriversList] = useState<FirestoreDriverRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedImage, setSelectedImage] = useState<{ url: string; title: string } | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [expandedDriverId, setExpandedDriverId] = useState<string | null>(null);

  // Inline rejection reason & delete confirmation states (no window.prompt / window.confirm)
  const [rejectingDriverId, setRejectingDriverId] = useState<string | null>(null);
  const [rejectionInput, setRejectionInput] = useState<string>('الوثائق المرفقة غير واضحة أو غير مطابقة للشروط');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [statusNotice, setStatusNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [deletedKeys, setDeletedKeys] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('motodrive_admin_deleted_driver_keys');
      if (saved) return new Set(JSON.parse(saved));
    } catch (e) {}
    return new Set();
  });

  // Real-time Firestore subscriptions to BOTH 'drivers' AND 'driver_applications'
  useEffect(() => {
    setLoading(true);

    const driversColRef = collection(db, 'drivers');
    const appsColRef = collection(db, 'driver_applications');

    const unsubDrivers = onSnapshot(
      driversColRef,
      (snapshot) => {
        const fetched: FirestoreDriverRecord[] = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        })) as FirestoreDriverRecord[];
        setRawDriversList(fetched);
        setLoading(false);
      },
      (error) => {
        console.warn('Firestore drivers onSnapshot notice:', error.message);
        setLoading(false);
      }
    );

    const unsubApps = onSnapshot(
      appsColRef,
      (snapshot) => {
        const fetchedApps = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));
        setAppsList(fetchedApps);
        setLoading(false);
      },
      (error) => {
        console.warn('Firestore driver_applications onSnapshot notice:', error.message);
        setLoading(false);
      }
    );

    return () => {
      unsubDrivers();
      unsubApps();
    };
  }, []);

  // Merge 'drivers' and 'driver_applications' so no driver request is ever missed
  useEffect(() => {
    const merged: Record<string, FirestoreDriverRecord> = {};

    for (const drv of rawDriversList) {
      if (
        deletedKeys.has(drv.id) ||
        (drv.userId && deletedKeys.has(drv.userId)) ||
        (drv.phone && deletedKeys.has(drv.phone))
      ) {
        continue;
      }
      merged[drv.id] = { ...drv };
    }

    for (const app of appsList) {
      const targetDriverId = app.driverId || `driver-${app.userId || app.phone || app.id}`;
      if (
        deletedKeys.has(app.id) ||
        deletedKeys.has(targetDriverId) ||
        (app.userId && deletedKeys.has(app.userId)) ||
        (app.phone && deletedKeys.has(app.phone))
      ) {
        continue;
      }
      // Also check if a driver record with the same phone number already exists in merged
      const existingKey =
        Object.keys(merged).find(
          (k) => k === targetDriverId || (app.phone && merged[k].phone === app.phone)
        ) || targetDriverId;

      const existing = merged[existingKey];
      const appDocs = app.documents || {};
      const existingDocs = existing?.documents || {};

      // Resolve status so an approved/rejected driver NEVER stays pending if either record was updated,
      // EXCEPT when a rejected driver resubmitted their application (app.status === 'pending' with newer submittedAt)
      let resolvedStatus: 'pending' | 'approved' | 'rejected' | 'suspended' = 'pending';
      if (existing?.status === 'approved' || app.status === 'approved') {
        resolvedStatus = 'approved';
      } else if (app.status === 'pending' && existing?.status === 'pending') {
        resolvedStatus = 'pending';
      } else if (existing?.status === 'rejected' || app.status === 'rejected') {
        resolvedStatus = 'rejected';
      } else if (existing?.status === 'suspended' || app.status === 'suspended') {
        resolvedStatus = 'suspended';
      } else {
        resolvedStatus = app.status || existing?.status || 'pending';
      }

      const resolvedRejectionCount = Math.max(
        Number(app.rejectionCount || 0),
        Number(existing?.rejectionCount || 0)
      );

      merged[existingKey] = {
        id: existingKey,
        applicationId: app.id,
        userId: app.userId || existing?.userId || existingKey,
        name: app.fullName || existing?.name || 'سائق جديد',
        phone: app.phone || existing?.phone || '',
        email: app.email || existing?.email,
        wilaya: app.wilaya || existing?.wilaya || 'الجزائر',
        municipality: app.municipality || existing?.municipality || 'وسط المدينة',
        photoUrl:
          appDocs.selfieUrl ||
          existingDocs.selfieUrl ||
          existing?.photoUrl ||
          undefined,
        status: resolvedStatus,
        rejectionReason: app.rejectionReason || existing?.rejectionReason,
        rejectionCount: resolvedRejectionCount,
        isPermanentlyRejected: Boolean(app.isPermanentlyRejected || existing?.isPermanentlyRejected || resolvedRejectionCount >= 2),
        createdAt: app.submittedAt || existing?.createdAt,
        motorcycle: {
          brand: app.motorcycle?.brand || existing?.motorcycle?.brand || 'SYM',
          model: app.motorcycle?.model || existing?.motorcycle?.model || '',
          year: app.motorcycle?.year || existing?.motorcycle?.year || 2023,
          plateNumber: app.motorcycle?.plateNumber || existing?.motorcycle?.plateNumber || '',
          color: app.motorcycle?.color || existing?.motorcycle?.color || 'أسود',
        },
        documents: {
          ...existingDocs,
          ...appDocs,
          status: resolvedStatus,
          selfieUrl: appDocs.selfieUrl || existingDocs.selfieUrl || existingDocs.personalPhotoUrl,
          motorcyclePhotoUrl:
            appDocs.motorcyclePhotoUrl ||
            existingDocs.motorcyclePhotoUrl ||
            existingDocs.motorcycleFrontUrl,
          licenseUrl: appDocs.licenseUrl || existingDocs.licenseUrl || existingDocs.licenseFrontUrl,
          vehicleRegistrationUrl:
            appDocs.vehicleRegistrationUrl ||
            existingDocs.vehicleRegistrationUrl ||
            existingDocs.vehicleDocFrontUrl,
        },
      };
    }

    setDriversMap(merged);
  }, [rawDriversList, appsList, deletedKeys]);

  const drivers: FirestoreDriverRecord[] = Object.values(driversMap);

  // تحديث حالة السائق (قبول أو رفض مع تطبيق قاعدة الرفض مرتين = حذف نهائي للطلب)
  const handleUpdateStatus = async (
    drv: FirestoreDriverRecord,
    newStatus: 'approved' | 'rejected',
    customRejectionReason?: string
  ) => {
    const driverId = drv.id;
    const appId = drv.applicationId || `app_${driverId}`;
    setUpdatingId(driverId);
    setStatusNotice(null);

    const nextRejectionCount = newStatus === 'rejected' ? (Number(drv.rejectionCount || 0) + 1) : 0;
    const isPermanentReject = newStatus === 'rejected' && nextRejectionCount >= 2;

    // Optimistic local state update so UI reflects approval/rejection immediately
    setDriversMap((prev) => {
      if (!prev[driverId]) return prev;
      return {
        ...prev,
        [driverId]: {
          ...prev[driverId],
          status: newStatus,
          rejectionReason: newStatus === 'rejected' ? (customRejectionReason || rejectionInput) : undefined,
          rejectionCount: nextRejectionCount,
          isPermanentlyRejected: isPermanentReject,
          documents: {
            ...prev[driverId].documents,
            status: newStatus,
            selfieUrl: undefined,
            personalPhotoUrl: undefined,
            motorcyclePhotoUrl: undefined,
            motorcycleFrontUrl: undefined,
            licenseUrl: undefined,
            licenseFrontUrl: undefined,
            vehicleRegistrationUrl: undefined,
            vehicleDocFrontUrl: undefined,
          },
        },
      };
    });

    try {
      const finalReason =
        newStatus === 'rejected'
          ? (customRejectionReason || rejectionInput).trim() || 'الوثائق المرفقة غير مطابقة للشروط'
          : undefined;

      if (newStatus === 'approved') {
        try {
          await approveDriverApplication(appId, driverId, 'admin', drv.phone);
        } catch (appErr) {
          console.warn('Notice approving application doc:', appErr);
        }
        await updateDriverStatusInFirestore(driverId, 'approved', undefined, drv.phone, 0);
      } else {
        try {
          await rejectDriverApplication(appId, driverId, finalReason!, 'admin', drv.phone, nextRejectionCount);
        } catch (appErr) {
          console.warn('Notice rejecting application doc:', appErr);
        }
        await updateDriverStatusInFirestore(driverId, 'rejected', finalReason, drv.phone, nextRejectionCount);
      }

      setRejectingDriverId(null);
      setStatusNotice({
        type: 'success',
        text:
          newStatus === 'approved'
            ? `✅ تم قبول وتفعيل السائق (${drv.name}) بنجاح وأصبح حسابه جاهزاً للعمل فوراً.`
            : isPermanentReject
            ? `🚫 تم رفض السائق (${drv.name}) للمرة الثانية وحذف طلبه نهائياً مع إرسال سبب الرفض إليه.`
            : `❌ تم رفض طلب السائق (${drv.name}) للمرة الأولى وإرسال السبب إليه ليقوم بتعديل بياناته وإعادة الإرسال.`,
      });
    } catch (err: any) {
      console.error('Error updating driver status:', err);
      setStatusNotice({
        type: 'error',
        text: 'حدث خطأ أثناء تحديث حالة السائق: ' + (err?.message || err),
      });
    } finally {
      setUpdatingId(null);
    }
  };

  // حذف السائق وجميع مستنداته من Firestore والذاكرة المحلية نهائياً دون عودته تلقائياً
  const handleDeleteDriver = async (drv: FirestoreDriverRecord) => {
    setUpdatingId(drv.id);
    setStatusNotice(null);
    const appId = drv.applicationId || `app_${drv.id}`;

    // 1. Optimistically remove from local UI state immediately and record in deletedKeys
    setDeletedKeys((prev) => {
      const next = new Set(prev);
      next.add(drv.id);
      if (drv.applicationId) next.add(drv.applicationId);
      next.add(appId);
      if (drv.userId) next.add(drv.userId);
      if (drv.phone) next.add(drv.phone);
      try {
        localStorage.setItem('motodrive_admin_deleted_driver_keys', JSON.stringify(Array.from(next)));
      } catch (e) {}
      return next;
    });

    setDriversMap((prev) => {
      const next = { ...prev };
      delete next[drv.id];
      for (const k of Object.keys(next)) {
        if (
          (drv.phone && next[k].phone === drv.phone) ||
          (drv.userId && next[k].userId === drv.userId)
        ) {
          delete next[k];
        }
      }
      return next;
    });
    setRawDriversList((prev) =>
      prev.filter(
        (d) =>
          d.id !== drv.id &&
          (!drv.phone || d.phone !== drv.phone) &&
          (!drv.userId || d.userId !== drv.userId)
      )
    );
    setAppsList((prev) =>
      prev.filter(
        (a) =>
          a.id !== appId &&
          a.id !== drv.applicationId &&
          a.driverId !== drv.id &&
          (!drv.phone || a.phone !== drv.phone) &&
          (!drv.userId || a.userId !== drv.userId)
      )
    );
    setConfirmDeleteId(null);

    try {
      await deleteUserAccountFromFirestore('driver', drv.userId, drv.id, drv.phone, appId);
      await removeAccountFromLocalVault(drv.phone, drv.userId, drv.id);
      setStatusNotice({
        type: 'success',
        text: `🗑️ تم حذف طلب وحساب السائق (${drv.name}) نهائياً ولن يعود للظهور مجدداً.`,
      });
    } catch (err: any) {
      console.error('Error deleting driver:', err);
      setStatusNotice({
        type: 'error',
        text: 'تعذر حذف السائق: ' + (err?.message || err),
      });
    } finally {
      setUpdatingId(null);
    }
  };

  // تصفية السائقين
  const filteredDrivers = drivers.filter((drv) => {
    const matchesFilter = filter === 'all' || drv.status === filter;
    const term = searchTerm.trim().toLowerCase();
    if (!term) return matchesFilter;

    const matchesSearch =
      (drv.name && drv.name.toLowerCase().includes(term)) ||
      (drv.phone && drv.phone.includes(term)) ||
      (drv.wilaya && drv.wilaya.toLowerCase().includes(term)) ||
      (drv.motorcycle?.brand && drv.motorcycle.brand.toLowerCase().includes(term)) ||
      (drv.motorcycle?.model && drv.motorcycle.model.toLowerCase().includes(term)) ||
      (drv.motorcycle?.plateNumber && drv.motorcycle.plateNumber.includes(term)) ||
      (drv.email && drv.email.toLowerCase().includes(term));

    return matchesFilter && matchesSearch;
  });

  const pendingCount = drivers.filter((d) => d.status === 'pending').length;
  const approvedCount = drivers.filter((d) => d.status === 'approved').length;
  const rejectedCount = drivers.filter((d) => d.status === 'rejected').length;

  return (
    <div className="space-y-4 text-right" dir="rtl">
      {/* رأس قسم طلبات السائقين */}
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-4 rounded-3xl shadow-xl">
        <div>
          <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
            <span>طلبات تسجيل السائقين والوثائق الـ 4</span>
            {pendingCount > 0 && (
              <span className="bg-amber-500 text-slate-950 text-xs px-2.5 py-0.5 rounded-full font-black animate-pulse">
                {pendingCount} قيد المراجعة
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            معاينة الصور الـ 4 المرسلة من السائق لمرة واحدة ثم قبول أو رفض الطلب (تُحذف الصور تلقائياً بعد المراجعة)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setLoading(true);
              setTimeout(() => setLoading(false), 400);
            }}
            disabled={loading}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-2xl transition-all border border-slate-700 cursor-pointer"
            title="تحديث القائمة"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {statusNotice && (
        <div
          className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center justify-between gap-2 animate-in fade-in ${
            statusNotice.type === 'success'
              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
              : 'bg-red-500/15 border-red-500/40 text-red-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusNotice.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            )}
            <span>{statusNotice.text}</span>
          </div>
          <button onClick={() => setStatusNotice(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* شريط البحث وتبويبات الفلترة */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="بحث بالاسم، رقم الهاتف، الولاية، أو رقم لوحة الدراجة..."
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-2.5 pr-10 pl-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/80 transition-colors"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 text-xs">
          {[
            { key: 'all', label: `الكل (${drivers.length})` },
            { key: 'pending', label: `معلقة (${pendingCount})` },
            { key: 'approved', label: `مقبولة (${approvedCount})` },
            { key: 'rejected', label: `مرفوضة (${rejectedCount})` },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as any)}
              className={`px-3 py-2 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                filter === tab.key
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* محتوى السائقين */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 bg-slate-900/50 border border-slate-800 rounded-3xl space-y-3">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
          <p className="text-xs text-slate-400">جاري تحميل طلبات السائقين من Firebase Firestore...</p>
        </div>
      ) : filteredDrivers.length === 0 ? (
        <div className="text-center p-10 bg-slate-900/40 border border-slate-800 rounded-3xl text-slate-400 text-xs">
          لا توجد طلبات سائقين مطابقة للفلتر المحدد حالياً.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredDrivers.map((drv) => {
            // Auto-expand pending applications so Owner immediately sees the 4 photos
            const isExpanded = expandedDriverId === drv.id || (drv.status === 'pending' && expandedDriverId !== `closed_${drv.id}`);
            const moto = drv.motorcycle || {};
            const docs = drv.documents || {};

            const selfieCandidate = docs.selfieUrl || docs.personalPhotoUrl || drv.photoUrl;
            const motoCandidate = docs.motorcyclePhotoUrl || docs.motorcycleFrontUrl || docs.motorcyclePhotosUrls?.[0];
            const licenseCandidate = docs.licenseUrl || docs.licenseFrontUrl;
            const regCandidate = docs.vehicleRegistrationUrl || docs.vehicleDocFrontUrl;

            // EXACTLY 4 REQUIRED DOCUMENTS
            const docList = [
              {
                title: '1. الصورة الشخصية (سيلفي)',
                url: isValidUploadedImage(selfieCandidate) ? selfieCandidate : undefined,
                icon: '👤',
              },
              {
                title: '2. صورة الدراجة النارية',
                url: isValidUploadedImage(motoCandidate) ? motoCandidate : undefined,
                icon: '🏍️',
              },
              {
                title: '3. رخصة السياقة (Permis)',
                url: isValidUploadedImage(licenseCandidate) ? licenseCandidate : undefined,
                icon: '📜',
              },
              {
                title: '4. البطاقة الرمادية (Carte Grise)',
                url: isValidUploadedImage(regCandidate) ? regCandidate : undefined,
                icon: '📄',
              },
            ];

            const availableDocsCount = docList.filter((d) => Boolean(d.url)).length;

            return (
              <div
                key={drv.id}
                className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl hover:border-slate-700 transition-all"
              >
                {/* Header card info */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 overflow-hidden flex items-center justify-center text-amber-400 font-bold shrink-0">
                      {isValidUploadedImage(selfieCandidate) ? (
                        <img
                          src={selfieCandidate}
                          alt={drv.name}
                          className="w-full h-full object-cover cursor-pointer"
                          onClick={() => setSelectedImage({ url: selfieCandidate!, title: `صورة السائق: ${drv.name}` })}
                        />
                      ) : (
                        <User className="w-6 h-6" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-white">{drv.name}</h3>
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-500" />
                          <span>{drv.wilaya || 'الجزائر'}</span>
                        </span>
                        {drv.phone && (
                          <span className="font-mono text-amber-400 font-bold" dir="ltr">
                            📞 {drv.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* شارة الحالة */}
                  <div>
                    {drv.status === 'approved' && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        <Check className="w-3 h-3" />
                        مقبول
                      </span>
                    )}
                    {drv.status === 'pending' && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-black bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse">
                        <Clock className="w-3 h-3" />
                        {(drv.rejectionCount || 0) >= 1 ? 'أعاد الإرسال بعد الرفض الأول' : 'بانتظار موافقة المالك'}
                      </span>
                    )}
                    {drv.status === 'rejected' && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-black bg-red-500/20 text-red-400 border border-red-500/30">
                        <X className="w-3 h-3" />
                        {(drv.rejectionCount || 0) >= 2 ? 'مرفوض مرتين (حُذف الطلب)' : 'مرفوض (المرة 1)'}
                      </span>
                    )}
                  </div>
                </div>

                {/* مواصفات الدراجة النارية */}
                <div className="bg-slate-950 border border-slate-800/80 p-3 rounded-2xl grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 block">الدراجة والموديل</span>
                    <span className="font-bold text-white">
                      {moto.brand || 'SYM'} {moto.model || ''}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">رقم الهاتف</span>
                    <span className="font-mono font-bold text-slate-200" dir="ltr">
                      {drv.phone || 'غير محدد'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">رقم اللوحة (Matricule)</span>
                    <span className="font-mono font-bold text-amber-400">
                      {moto.plateNumber || 'غير محدد'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">الصور المرفوعة</span>
                    <span className={`font-bold ${availableDocsCount === 4 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {drv.status !== 'pending' && availableDocsCount === 0
                        ? 'تم الحذف بعد المراجعة ✓'
                        : `${availableDocsCount} من 4 صور`}
                    </span>
                  </div>
                </div>

                {/* سبب الرفض إن وجد */}
                {drv.status === 'rejected' && drv.rejectionReason && (
                  <div className="bg-red-500/10 border border-red-500/20 p-2.5 rounded-xl text-xs text-red-300">
                    <span className="font-bold">سبب الرفض المسجل: </span>
                    {drv.rejectionReason}
                  </div>
                )}

                {/* زر توسيع وعرض الوثائق الـ 4 */}
                <button
                  type="button"
                  onClick={() =>
                    setExpandedDriverId(
                      isExpanded ? `closed_${drv.id}` : drv.id
                    )
                  }
                  className="w-full py-2 bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 border border-slate-700/60 cursor-pointer"
                >
                  <FileImage className="w-3.5 h-3.5 text-amber-400" />
                  <span>
                    {isExpanded
                      ? 'إخفاء وثائق وصور السائق'
                      : `معاينة وثائق وصور السائق الـ 4 (${availableDocsCount}/4)`}
                  </span>
                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {/* معرض صور الوثائق الـ 4 عند التوسيع */}
                {isExpanded && (
                  <div className="pt-2 border-t border-slate-800 space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {docList.map((docItem, idx) => (
                        <div
                          key={idx}
                          className="bg-slate-950 border border-slate-800 rounded-2xl p-2.5 space-y-2 flex flex-col justify-between"
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm">{docItem.icon}</span>
                            <span className="text-[11px] font-bold text-slate-300 line-clamp-1">
                              {docItem.title}
                            </span>
                          </div>

                          {docItem.url ? (
                            <div
                              onClick={() => setSelectedImage({ url: docItem.url!, title: docItem.title })}
                              className="relative h-28 rounded-xl overflow-hidden bg-slate-900 border border-emerald-500/30 cursor-pointer group"
                            >
                              <img
                                src={docItem.url}
                                alt={docItem.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 text-white text-xs font-bold">
                                <Eye className="w-4 h-4 text-amber-400" />
                                <span>تكبير الصورة</span>
                              </div>
                            </div>
                          ) : (
                            <div className="h-28 rounded-xl bg-slate-900/60 border border-dashed border-slate-800 flex flex-col items-center justify-center text-slate-500 text-[10px] p-2 text-center">
                              <FileImage className="w-6 h-6 mb-1 opacity-40" />
                              <span>
                                {drv.status !== 'pending'
                                  ? 'حُذفت بعد المراجعة'
                                  : 'لم يتم إرفاق الصورة'}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* صندوق إدخال سبب الرفض (بدون window.prompt) */}
                {rejectingDriverId === drv.id && (
                  <div className="p-3.5 bg-red-950/40 border border-red-500/40 rounded-2xl space-y-2.5 animate-in fade-in">
                    <label className="text-xs font-bold text-red-300 block">
                      اكتب سبب رفض السائق (سيظهر للسائق عند تسجيل دخوله):
                    </label>
                    <input
                      type="text"
                      value={rejectionInput}
                      onChange={(e) => setRejectionInput(e.target.value)}
                      placeholder="مثال: صورة رخصة السياقة غير واضحة"
                      className="w-full bg-slate-950 border border-red-500/40 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-400"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(drv, 'rejected', rejectionInput)}
                        disabled={updatingId === drv.id}
                        className="flex-1 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-black cursor-pointer"
                      >
                        تأكيد رفض الطلب وإرسال السبب
                      </button>
                      <button
                        type="button"
                        onClick={() => setRejectingDriverId(null)}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                      >
                        إلغاء
                      </button>
                    </div>
                  </div>
                )}

                {/* تأكيد الحذف النهائي (بدون window.confirm) */}
                {confirmDeleteId === drv.id && (
                  <div className="p-3 bg-red-950/50 border border-red-500/40 rounded-2xl flex items-center justify-between gap-2 text-xs animate-in fade-in">
                    <span className="text-red-200 font-bold">هل أنت متأكد من حذف هذا السائق نهائياً؟</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleDeleteDriver(drv)}
                        disabled={updatingId === drv.id}
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg font-black cursor-pointer"
                      >
                        نعم، احذف
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg font-bold cursor-pointer"
                      >
                        تراجع
                      </button>
                    </div>
                  </div>
                )}

                {/* أزرار الإجراءات الإدارية */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                  {drv.status !== 'approved' && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(drv, 'approved')}
                      disabled={updatingId === drv.id}
                      className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 disabled:opacity-50 cursor-pointer"
                    >
                      {updatingId === drv.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          <span>قبول السائق وتفعيله</span>
                        </>
                      )}
                    </button>
                  )}

                  {drv.status !== 'rejected' && (
                    <button
                      type="button"
                      onClick={() => {
                        setRejectingDriverId(rejectingDriverId === drv.id ? null : drv.id);
                      }}
                      disabled={updatingId === drv.id}
                      className="flex-1 py-2.5 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/30 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                    >
                      {updatingId === drv.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <X className="w-4 h-4" />
                          <span>رفض الطلب</span>
                        </>
                      )}
                    </button>
                  )}

                  {/* زر التوثيق الجديد */}
                  <button
                    type="button"
                    onClick={async () => {
                      setUpdatingId(drv.id);
                      try {
                        await toggleDriverVerification(drv.id, !drv.isVerified);
                      } finally {
                        setUpdatingId(null);
                      }
                    }}
                    disabled={updatingId === drv.id}
                    className={`p-2.5 rounded-xl border transition-colors cursor-pointer ${
                      drv.isVerified
                        ? 'bg-emerald-600/20 text-emerald-400 border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400 hover:text-amber-400'
                    }`}
                    title={drv.isVerified ? 'إلغاء التوثيق' : 'توثيق الحساب'}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>

                  {drv.phone && (
                    <a
                      href={`tel:${drv.phone}`}
                      className="p-2.5 bg-slate-800 hover:bg-blue-600/20 text-slate-400 hover:text-blue-400 rounded-xl border border-slate-700 transition-colors"
                      title="اتصال بالسائق"
                    >
                      <Phone className="w-4 h-4" />
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(confirmDeleteId === drv.id ? null : drv.id)}
                    disabled={updatingId === drv.id}
                    className="p-2.5 bg-slate-800 hover:bg-red-600/20 text-slate-400 hover:text-red-400 rounded-xl border border-slate-700 transition-colors cursor-pointer"
                    title="حذف ملف السائق نهائياً"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* نافذة تكبير الصورة (Modal Zoom) */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl p-4 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="text-sm font-black text-white">{selectedImage.title}</h4>
              <button
                onClick={() => setSelectedImage(null)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="max-h-[75vh] flex items-center justify-center overflow-auto rounded-2xl bg-black">
              <img
                src={selectedImage.url}
                alt={selectedImage.title}
                className="max-h-[70vh] w-auto object-contain rounded-xl"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
