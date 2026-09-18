import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  signOut as fbSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { UserProfile, UserRole } from '../types';

export const subscribeToAuth = (
  callback: (user: FirebaseUser | null, profile: UserProfile | null) => void
) => {
  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (!firebaseUser) {
      callback(null, null);
      return;
    }

    try {
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const userSnap = await getDoc(userDocRef);

      if (userSnap.exists()) {
        callback(firebaseUser, userSnap.data() as UserProfile);
      } else {
        const initialProfile: UserProfile = {
          id: firebaseUser.uid,
          name: firebaseUser.displayName || 'مستخدم موطو ديزاد',
          phone: firebaseUser.phoneNumber || '0550123456',
          email: firebaseUser.email || undefined,
          role: 'passenger',
          status: 'active',
          cancellationCount: 0,
          createdAt: new Date().toISOString(),
        };

        await setDoc(userDocRef, {
          ...initialProfile,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        callback(firebaseUser, initialProfile);
      }
    } catch (err) {
      console.error('Error fetching user profile in auth subscriber:', err);
      callback(firebaseUser, null);
    }
  });
};

export const signInQuickGuest = async (name: string, phone: string, role: UserRole = 'passenger') => {
  const credential = await signInAnonymously(auth);
  const user = credential.user;

  await updateProfile(user, { displayName: name });

  const userDocRef = doc(db, 'users', user.uid);
  const profile: UserProfile = {
    id: user.uid,
    name,
    phone,
    role,
    status: 'active',
    cancellationCount: 0,
    createdAt: new Date().toISOString(),
  };

  await setDoc(userDocRef, {
    ...profile,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return { user, profile };
};

export const signInWithEmail = async (email: string, pass: string) => {
  const cred = await signInWithEmailAndPassword(auth, email, pass);
  return cred.user;
};

export const signUpWithEmail = async (email: string, pass: string, name: string, phone: string, role: UserRole = 'passenger') => {
  const cred = await createUserWithEmailAndPassword(auth, email, pass);
  const user = cred.user;

  await updateProfile(user, { displayName: name });

  const userDocRef = doc(db, 'users', user.uid);
  const profile: UserProfile = {
    id: user.uid,
    name,
    phone,
    email,
    role,
    status: 'active',
    cancellationCount: 0,
    createdAt: new Date().toISOString(),
  };

  await setDoc(userDocRef, {
    ...profile,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return { user, profile };
};

export const signOutUser = async () => {
  await fbSignOut(auth);
};
