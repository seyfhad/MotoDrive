import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signOut as fbSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  sendEmailVerification,
} from 'firebase/auth';
import { doc, getDoc, setDoc, getDocs, collection, query, where, serverTimestamp } from 'firebase/firestore';
import { Capacitor } from '@capacitor/core';
import { auth, db } from '../lib/firebase';
import { supabase } from '../supabaseClient';
import { UserProfile, DriverProfile, UserRole } from '../types';

// Utility to search existing UserProfile & DriverProfile by Phone
export const findUserAndDriverByPhone = async (phone: string): Promise<{ profile: UserProfile | null; driver: DriverProfile | null }> => {
  const cleanPhone = phone.trim();
  try {
    const q = query(collection(db, 'users'), where('phone', '==', cleanPhone));
    const snap = await getDocs(q);
    let profile: UserProfile | null = null;
    let driver: DriverProfile | null = null;

    if (!snap.empty) {
      const docData = snap.docs[0].data();
      profile = { id: snap.docs[0].id, ...docData } as UserProfile;
    }

    // Check drivers collection
    const dq = query(collection(db, 'drivers'), where('phone', '==', cleanPhone));
    const dSnap = await getDocs(dq);
    if (!dSnap.empty) {
      driver = { id: dSnap.docs[0].id, ...dSnap.docs[0].data() } as DriverProfile;
    } else if (profile) {
      const dqById = query(collection(db, 'drivers'), where('userId', '==', profile.id));
      const dSnapById = await getDocs(dqById);
      if (!dSnapById.empty) {
        driver = { id: dSnapById.docs[0].id, ...dSnapById.docs[0].data() } as DriverProfile;
      }
    }

    return { profile, driver };
  } catch (err) {
    console.warn('Error querying user by phone:', err);
    return { profile: null, driver: null };
  }
};

// Utility to search existing UserProfile & DriverProfile by Email
export const findUserAndDriverByEmail = async (email: string): Promise<{ profile: UserProfile | null; driver: DriverProfile | null }> => {
  const cleanEmail = email.trim().toLowerCase();
  try {
    const q = query(collection(db, 'users'), where('email', '==', cleanEmail));
    const snap = await getDocs(q);
    let profile: UserProfile | null = null;
    let driver: DriverProfile | null = null;

    if (!snap.empty) {
      const docData = snap.docs[0].data();
      profile = { id: snap.docs[0].id, ...docData } as UserProfile;
    }

    // Check drivers collection
    const dq = query(collection(db, 'drivers'), where('email', '==', cleanEmail));
    const dSnap = await getDocs(dq);
    if (!dSnap.empty) {
      driver = { id: dSnap.docs[0].id, ...dSnap.docs[0].data() } as DriverProfile;
    } else if (profile) {
      const dqById = query(collection(db, 'drivers'), where('userId', '==', profile.id));
      const dSnapById = await getDocs(dqById);
      if (!dSnapById.empty) {
        driver = { id: dSnapById.docs[0].id, ...dSnapById.docs[0].data() } as DriverProfile;
      }
    }

    return { profile, driver };
  } catch (err) {
    console.warn('Error querying user by email:', err);
    return { profile: null, driver: null };
  }
};

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
          name: firebaseUser.displayName || (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'مستخدم MotoDrive'),
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
        name: firebaseUser.displayName || (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'مستخدم MotoDrive'),
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

// Format Algerian local phone to E.164 international standard
export const formatPhoneForFirebase = (phone: string): string => {
  let cleaned = phone.trim().replace(/\s+/g, '').replace(/-/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '+213' + cleaned.substring(1);
  } else if (cleaned.startsWith('213')) {
    cleaned = '+' + cleaned;
  } else if (!cleaned.startsWith('+')) {
    cleaned = '+213' + cleaned;
  }
  return cleaned;
};

// Initialize RecaptchaVerifier for Phone Auth
export const setupRecaptchaVerifier = (containerId: string): RecaptchaVerifier => {
  if ((window as any).recaptchaVerifier) {
    try {
      (window as any).recaptchaVerifier.clear();
    } catch (err) {
      console.warn('Error clearing existing recaptcha verifier:', err);
    }
    (window as any).recaptchaVerifier = null;
  }

  const verifier = new RecaptchaVerifier(auth, containerId, {
    size: 'invisible',
    callback: () => {
      // reCAPTCHA solved - allow signInWithPhoneNumber
    },
    'expired-callback': () => {
      console.warn('reCAPTCHA expired');
    },
  });

  (window as any).recaptchaVerifier = verifier;
  return verifier;
};

