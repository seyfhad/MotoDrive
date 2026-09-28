import React, { useEffect, useState } from 'react';
import { db } from '../../lib/firebase';
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy,
} from 'firebase/firestore';
import { updateDriverStatusInFirestore } from '../../services/firestoreService';
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
  Search,
  Trash2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export interface FirestoreDriverRecord {
  id: string;
  userId?: string;
  name: string;
  email?: string;
  phone?: string;
  wilaya?: string;
  municipality?: string;
  photoUrl?: string;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  rejectionReason?: string;
  createdAt?: any;
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
    licenseFrontUrl?: string;
    licenseBackUrl?: string;
    licenseUrl?: string;
    vehicleDocFrontUrl?: string;
    vehicleDocBackUrl?: string;
    vehicleRegistrationUrl?: string;
    motorcycleFrontUrl?: string;
    motorcycleBackUrl?: string;
    motorcyclePhotosUrls?: string[];
    submittedAt?: string;
  };
}

export const AdminDriversPanel: React.FC = () => {
  const [drivers, setDrivers] = useState<FirestoreDriverRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedImage, setSelectedImage] = useState<{ url: string; title: string } | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [expandedDriverId, setExpandedDriverId] = useState<string | null>(null);

  // Real-time Firestore subscription to drivers collection
  useEffect(() => {
    setLoading(true);
    const colRef = collection(db, 'drivers');
    const unsub = onSnapshot(
      colRef,
      (snapshot) => {
        const fetched: FirestoreDriverRecord[] = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        })) as FirestoreDriverRecord[];

        setDrivers(fetched);
        setLoading(false);
      },
      (error) => {
        console.warn('Firestore drivers onSnapshot notice:', error.message);
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  // تحديث حالة السائق (قبول أو رفض) في Firestore
  const handleUpdateStatus = async (driverId: string, newStatus: 'approved' | 'rejected') => {
    setUpdatingId(driverId);
    try {
      let rejectionReason: string | undefined = undefined;
      if (newStatus === 'rejected') {
        const reasonPrompt = window.prompt(
          'أدخل سبب رفض السائق (ليظهر له لإعادة رفع الوثائق المناسبة):',
          'الوثائق المرفقة غير واضحة أو منتهية الصلاحية'
        );
        if (reasonPrompt === null) {
          setUpdatingId(null);
          return;
        }
        rejectionReason = reasonPrompt.trim() || 'الوثائق المرفقة غير مطابقة';
      }

      await updateDriverStatusInFirestore(driverId, newStatus, rejectionReason);

      // تحديث محلي فوري
      setDrivers((prev) =>
        prev.map((drv) =>
          drv.id === driverId
            ? { ...drv, status: newStatus, rejectionReason }
            : drv
        )
      );

      alert(
        `تم تحديث حالة السائق بنجاح إلى: ${
          newStatus === 'approved' ? 'مقبول رسمياً ✅' : 'مرفوض ❌'
        }`
      );
    } catch (err: any) {
      console.error('Error updating driver status:', err);
      alert('حدث خطأ أثناء تحديث حالة السائق: ' + (err?.message || err));
    } finally {
      setUpdatingId(null);
    }
  };

  // حذف السائق من Firestore
  const handleDeleteDriver = async (driverId: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا السائق نهائياً من قاعدة بيانات Firebase؟')) return;
    setUpdatingId(driverId);
    try {
      await deleteDoc(doc(db, 'drivers', driverId));
      setDrivers((prev) => prev.filter((d) => d.id !== driverId));
      alert('تم حذف السائق بنجاح.');
    } catch (err: any) {
      console.error('Error deleting driver:', err);
      alert('تعذر حذف السائق: ' + (err?.message || err));
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
      {/* رأس اللوحة الإدارية */}
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-4 rounded-3xl shadow-xl">
        <div>
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <span>إدارة طلبات السائقين (Firebase)</span>
            {pendingCount > 0 && (
              <span className="bg-amber-500 text-slate-950 text-xs px-2.5 py-0.5 rounded-full font-black animate-pulse">
                {pendingCount} قيد المراجعة
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            مراجعة وتدقيق الوثائق الـ 7، ترخيص السائقين والدراجات النارية والقبول الفوري
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setLoading(true);
              setTimeout(() => setLoading(false), 500);
            }}
            disabled={loading}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-2xl transition-all border border-slate-700"
            title="تحديث القائمة"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

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
              className={`px-3 py-2 rounded-xl font-bold whitespace-nowrap transition-all ${
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
            const isExpanded = expandedDriverId === drv.id;
            const moto = drv.motorcycle || {};
            const docs = drv.documents || {};

            const docList = [
              {
                title: 'صورة شخصية (سيلفي)',
                url: docs.selfieUrl || docs.personalPhotoUrl || drv.photoUrl,
                icon: '👤',
              },
              {
                title: 'رخصة السياقة (الوجه الأمامي)',
                url: docs.licenseFrontUrl || docs.licenseUrl,
                icon: '📜',
              },
              {
                title: 'رخصة السياقة (الوجه الخلفي)',
                url: docs.licenseBackUrl,
                icon: '📜',
              },
              {
                title: 'وثيقة الدراجة (البطاقة الرمادية - أمامي)',
                url: docs.vehicleDocFrontUrl || docs.vehicleRegistrationUrl,
                icon: '📄',
              },
              {
                title: 'وثيقة الدراجة (البطاقة الرمادية - خلفي)',
                url: docs.vehicleDocBackUrl,
                icon: '📄',
              },
              {
                title: 'صورة الدراجة (من الأمام)',
                url: docs.motorcycleFrontUrl || docs.motorcyclePhotosUrls?.[0],
                icon: '🏍️',
              },
              {
                title: 'صورة الدراجة (من الخلف مع اللوحة)',
                url: docs.motorcycleBackUrl || docs.motorcyclePhotosUrls?.[1],
                icon: '🛵',
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
                      {drv.photoUrl || docs.selfieUrl ? (
                        <img
                          src={drv.photoUrl || docs.selfieUrl}
                          alt={drv.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <User className="w-6 h-6" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-white">{drv.name}</h3>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-500" />
                        <span>{drv.wilaya || 'الجزائر'} {drv.municipality ? `- ${drv.municipality}` : ''}</span>
                        {drv.phone && (
                          <span className="font-mono text-slate-300 dir-ltr font-bold">
                            • {drv.phone}
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
                        معلق للمراجعة
                      </span>
                    )}
                    {drv.status === 'rejected' && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-black bg-red-500/20 text-red-400 border border-red-500/30">
                        <X className="w-3 h-3" />
                        مرفوض
                      </span>
                    )}
                  </div>
                </div>

                {/* مواصفات الدراجة النارية */}
                <div className="bg-slate-950 border border-slate-800/80 p-3 rounded-2xl grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 block">العلامة والموديل</span>
                    <span className="font-bold text-white">
                      {moto.brand || 'SYM'} {moto.model || ''}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">سنة الصنع</span>
                    <span className="font-bold text-slate-300">{moto.year || '2023'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">رقم اللوحة</span>
                    <span className="font-mono font-bold text-amber-400">
                      {moto.plateNumber || 'غير محدد'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">الوثائق المرفوعة</span>
                    <span className="font-bold text-emerald-400">
                      {availableDocsCount} من 7 وثائق
                    </span>
                  </div>
                </div>

                {/* سبب الرفض إن وجد */}
                {drv.status === 'rejected' && drv.rejectionReason && (
                  <div className="bg-red-500/10 border border-red-500/20 p-2.5 rounded-xl text-xs text-red-300">
                    <span className="font-bold">سبب الرفض: </span>
                    {drv.rejectionReason}
                  </div>
                )}

                {/* زر توسيع وعرض الوثائق الـ 7 */}
                <button
                  type="button"
                  onClick={() => setExpandedDriverId(isExpanded ? null : drv.id)}
                  className="w-full py-2 bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 border border-slate-700/60"
                >
                  <FileImage className="w-3.5 h-3.5 text-amber-400" />
                  <span>
                    {isExpanded ? 'إخفاء وثائق وصور السائق' : `معاينة وثائق وصور السائق (${availableDocsCount}/7)`}
                  </span>
                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {/* معرض صور الوثائق عند التوسيع */}
                {isExpanded && (
                  <div className="pt-2 border-t border-slate-800 space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
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
                              className="relative h-28 rounded-xl overflow-hidden bg-slate-900 border border-slate-800 cursor-pointer group"
                            >
                              <img
                                src={docItem.url}
                                alt={docItem.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 text-white text-xs font-bold">
                                <Eye className="w-4 h-4 text-amber-400" />
                                <span>تكبير</span>
                              </div>
                            </div>
                          ) : (
                            <div className="h-28 rounded-xl bg-slate-900/60 border border-dashed border-slate-800 flex flex-col items-center justify-center text-slate-600 text-[10px]">
                              <FileImage className="w-6 h-6 mb-1 opacity-40" />
                              <span>لم يتم الرفع</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* أزرار الإجراءات الإدارية */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                  {drv.status !== 'approved' && (
                    <button
                      onClick={() => handleUpdateStatus(drv.id, 'approved')}
                      disabled={updatingId === drv.id}
                      className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 disabled:opacity-50"
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
                      onClick={() => handleUpdateStatus(drv.id, 'rejected')}
                      disabled={updatingId === drv.id}
                      className="flex-1 py-2.5 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/30 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
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
                    onClick={() => handleDeleteDriver(drv.id)}
                    disabled={updatingId === drv.id}
                    className="p-2.5 bg-slate-800 hover:bg-red-600/20 text-slate-400 hover:text-red-400 rounded-xl border border-slate-700 transition-colors"
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
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
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
