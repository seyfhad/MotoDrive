import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { db as firestoreDb, isFirestoreQuotaExceeded } from '../lib/firebase';
import {
  doc,
  collection,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore';
import { Coordinates } from '../types';

/**
 * تعريف هيكل قاعدة البيانات المحلية داخل المساحة الداخلية للتطبيق (App-specific storage)
 * لا يحتاج إلى أي أذونات تخزين خارجية (READ/WRITE_EXTERNAL_STORAGE) في أندرويد.
 */
export interface CacheEntry<T = any> {
  key: string;
  data: T;
  timestamp: number;
  ttlMs: number;
}

export interface OfflineWriteOperation {
  id?: number;
  collectionName: string;
  action: 'set' | 'add' | 'update' | 'delete';
  docId?: string;
  payload: Record<string, any>;
  timestamp: number;
  retryCount: number;
}

interface MotoDriveLocalDB extends DBSchema {
  /**
   * أ) جدول التخزين المؤقت (Cache) لتقليل استهلاك عمليات القراءة (Reads) في Firebase Firestore
   */
  cache: {
    key: string;
    value: CacheEntry;
  };
  /**
   * ب) جدول قائمة الانتظار (Offline Queue) لحفظ طلبات وعمليات الكتابة (Writes) محلياً أولاً
   * لحماية الميزانية وعدم تجاوز الـ 20,000 عملية مجانية يومياً
   */
  offlineQueue: {
    key: number;
    value: OfflineWriteOperation;
    indexes: { 'by-timestamp': number };
  };
}

const DB_NAME = 'motodrive_local_engine_v1';
const DB_VERSION = 1;
const DEFAULT_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 ساعة افتراضياً

let dbInstancePromise: Promise<IDBPDatabase<MotoDriveLocalDB>> | null = null;

/**
 * تهيئة وفتح قاعدة البيانات المحلية IndexedDB عبر مكتبة idb
 */
export const initLocalDB = (): Promise<IDBPDatabase<MotoDriveLocalDB>> => {
  if (!dbInstancePromise) {
    dbInstancePromise = openDB<MotoDriveLocalDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // أ) إنشاء جدول الكاش (Cache)
        if (!db.objectStoreNames.contains('cache')) {
          db.createObjectStore('cache', { keyPath: 'key' });
        }
        // ب) إنشاء جدول قائمة الانتظار (Offline Queue)
        if (!db.objectStoreNames.contains('offlineQueue')) {
          const queueStore = db.createObjectStore('offlineQueue', {
            keyPath: 'id',
            autoIncrement: true,
          });
          queueStore.createIndex('by-timestamp', 'timestamp');
        }
      },
    });
  }
  return dbInstancePromise;
};

// ============================================================================
// 1. دوال حفظ وجلب البيانات من الكاش المحلي (Cache Store) لتقليل Firestore Reads
// ============================================================================

/**
 * حفظ أي بيانات في الكاش المحلي مع تحديد مدة الصلاحية (TTL)
 */
export const saveToLocalCache = async <T>(
  key: string,
  data: T,
  ttlMs: number = DEFAULT_CACHE_TTL_MS
): Promise<void> => {
  try {
    const db = await initLocalDB();
    await db.put('cache', {
      key,
      data,
      timestamp: Date.now(),
      ttlMs,
    });
  } catch (err) {
    console.warn('[dbService] خطأ أثناء حفظ البيانات في الكاش:', err);
  }
};

/**
 * جلب البيانات من الكاش المحلي إذا كانت صالحة (لم تنتهِ مدتها)
 */
export const getFromLocalCache = async <T>(key: string): Promise<T | null> => {
  try {
    const db = await initLocalDB();
    const record = await db.get('cache', key);
    if (!record) return null;

    const isExpired = Date.now() - record.timestamp > (record.ttlMs || DEFAULT_CACHE_TTL_MS);
    if (isExpired) {
      await db.delete('cache', key);
      return null;
    }
    return record.data as T;
  } catch (err) {
    console.warn('[dbService] خطأ أثناء قراءة البيانات من الكاش:', err);
    return null;
  }
};

// توافق مع الأسماء المختصرة
export const setCachedData = saveToLocalCache;
export const getCachedData = getFromLocalCache;

// ============================================================================
// 2. دالة إضافة عمليات الكتابة إلى قائمة الانتظار المحلية (Add to Offline Queue)
// ============================================================================

/**
 * تحفظ عملية الكتابة محلياً فوراً داخل IndexedDB دون استهلاك حصة Firestore مباشرة،
 * وتتيح إرسالها دفعة واحدة لاحقاً عبر writeBatch.
 */
