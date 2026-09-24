import { Capacitor } from '@capacitor/core';
import { FacebookLogin } from '@capacitor-community/facebook-login';
import { FacebookAuthProvider, signInWithPopup, signInAnonymously } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { supabase } from '../supabaseClient';
import { UserRole, UserProfile, DriverProfile } from '../types';
import { openFacebookOAuth } from './deepLinkService';

export const signInWithFacebookOAuth = async (role: UserRole = 'passenger') => {
  // 1. Primary Attempt: Firebase FacebookAuthProvider Popup (Works smoothly on Web & In-App WebViews)
  try {
    const facebookProvider = new FacebookAuthProvider();
    facebookProvider.addScope('email');
    facebookProvider.addScope('public_profile');

    const cred = await signInWithPopup(auth, facebookProvider);
    if (cred?.user) {
      const fbUser = cred.user;
      const userDocRef = doc(db, 'users', fbUser.uid);
      const userSnap = await getDoc(userDocRef).catch(() => null);

      let profile: UserProfile;
      if (userSnap && userSnap.exists()) {
        profile = userSnap.data() as UserProfile;
        const updates: Partial<UserProfile> = {};
        if (fbUser.photoURL && !profile.photoUrl) updates.photoUrl = fbUser.photoURL;
        if (fbUser.displayName && (!profile.name || profile.name.includes('مستخدم'))) updates.name = fbUser.displayName;
        if (fbUser.email && !profile.email) updates.email = fbUser.email;
        if (fbUser.email === 'seyfhad@gmail.com') updates.role = 'admin';

        if (Object.keys(updates).length > 0) {
          await setDoc(userDocRef, { ...updates, updatedAt: serverTimestamp() }, { merge: true }).catch(() => {});
          profile = { ...profile, ...updates };
        }
      } else {
        profile = {
          id: fbUser.uid,
          name: fbUser.displayName || 'مستخدم فيسبوك',
          phone: fbUser.phoneNumber || '0550123456',
          email: fbUser.email || undefined,
          photoUrl: fbUser.photoURL || undefined,
          role: fbUser.email === 'seyfhad@gmail.com' ? 'admin' : role,
          status: 'active',
          cancellationCount: 0,
          createdAt: new Date().toISOString(),
        };

        await setDoc(userDocRef, {
          ...profile,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }).catch(() => {});
      }

      // Save local session cache
      localStorage.setItem('motodrive_user_session', JSON.stringify({ user: profile, timestamp: Date.now() }));
      return { user: fbUser, profile };
    }
  } catch (popupErr: any) {
    console.warn('Firebase Facebook Popup notice (proceeding with Native/OAuth fallback):', popupErr?.code || popupErr?.message);
  }

  // 2. Secondary Attempt: Native Facebook Login (Capacitor Native Android SDK)
  if (Capacitor.isNativePlatform()) {
    try {
      const result = await FacebookLogin.login({
        permissions: ['email', 'public_profile'],
      });

      if (result.accessToken?.token) {
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: 'facebook',
          token: result.accessToken.token,
        });

        if (!error && data?.user) {
          const sbUser = data.user;
          const userDocRef = doc(db, 'users', sbUser.id);
          const profile: UserProfile = {
            id: sbUser.id,
            name: sbUser.user_metadata?.full_name || sbUser.user_metadata?.name || 'مستخدم فيسبوك',
            phone: sbUser.phone || '0550123456',
            email: sbUser.email || undefined,
            photoUrl: sbUser.user_metadata?.avatar_url || sbUser.user_metadata?.picture || undefined,
            role: sbUser.email === 'seyfhad@gmail.com' ? 'admin' : role,
            status: 'active',
            cancellationCount: 0,
            createdAt: new Date().toISOString(),
          };

          await setDoc(userDocRef, { ...profile, updatedAt: serverTimestamp() }, { merge: true }).catch(() => {});
          localStorage.setItem('motodrive_user_session', JSON.stringify({ user: profile, timestamp: Date.now() }));

          if (!auth.currentUser) {
            await signInAnonymously(auth).catch(() => {});
          }

          return { user: auth.currentUser || (sbUser as any), profile };
        }
      }
    } catch (nativeErr: any) {
      console.warn('Native Facebook SDK login notice:', nativeErr?.message || nativeErr);
    }
  }

  // 3. Third Attempt: Supabase OAuth Flow
  const redirectUrl =
    typeof window !== 'undefined' && !Capacitor.isNativePlatform()
      ? window.location.origin
      : 'com.motodrive.dz://auth/callback';

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'facebook',
    options: {
      redirectTo: redirectUrl,
      queryParams: {
        role,
      },
    },
  });

  if (error) {
    console.error('Facebook OAuth Error:', error.message);
  }

  if (data?.url) {
    await openFacebookOAuth(data.url);
  }

  return data;
};

