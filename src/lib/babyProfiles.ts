import AsyncStorage from '@react-native-async-storage/async-storage';

const PROFILES_KEY = '@baby_profiles';
const ACTIVE_KEY   = '@baby_profiles_active';

export type BabyProfile = {
  id: string;
  name: string;
  birthdate: string; // YYYY-MM-DD
  emoji?: string;
};

export async function getProfiles(): Promise<BabyProfile[]> {
  try {
    const json = await AsyncStorage.getItem(PROFILES_KEY);
    return json ? (JSON.parse(json) as BabyProfile[]) : [];
  } catch {
    return [];
  }
}

export async function saveProfiles(profiles: BabyProfile[]): Promise<void> {
  await AsyncStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
}

export async function addProfile(
  p: Omit<BabyProfile, 'id'>,
): Promise<BabyProfile> {
  const profiles = await getProfiles();
  const newProfile: BabyProfile = {
    ...p,
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`,
  };
  profiles.push(newProfile);
  await saveProfiles(profiles);
  return newProfile;
}

export async function updateProfile(updated: BabyProfile): Promise<void> {
  const profiles = await getProfiles();
  await saveProfiles(profiles.map((p) => (p.id === updated.id ? updated : p)));
}

export async function removeProfile(id: string): Promise<void> {
  const profiles = await getProfiles();
  await saveProfiles(profiles.filter((p) => p.id !== id));
  const activeId = await getActiveProfileId();
  if (activeId === id) await AsyncStorage.removeItem(ACTIVE_KEY);
}

export async function getActiveProfileId(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(ACTIVE_KEY);
  } catch {
    return null;
  }
}

export async function setActiveProfileId(id: string): Promise<void> {
  await AsyncStorage.setItem(ACTIVE_KEY, id);
}

export async function getActiveProfile(): Promise<BabyProfile | null> {
  const [profiles, activeId] = await Promise.all([getProfiles(), getActiveProfileId()]);
  if (!activeId) return profiles[0] ?? null;
  return profiles.find((p) => p.id === activeId) ?? profiles[0] ?? null;
}

export function ageMonthsFromBirthdate(birthdate: string): number {
  const birth = new Date(birthdate);
  const now = new Date();
  return (
    (now.getFullYear() - birth.getFullYear()) * 12 +
    (now.getMonth() - birth.getMonth())
  );
}
