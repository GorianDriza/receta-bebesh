import { useEffect, useState } from 'react';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { firebaseAuth } from '../lib/auth';
import { createUserProfile, getUserProfile } from '../lib/users';

WebBrowser.maybeCompleteAuthSession();

export function useGoogleSignIn() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
  });

  useEffect(() => {
    if (response?.type !== 'success') return;

    const { authentication } = response;
    const idToken = authentication?.idToken ?? null;
    const accessToken = authentication?.accessToken ?? null;

    if (!idToken && !accessToken) {
      setError('Google sign-in did not return a token.');
      return;
    }
    if (!firebaseAuth) {
      setError('Firebase not configured.');
      return;
    }

    setLoading(true);
    setError(null);

    const credential = idToken
      ? GoogleAuthProvider.credential(idToken)
      : GoogleAuthProvider.credential(null, accessToken!);

    signInWithCredential(firebaseAuth, credential)
      .then(async (result) => {
        const u = result.user;
        const existing = await getUserProfile(u.uid).catch(() => null);
        if (!existing) {
          await createUserProfile({
            uid: u.uid,
            displayName: u.displayName ?? '',
            email: u.email ?? '',
            babyName: '',
            babyBirthdate: '',
            language: 'sq-AL',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }).catch(() => {});
        }
      })
      .catch(() => {
        setError('Google sign-in failed. Please try again.');
      })
      .finally(() => setLoading(false));
  }, [response]);

  return {
    promptAsync,
    loading: loading || !request,
    error,
    clearError: () => setError(null),
  };
}
