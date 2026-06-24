import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuth, initializeAuth, type Persistence } from 'firebase/auth';
import { AppLanguage } from '../i18n/translations';
import { firebaseApp } from './firebase';

// Firebase v12 removed getReactNativePersistence but still accepts a class
// that satisfies the internal Persistence interface. It calls `new cls()` so
// the argument must be a constructor, not a plain object.
class AsyncStoragePersistence {
  type: Persistence['type'] = 'LOCAL';
  _isAvailable(): Promise<boolean> { return Promise.resolve(true); }
  async _set(key: string, value: unknown): Promise<void> {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  }
  async _get(key: string): Promise<unknown> {
    try {
      const v = await AsyncStorage.getItem(key);
      return v != null ? (JSON.parse(v) as unknown) : null;
    } catch { return null; }
  }
  async _remove(key: string): Promise<void> { await AsyncStorage.removeItem(key); }
  _addListener(_key: string, _cb: (_v: unknown) => void): void {}
  _removeListener(_key: string, _cb: (_v: unknown) => void): void {}
}

export const firebaseAuth = (() => {
  if (!firebaseApp) return null;
  try {
    return initializeAuth(firebaseApp, {
      persistence: AsyncStoragePersistence as unknown as Persistence,
    });
  } catch {
    return getAuth(firebaseApp);
  }
})();

export function mapAuthError(code: string, lang: AppLanguage): string {
  const msgs: Record<string, Record<AppLanguage, string>> = {
    'auth/invalid-email':         { 'sq-AL': 'Email jo valid', en: 'Invalid email address' },
    'auth/user-not-found':        { 'sq-AL': 'Llogaria nuk ekziston', en: 'No account with this email' },
    'auth/wrong-password':        { 'sq-AL': 'Fjalëkalimi gabim', en: 'Wrong password' },
    'auth/invalid-credential':    { 'sq-AL': 'Email ose fjalëkalim gabim', en: 'Invalid email or password' },
    'auth/weak-password':         { 'sq-AL': 'Fjalëkalimi shumë i dobët (min 6 karaktere)', en: 'Password too weak (min 6 chars)' },
    'auth/email-already-in-use':  { 'sq-AL': 'Email tashmë i regjistruar', en: 'Email already in use' },
    'auth/too-many-requests':     { 'sq-AL': 'Shumë përpjekje, provoni më vonë', en: 'Too many attempts, try later' },
    'auth/network-request-failed':{ 'sq-AL': 'Gabim rrjeti, kontrolloni lidhjen', en: 'Network error, check connection' },
  };
  return msgs[code]?.[lang] ?? (lang === 'sq-AL' ? 'Ndodhi një gabim' : 'Something went wrong');
}