export const addToOfflineQueue = async (
  collectionName: string,
  action: 'set' | 'add' | 'update' | 'delete',
  payload: Record<string, any>,
  docId?: string
): Promise<number | null> => {
  try {
    const db = await initLocalDB();
    const generatedDocId =
      docId || `${collectionName}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const id = await db.add('offlineQueue', {
      collectionName,
      action,
      docId: generatedDocId,
      payload,
      timestamp: Date.now(),
      retryCount: 0,
    });

    return id;
  } catch (err) {
    console.error('[dbService] تعذر الإضافة إلى قائمة الانتظار المحلية:', err);
    return null;
  }
};

/**
 * جلب عدد العمليات المنتظرة في الطابور المحلي
 */
export const getPendingQueueCount = async (): Promise<number> => {
  try {
    const db = await initLocalDB();
    return await db.count('offlineQueue');
  } catch {
    return 0;
  }
};

// ============================================================================
// 3. دالة ذكية لمزامنة قائمة الانتظار وإرسالها دفعة واحدة (Batch/Sync) إلى Firestore
// ============================================================================

let isSyncingNow = false;

/**
 * تجمع العمليات المخزنة في `offlineQueue` وترسلها دفعة واحدة (Firebase writeBatch - بحد أقصى 450 عملية للدفعة)
 * عند توفر اتصال الإنترنت وعدم تجاوز الكوتا اليومية، ثم تحذفها محلياً فور نجاح الإرسال.
 */
export const syncOfflineQueueToFirestore = async (): Promise<{
  syncedCount: number;
  remainingCount: number;
  errors: number;
}> => {
  if (isSyncingNow) {
    return { syncedCount: 0, remainingCount: await getPendingQueueCount(), errors: 0 };
  }

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { syncedCount: 0, remainingCount: await getPendingQueueCount(), errors: 0 };
  }

  if (isFirestoreQuotaExceeded()) {
    // حماية الميزانية والكوتا: تبقى العمليات محفوظة بأمان في IndexedDB حتى تتجدد الحصة
    return { syncedCount: 0, remainingCount: await getPendingQueueCount(), errors: 0 };
  }

  isSyncingNow = true;
  let syncedCount = 0;
  let errors = 0;

  try {
    const db = await initLocalDB();
    const allPending = await db.getAllFromIndex('offlineQueue', 'by-timestamp');

    if (allPending.length === 0) {
      isSyncingNow = false;
      return { syncedCount: 0, remainingCount: 0, errors: 0 };
    }

    // تقسيم العمليات إلى دفعات (Firestore writeBatch يدعم حتى 500 عملية في الدفعة الواحدة)
    const BATCH_LIMIT = 400;
    const batchItems = allPending.slice(0, BATCH_LIMIT);

    // دمج التحديثات المتكررة لنفس المستند (Deduplication) لتوفير عمليات الكتابة (Writes)
    const deduplicatedMap = new Map<string, OfflineWriteOperation>();
    const keysToDeleteAfterSync: number[] = [];

    for (const item of batchItems) {
      if (item.id !== undefined) {
        keysToDeleteAfterSync.push(item.id);
      }
      const uniqueTargetKey = `${item.collectionName}/${item.docId || item.id}`;
      const existing = deduplicatedMap.get(uniqueTargetKey);
      if (existing && item.action !== 'delete') {
        deduplicatedMap.set(uniqueTargetKey, {
          ...item,
          payload: { ...existing.payload, ...item.payload },
        });
      } else {
        deduplicatedMap.set(uniqueTargetKey, item);
      }
    }

    const batch = writeBatch(firestoreDb);

    for (const op of deduplicatedMap.values()) {
      const targetDocId =
        op.docId || `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const docRef = doc(collection(firestoreDb, op.collectionName), targetDocId);

      if (op.action === 'delete') {
        batch.delete(docRef);
      } else if (op.action === 'update') {
        batch.set(
          docRef,
          {
            ...op.payload,
            syncedAt: serverTimestamp(),
          },
          { merge: true }
        );
      } else {
        // 'set' أو 'add'
        batch.set(
          docRef,
          {
            ...op.payload,
            syncedAt: serverTimestamp(),
          },
          { merge: true }
        );
      }
    }

    // إرسال الدفعة كاملة إلى Firebase Firestore في طلب شبكة واحد
    await batch.commit();

    // حذف العمليات التي تمت مزامنتها بنجاح من IndexedDB
    const tx = db.transaction('offlineQueue', 'readwrite');
    for (const key of keysToDeleteAfterSync) {
      await tx.store.delete(key);
    }
    await tx.done;

    syncedCount = keysToDeleteAfterSync.length;
  } catch (err) {
    console.warn('[dbService] تنبيه أثناء مزامنة الدفعة مع Firestore (ستبقى البيانات محفوظة محلياً):', err);
    errors++;
  } finally {
    isSyncingNow = false;
  }

  const remainingCount = await getPendingQueueCount();
  return { syncedCount, remainingCount, errors };
};

// ============================================================================
// 4. حفظ العناوين المفضلة للراكب (المنزل / العمل / الجامعة) في الكاش المحلي
// ============================================================================

export interface SavedFavoritePlaces {
  home?: Coordinates | null;
  work?: Coordinates | null;
  custom?: { label: string; coords: Coordinates }[];
}

const FAVORITE_PLACES_KEY = 'passenger_saved_favorite_places_v1';

export const getSavedFavoritePlaces = async (userId: string): Promise<SavedFavoritePlaces> => {
  const key = `${FAVORITE_PLACES_KEY}_${userId || 'guest'}`;
  const cached = await getFromLocalCache<SavedFavoritePlaces>(key);
  if (cached) return cached;

  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw) as SavedFavoritePlaces;
      await saveToLocalCache(key, parsed, 365 * 24 * 60 * 60 * 1000);
      return parsed;
    }
  } catch {}

  return { home: null, work: null, custom: [] };
};

export const saveFavoritePlace = async (
  userId: string,
  type: 'home' | 'work',
  coords: Coordinates | null
): Promise<SavedFavoritePlaces> => {
  const key = `${FAVORITE_PLACES_KEY}_${userId || 'guest'}`;
  const current = await getSavedFavoritePlaces(userId);
  const updated: SavedFavoritePlaces = {
    ...current,
    [type]: coords,
  };

  try {
    localStorage.setItem(key, JSON.stringify(updated));
  } catch {}
  await saveToLocalCache(key, updated, 365 * 24 * 60 * 60 * 1000);
  return updated;
};

// التفعيل التلقائي للمزامنة عند عودة الإنترنت
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    syncOfflineQueueToFirestore().catch(() => {});
  });
}
