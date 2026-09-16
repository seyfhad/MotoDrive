import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase Web Configuration for moto24-ccc5b project
const firebaseConfig = {
  apiKey: "AIzaSyDXOuP2N_qYYtSlt-25qgT86miaHf2hRYg",
  authDomain: "moto24-ccc5b.firebaseapp.com",
  projectId: "moto24-ccc5b",
  storageBucket: "moto24-ccc5b.firebasestorage.app",
  messagingSenderId: "491913533758",
  appId: "1:491913533758:web:ccdcb1e950ba391795b46f"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Initialize Cloud Firestore
export const db = getFirestore(app);

export default app;
