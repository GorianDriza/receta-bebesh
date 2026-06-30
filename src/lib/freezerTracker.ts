import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@freezer_log_v1';

export type FreezerEntry = {
  id: string;
  foodName: string;
  emoji: string;
  dateCoooked: string; // YYYY-MM-DD
  totalPortions: number;
  portionsLeft: number;
  notes?: string;
};

async function load(): Promise<FreezerEntry[]> {
  try {
    const json = await AsyncStorage.getItem(KEY);
    return json ? (JSON.parse(json) as FreezerEntry[]) : [];
  } catch { return []; }
}

async function save(entries: FreezerEntry[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(entries));
}

export async function getFreezerLog(): Promise<FreezerEntry[]> {
  return load();
}

export async function addFreezerEntry(entry: Omit<FreezerEntry, 'id'>): Promise<void> {
  const entries = await load();
  entries.push({ ...entry, id: `${Date.now()}-${Math.random().toString(36).slice(2)}` });
  await save(entries);
}

export async function useOnePortion(id: string): Promise<void> {
  const entries = await load();
  const updated = entries.map((e) =>
    e.id === id ? { ...e, portionsLeft: Math.max(0, e.portionsLeft - 1) } : e,
  );
  await save(updated.filter((e) => e.portionsLeft > 0));
}

export async function removeFreezerEntry(id: string): Promise<void> {
  const entries = await load();
  await save(entries.filter((e) => e.id !== id));
}
