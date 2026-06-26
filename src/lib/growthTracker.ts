import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@growth_log';

export type GrowthEntry = {
  id: string;
  date: string;       // YYYY-MM-DD
  weightKg?: number;
  heightCm?: number;
  note?: string;
};

async function load(): Promise<GrowthEntry[]> {
  try {
    const json = await AsyncStorage.getItem(KEY);
    return json ? (JSON.parse(json) as GrowthEntry[]) : [];
  } catch {
    return [];
  }
}

export async function getGrowthLog(): Promise<GrowthEntry[]> {
  const entries = await load();
  return entries.sort((a, b) => a.date.localeCompare(b.date));
}

export async function addGrowthEntry(entry: Omit<GrowthEntry, 'id'>): Promise<void> {
  const entries = await load();
  entries.push({ ...entry, id: `${Date.now()}-${Math.random().toString(36).slice(2)}` });
  await AsyncStorage.setItem(KEY, JSON.stringify(entries));
}

export async function removeGrowthEntry(id: string): Promise<void> {
  const entries = await load();
  const filtered = entries.filter((e) => e.id !== id);
  await AsyncStorage.setItem(KEY, JSON.stringify(filtered));
}
