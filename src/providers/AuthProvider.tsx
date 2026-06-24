import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { firebaseAuth } from '../lib/auth';
import { isFirebaseConfigured } from '../lib/firebase';
import { getUserProfile, UserProfile } from '../lib/users';

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
    try {
      const profile = await getUserProfile(u.uid);
      setUserProfile(profile);
    } catch {
      setUserProfile(null);
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
