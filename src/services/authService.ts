import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  signInWithPopup,
  GoogleAuthProvider,
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
          name: firebaseUser.displayName || 'مستخدم موتو درايف',
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

export const signInWithGoogle = async (role: UserRole = 'passenger') => {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const cred = await signInWithPopup(auth, provider);
  const user = cred.user;

  const userDocRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userDocRef);

  let profile: UserProfile;
  if (userSnap.exists()) {
    profile = userSnap.data() as UserProfile;
    // Update profile with Google details if missing
    const updates: Partial<UserProfile> = {};
    if (user.photoURL && !profile.photoUrl) updates.photoUrl = user.photoURL;
    if (user.displayName && (!profile.name || profile.name.includes('مستخدم'))) updates.name = user.displayName;
    if (user.email && !profile.email) updates.email = user.email;
    if (user.email === 'seyfhad@gmail.com') updates.role = 'admin';

    if (Object.keys(updates).length > 0) {
      await setDoc(userDocRef, { ...updates, updatedAt: serverTimestamp() }, { merge: true });
      profile = { ...profile, ...updates };
    }
  } else {
    profile = {
      id: user.uid,
      name: user.displayName || 'مستخدم موتو درايف',
      phone: user.phoneNumber || '0550123456',
      email: user.email || undefined,
      photoUrl: user.photoURL || undefined,
      role: user.email === 'seyfhad@gmail.com' ? 'admin' : role,
      status: 'active',
      cancellationCount: 0,
      createdAt: new Date().toISOString(),
    };
    await setDoc(userDocRef, {
      ...profile,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

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
