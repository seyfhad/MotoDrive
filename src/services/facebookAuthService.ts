import { Capacitor } from '@capacitor/core';
import { FacebookLogin } from '@capacitor-community/facebook-login';
import { FacebookAuthProvider, signInWithPopup, signInWithCredential, signInAnonymously } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { supabase } from '../supabaseClient';
import { UserRole, UserProfile } from '../types';
import { openFacebookOAuth } from './deepLinkService';

export const FACEBOOK_APP_ID = '1069098049280919';

export const signInWithFacebookOAuth = async (role: UserRole = 'passenger') => {
  // 1. Primary Attempt on Native Android: Direct In-App Facebook SDK
  if (Capacitor.isNativePlatform()) {
    try {
      console.log('Attempting native Facebook login via Capacitor plugin...');
      await FacebookLogin.initialize({ appId: FACEBOOK_APP_ID });

      const result = await FacebookLogin.login({
        permissions: ['email', 'public_profile'],
      });

      if (result.accessToken?.token) {
        const fbToken = result.accessToken.token;
        console.log('Native Facebook login succeeded, token obtained.');

        // Fetch user information via Facebook Graph API
        let graphData: { id?: string; name?: string; email?: string; picture?: { data?: { url?: string } } } = {};
        try {
          const res = await fetch(
            `https://graph.facebook.com/me?fields=id,name,email,picture.type(large)&access_token=${encodeURIComponent(fbToken)}`
          );
          if (res.ok) {
            graphData = await res.json();
          }
        } catch (fetchErr) {
          console.warn('Failed to fetch Facebook Graph API profile:', fetchErr);
        }

        // Try authenticating with Firebase using the Facebook Credential
        let fbAuthUser: any = null;
        try {
          const credential = FacebookAuthProvider.credential(fbToken);
          const cred = await signInWithCredential(auth, credential);
          fbAuthUser = cred.user;
        } catch (fbAuthErr: any) {
          console.warn('Firebase Facebook credential notice:', fbAuthErr?.code || fbAuthErr?.message);
          if (!auth.currentUser) {
            await signInAnonymously(auth).catch(() => {});
          }
        }

        const userId =
          fbAuthUser?.uid ||
          (graphData.id ? `fb_${graphData.id}` : (result.accessToken.userId ? `fb_${result.accessToken.userId}` : `fb_${Date.now()}`));
        const displayName = fbAuthUser?.displayName || graphData.name || 'مستخدم فيسبوك';
        const email = fbAuthUser?.email || graphData.email || undefined;
        const photoUrl = fbAuthUser?.photoURL || graphData.picture?.data?.url || undefined;

        // Save or update profile in Firestore
        const userDocRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userDocRef).catch(() => null);

        let profile: UserProfile;
        if (userSnap && userSnap.exists()) {
          profile = userSnap.data() as UserProfile;
          const updates: Partial<UserProfile> = {};
          if (photoUrl && !profile.photoUrl) updates.photoUrl = photoUrl;
          if (displayName && (!profile.name || profile.name.includes('مستخدم'))) updates.name = displayName;
          if (email && !profile.email) updates.email = email;
          if (email === 'seyfhad@gmail.com') updates.role = 'admin';

          if (Object.keys(updates).length > 0) {
            await setDoc(userDocRef, { ...updates, updatedAt: serverTimestamp() }, { merge: true }).catch(() => {});
            profile = { ...profile, ...updates };
          }
        } else {
          profile = {
            id: userId,
            name: displayName,
            phone: fbAuthUser?.phoneNumber || '0550123456',
            email: email,
            photoUrl: photoUrl,
            role: email === 'seyfhad@gmail.com' ? 'admin' : role,
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

        // Save persistent session in localStorage for immediate app boot
        localStorage.setItem('motodrive_user_session', JSON.stringify({ user: profile, timestamp: Date.now() }));
        window.dispatchEvent(new CustomEvent('motodrive_session_updated'));

        return { user: fbAuthUser || auth.currentUser, profile };
      }
    } catch (nativeErr: any) {
      console.warn('Native Facebook SDK login notice (proceeding with fallback):', nativeErr?.message || nativeErr);
    }
  }

  // 2. Primary Attempt on Web: Firebase FacebookAuthProvider Popup
  if (!Capacitor.isNativePlatform()) {
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
        window.dispatchEvent(new CustomEvent('motodrive_session_updated'));
        return { user: fbUser, profile };
      }
    } catch (popupErr: any) {
      console.warn('Firebase Facebook Popup notice (proceeding with OAuth fallback):', popupErr?.code || popupErr?.message);
    }
  }

  // 3. Fallback: Supabase OAuth Flow
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
    throw new Error(error.message);
  }

  if (data?.url) {
    await openFacebookOAuth(data.url);
  }

  return data;
};

