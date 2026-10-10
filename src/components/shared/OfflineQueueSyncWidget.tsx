import React, { useState, useEffect } from 'react';
import {
  saveToLocalCache,
  getFromLocalCache,
  addToOfflineQueue,
  syncOfflineQueueToFirestore,
  getPendingQueueCount,
} from '../../services/dbService';
import { RefreshCw, Database, CloudUpload, CheckCircle2 } from 'lucide-react';

/**
 * مكون عملي واختباري يوضح كيفية استخدام dbService.ts:
 * 1) حفظ وجلب البيانات من الكاش المحلي (بدون استهلاك Reads من Firestore).
 * 2) إضافة طلب رحلة أو بيانات إلى طابور الانتظار المحلي (Offline Queue) لحماية الـ 20,000 كتابة المجانية.
 * 3) مزامنة الطابور دفعة واحدة (writeBatch) إلى Firebase Firestore عند توفر الإنترنت.
 */
export const OfflineQueueSyncWidget: React.FC = () => {
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [cachedStatus, setCachedStatus] = useState<string>('');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncResultMsg, setSyncResultMsg] = useState<string | null>(null);

  const refreshQueueCount = async () => {
    const count = await getPendingQueueCount();
    setPendingCount(count);
  };

  useEffect(() => {
    refreshQueueCount();
  }, []);

  // 1. مثال حفظ وجلب بيانات من الكاش المحلي (0 Reads من الفايربيز)
  const handleCacheExample = async () => {
    await saveToLocalCache('last_selected_wilaya', {
      name: 'الشلف',
      code: '02',
      savedAt: new Date().toLocaleTimeString('ar-DZ'),
    });
    const data = await getFromLocalCache<{ name: string; savedAt: string }>('last_selected_wilaya');
    if (data) {
      setCachedStatus(`تم الجلب من الكاش المحلي: ${data.name} (${data.savedAt})`);
    }
  };

  // 2. مثال إضافة عملية كتابة إلى قائمة الانتظار المحلية (Add to Queue)
  const handleAddRideToLocalQueue = async () => {
    await addToOfflineQueue('ride_logs', 'add', {
      type: 'local_queued_event',
      note: 'حفظ محلي لحماية حصة الفايربيز',
      createdAt: new Date().toISOString(),
    });
    await refreshQueueCount();
    setSyncResultMsg('✅ تمت الإضافة إلى طابور الانتظار المحلي (IndexedDB) بنجاح');
  };

  // 3. مزامنة قائمة الانتظار دفعة واحدة (Batch Sync) مع Firestore
  const handleBatchSyncNow = async () => {
    setIsSyncing(true);
    setSyncResultMsg(null);
    try {
      const res = await syncOfflineQueueToFirestore();
      await refreshQueueCount();
      setSyncResultMsg(
        `🚀 تمت مزامنة ${res.syncedCount} عملية دفعة واحدة (Batch) وحذفها محلياً!`
      );
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 space-y-3 text-right text-xs text-slate-100" dir="rtl">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2 font-bold text-amber-400">
          <Database className="w-4 h-4" />
          <span>محرك التخزين المحلي والمزامنة الذكية (IndexedDB)</span>
        </div>
        <span className="bg-slate-950 border border-slate-800 px-2 py-0.5 rounded-full text-[10px] text-slate-300">
          في الانتظار: {pendingCount}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={handleCacheExample}
          className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 font-bold text-[11px] cursor-pointer"
        >
          فحص الكاش المحلي
        </button>

        <button
          type="button"
          onClick={handleAddRideToLocalQueue}
          className="p-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 font-bold text-[11px] cursor-pointer"
        >
          + حفظ في الطابور
        </button>

        <button
          type="button"
          onClick={handleBatchSyncNow}
          disabled={isSyncing || pendingCount === 0}
          className="p-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[11px] flex items-center justify-center gap-1 disabled:opacity-50 cursor-pointer"
        >
          <CloudUpload className={`w-3.5 h-3.5 ${isSyncing ? 'animate-bounce' : ''}`} />
          <span>مزامنة Batch</span>
        </button>
      </div>

      {cachedStatus && (
        <div className="text-[11px] text-emerald-400 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          <span>{cachedStatus}</span>
        </div>
      )}

      {syncResultMsg && (
        <div className="text-[11px] text-amber-300 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 flex items-center gap-1.5">
          <RefreshCw className="w-3.5 h-3.5 shrink-0" />
          <span>{syncResultMsg}</span>
        </div>
      )}
    </div>
  );
};
