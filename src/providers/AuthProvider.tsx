import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { firebaseAuth } from '../lib/auth';
import { isFirebaseConfigured } from '../lib/firebase';
import { scheduleMealReminders, cancelMealReminders } from '../lib/notifications';
import { getUserProfile, UserProfile } from '../lib/users';

const PROFILE_CACHE_KEY = '@receta_bebesh/profile';

async function readCachedProfile(): Promise<UserProfile | null> {
  try {
    const raw = await AsyncStorage.getItem(PROFILE_CACHE_KEY);
    return raw ? (JSON.parse(raw) as UserProfile) : null;
  } catch { return null; }
}

async function writeCachedProfile(p: UserProfile | null): Promise<void> {
  try {
    if (p) await AsyncStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(p));
    else await AsyncStorage.removeItem(PROFILE_CACHE_KEY);
  } catch {}
}

type AuthContextValue = {
  user: User | null;
  userProfile: UserProfile | null;
  isLoading: boolean;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(isFirebaseConfigured);

  async function loadProfile(u: User) {
    // Show cached data immediately, then update from Firebase
    const cached = await readCachedProfile();
    if (cached?.uid === u.uid) setUserProfile(cached);

    try {
      const profile = await getUserProfile(u.uid);
      setUserProfile(profile);
      await writeCachedProfile(profile);
      void scheduleMealReminders(profile?.babyName || undefined);
    } catch {
      if (!cached) setUserProfile(null);
    }
  }

  async function refreshProfile() {
    if (user) await loadProfile(user);
  }

  useEffect(() => {
    if (!firebaseAuth) {
      setIsLoading(false);
      return;
    }
    const unsub = onAuthStateChanged(firebaseAuth, async (u) => {
      setUser(u);
      if (u) {
        await loadProfile(u);
      } else {
        setUserProfile(null);
        await writeCachedProfile(null);
        void cancelMealReminders();
      }
      setIsLoading(false);
    });
    return unsub;
  }, []);

  return (
    <AuthContext.Provider value={{ user, userProfile, isLoading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
