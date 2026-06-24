import { get, ref, set, update } from 'firebase/database';
import { AppLanguage } from '../i18n/translations';
import { firebaseDatabase } from './firebase';

export type UserProfile = {
  uid: string;
  displayName: string;
  email: string;
  babyName: string;
  babyBirthdate: string; // YYYY-MM-DD
  language: AppLanguage;
  createdAt: string;
  updatedAt: string;
};

export type AgeStage = '4-6m' | '6-8m' | '9-12m' | '12m+';

export function computeAgeStage(birthdate: string): AgeStage {
  const birth = new Date(birthdate);
  if (isNaN(birth.getTime())) return '4-6m';
  const now = new Date();
  const months =
    (now.getFullYear() - birth.getFullYear()) * 12 +
    (now.getMonth() - birth.getMonth());
  if (months <= 6) return '4-6m';
  if (months <= 8) return '6-8m';
  if (months <= 12) return '9-12m';
  return '12m+';
}

export function formatBabyAge(birthdate: string, lang: AppLanguage): string {
  const birth = new Date(birthdate);
  if (isNaN(birth.getTime())) return '';
  const now = new Date();
  const months =
    (now.getFullYear() - birth.getFullYear()) * 12 +
    (now.getMonth() - birth.getMonth());
  if (months < 12) {
    return lang === 'sq-AL' ? `${months} muaj` : `${months} months`;
  }
  const years = Math.floor(months / 12);
  const rem = months % 12;
  if (rem === 0) {
    return lang === 'sq-AL' ? `${years} vjeç` : `${years} year${years > 1 ? 's' : ''}`;
  }
  return lang === 'sq-AL' ? `${years} vj ${rem} m` : `${years}y ${rem}m`;
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  if (!firebaseDatabase) return null;
  const snap = await get(ref(firebaseDatabase, `users/${uid}`));
  return snap.exists() ? (snap.val() as UserProfile) : null;
}

export async function createUserProfile(profile: UserProfile): Promise<void> {
  if (!firebaseDatabase) return;
  await set(ref(firebaseDatabase, `users/${profile.uid}`), profile);
}

export async function updateUserProfile(
  uid: string,
  updates: Partial<Omit<UserProfile, 'uid' | 'createdAt'>>,
): Promise<void> {
  if (!firebaseDatabase) return;
  await update(ref(firebaseDatabase, `users/${uid}`), {
    ...updates,
    updatedAt: new Date().toISOString(),
  });
}
