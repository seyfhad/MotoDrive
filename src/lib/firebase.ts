import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfigJson from '../../firebase-applet-config.json';

// Initialize Firebase SDK with applet configuration
const app = initializeApp(firebaseConfigJson);

export const auth = getAuth(app);
// Use customized database ID if specified in config
const configAny = firebaseConfigJson as any;
export const db = configAny.firestoreDatabaseId && configAny.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, configAny.firestoreDatabaseId)
  : getFirestore(app);
export const storage = getStorage(app);

// Test Firestore connection gracefully on boot
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'system_config', 'pricing')).catch(() => {});
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.info("Firebase client operating in offline mode.");
    }
  }
}
testConnection();

export default app;