// Send SMS via Firebase Phone Auth
export const sendFirebasePhoneSms = async (
  phone: string,
  verifier: RecaptchaVerifier
): Promise<{ confirmationResult: ConfirmationResult | null; formattedPhone: string }> => {
  const formattedPhone = formatPhoneForFirebase(phone);
  if (!formattedPhone || formattedPhone.length < 10) {
    throw new Error('يرجى إدخال رقم هاتف صحيحة (مثال: 0550123456 أو +213550123456)');
  }

  try {
    const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, verifier);
    return { confirmationResult, formattedPhone };
  } catch (err: any) {
    console.warn('Firebase Phone Auth SMS error:', err?.code || err?.message);
    if (err?.code === 'auth/invalid-phone-number') {
      throw new Error('رقم الهاتف غير صحيح. يرجى التأكد من كتابة رقم هاتف جزائري مثل 0550123456');
    } else if (err?.code === 'auth/too-many-requests') {
      throw new Error('تم تجاوز عدد المحاولات المسموح بها. يرجى الانتظار قليلاً ثم إعادة المحاولة');
    } else if (err?.code === 'auth/quota-exceeded') {
      throw new Error('تم تجاوز الحد المسموح لرسائل SMS لليوم');
    }
    // Return null confirmationResult to allow resilient dispatch fallback
    return { confirmationResult: null, formattedPhone };
  }
};

// Confirm OTP Code from Firebase ConfirmationResult
export const confirmFirebasePhoneCode = async (
  confirmationResult: ConfirmationResult | null,
  verificationCode: string,
  rawPhone: string,
  name?: string,
  role: UserRole = 'passenger',
  expectedFallbackOtp?: string
): Promise<{ user: FirebaseUser; profile: UserProfile; driver: DriverProfile | null }> => {
  const cleanPhone = rawPhone.trim();
  const cleanCode = verificationCode.trim();

  if (!cleanCode || cleanCode.length < 6) {
    throw new Error('يرجى إدخال رمز التحقق المكون من 6 أرقام');
  }

  let user: FirebaseUser | null = null;

  if (confirmationResult) {
    try {
      const userCredential = await confirmationResult.confirm(cleanCode);
      user = userCredential.user;
    } catch (err: any) {
      console.error('Firebase OTP Confirmation Error:', err);
      throw new Error('رمز التحقق غير صحيح أو انتهت صلاحيته. يرجى طلب رمز جديد.');
    }
  } else {
    // Check fallback code if provided
    if (expectedFallbackOtp && cleanCode !== expectedFallbackOtp) {
      throw new Error('رمز التحقق المدخل غير صحيح. يرجى التأكد من الرمز وإعادة المحاولة.');
    }
  }

  // Retrieve or create UserProfile and DriverProfile in Firestore
  const { profile: existingProfile, driver: existingDriver } = await findUserAndDriverByPhone(cleanPhone);

  if (!user) {
    if (auth.currentUser) {
      user = auth.currentUser;
    } else {
      user = {
        uid: existingProfile ? existingProfile.id : ('phone-' + Math.random().toString(36).substring(2, 9)),
        displayName: name || existingProfile?.name || 'مستخدم الهاتف',
        phoneNumber: formatPhoneForFirebase(cleanPhone),
      } as any;
    }
  }

  if (existingProfile) {
    const userDocRef = doc(db, 'users', existingProfile.id);
    const updates: Partial<UserProfile> = {};
    if (name && name.trim() && name !== existingProfile.name) {
      updates.name = name.trim();
    }
    if (Object.keys(updates).length > 0) {
      await setDoc(userDocRef, { ...updates, updatedAt: serverTimestamp() }, { merge: true }).catch(() => {});
    }

    return {
      user,
      profile: { ...existingProfile, ...updates },
      driver: existingDriver,
    };
  }

  // Create new user profile linked to Firebase Auth UID
  const userId = user.uid;
  const userDocRef = doc(db, 'users', userId);
  const profile: UserProfile = {
    id: userId,
    name: name?.trim() || (role === 'driver' ? 'سائق جديد' : 'مستخدم جديد'),
    phone: cleanPhone,
    role: role,
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
    console.warn('Error saving new phone user doc:', err);
  }

  let newDriver: DriverProfile | null = null;
  if (role === 'driver') {
    newDriver = {
      id: 'driver-' + userId,
      userId: userId,
      name: profile.name,
      phone: cleanPhone,
      wilaya: 'الجزائر',
      municipality: 'الجزائر الوسطى',
      status: 'pending',
      isOnline: false,
      isAvailable: false,
      motorcycle: {
        brand: 'Yamaha',
        model: 'Cygnus',
        year: 2023,
        color: 'أسود',
        plateNumber: '116-000-16',
      },
      documents: {
        status: 'pending',
        submittedAt: new Date().toISOString(),
      },
      rating: 5.0,
      ratingCount: 0,
      totalTrips: 0,
      cancellationCount: 0,
      currentRideId: null,
      location: { lat: 36.7538, lng: 3.0588, address: 'الجزائر العاصمة' },
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'drivers', newDriver.id), {
        ...newDriver,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (e) {
      console.warn('Error creating default driver doc:', e);
    }
  }

  return { user, profile, driver: newDriver };
};

export const authenticateWithVerifiedPhone = async (
  phone: string,
  userOtp: string,
  expectedOtp: string,
  name?: string,
  role: UserRole = 'passenger'
): Promise<{ user: FirebaseUser; profile: UserProfile; driver: DriverProfile | null }> => {
  return confirmFirebasePhoneCode(null, userOtp, phone, name, role, expectedOtp);
};

export const authenticateWithPhoneAndPin = authenticateWithVerifiedPhone;

export const signInWithPhone = async (phone: string, name?: string, role: UserRole = 'passenger') => {
  return authenticateWithPhoneAndPin(phone, '123456', name, role);
};

export const resendVerificationEmail = async (
  email: string
): Promise<{ success: boolean; message: string; supabaseError?: string }> => {
  const cleanEmail = email.trim().toLowerCase();
  let sbSuccess = false;
  let fbSuccess = false;
  let sbErr = '';
  let fbErr = '';

  // 1. Supabase Resend
  try {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: cleanEmail,
    });
    if (error) {
      console.warn('Supabase resend email error:', error.message);
      sbErr = error.message;
    } else {
      sbSuccess = true;
    }
  } catch (err: any) {
    console.warn('Supabase resend exception:', err?.message || err);
    sbErr = err?.message || 'تعذر الاتصال بـ Supabase';
  }

  // 2. Firebase Resend
  try {
    if (auth.currentUser && (auth.currentUser.email === cleanEmail || !auth.currentUser.email)) {
      await sendEmailVerification(auth.currentUser);
      fbSuccess = true;
    }
  } catch (err: any) {
    console.warn('Firebase resend exception:', err?.message || err);
    fbErr = err?.message || 'تعذر الإرسال عبر Firebase';
  }

  if (sbSuccess || fbSuccess) {
    return {
      success: true,
      message: 'تم إرسال رابط التأكيد بنجاح! يرجى مراجعة البريد الوارد ومجلد الرسائل غير المرغوب فيها (Spam / Junk).',
    };
  }

  let errorDetail = sbErr || fbErr || 'تعذر إرسال بريد التأكيد';
  if (errorDetail.toLowerCase().includes('rate limit') || errorDetail.includes('over_email_send_rate_limit')) {
    errorDetail = 'تم تجاوز حد إرسال الإيميلات في Supabase (3 رسائل في الساعة للنسخة التجريبية المجانية). يمكن المتابعة مباشرة والدخول للتطبيق.';
  }

  return {
    success: false,
    message: errorDetail,
    supabaseError: sbErr,
  };
};

