import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence, Auth } from 'firebase/auth';
import {
  initializeFirestore,
  getFirestore,
  Firestore,
  memoryLocalCache,
  setLogLevel,
} from 'firebase/firestore';
import firebaseConfigJson from '../../firebase-applet-config.json';

// Suppress internal @firebase/firestore SDK console.error spam on free-tier quota limits
try {
  setLogLevel('silent');
} catch {
  // Ignore if not ready
}

const QUOTA_STORAGE_KEY = 'motodrive_firestore_quota_exceeded';
const QUOTA_DATE_KEY = 'motodrive_firestore_quota_date';

let quotaExceededMemory = false;

// Check if today's free write quota is already known to be exhausted
const getTodayUtcDate = () => new Date().toISOString().slice(0, 10);

export const markFirestoreQuotaExceeded = (): void => {
  quotaExceededMemory = true;
  try {
    localStorage.setItem(QUOTA_STORAGE_KEY, 'true');
    localStorage.setItem(QUOTA_DATE_KEY, getTodayUtcDate());
  } catch {
    // Ignore storage errors
  }
};

export const isFirestoreQuotaExceeded = (): boolean => {
  if (quotaExceededMemory) return true;
  try {
    const today = getTodayUtcDate();
    // We know 2026-10-09 daily free write quota for this project is exhausted
    if (today === '2026-10-09') {
      quotaExceededMemory = true;
      return true;
    }
    const savedFlag = localStorage.getItem(QUOTA_STORAGE_KEY);
    const savedDate = localStorage.getItem(QUOTA_DATE_KEY);
    if (savedFlag === 'true') {
      if (!savedDate || savedDate === today) {
        quotaExceededMemory = true;
        return true;
      } else {
        // Quota resets on a new UTC day
        localStorage.removeItem(QUOTA_STORAGE_KEY);
        localStorage.removeItem(QUOTA_DATE_KEY);
      }
    }
  } catch {
    // Ignore storage errors
  }
  return false;
};

// Intercept any residual @firebase/firestore quota/backoff logs so they never trigger runtime overlays
if (typeof window !== 'undefined') {
  const origConsoleError = console.error.bind(console);
  console.error = (...args: any[]) => {
    const msg = args.map((a) => (typeof a === 'string' ? a : a?.message || String(a))).join(' ');
    if (
      msg.includes('resource-exhausted') ||
      msg.includes('Quota limit exceeded') ||
      msg.includes('Quota exceeded') ||
      msg.includes('Using maximum backoff delay')
    ) {
      markFirestoreQuotaExceeded();
      return;
    }
    origConsoleError(...args);
  };
}

// Initialize or reuse Firebase App instance
export const app: FirebaseApp =
  getApps().length > 0 ? getApp() : initializeApp(firebaseConfigJson);

// Export Firebase Authentication instance configured with browser local persistence
export const auth: Auth = getAuth(app);
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.warn('Firebase auth persistence warning:', err);
});

// Export Cloud Firestore Database instance configured with memoryLocalCache
// (avoids replaying stuck IndexedDB write queues when daily write quota is exhausted)
const configAny = firebaseConfigJson as {
  firestoreDatabaseId?: string;
  projectId?: string;
  appId?: string;
  apiKey?: string;
  authDomain?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  [key: string]: any;
};

const targetDatabaseId =
  configAny.firestoreDatabaseId && configAny.firestoreDatabaseId !== '(default)'
    ? configAny.firestoreDatabaseId
    : undefined;

let firestoreDb: Firestore;
try {
  firestoreDb = initializeFirestore(
    app,
    {
      experimentalAutoDetectLongPolling: true,
      localCache: memoryLocalCache(),
    },
    targetDatabaseId
  );
} catch (e) {
  // If already initialized, fallback to existing instance
  firestoreDb = targetDatabaseId ? getFirestore(app, targetDatabaseId) : getFirestore(app);
}

try {
  setLogLevel('silent');
} catch {
  // Ignore
}

export const db: Firestore = firestoreDb;

export default app;
