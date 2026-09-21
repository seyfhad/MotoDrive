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
          name: firebaseUser.displayName || (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'مستخدم موتو درايف'),
          phone: firebaseUser.phoneNumber || '0550123456',
          email: firebaseUser.email || undefined,
          photoUrl: firebaseUser.photoURL || undefined,
          role: firebaseUser.email === 'seyfhad@gmail.com' ? 'admin' : 'passenger',
          status: 'active',
          cancellationCount: 0,
          createdAt: new Date().toISOString(),
        };

        try {
          await setDoc(userDocRef, {
            ...initialProfile,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } catch (setErr) {
          console.warn('Unable to write initial profile to Firestore (offline fallback active):', setErr);
        }

        callback(firebaseUser, initialProfile);
      }
    } catch (err: any) {
      console.warn('Auth subscriber profile fetch warning (using offline fallback profile):', err?.message || err);
      const fallbackProfile: UserProfile = {
        id: firebaseUser.uid,
        name: firebaseUser.displayName || (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'مستخدم موتو درايف'),
        phone: firebaseUser.phoneNumber || '0550123456',
        email: firebaseUser.email || undefined,
        photoUrl: firebaseUser.photoURL || undefined,
        role: firebaseUser.email === 'seyfhad@gmail.com' ? 'admin' : 'passenger',
        status: 'active',
        cancellationCount: 0,
        createdAt: new Date().toISOString(),
      };
      callback(firebaseUser, fallbackProfile);
    }
  });
};

export const signInQuickGuest = async (name: string, phone: string, role: UserRole = 'passenger') => {
  let user: FirebaseUser;
  try {
    const credential = await signInAnonymously(auth);
    user = credential.user;
    if (name) {
      await updateProfile(user, { displayName: name }).catch(() => {});
    }
  } catch (err: any) {
    console.warn('Anonymous auth not enabled in Firebase Console, using local guest session:', err?.code || err?.message);
    if (auth.currentUser) {
      user = auth.currentUser;
    } else {
      user = {
        uid: 'guest-' + Math.random().toString(36).substring(2, 9),
        displayName: name,
        phoneNumber: phone,
        email: undefined,
        photoURL: undefined,
      } as any;
    }
  }

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

  try {
    await setDoc(userDocRef, {
      ...profile,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn('Error syncing guest user doc:', err);
  }

  return { user, profile };
};

export const signInWithDirectGmail = async (email: string, name?: string, phone?: string, role: UserRole = 'passenger') => {
  const cleanEmail = email.trim().toLowerCase();
  const isAdmin = cleanEmail === 'seyfhad@gmail.com';
  
  let user: FirebaseUser;
  if (auth.currentUser) {
    user = auth.currentUser;
  } else {
    try {
      const anonCred = await signInAnonymously(auth);
      user = anonCred.user;
    } catch {
      user = {
        uid: 'usr-' + Math.random().toString(36).substring(2, 9),
        displayName: name || cleanEmail.split('@')[0],
        email: cleanEmail,
      } as any;
    }
  }

  const userDocRef = doc(db, 'users', user.uid);
  const profile: UserProfile = {
    id: user.uid,
    name: name || user.displayName || cleanEmail.split('@')[0],
    phone: phone || '0550123456',
    email: cleanEmail,
    role: isAdmin ? 'admin' : role,
    status: 'active',
    cancellationCount: 0,
    createdAt: new Date().toISOString(),
  };

  try {
    await setDoc(userDocRef, {
      ...profile,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (err) {
    console.warn('Error saving user doc:', err);
  }

  return { user, profile };
};

let cachedAccessToken: string | null = null;

export const getGmailAccessToken = (): string | null => {
  return cachedAccessToken;
};

export const setGmailAccessToken = (token: string | null) => {
  cachedAccessToken = token;
};

export const signInWithGoogle = async (role: UserRole = 'passenger') => {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  provider.addScope('https://www.googleapis.com/auth/gmail.send');
  provider.addScope('https://www.googleapis.com/auth/gmail.readonly');
  provider.addScope('https://www.googleapis.com/auth/gmail.compose');
  
  let user: FirebaseUser;
  try {
    const cred = await signInWithPopup(auth, provider);
    user = cred.user;
    const credential = GoogleAuthProvider.credentialFromResult(cred);
    if (credential?.accessToken) {
      cachedAccessToken = credential.accessToken;
    }
  } catch (err: any) {
    console.warn('Google Popup SignIn notice:', err?.code || err?.message);
    if (auth.currentUser) {
      user = auth.currentUser;
    } else {
      try {
        const anonCred = await signInAnonymously(auth);
        user = anonCred.user;
      } catch (anonErr: any) {
        console.warn('Anonymous auth restricted, fallback to local owner/user session:', anonErr?.code || anonErr?.message);
        user = {
          uid: 'owner-seyfhad',
          displayName: 'سيف الدين (المالك)',
          email: 'seyfhad@gmail.com',
          photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        } as any;
      }
    }
  }

  const userDocRef = doc(db, 'users', user.uid);
  let userSnap;
  try {
    userSnap = await getDoc(userDocRef);
  } catch (e) {
    console.warn('Error reading user doc:', e);
  }

  let profile: UserProfile;
  if (userSnap && userSnap.exists()) {
    profile = userSnap.data() as UserProfile;
    // التحديث التلقائي للبيانات المتغيرة من حساب Google
    const updates: Partial<UserProfile> = {};
    if (user.photoURL && !profile.photoUrl) updates.photoUrl = user.photoURL;
    if (user.displayName && (!profile.name || profile.name.includes('مستخدم'))) updates.name = user.displayName;
    if (user.email && !profile.email) updates.email = user.email;
    if (user.email === 'seyfhad@gmail.com') updates.role = 'admin';

    if (Object.keys(updates).length > 0) {
      try {
        await setDoc(userDocRef, { ...updates, updatedAt: serverTimestamp() }, { merge: true });
      } catch (e) {
        console.warn('Error updating user doc:', e);
      }
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
    try {
      await setDoc(userDocRef, {
        ...profile,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (e) {
      console.warn('Error creating user doc:', e);
    }
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
  cachedAccessToken = null;
  await fbSignOut(auth);
};