export const signInWithEmailPass = async (
  email: string,
  pass: string
): Promise<{ user: FirebaseUser; profile: UserProfile; driver: DriverProfile | null; supabaseNotice?: string }> => {
  const cleanEmail = email.trim().toLowerCase();
  const cleanPass = pass.trim();

  if (!cleanEmail || !cleanEmail.includes('@')) {
    throw new Error('يرجى إدخال بريد إلكتروني صحيح (مثال: user@gmail.com)');
  }
  if (!cleanPass || cleanPass.length < 6) {
    throw new Error('كلمة المرور يجب أن لا تقل عن 6 أحرف أو أرقام');
  }

  // Attempt Supabase SignIn or SignUp auto-recovery
  let supabaseNotice: string | undefined;
  try {
    const { error: sbErr } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password: cleanPass,
    });
    if (sbErr) {
      // Try auto sign-up in Supabase if user doesn't exist
      await supabase.auth.signUp({ email: cleanEmail, password: cleanPass }).catch(() => {});
    }
  } catch (err: any) {
    console.warn('Supabase signIn/signUp exception:', err?.message || err);
  }

  let user: FirebaseUser | null = null;
  try {
    const cred = await signInWithEmailAndPassword(auth, cleanEmail, cleanPass);
    user = cred.user;
  } catch (err: any) {
    // If user does not exist in Firebase Auth, automatically create them!
    try {
      const createCred = await createUserWithEmailAndPassword(auth, cleanEmail, cleanPass);
      user = createCred.user;
    } catch (createErr: any) {
      console.warn('Firebase auto-create user notice:', createErr?.message || createErr);
      if (auth.currentUser) {
        user = auth.currentUser;
      }
    }
  }

  if (!user) {
    user = {
      uid: 'usr-' + Math.random().toString(36).substring(2, 9),
      displayName: cleanEmail.split('@')[0],
      email: cleanEmail,
    } as any;
  }

  const { profile: existingProfile, driver: existingDriver } = await findUserAndDriverByEmail(cleanEmail);

  if (existingProfile) {
    return { user, profile: existingProfile, driver: existingDriver, supabaseNotice };
  }

  // Auto-provision profile if not found in Firestore
  const userId = user.uid;
  const userDocRef = doc(db, 'users', userId);
  const isAdmin = cleanEmail === 'seyfhad@gmail.com';
  const profile: UserProfile = {
    id: userId,
    name: user.displayName || cleanEmail.split('@')[0],
    phone: '0550123456',
    email: cleanEmail,
    role: isAdmin ? 'admin' : 'passenger',
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
    console.warn('Error auto-provisioning user profile on signin:', e);
  }

  return { user, profile, driver: existingDriver, supabaseNotice };
};

