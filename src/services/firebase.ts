import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence, Auth } from 'firebase/auth';
import {
  initializeFirestore,
  getFirestore,
  Firestore,
  doc,
  getDoc,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';
import firebaseConfigJson from '../../firebase-applet-config.json';

// Initialize or reuse Firebase App instance
export const app: FirebaseApp =
  getApps().length > 0 ? getApp() : initializeApp(firebaseConfigJson);

// Export Firebase Authentication instance configured with browser local persistence
export const auth: Auth = getAuth(app);
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.warn('Firebase auth persistence warning:', err);
});

// Export Cloud Firestore Database instance configured with resilient long-polling fallback and persistent cache
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
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    },
    targetDatabaseId
  );
} catch (e) {
  // If already initialized, fallback to existing instance
  firestoreDb = targetDatabaseId ? getFirestore(app, targetDatabaseId) : getFirestore(app);
}

export const db: Firestore = firestoreDb;

// Graceful connection test on startup (handles offline & reconnecting states smoothly without errors)
async function testConnection() {
  try {
    await getDoc(doc(db, 'system_config', 'pricing')).catch(() => {});
  } catch {
    // Offline mode active
  }
}
testConnection();

export default app;
