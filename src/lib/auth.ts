import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuth, initializeAuth, type Persistence } from 'firebase/auth';
import { AppLanguage, translations } from '../i18n/translations';
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
  const errors = translations[lang].auth.errors;
  const messages: Record<string, string> = {
    'auth/invalid-email': errors.invalidEmail,
    'auth/user-not-found': errors.userNotFound,
    'auth/wrong-password': errors.wrongPassword,
    'auth/invalid-credential': errors.invalidCredential,
    'auth/weak-password': errors.weakPassword,
    'auth/email-already-in-use': errors.emailAlreadyInUse,
    'auth/too-many-requests': errors.tooManyRequests,
    'auth/network-request-failed': errors.networkRequestFailed,
  };

  return messages[code] ?? errors.fallback;
}
