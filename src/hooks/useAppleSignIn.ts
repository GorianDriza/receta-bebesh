import { useState } from 'react';
import { Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { OAuthProvider, signInWithCredential } from 'firebase/auth';
import { firebaseAuth } from '../lib/auth';
import { createUserProfile, getUserProfile } from '../lib/users';

export function useAppleSignIn() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAvailable = Platform.OS === 'ios';

  async function signIn() {
    if (!firebaseAuth) {
      setError('Firebase not configured.');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const appleCredential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      const { identityToken } = appleCredential;
      if (!identityToken) {
        setError('Apple sign-in did not return a token.');
        return;
      }

      const provider = new OAuthProvider('apple.com');
      const credential = provider.credential({
        idToken: identityToken,
        rawNonce: undefined,
      });

      const result = await signInWithCredential(firebaseAuth, credential);
      const u = result.user;

      const existing = await getUserProfile(u.uid).catch(() => null);
      if (!existing) {
        const fullName = appleCredential.fullName;
        const displayName = fullName
          ? [fullName.givenName, fullName.familyName].filter(Boolean).join(' ')
          : u.displayName ?? '';

        await createUserProfile({
          uid: u.uid,
          displayName,
          email: u.email ?? appleCredential.email ?? '',
          babyName: '',
          babyBirthdate: '',
          language: 'sq-AL',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }).catch(() => {});
      }
    } catch (err: any) {
      if (err.code === 'ERR_REQUEST_CANCELED') {
        // User cancelled — not an error
      } else {
        setError('Apple sign-in failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  return {
    signIn,
    loading,
    isAvailable,
    error,
    clearError: () => setError(null),
  };
}