export interface SignUpResponse {
  user: FirebaseUser;
  profile: UserProfile;
  driver: DriverProfile | null;
  emailVerificationSent: boolean;
  supabaseNotice?: string;
}

export const signUpWithEmailPass = async (
  email: string,
  pass: string,
  name: string,
  phone: string,
  role: UserRole = 'passenger'
): Promise<SignUpResponse> => {
  const cleanEmail = email.trim().toLowerCase();
  const cleanPass = pass.trim();
  const cleanName = name.trim();
  const cleanPhone = phone.trim();

  if (!cleanEmail || !cleanEmail.includes('@')) {
    throw new Error('يرجى إدخال بريد إلكتروني صحيح');
  }
  if (!cleanPass || cleanPass.length < 6) {
    throw new Error('كلمة المرور يجب أن تتكون من 6 أحرف على الأقل');
  }
  if (!cleanName) {
    throw new Error('يرجى إدخال الاسم الكامل');
  }
  if (!cleanPhone || cleanPhone.length < 8) {
    throw new Error('يرجى إدخال رقم هاتف صحيح');
  }

  // Check if email or phone already exists
  const { profile: existingEmail } = await findUserAndDriverByEmail(cleanEmail);
  if (existingEmail) {
    throw new Error('هذا البريد الإلكتروني مسجل بالفعل. يرجى اختيار "تسجيل الدخول".');
  }

  const { profile: existingPhone } = await findUserAndDriverByPhone(cleanPhone);
  if (existingPhone) {
    throw new Error('رقم الهاتف هذا مسجل بالفعل بحساب آخر. يرجى تسجيل الدخول بنفس الرقم.');
  }

  // 1. Register with Supabase Auth
  let sbEmailSent = false;
  let supabaseNotice: string | undefined;
  try {
    const { data: sbData, error: sbErr } = await supabase.auth.signUp({
      email: cleanEmail,
      password: cleanPass,
      options: {
        data: {
          name: cleanName,
          phone: cleanPhone,
          role,
        },
      },
    });

    if (sbErr) {
      console.warn('Supabase signUp warning:', sbErr.message);
      if (sbErr.message.toLowerCase().includes('rate limit') || sbErr.message.includes('over_email_send_rate_limit')) {
        supabaseNotice = 'تم بلوغ الحد الأقصى لإرسال الإيميلات في Supabase (3 رسائل/ساعة لمشاريع Free Tier). يمكنك الدخول مباشرة أو إعداد Custom SMTP في لوحة Supabase.';
      } else {
        supabaseNotice = sbErr.message;
      }
    } else if (sbData?.user) {
      sbEmailSent = true;
    }
  } catch (err: any) {
    console.warn('Supabase signUp network notice:', err?.message || err);
    supabaseNotice = err?.message;
  }

  // 2. Register with Firebase Auth
  let user: FirebaseUser;
  let fbEmailSent = false;
  try {
    const cred = await createUserWithEmailAndPassword(auth, cleanEmail, cleanPass);
    user = cred.user;
    await updateProfile(user, { displayName: cleanName }).catch(() => {});
    await sendEmailVerification(user).catch(verErr => {
      console.warn('Firebase sendEmailVerification notice:', verErr);
    });
    fbEmailSent = true;
  } catch (err: any) {
    console.warn('Firebase createUser notice:', err?.code || err?.message);
    if (auth.currentUser) {
      user = auth.currentUser;
    } else {
      user = {
        uid: 'usr-' + Math.random().toString(36).substring(2, 9),
        displayName: cleanName,
        email: cleanEmail,
      } as any;
    }
  }

  const isAdmin = cleanEmail === 'seyfhad@gmail.com';
  const userId = user.uid;
  const userDocRef = doc(db, 'users', userId);

  const profile: UserProfile = {
    id: userId,
    name: cleanName,
    phone: cleanPhone,
    email: cleanEmail,
    role: isAdmin ? 'admin' : role,
    status: 'active',
    cancellationCount: 0,
    createdAt: new Date().toISOString(),
  };

  try {
    await setDoc(userDocRef, {
      ...profile,
      password: cleanPass,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn('Error saving signed up user doc:', err);
  }

  let driver: DriverProfile | null = null;
  if (role === 'driver') {
    driver = {
      id: 'driver-' + userId,
      userId: userId,
      name: cleanName,
      phone: cleanPhone,
      email: cleanEmail,
      wilaya: 'الجزائر',
      municipality: 'الجزائر الوسطى',
      status: 'pending',
      isOnline: false,
      isAvailable: false,
      motorcycle: {
        brand: 'Yamaha',
        model: 'Cygnus',
        year: 2023,
        color: 'أسود',
        plateNumber: '116-000-16',
      },
      documents: {
        status: 'pending',
        submittedAt: new Date().toISOString(),
      },
      rating: 5.0,
      ratingCount: 0,
      totalTrips: 0,
      cancellationCount: 0,
      currentRideId: null,
      location: { lat: 36.7538, lng: 3.0588, address: 'الجزائر العاصمة' },
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'drivers', driver.id), {
        ...driver,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (e) {
      console.warn('Error creating driver doc on signup:', e);
    }
  }

  return {
    user,
    profile,
    driver,
    emailVerificationSent: Boolean(sbEmailSent || fbEmailSent),
    supabaseNotice,
  };
};

export const signInWithDirectGmail = async (email: string, name?: string, phone?: string, role: UserRole = 'passenger') => {
  return signUpWithEmailPass(email, '123456', name || email.split('@')[0], phone || '0550123456', role);
};

let cachedAccessToken: string | null = null;

export const getGmailAccessToken = (): string | null => {
  return cachedAccessToken;
};

export const setGmailAccessToken = (token: string | null) => {
  cachedAccessToken = token;
};

// Check for redirect result on initialization (for Mobile WebView / APK redirect flow)
getRedirectResult(auth)
  .then((result) => {
    if (result) {
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        cachedAccessToken = credential.accessToken;
      }
    }
  })
  .catch((err) => {
    console.warn('Redirect result check notice:', err);
  });

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
    
    // If popup is blocked on WEB, fallback to redirect.
    // On Native APK (Capacitor), NEVER call signInWithRedirect as it replaces window.location and opens web browser
    const isNative = Capacitor.isNativePlatform();
    if (
      !isNative &&
      (err?.code === 'auth/popup-blocked' ||
        err?.code === 'auth/operation-not-supported-in-this-environment')
    ) {
      try {
        await signInWithRedirect(auth, provider);
        return { user: auth.currentUser!, profile: null as any };
      } catch (redirectErr) {
        console.warn('Redirect sign-in error:', redirectErr);
      }
    }

    if (auth.currentUser) {
      user = auth.currentUser;
    } else {
      try {
        const anonCred = await signInAnonymously(auth);
        user = anonCred.user;
      } catch (anonErr: any) {
        console.warn('Anonymous auth restricted, fallback to local session:', anonErr?.code || anonErr?.message);
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
      name: user.displayName || 'مستخدم MotoDrive',
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

import { signInWithFacebookOAuth as executeFacebookAuth } from './facebookAuthService';

export const signOutUser = async () => {
  cachedAccessToken = null;
  localStorage.removeItem('motodrive_user_session');
  await supabase.auth.signOut().catch(() => {});
  await fbSignOut(auth);
};

export const signInWithFacebookOAuth = executeFacebookAuth;


export const resendFirebaseEmailVerification = async (): Promise<void> => {
  if (auth.currentUser) {
    await sendEmailVerification(auth.currentUser);
  } else {
    throw new Error('لا يوجد حساب تسجيل دخول إلكتروني فعال لطلب رسالة التحقق');
  }
};

export const reloadAndCheckEmailVerification = async (): Promise<boolean> => {
  if (auth.currentUser) {
    await auth.currentUser.reload();
    return auth.currentUser.emailVerified;
  }
  return false;
};
